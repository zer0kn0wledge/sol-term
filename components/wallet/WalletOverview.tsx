'use client';

import { DataCard } from '@/components/shared/DataCard';
import { AddressChip } from '@/components/shared/AddressChip';
import { MetricRow } from '@/components/shared/MetricRow';
import { formatSOL, formatUSD, shortAddr } from '@/lib/format';
import type { WalletProfile } from '@/types/wallet';

interface Props {
  profile: WalletProfile;
  solPrice: number;
}

export function WalletOverview({ profile, solPrice }: Props) {
  const solUsd = profile.solBalance * solPrice;
  const totalPortfolio = profile.totalUsdValue ?? 0;
  const totalTokenUsd = totalPortfolio - solUsd;

  return (
    <DataCard title="Wallet Overview">
      <div className="flex items-center gap-3 mb-4">
        {profile.identity?.avatar && (
          <img
            src={profile.identity.avatar}
            alt=""
            className="w-10 h-10 rounded-full border border-terminal-border"
          />
        )}
        <div>
          <div className="font-mono text-lg text-terminal-text font-medium">
            {profile.identity?.name ?? shortAddr(profile.address, 6)}
          </div>
          <div className="flex items-center gap-2">
            <AddressChip address={profile.address} chars={6} />
            {profile.identity?.category && (
              <span className="text-[10px] font-mono text-terminal-accent uppercase">
                {profile.identity.category}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-0.5">
        <MetricRow label="SOL Balance" value={formatSOL(profile.solBalance)} />
        <MetricRow label="SOL Value" value={formatUSD(solUsd)} />
        <MetricRow label="Token Holdings" value={formatUSD(Math.max(totalTokenUsd, 0))} />
        <MetricRow label="Total Portfolio" value={formatUSD(totalPortfolio)} />
        <MetricRow label="Transactions" value={String(profile.transactions.length)} />
        <MetricRow label="Protocols Used" value={String(profile.protocolInteractions.length)} />
      </div>
    </DataCard>
  );
}
