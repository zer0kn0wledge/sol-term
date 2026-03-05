'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DataCard } from '@/components/shared/DataCard';
import { formatAge } from '@/lib/format';
import type { WalletTransaction } from '@/types/wallet';

interface Props {
  transactions: WalletTransaction[];
}

export function TransactionHistory({ transactions }: Props) {
  const dailyCounts = useMemo(() => {
    const now = Date.now() / 1000;
    const thirtyDaysAgo = now - 30 * 86400;
    const buckets = new Map<string, number>();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date((now - i * 86400) * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      buckets.set(key, 0);
    }

    for (const tx of transactions) {
      if (tx.timestamp < thirtyDaysAgo) continue;
      const d = new Date(tx.timestamp * 1000);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <DataCard title="Transaction History">
        <p className="text-terminal-text-dim text-sm font-mono">No transactions found.</p>
      </DataCard>
    );
  }

  return (
    <DataCard title="Transaction History">
      <div className="mb-4">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dailyCounts}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
              }}
              itemStyle={{ color: 'var(--text)' }}
              cursor={{ fill: 'var(--border)', opacity: 0.3 }}
            />
            <Bar dataKey="count" fill="var(--accent)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-terminal-text-dim border-b border-terminal-border">
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Description</th>
              <th className="text-right px-3 py-2">Fee (SOL)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 20).map((tx) => (
              <tr key={tx.signature} className="border-b border-terminal-border/50 hover:bg-terminal-surface-hover">
                <td className="px-3 py-2">
                  <span className="px-1.5 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent text-[10px]">
                    {tx.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-terminal-text-dim">{formatAge(tx.timestamp)}</td>
                <td className="px-3 py-2 text-terminal-text truncate max-w-[300px]">
                  {tx.description || 'No description'}
                </td>
                <td className="px-3 py-2 text-right text-terminal-text-dim">{tx.fee.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataCard>
  );
}
