'use client';

import { useState, useMemo } from 'react';
import { DataCard } from '@/components/shared/DataCard';
import { formatUSD } from '@/lib/format';
import type { PerpsProtocol } from '@/types/perps';

type SortKey = 'name' | 'tvl' | 'totalOI' | 'volume24h' | 'fees24h' | 'markets';

interface ComparisonTableProps {
  protocols: PerpsProtocol[];
  onProtocolClick: (protocol: PerpsProtocol) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Protocol' },
  { key: 'tvl', label: 'TVL' },
  { key: 'totalOI', label: 'Open Interest' },
  { key: 'volume24h', label: '24h Volume' },
  { key: 'fees24h', label: '24h Fees' },
  { key: 'markets', label: 'Markets' },
];

export function ComparisonTable({ protocols, onProtocolClick }: ComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tvl');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...protocols].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [protocols, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function formatCell(key: SortKey, value: string | number) {
    if (key === 'name') return value;
    if (key === 'markets') return value;
    return formatUSD(value as number);
  }

  return (
    <DataCard title="Protocol Comparison">
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="border-b border-terminal-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left py-2 px-3 text-xs uppercase tracking-widest text-terminal-text-dim cursor-pointer hover:text-terminal-accent transition-colors select-none"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((protocol) => (
              <tr
                key={protocol.slug}
                onClick={() => onProtocolClick(protocol)}
                className="border-b border-terminal-border/30 cursor-pointer hover:bg-terminal-surface/50 transition-colors"
              >
                {COLUMNS.map((col) => (
                  <td key={col.key} className="py-2 px-3 text-terminal-text">
                    {col.key === 'name' ? (
                      <span className="text-terminal-accent font-medium">{protocol.name}</span>
                    ) : (
                      formatCell(col.key, protocol[col.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataCard>
  );
}
