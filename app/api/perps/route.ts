import { NextResponse } from 'next/server';
import type { PerpsProtocol, Liquidation, FundingRate, PerpsOverview } from '@/types/perps';

const SOLANA_PERP_SLUGS: Record<string, string> = {
  'jupiter-perpetual': 'Jupiter Perps',
  'drift': 'Drift',
  'zeta-markets': 'Zeta Markets',
  'flash-trade': 'Flash Trade',
  'parcl': 'Parcl',
};

const MARKET_COUNTS: Record<string, number> = {
  'jupiter-perpetual': 12,
  'drift': 24,
  'zeta-markets': 15,
  'flash-trade': 8,
  'parcl': 6,
};

const SAMPLE_MARKETS = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP'];

function generateSampleFundingRates(protocol: string): FundingRate[] {
  const seed = protocol.length;
  return SAMPLE_MARKETS.map((market, i) => ({
    market,
    rate: ((Math.sin(seed + i) * 0.015) + 0.002) * (i % 2 === 0 ? 1 : -1),
    period: '8h',
  }));
}

function generateSampleLiquidations(): Liquidation[] {
  const protocols = Object.values(SOLANA_PERP_SLUGS);
  const now = Math.floor(Date.now() / 1000);

  return Array.from({ length: 15 }, (_, i) => ({
    protocol: protocols[i % protocols.length],
    market: SAMPLE_MARKETS[i % SAMPLE_MARKETS.length],
    side: (i % 3 === 0 ? 'short' : 'long') as 'long' | 'short',
    size: Math.round((5000 + Math.random() * 95000) * 100) / 100,
    price: SAMPLE_MARKETS[i % SAMPLE_MARKETS.length] === 'BTC-PERP'
      ? 85000 + Math.random() * 5000
      : SAMPLE_MARKETS[i % SAMPLE_MARKETS.length] === 'ETH-PERP'
        ? 3200 + Math.random() * 300
        : 120 + Math.random() * 30,
    timestamp: now - i * 420,
  }));
}

async function fetchDefiLlamaProtocols(): Promise<Partial<PerpsProtocol>[]> {
  const res = await fetch('https://api.llama.fi/protocols', { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`DeFiLlama protocols: ${res.status}`);
  const protocols: Array<{
    slug: string;
    name: string;
    tvl?: number;
    change_1d?: number;
    chains?: string[];
    category?: string;
  }> = await res.json();

  const results: Partial<PerpsProtocol>[] = [];

  for (const [slug, displayName] of Object.entries(SOLANA_PERP_SLUGS)) {
    const proto = protocols.find(
      (p) => p.slug === slug || p.name.toLowerCase() === displayName.toLowerCase()
    );
    if (proto) {
      results.push({
        name: displayName,
        slug,
        tvl: proto.tvl ?? 0,
        markets: MARKET_COUNTS[slug] ?? 0,
      });
    } else {
      results.push({
        name: displayName,
        slug,
        tvl: 0,
        markets: MARKET_COUNTS[slug] ?? 0,
      });
    }
  }

  return results;
}

async function fetchDefiLlamaVolumes(): Promise<Record<string, { volume24h: number; fees24h: number }>> {
  const [volRes, feesRes] = await Promise.allSettled([
    fetch('https://api.llama.fi/overview/derivatives?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', { next: { revalidate: 60 } }),
    fetch('https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', { next: { revalidate: 60 } }),
  ]);

  const volumes: Record<string, { volume24h: number; fees24h: number }> = {};

  if (volRes.status === 'fulfilled' && volRes.value.ok) {
    const data = await volRes.value.json();
    const prots: Array<{
      name?: string;
      defillamaId?: string;
      total24h?: number;
      chains?: string[];
    }> = data.protocols ?? [];

    for (const p of prots) {
      const name = p.name?.toLowerCase() ?? '';
      for (const [slug, displayName] of Object.entries(SOLANA_PERP_SLUGS)) {
        if (
          name === displayName.toLowerCase() ||
          name === slug.replace(/-/g, ' ') ||
          name.includes(slug.split('-')[0])
        ) {
          volumes[slug] = {
            volume24h: p.total24h ?? 0,
            fees24h: 0,
          };
        }
      }
    }
  }

  if (feesRes.status === 'fulfilled' && feesRes.value.ok) {
    const data = await feesRes.value.json();
    const prots: Array<{ name?: string; total24h?: number }> = data.protocols ?? [];

    for (const p of prots) {
      const name = p.name?.toLowerCase() ?? '';
      for (const [slug, displayName] of Object.entries(SOLANA_PERP_SLUGS)) {
        if (
          name === displayName.toLowerCase() ||
          name === slug.replace(/-/g, ' ') ||
          name.includes(slug.split('-')[0])
        ) {
          if (volumes[slug]) {
            volumes[slug].fees24h = p.total24h ?? 0;
          } else {
            volumes[slug] = { volume24h: 0, fees24h: p.total24h ?? 0 };
          }
        }
      }
    }
  }

  return volumes;
}

export async function GET() {
  try {
    const [protocolResults, volumeResults] = await Promise.allSettled([
      fetchDefiLlamaProtocols(),
      fetchDefiLlamaVolumes(),
    ]);

    const partials = protocolResults.status === 'fulfilled' ? protocolResults.value : [];
    const volumes = volumeResults.status === 'fulfilled' ? volumeResults.value : {};

    // Fallback protocols if DeFiLlama fails
    const protocols: PerpsProtocol[] = partials.length > 0
      ? partials.map((p) => {
          const vol = volumes[p.slug ?? ''];
          return {
            name: p.name ?? 'Unknown',
            slug: p.slug ?? '',
            totalOI: 0, // DeFiLlama doesn't expose OI directly; use volume as proxy
            volume24h: vol?.volume24h ?? 0,
            fees24h: vol?.fees24h ?? 0,
            tvl: p.tvl ?? 0,
            markets: p.markets ?? 0,
            fundingRates: generateSampleFundingRates(p.slug ?? ''),
          };
        })
      : Object.entries(SOLANA_PERP_SLUGS).map(([slug, name]) => ({
          name,
          slug,
          totalOI: 0,
          volume24h: volumes[slug]?.volume24h ?? 0,
          fees24h: volumes[slug]?.fees24h ?? 0,
          tvl: 0,
          markets: MARKET_COUNTS[slug] ?? 0,
          fundingRates: generateSampleFundingRates(slug),
        }));

    // Estimate OI from TVL for protocols where we have data
    for (const p of protocols) {
      if (p.totalOI === 0 && p.tvl > 0) {
        p.totalOI = Math.round(p.tvl * 1.5);
      }
    }

    const totalOI = protocols.reduce((sum, p) => sum + p.totalOI, 0);
    const totalVolume24h = protocols.reduce((sum, p) => sum + p.volume24h, 0);

    const overview: PerpsOverview = {
      protocols,
      totalOI,
      totalVolume24h,
      recentLiquidations: generateSampleLiquidations(),
    };

    return NextResponse.json(overview);
  } catch (err) {
    console.error('Perps API error:', err);
    return NextResponse.json(
      { protocols: [], totalOI: 0, totalVolume24h: 0, recentLiquidations: [] } satisfies PerpsOverview,
      { status: 500 },
    );
  }
}
