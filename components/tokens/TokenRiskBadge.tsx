import type { RiskScore } from '@/types/token';

const LEVEL_STYLES: Record<RiskScore['level'], string> = {
  low: 'bg-terminal-green/15 text-terminal-green border-terminal-green/30',
  medium: 'bg-terminal-yellow/15 text-terminal-yellow border-terminal-yellow/30',
  high: 'bg-terminal-red/15 text-terminal-red border-terminal-red/30',
  critical: 'bg-terminal-purple/15 text-terminal-purple border-terminal-purple/30',
};

interface TokenRiskBadgeProps {
  risk: RiskScore;
}

export function TokenRiskBadge({ risk }: TokenRiskBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border ${LEVEL_STYLES[risk.level]}`}
    >
      {risk.level}
    </span>
  );
}
