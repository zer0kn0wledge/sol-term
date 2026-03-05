interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Failed to load data', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-terminal-red text-sm font-mono mb-2">ERROR</div>
      <p className="text-terminal-text-dim text-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 text-xs font-mono border border-terminal-border rounded hover:border-terminal-accent hover:text-terminal-accent transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
