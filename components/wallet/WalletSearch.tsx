'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function WalletSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(searchParams.get('address') ?? '');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError('');
      return;
    }

    // Allow .sol domains or valid base58 addresses
    if (!trimmed.endsWith('.sol') && !BASE58_REGEX.test(trimmed)) {
      setError('Invalid address. Enter a Solana address (32-44 base58 chars) or .sol domain.');
      return;
    }

    setError('');
    router.push(`/wallet?address=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter Solana address or .sol domain..."
          className="w-full px-4 py-3 bg-terminal-surface border border-terminal-border rounded-lg font-mono text-sm text-terminal-text placeholder:text-terminal-text-dim focus:outline-none focus:border-terminal-accent transition-colors"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-mono bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 rounded hover:bg-terminal-accent/20 transition-colors"
        >
          Analyze
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs font-mono text-terminal-red">{error}</p>
      )}
    </form>
  );
}
