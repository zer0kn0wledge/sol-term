export interface TokenHolding {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  pctOfPortfolio: number;
  imageUri?: string;
}

export interface WalletTransaction {
  signature: string;
  type: string;
  timestamp: number;
  description: string;
  fee: number;
  balanceChanges?: { mint: string; symbol: string; amount: number; decimals: number }[];
}

export interface ProtocolInteraction {
  protocol: string;
  count: number;
  lastUsed: number;
}

export interface FundingInfo {
  source: string;
  sourceName: string | null;
  sourceType: string | null;
  amount: number;
  intermediaries: string[];
}

export interface WalletTransfer {
  signature: string;
  timestamp: number;
  direction: 'in' | 'out';
  counterparty: string;
  mint: string;
  symbol: string;
  amount: number;
}

export interface WalletIdentity {
  name: string | null;
  category: string | null;
  type: string | null;
  avatar: string | null;
}

export interface WalletProfile {
  address: string;
  identity: WalletIdentity | null;
  solBalance: number;
  solPrice: number;
  totalUsdValue: number;
  tokenHoldings: TokenHolding[];
  transactions: WalletTransaction[];
  protocolInteractions: ProtocolInteraction[];
  fundingSource: FundingInfo | null;
  transfers: WalletTransfer[];
  score: number;
}
