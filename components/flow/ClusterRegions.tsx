'use client';

import { TokenCategory } from '@/types/flow';

interface ClusterPosition {
  category: TokenCategory;
  cx: number;
  cy: number;
  r: number;
}

interface ClusterRegionsProps {
  clusters: ClusterPosition[];
}

const CLUSTER_COLORS: Record<TokenCategory, string> = {
  stablecoin: '#00d4aa',
  defi: '#008ffb',
  meme: '#feb019',
  lst: '#9b59b6',
  major: '#e0e6ed',
};

export function ClusterRegions({ clusters }: ClusterRegionsProps) {
  return (
    <g className="cluster-regions">
      {clusters.map(({ category, cx, cy, r }) => (
        <circle
          key={category}
          cx={cx}
          cy={cy}
          r={r}
          fill={CLUSTER_COLORS[category]}
          opacity={0.05}
        />
      ))}
    </g>
  );
}
