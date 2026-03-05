'use client';

import { FlowNode, FlowEdge } from '@/types/flow';
import { formatUSD, formatNumber } from '@/lib/format';

interface FlowTooltipProps {
  node?: FlowNode | null;
  edge?: FlowEdge | null;
  nodeSymbols?: Map<string, string>;
  x: number;
  y: number;
}

export function FlowTooltip({ node, edge, nodeSymbols, x, y }: FlowTooltipProps) {
  if (!node && !edge) return null;

  return (
    <div
      className="fixed z-50 glass-card px-3 py-2 pointer-events-none"
      style={{ left: x + 14, top: y - 10 }}
    >
      {node && (
        <div className="space-y-1">
          <div className="text-xs font-mono font-semibold text-terminal-text">{node.symbol}</div>
          <div className="text-[10px] font-mono text-terminal-text-dim uppercase">{node.category}</div>
          <div className="text-[10px] font-mono text-terminal-text-dim">
            Volume: <span className="text-terminal-text">{formatUSD(node.totalVolume)}</span>
          </div>
          <div className="text-[10px] font-mono text-terminal-text-dim">
            Txns: <span className="text-terminal-text">{formatNumber(node.txCount)}</span>
          </div>
        </div>
      )}
      {edge && nodeSymbols && (
        <div className="space-y-1">
          <div className="text-xs font-mono font-semibold text-terminal-text">
            {nodeSymbols.get(edge.source) ?? edge.source.slice(0, 6)}
            {' → '}
            {nodeSymbols.get(edge.target) ?? edge.target.slice(0, 6)}
          </div>
          <div className="text-[10px] font-mono text-terminal-text-dim">
            Volume: <span className="text-terminal-text">{formatUSD(edge.volume)}</span>
          </div>
          <div className="text-[10px] font-mono text-terminal-text-dim">
            Txns: <span className="text-terminal-text">{formatNumber(edge.txCount)}</span>
          </div>
          <div className="text-[10px] font-mono text-terminal-text-dim">
            Via: <span className="text-terminal-text">{edge.protocols.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
