'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { ChevronLeft } from 'lucide-react'
import { WelcomeStep } from './steps/WelcomeStep'
import { IntentStep } from './steps/IntentStep'
import { EssentialInfoStep } from './steps/EssentialInfoStep'
import { CompletionStep } from './steps/CompletionStep'

const STEP_LABELS = ['Identity', 'Workspace', 'Intent', 'Ready'] as const

export function OnboardingWizard() {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()

  const {
    currentStep,
    totalSteps,
    nextStep,
    previousStep,
  } = useOnboardingStore()

  // Redirect if user is not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  if (!isLoaded || !userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="h-10 w-10 rounded-full bg-primary/30 animate-pulse shadow-[0_0_36px_rgba(245,158,11,0.22)]" />
        <p className="text-sm text-muted-foreground font-heading italic">Loading...</p>
      </div>
    )
  }

  const isCompletionStep = currentStep === totalSteps - 1

  return (
    <div className="space-y-8">
      {/* Progress indicator — hide on completion step */}
      {!isCompletionStep && (
        <div className="fi fi1">
          <div className="flex items-center gap-1 max-w-md mx-auto">
            {STEP_LABELS.map((label, i) => {
              const isCompleted = i < currentStep
              const isCurrent = i === currentStep
              const isFuture = i > currentStep

              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-2">
                  {/* Segment line */}
                  <div
                    className={cn(
                      'h-[3px] w-full rounded-full transition-all duration-500',
                      isCompleted && 'bg-primary shadow-[0_0_6px_var(--ak-pri-glow)]',
                      isCurrent && 'bg-primary/60',
                      isFuture && 'bg-[var(--ak-glass-2)]',
                    )}
                  />
                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider transition-colors',
                      isCurrent ? 'text-primary font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step container */}
      <div className="glass rounded-2xl border border-ak-border p-8 fi fi2">
        {/* Step content */}
        <div className="transition-opacity duration-300">
          {currentStep === 0 && <WelcomeStep onNext={nextStep} />}
          {currentStep === 1 && <EssentialInfoStep onNext={nextStep} />}
          {currentStep === 2 && <IntentStep onNext={nextStep} />}
          {currentStep === 3 && <CompletionStep />}
        </div>

        {/* Navigation — hide on completion step and steps with built-in navigation */}
        {!isCompletionStep && currentStep !== 0 && currentStep !== 2 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-ak-border">
            {/* Back button */}
            {currentStep > 0 ? (
              <button
                onClick={previousStep}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {/* Continue — only shown on WorkspaceStep (form submit) */}
            {currentStep === 1 && (
              <button
                type="submit"
                form="workspace-form"
                className="px-6 py-2.5 text-sm font-medium text-black bg-primary rounded-lg hover:bg-ak-pri-hover transition-all glow-primary"
              >
                Continue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
