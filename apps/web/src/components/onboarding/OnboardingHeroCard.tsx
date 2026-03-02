'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  useOnboardingProgress,
  useDismissCard,
  shouldShowOnboardingCard,
} from '@/lib/api/onboarding'
import { X, Loader2 } from 'lucide-react'

/**
 * Onboarding Unlock Card
 *
 * Compact dashboard card that frames onboarding steps as capabilities
 * Akount unlocks — not tasks to complete. Zen, warm, non-intrusive.
 *
 * "Akount gets smarter with each step you take."
 *
 * Design: Glass + subtle gradient accent, Financial Clarity aesthetic.
 * Dismissible for 24h. Shared state with SidebarProgressIndicator via React Query.
 */

const CAPABILITIES = [
  {
    key: 'basicInfoComplete',
    unlock: 'Personalized insights',
    nudge: 'Tell Akount about yourself so it can tailor your experience',
    href: '/onboarding',
    ctaLabel: 'Complete Profile',
  },
  {
    key: 'entitySetupComplete',
    unlock: 'Multi-entity tracking',
    nudge: 'Set up your business entities for organized financials',
    href: '/system/entities',
    ctaLabel: 'Set Up Entity',
  },
  {
    key: 'businessDetailsComplete',
    unlock: 'Tax readiness',
    nudge: 'Add business details so Akount can prepare you for tax season',
    href: '/system/entities',
    ctaLabel: 'Add Details',
  },
  {
    key: 'bankConnectionComplete',
    unlock: 'Live cash flow',
    nudge: 'Connect your bank for real-time cash position tracking',
    href: '/banking/accounts',
    ctaLabel: 'Add Account',
  },
  {
    key: 'goalsSetupComplete',
    unlock: 'Smart forecasting',
    nudge: 'Set financial goals and Akount will track your progress',
    href: '/planning/goals',
    ctaLabel: 'Set Goals',
  },
] as const

export function OnboardingHeroCard() {
  const { data: progress, isLoading } = useOnboardingProgress()
  const dismissCard = useDismissCard()

  if (isLoading || !shouldShowOnboardingCard(progress)) {
    return null
  }

  const completed = CAPABILITIES.filter(
    (c) => progress?.[c.key as keyof typeof progress]
  ).length
  const nextCapability = CAPABILITIES.find(
    (c) => !progress?.[c.key as keyof typeof progress]
  )

  return (
    <div className="relative glass rounded-lg overflow-hidden fi fi1">
      {/* Subtle gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] via-transparent to-ak-purple/[0.03] pointer-events-none" />

      <div className="relative px-5 py-4 flex items-center gap-5">
        {/* Progress dots + count */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="text-xl font-mono text-primary tabular-nums leading-none">
            {progress?.completionPercentage ?? 0}
            <span className="text-xs text-muted-foreground">%</span>
          </span>
          <div className="flex gap-1">
            {CAPABILITIES.map((cap, i) => (
              <div
                key={cap.key}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all duration-500',
                  i < completed
                    ? 'bg-primary shadow-[0_0_4px_var(--ak-pri-glow)]'
                    : 'bg-[var(--ak-glass-3)]'
                )}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-10 bg-[var(--ak-border)] shrink-0" />

        {/* Message + next unlock */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/90 font-heading italic leading-snug">
            Akount gets smarter with each step you take.
          </p>
          {nextCapability && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Next:{' '}
              <span className="text-primary font-medium">
                {nextCapability.unlock}
              </span>
              {' \u2014 '}
              <span className="text-[var(--ak-t3)]">
                {nextCapability.nudge}
              </span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {nextCapability && (
            <Link
              href={nextCapability.href}
              className="px-4 py-1.5 text-xs font-medium text-primary bg-ak-pri-dim rounded-lg hover:bg-primary hover:text-black transition-all"
            >
              {nextCapability.ctaLabel}
            </Link>
          )}
          <button
            onClick={() => dismissCard.mutate()}
            disabled={dismissCard.isPending}
            className="p-1.5 text-[var(--ak-t4)] hover:text-muted-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Dismiss"
          >
            {dismissCard.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
