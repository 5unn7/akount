'use client'

import { useOnboardingStore, AccountType } from '@/stores/onboardingStore'

interface WelcomeStepProps {
  onNext: () => void
}

/**
 * Welcome Step - Account Type Selection
 *
 * First step of onboarding where users select between:
 * - Personal: Single freelancer or contractor
 * - Business: Company, corporation, or partnership
 * - Accountant: Accountant/bookkeeper managing multiple clients
 */
export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const setAccountType = useOnboardingStore((state) => state.setAccountType)

  const handleSelect = (type: AccountType) => {
    setAccountType(type)
    // Auto-advance to next step after selection
    onNext()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Welcome to Akount</h1>
        <p className="text-lg text-slate-600">
          Let's set up your financial command center
        </p>
      </div>

      {/* Subtitle */}
      <div className="text-center">
        <p className="text-sm text-slate-600 mb-8">
          Tell us a bit about yourself so we can customize your experience
        </p>
      </div>

      {/* Account Type Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Personal Card */}
        <AccountTypeCard
          title="Personal"
          description="Freelancer, contractor, or sole proprietor"
          icon="👤"
          onClick={() => handleSelect('personal')}
          features={[
            'Track income & expenses',
            'Simple tax reporting',
            'Basic financial insights',
          ]}
        />

        {/* Business Card */}
        <AccountTypeCard
          title="Business"
          description="Company, corporation, or partnership"
          icon="🏢"
          onClick={() => handleSelect('business')}
          features={[
            'Full bookkeeping suite',
            'Multi-currency support',
            'Advanced reporting',
          ]}
          highlighted
        />

        {/* Accountant Card */}
        <AccountTypeCard
          title="Accountant"
          description="Manage multiple client workspaces"
          icon="📊"
          onClick={() => handleSelect('accountant')}
          features={[
            'Client management',
            'Batch operations',
            'Team collaboration',
          ]}
          disabled
        />
      </div>

      {/* Footer note */}
      <div className="text-center text-sm text-slate-500">
        <p>You can change this anytime in settings</p>
      </div>
    </div>
  )
}

interface AccountTypeCardProps {
  title: string
  description: string
  icon: string
  onClick: () => void
  features: string[]
  highlighted?: boolean
  disabled?: boolean
}

function AccountTypeCard({
  title,
  description,
  icon,
  onClick,
  features,
  highlighted = false,
  disabled = false,
}: AccountTypeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative rounded-lg border-2 p-6 text-left transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
          : highlighted
            ? 'border-orange-500 bg-orange-50 hover:shadow-md hover:shadow-orange-100'
            : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md hover:shadow-slate-100'
      }`}
    >
      {/* Badge */}
      {highlighted && (
        <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded">
          Recommended
        </div>
      )}

      {disabled && (
        <div className="absolute top-3 right-3 bg-slate-300 text-slate-600 text-xs font-semibold px-2 py-1 rounded">
          Coming soon
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{description}</p>

      {/* Features list */}
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-orange-500 font-bold mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
