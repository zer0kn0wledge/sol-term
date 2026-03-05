export interface ApiResponse<T> {
  data: T | null;
  error?: string;
}

export interface NetworkInfo {
  tps: number;
  slot: number;
  epoch: number;
  blockHeight: number;
}

export type ChangeDirection = 'up' | 'down' | 'neutral';

export interface MetricData {
  label: string;
  value: string;
  change?: number;
  direction?: ChangeDirection;
}
