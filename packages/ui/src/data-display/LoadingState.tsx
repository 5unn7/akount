import { cn } from '../utils';

export interface SkeletonProps {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Make skeleton circular */
  circle?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Skeleton loading placeholder with shimmer animation.
 *
 * @example
 * ```tsx
 * <Skeleton width={200} height={20} />
 * <Skeleton circle width={40} height={40} />
 * ```
 */
export function Skeleton({
  width,
  height,
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
        'bg-[length:200%_100%]',
        circle ? 'rounded-full' : 'rounded-md',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
      data-testid="skeleton"
    />
  );
}

export interface SpinnerProps {
  /** Size of spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'secondary' | 'white' | 'current';
  /** Additional classes */
  className?: string;
}

const spinnerSizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

const spinnerColors = {
  primary: 'border-orange-500 border-t-transparent',
  secondary: 'border-violet-500 border-t-transparent',
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

/**
 * Spinning loader indicator.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" color="secondary" />
 * ```
 */
export function Spinner({
  size = 'md',
  color = 'primary',
  className,
}: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
      role="status"
      aria-label="Loading"
      data-testid="spinner"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  visible?: boolean;
  /** Loading message */
  message?: string;
  /** Spinner size */
  spinnerSize?: 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

/**
 * Full-area loading overlay with spinner.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <Table data={data} />
 *   <LoadingOverlay visible={isLoading} message="Loading transactions..." />
 * </div>
 * ```
 */
export function LoadingOverlay({
  visible = true,
  message,
  spinnerSize = 'lg',
  className,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center',
        'bg-white/60 backdrop-blur-sm',
        'z-10',
        className
      )}
      data-testid="loading-overlay"
    >
      <Spinner size={spinnerSize} />
      {message && (
        <p className="mt-3 text-sm text-slate-600 font-medium">{message}</p>
      )}
    </div>
  );
}

export interface SkeletonTableProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Skeleton placeholder for tables.
 *
 * @example
 * ```tsx
 * {isLoading ? <SkeletonTable rows={5} columns={4} /> : <DataTable />}
 * ```
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  showHeader = true,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('space-y-3', className)} data-testid="skeleton-table">
      {showHeader && (
        <div className="flex gap-4 pb-3 border-b border-slate-200">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} height={16} className="flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              height={20}
              className="flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  /** Show header line */
  showHeader?: boolean;
  /** Number of content lines */
  lines?: number;
  /** Additional classes */
  className?: string;
}

/**
 * Skeleton placeholder for cards.
 *
 * @example
 * ```tsx
 * {isLoading ? <SkeletonCard lines={3} /> : <KPICard />}
 * ```
 */
export function SkeletonCard({
  showHeader = true,
  lines = 3,
  className,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-[14px] border border-slate-200 space-y-3',
        className
      )}
      data-testid="skeleton-card"
    >
      {showHeader && <Skeleton height={24} width="60%" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          width={i === lines - 1 ? '40%' : '100%'}
        />
      ))}
    </div>
  );
}
