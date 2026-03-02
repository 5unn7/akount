/**
 * Re-export CircularProgress directly.
 *
 * Previously used next/dynamic to lazy-load the recharts-based version.
 * Now uses pure SVG (no external deps), so no lazy loading needed.
 */
export { CircularProgress } from './CircularProgress';
