/**
 * Dynamic import wrapper for CircularProgress
 *
 * Lazy loads the recharts-based CircularProgress component to reduce initial bundle size.
 * CircularProgress uses recharts (PieChart, Pie, Cell) which adds ~100KB to the bundle.
 *
 * By lazy loading, the recharts library is only downloaded when the component is actually rendered.
 */

import dynamic from 'next/dynamic';

/**
 * Lazy-loaded CircularProgress component
 *
 * @see apps/web/src/components/dashboard/CircularProgress.tsx for the actual component
 */
export const CircularProgress = dynamic(
    () => import('./CircularProgress').then((m) => ({ default: m.CircularProgress })),
    {
        ssr: false,
        loading: () => (
            <div className="h-20 w-20 bg-muted/20 animate-pulse rounded-full" />
        ),
    }
);
