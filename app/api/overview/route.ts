import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface SolanaOverview {
  network: {
    tps: number;
    slot: number;
    epoch: number;
    blockHeight: number;
  };
  solPrice: number;
  solChange24h: number;
  solMarketCap: number;
  solVolume24h: number;
  topTokens: Array<{
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    mint: string;
  }>;
  defiTvl: number;
  defiChange24h: number;
}

const TOP_MINTS = [
  'So11111111111111111111111111111111111111112',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'RaijhBPdYrSCM5bKFQCxaL7EYT5J3bvwaZrRE3QcUyR',
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
];

const TOKEN_META: Record<string, { symbol: string; name: string }> = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana' },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': { symbol: 'JUP', name: 'Jupiter' },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK', name: 'Bonk' },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF', name: 'dogwifhat' },
  'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL': { symbol: 'JTO', name: 'Jito' },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': { symbol: 'PYTH', name: 'Pyth Network' },
  'RaijhBPdYrSCM5bKFQCxaL7EYT5J3bvwaZrRE3QcUyR': { symbol: 'RAY', name: 'Raydium' },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': { symbol: 'ORCA', name: 'Orca' },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL', name: 'Marinade SOL' },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'W', name: 'Wormhole' },
};

export async function GET() {
  try {
    const key = process.env.HELIUS_API_KEY;
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${key}`;

    // Parallel fetches
    const [networkRes, jupPriceRes, defiTvlRes, solCgRes] = await Promise.allSettled([
      // Network stats from Helius
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          { jsonrpc: '2.0', id: 1, method: 'getRecentPerformanceSamples', params: [1] },
          { jsonrpc: '2.0', id: 2, method: 'getEpochInfo' },
        ]),
      }),
      // Jupiter prices for top tokens
      fetch(`https://api.jup.ag/price/v2?ids=${TOP_MINTS.join(',')}`),
      // DeFiLlama Solana TVL
      fetch('https://api.llama.fi/v2/chains'),
      // CoinGecko SOL data (free, no key)
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true'),
    ]);

    // Parse network
    let network = { tps: 0, slot: 0, epoch: 0, blockHeight: 0 };
    if (networkRes.status === 'fulfilled') {
      const results = await networkRes.value.json();
      const perf = results[0]?.result?.[0];
      const epochInfo = results[1]?.result;
      network = {
        tps: perf ? Math.round(perf.numTransactions / perf.samplePeriodSecs) : 0,
        slot: epochInfo?.absoluteSlot ?? 0,
        epoch: epochInfo?.epoch ?? 0,
        blockHeight: epochInfo?.blockHeight ?? 0,
      };
    }

    // Parse SOL CoinGecko
    let solPrice = 0, solChange24h = 0, solMarketCap = 0, solVolume24h = 0;
    if (solCgRes.status === 'fulfilled') {
      const cg = await solCgRes.value.json();
      const sol = cg.solana;
      if (sol) {
        solPrice = sol.usd ?? 0;
        solChange24h = sol.usd_24h_change ?? 0;
        solMarketCap = sol.usd_market_cap ?? 0;
        solVolume24h = sol.usd_24h_vol ?? 0;
      }
    }

    // Parse Jupiter prices
    const topTokens: SolanaOverview['topTokens'] = [];
    if (jupPriceRes.status === 'fulfilled') {
      const jup = await jupPriceRes.value.json();
      for (const mint of TOP_MINTS) {
        const info = jup.data?.[mint];
        if (!info) continue;
        const meta = TOKEN_META[mint];
        if (!meta) continue;
        topTokens.push({
          symbol: meta.symbol,
          name: meta.name,
          price: Number(info.price ?? 0),
          change24h: 0,
          mint,
        });
      }
    }

    // Parse DeFi TVL
    let defiTvl = 0, defiChange24h = 0;
    if (defiTvlRes.status === 'fulfilled') {
      const chains = await defiTvlRes.value.json();
      const solana = chains.find((c: { name: string }) => c.name === 'Solana');
      if (solana) {
        defiTvl = solana.tvl ?? 0;
        defiChange24h = solana.tokenSymbol ? 0 : 0; // no change field available
      }
    }

    const overview: SolanaOverview = {
      network,
      solPrice,
      solChange24h,
      solMarketCap,
      solVolume24h,
      topTokens,
      defiTvl,
      defiChange24h,
    };

    return NextResponse.json(overview);
  } catch (err) {
    console.error('Overview API error:', err);
    return NextResponse.json({
      network: { tps: 0, slot: 0, epoch: 0, blockHeight: 0 },
      solPrice: 0, solChange24h: 0, solMarketCap: 0, solVolume24h: 0,
      topTokens: [], defiTvl: 0, defiChange24h: 0,
    });
  }
}
