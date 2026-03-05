'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MODULES = [
  { href: '/wallet', label: 'Wallet Profiler', icon: '>' },
  { href: '/tokens', label: 'Token Intel', icon: '>' },
  { href: '/perps', label: 'Perp Analytics', icon: '>' },
  { href: '/flow', label: 'Capital Flow', icon: '>' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  if (pathname.startsWith('/flow')) return null;

  return (
    <aside className="w-52 border-r border-terminal-border bg-terminal-surface shrink-0 hidden lg:flex flex-col py-4">
      <div className="px-4 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim">
          Modules
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {MODULES.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono transition-colors ${
                active
                  ? 'bg-terminal-accent/10 text-terminal-accent'
                  : 'text-terminal-text-dim hover:text-terminal-text hover:bg-terminal-surface'
              }`}
            >
              <span className="text-terminal-accent text-xs">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
