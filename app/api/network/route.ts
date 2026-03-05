import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const key = process.env.HELIUS_API_KEY;
    if (!key) return NextResponse.json({ tps: 0, slot: 0, epoch: 0 });

    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { jsonrpc: '2.0', id: 1, method: 'getRecentPerformanceSamples', params: [1] },
        { jsonrpc: '2.0', id: 2, method: 'getEpochInfo' },
      ]),
    });

    const results = await res.json();
    const perfSample = results[0]?.result?.[0];
    const epochInfo = results[1]?.result;

    const tps = perfSample
      ? Math.round(perfSample.numTransactions / perfSample.samplePeriodSecs)
      : 0;

    return NextResponse.json({
      tps,
      slot: epochInfo?.absoluteSlot ?? 0,
      epoch: epochInfo?.epoch ?? 0,
      blockHeight: epochInfo?.blockHeight ?? 0,
    });
  } catch {
    return NextResponse.json({ tps: 0, slot: 0, epoch: 0, blockHeight: 0 });
  }
}
