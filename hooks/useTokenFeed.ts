import useSWR from 'swr';
import type { TokenProfile } from '@/types/token';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTokenFeed(params?: { search?: string }) {
  const key = `/api/tokens${params?.search ? `?search=${params.search}` : ''}`;
  return useSWR<TokenProfile[]>(key, fetcher, { refreshInterval: 60000 });
}

export function useTokenDetail(mint: string | null) {
  return useSWR<TokenProfile>(
    mint ? `/api/tokens/${mint}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );
}
