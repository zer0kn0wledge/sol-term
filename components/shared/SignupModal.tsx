'use client';

import { useState, FormEvent } from 'react';

export function SignupModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [followConsent, setFollowConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !followConsent) return;
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card glow-accent w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-terminal-text-dim hover:text-terminal-text transition-colors text-lg leading-none"
        >
          &times;
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="text-terminal-accent font-mono text-lg mb-2">You&apos;re in.</div>
            <p className="text-sm text-terminal-text-dim mb-4">
              Follow{' '}
              <a
                href="https://x.com/machinesmoneyA1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-accent hover:underline"
              >
                @machinesmoneyA1
              </a>{' '}
              to stay in the loop.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-xs font-mono border border-terminal-accent/40 text-terminal-accent rounded hover:bg-terminal-accent/10 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 className="font-mono text-lg text-terminal-accent font-semibold mb-1">
                Get Early Access
              </h2>
              <p className="text-sm text-terminal-text-dim">
                Sign up for updates, alpha features, and intelligence drops.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 bg-terminal-bg border border-terminal-border rounded-lg font-mono text-sm text-terminal-text placeholder:text-terminal-text-dim focus:outline-none focus:border-terminal-accent transition-colors"
              />

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={followConsent}
                  onChange={(e) => setFollowConsent(e.target.checked)}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    followConsent
                      ? 'bg-terminal-accent border-terminal-accent'
                      : 'border-terminal-border group-hover:border-terminal-text-dim'
                  }`}
                >
                  {followConsent && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#0a0e14" strokeWidth="2">
                      <path d="M2 5l2 2 4-4" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-terminal-text-dim leading-relaxed">
                  I agree to follow{' '}
                  <a
                    href="https://x.com/machinesmoneyA1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-terminal-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @machinesmoneyA1
                  </a>{' '}
                  on X for updates and intelligence from the terminal.
                </span>
              </label>

              <button
                type="submit"
                disabled={!email || !followConsent}
                className="w-full py-2.5 text-sm font-mono font-medium rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/40 hover:bg-terminal-accent/25 hover:border-terminal-accent/60"
              >
                Submit
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
