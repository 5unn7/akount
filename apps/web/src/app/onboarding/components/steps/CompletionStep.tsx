'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { apiFetch } from '@/lib/api/client-browser'
import Link from 'next/link'

const SETUP_ITEMS = [
  'Creating your workspace',
  'Setting up chart of accounts',
  'Configuring fiscal calendar',
  'Personalizing your dashboard',
] as const

export function CompletionStep() {
  const router = useRouter()
  const { userId } = useAuth()
  const { tenantId, entityId, reset, goToStep } = useOnboardingStore()

  const [completedItems, setCompletedItems] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSetup = useCallback(async () => {
    if (!tenantId || !entityId || !userId) {
      goToStep(0)
      return
    }

    try {
      // Convert fiscalYearEnd (string month) → fiscalYearStart (next month as int)
      const fyEnd = parseInt(useOnboardingStore.getState().fiscalYearEnd)
      const fiscalYearStart = (fyEnd % 12) + 1

      // Call the complete endpoint
      await apiFetch('/api/system/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          entityName: useOnboardingStore.getState().entityName,
          entityType: useOnboardingStore.getState().entityType,
          country: useOnboardingStore.getState().country,
          currency: useOnboardingStore.getState().currency,
          fiscalYearStart,
        }),
      })

      // Animate checklist items progressively
      for (let i = 0; i < SETUP_ITEMS.length; i++) {
        await new Promise((r) => setTimeout(r, 600))
        setCompletedItems(i + 1)
      }

      // Show success state
      await new Promise((r) => setTimeout(r, 400))
      setIsDone(true)

      // Clear store and auto-redirect
      reset()
      setTimeout(() => router.replace('/overview'), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    }
  }, [tenantId, entityId, userId, router, reset, goToStep])

  useEffect(() => {
    runSetup()
  }, [runSetup])

  if (error) {
    return (
      <div className="space-y-6 text-center py-8">
        <div className="space-y-2">
          <div className="h-12 w-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-destructive text-xl">!</span>
          </div>
          <h2 className="text-2xl font-heading font-normal text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => {
            setError(null)
            setCompletedItems(0)
            setIsDone(false)
            runSetup()
          }}
          className="px-6 py-2.5 text-sm font-medium text-black bg-primary rounded-lg hover:bg-ak-pri-hover transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="space-y-6 text-center py-8" style={{ animation: 'scale-in 0.4s ease-out' }}>
        {/* Success orb */}
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_36px_rgba(245,158,11,0.22)]">
          <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 0,
                animation: 'check-draw 0.4s ease-out',
              }}
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-normal text-foreground">
            You're all set.
          </h2>
          <p className="text-sm text-muted-foreground font-heading italic">
            Akount is ready to work for you.
          </p>
        </div>

        <Link
          href="/overview"
          className="inline-flex items-center gap-1 text-sm text-primary hover:text-ak-pri-hover transition-colors"
        >
          Go to Dashboard
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          Setting things up
        </h2>
        <p className="text-sm text-muted-foreground font-heading italic">
          Akount is preparing your workspace...
        </p>
      </div>

      {/* Animated checklist */}
      <div className="space-y-3 max-w-xs mx-auto">
        {SETUP_ITEMS.map((item, i) => {
          const isComplete = i < completedItems
          const isCurrent = i === completedItems

          return (
            <div
              key={item}
              className={cn(
                'flex items-center gap-3 glass rounded-lg px-4 py-3 transition-all duration-300',
                isComplete && 'border-ak-border-2',
                isCurrent && 'border-primary/20',
              )}
            >
              {/* Status indicator */}
              <div className="shrink-0">
                {isComplete ? (
                  <svg className="h-5 w-5 text-ak-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path
                      d="M5 13l4 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 24,
                        strokeDashoffset: 0,
                        animation: 'check-draw 0.3s ease-out',
                      }}
                    />
                  </svg>
                ) : isCurrent ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--ak-glass-3)] border-t-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-[var(--ak-glass-2)]" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-sm transition-colors',
                  isComplete ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {item}
                {isCurrent && <span className="text-muted-foreground">...</span>}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
