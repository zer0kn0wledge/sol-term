'use client';

import { AddressChip } from '@/components/shared/AddressChip';
import { formatAge } from '@/lib/format';

interface DeployerProfileProps {
  deployer: string;
  deployedAt: number;
  tokenCount?: number;
}

export function DeployerProfile({ deployer, deployedAt, tokenCount }: DeployerProfileProps) {
  if (!deployer) {
    return (
      <div className="text-sm text-terminal-text-dim font-mono text-center py-8">
        Deployer unknown
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-terminal-text-dim mb-2">
          Deployer Address
        </div>
        <AddressChip address={deployer} chars={6} />
      </div>

      {deployedAt > 0 && (
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-terminal-text-dim">Deploy Date</span>
          <span className="text-sm font-mono text-terminal-text">
            {formatAge(deployedAt)}
          </span>
        </div>
      )}

      {tokenCount !== undefined && (
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-terminal-text-dim">Tokens Deployed</span>
          <span className={`text-sm font-mono ${tokenCount > 10 ? 'text-terminal-red' : 'text-terminal-text'}`}>
            {tokenCount}
          </span>
        </div>
      )}

      {tokenCount !== undefined && tokenCount > 10 && (
        <div className="px-2 py-1.5 rounded bg-terminal-red/10 border border-terminal-red/20">
          <span className="text-[11px] font-mono text-terminal-red">
            High token deployment count - potential serial deployer
          </span>
        </div>
      )}
    </div>
  );
}
