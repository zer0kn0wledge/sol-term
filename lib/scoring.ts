import type { WalletProfile } from '@/types/wallet';

function activityScore(profile: WalletProfile): number {
  const txCount = profile.transactions.length;
  const countScore = Math.min(txCount / 50, 1) * 60;

  let recencyScore = 0;
  if (profile.transactions.length > 0) {
    const latest = Math.max(...profile.transactions.map((t) => t.timestamp));
    const daysSince = (Date.now() / 1000 - latest) / 86400;
    recencyScore = daysSince < 1 ? 40 : daysSince < 7 ? 30 : daysSince < 30 ? 15 : 0;
  }

  return Math.min(countScore + recencyScore, 100);
}

function diversityScore(profile: WalletProfile): number {
  const tokenVariety = Math.min(profile.tokenHoldings.length / 10, 1) * 50;
  const protocolVariety = Math.min(profile.protocolInteractions.length / 5, 1) * 50;
  return Math.min(tokenVariety + protocolVariety, 100);
}

function holdingsScore(profile: WalletProfile): number {
  const totalUsd =
    profile.tokenHoldings.reduce((sum, t) => sum + t.usdValue, 0) +
    profile.solBalance; // rough estimate; SOL price already factored in API
  if (totalUsd >= 100000) return 100;
  if (totalUsd >= 10000) return 75;
  if (totalUsd >= 1000) return 50;
  if (totalUsd >= 100) return 25;
  return 10;
}

function originScore(profile: WalletProfile): number {
  if (!profile.fundingSource) return 20;
  const known = ['Coinbase', 'Binance', 'Kraken', 'FTX', 'Phantom', 'Solflare'];
  const isKnown = known.some((k) =>
    profile.fundingSource!.source.toLowerCase().includes(k.toLowerCase()),
  );
  return isKnown ? 100 : 50;
}

export function computeWalletScore(profile: WalletProfile): number {
  const activity = activityScore(profile);
  const diversity = diversityScore(profile);
  const holdings = holdingsScore(profile);
  const origin = originScore(profile);

  const weighted = activity * 0.3 + diversity * 0.25 + holdings * 0.25 + origin * 0.2;
  return Math.round(Math.min(Math.max(weighted, 0), 100));
}

export function getScoreBreakdown(profile: WalletProfile) {
  return {
    activity: Math.round(activityScore(profile)),
    diversity: Math.round(diversityScore(profile)),
    holdings: Math.round(holdingsScore(profile)),
    origin: Math.round(originScore(profile)),
  };
}
