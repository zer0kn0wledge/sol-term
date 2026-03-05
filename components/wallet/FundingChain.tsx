'use client';

import { DataCard } from '@/components/shared/DataCard';
import { shortAddr } from '@/lib/format';
import type { FundingInfo } from '@/types/wallet';

interface Props {
  funding: FundingInfo | null;
  targetAddress: string;
}

function ChainNode({ address, label }: { address: string; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="px-3 py-2 bg-terminal-surface border border-terminal-border rounded-lg font-mono text-xs text-terminal-text">
        {label && (
          <div className="text-[10px] text-terminal-accent mb-1 uppercase">{label}</div>
        )}
        {shortAddr(address, 6)}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center px-2">
      <div className="w-8 h-px bg-terminal-border" />
      <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-t-transparent border-b-transparent border-l-terminal-accent" />
    </div>
  );
}

export function FundingChain({ funding, targetAddress }: Props) {
  if (!funding) {
    return (
      <DataCard title="Funding Source">
        <p className="text-terminal-text-dim text-sm font-mono">
          No funding source detected from recent transactions.
        </p>
      </DataCard>
    );
  }

  const chain = [funding.source, ...funding.intermediaries.slice(0, 3), targetAddress];

  return (
    <DataCard title="Funding Source">
      <div className="flex items-center overflow-x-auto py-2">
        {chain.map((addr, i) => (
          <div key={addr + i} className="flex items-center">
            <ChainNode
              address={addr}
              label={i === 0 ? 'Source' : i === chain.length - 1 ? 'Target' : `Hop ${i}`}
            />
            {i < chain.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </DataCard>
  );
}
