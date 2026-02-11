'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { WelcomeStep } from './steps/WelcomeStep'
import { EssentialInfoStep } from './steps/EssentialInfoStep'
import { CompletionStep } from './steps/CompletionStep'

/**
 * Simplified Onboarding Wizard - 2 Steps + Completion
 *
 * Flow:
 * 1. Welcome + Account Type Selection (WelcomeStep)
 * 2. Essential Info Form (EssentialInfoStep) - single page, glass morphism
 * 3. Success Animation (CompletionStep) → Auto-redirect to dashboard
 *
 * Target time: 60-90 seconds from start to dashboard
 */
export function OnboardingWizard() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()

  const {
    currentStep,
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

  // Redirect to overview if onboarding is complete
  useEffect(() => {
    if (tenantId && entityId) {
      router.push('/overview')
    }
  }, [tenantId, entityId, router])

  // Loading state
  if (!isLoaded || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[rgba(255,255,255,0.06)] border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const handleNext = () => {
    nextStep()
  }

  const handlePrevious = () => {
    previousStep()
  }

  // 2 main steps + 1 completion step
  const steps = [
    <WelcomeStep key="welcome" onNext={handleNext} />,
    <EssentialInfoStep key="essential" onNext={handleNext} />,
    <CompletionStep key="completion" />,
  ]

  const currentStepComponent = steps[currentStep] || steps[0]
  const isFirstStep = currentStep === 0

  return (
    <div className="min-h-screen bg-[#09090F] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Progress dots (only show after account type selected) */}
        {accountType && currentStep < 2 && (
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'bg-primary w-8'
                    : step < currentStep
                      ? 'bg-[rgba(245,158,11,0.5)]'
                      : 'bg-[rgba(255,255,255,0.06)]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step content */}
        <div className="transition-all duration-300 ease-in-out">
          {currentStepComponent}
        </div>

        {/* Back button (only on Essential Info step) */}
        {accountType && !isFirstStep && currentStep < 2 && (
          <div className="mt-6 text-center">
            <button
              onClick={handlePrevious}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to account type
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
