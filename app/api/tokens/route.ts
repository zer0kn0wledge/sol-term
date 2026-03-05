import { NextRequest, NextResponse } from 'next/server';
import type { TokenProfile, RiskScore } from '@/types/token';

export const dynamic = 'force-dynamic';

// Top Solana tokens by market activity
const TOP_TOKEN_MINTS = [
  'So11111111111111111111111111111111111111112',   // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',  // JTO
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // jitoSOL
  'RaijhBPdYrSCM5bKFQCxaL7EYT5J3bvwaZrRE3QcUyR',  // RAY
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',  // ORCA
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // W (Wormhole)
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',  // bSOL
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',   // RENDER
  'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6',  // TENSOR
  '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',  // W (alt)
  'SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y',   // SHDW
  'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',   // MNDE
];

async function fetchJupiterPrices(mints: string[]): Promise<Record<string, { price: number }>> {
  try {
    const ids = mints.join(',');
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}&showExtraInfo=true`);
    const data = await res.json();
    const result: Record<string, { price: number }> = {};
    for (const [mint, info] of Object.entries(data.data ?? {})) {
      result[mint] = { price: Number((info as any).price ?? 0) };
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchHeliusAssets(mints: string[]): Promise<Record<string, any>> {
  const key = process.env.HELIUS_API_KEY;
  if (!key) return {};

  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'batch-assets',
        method: 'getAssetBatch',
        params: {
          ids: mints,
          displayOptions: { showFungible: true },
        },
      }),
    });
    const data = await res.json();
    const assets: Record<string, any> = {};
    for (const item of data.result ?? []) {
      if (item?.id) assets[item.id] = item;
    }
    return assets;
  } catch {
    return {};
  }
}

function computeRiskScore(asset: any): RiskScore {
  const factors: string[] = [];
  let score = 100;

  if (asset?.authorities?.some((a: any) => a.scopes?.includes('mint') && a.address)) {
    factors.push('Mint authority enabled');
    score -= 25;
  }
  if (asset?.authorities?.some((a: any) => a.scopes?.includes('freeze') && a.address)) {
    factors.push('Freeze authority enabled');
    score -= 20;
  }
  if (!asset?.content?.metadata?.name) {
    factors.push('Missing metadata');
    score -= 10;
  }

  score = Math.max(0, score);
  const level =
    score >= 75 ? 'low' : score >= 50 ? 'medium' : score >= 25 ? 'high' : 'critical';
  return { score, level, factors };
}

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') ?? '';

    // Fetch prices and assets in parallel
    const [prices, assets] = await Promise.all([
      fetchJupiterPrices(TOP_TOKEN_MINTS),
      fetchHeliusAssets(TOP_TOKEN_MINTS),
    ]);

    let tokens: TokenProfile[] = TOP_TOKEN_MINTS
      .map((mint) => {
        const asset = assets[mint];
        const priceInfo = prices[mint];
        const meta = asset?.content?.metadata ?? {};
        const tokenInfo = asset?.token_info;
        const supply = tokenInfo?.supply
          ? Number(tokenInfo.supply) / Math.pow(10, tokenInfo.decimals ?? 0)
          : 0;
        const price = priceInfo?.price ?? tokenInfo?.price_info?.price_per_token ?? 0;

        return {
          mint,
          name: meta.name ?? mint.slice(0, 8),
          symbol: meta.symbol ?? tokenInfo?.symbol ?? '???',
          decimals: tokenInfo?.decimals ?? 0,
          supply,
          holders: 0,
          price,
          marketCap: supply * price,
          image: asset?.content?.links?.image ?? asset?.content?.files?.[0]?.uri ?? '',
          deployer: asset?.authorities?.[0]?.address ?? '',
          deployedAt: asset?.created_at
            ? Math.floor(new Date(asset.created_at).getTime() / 1000)
            : 0,
          riskScore: computeRiskScore(asset),
          topHolders: [],
        };
      })
      .filter((t) => t.price > 0);

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.symbol.toLowerCase().includes(q) ||
          t.mint.toLowerCase() === q
      );
    }

    // Sort by market cap descending
    tokens.sort((a, b) => b.marketCap - a.marketCap);

    return NextResponse.json(tokens);
  } catch (err) {
    console.error('Token API error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
