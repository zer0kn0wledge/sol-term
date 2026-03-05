'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useFlowData } from '@/hooks/useFlowData';
import { FlowControls } from '@/components/flow/FlowControls';
import { FlowLegend } from '@/components/flow/FlowLegend';
import { TokenCategory } from '@/types/flow';

const FlowGraph = dynamic(
  () => import('@/components/flow/FlowGraph').then(m => ({ default: m.FlowGraph })),
  { ssr: false }
);

export default function FlowPage() {
  const [timeWindow, setTimeWindow] = useState('24h');
  const [minVolume, setMinVolume] = useState(0);
  const [topN, setTopN] = useState(25);
  const [categories, setCategories] = useState<Record<TokenCategory, boolean>>({
    stablecoin: true,
    defi: true,
    meme: true,
    lst: true,
    major: true,
  });

  const { data, isLoading } = useFlowData({ timeWindow, minVolume });

  const handleCategoryToggle = (cat: TokenCategory) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 48px)' }}>
      <FlowControls
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        minVolume={minVolume}
        onMinVolumeChange={setMinVolume}
        categories={categories}
        onCategoryToggle={handleCategoryToggle}
        topN={topN}
        onTopNChange={setTopN}
      />

      <FlowLegend />

      {isLoading && !data ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-text-dim font-mono text-sm animate-pulse-dim">
            Loading flow data...
          </div>
        </div>
      ) : data ? (
        <FlowGraph data={data} categories={categories} topN={topN} />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-text-dim font-mono text-sm">
            No flow data available
          </div>
        </div>
      )}
    </div>
  );
}
