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
  const totalTokenUsd = profile.tokenHoldings.reduce((s, h) => s + h.usdValue, 0);
  const solUsd = profile.solBalance * solPrice;
  const totalPortfolio = totalTokenUsd + solUsd;

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
          <AddressChip address={profile.address} chars={6} />
        </div>
      </div>
      <div className="space-y-0.5">
        <MetricRow label="SOL Balance" value={formatSOL(profile.solBalance)} />
        <MetricRow label="SOL Value" value={formatUSD(solUsd)} />
        <MetricRow label="Token Holdings" value={formatUSD(totalTokenUsd)} />
        <MetricRow label="Total Portfolio" value={formatUSD(totalPortfolio)} />
        <MetricRow label="Transactions" value={String(profile.transactions.length)} />
        <MetricRow label="Protocols Used" value={String(profile.protocolInteractions.length)} />
      </div>
    </DataCard>
  );
}
