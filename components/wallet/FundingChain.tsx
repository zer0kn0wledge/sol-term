'use client';

import { DataCard } from '@/components/shared/DataCard';
import { shortAddr, formatSOL } from '@/lib/format';
import type { FundingInfo } from '@/types/wallet';

interface Props {
  funding: FundingInfo | null;
  targetAddress: string;
}

function ChainNode({
  address,
  label,
  sublabel,
}: {
  address: string;
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="px-3 py-2 bg-terminal-surface border border-terminal-border rounded-lg font-mono text-xs text-terminal-text">
        {label && (
          <div className="text-[10px] text-terminal-accent mb-1 uppercase">{label}</div>
        )}
        {shortAddr(address, 6)}
        {sublabel && (
          <div className="text-[10px] text-terminal-text-dim mt-0.5">{sublabel}</div>
        )}
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

  const sourceLabel = funding.sourceName ?? 'Source';
  const sourceSublabel = [
    funding.sourceType ? funding.sourceType : null,
    funding.amount > 0 ? formatSOL(funding.amount) : null,
  ]
    .filter(Boolean)
    .join(' / ');

  const chain = [funding.source, ...funding.intermediaries.slice(0, 3), targetAddress];

  return (
    <DataCard title="Funding Source">
      <div className="flex items-center overflow-x-auto py-2">
        {chain.map((addr, i) => (
          <div key={addr + i} className="flex items-center">
            <ChainNode
              address={addr}
              label={
                i === 0 ? sourceLabel : i === chain.length - 1 ? 'Target' : `Hop ${i}`
              }
              sublabel={i === 0 ? sourceSublabel : undefined}
            />
            {i < chain.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </DataCard>
  );
}
