import { ReactNode } from 'react';

interface DataCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function DataCard({ title, children, className = '' }: DataCardProps) {
  return (
    <div className={`glass-card p-4 ${className}`}>
      {title && (
        <h3 className="text-xs font-mono uppercase tracking-widest text-terminal-text-dim mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
