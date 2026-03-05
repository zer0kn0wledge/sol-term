'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWalletProfile } from '@/hooks/useWalletProfile';
import { WalletSearch } from '@/components/wallet/WalletSearch';
import { WalletOverview } from '@/components/wallet/WalletOverview';
import { TokenHoldingsCard } from '@/components/wallet/TokenHoldings';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { ProtocolInteractionsCard } from '@/components/wallet/ProtocolInteractions';
import { FundingChain } from '@/components/wallet/FundingChain';
import { WalletScoreCard } from '@/components/wallet/WalletScoreCard';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ErrorState } from '@/components/shared/ErrorState';
import { DataCard } from '@/components/shared/DataCard';

function WalletContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  const { data: profile, error, isLoading, mutate } = useWalletProfile(address);

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h1 className="text-xl font-mono font-semibold text-terminal-text mb-1">
          Wallet Profiler
        </h1>
        <p className="text-sm text-terminal-text-dim">
          Analyze any Solana wallet — holdings, activity, protocols, and scoring
        </p>
      </div>

      <WalletSearch />

      {!address && (
        <DataCard className="text-center py-12">
          <div className="text-terminal-text-dim font-mono text-sm">
            <p className="mb-2">Enter a Solana address to begin analysis</p>
            <p className="text-xs text-terminal-text-dim/60">
              Supports wallet addresses and .sol domains
            </p>
          </div>
        </DataCard>
      )}

      {address && isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <DataCard title="Loading...">
            <SkeletonLoader lines={6} />
          </DataCard>
          <DataCard title="Loading..." className="lg:col-span-2">
            <SkeletonLoader lines={8} />
          </DataCard>
        </div>
      )}

      {address && error && (
        <ErrorState
          message={error.message ?? 'Failed to load wallet data'}
          onRetry={() => mutate()}
        />
      )}

      {address && profile && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
              <WalletOverview profile={profile} solPrice={profile.solPrice} />
              <WalletScoreCard profile={profile} />
            </div>
            <div className="lg:col-span-2">
              <TokenHoldingsCard holdings={profile.tokenHoldings} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TransactionHistory transactions={profile.transactions} />
            <div className="space-y-4">
              <ProtocolInteractionsCard protocols={profile.protocolInteractions} />
              <FundingChain
                funding={profile.fundingSource}
                targetAddress={profile.address}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<SkeletonLoader lines={5} />}>
      <WalletContent />
    </Suspense>
  );
}
