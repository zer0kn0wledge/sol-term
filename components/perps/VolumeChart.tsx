'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

interface VolumeChartProps {
  protocols: PerpsProtocol[];
}

export function VolumeChart({ protocols }: VolumeChartProps) {
  const chartData = protocols.map((p) => ({
    name: p.name,
    slug: p.slug,
    volume: p.volume24h,
  }));

  return (
    <DataCard title="24h Volume">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
              angle={-20}
              textAnchor="end"
              height={50}
            />
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
            <Bar dataKey="volume" name="Volume" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.slug}
                  fill={PROTOCOL_COLORS[entry.slug] ?? 'var(--text-dim)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DataCard>
  );
}
