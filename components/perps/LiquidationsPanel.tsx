'use client';

import { DataCard } from '@/components/shared/DataCard';
import { formatUSD, formatAge } from '@/lib/format';
import type { Liquidation } from '@/types/perps';

interface LiquidationsPanelProps {
  liquidations: Liquidation[];
}

export function LiquidationsPanel({ liquidations }: LiquidationsPanelProps) {
  const longTotal = liquidations
    .filter((l) => l.side === 'long')
    .reduce((sum, l) => sum + l.size, 0);
  const shortTotal = liquidations
    .filter((l) => l.side === 'short')
    .reduce((sum, l) => sum + l.size, 0);

  return (
    <DataCard title="Recent Liquidations (sample data)">
      <div className="flex gap-6 mb-4 text-sm font-mono">
        <div>
          <span className="text-terminal-text-dim">Longs: </span>
          <span className="text-terminal-red">{formatUSD(longTotal)}</span>
        </div>
        <div>
          <span className="text-terminal-text-dim">Shorts: </span>
          <span className="text-terminal-green">{formatUSD(shortTotal)}</span>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {liquidations.map((liq, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 px-2 rounded text-xs font-mono hover:bg-terminal-surface/50"
          >
            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                  liq.side === 'long'
                    ? 'bg-terminal-red/20 text-terminal-red'
                    : 'bg-terminal-green/20 text-terminal-green'
                }`}
              >
                {liq.side}
              </span>
              <span className="text-terminal-text">{liq.market}</span>
              <span className="text-terminal-text-dim">{liq.protocol}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-terminal-text">{formatUSD(liq.size)}</span>
              <span className="text-terminal-text-dim">{formatAge(liq.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}
