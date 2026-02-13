'use client'

import { CircularProgress } from '@/components/ui/circular-progress'
import { useOnboardingProgress } from '@/lib/api/onboarding'

/**
 * Sidebar Progress Indicator
 *
 * Compact circular progress indicator for the sidebar.
 * Shared state with OnboardingHeroCard via React Query (no duplicate API calls).
 *
 * Only shows if onboarding is incomplete (<100%).
 */
export function SidebarProgressIndicator() {
  const { data: progress, isLoading } = useOnboardingProgress()

  // Don't show if loading or 100% complete
  if (isLoading || !progress || progress.completionPercentage >= 100) {
    return null
  }

  return (
    <div className="px-4 py-6">
      <div className="glass border border-[rgba(255,255,255,0.06)] rounded-lg p-4 space-y-3">
        {/* Label */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Setup Progress
          </span>
        </div>

        {/* Circular progress */}
        <div className="flex justify-center">
          <CircularProgress
            percentage={progress.completionPercentage}
            size={80}
            strokeWidth={6}
            color="primary"
            showPercentage={true}
          />
        </div>

        {/* CTA link */}
        <a
          href="/onboarding"
          className="block text-center text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
        >
          Continue Setup →
        </a>
      </div>
    </div>
  )
}
