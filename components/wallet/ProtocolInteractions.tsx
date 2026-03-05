'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DataCard } from '@/components/shared/DataCard';
import type { ProtocolInteraction } from '@/types/wallet';

interface Props {
  protocols: ProtocolInteraction[];
}

export function ProtocolInteractionsCard({ protocols }: Props) {
  if (protocols.length === 0) {
    return (
      <DataCard title="Protocol Interactions">
        <p className="text-terminal-text-dim text-sm font-mono">No protocol interactions detected.</p>
      </DataCard>
    );
  }

  return (
    <DataCard title="Protocol Interactions">
      <ResponsiveContainer width="100%" height={Math.max(protocols.length * 40, 120)}>
        <BarChart data={protocols} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="protocol"
            tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            width={120}
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
          <Bar dataKey="count" fill="var(--blue)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </DataCard>
  );
}
