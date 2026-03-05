import { NextResponse } from 'next/server';
import type { PerpsProtocol, Liquidation, FundingRate, PerpsOverview } from '@/types/perps';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // revalidate every 5 minutes

// Map: DeFiLlama module name → display name + protocol slug for /protocol/ endpoint
const SOLANA_PERPS: Record<string, { display: string; protocolSlug: string; markets: number }> = {
  'jupiter-perpetual': { display: 'Jupiter Perps', protocolSlug: 'jupiter-perpetual', markets: 12 },
  'drift-protocol-derivatives': { display: 'Drift', protocolSlug: 'drift', markets: 24 },
  'flash-trade': { display: 'Flash Trade', protocolSlug: 'flash-trade', markets: 8 },
  'flashtrade': { display: 'Flash Trade', protocolSlug: 'flash-trade', markets: 8 },
  'parcl': { display: 'Parcl', protocolSlug: 'parcl', markets: 6 },
  'zeta-markets': { display: 'Zeta Markets', protocolSlug: 'zeta-markets', markets: 15 },
  'adrena': { display: 'Adrena', protocolSlug: 'adrena', markets: 4 },
};

// Known DeFiLlama names → module (for matching overview responses)
const NAME_TO_MODULE: Record<string, string> = {
  'jupiter perpetual exchange': 'jupiter-perpetual',
  'jupiter perpetual': 'jupiter-perpetual',
  'drift trade': 'drift-protocol-derivatives',
  'drift': 'drift-protocol-derivatives',
  'flash trade': 'flash-trade',
  'flashtrade': 'flashtrade',
  'parcl v3': 'parcl',
  'parcl': 'parcl',
  'zeta markets': 'zeta-markets',
  'zeta': 'zeta-markets',
  'adrena protocol': 'adrena',
  'adrena': 'adrena',
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
  const protocols = ['Jupiter Perps', 'Drift', 'Flash Trade', 'Zeta Markets', 'Parcl'];
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

interface OverviewProtocol {
  name?: string;
  module?: string;
  total24h?: number;
  totalAllTime?: number;
  change_1d?: number;
  chains?: string[];
}

function matchModule(p: OverviewProtocol): string | null {
  // Try module field first
  if (p.module && SOLANA_PERPS[p.module]) return p.module;
  // Try name matching
  const name = (p.name ?? '').toLowerCase();
  if (NAME_TO_MODULE[name]) return NAME_TO_MODULE[name];
  return null;
}

async function fetchOverview(type: 'derivatives' | 'fees'): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  try {
    const res = await fetch(
      `https://api.llama.fi/overview/${type}?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return result;
    const data = await res.json();
    const protocols: OverviewProtocol[] = data.protocols ?? [];
    for (const p of protocols) {
      if (!p.chains?.includes('Solana')) continue;
      const mod = matchModule(p);
      if (mod) {
        result[mod] = p.total24h ?? 0;
      }
    }
  } catch { /* ignore */ }
  return result;
}

async function fetchProtocolTvl(slug: string): Promise<number> {
  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, { next: { revalidate: 600 } });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.currentChainTvls?.Solana ?? data.tvl ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    // Fetch fees, volume, and TVL in parallel
    const [feesMap, volumeMap, tvls] = await Promise.all([
      fetchOverview('fees'),
      fetchOverview('derivatives'),
      // Fetch TVL for unique protocol slugs
      (async () => {
        const uniqueSlugs = [...new Set(
          Object.values(SOLANA_PERPS).map(p => p.protocolSlug)
        )];
        const results = await Promise.all(
          uniqueSlugs.map(async (slug) => {
            const tvl = await fetchProtocolTvl(slug);
            return [slug, tvl] as const;
          })
        );
        return Object.fromEntries(results) as Record<string, number>;
      })(),
    ]);

    // Deduplicate modules (flashtrade and flash-trade map to same protocol)
    const seen = new Set<string>();
    const protocols: PerpsProtocol[] = [];

    for (const [mod, info] of Object.entries(SOLANA_PERPS)) {
      if (seen.has(info.protocolSlug)) continue;
      seen.add(info.protocolSlug);

      const tvl = tvls[info.protocolSlug] ?? 0;
      // Check both module variants for fees/volume
      // Check all module variants that map to this protocolSlug
      const altMods = Object.entries(SOLANA_PERPS)
        .filter(([, v]) => v.protocolSlug === info.protocolSlug)
        .map(([k]) => k);
      const fees24h = altMods.reduce((v, m) => v || feesMap[m], 0 as number) || 0;
      const volume24h = altMods.reduce((v, m) => v || volumeMap[m], 0 as number) || 0;

      // Use TVL * 2.5 as OI proxy when no direct OI data available
      const totalOI = tvl > 0 ? Math.round(tvl * 2.5) : 0;

      protocols.push({
        name: info.display,
        slug: info.protocolSlug,
        totalOI,
        volume24h,
        fees24h,
        tvl,
        markets: info.markets,
        fundingRates: generateSampleFundingRates(info.protocolSlug),
      });
    }

    // Sort by fees (most active first)
    protocols.sort((a, b) => b.fees24h - a.fees24h);

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
