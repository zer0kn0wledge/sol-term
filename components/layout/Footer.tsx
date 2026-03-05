'use client';

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-center justify-center py-2.5 px-4">
        <span className="pointer-events-auto text-[11px] font-mono text-terminal-text-dim/50 tracking-wide">
          built by{' '}
          <a
            href="https://x.com/zerokn0wledge_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-text-dim/70 hover:text-terminal-accent transition-colors"
          >
            @zerokn0wledge_
          </a>
        </span>
      </div>
    </div>
  );
}
