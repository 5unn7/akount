'use client'

import { useState, useEffect } from 'react'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { apiFetch } from '@/lib/api/client-browser'
import { cn } from '@/lib/utils'
import { User, Globe, Settings2 } from 'lucide-react'

interface EssentialInfoStepProps {
  onNext: () => void
}

const COUNTRIES = [
  { value: 'CA', label: 'Canada', currency: 'CAD' },
  { value: 'US', label: 'United States', currency: 'USD' },
  { value: 'GB', label: 'United Kingdom', currency: 'GBP' },
  { value: 'AU', label: 'Australia', currency: 'AUD' },
] as const

const TIMEZONES = [
  { value: 'America/Toronto', label: 'Eastern (Toronto)' },
  { value: 'America/Vancouver', label: 'Pacific (Vancouver)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
] as const

const INDUSTRIES = [
  { value: '', label: 'Select industry...' },
  { value: 'technology', label: 'Technology' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'other', label: 'Other' },
] as const

const FISCAL_MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

export function EssentialInfoStep({ onNext }: EssentialInfoStepProps) {
  const {
    accountType,
    entityName,
    phoneNumber,
    timezone,
    country,
    currency,
    industry,
    fiscalYearEnd,
    setEntityName,
    setPhoneNumber,
    setTimezone,
    setCountry,
    setCurrency,
    setIndustry,
    setFiscalYearEnd,
  } = useOnboardingStore()

  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Auto-detect timezone
  useEffect(() => {
    if (!timezone || timezone === 'America/Toronto') {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (detected) setTimezone(detected)
      } catch {
        // Keep default
      }
    }
  }, [timezone, setTimezone])

  // Health check on mount — fail fast if API is unreachable
  useEffect(() => {
    const checkAPIHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const response = await fetch(`${apiUrl}/health`, { method: 'GET' })
        if (!response.ok) {
          setApiError(
            'API server is not responding. Please ensure the API server is running (npm run dev at root).'
          )
        }
      } catch (error) {
        setApiError(
          'Cannot connect to API server. Please run "npm run dev" at the project root to start all services.'
        )
      }
    }

    checkAPIHealth()
  }, [])

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry)
    const match = COUNTRIES.find((c) => c.value === newCountry)
    if (match) setCurrency(match.currency)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!entityName.trim()) {
      setApiError('Please enter a name for your workspace')
      return
    }

    if (!accountType) {
      setApiError('Account type not selected')
      return
    }

    setIsLoading(true)

    try {
      const entityType = accountType === 'personal' ? 'PERSONAL' : 'CORPORATION'
      useOnboardingStore.setState({ entityType: entityType as 'PERSONAL' | 'CORPORATION' })

      const data = await apiFetch<{ tenantId: string; entityId: string }>(
        '/api/system/onboarding/initialize',
        {
          method: 'POST',
          body: JSON.stringify({
            accountType,
            entityName: entityName.trim(),
            entityType,
            ...(phoneNumber.trim() && { phoneNumber: phoneNumber.trim() }),
            timezone,
            country,
            currency,
          }),
        }
      )

      useOnboardingStore.setState({
        tenantId: data.tenantId,
        entityId: data.entityId,
      })

      onNext()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'

      // If tenant already exists, try to recover
      if (message.includes('already has an active tenant')) {
        try {
          const status = await apiFetch<{ tenantId?: string; status: string }>(
            '/api/system/onboarding/status'
          )
          if (status.tenantId) {
            useOnboardingStore.setState({
              tenantId: status.tenantId,
              entityId: 'existing',
            })
            onNext()
            return
          }
        } catch {
          // Fall through
        }
      }

      setApiError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses = 'w-full px-4 py-2.5 glass-2 border border-ak-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/40 disabled:opacity-50 transition-all outline-none'
  const selectClasses = cn(inputClasses, 'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%2371717A%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27M7%2010l5%205%205-5z%27%2F%3E%3C%2Fsvg%3E")]')
  const labelClasses = 'block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          Set up your workspace
        </h2>
        <p className="text-sm text-muted-foreground">
          A few details so Akount can work its best for you.
        </p>
      </div>

      {/* Error */}
      {apiError && (
        <div className="rounded-lg bg-destructive/[0.08] p-3 text-sm text-ak-red border border-destructive/20">
          {apiError}
        </div>
      )}

      <form id="workspace-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1 — Identity */}
        <FormSection icon={User} label="Identity">
          <div className="space-y-4">
            <div>
              <label htmlFor="entityName" className={labelClasses}>
                {accountType === 'personal' ? 'Your Name' : 'Business Name'}
              </label>
              <input
                type="text"
                id="entityName"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={accountType === 'personal' ? 'e.g., John Smith' : "e.g., Sunny's Studio"}
                disabled={isLoading}
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className={labelClasses}>
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
                className={inputClasses}
              />
            </div>
          </div>
        </FormSection>

        {/* Section 2 — Location */}
        <FormSection icon={Globe} label="Location">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="country" className={labelClasses}>
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                disabled={isLoading}
                className={selectClasses}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="currency" className={labelClasses}>
                Currency
              </label>
              <input
                type="text"
                id="currency"
                value={currency}
                readOnly
                disabled
                className={cn(inputClasses, 'cursor-not-allowed opacity-60')}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Auto from country</p>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="timezone" className={labelClasses}>
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading}
              className={selectClasses}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-1">Auto-detected from your browser</p>
          </div>
        </FormSection>

        {/* Section 3 — Preferences */}
        <FormSection icon={Settings2} label="Preferences">
          <div className={accountType === 'business' ? 'grid grid-cols-2 gap-4' : ''}>
            {accountType === 'business' && (
              <div>
                <label htmlFor="industry" className={labelClasses}>
                  Industry
                </label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  disabled={isLoading}
                  className={selectClasses}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="fiscalYearEnd" className={labelClasses}>
                Fiscal Year End
              </label>
              <select
                id="fiscalYearEnd"
                value={fiscalYearEnd}
                onChange={(e) => setFiscalYearEnd(e.target.value)}
                disabled={isLoading}
                className={selectClasses}
              >
                {FISCAL_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Most use December. You can change this later.
              </p>
            </div>
          </div>
        </FormSection>
      </form>
    </div>
  )
}

function FormSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="glass-2 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
