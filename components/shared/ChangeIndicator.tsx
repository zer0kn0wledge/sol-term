import { formatPct } from '@/lib/format';

interface ChangeIndicatorProps {
  value: number;
}

export function ChangeIndicator({ value }: ChangeIndicatorProps) {
  if (value === 0) {
    return <span className="text-xs font-mono text-terminal-text-dim">0.00%</span>;
  }

  const isPositive = value > 0;
  return (
    <span
      className={`text-xs font-mono ${
        isPositive ? 'text-terminal-green' : 'text-terminal-red'
      }`}
    >
      {formatPct(value)}
    </span>
  );
}
