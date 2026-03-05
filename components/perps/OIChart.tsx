'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DataCard } from '@/components/shared/DataCard';
import { formatUSD } from '@/lib/format';
import type { PerpsProtocol } from '@/types/perps';

const PROTOCOL_COLORS: Record<string, string> = {
  'jupiter-perpetual': 'var(--accent)',
  'drift': 'var(--blue)',
  'zeta-markets': 'var(--purple)',
  'flash-trade': 'var(--yellow)',
  'parcl': 'var(--green)',
};

interface OIChartProps {
  protocols: PerpsProtocol[];
}

export function OIChart({ protocols }: OIChartProps) {
  // Build chart data from current snapshot (single-point with protocol breakdown)
  const chartData = [
    {
      name: 'Current',
      ...Object.fromEntries(protocols.map((p) => [p.slug, p.totalOI])),
    },
  ];

  return (
    <DataCard title="Open Interest">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
            <YAxis
              tick={{ fill: 'var(--text-dim)', fontSize: 11 }}
              tickFormatter={(v: number) => formatUSD(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
              formatter={(value: number) => formatUSD(value)}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }}
            />
            {protocols.map((p) => (
              <Area
                key={p.slug}
                type="monotone"
                dataKey={p.slug}
                name={p.name}
                stackId="oi"
                fill={PROTOCOL_COLORS[p.slug] ?? 'var(--text-dim)'}
                stroke={PROTOCOL_COLORS[p.slug] ?? 'var(--text-dim)'}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </DataCard>
  );
}
