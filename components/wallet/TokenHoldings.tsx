'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DataCard } from '@/components/shared/DataCard';
import { formatUSD, formatPct, formatNumber } from '@/lib/format';
import type { TokenHolding } from '@/types/wallet';

const CHART_COLORS = [
  'var(--accent)',
  'var(--blue)',
  'var(--purple)',
  'var(--yellow)',
  'var(--green)',
  'var(--red)',
];

type SortKey = 'usdValue' | 'balance' | 'pctOfPortfolio';

interface Props {
  holdings: TokenHolding[];
}

export function TokenHoldingsCard({ holdings }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('usdValue');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...holdings].sort((a, b) =>
      sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey],
    );
  }, [holdings, sortKey, sortAsc]);

  const pieData = useMemo(() => {
    const top5 = holdings.slice(0, 5);
    const otherValue = holdings.slice(5).reduce((s, h) => s + h.usdValue, 0);
    const data = top5.map((h) => ({ name: h.symbol, value: h.usdValue }));
    if (otherValue > 0) data.push({ name: 'Other', value: otherValue });
    return data;
  }, [holdings]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="text-right px-3 py-2 cursor-pointer hover:text-terminal-accent transition-colors"
      onClick={() => toggleSort(field)}
    >
      {label} {sortKey === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  if (holdings.length === 0) {
    return (
      <DataCard title="Token Holdings">
        <p className="text-terminal-text-dim text-sm font-mono">No token holdings found.</p>
      </DataCard>
    );
  }

  return (
    <DataCard title="Token Holdings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-terminal-text-dim border-b border-terminal-border">
                <th className="text-left px-3 py-2">Token</th>
                <SortHeader label="Balance" field="balance" />
                <SortHeader label="USD Value" field="usdValue" />
                <SortHeader label="% Portfolio" field="pctOfPortfolio" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((h) => (
                <tr key={h.mint} className="border-b border-terminal-border/50 hover:bg-terminal-surface-hover">
                  <td className="px-3 py-2 text-terminal-text">{h.symbol}</td>
                  <td className="px-3 py-2 text-right text-terminal-text">{formatNumber(h.balance)}</td>
                  <td className="px-3 py-2 text-right text-terminal-text">{formatUSD(h.usdValue)}</td>
                  <td className="px-3 py-2 text-right text-terminal-accent">{formatPct(h.pctOfPortfolio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="var(--border)"
                strokeWidth={1}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
                itemStyle={{ color: 'var(--text)' }}
                formatter={(value: number) => formatUSD(value)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DataCard>
  );
}
