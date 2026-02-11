'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { apiFetch } from '@/lib/api/client-browser'

/**
 * Completion Step
 *
 * Final step that completes onboarding and redirects to dashboard.
 * This step performs the final API call to mark onboarding as complete.
 */
export function CompletionStep() {
  const router = useRouter()
  const { userId } = useAuth()
  const [isCompleting, setIsCompleting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { tenantId, entityId, reset } = useOnboardingStore()

  useEffect(() => {
    const completeOnboarding = async () => {
      if (!tenantId || !entityId || !userId) {
        setError('Missing required information')
        return
      }

      try {
        // Call Fastify API complete endpoint
        await apiFetch('/api/system/onboarding/complete', {
          method: 'POST',
          body: JSON.stringify({
            tenantId,
            entityName: useOnboardingStore.getState().entityName,
            entityType: useOnboardingStore.getState().entityType,
            country: useOnboardingStore.getState().country,
            currency: useOnboardingStore.getState().currency,
            fiscalYearStart: useOnboardingStore.getState().fiscalYearStart || 1,
          }),
        })

        // Clear onboarding state
        reset()

        // Redirect to overview dashboard
        router.replace('/overview')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred'
        setError(message)
        setIsCompleting(false)
      }
    }

    completeOnboarding()
  }, [tenantId, entityId, userId, router, reset])

  if (error) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-heading font-normal text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 text-sm font-medium text-black bg-primary rounded-lg hover:bg-[#FBBF24] transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-center">
      {/* Loading indicator */}
      <div className="flex justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-[rgba(255,255,255,0.06)] border-t-primary" />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-normal text-foreground">Setting up your workspace</h2>
        <p className="text-muted-foreground">
          Creating your Chart of Accounts and configuring your fiscal calendar...
        </p>
      </div>

      {/* Checklist of what we're doing */}
      <div className="space-y-3 mt-8 text-left max-w-xs mx-auto">
        {[
          'Creating your accounting workspace',
          'Setting up Chart of Accounts',
          'Configuring fiscal periods',
          'Preparing dashboard',
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="text-[#34D399]">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <span className="text-sm text-foreground/80">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CheckCircleIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}
