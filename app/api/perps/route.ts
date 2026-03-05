import { NextResponse } from 'next/server';
import type { PerpsProtocol, Liquidation, FundingRate, PerpsOverview } from '@/types/perps';

const SOLANA_PERP_SLUGS: Record<string, string> = {
  'jupiter-perpetual': 'Jupiter Perps',
  'drift-protocol': 'Drift',
  'zeta-markets': 'Zeta Markets',
  'flash-trade': 'Flash Trade',
  'parcl': 'Parcl',
};

// Exact names used in DeFiLlama derivatives overview
const DEFILLAMA_NAMES: Record<string, string> = {
  'jupiter-perpetual': 'Jupiter Perpetual',
  'drift-protocol': 'Drift',
  'zeta-markets': 'Zeta Markets',
  'flash-trade': 'Flash Trade',
  'parcl': 'Parcl',
};

const MARKET_COUNTS: Record<string, number> = {
  'jupiter-perpetual': 12,
  'drift-protocol': 24,
  'zeta-markets': 15,
  'flash-trade': 8,
  'parcl': 6,
};

const SAMPLE_MARKETS = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP'];

function generateSampleFundingRates(protocol: string): FundingRate[] {
  const seed = protocol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SAMPLE_MARKETS.map((market, i) => ({
    market,
    rate: ((Math.sin(seed * 0.1 + i * 2.1) * 0.0001) + 0.00005),
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

async function fetchProtocolTvl(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.currentChainTvls?.Solana ?? data.tvl ?? 0;
  } catch {
    return 0;
  }
}

async function fetchDerivativesSummary(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://api.llama.fi/summary/derivatives/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return 0;
    const data = await res.json();
    // Try to extract OI from the response
    if (data.currentOI) return data.currentOI;
    if (data.totalDataChart?.length) {
      const latest = data.totalDataChart[data.totalDataChart.length - 1];
      if (latest?.openInterest) return latest.openInterest;
    }
    return 0;
  } catch {
    return 0;
  }
}

async function fetchDefiLlamaProtocols(): Promise<Partial<PerpsProtocol>[]> {
  const slugs = Object.keys(SOLANA_PERP_SLUGS);

  // Fetch TVL and OI for each protocol in parallel
  const [tvls, ois] = await Promise.all([
    Promise.all(slugs.map(slug => fetchProtocolTvl(slug))),
    Promise.all(slugs.map(slug => fetchDerivativesSummary(slug))),
  ]);

  return slugs.map((slug, i) => {
    const tvl = tvls[i];
    const oi = ois[i];
    return {
      name: SOLANA_PERP_SLUGS[slug],
      slug,
      tvl,
      totalOI: oi > 0 ? oi : (tvl > 0 ? Math.round(tvl * 2.5) : 0),
      markets: MARKET_COUNTS[slug] ?? 0,
    };
  });
}

async function fetchDefiLlamaVolumes(): Promise<Record<string, { volume24h: number; fees24h: number }>> {
  const [volRes, feesRes] = await Promise.allSettled([
    fetch('https://api.llama.fi/overview/derivatives?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', { next: { revalidate: 60 } }),
    fetch('https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true', { next: { revalidate: 60 } }),
  ]);

  // Build reverse lookup: lowercase DeFiLlama name -> slug
  const nameToSlug: Record<string, string> = {};
  for (const [slug, dlName] of Object.entries(DEFILLAMA_NAMES)) {
    nameToSlug[dlName.toLowerCase()] = slug;
  }

  const volumes: Record<string, { volume24h: number; fees24h: number }> = {};

  if (volRes.status === 'fulfilled' && volRes.value.ok) {
    const data = await volRes.value.json();
    const prots: Array<{
      name?: string;
      total24h?: number;
    }> = data.protocols ?? [];

    for (const p of prots) {
      const name = p.name?.toLowerCase() ?? '';
      const slug = nameToSlug[name];
      if (slug) {
        volumes[slug] = {
          volume24h: p.total24h ?? 0,
          fees24h: 0,
        };
      }
    }
  }

  if (feesRes.status === 'fulfilled' && feesRes.value.ok) {
    const data = await feesRes.value.json();
    const prots: Array<{ name?: string; total24h?: number }> = data.protocols ?? [];

    for (const p of prots) {
      const name = p.name?.toLowerCase() ?? '';
      const slug = nameToSlug[name];
      if (slug) {
        if (volumes[slug]) {
          volumes[slug].fees24h = p.total24h ?? 0;
        } else {
          volumes[slug] = { volume24h: 0, fees24h: p.total24h ?? 0 };
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

    const protocols: PerpsProtocol[] = partials.length > 0
      ? partials.map((p) => {
          const vol = volumes[p.slug ?? ''];
          return {
            name: p.name ?? 'Unknown',
            slug: p.slug ?? '',
            totalOI: p.totalOI ?? 0,
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
