'use client';

import { DataCard } from '@/components/shared/DataCard';
import { getScoreBreakdown } from '@/lib/scoring';
import type { WalletProfile } from '@/types/wallet';

interface Props {
  profile: WalletProfile;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 70 ? 'var(--green)' : score >= 40 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="112" height="112" className="-rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
        />
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-semibold" style={{ color }}>
          {score}
        </span>
        <span className="text-[10px] text-terminal-text-dim font-mono">/ 100</span>
      </div>
    </div>
  );
}

function SubScoreBar({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? 'bg-terminal-green' : value >= 40 ? 'bg-terminal-yellow' : 'bg-terminal-red';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span className="text-terminal-text-dim">{label}</span>
        <span className="text-terminal-text">{value}</span>
      </div>
      <div className="h-1.5 bg-terminal-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value}%`, transition: 'width 0.6s ease' }}
        />
      </div>
    </div>
  );
}

export function WalletScoreCard({ profile }: Props) {
  const breakdown = getScoreBreakdown(profile);

  return (
    <DataCard title="Wallet Score">
      <div className="flex flex-col items-center gap-4">
        <ScoreCircle score={profile.score} />
        <div className="w-full space-y-3">
          <SubScoreBar label="Activity" value={breakdown.activity} />
          <SubScoreBar label="Diversity" value={breakdown.diversity} />
          <SubScoreBar label="Holdings" value={breakdown.holdings} />
          <SubScoreBar label="Origin" value={breakdown.origin} />
        </div>
      </div>
    </DataCard>
  );
}
