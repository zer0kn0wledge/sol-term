export interface FundingRate {
  market: string;
  rate: number;
  period: string;
}

export interface PerpsProtocol {
  name: string;
  slug: string;
  totalOI: number;
  volume24h: number;
  fees24h: number;
  tvl: number;
  markets: number;
  fundingRates: FundingRate[];
}

export interface Liquidation {
  protocol: string;
  market: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  timestamp: number;
}

export interface PerpsOverview {
  protocols: PerpsProtocol[];
  totalOI: number;
  totalVolume24h: number;
  recentLiquidations: Liquidation[];
}
