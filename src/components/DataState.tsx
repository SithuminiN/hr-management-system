import type { ReactNode } from "react";

interface Props {
  loading: boolean;
  error?: string;
  isEmpty: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Shows the loading / error / empty state, or the real content when there is data. */
export default function DataState({ loading, error, isEmpty, emptyMessage, onRetry, children }: Props) {
  if (loading) return <p className="hr-state">Loading...</p>;
  if (error) {
    return (
      <div className="hr-state">
        <p className="hr-text-red">{error}</p>
        {onRetry && (
          <button className="hr-btn hr-btn-ghost" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }
  if (isEmpty) return <p className="hr-state">{emptyMessage}</p>;
  return <>{children}</>;
}
