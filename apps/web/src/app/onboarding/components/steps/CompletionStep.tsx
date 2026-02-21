'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser, useSession } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { apiFetch } from '@/lib/api/client-browser'
import { COUNTRIES } from '@/lib/data/countries'
import Link from 'next/link'

const SETUP_ITEMS = [
  'Creating your account',
  'Setting up chart of accounts',
  'Configuring fiscal calendar',
  'Personalizing your dashboard',
] as const

export function CompletionStep() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user } = useUser()
  const { session } = useSession()
  const store = useOnboardingStore()
  const { reset, goToStep } = store

  const [completedItems, setCompletedItems] = useState(0)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSetup = useCallback(async () => {
    if (!userId) {
      goToStep(0)
      return
    }

    try {
      const state = useOnboardingStore.getState()

      // Derive personal entity name from Clerk user or fallback
      const personalEntityName =
        user?.fullName || user?.firstName || 'Personal'

      // Detect timezone from browser
      let detectedTimezone = 'America/Toronto'
      try {
        detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      } catch {
        // Keep default
      }

      // Step 1: Initialize — create tenant + personal entity
      let tenantId = state.tenantId
      let entityId = state.entityId

      if (!tenantId) {
        // Build business entity payload if user opted in
        const businessPayload =
          state.wantsBusinessEntity &&
          state.businessName &&
          state.businessEntityType &&
          state.businessCountry
            ? {
                businessEntity: {
                  name: state.businessName,
                  entityType: state.businessEntityType,
                  country: state.businessCountry,
                  currency:
                    COUNTRIES.find((c) => c.code === state.businessCountry)
                      ?.currency || 'USD',
                  ...(state.businessIndustry && {
                    industry: state.businessIndustry,
                  }),
                  ...(state.businessStreetAddress && {
                    streetAddress: state.businessStreetAddress,
                  }),
                  ...(state.businessCity && {
                    city: state.businessCity,
                  }),
                  ...(state.businessProvince && {
                    province: state.businessProvince,
                  }),
                  ...(state.businessPostalCode && {
                    postalCode: state.businessPostalCode,
                  }),
                },
              }
            : {}

        const initResult = await apiFetch<{
          tenantId: string
          entityId: string
          businessEntityId?: string
        }>('/api/system/onboarding/initialize', {
          method: 'POST',
          body: JSON.stringify({
            accountType: state.accountType || 'personal',
            entityName: personalEntityName,
            entityType: 'PERSONAL',
            timezone: detectedTimezone,
            country: state.country || 'CA',
            currency: state.currency || 'CAD',
            // Personal-first fields
            intents: state.intents.length > 0 ? state.intents : undefined,
            employmentStatus: state.employmentStatus || undefined,
            streetAddress: state.streetAddress || undefined,
            city: state.city || undefined,
            province: state.province || undefined,
            postalCode: state.postalCode || undefined,
            taxId: state.taxId || undefined,
            ...businessPayload,
          }),
        })

        tenantId = initResult.tenantId
        entityId = initResult.entityId
        useOnboardingStore.setState({ tenantId, entityId })
      }

      // Animate first two items
      await new Promise((r) => setTimeout(r, 500))
      setCompletedItems(1)

      // Step 2: Complete — finalize tenant, create COA + fiscal calendar
      await apiFetch('/api/system/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify({
          tenantId,
          entityName: personalEntityName,
          entityType: 'PERSONAL',
          country: state.country || 'CA',
          currency: state.currency || 'CAD',
          fiscalYearStart: 1, // January default for personal
        }),
      })

      // Force session token refresh so middleware sees updated publicMetadata
      // (onboardingCompleted: true was set by the API via Clerk backend)
      if (session) {
        try {
          await session.touch()
        } catch {
          // Non-critical — token will refresh on its own eventually
        }
      }

      // Animate remaining checklist items
      for (let i = 1; i < SETUP_ITEMS.length; i++) {
        await new Promise((r) => setTimeout(r, 500))
        setCompletedItems(i + 1)
      }

      // Show success
      await new Promise((r) => setTimeout(r, 400))
      setIsDone(true)

      // Clear store and redirect (session token should be fresh by now)
      reset()
      setTimeout(() => router.replace('/overview'), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'

      // If tenant already exists, try to recover gracefully
      if (
        message.includes('already has an active tenant') ||
        message.includes('AlreadyOnboarded')
      ) {
        try {
          const status = await apiFetch<{
            tenantId?: string
            status: string
          }>('/api/system/onboarding/status')
          if (status.tenantId) {
            // Tenant exists — try to complete
            useOnboardingStore.setState({
              tenantId: status.tenantId,
              entityId: 'existing',
            })
            setCompletedItems(SETUP_ITEMS.length)
            setIsDone(true)
            reset()
            setTimeout(() => router.replace('/overview'), 2000)
            return
          }
        } catch {
          // Fall through to error
        }
      }

      setError(message)
    }
  }, [userId, user, session, router, reset, goToStep])

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
      <div
        className="space-y-6 text-center py-8"
        style={{ animation: 'scale-in 0.4s ease-out' }}
      >
        {/* Success orb */}
        <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center glow-primary-strong">
          <svg
            className="h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
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
                  <svg
                    className="h-5 w-5 text-ak-green"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
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
                {isCurrent && (
                  <span className="text-muted-foreground">...</span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
