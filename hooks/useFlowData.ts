import useSWR from 'swr';
import { FlowData } from '@/types/flow';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useFlowData(params: { timeWindow: string; minVolume: number }) {
  return useSWR<FlowData>(
    `/api/flow?window=${params.timeWindow}&minVol=${params.minVolume}`,
    fetcher,
    { refreshInterval: 30000 }
  );
}
