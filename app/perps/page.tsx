'use client';

import { useState } from 'react';
import { usePerpsData } from '@/hooks/usePerpsData';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { ErrorState } from '@/components/shared/ErrorState';
import { MarketOverview } from '@/components/perps/MarketOverview';
import { ComparisonTable } from '@/components/perps/ComparisonTable';
import { OIChart } from '@/components/perps/OIChart';
import { VolumeChart } from '@/components/perps/VolumeChart';
import { FundingRateGrid } from '@/components/perps/FundingRateGrid';
import { LiquidationsPanel } from '@/components/perps/LiquidationsPanel';
import { ProtocolDrawer } from '@/components/perps/ProtocolDrawer';
import type { PerpsProtocol } from '@/types/perps';

export default function PerpsPage() {
  const { data, error, mutate } = usePerpsData();
  const [selectedProtocol, setSelectedProtocol] = useState<PerpsProtocol | null>(null);

  if (error) {
    return <ErrorState message="Failed to load perps data" onRetry={() => mutate()} />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <SkeletonLoader lines={2} />
        <SkeletonLoader lines={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader lines={8} />
          <SkeletonLoader lines={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim">
        Perp DEX Analytics
      </h1>

      <MarketOverview data={data} />

      <ComparisonTable
        protocols={data.protocols}
        onProtocolClick={setSelectedProtocol}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OIChart protocols={data.protocols} />
        <VolumeChart protocols={data.protocols} />
      </div>

      <FundingRateGrid protocols={data.protocols} />

      <LiquidationsPanel liquidations={data.recentLiquidations} />

      <ProtocolDrawer
        protocol={selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
      />
    </div>
  );
}
