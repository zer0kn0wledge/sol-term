'use client';

import { shortAddr } from '@/lib/format';
import { SOLSCAN_URL } from '@/lib/constants';

interface AddressChipProps {
  address: string;
  chars?: number;
}

export function AddressChip({ address, chars = 4 }: AddressChipProps) {
  const copy = () => navigator.clipboard.writeText(address);

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-terminal-surface border border-terminal-border font-mono text-xs text-terminal-text-dim">
      <a
        href={`${SOLSCAN_URL}/account/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-terminal-accent transition-colors"
      >
        {shortAddr(address, chars)}
      </a>
      <button
        onClick={copy}
        className="hover:text-terminal-accent transition-colors"
        title="Copy address"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      </button>
    </span>
  );
}
