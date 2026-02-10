'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard } from 'shadcn-glass-ui'
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react'
import { BusinessDetailsModal } from './components/BusinessDetailsModal'
import { BankConnectionModal } from './components/BankConnectionModal'
import { GoalsSetupModal } from './components/GoalsSetupModal'

interface OnboardingProgress {
  completionPercentage: number
  completedSteps: string[]
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
}

type Step = 'business_details' | 'bank_connection' | 'goals_setup' | null

export default function OnboardingCompletePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [activeStep, setActiveStep] = useState<Step>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
    // Get step from query params
    const step = searchParams.get('step') as Step
    if (step) {
      setActiveStep(step)
    }
  }, [searchParams])

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

  function handleStepComplete() {
    fetchProgress()
    setActiveStep(null)
    router.push('/onboarding/complete')
  }

  function handleSkipAll() {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    )
  }

  if (!progress) {
    return null
  }

  const steps = [
    {
      id: 'business_details' as const,
      label: 'Business Details',
      description: 'Add your tax ID, address, and industry',
      complete: progress.businessDetailsComplete,
    },
    {
      id: 'bank_connection' as const,
      label: 'Connect Bank Account',
      description: 'Link your bank for automatic transaction sync',
      complete: progress.bankConnectionComplete,
    },
    {
      id: 'goals_setup' as const,
      label: 'Set Financial Goals',
      description: 'Define your revenue and expense targets',
      complete: progress.goalsSetupComplete,
    },
  ]

  const completedCount = steps.filter(s => s.complete).length
  const totalSteps = steps.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Complete Your Setup</h1>
          <p className="text-lg text-slate-600">
            You're {progress.completionPercentage}% done! Just a few more details to unlock all features.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {completedCount} of {totalSteps} steps completed
            </span>
            <span className="text-sm font-mono font-bold text-orange-500">
              {progress.completionPercentage}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <GlassCard
              key={step.id}
              className={`p-6 cursor-pointer transition-all ${
                step.complete
                  ? 'opacity-60'
                  : 'hover:shadow-lg hover:border-orange-300'
              }`}
              onClick={() => !step.complete && setActiveStep(step.id)}
            >
              <div className="flex items-center gap-4">
                {/* Status icon */}
                <div className={`flex-shrink-0 ${step.complete ? 'text-green-500' : 'text-slate-300'}`}>
                  {step.complete ? (
                    <CheckCircle2 className="h-8 w-8" />
                  ) : (
                    <Circle className="h-8 w-8" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${step.complete ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                    {step.label}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                {!step.complete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveStep(step.id)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Start
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleSkipAll}
            className="px-6 py-3 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
          >
            Skip for now
          </button>
          {completedCount === totalSteps && (
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              Go to Dashboard →
            </button>
          )}
        </div>

        {/* Modals */}
        {activeStep === 'business_details' && (
          <BusinessDetailsModal
            onClose={() => setActiveStep(null)}
            onComplete={handleStepComplete}
          />
        )}
        {activeStep === 'bank_connection' && (
          <BankConnectionModal
            onClose={() => setActiveStep(null)}
            onComplete={handleStepComplete}
          />
        )}
        {activeStep === 'goals_setup' && (
          <GoalsSetupModal
            onClose={() => setActiveStep(null)}
            onComplete={handleStepComplete}
          />
        )}
      </div>
    </div>
  )
}
