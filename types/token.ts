export interface RiskScore {
  score: number; // 0-100, 100 = safest
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface HolderData {
  address: string;
  balance: number;
  pctOfSupply: number;
}

export interface DeployerInfo {
  address: string;
  identity: string | null;
  category: string | null;
  tokenCount: number;
}

export interface TokenProfile {
  mint: string;
  name: string;
  symbol: string;
  decimals: number;
  supply: number;
  holders: number;
  price: number;
  marketCap: number;
  image: string;
  deployer: string;
  deployedAt: number;
  riskScore: RiskScore;
  topHolders: HolderData[];
  deployerInfo?: DeployerInfo;
}
