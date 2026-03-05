'use client';

import { useState } from 'react';
import type { TokenProfile } from '@/types/token';
import { formatUSD, formatNumber, formatAge } from '@/lib/format';
import { TokenRiskBadge } from './TokenRiskBadge';
import { AddressChip } from '@/components/shared/AddressChip';

interface TokenCardProps {
  token: TokenProfile;
  onClick: () => void;
}

export function TokenCard({ token, onClick }: TokenCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-terminal-border rounded-lg bg-terminal-surface/50 hover:border-terminal-accent/30 transition-colors">
      <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 flex items-center gap-4"
      >
        {token.image ? (
          <img
            src={token.image}
            alt={token.symbol}
            className="w-8 h-8 rounded-full bg-terminal-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-terminal-border flex items-center justify-center text-[10px] font-mono text-terminal-text-dim">
            {token.symbol.slice(0, 2)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium text-terminal-text truncate">
              {token.name}
            </span>
            <span className="text-[10px] font-mono text-terminal-text-dim uppercase">
              {token.symbol}
            </span>
          </div>
        </div>

        <div className="text-right font-mono text-sm text-terminal-text">
          {token.price > 0 ? formatUSD(token.price) : '--'}
        </div>

        <div className="text-right font-mono text-sm text-terminal-text-dim w-24">
          {token.marketCap > 0 ? formatUSD(token.marketCap) : '--'}
        </div>

        <div className="w-16">
          <TokenRiskBadge risk={token.riskScore} />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-terminal-text-dim hover:text-terminal-accent text-xs font-mono"
        >
          {expanded ? '[-]' : '[+]'}
        </button>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-terminal-border/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-terminal-text-dim">Deployer</span>
            {token.deployer ? (
              <AddressChip address={token.deployer} />
            ) : (
              <span className="font-mono text-terminal-text-dim">--</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-terminal-text-dim">Supply</span>
            <span className="font-mono text-terminal-text">
              {formatNumber(token.supply)}
            </span>
          </div>
          {token.deployedAt > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-terminal-text-dim">Age</span>
              <span className="font-mono text-terminal-text">
                {formatAge(token.deployedAt)}
              </span>
            </div>
          )}
          {token.riskScore.factors.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] font-mono text-terminal-text-dim uppercase mb-1">
                Risk Factors
              </div>
              {token.riskScore.factors.map((f, i) => (
                <div
                  key={i}
                  className="text-[11px] font-mono text-terminal-yellow pl-2 border-l border-terminal-yellow/30"
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
