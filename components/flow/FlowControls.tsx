'use client';

import { TokenCategory } from '@/types/flow';

interface FlowControlsProps {
  timeWindow: string;
  onTimeWindowChange: (w: string) => void;
  minVolume: number;
  onMinVolumeChange: (v: number) => void;
  categories: Record<TokenCategory, boolean>;
  onCategoryToggle: (c: TokenCategory) => void;
  topN: number;
  onTopNChange: (n: number) => void;
}

const TIME_OPTIONS = ['1h', '6h', '24h'];
const TOP_N_OPTIONS = [10, 25, 50];

const CATEGORY_LABELS: Record<TokenCategory, string> = {
  stablecoin: 'Stablecoins',
  defi: 'DeFi',
  meme: 'Meme',
  lst: 'LST',
  major: 'Major',
};

const CATEGORY_COLORS: Record<TokenCategory, string> = {
  stablecoin: '#00d4aa',
  defi: '#008ffb',
  meme: '#feb019',
  lst: '#9b59b6',
  major: '#e0e6ed',
};

export function FlowControls({
  timeWindow,
  onTimeWindowChange,
  minVolume,
  onMinVolumeChange,
  categories,
  onCategoryToggle,
  topN,
  onTopNChange,
}: FlowControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-30 glass-card p-3 space-y-3 w-52">
      <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim">
        Controls
      </div>

      {/* Time window */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-terminal-text-dim">Time Window</div>
        <div className="flex gap-1">
          {TIME_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => onTimeWindowChange(opt)}
              className={`flex-1 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                timeWindow === opt
                  ? 'bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/40'
                  : 'bg-terminal-surface text-terminal-text-dim border border-terminal-border hover:text-terminal-text'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Min volume */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-terminal-text-dim">
          Min Volume: ${(minVolume / 1e6).toFixed(1)}M
        </div>
        <input
          type="range"
          min={0}
          max={10_000_000}
          step={100_000}
          value={minVolume}
          onChange={e => onMinVolumeChange(Number(e.target.value))}
          className="w-full h-1 rounded-lg appearance-none cursor-pointer accent-terminal-accent bg-terminal-border"
        />
      </div>

      {/* Categories */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-terminal-text-dim">Categories</div>
        <div className="space-y-0.5">
          {(Object.keys(CATEGORY_LABELS) as TokenCategory[]).map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={categories[cat]}
                onChange={() => onCategoryToggle(cat)}
                className="sr-only"
              />
              <span
                className={`w-2.5 h-2.5 rounded-sm border transition-colors ${
                  categories[cat]
                    ? 'border-transparent'
                    : 'border-terminal-border bg-transparent'
                }`}
                style={categories[cat] ? { background: CATEGORY_COLORS[cat] } : undefined}
              />
              <span className="text-[10px] font-mono text-terminal-text-dim group-hover:text-terminal-text transition-colors">
                {CATEGORY_LABELS[cat]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Top N */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-terminal-text-dim">Show Top</div>
        <div className="flex gap-1">
          {TOP_N_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => onTopNChange(n)}
              className={`flex-1 px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                topN === n
                  ? 'bg-terminal-accent/20 text-terminal-accent border border-terminal-accent/40'
                  : 'bg-terminal-surface text-terminal-text-dim border border-terminal-border hover:text-terminal-text'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
