'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NetworkStatus } from './NetworkStatus';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', key: 'overview' },
  { href: '/wallet', label: 'Wallet', key: 'wallet' },
  { href: '/tokens', label: 'Tokens', key: 'tokens' },
  { href: '/perps', label: 'Perps', key: 'perps' },
  { href: '/flow', label: 'Flow', key: 'flow' },
] as const;

export function Topbar() {
  const pathname = usePathname();

  return (
    <header className="h-14 border-b border-terminal-border bg-terminal-surface flex items-center px-6 justify-between shrink-0">
      <div className="flex items-center gap-8">
        <Link href="/overview" className="flex items-center gap-2">
          <span className="font-mono font-semibold text-terminal-accent text-lg tracking-tight">
            SOL:TERM
          </span>
        </Link>
        <nav className="flex gap-1">
          {NAV_ITEMS.map(({ href, label, key }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-terminal-accent/10 text-terminal-accent'
                    : 'text-terminal-text-dim hover:text-terminal-text hover:bg-terminal-surface'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <NetworkStatus />
    </header>
  );
}
