'use client';

import useSWR from 'swr';
import { formatNumber } from '@/lib/format';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NetworkStatus() {
  const { data } = useSWR('/api/network', fetcher, { refreshInterval: 10000 });

  return (
    <div className="flex items-center gap-4 text-xs font-mono text-terminal-text-dim">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
        <span>TPS: {data?.tps ? formatNumber(data.tps) : '---'}</span>
      </div>
      <span>Slot: {data?.slot ? formatNumber(data.slot) : '---'}</span>
      <span>Epoch: {data?.epoch ?? '---'}</span>
    </div>
  );
}
