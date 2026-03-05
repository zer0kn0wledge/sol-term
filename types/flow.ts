export interface SwapEvent {
  signature: string;
  timestamp: number;
  protocol: string;
  tokenIn: { mint: string; symbol: string; amount: number };
  tokenOut: { mint: string; symbol: string; amount: number };
  volumeUSD: number;
}

export type TokenCategory = 'stablecoin' | 'defi' | 'meme' | 'lst' | 'major';

export interface FlowNode {
  id: string;
  symbol: string;
  category: TokenCategory;
  totalVolume: number;
  txCount: number;
}

export interface FlowEdge {
  source: string;
  target: string;
  volume: number;
  txCount: number;
  protocols: string[];
}

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  timeWindow: string;
  totalVolume: number;
}
