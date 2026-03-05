import { ChangeIndicator } from './ChangeIndicator';

interface MetricRowProps {
  label: string;
  value: string;
  change?: number;
}

export function MetricRow({ label, value, change }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-terminal-text-dim">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-medium text-terminal-text">{value}</span>
        {change !== undefined && <ChangeIndicator value={change} />}
      </div>
    </div>
  );
}
