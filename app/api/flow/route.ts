import { NextRequest, NextResponse } from 'next/server';
import { parseSwapEvents, aggregateFlows, generateSampleFlowData } from '@/lib/flowAggregator';
import { DEX_PROGRAM_IDS } from '@/lib/dexPrograms';
import { FlowData } from '@/types/flow';

export const dynamic = 'force-dynamic';

const WINDOW_SECONDS: Record<string, number> = {
  '1h': 3600,
  '6h': 21600,
  '24h': 86400,
};

async function fetchDexTransactions(apiKey: string, windowSec: number): Promise<FlowData | null> {
  const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;

  try {
    // Get recent signatures for major DEX programs
    const programsToQuery = DEX_PROGRAM_IDS.slice(0, 3); // Jupiter, Orca, Raydium
    const cutoffTime = Math.floor(Date.now() / 1000) - windowSec;

    const allSignatures: string[] = [];

    for (const programId of programsToQuery) {
      const sigRes = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSignaturesForAddress',
          params: [programId, { limit: 20 }],
        }),
      });

      const sigData = await sigRes.json();
      const sigs = sigData?.result ?? [];
      for (const s of sigs) {
        if (s.blockTime && s.blockTime >= cutoffTime && !s.err) {
          allSignatures.push(s.signature);
        }
      }
    }

    if (allSignatures.length === 0) return null;

    // Parse transactions via Helius enhanced API
    const parseUrl = `https://api.helius.xyz/v0/transactions?api-key=${apiKey}`;
    const batchSize = 50;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allParsed: any[] = [];

    for (let i = 0; i < allSignatures.length; i += batchSize) {
      const batch = allSignatures.slice(i, i + batchSize);
      const parseRes = await fetch(parseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
      const parsed = await parseRes.json();
      if (Array.isArray(parsed)) {
        allParsed.push(...parsed);
      }
    }

    const swaps = parseSwapEvents(allParsed);
    if (swaps.length === 0) return null;

    const { nodes, edges } = aggregateFlows(swaps);

    return {
      nodes,
      edges,
      timeWindow: `${windowSec / 3600}h`,
      totalVolume: nodes.reduce((sum, n) => sum + n.totalVolume, 0),
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const window = searchParams.get('window') ?? '24h';
  const minVol = parseInt(searchParams.get('minVol') ?? '0', 10);

  const windowSec = WINDOW_SECONDS[window] ?? WINDOW_SECONDS['24h'];
  const apiKey = process.env.HELIUS_API_KEY;

  let flowData: FlowData | null = null;

  if (apiKey) {
    flowData = await fetchDexTransactions(apiKey, windowSec);
  }

  // Fall back to sample data for demo
  if (!flowData) {
    flowData = generateSampleFlowData();
    flowData.timeWindow = window;
  }

  // Apply min volume filter
  if (minVol > 0) {
    flowData.nodes = flowData.nodes.filter(n => n.totalVolume >= minVol);
    const nodeIds = new Set(flowData.nodes.map(n => n.id));
    flowData.edges = flowData.edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    flowData.totalVolume = flowData.nodes.reduce((sum, n) => sum + n.totalVolume, 0);
  }

  return NextResponse.json(flowData);
}
