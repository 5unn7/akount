'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiFetch } from './client-browser'

/**
 * Onboarding Progress Types
 */
export interface OnboardingProgress {
  completionPercentage: number
  completedSteps: string[]
  basicInfoComplete: boolean
  entitySetupComplete: boolean
  businessDetailsComplete: boolean
  bankConnectionComplete: boolean
  goalsSetupComplete: boolean
  dashboardCardDismissedAt: string | null
  skippedSteps: string[]
}

export interface UpdateProgressRequest {
  step: 'basic_info' | 'entity_setup' | 'business_details' | 'bank_connection' | 'goals_setup'
  completed: boolean
}

export interface SkipStepRequest {
  step: 'basic_info' | 'entity_setup' | 'business_details' | 'bank_connection' | 'goals_setup'
  skipDays?: number
}

/**
 * React Query hook for fetching onboarding progress
 *
 * Shared across OnboardingHeroCard and SidebarProgressIndicator.
 * Prevents duplicate API calls.
 *
 * @example
 * ```tsx
 * const { data: progress, isLoading } = useOnboardingProgress()
 * ```
 */
export function useOnboardingProgress() {
  return useQuery({
    queryKey: ['onboarding', 'progress'],
    queryFn: async (): Promise<OnboardingProgress> => {
      return await apiFetch<OnboardingProgress>('/api/system/onboarding/progress')
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Mutation hook for updating step completion
 *
 * @example
 * ```tsx
 * const updateProgress = useUpdateProgress()
 * updateProgress.mutate({ step: 'bank_connection', completed: true })
 * ```
 */
export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProgressRequest) => {
      return await apiFetch('/api/system/onboarding/update-progress', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate progress query to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] })
      toast.success('Progress updated')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update progress: ${error.message}`)
    },
  })
}

/**
 * Mutation hook for skipping a step
 *
 * @example
 * ```tsx
 * const skipStep = useSkipStep()
 * skipStep.mutate({ step: 'business_details', skipDays: 7 })
 * ```
 */
export function useSkipStep() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SkipStepRequest) => {
      return await apiFetch('/api/system/onboarding/skip-step', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] })
      toast.success(`Step skipped for ${variables.skipDays || 7} days`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to skip step: ${error.message}`)
    },
  })
}

/**
 * Mutation hook for dismissing the dashboard card
 *
 * @example
 * ```tsx
 * const dismissCard = useDismissCard()
 * dismissCard.mutate()
 * ```
 */
export function useDismissCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await apiFetch('/api/system/onboarding/dismiss-card', {
        method: 'POST',
        body: JSON.stringify({}),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'progress'] })
      toast.success('Card dismissed for 24 hours')
    },
    onError: (error: Error) => {
      toast.error(`Failed to dismiss card: ${error.message}`)
    },
  })
}

/**
 * Helper: Check if card should be shown
 *
 * Card is shown if:
 * - Progress < 100%
 * - Not dismissed, or dismissal expired (>24 hours ago)
 */
export function shouldShowOnboardingCard(progress: OnboardingProgress | undefined): boolean {
  if (!progress) return false
  if (progress.completionPercentage >= 100) return false

  if (progress.dashboardCardDismissedAt) {
    const dismissedAt = new Date(progress.dashboardCardDismissedAt)
    const now = new Date()
    const hoursSinceDismissal = (now.getTime() - dismissedAt.getTime()) / (1000 * 60 * 60)
    return hoursSinceDismissal > 24 // Show again after 24 hours
  }

  return true
}
