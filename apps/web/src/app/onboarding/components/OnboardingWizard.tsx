'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { WelcomeStep } from './steps/WelcomeStep'
import { EntityDetailsStep } from './steps/EntityDetailsStep'
import { CompletionStep } from './steps/CompletionStep'
import { ProgressIndicator } from './ProgressIndicator'

export function OnboardingWizard() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    currentStep,
    totalSteps,
    accountType,
    tenantId,
    entityId,
    nextStep,
    previousStep,
  } = useOnboardingStore()

  // Redirect if user is not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (tenantId && entityId) {
      router.push('/(dashboard)/dashboard')
    }
  }, [tenantId, entityId, router])

  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
      </div>
    )
  }

  const handleNext = async () => {
    setError(null)

    // Validate current step before proceeding
    if (currentStep === 0 && !accountType) {
      setError('Please select an account type')
      return
    }

    try {
      nextStep()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    }
  }

  const handlePrevious = () => {
    setError(null)
    previousStep()
  }

  // Step components
  const steps = [
    <WelcomeStep key="welcome" onNext={handleNext} />,
    <EntityDetailsStep key="entity" onNext={handleNext} />,
    <CompletionStep key="completion" />,
  ]

  const currentStepComponent = steps[currentStep] || steps[0]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      {accountType && <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />}

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="rounded-lg bg-white p-8 shadow-sm border border-slate-200">
        {currentStepComponent}
      </div>

      {/* Navigation buttons */}
      {accountType && (
        <div className="flex justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep || isLoading}
            className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          {!isLastStep && (
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="ml-auto px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Loading...' : 'Next'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
