import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const HELIUS_BASE = 'https://api.helius.xyz';

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Helius ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid Solana address' }, { status: 400 });
  }

  const key = process.env.HELIUS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const [balancesRes, historyRes, identityRes, fundingRes, transfersRes] =
    await Promise.allSettled([
      fetchJson(
        `${HELIUS_BASE}/v1/wallet/${address}/balances?api-key=${key}&showNative=true&limit=100`,
      ),
      fetchJson(`${HELIUS_BASE}/v1/wallet/${address}/history?api-key=${key}&limit=50`),
      fetchJson(`${HELIUS_BASE}/v1/wallet/${address}/identity?api-key=${key}`),
      fetchJson(`${HELIUS_BASE}/v1/wallet/${address}/funded-by?api-key=${key}`),
      fetchJson(`${HELIUS_BASE}/v1/wallet/${address}/transfers?api-key=${key}&limit=50`),
    ]);

  // Parse balances
  const balancesData = balancesRes.status === 'fulfilled' ? balancesRes.value : null;
  const nativeBalance = (balancesData?.balances ?? []).find(
    (b: Record<string, unknown>) =>
      b.mint === 'So11111111111111111111111111111111111111112' || b.isNative,
  );
  const solBalance = (nativeBalance?.balance as number) ?? 0;
  const solPrice = (nativeBalance?.pricePerToken as number) ?? 0;
  const totalUsdValue = (balancesData?.totalUsdValue as number) ?? 0;

  const tokenHoldings = ((balancesData?.balances ?? []) as Record<string, unknown>[])
    .filter((b) => !b.isNative && (b.balance as number) > 0)
    .map((b) => ({
      mint: (b.mint as string) ?? '',
      symbol: (b.symbol as string) ?? '???',
      name: (b.name as string) ?? (b.symbol as string) ?? 'Unknown',
      balance: (b.balance as number) ?? 0,
      usdValue: (b.usdValue as number) ?? 0,
      pctOfPortfolio:
        totalUsdValue > 0 ? (((b.usdValue as number) ?? 0) / totalUsdValue) * 100 : 0,
      imageUri: (b.imageUri as string) ?? '',
    }))
    .sort((a, b) => b.usdValue - a.usdValue);

  // Parse history
  const historyData = historyRes.status === 'fulfilled' ? historyRes.value : null;
  const transactions = ((historyData?.data ?? []) as Record<string, unknown>[]).map((tx) => ({
    signature: (tx.signature as string) ?? '',
    type: (tx.type as string) ?? 'UNKNOWN',
    timestamp: tx.timestamp ? Math.floor(new Date(tx.timestamp as string).getTime() / 1000) : 0,
    description: (tx.description as string) ?? '',
    fee: ((tx.fee as number) ?? 0) / 1e9,
    balanceChanges: (tx.balanceChanges as Record<string, unknown>[]) ?? [],
  }));

  // Parse identity (404 = unknown wallet, normal)
  const identityData = identityRes.status === 'fulfilled' ? identityRes.value : null;
  const identity = identityData
    ? {
        name: (identityData.name as string) ?? null,
        category: (identityData.category as string) ?? null,
        type: (identityData.type as string) ?? null,
        avatar: null,
      }
    : null;

  // Parse funding source (404 = no funding found, normal)
  const fundingData = fundingRes.status === 'fulfilled' ? fundingRes.value : null;
  const fundingSource = fundingData
    ? {
        source: (fundingData.funder as string) ?? '',
        sourceName: (fundingData.funderName as string) ?? null,
        sourceType: (fundingData.funderType as string) ?? null,
        amount: (fundingData.amount as number) ?? 0,
        intermediaries: [] as string[],
      }
    : null;

  // Parse transfers
  const transfersData = transfersRes.status === 'fulfilled' ? transfersRes.value : null;
  const transfers = ((transfersData?.data ?? []) as Record<string, unknown>[])
    .slice(0, 20)
    .map((t) => ({
      signature: (t.signature as string) ?? '',
      timestamp: (t.timestamp as number) ?? 0,
      direction: (t.direction as string) ?? 'in',
      counterparty: (t.counterparty as string) ?? '',
      mint: (t.mint as string) ?? '',
      symbol: (t.symbol as string) ?? '',
      amount: (t.amount as number) ?? 0,
    }));

  // Build protocol interactions from history source field
  const protocolMap = new Map<string, { count: number; lastUsed: number }>();
  for (const tx of (historyData?.data ?? []) as Record<string, unknown>[]) {
    const source = (tx.source as string) ?? '';
    if (source && source !== 'UNKNOWN' && source !== 'SYSTEM_PROGRAM') {
      const ts = tx.timestamp
        ? Math.floor(new Date(tx.timestamp as string).getTime() / 1000)
        : 0;
      const existing = protocolMap.get(source);
      if (existing) {
        existing.count++;
        existing.lastUsed = Math.max(existing.lastUsed, ts);
      } else {
        protocolMap.set(source, { count: 1, lastUsed: ts });
      }
    }
  }
  const protocolInteractions = Array.from(protocolMap.entries())
    .map(([protocol, data]) => ({ protocol, ...data }))
    .sort((a, b) => b.count - a.count);

  // Compute wallet score
  const activityScore = Math.min(
    (transactions.length / 50) * 60 + (transactions.length > 0 ? 30 : 0),
    100,
  );
  const diversityScore = Math.min(
    (tokenHoldings.length / 10) * 50 + (protocolInteractions.length / 5) * 50,
    100,
  );
  const holdingsScore =
    totalUsdValue >= 100000
      ? 100
      : totalUsdValue >= 10000
        ? 75
        : totalUsdValue >= 1000
          ? 50
          : totalUsdValue >= 100
            ? 25
            : 10;
  const originScore =
    fundingSource?.sourceType === 'exchange' ? 100 : fundingSource ? 50 : 20;
  const score = Math.round(
    Math.min(
      Math.max(
        activityScore * 0.3 + diversityScore * 0.25 + holdingsScore * 0.25 + originScore * 0.2,
        0,
      ),
      100,
    ),
  );

  const profile = {
    address,
    identity,
    solBalance,
    solPrice,
    totalUsdValue,
    tokenHoldings,
    transactions,
    protocolInteractions,
    fundingSource,
    transfers,
    score,
  };

  return NextResponse.json(profile);
}
