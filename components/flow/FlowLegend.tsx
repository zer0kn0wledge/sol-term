'use client';

const CATEGORIES = [
  { label: 'Stablecoin', color: '#00d4aa' },
  { label: 'DeFi', color: '#008ffb' },
  { label: 'Meme', color: '#feb019' },
  { label: 'LST', color: '#9b59b6' },
  { label: 'Major', color: '#e0e6ed' },
];

const SIZES = [
  { label: 'Low', r: 6 },
  { label: 'Medium', r: 12 },
  { label: 'High', r: 20 },
];

export function FlowLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-30 glass-card p-3 space-y-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim">
        Legend
      </div>

      {/* Category colors */}
      <div className="space-y-1">
        {CATEGORIES.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="text-[10px] font-mono text-terminal-text-dim">{label}</span>
          </div>
        ))}
      </div>

      {/* Size legend */}
      <div className="flex items-end gap-3 pt-1">
        {SIZES.map(({ label, r }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <svg width={r * 2 + 4} height={r * 2 + 4}>
              <circle
                cx={r + 2}
                cy={r + 2}
                r={r}
                fill="none"
                stroke="var(--text-dim)"
                strokeWidth={1}
                opacity={0.5}
              />
            </svg>
            <span className="text-[9px] font-mono text-terminal-text-dim">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
