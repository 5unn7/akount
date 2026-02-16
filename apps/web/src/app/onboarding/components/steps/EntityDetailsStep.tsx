'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { CountrySelect } from '@/components/ui/country-select'
import { getCurrencyForCountry, getAllCurrencies } from '@/lib/data/countries'

interface EntityDetailsStepProps {
  onNext: () => void
}

/**
 * Entity Details Step
 *
 * Second step where users enter business details:
 * - Entity name
 * - Entity type (sole proprietor, corporation, etc.)
 * - Country (searchable, global list)
 * - Currency (auto-set from country, overrideable)
 * - Fiscal year start month
 */
export function EntityDetailsStep({ onNext }: EntityDetailsStepProps) {
  const {
    entityName,
    entityType,
    country,
    currency,
    fiscalYearEnd,
    setEntityName,
    setEntityType,
    setCountry,
    setCurrency,
    setFiscalYearEnd,
    nextStep,
    tenantId,
  } = useOnboardingStore()

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const allCurrencies = getAllCurrencies()

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    setCurrency(getCurrencyForCountry(newCountry))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    // Validate required fields
    if (!entityName.trim()) {
      setApiError('Please enter a business name')
      return
    }

    if (!entityType) {
      setApiError('Please select an entity type')
      return
    }

    setIsLoading(true)

    try {
      // Get auth token from Clerk
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Clerk injects onto window at runtime
      const clerkWindow = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }
      const token = await clerkWindow.Clerk?.session?.getToken()

      if (!token) {
        throw new Error('Not authenticated')
      }

      // Call initialization endpoint
      const response = await fetch('/api/system/onboarding/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountType: 'personal', // Will vary based on wizard flow
          entityName: entityName.trim(),
          entityType,
          country,
          currency,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create workspace')
      }

      const data = await response.json()

      // Store tenant/entity IDs in Zustand
      useOnboardingStore.setState({
        tenantId: data.tenantId,
        entityId: data.entityId,
      })

      // Advance to next step
      nextStep()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-normal text-foreground">Tell us about your business</h2>
        <p className="text-muted-foreground">
          This information helps us set up your accounting system correctly
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {apiError && (
          <div className="rounded-lg bg-destructive/[0.08] border border-destructive/20 p-4 text-sm text-ak-red">
            {apiError}
          </div>
        )}

        {/* Business Name */}
        <div>
          <label htmlFor="entityName" className="block text-sm font-medium text-foreground mb-2">
            Business Name
          </label>
          <input
            type="text"
            id="entityName"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="e.g., Sunny's Design Studio"
            disabled={isLoading}
            className="w-full px-4 py-2 glass-2 border border-ak-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 text-foreground"
          />
        </div>

        {/* Entity Type */}
        <div>
          <label htmlFor="entityType" className="block text-sm font-medium text-foreground mb-2">
            Business Type
          </label>
          <select
            id="entityType"
            value={entityType || ''}
            onChange={(e) => setEntityType(e.target.value as 'PERSONAL' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'CORPORATION' | 'LLC')}
            disabled={isLoading}
            className="w-full px-4 py-2 glass-2 border border-ak-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 text-foreground"
          >
            <option value="">Select a business type</option>
            <option value="PERSONAL">Personal (Sole Proprietor)</option>
            <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
            <option value="PARTNERSHIP">Partnership</option>
            <option value="CORPORATION">Corporation</option>
            <option value="LLC">Limited Liability Company (LLC)</option>
          </select>
        </div>

        {/* Country and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Country
            </label>
            <CountrySelect
              value={country}
              onChange={handleCountryChange}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 glass-2 border border-ak-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 text-foreground"
            >
              {allCurrencies.map(c => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fiscal Year Start */}
        <div>
          <label htmlFor="fiscalYearEnd" className="block text-sm font-medium text-foreground mb-2">
            Fiscal Year Start Month
          </label>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1
              const monthName = new Date(2024, i).toLocaleString('default', {
                month: 'short',
              })
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setFiscalYearEnd(String(month))}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    fiscalYearEnd === String(month)
                      ? 'bg-primary text-black'
                      : 'glass border border-ak-border text-foreground hover:bg-ak-bg-3'
                  } disabled:opacity-50`}
                >
                  {monthName}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Most businesses use January. You can change this later.
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-2 text-sm font-medium text-black bg-primary rounded-lg hover:bg-ak-pri-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Setting up your workspace...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
