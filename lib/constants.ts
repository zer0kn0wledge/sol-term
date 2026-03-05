export const SOLSCAN_URL = 'https://solscan.io';

export const DEX_PROGRAMS: Record<string, string> = {
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: 'Jupiter v6',
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: 'Orca Whirlpool',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM',
  srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX: 'Serum v3',
  PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY: 'Phoenix',
  LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo: 'Meteora DLMM',
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: 'Raydium CLMM',
};

export const STABLECOIN_MINTS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
};

export const WRAPPED_SOL = 'So11111111111111111111111111111111111111112';

export const PROTOCOL_CATEGORIES = ['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'Social'] as const;

export const REFRESH_INTERVALS = {
  network: 10000,
  wallet: 0,
  tokens: 60000,
  perps: 30000,
  flow: 30000,
} as const;
