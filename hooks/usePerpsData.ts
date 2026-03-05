import useSWR from 'swr';
import type { PerpsOverview } from '@/types/perps';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePerpsData() {
  return useSWR<PerpsOverview>('/api/perps', fetcher, { refreshInterval: 30000 });
}
