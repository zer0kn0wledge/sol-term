'use client';

import { useState } from 'react';
import { useTokenDetail } from '@/hooks/useTokenFeed';
import { formatUSD, formatNumber } from '@/lib/format';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { TokenRiskBadge } from './TokenRiskBadge';
import { HolderDistribution } from './HolderDistribution';
import { DeployerProfile } from './DeployerProfile';
import { MetricRow } from '@/components/shared/MetricRow';
import { AddressChip } from '@/components/shared/AddressChip';

interface TokenDetailDrawerProps {
  mint: string;
  onClose: () => void;
}

const TABS = ['Overview', 'Holders', 'Deployer', 'Risk'] as const;
type Tab = (typeof TABS)[number];

export function TokenDetailDrawer({ mint, onClose }: TokenDetailDrawerProps) {
  const { data: token, isLoading } = useTokenDetail(mint);
  const [tab, setTab] = useState<Tab>('Overview');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[400px] z-50 bg-terminal-bg border-l border-terminal-border flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
          <div className="flex items-center gap-3 min-w-0">
            {token?.image ? (
              <img
                src={token.image}
                alt={token.symbol}
                className="w-8 h-8 rounded-full bg-terminal-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-terminal-border" />
            )}
            <div className="min-w-0">
              <div className="font-mono text-sm font-medium text-terminal-text truncate">
                {token?.name ?? 'Loading...'}
              </div>
              <div className="text-[10px] font-mono text-terminal-text-dim">
                {token?.symbol ?? ''}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-terminal-text-dim hover:text-terminal-text text-lg font-mono"
          >
            [x]
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-terminal-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                tab === t
                  ? 'text-terminal-accent border-b-2 border-terminal-accent'
                  : 'text-terminal-text-dim hover:text-terminal-text'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <SkeletonLoader lines={6} />
          ) : !token ? (
            <div className="text-sm font-mono text-terminal-text-dim text-center py-8">
              Token not found
            </div>
          ) : (
            <>
              {tab === 'Overview' && (
                <div className="space-y-1">
                  <MetricRow label="Price" value={token.price > 0 ? formatUSD(token.price) : '--'} />
                  <MetricRow label="Market Cap" value={token.marketCap > 0 ? formatUSD(token.marketCap) : '--'} />
                  <MetricRow label="Supply" value={formatNumber(token.supply)} />
                  <MetricRow label="Decimals" value={String(token.decimals)} />
                  <MetricRow label="Holders" value={token.holders > 0 ? formatNumber(token.holders) : '--'} />
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-terminal-text-dim">Risk</span>
                    <TokenRiskBadge risk={token.riskScore} />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-terminal-text-dim">Mint</span>
                    <AddressChip address={token.mint} />
                  </div>
                </div>
              )}

              {tab === 'Holders' && (
                <div className="space-y-4">
                  <HolderDistribution
                    holders={token.topHolders}
                    totalSupply={token.supply}
                  />
                  {token.topHolders.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-2">
                        Top Holders
                      </div>
                      {token.topHolders.map((h, i) => (
                        <div
                          key={h.address}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-terminal-text-dim text-xs w-4">
                              {i + 1}
                            </span>
                            <AddressChip address={h.address} />
                          </div>
                          <span className="font-mono text-terminal-text">
                            {h.pctOfSupply.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'Deployer' && (
                <DeployerProfile
                  deployer={token.deployer}
                  deployedAt={token.deployedAt}
                  tokenCount={token.deployerInfo?.tokenCount}
                  identity={token.deployerInfo?.identity ?? undefined}
                  category={token.deployerInfo?.category ?? undefined}
                />
              )}

              {tab === 'Risk' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-terminal-text-dim">Risk Score</span>
                    <span className="font-mono text-lg text-terminal-text">
                      {token.riskScore.score}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-terminal-text-dim">Level</span>
                    <TokenRiskBadge risk={token.riskScore} />
                  </div>

                  {token.riskScore.factors.length > 0 ? (
                    <div className="space-y-2 mt-4">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim">
                        Risk Factors
                      </div>
                      {token.riskScore.factors.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 px-3 py-2 rounded bg-terminal-surface border border-terminal-border"
                        >
                          <span className="text-terminal-yellow font-mono text-xs mt-0.5">!</span>
                          <span className="text-sm font-mono text-terminal-text">{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded bg-terminal-green/10 border border-terminal-green/20 text-sm font-mono text-terminal-green">
                      No risk factors detected
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
