'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'

interface EntityDetailsStepProps {
  onNext: () => void
}

/**
 * Entity Details Step
 *
 * Second step where users enter business details:
 * - Entity name
 * - Entity type (sole proprietor, corporation, etc.)
 * - Country
 * - Currency
 * - Fiscal year start month
 */
export function EntityDetailsStep({ onNext }: EntityDetailsStepProps) {
  const {
    entityName,
    entityType,
    country,
    currency,
    fiscalYearStart,
    setEntityName,
    setEntityType,
    setCountry,
    setCurrency,
    setFiscalYearStart,
    nextStep,
    tenantId,
  } = useOnboardingStore()

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

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
      const token = await (window as any).Clerk?.session?.getToken()

      if (!token) {
        throw new Error('Not authenticated')
      }

      // Call initialization endpoint
      const response = await fetch('/api/onboarding/initialize', {
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
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your business</h2>
        <p className="text-slate-600">
          This information helps us set up your accounting system correctly
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {apiError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900">
            {apiError}
          </div>
        )}

        {/* Business Name */}
        <div>
          <label htmlFor="entityName" className="block text-sm font-medium text-slate-900 mb-2">
            Business Name
          </label>
          <input
            type="text"
            id="entityName"
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="e.g., Sunny's Design Studio"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        {/* Entity Type */}
        <div>
          <label htmlFor="entityType" className="block text-sm font-medium text-slate-900 mb-2">
            Business Type
          </label>
          <select
            id="entityType"
            value={entityType || ''}
            onChange={(e) => setEntityType(e.target.value as any)}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
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
            <label htmlFor="country" className="block text-sm font-medium text-slate-900 mb-2">
              Country
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="CA">Canada</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-900 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
        </div>

        {/* Fiscal Year Start */}
        <div>
          <label htmlFor="fiscalYearStart" className="block text-sm font-medium text-slate-900 mb-2">
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
                  onClick={() => setFiscalYearStart(month)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    fiscalYearStart === month
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {monthName}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Most Canadian businesses use January. You can change this later.
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Setting up your workspace...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}
