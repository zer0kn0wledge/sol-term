'use client';

import { DataCard } from '@/components/shared/DataCard';
import { formatUSD, formatNumber } from '@/lib/format';
import type { PerpsOverview } from '@/types/perps';

interface MarketOverviewProps {
  data: PerpsOverview;
}

export function MarketOverview({ data }: MarketOverviewProps) {
  const totalMarkets = data.protocols.reduce((sum, p) => sum + p.markets, 0);
  const totalTVL = data.protocols.reduce((sum, p) => sum + p.tvl, 0);

  const stats = [
    { label: 'Total Open Interest', value: formatUSD(data.totalOI) },
    { label: '24h Volume', value: formatUSD(data.totalVolume24h) },
    { label: 'Active Markets', value: formatNumber(totalMarkets) },
    { label: 'Total TVL', value: formatUSD(totalTVL) },
  ];

  return (
    <DataCard>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
              {stat.label}
            </div>
            <div className="text-lg font-mono font-semibold text-terminal-accent">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
