'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useOnboardingProgress } from '@/lib/api/onboarding'

/**
 * Sidebar Progress Indicator — "Capability Meter"
 *
 * Compact inline indicator: segmented bar + next unlock nudge.
 * Framed as "features you unlock" not "tasks to complete."
 *
 * Design: Minimal, zen, Financial Clarity aesthetic.
 */

const CAPABILITIES = [
  { key: 'basicInfoComplete', unlock: 'personalization' },
  { key: 'entitySetupComplete', unlock: 'multi-entity' },
  { key: 'businessDetailsComplete', unlock: 'tax readiness' },
  { key: 'bankConnectionComplete', unlock: 'live cash flow' },
  { key: 'goalsSetupComplete', unlock: 'forecasting' },
] as const

export function SidebarProgressIndicator() {
  const { data: progress, isLoading } = useOnboardingProgress()

  if (isLoading || !progress || progress.completionPercentage >= 100) {
    return null
  }

  const completed = CAPABILITIES.filter(
    (c) => progress[c.key as keyof typeof progress]
  ).length
  const nextCapability = CAPABILITIES.find(
    (c) => !progress[c.key as keyof typeof progress]
  )

  return (
    <Link
      href="/overview"
      className="block group rounded-lg px-1 py-2 -mx-1 transition-colors hover:bg-[var(--ak-glass)]"
    >
      {/* Segmented bar */}
      <div className="flex gap-1 mb-2">
        {CAPABILITIES.map((cap, i) => (
          <div
            key={cap.key}
            className={cn(
              'h-[3px] flex-1 rounded-full transition-all duration-500',
              i < completed
                ? 'bg-primary shadow-[0_0_6px_var(--ak-pri-glow)]'
                : 'bg-[var(--ak-glass-2)]'
            )}
          />
        ))}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="text-micro text-muted-foreground tracking-wider font-mono">
          {completed}/{CAPABILITIES.length}
        </span>
        {nextCapability && (
          <span className="text-micro text-[var(--ak-t3)] group-hover:text-primary transition-colors truncate ml-2">
            {nextCapability.unlock} →
          </span>
        )}
      </div>
    </Link>
  )
}
