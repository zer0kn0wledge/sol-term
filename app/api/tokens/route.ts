import { NextRequest, NextResponse } from 'next/server';
import type { TokenProfile, RiskScore } from '@/types/token';

export const dynamic = 'force-dynamic';

const HELIUS_RPC = () =>
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

function computeRiskScore(asset: any): RiskScore {
  const factors: string[] = [];
  let score = 100;

  if (asset.authorities?.some((a: any) => a.scopes?.includes('mint') && a.address)) {
    factors.push('Mint authority enabled');
    score -= 25;
  }
  if (asset.authorities?.some((a: any) => a.scopes?.includes('freeze') && a.address)) {
    factors.push('Freeze authority enabled');
    score -= 20;
  }
  if (!asset.content?.metadata?.name) {
    factors.push('Missing metadata');
    score -= 10;
  }

  score = Math.max(0, score);
  const level =
    score >= 75 ? 'low' : score >= 50 ? 'medium' : score >= 25 ? 'high' : 'critical';
  return { score, level, factors };
}

async function searchTokens(search?: string): Promise<any[]> {
  const body: any = {
    jsonrpc: '2.0',
    id: 'token-search',
    method: 'searchAssets',
    params: {
      ownerAddress: undefined,
      tokenType: 'fungible',
      displayOptions: { showFungible: true },
      limit: 20,
      sortBy: { sortBy: 'recent_action', sortDirection: 'desc' },
    },
  };

  // If searching, we filter client-side after fetching
  // DAS searchAssets doesn't support name search directly for all tokens,
  // so we fetch a broader set and filter
  const res = await fetch(HELIUS_RPC(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  let items = data.result?.items ?? [];

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (item: any) =>
        item.content?.metadata?.name?.toLowerCase().includes(q) ||
        item.content?.metadata?.symbol?.toLowerCase().includes(q) ||
        item.id?.toLowerCase() === q
    );
  }

  return items;
}

async function enrichWithPrices(
  mints: string[]
): Promise<Record<string, { price: number }>> {
  if (mints.length === 0) return {};
  try {
    const ids = mints.join(',');
    const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
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

export async function GET(request: NextRequest) {
  try {
    const key = process.env.HELIUS_API_KEY;
    if (!key) {
      return NextResponse.json([], { status: 200 });
    }

    const search = request.nextUrl.searchParams.get('search') ?? undefined;
    const assets = await searchTokens(search);

    const mints = assets.map((a: any) => a.id);
    const prices = await enrichWithPrices(mints);

    const tokens: TokenProfile[] = assets.map((asset: any) => {
      const mint = asset.id;
      const meta = asset.content?.metadata ?? {};
      const supply = asset.token_info?.supply
        ? Number(asset.token_info.supply) /
          Math.pow(10, asset.token_info.decimals ?? 0)
        : 0;
      const price = prices[mint]?.price ?? 0;

      return {
        mint,
        name: meta.name ?? 'Unknown',
        symbol: meta.symbol ?? '???',
        decimals: asset.token_info?.decimals ?? 0,
        supply,
        holders: 0,
        price,
        marketCap: supply * price,
        image: asset.content?.links?.image ?? asset.content?.files?.[0]?.uri ?? '',
        deployer: asset.authorities?.[0]?.address ?? '',
        deployedAt: asset.created_at
          ? Math.floor(new Date(asset.created_at).getTime() / 1000)
          : 0,
        riskScore: computeRiskScore(asset),
        topHolders: [],
      };
    });

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
