'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { GlassCard } from 'shadcn-glass-ui'

interface EssentialInfoStepProps {
  onNext: () => void
}

/**
 * Essential Info Step - Single Page Form
 *
 * Collects minimal information needed to create tenant and entity:
 * - Entity name (business/workspace name)
 * - Country (defaults to CA)
 * - Currency (auto-populated from country)
 *
 * Uses glass morphism design for zen, modern feel.
 * Total time to complete: ~60 seconds.
 */
export function EssentialInfoStep({ onNext }: EssentialInfoStepProps) {
  const router = useRouter()
  const {
    accountType,
    entityName,
    phoneNumber,
    timezone,
    country,
    currency,
    setEntityName,
    setPhoneNumber,
    setTimezone,
    setCountry,
    setCurrency,
  } = useOnboardingStore()

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Auto-detect timezone on component mount
  useEffect(() => {
    if (!timezone || timezone === 'America/Toronto') {
      try {
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (detectedTimezone) {
          setTimezone(detectedTimezone)
        }
      } catch (error) {
        console.log('Could not auto-detect timezone:', error)
      }
    }
  }, [])

  // Auto-update currency when country changes
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)

    // Auto-set currency based on country
    const currencyMap: Record<string, string> = {
      CA: 'CAD',
      US: 'USD',
      GB: 'GBP',
      AU: 'AUD',
      EU: 'EUR',
    }
    const newCurrency = currencyMap[newCountry] || 'CAD'
    setCurrency(newCurrency)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    // Validate required fields
    if (!entityName.trim()) {
      setApiError('Please enter a workspace name')
      return
    }

    if (!accountType) {
      setApiError('Account type not selected')
      return
    }

    setIsLoading(true)

    try {
      // Get auth token from Clerk
      const token = await (window as any).Clerk?.session?.getToken()

      if (!token) {
        throw new Error('Not authenticated')
      }

      // Determine entity type based on account type
      const entityTypeMap: Record<string, string> = {
        personal: 'PERSONAL',
        business: 'CORPORATION',
        accountant: 'CORPORATION',
      }
      const entityType = entityTypeMap[accountType]

      // Call initialization endpoint
      const response = await fetch('/api/onboarding/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountType,
          entityName: entityName.trim(),
          entityType,
          phoneNumber: phoneNumber.trim(),
          timezone,
          country,
          currency,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create workspace')
      }

      const data = await response.json()

      // Store tenant/entity IDs
      useOnboardingStore.setState({
        tenantId: data.tenantId,
        entityId: data.entityId,
      })

      // Auto-redirect to dashboard (2 second delay for success animation)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

      onNext()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Let's set up your workspace
        </h2>
        <p className="text-slate-600">Just a few quick details to get started</p>
      </div>

      {/* Glass Card Form */}
      <GlassCard className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error message */}
          {apiError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200">
              <p className="font-medium">Error</p>
              <p>{apiError}</p>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-900 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              For important account notifications
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-slate-900 mb-2">
              Time Zone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
            >
              <option value="America/Toronto">🇨🇦 Eastern Time (Toronto)</option>
              <option value="America/Vancouver">🇨🇦 Pacific Time (Vancouver)</option>
              <option value="America/Chicago">🇺🇸 Central Time (Chicago)</option>
              <option value="America/New_York">🇺🇸 Eastern Time (New York)</option>
              <option value="America/Los_Angeles">🇺🇸 Pacific Time (Los Angeles)</option>
              <option value="America/Denver">🇺🇸 Mountain Time (Denver)</option>
              <option value="Europe/London">🇬🇧 London (GMT/BST)</option>
              <option value="Europe/Paris">🇪🇺 Paris (CET/CEST)</option>
              <option value="Australia/Sydney">🇦🇺 Sydney (AEST/AEDT)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Auto-detected based on your location
            </p>
          </div>

          {/* Workspace Name */}
          <div>
            <label htmlFor="entityName" className="block text-sm font-medium text-slate-900 mb-2">
              {accountType === 'personal' ? 'Your Name' : 'Workspace Name'}
            </label>
            <input
              type="text"
              id="entityName"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder={
                accountType === 'personal'
                  ? 'e.g., John Smith'
                  : 'e.g., Sunny\'s Design Studio'
              }
              disabled={isLoading}
              required
              className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              {accountType === 'personal'
                ? 'This will be your workspace name'
                : 'You can change this later in settings'}
            </p>
          </div>

          {/* Country and Currency */}
          <div className="grid grid-cols-2 gap-4">
            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-slate-900 mb-2">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              >
                <option value="CA">🇨🇦 Canada</option>
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="AU">🇦🇺 Australia</option>
              </select>
            </div>

            {/* Currency (auto-filled, read-only) */}
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-900 mb-2">
                Currency
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="currency"
                  value={currency}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  Auto
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Based on your country
              </p>
            </div>
          </div>

          {/* Time estimate */}
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>This should only take about 60 seconds</span>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating your workspace...
                </span>
              ) : (
                'Create My Workspace →'
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Footer note */}
      <div className="text-center text-sm text-slate-500">
        <p>
          You can add more details later • Takes less than 60 seconds
        </p>
      </div>
    </div>
  )
}
