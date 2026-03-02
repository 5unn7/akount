import { useState, useEffect } from 'react';

/**
 * Generic hook for widget data fetching with loading/error states
 *
 * Consolidates the identical data fetching pattern used across all dashboard widgets.
 * Provides consistent state management for async data loading.
 *
 * @template T - Type of data returned by the fetcher
 * @param fetcher - Async function that fetches the widget data
 * @param deps - Dependency array for the effect (re-fetches when dependencies change)
 * @returns Object with data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useWidgetData(
 *   () => getProfitLossSummary(entityId, startDate, endDate),
 *   [entityId, startDate, endDate]
 * );
 *
 * if (loading) return <WidgetLoadingSkeleton title="P&L Summary" />;
 * if (error) return <WidgetErrorState icon={TrendingUp} title="P&L Summary" />;
 * if (!data) return <WidgetEmptyState icon={TrendingUp} title="P&L Summary" message="No data" />;
 * ```
 */
export function useWidgetData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetcher()
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
