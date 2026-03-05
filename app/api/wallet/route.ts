import { NextRequest, NextResponse } from 'next/server';
import type {
  WalletProfile,
  TokenHolding,
  WalletTransaction,
  ProtocolInteraction,
  FundingInfo,
} from '@/types/wallet';
import { computeWalletScore } from '@/lib/scoring';
import { DEX_PROGRAMS } from '@/lib/constants';

const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const JUPITER_PRICE_URL = 'https://api.jup.ag/price/v2';

async function rpcCall(method: string, params: unknown[]) {
  const res = await fetch(HELIUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      `${JUPITER_PRICE_URL}?ids=So11111111111111111111111111111111111111112`,
    );
    const json = await res.json();
    return Number(json.data?.['So11111111111111111111111111111111111111112']?.price ?? 0);
  } catch {
    return 0;
  }
}

async function fetchBalance(address: string): Promise<number> {
  const result = await rpcCall('getBalance', [address]);
  return (result?.value ?? 0) / 1e9;
}

async function fetchAssets(address: string): Promise<TokenHolding[]> {
  const result = await rpcCall('getAssetsByOwner', [
    {
      ownerAddress: address,
      page: 1,
      limit: 100,
      displayOptions: { showFungible: true, showNativeBalance: false },
    },
  ]);

  const items = result?.items ?? [];
  const holdings: TokenHolding[] = [];

  for (const item of items) {
    if (item.interface !== 'FungibleToken' && item.interface !== 'FungibleAsset') continue;
    const info = item.token_info;
    if (!info) continue;

    const balance = (info.balance ?? 0) / Math.pow(10, info.decimals ?? 0);
    const pricePerToken = info.price_info?.price_per_token ?? 0;

    holdings.push({
      mint: item.id,
      symbol: info.symbol ?? 'Unknown',
      name: item.content?.metadata?.name ?? info.symbol ?? 'Unknown',
      balance,
      usdValue: balance * pricePerToken,
      pctOfPortfolio: 0,
    });
  }

  const totalUsd = holdings.reduce((s, h) => s + h.usdValue, 0);
  if (totalUsd > 0) {
    for (const h of holdings) {
      h.pctOfPortfolio = (h.usdValue / totalUsd) * 100;
    }
  }

  return holdings.sort((a, b) => b.usdValue - a.usdValue);
}

async function fetchTransactions(
  address: string,
): Promise<{ transactions: WalletTransaction[]; protocols: ProtocolInteraction[]; funding: FundingInfo | null }> {
  const sigs = await rpcCall('getSignaturesForAddress', [address, { limit: 50 }]);
  const signatures = (sigs ?? []).map((s: { signature: string }) => s.signature);

  if (signatures.length === 0) {
    return { transactions: [], protocols: [], funding: null };
  }

  let parsed: unknown[] = [];
  try {
    const res = await fetch(
      `https://api.helius.xyz/v0/transactions/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: signatures }),
      },
    );
    parsed = await res.json();
  } catch {
    // Fall back to raw signatures
  }

  const protocolMap = new Map<string, { count: number; lastUsed: number }>();
  const transactions: WalletTransaction[] = [];
  let funding: FundingInfo | null = null;

  for (const tx of parsed as Record<string, unknown>[]) {
    const type = (tx.type as string) ?? 'UNKNOWN';
    const timestamp = (tx.timestamp as number) ?? 0;
    const description = (tx.description as string) ?? '';
    const fee = (tx.fee as number) ?? 0;
    const sig = (tx.signature as string) ?? '';

    transactions.push({
      signature: sig,
      type,
      timestamp,
      description,
      fee: fee / 1e9,
    });

    // Track protocol interactions from program IDs
    const programIds = (tx.accountData as { account: string }[])?.map((a) => a.account) ?? [];
    for (const [progId, name] of Object.entries(DEX_PROGRAMS)) {
      if (programIds.includes(progId) || description.toLowerCase().includes(name.toLowerCase())) {
        const existing = protocolMap.get(name);
        if (existing) {
          existing.count++;
          existing.lastUsed = Math.max(existing.lastUsed, timestamp);
        } else {
          protocolMap.set(name, { count: 1, lastUsed: timestamp });
        }
      }
    }

    // Detect funding source from first TRANSFER to this address
    if (type === 'TRANSFER' && !funding) {
      const source = (tx.sourceWallet as string) ?? '';
      if (source && source !== address) {
        funding = { source, intermediaries: [] };
      }
    }
  }

  const protocols: ProtocolInteraction[] = Array.from(protocolMap.entries())
    .map(([protocol, data]) => ({ protocol, ...data }))
    .sort((a, b) => b.count - a.count);

  return { transactions, protocols, funding };
}

async function fetchIdentity(address: string) {
  try {
    const result = await rpcCall('getAsset', [{ id: address }]);
    if (result?.content?.metadata?.name) {
      return {
        name: result.content.metadata.name,
        avatar: result.content.links?.image ?? null,
      };
    }
  } catch {
    // Not an asset / no identity
  }
  return null;
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  // Validate base58 format (32-44 chars)
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 });
  }

  const [balanceResult, assetsResult, txResult, identityResult, solPriceResult] =
    await Promise.allSettled([
      fetchBalance(address),
      fetchAssets(address),
      fetchTransactions(address),
      fetchIdentity(address),
      fetchSolPrice(),
    ]);

  const solBalance = balanceResult.status === 'fulfilled' ? balanceResult.value : 0;
  const tokenHoldings = assetsResult.status === 'fulfilled' ? assetsResult.value : [];
  const txData =
    txResult.status === 'fulfilled'
      ? txResult.value
      : { transactions: [], protocols: [], funding: null };
  const identity = identityResult.status === 'fulfilled' ? identityResult.value : null;
  const solPrice = solPriceResult.status === 'fulfilled' ? solPriceResult.value : 0;

  const profile: WalletProfile = {
    address,
    identity,
    solBalance,
    tokenHoldings,
    transactions: txData.transactions,
    protocolInteractions: txData.protocols,
    fundingSource: txData.funding,
    score: 0,
  };

  // Adjust holdings percentages to include SOL value
  const solUsdValue = solBalance * solPrice;
  const totalPortfolioUsd = tokenHoldings.reduce((s, h) => s + h.usdValue, 0) + solUsdValue;
  if (totalPortfolioUsd > 0) {
    for (const h of profile.tokenHoldings) {
      h.pctOfPortfolio = (h.usdValue / totalPortfolioUsd) * 100;
    }
  }

  profile.score = computeWalletScore(profile);

  return NextResponse.json(profile);
}
