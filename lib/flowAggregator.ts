import { SwapEvent, FlowNode, FlowEdge, FlowData, TokenCategory } from '@/types/flow';
import { identifyProtocol } from './dexPrograms';

const KNOWN_TOKENS: Record<string, { symbol: string; category: TokenCategory }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', category: 'major' },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', category: 'stablecoin' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', category: 'stablecoin' },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', category: 'lst' },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'jitoSOL', category: 'lst' },
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1': { symbol: 'bSOL', category: 'lst' },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', category: 'defi' },
  'RaijhBPdYrSCM5bKFQCxaL7EYT5J3bvwaZrRE3QcUyR': { symbol: 'RAY', category: 'defi' },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': { symbol: 'ORCA', category: 'defi' },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', category: 'meme' },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', category: 'meme' },
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr': { symbol: 'POPCAT', category: 'meme' },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', category: 'defi' },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'W', category: 'defi' },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': { symbol: 'JTO', category: 'defi' },
};

export function categorizeToken(mint: string, symbol: string): TokenCategory {
  const known = KNOWN_TOKENS[mint];
  if (known) return known.category;

  const s = symbol.toUpperCase();
  if (['USDC', 'USDT', 'DAI', 'PYUSD', 'USDH'].includes(s)) return 'stablecoin';
  if (['SOL', 'BTC', 'ETH', 'WBTC', 'WETH'].includes(s)) return 'major';
  if (s.includes('SOL') && (s.includes('M') || s.includes('JITO') || s.includes('B'))) return 'lst';
  return 'meme';
}

export function getTokenSymbol(mint: string): string {
  return KNOWN_TOKENS[mint]?.symbol ?? mint.slice(0, 6);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseSwapEvents(transactions: any[]): SwapEvent[] {
  const swaps: SwapEvent[] = [];

  for (const tx of transactions) {
    if (!tx || tx.transactionError) continue;

    const sig = tx.signature ?? '';
    const ts = tx.timestamp ?? Math.floor(Date.now() / 1000);
    const instructions = tx.instructions ?? [];
    const tokenTransfers = tx.tokenTransfers ?? [];

    let protocol = 'Unknown';
    for (const ix of instructions) {
      const p = identifyProtocol(ix.programId);
      if (p) { protocol = p; break; }
    }

    if (tokenTransfers.length >= 2) {
      const inTransfer = tokenTransfers[0];
      const outTransfer = tokenTransfers[tokenTransfers.length - 1];

      swaps.push({
        signature: sig,
        timestamp: ts,
        protocol,
        tokenIn: {
          mint: inTransfer.mint ?? '',
          symbol: getTokenSymbol(inTransfer.mint ?? ''),
          amount: Math.abs(inTransfer.tokenAmount ?? 0),
        },
        tokenOut: {
          mint: outTransfer.mint ?? '',
          symbol: getTokenSymbol(outTransfer.mint ?? ''),
          amount: Math.abs(outTransfer.tokenAmount ?? 0),
        },
        volumeUSD: 0,
      });
    }
  }

  return swaps;
}

export function aggregateFlows(swaps: SwapEvent[], minVolume: number = 0): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodeMap = new Map<string, FlowNode>();
  const edgeMap = new Map<string, FlowEdge>();

  for (const swap of swaps) {
    const inId = swap.tokenIn.mint;
    const outId = swap.tokenOut.mint;
    const vol = swap.volumeUSD || swap.tokenIn.amount;

    // Update source node
    const srcNode = nodeMap.get(inId) ?? {
      id: inId,
      symbol: swap.tokenIn.symbol,
      category: categorizeToken(inId, swap.tokenIn.symbol),
      totalVolume: 0,
      txCount: 0,
    };
    srcNode.totalVolume += vol;
    srcNode.txCount += 1;
    nodeMap.set(inId, srcNode);

    // Update target node
    const tgtNode = nodeMap.get(outId) ?? {
      id: outId,
      symbol: swap.tokenOut.symbol,
      category: categorizeToken(outId, swap.tokenOut.symbol),
      totalVolume: 0,
      txCount: 0,
    };
    tgtNode.totalVolume += vol;
    tgtNode.txCount += 1;
    nodeMap.set(outId, tgtNode);

    // Update edge
    const edgeKey = [inId, outId].sort().join('->');
    const edge = edgeMap.get(edgeKey) ?? {
      source: inId,
      target: outId,
      volume: 0,
      txCount: 0,
      protocols: [],
    };
    edge.volume += vol;
    edge.txCount += 1;
    if (!edge.protocols.includes(swap.protocol)) {
      edge.protocols.push(swap.protocol);
    }
    edgeMap.set(edgeKey, edge);
  }

  const nodes = Array.from(nodeMap.values()).filter(n => n.totalVolume >= minVolume);
  const nodeIds = new Set(nodes.map(n => n.id));
  const edges = Array.from(edgeMap.values()).filter(
    e => nodeIds.has(e.source) && nodeIds.has(e.target)
  );

  return { nodes, edges };
}

export function generateSampleFlowData(): FlowData {
  const tokens: Array<{ id: string; symbol: string; category: FlowNode['category']; vol: number; tx: number }> = [
    { id: 'So11111111111111111111111111111111111111112', symbol: 'SOL', category: 'major', vol: 45_200_000, tx: 18420 },
    { id: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', category: 'stablecoin', vol: 38_700_000, tx: 15230 },
    { id: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', category: 'stablecoin', vol: 12_400_000, tx: 5120 },
    { id: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', category: 'defi', vol: 8_900_000, tx: 4210 },
    { id: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', category: 'meme', vol: 6_300_000, tx: 7840 },
    { id: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', symbol: 'mSOL', category: 'lst', vol: 5_600_000, tx: 2310 },
    { id: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', category: 'meme', vol: 4_100_000, tx: 5620 },
    { id: 'RaijhBPdYrSCM5bKFQCxaL7EYT5J3bvwaZrRE3QcUyR', symbol: 'RAY', category: 'defi', vol: 3_800_000, tx: 1940 },
    { id: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', symbol: 'jitoSOL', category: 'lst', vol: 3_200_000, tx: 1680 },
    { id: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', symbol: 'ORCA', category: 'defi', vol: 2_100_000, tx: 980 },
    { id: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', symbol: 'PYTH', category: 'defi', vol: 1_800_000, tx: 1120 },
    { id: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1', symbol: 'bSOL', category: 'lst', vol: 1_500_000, tx: 720 },
    { id: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', symbol: 'POPCAT', category: 'meme', vol: 1_200_000, tx: 3410 },
    { id: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', symbol: 'W', category: 'defi', vol: 900_000, tx: 540 },
    { id: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', symbol: 'JTO', category: 'defi', vol: 750_000, tx: 380 },
  ];

  const nodes: FlowNode[] = tokens.map(t => ({
    id: t.id, symbol: t.symbol, category: t.category, totalVolume: t.vol, txCount: t.tx,
  }));

  const edgePairs: Array<[number, number, number, number, string[]]> = [
    [0, 1, 22_500_000, 9200, ['Jupiter', 'Raydium']],
    [0, 2, 5_100_000, 2100, ['Jupiter', 'Orca']],
    [0, 3, 4_200_000, 2050, ['Jupiter']],
    [0, 4, 3_800_000, 4200, ['Jupiter', 'Raydium']],
    [0, 5, 3_400_000, 1420, ['Jupiter', 'Meteora']],
    [0, 6, 2_900_000, 3100, ['Jupiter', 'Raydium']],
    [1, 3, 2_800_000, 1340, ['Jupiter']],
    [1, 4, 1_900_000, 2680, ['Jupiter', 'Raydium']],
    [1, 7, 1_600_000, 820, ['Raydium']],
    [0, 8, 1_800_000, 890, ['Jupiter']],
    [1, 6, 1_200_000, 1540, ['Jupiter', 'Orca']],
    [0, 9, 950_000, 480, ['Orca']],
    [0, 10, 820_000, 510, ['Jupiter']],
    [5, 8, 700_000, 340, ['Jupiter', 'Meteora']],
    [0, 11, 600_000, 310, ['Jupiter', 'Meteora']],
    [1, 12, 550_000, 1820, ['Jupiter', 'Raydium']],
    [0, 12, 480_000, 1200, ['Jupiter']],
    [1, 13, 420_000, 260, ['Jupiter']],
    [1, 14, 350_000, 180, ['Jupiter']],
    [3, 7, 380_000, 190, ['Raydium']],
  ];

  const edges: FlowEdge[] = edgePairs.map(([s, t, vol, tx, protos]) => ({
    source: tokens[s].id,
    target: tokens[t].id,
    volume: vol,
    txCount: tx,
    protocols: protos,
  }));

  return {
    nodes,
    edges,
    timeWindow: '24h',
    totalVolume: nodes.reduce((sum, n) => sum + n.totalVolume, 0),
  };
}
