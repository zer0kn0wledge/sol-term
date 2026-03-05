import useSWR from 'swr';
import type { WalletProfile } from '@/types/wallet';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWalletProfile(address: string | null) {
  return useSWR<WalletProfile>(
    address ? `/api/wallet?address=${address}` : null,
    fetcher,
    { refreshInterval: 0 },
  );
}
