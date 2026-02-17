'use client'

import { cn } from '@/lib/utils'
import { useOnboardingStore, type EntityType } from '@/stores/onboardingStore'
import { CountrySelect } from '@/components/ui/country-select'
import { Building2, User } from 'lucide-react'

interface BusinessSetupStepProps {
  onNext: () => void
}

const ENTITY_TYPES = [
  { value: 'SOLE_PROPRIETORSHIP' as EntityType, label: 'Sole Proprietorship' },
  { value: 'LLC' as EntityType, label: 'LLC' },
  { value: 'CORPORATION' as EntityType, label: 'Corporation' },
  { value: 'PARTNERSHIP' as EntityType, label: 'Partnership' },
] as const

const INDUSTRIES = [
  { value: '', label: 'Select industry (optional)...' },
  { value: 'technology', label: 'Technology' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'creative', label: 'Creative & Design' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'other', label: 'Other' },
] as const

export function BusinessSetupStep({ onNext }: BusinessSetupStepProps) {
  const {
    wantsBusinessEntity,
    businessName,
    businessEntityType,
    businessCountry,
    businessIndustry,
    setWantsBusinessEntity,
    setBusinessName,
    setBusinessEntityType,
    setBusinessCountry,
    setBusinessIndustry,
  } = useOnboardingStore()

  const handleYes = () => {
    setWantsBusinessEntity(true)
  }

  const handleNotNow = () => {
    setWantsBusinessEntity(false)
    onNext()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim() || !businessEntityType || !businessCountry) return
    onNext()
  }

  const canSubmit =
    businessName.trim().length > 0 &&
    businessEntityType !== null &&
    businessCountry.length > 0

  const inputClasses =
    'w-full px-4 py-2.5 glass-2 border border-ak-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none'
  const selectClasses = cn(
    inputClasses,
    'appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27%2371717A%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cpath%20d%3D%27M7%2010l5%205%205-5z%27%2F%3E%3C%2Fsvg%3E")]',
  )
  const labelClasses =
    'block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5'

  // Initial state: show Yes/Not Now choice
  if (!wantsBusinessEntity) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-heading font-normal text-foreground">
            Want to track your business separately?
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Since you're self-employed, you can keep personal and business
            finances separate. This helps with taxes and clarity.
          </p>
        </div>

        {/* Yes / Not now cards */}
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleYes}
            className="glass border border-ak-border hover:border-primary/30 hover:-translate-y-px rounded-xl p-6 text-left transition-all space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-ak-blue-dim flex items-center justify-center">
              <Building2 className="h-5 w-5 text-ak-blue" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Yes, set up business
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I want separate tracking
            </p>
          </button>

          <button
            type="button"
            onClick={handleNotNow}
            className="glass border border-ak-border hover:border-ak-border-2 hover:-translate-y-px rounded-xl p-6 text-left transition-all space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-[var(--ak-glass-2)] flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">
              Not right now
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I'll add it later if needed
            </p>
          </button>
        </div>
      </div>
    )
  }

  // Business form
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          Tell us about your business
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll create a separate space for business finances.
        </p>
      </div>

      <form
        id="business-setup-form"
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto"
      >
        {/* Business name */}
        <div>
          <label htmlFor="businessName" className={labelClasses}>
            Business Name
          </label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Acme Consulting"
            required
            className={inputClasses}
          />
        </div>

        {/* Entity type */}
        <div>
          <label htmlFor="businessEntityType" className={labelClasses}>
            Entity Type
          </label>
          <select
            id="businessEntityType"
            value={businessEntityType ?? ''}
            onChange={(e) =>
              setBusinessEntityType(e.target.value as EntityType)
            }
            required
            className={selectClasses}
          >
            <option value="" disabled>
              Select type...
            </option>
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Country of incorporation */}
        <div>
          <label className={labelClasses}>Country of Incorporation</label>
          <CountrySelect
            value={businessCountry}
            onChange={setBusinessCountry}
          />
        </div>

        {/* Industry (optional) */}
        <div>
          <label htmlFor="businessIndustry" className={labelClasses}>
            Industry
          </label>
          <select
            id="businessIndustry"
            value={businessIndustry}
            onChange={(e) => setBusinessIndustry(e.target.value)}
            className={selectClasses}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
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
