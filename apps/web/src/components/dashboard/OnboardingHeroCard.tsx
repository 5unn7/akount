'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CircularProgress } from './CircularProgress'
import { Card } from '@/components/ui/card'
import { X, ChevronDown, ChevronUp } from 'lucide-react'

interface OnboardingProgress {
  completionPercentage: number
  completedSteps: string[]
  skippedSteps: string[]
  basicInfoComplete: boolean
  entitySetupComplete: boolean
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
}

export function OnboardingHeroCard() {
  const router = useRouter()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    try {
      const response = await fetch('/api/system/onboarding/progress')
      const data = await response.json()
      setProgress(data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDismiss() {
    await fetch('/api/system/onboarding/dismiss-card', { method: 'POST' })
    setProgress(null)
  }

  async function handleSkipStep(step: string) {
    await fetch('/api/system/onboarding/skip-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step, skipDurationDays: 7 })
    })
    fetchProgress()
  }

  if (isLoading) {
    return (
      <div className="h-64 glass animate-pulse rounded-2xl" />
    )
  }

  if (!progress || progress.completionPercentage >= 100) {
    return null
  }

  const steps = [
    {
      key: 'basic_info',
      label: 'Basic information',
      complete: progress.basicInfoComplete
    },
    {
      key: 'entity_setup',
      label: 'Entity setup',
      complete: progress.entitySetupComplete
    },
    {
      key: 'business_details',
      label: 'Business details (Tax ID, Address)',
      complete: progress.businessDetailsComplete,
      action: () => router.push('/onboarding/complete?step=business_details')
    },
    {
      key: 'bank_connection',
      label: 'Connect your bank account',
      complete: progress.bankConnectionComplete,
      action: () => router.push('/onboarding/complete?step=bank_connection')
    },
    {
      key: 'goals_setup',
      label: 'Set goals & budget',
      complete: progress.goalsSetupComplete,
      action: () => router.push('/onboarding/complete?step=goals_setup')
    },
  ]

  const nextStep = steps.find(s => !s.complete)

  return (
    <Card variant="glass" className="border-[rgba(245,158,11,0.2)] glow-primary">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <CircularProgress value={progress.completionPercentage} />
            <div>
              <h2 className="text-2xl font-normal font-heading mb-1">Complete Your Setup</h2>
              <p className="text-muted-foreground">
                <span className="font-mono text-primary">{progress.completionPercentage}%</span> complete — Just a few more steps
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Expandable content */}
        {isExpanded && (
          <>
            {/* Checklist */}
            <div className="space-y-3 mb-6">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`
                    h-6 w-6 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.complete
                      ? 'bg-[#34D399] text-white'
                      : 'bg-[rgba(255,255,255,0.06)] text-muted-foreground'}
                  `}>
                    {step.complete ? '\u2713' : '\u25CB'}
                  </div>
                  <span className={step.complete ? 'line-through text-muted-foreground' : 'text-foreground'}>
                    {step.label}
                  </span>
                  {!step.complete && step.action && (
                    <button
                      onClick={step.action}
                      className="ml-auto text-xs text-primary hover:text-[#FBBF24] font-medium transition-colors"
                    >
                      Start &rarr;
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              {nextStep && nextStep.action && (
                <button
                  onClick={nextStep.action}
                  className="flex-1 px-6 py-3 text-sm font-medium text-white bg-primary rounded-lg hover:bg-[#FBBF24] transition-all glow-primary"
                >
                  Continue Setup &rarr;
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-6 py-3 text-sm font-medium text-foreground glass rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-all"
              >
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
