'use client';

import { DataCard } from '@/components/shared/DataCard';
import type { PerpsProtocol } from '@/types/perps';

interface FundingRateGridProps {
  protocols: PerpsProtocol[];
}

const MARKETS = ['SOL-PERP', 'BTC-PERP', 'ETH-PERP'];

export function FundingRateGrid({ protocols }: FundingRateGridProps) {
  function getRate(protocol: PerpsProtocol, market: string): number | null {
    const fr = protocol.fundingRates.find((f) => f.market === market);
    return fr ? fr.rate : null;
  }

  function rateColor(rate: number): string {
    if (rate > 0) return 'text-terminal-red';
    if (rate < 0) return 'text-terminal-green';
    return 'text-terminal-text-dim';
  }

  function formatRate(rate: number | null): string {
    if (rate === null) return '-';
    const sign = rate > 0 ? '+' : '';
    return `${sign}${(rate * 100).toFixed(4)}%`;
  }

  return (
    <DataCard title="Funding Rates (sample data)">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-terminal-border">
              <th className="text-left py-2 px-3 text-xs uppercase tracking-widest text-terminal-text-dim">
                Market
              </th>
              {protocols.map((p) => (
                <th
                  key={p.slug}
                  className="text-right py-2 px-3 text-xs uppercase tracking-widest text-terminal-text-dim"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MARKETS.map((market) => (
              <tr key={market} className="border-b border-terminal-border/30">
                <td className="py-2 px-3 text-terminal-text font-medium">{market}</td>
                {protocols.map((p) => {
                  const rate = getRate(p, market);
                  return (
                    <td
                      key={p.slug}
                      className={`py-2 px-3 text-right ${rate !== null ? rateColor(rate) : 'text-terminal-text-dim'}`}
                    >
                      {formatRate(rate)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataCard>
  );
}
