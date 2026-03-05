'use client';

import useSWR from 'swr';
import { DataCard } from '@/components/shared/DataCard';
import { ChangeIndicator } from '@/components/shared/ChangeIndicator';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { formatUSD, formatNumber, formatPct } from '@/lib/format';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function OverviewPage() {
  const { data, isLoading } = useSWR('/api/overview', fetcher, {
    refreshInterval: 15000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim">
          Solana Network Overview
        </h1>
        <SkeletonLoader lines={12} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim">
        Solana Network Overview
      </h1>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DataCard>
          <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
            SOL Price
          </div>
          <div className="text-xl font-mono font-semibold text-terminal-text">
            {formatUSD(data.solPrice)}
          </div>
          <ChangeIndicator value={data.solChange24h} />
        </DataCard>

        <DataCard>
          <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
            Market Cap
          </div>
          <div className="text-xl font-mono font-semibold text-terminal-text">
            {formatUSD(data.solMarketCap)}
          </div>
        </DataCard>

        <DataCard>
          <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
            24h Volume
          </div>
          <div className="text-xl font-mono font-semibold text-terminal-text">
            {formatUSD(data.solVolume24h)}
          </div>
        </DataCard>

        <DataCard>
          <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
            DeFi TVL
          </div>
          <div className="text-xl font-mono font-semibold text-terminal-text">
            {formatUSD(data.defiTvl)}
          </div>
        </DataCard>
      </div>

      {/* Network Stats */}
      <DataCard title="Network Status">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
              TPS
            </div>
            <div className="text-lg font-mono font-semibold text-terminal-accent">
              {formatNumber(data.network.tps)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
              Slot
            </div>
            <div className="text-lg font-mono font-semibold text-terminal-text">
              {formatNumber(data.network.slot)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
              Epoch
            </div>
            <div className="text-lg font-mono font-semibold text-terminal-text">
              {data.network.epoch}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-1">
              Block Height
            </div>
            <div className="text-lg font-mono font-semibold text-terminal-text">
              {formatNumber(data.network.blockHeight)}
            </div>
          </div>
        </div>
      </DataCard>

      {/* Top Tokens */}
      <DataCard title="Top Solana Tokens">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-terminal-border">
                <th className="text-left py-2 px-3 text-[10px] uppercase tracking-widest text-terminal-text-dim">Token</th>
                <th className="text-right py-2 px-3 text-[10px] uppercase tracking-widest text-terminal-text-dim">Price</th>
              </tr>
            </thead>
            <tbody>
              {data.topTokens?.map((token: { mint: string; symbol: string; name: string; price: number; change24h: number }) => (
                <tr
                  key={token.mint}
                  className="border-b border-terminal-border/30 hover:bg-terminal-accent/5 transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="text-terminal-text font-medium">{token.symbol}</div>
                    <div className="text-[10px] text-terminal-text-dim">{token.name}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="text-terminal-text">
                      {token.price > 0.01 ? formatUSD(token.price) : `$${token.price.toFixed(8)}`}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/wallet', label: 'Wallet Profiler', desc: 'Analyze any Solana wallet' },
          { href: '/tokens', label: 'Token Intel', desc: 'Live token intelligence feed' },
          { href: '/perps', label: 'Perp Analytics', desc: 'OI, volume, funding rates' },
          { href: '/flow', label: 'Capital Flow', desc: 'DEX swap flow visualization' },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <DataCard className="hover:border-terminal-accent/40 transition-colors cursor-pointer h-full">
              <div className="text-sm font-mono text-terminal-accent font-medium mb-1">
                {item.label}
              </div>
              <div className="text-xs text-terminal-text-dim">{item.desc}</div>
            </DataCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
