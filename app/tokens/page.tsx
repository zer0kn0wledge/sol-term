'use client';

import { useState } from 'react';
import { useTokenFeed } from '@/hooks/useTokenFeed';
import { TokenFeed } from '@/components/tokens/TokenFeed';
import { TokenDetailDrawer } from '@/components/tokens/TokenDetailDrawer';
import { DataCard } from '@/components/shared/DataCard';

export default function TokensPage() {
  const [search, setSearch] = useState('');
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useTokenFeed(
    search ? { search } : undefined
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-mono font-semibold text-terminal-text">
          Token Intelligence
        </h1>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, symbol, or mint address..."
          className="w-full bg-terminal-surface border border-terminal-border rounded-lg px-4 py-2.5 text-sm font-mono text-terminal-text placeholder:text-terminal-text-dim/50 focus:outline-none focus:border-terminal-accent/50 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-text-dim hover:text-terminal-text text-xs font-mono"
          >
            [clear]
          </button>
        )}
      </div>

      {/* Feed */}
      <DataCard>
        <TokenFeed
          tokens={data}
          isLoading={isLoading}
          error={error}
          onSelect={setSelectedMint}
          onRetry={() => mutate()}
        />
      </DataCard>

      {/* Detail Drawer */}
      {selectedMint && (
        <TokenDetailDrawer
          mint={selectedMint}
          onClose={() => setSelectedMint(null)}
        />
      )}
    </div>
  );
}
