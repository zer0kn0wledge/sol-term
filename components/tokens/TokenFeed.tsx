'use client';

import { useState, useMemo } from 'react';
import type { TokenProfile } from '@/types/token';
import { formatUSD, formatNumber, formatAge } from '@/lib/format';
import { TokenRiskBadge } from './TokenRiskBadge';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ErrorState } from '@/components/shared/ErrorState';

type SortKey = 'name' | 'price' | 'marketCap' | 'holders' | 'risk' | 'age';
type SortDir = 'asc' | 'desc';

interface TokenFeedProps {
  tokens: TokenProfile[] | undefined;
  isLoading: boolean;
  error: any;
  onSelect: (mint: string) => void;
  onRetry?: () => void;
}

const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'name', label: 'Token', className: 'text-left flex-1 min-w-0' },
  { key: 'price', label: 'Price', className: 'text-right w-28' },
  { key: 'marketCap', label: 'Mkt Cap', className: 'text-right w-28' },
  { key: 'holders', label: 'Holders', className: 'text-right w-20' },
  { key: 'risk', label: 'Risk', className: 'text-center w-20' },
  { key: 'age', label: 'Age', className: 'text-right w-20' },
];

function sortTokens(tokens: TokenProfile[], key: SortKey, dir: SortDir): TokenProfile[] {
  return [...tokens].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'price':
        cmp = a.price - b.price;
        break;
      case 'marketCap':
        cmp = a.marketCap - b.marketCap;
        break;
      case 'holders':
        cmp = a.holders - b.holders;
        break;
      case 'risk':
        cmp = a.riskScore.score - b.riskScore.score;
        break;
      case 'age':
        cmp = a.deployedAt - b.deployedAt;
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function TokenFeed({ tokens, isLoading, error, onSelect, onRetry }: TokenFeedProps) {
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    if (!tokens) return [];
    return sortTokens(tokens, sortKey, sortDir);
  }, [tokens, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (error) {
    return <ErrorState message="Failed to load token feed" onRetry={onRetry} />;
  }

  if (isLoading) {
    return <SkeletonLoader lines={8} />;
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-12 text-sm font-mono text-terminal-text-dim">
        No tokens found
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-terminal-border text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim">
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`${col.className} hover:text-terminal-accent transition-colors cursor-pointer`}
          >
            {col.label}
            {sortKey === col.key && (
              <span className="ml-1">{sortDir === 'asc' ? '^' : 'v'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((token) => (
        <button
          key={token.mint}
          onClick={() => onSelect(token.mint)}
          className="w-full flex items-center gap-4 px-4 py-2.5 border-b border-terminal-border/30 hover:bg-terminal-accent/5 transition-colors text-left"
        >
          {/* Token */}
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {token.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="w-6 h-6 rounded-full bg-terminal-border shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-terminal-border flex items-center justify-center text-[9px] font-mono text-terminal-text-dim shrink-0">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-mono text-terminal-text truncate">
                {token.name}
              </div>
              <div className="text-[10px] font-mono text-terminal-text-dim">
                {token.symbol}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-right w-28 font-mono text-sm text-terminal-text">
            {token.price > 0 ? formatUSD(token.price) : '--'}
          </div>

          {/* Market Cap */}
          <div className="text-right w-28 font-mono text-sm text-terminal-text-dim">
            {token.marketCap > 0 ? formatUSD(token.marketCap) : '--'}
          </div>

          {/* Holders */}
          <div className="text-right w-20 font-mono text-sm text-terminal-text-dim">
            {token.holders > 0 ? formatNumber(token.holders) : '--'}
          </div>

          {/* Risk */}
          <div className="text-center w-20">
            <TokenRiskBadge risk={token.riskScore} />
          </div>

          {/* Age */}
          <div className="text-right w-20 font-mono text-xs text-terminal-text-dim">
            {token.deployedAt > 0 ? formatAge(token.deployedAt) : '--'}
          </div>
        </button>
      ))}
    </div>
  );
}
