'use client';

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import type { HolderData } from '@/types/token';

interface HolderDistributionProps {
  holders: HolderData[];
  totalSupply: number;
}

const COLORS = [
  'var(--accent)',
  'var(--blue)',
  'var(--purple)',
  'var(--text-dim)',
];

export function HolderDistribution({ holders }: HolderDistributionProps) {
  if (holders.length === 0) {
    return (
      <div className="text-sm text-terminal-text-dim font-mono text-center py-8">
        No holder data available
      </div>
    );
  }

  const top1 = holders[0]?.pctOfSupply ?? 0;
  const top2to5 = holders.slice(1, 5).reduce((s, h) => s + h.pctOfSupply, 0);
  const top6to10 = holders.slice(5, 10).reduce((s, h) => s + h.pctOfSupply, 0);
  const rest = Math.max(0, 100 - top1 - top2to5 - top6to10);

  const data = [
    { name: 'Top 1', value: Number(top1.toFixed(2)) },
    { name: 'Top 2-5', value: Number(top2to5.toFixed(2)) },
    { name: 'Top 6-10', value: Number(top6to10.toFixed(2)) },
    { name: 'Rest', value: Number(rest.toFixed(2)) },
  ].filter((d) => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          dataKey="value"
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
          }}
          formatter={(value: number) => `${value.toFixed(2)}%`}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-[11px] font-mono text-terminal-text-dim">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
