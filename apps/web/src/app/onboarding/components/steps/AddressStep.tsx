'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { CountrySelect } from '@/components/ui/country-select'
import { COUNTRIES } from '@/lib/data/countries'

interface AddressStepProps {
  onNext: () => void
}

export function AddressStep({ onNext }: AddressStepProps) {
  const {
    country,
    currency,
    streetAddress,
    city,
    province,
    postalCode,
    taxId,
    setCountry,
    setCurrency,
    setStreetAddress,
    setCity,
    setProvince,
    setPostalCode,
    setTaxId,
  } = useOnboardingStore()

  const [ipDetected, setIpDetected] = useState(false)

  // Infer country from IP on mount (only if not already set)
  useEffect(() => {
    if (country) return

    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
        if (!res.ok) return
        const data = await res.json()
        if (data.country_code) {
          const match = COUNTRIES.find((c) => c.code === data.country_code)
          if (match) {
            setCountry(match.code)
            setCurrency(match.currency)
            setIpDetected(true)
          }
        }
      } catch {
        // Silently fail — user will pick manually
      }
    }

    detectCountry()
  }, [country, setCountry, setCurrency])

  const handleCountryChange = (code: string) => {
    setCountry(code)
    const match = COUNTRIES.find((c) => c.code === code)
    if (match) setCurrency(match.currency)
    setIpDetected(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!country) return
    onNext()
  }

  const canSubmit = country.length > 0

  const inputClasses =
    'w-full px-4 py-2.5 glass-2 border border-ak-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none'
  const labelClasses =
    'block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          Your details
        </h2>
        <p className="text-sm text-muted-foreground">
          Country sets your currency and tax rules. Everything else is optional.
        </p>
      </div>

      <form
        id="address-form"
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto"
      >
        {/* Country */}
        <div>
          <label className={labelClasses}>Country</label>
          <CountrySelect value={country} onChange={handleCountryChange} />
          {ipDetected && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Detected from your location
            </p>
          )}
        </div>

        {/* Currency (read-only, derived from country) */}
        {currency && (
          <div>
            <label className={labelClasses}>Currency</label>
            <input
              type="text"
              value={currency}
              readOnly
              disabled
              className={cn(inputClasses, 'cursor-not-allowed opacity-60')}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Auto from country — change later in Settings
            </p>
          </div>
        )}

        {/* Street address */}
        <div>
          <label htmlFor="streetAddress" className={labelClasses}>
            Street Address <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="streetAddress"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="123 Main Street, Apt 4B"
            className={inputClasses}
          />
        </div>

        {/* City + Province */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className={labelClasses}>
              City <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Toronto"
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="province" className={labelClasses}>
              Province / State
            </label>
            <input
              type="text"
              id="province"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="ON"
              className={inputClasses}
            />
          </div>
        </div>

        {/* Postal code */}
        <div>
          <label htmlFor="postalCode" className={labelClasses}>
            Postal / Zip Code <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="M5V 1A1"
            className={inputClasses}
          />
        </div>

        {/* Tax ID (optional) */}
        <div>
          <label htmlFor="taxId" className={labelClasses}>
            Tax ID / Business Number <span className="text-muted-foreground/60 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            id="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="e.g., 123456789"
            maxLength={50}
            className={inputClasses}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Appears on your invoices. You can add this later in Settings.
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'px-8 py-2.5 text-sm font-medium rounded-lg transition-all',
              canSubmit
                ? 'text-black bg-primary hover:bg-ak-pri-hover glow-primary'
                : 'text-muted-foreground glass-2 border border-ak-border cursor-not-allowed opacity-60',
            )}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
