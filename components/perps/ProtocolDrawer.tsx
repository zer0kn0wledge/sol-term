'use client';

import { useEffect } from 'react';
import { formatUSD } from '@/lib/format';
import type { PerpsProtocol } from '@/types/perps';

interface ProtocolDrawerProps {
  protocol: PerpsProtocol | null;
  onClose: () => void;
}

export function ProtocolDrawer({ protocol, onClose }: ProtocolDrawerProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!protocol) return null;

  const metrics = [
    { label: 'TVL', value: formatUSD(protocol.tvl) },
    { label: 'Open Interest', value: formatUSD(protocol.totalOI) },
    { label: '24h Volume', value: formatUSD(protocol.volume24h) },
    { label: '24h Fees', value: formatUSD(protocol.fees24h) },
    { label: 'Markets', value: String(protocol.markets) },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-[400px] z-50 bg-terminal-bg border-l border-terminal-border overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-mono font-semibold text-terminal-accent">
              {protocol.name}
            </h2>
            <button
              onClick={onClose}
              className="text-terminal-text-dim hover:text-terminal-text text-lg font-mono transition-colors"
            >
              [x]
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {metrics.map((m) => (
              <div key={m.label} className="flex justify-between py-1.5 border-b border-terminal-border/30">
                <span className="text-sm font-mono text-terminal-text-dim">{m.label}</span>
                <span className="text-sm font-mono text-terminal-text font-medium">{m.value}</span>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim mb-3">
            Funding Rates (sample data)
          </h3>
          <div className="space-y-2">
            {protocol.fundingRates.map((fr) => (
              <div key={fr.market} className="flex justify-between py-1 text-sm font-mono">
                <span className="text-terminal-text">{fr.market}</span>
                <span
                  className={
                    fr.rate > 0
                      ? 'text-terminal-red'
                      : fr.rate < 0
                        ? 'text-terminal-green'
                        : 'text-terminal-text-dim'
                  }
                >
                  {fr.rate > 0 ? '+' : ''}
                  {(fr.rate * 100).toFixed(4)}% / {fr.period}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
