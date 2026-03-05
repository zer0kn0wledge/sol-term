import { NextRequest, NextResponse } from 'next/server';
import type { TokenProfile, RiskScore, HolderData } from '@/types/token';

export const dynamic = 'force-dynamic';

const HELIUS_RPC = () =>
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

async function rpcCall(method: string, params: any) {
  const res = await fetch(HELIUS_RPC(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params }),
  });
  const data = await res.json();
  return data.result;
}

async function getAsset(mint: string) {
  return rpcCall('getAsset', { id: mint, displayOptions: { showFungible: true } });
}

async function getTokenHolders(mint: string): Promise<HolderData[]> {
  try {
    const result = await rpcCall('getTokenAccounts', {
      mint,
      limit: 20,
      options: { showZeroBalance: false },
    });

    const accounts = result?.token_accounts ?? [];
    const totalFromAccounts = accounts.reduce(
      (sum: number, a: any) => sum + Number(a.amount ?? 0),
      0
    );

    return accounts
      .slice(0, 10)
      .map((a: any) => ({
        address: a.owner ?? a.address ?? '',
        balance: Number(a.amount ?? 0),
        pctOfSupply:
          totalFromAccounts > 0
            ? (Number(a.amount ?? 0) / totalFromAccounts) * 100
            : 0,
      }))
      .filter((h: HolderData) => h.address);
  } catch {
    return [];
  }
}

async function getDeployerHistory(deployer: string): Promise<number> {
  if (!deployer) return 0;
  try {
    const result = await rpcCall('searchAssets', {
      authorityAddress: deployer,
      tokenType: 'fungible',
      limit: 50,
    });
    return result?.total ?? 0;
  } catch {
    return 0;
  }
}

async function getCreationSignature(mint: string): Promise<number> {
  try {
    const result = await rpcCall('getSignaturesForAsset', {
      id: mint,
      limit: 1,
      sortDirection: 'asc',
    });
    const sig = result?.items?.[0];
    if (!sig) return 0;

    // Get the transaction to find the block time
    const tx = await rpcCall('getTransaction', {
      signature: sig[0],
      maxSupportedTransactionVersion: 0,
    });
    return tx?.blockTime ?? 0;
  } catch {
    return 0;
  }
}

function computeRiskScore(
  asset: any,
  holders: HolderData[],
  deployerTokenCount: number
): RiskScore {
  const factors: string[] = [];
  let score = 100;

  // Mint authority
  if (asset.authorities?.some((a: any) => a.scopes?.includes('mint') && a.address)) {
    factors.push('Mint authority enabled');
    score -= 25;
  }

  // Freeze authority
  if (asset.authorities?.some((a: any) => a.scopes?.includes('freeze') && a.address)) {
    factors.push('Freeze authority enabled');
    score -= 20;
  }

  // Holder concentration
  if (holders.length > 0) {
    const topPct = holders[0]?.pctOfSupply ?? 0;
    if (topPct > 50) {
      factors.push(`Top holder owns ${topPct.toFixed(1)}% of supply`);
      score -= 30;
    } else if (topPct > 25) {
      factors.push(`Top holder owns ${topPct.toFixed(1)}% of supply`);
      score -= 15;
    }
  }

  // Deployer history
  if (deployerTokenCount > 10) {
    factors.push(`Deployer created ${deployerTokenCount} tokens`);
    score -= 15;
  }

  // Missing metadata
  if (!asset.content?.metadata?.name) {
    factors.push('Missing metadata');
    score -= 10;
  }

  score = Math.max(0, score);
  const level =
    score >= 75 ? 'low' : score >= 50 ? 'medium' : score >= 25 ? 'high' : 'critical';
  return { score, level, factors };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const key = process.env.HELIUS_API_KEY;
    if (!key) {
      return NextResponse.json({ error: 'API key not set' }, { status: 500 });
    }

    const { mint } = params;

    // Parallel fetches
    const [asset, holders, deployedAt] = await Promise.all([
      getAsset(mint),
      getTokenHolders(mint),
      getCreationSignature(mint),
    ]);

    if (!asset) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    const deployer = asset.authorities?.[0]?.address ?? '';
    const deployerTokenCount = await getDeployerHistory(deployer);

    // Jupiter price
    let price = 0;
    try {
      const priceRes = await fetch(`https://api.jup.ag/price/v2?ids=${mint}`);
      const priceData = await priceRes.json();
      price = Number(priceData.data?.[mint]?.price ?? 0);
    } catch {}

    const meta = asset.content?.metadata ?? {};
    const supply = asset.token_info?.supply
      ? Number(asset.token_info.supply) /
        Math.pow(10, asset.token_info.decimals ?? 0)
      : 0;

    const token: TokenProfile = {
      mint,
      name: meta.name ?? 'Unknown',
      symbol: meta.symbol ?? '???',
      decimals: asset.token_info?.decimals ?? 0,
      supply,
      holders: holders.length,
      price,
      marketCap: supply * price,
      image: asset.content?.links?.image ?? asset.content?.files?.[0]?.uri ?? '',
      deployer,
      deployedAt: deployedAt || (asset.created_at
        ? Math.floor(new Date(asset.created_at).getTime() / 1000)
        : 0),
      riskScore: computeRiskScore(asset, holders, deployerTokenCount),
      topHolders: holders,
    };

    return NextResponse.json(token);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}
