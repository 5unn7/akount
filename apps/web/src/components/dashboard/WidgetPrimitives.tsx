import { cn } from '@/lib/utils';

/**
 * Dashboard Widget Primitives
 *
 * Shared UI components for consistent widget states across the dashboard.
 * Eliminates 300+ lines of duplicate loading/error/empty state code.
 *
 * @see apps/web/src/hooks/useWidgetData.ts for data fetching hook
 */

// ============================================================================
// Widget Title
// ============================================================================

interface WidgetTitleProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized widget title with micro uppercase styling
 *
 * @example
 * ```tsx
 * <WidgetTitle>P&L Summary</WidgetTitle>
 * ```
 */
export function WidgetTitle({ children, className }: WidgetTitleProps) {
  return (
    <p className={cn('text-micro uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3', className)}>
      {children}
    </p>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

interface WidgetLoadingSkeletonProps {
  title: string;
  items?: number;
  itemHeight?: string;
  className?: string;
}

/**
 * Generic loading skeleton for dashboard widgets
 *
 * @param title - Widget title displayed above skeleton
 * @param items - Number of skeleton items to show (default: 3)
 * @param itemHeight - Tailwind height class for each item (default: 'h-8')
 *
 * @example
 * ```tsx
 * if (loading) return <WidgetLoadingSkeleton title="Budget vs Actual" items={5} />;
 * ```
 */
export function WidgetLoadingSkeleton({
  title,
  items = 3,
  itemHeight = 'h-8',
  className
}: WidgetLoadingSkeletonProps) {
  return (
    <div className={className}>
      <WidgetTitle>{title}</WidgetTitle>
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className={cn(itemHeight, 'w-full bg-muted/20 animate-pulse rounded')} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

interface WidgetErrorStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  className?: string;
}

/**
 * Standardized error state for dashboard widgets
 *
 * @param icon - Lucide icon component to display
 * @param title - Widget title
 * @param message - Error message (default: "Failed to load data")
 *
 * @example
 * ```tsx
 * import { TrendingUp } from 'lucide-react';
 *
 * if (error) return (
 *   <WidgetErrorState
 *     icon={TrendingUp}
 *     title="P&L Summary"
 *     message="Failed to load P&L data"
 *   />
 * );
 * ```
 */
export function WidgetErrorState({
  icon: Icon,
  title,
  message = 'Failed to load data',
  className
}: WidgetErrorStateProps) {
  return (
    <div className={className}>
      <WidgetTitle>{title}</WidgetTitle>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Icon className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface WidgetEmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  className?: string;
}

/**
 * Standardized empty state for dashboard widgets
 *
 * @param icon - Lucide icon component to display
 * @param title - Widget title
 * @param message - Empty state message
 *
 * @example
 * ```tsx
 * import { Target } from 'lucide-react';
 *
 * if (!data || data.length === 0) return (
 *   <WidgetEmptyState
 *     icon={Target}
 *     title="Goal Progress"
 *     message="No active goals for this period"
 *   />
 * );
 * ```
 */
export function WidgetEmptyState({
  icon: Icon,
  title,
  message,
  className
}: WidgetEmptyStateProps) {
  return (
    <div className={className}>
      <WidgetTitle>{title}</WidgetTitle>
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Icon className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Progress Bar
// ============================================================================

interface ProgressBarProps {
  percent: number;
  variant?: 'success' | 'warning' | 'danger';
  className?: string;
}

/**
 * Reusable progress bar with semantic color variants
 *
 * @param percent - Progress percentage (0-100)
 * @param variant - Color variant based on status
 * @param className - Additional Tailwind classes
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   percent={75}
 *   variant={percent >= 100 ? 'danger' : percent >= 80 ? 'warning' : 'success'}
 * />
 * ```
 */
export function ProgressBar({
  percent,
  variant = 'success',
  className
}: ProgressBarProps) {
  const colors = getProgressColors(variant);
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={cn(`h-1.5 w-full rounded-full ${colors.bg} overflow-hidden`, className)}>
      <div
        className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
}

/**
 * Get semantic color tokens for progress bar variants
 * Uses design system tokens (never hardcoded hex values)
 */
function getProgressColors(variant: 'success' | 'warning' | 'danger'): {
  bg: string;
  bar: string;
} {
  switch (variant) {
    case 'danger':
      return { bg: 'bg-ak-red-dim', bar: 'bg-ak-red/60' };
    case 'warning':
      return { bg: 'bg-ak-pri-dim', bar: 'bg-primary/60' };
    case 'success':
      return { bg: 'bg-ak-green-dim', bar: 'bg-ak-green/60' };
  }
}
