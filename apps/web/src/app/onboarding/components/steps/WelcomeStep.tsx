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
        <h1 className="text-3xl font-heading font-normal text-foreground">Welcome to Akount</h1>
        <p className="text-lg text-muted-foreground">
          Let's set up your financial command center
        </p>
      </div>

      {/* Subtitle */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-8">
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
      <div className="text-center text-sm text-muted-foreground">
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
      className={`group relative rounded-[14px] border p-6 text-left transition-all ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-[rgba(255,255,255,0.015)] border-[rgba(255,255,255,0.04)]'
          : highlighted
            ? 'border-primary bg-[rgba(245,158,11,0.06)] hover:border-[rgba(245,158,11,0.4)] glow-primary'
            : 'glass border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.13)] hover:bg-[rgba(255,255,255,0.04)]'
      }`}
    >
      {/* Badge */}
      {highlighted && (
        <div className="absolute top-3 right-3 bg-primary text-black text-xs font-semibold px-2 py-1 rounded-lg">
          Recommended
        </div>
      )}

      {disabled && (
        <div className="absolute top-3 right-3 bg-[rgba(255,255,255,0.06)] text-muted-foreground text-xs font-semibold px-2 py-1 rounded-lg">
          Coming soon
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-4">{icon}</div>

      {/* Title */}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      {/* Features list */}
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className="text-primary font-bold mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
