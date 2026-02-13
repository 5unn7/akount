'use client'

import { Card } from '@/components/ui/card'
import { CircularProgress } from '@/components/ui/circular-progress'
import {
  useOnboardingProgress,
  useDismissCard,
  shouldShowOnboardingCard,
} from '@/lib/api/onboarding'
import { X, CheckCircle2, Circle } from 'lucide-react'

/**
 * Onboarding Hero Card
 *
 * Large dashboard card showing onboarding progress with next steps.
 * Dismissible for 24 hours. Shared state with SidebarProgressIndicator via React Query.
 *
 * Design: Glass morphism, amber orange primary, circular progress ring
 */
export function OnboardingHeroCard() {
  const { data: progress, isLoading } = useOnboardingProgress()
  const dismissCard = useDismissCard()

  // Don't show if loading, 100% complete, or dismissed recently
  if (isLoading || !shouldShowOnboardingCard(progress)) {
    return null
  }

  const steps = [
    {
      id: 'basic_info',
      label: 'Basic Information',
      completed: progress?.basicInfoComplete,
      description: 'Name, phone, timezone',
    },
    {
      id: 'entity_setup',
      label: 'Entity Setup',
      completed: progress?.entitySetupComplete,
      description: 'Business details, country, currency',
    },
    {
      id: 'business_details',
      label: 'Business Details',
      completed: progress?.businessDetailsComplete,
      description: 'Industry, team size, fiscal year',
    },
    {
      id: 'bank_connection',
      label: 'Bank Connection',
      completed: progress?.bankConnectionComplete,
      description: 'Connect your bank account',
    },
    {
      id: 'goals_setup',
      label: 'Goals Setup',
      completed: progress?.goalsSetupComplete,
      description: 'Set your financial goals',
    },
  ]

  const nextStep = steps.find((s) => !s.completed)

  return (
    <Card variant="glass" className="p-8 relative overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={() => dismissCard.mutate()}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss for 24 hours"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Progress ring */}
        <div className="flex-shrink-0">
          <CircularProgress
            percentage={progress?.completionPercentage ?? 0}
            size={140}
            strokeWidth={10}
            color="primary"
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-heading font-normal text-foreground">
              {progress?.completionPercentage === 100
                ? "You're all set! 🎉"
                : 'Complete your setup'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {progress?.completionPercentage === 100
                ? 'Your account is fully configured and ready to go'
                : `${steps.filter((s) => s.completed).length} of ${steps.length} steps complete`}
            </p>
          </div>

          {/* Next step highlight */}
          {nextStep && (
            <div className="glass-2 border border-[rgba(245,158,11,0.2)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.14)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Next: {nextStep.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{nextStep.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Steps checklist (compact) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center gap-2 text-sm"
              >
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-[#34D399] flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className={step.completed ? 'text-muted-foreground' : 'text-foreground'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA button */}
          {nextStep && (
            <div className="pt-2">
              <a
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-black bg-primary rounded-lg hover:bg-[#FBBF24] transition-all glow-primary"
              >
                Continue Setup →
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
