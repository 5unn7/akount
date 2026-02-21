'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { apiFetch } from '@/lib/api/client-browser'
import { ChevronLeft, Check, Loader2 } from 'lucide-react'
import { WelcomeStep } from './steps/WelcomeStep'
import { IntentStep } from './steps/IntentStep'
import { EmploymentStep } from './steps/EmploymentStep'
import { BusinessSetupStep } from './steps/BusinessSetupStep'
import { AddressStep } from './steps/AddressStep'
import { CompletionStep } from './steps/CompletionStep'

/**
 * Step flow (personal-first):
 * 0: Welcome     — "Just me" / "Me + my business"
 * 1: Intent      — Multi-select goals
 * 2: Employment  — Single select employment status
 * 3: Business    — CONDITIONAL (only if "Me + my business")
 * 3/4: Address   — Residential address + country
 * 4/5: Complete  — API calls + animated checklist
 */

interface OnboardingWizardProps {
  initialState?: {
    currentStep: number
    stepData: Record<string, unknown>
    version: number
    isNew: boolean
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Returns progress bar labels based on whether business step is shown */
function getStepLabels(showBusiness: boolean): string[] {
  return showBusiness
    ? ['Welcome', 'Goals', 'You', 'Business', 'Address']
    : ['Welcome', 'Goals', 'You', 'Address']
}

const DEFAULT_INITIAL_STATE = {
  currentStep: 0,
  stepData: {} as Record<string, unknown>,
  version: 0,
  isNew: true,
}

export function OnboardingWizard({ initialState = DEFAULT_INITIAL_STATE }: OnboardingWizardProps) {
  const router = useRouter()
  const { userId, isLoaded } = useAuth()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedVersionRef = useRef(initialState.version)

  const store = useOnboardingStore()
  const {
    currentStep,
    nextStep,
    previousStep,
    hydrate,
    version,
    shouldShowBusinessStep,
    getTotalSteps,
  } = store

  const showBusiness = shouldShowBusinessStep()
  const totalSteps = getTotalSteps()

  // Hydrate store from server state on mount
  useEffect(() => {
    if (initialState && !initialState.isNew) {
      hydrate({
        currentStep: initialState.currentStep,
        version: initialState.version,
        ...(initialState.stepData as Record<string, unknown>),
      })
    }
  }, [hydrate, initialState])

  // Redirect if user is not authenticated
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in')
    }
  }, [isLoaded, userId, router])

  // Auto-save with 500ms debounce
  useEffect(() => {
    if (!isLoaded || !userId || version === lastSavedVersionRef.current) {
      return
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setSaveStatus('saving')

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await apiFetch<{ version: number }>('/api/system/onboarding/save-step', {
          method: 'POST',
          body: JSON.stringify({
            step: currentStep,
            data: {
              accountType: store.accountType,
              intents: store.intents,
              employmentStatus: store.employmentStatus,
              wantsBusinessEntity: store.wantsBusinessEntity,
              businessName: store.businessName,
              businessEntityType: store.businessEntityType,
              businessCountry: store.businessCountry,
              businessIndustry: store.businessIndustry,
              country: store.country,
              currency: store.currency,
              streetAddress: store.streetAddress,
              city: store.city,
              province: store.province,
              postalCode: store.postalCode,
              taxId: store.taxId,
              businessStreetAddress: store.businessStreetAddress,
              businessCity: store.businessCity,
              businessProvince: store.businessProvince,
              businessPostalCode: store.businessPostalCode,
            },
            version,
          }),
        })

        lastSavedVersionRef.current = result.version
        store.setVersion(result.version)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isLoaded, userId, currentStep, store, version])

  if (!isLoaded || !userId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="h-10 w-10 rounded-full bg-primary/30 animate-pulse glow-primary-strong" />
        <p className="text-sm text-muted-foreground font-heading italic">
          Loading...
        </p>
      </div>
    )
  }

  const isCompletionStep = currentStep === totalSteps - 1
  const stepLabels = getStepLabels(showBusiness)

  // Map currentStep index to the correct component
  // Steps: 0=Welcome, 1=Intent, 2=Employment, 3=[Business|Address], 4=[Address|Complete], 5=[Complete]
  const renderStep = () => {
    if (currentStep === 0) return <WelcomeStep onNext={nextStep} />
    if (currentStep === 1) return <IntentStep onNext={nextStep} />
    if (currentStep === 2) return <EmploymentStep onNext={nextStep} />

    if (showBusiness) {
      if (currentStep === 3) return <BusinessSetupStep onNext={nextStep} />
      if (currentStep === 4) return <AddressStep onNext={nextStep} />
      if (currentStep === 5) return <CompletionStep />
    } else {
      if (currentStep === 3) return <AddressStep onNext={nextStep} />
      if (currentStep === 4) return <CompletionStep />
    }

    return <CompletionStep />
  }

  return (
    <div className="space-y-8">
      {/* Progress indicator — hide on completion step */}
      {!isCompletionStep && (
        <div className="fi fi1">
          <div className="flex items-center gap-1 max-w-md mx-auto">
            {stepLabels.map((label, i) => {
              const isCompleted = i < currentStep
              const isCurrent = i === currentStep
              const isFuture = i > currentStep

              return (
                <div
                  key={label}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  {/* Segment line */}
                  <div
                    className={cn(
                      'h-[3px] w-full rounded-full transition-all duration-500',
                      isCompleted &&
                        'bg-primary shadow-[0_0_6px_var(--ak-pri-glow)]',
                      isCurrent && 'bg-primary/60',
                      isFuture && 'bg-[var(--ak-glass-2)]',
                    )}
                  />
                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wider transition-colors',
                      isCurrent
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground',
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
      <div className="glass rounded-2xl border border-ak-border p-8 fi fi2 relative">
        {/* Auto-save indicator */}
        {!isCompletionStep && saveStatus !== 'idle' && (
          <div className="absolute top-4 right-4 flex items-center gap-2 text-xs">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="h-3 w-3 text-ak-green" />
                <span className="text-ak-green">Saved</span>
              </>
            )}
            {saveStatus === 'error' && (
              <span className="text-destructive">Save failed</span>
            )}
          </div>
        )}

        {/* Step content */}
        <div className="transition-opacity duration-300">{renderStep()}</div>

        {/* Back button — show on steps 1+ except completion and welcome */}
        {!isCompletionStep && currentStep > 0 && (
          <div className="flex items-center mt-6 pt-4 border-t border-ak-border">
            <button
              onClick={previousStep}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
