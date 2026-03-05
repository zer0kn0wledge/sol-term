export interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  pctOfPortfolio: number;
}

export interface WalletTransaction {
  signature: string;
  type: string;
  timestamp: number;
  description: string;
  fee: number;
}

export interface ProtocolInteraction {
  protocol: string;
  count: number;
  lastUsed: number;
}

export interface FundingInfo {
  source: string;
  intermediaries: string[];
}

export interface WalletProfile {
  address: string;
  identity: { name: string; avatar: string | null } | null;
  solBalance: number;
  solPrice: number;
  tokenHoldings: TokenHolding[];
  transactions: WalletTransaction[];
  protocolInteractions: ProtocolInteraction[];
  fundingSource: FundingInfo | null;
  score: number;
}
