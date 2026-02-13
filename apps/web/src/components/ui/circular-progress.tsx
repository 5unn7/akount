'use client'

import { cn } from '@/lib/utils'

interface CircularProgressProps {
  /**
   * Progress percentage (0-100)
   */
  percentage: number
  /**
   * Size of the circle in pixels
   * @default 120
   */
  size?: number
  /**
   * Stroke width in pixels
   * @default 8
   */
  strokeWidth?: number
  /**
   * Color of the progress arc
   * @default 'primary' (amber orange)
   */
  color?: 'primary' | 'success' | 'warning' | 'error'
  /**
   * Show percentage text in center
   * @default true
   */
  showPercentage?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * CircularProgress Component
 *
 * Pure SVG circular progress indicator with percentage display.
 * Lightweight alternative to recharts (saves 60KB bundle size).
 *
 * Uses:
 * - Onboarding progress indicator
 * - Dashboard metrics
 * - Task completion tracking
 *
 * Design: Follows "Financial Clarity" aesthetic (glass, glowy, minimal)
 */
export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showPercentage = true,
  className,
}: CircularProgressProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage))

  // Circle calculations
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clampedPercentage / 100) * circumference

  // Color mapping (Tailwind classes)
  const colorClasses = {
    primary: 'stroke-[#F59E0B]', // Amber orange
    success: 'stroke-[#34D399]', // Emerald 400
    warning: 'stroke-[#FBBF24]', // Amber 400
    error: 'stroke-[#F87171]', // Red 400
  }

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-[rgba(255,255,255,0.06)]"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn(
            colorClasses[color],
            'transition-all duration-500 ease-out'
          )}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: color === 'primary' ? 'drop-shadow(0 0 8px rgba(245,158,11,0.3))' : undefined,
          }}
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-heading font-normal text-foreground tabular-nums">
            {Math.round(clampedPercentage)}%
          </span>
          <span className="text-xs text-muted-foreground mt-1">complete</span>
        </div>
      )}
    </div>
  )
}
