'use client'

import { cn } from '@/lib/utils'
import { useOnboardingStore, type AccountType } from '@/stores/onboardingStore'
import { GlowCard } from '@/components/ui/glow-card'
import { User, Building2 } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

const ACCOUNT_TYPES = [
  {
    type: 'personal' as AccountType,
    label: 'Just me',
    description: 'Personal finances only',
    Icon: User,
  },
  {
    type: 'business' as AccountType,
    label: 'Me + my business',
    description: 'Personal and business together',
    Icon: Building2,
  },
] as const

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const accountType = useOnboardingStore((s) => s.accountType)
  const setAccountType = useOnboardingStore((s) => s.setAccountType)

  const handleSelect = (type: AccountType) => {
    setAccountType(type)
    onNext()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-normal text-foreground">
          Welcome to Akount
        </h1>
        <p className="text-muted-foreground">
          We'll help you understand and organize your money.
          <br />
          Who are we helping today?
        </p>
      </div>

      {/* Account type cards */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-lg mx-auto">
        {ACCOUNT_TYPES.map(({ type, label, description, Icon }) => {
          const isSelected = accountType === type

          return (
            <GlowCard
              key={type}
              variant="glass"
              className={cn(
                'cursor-pointer p-6 transition-all hover:-translate-y-px',
                isSelected
                  ? 'border-primary glow-primary'
                  : 'border-ak-border hover:border-ak-border-2',
              )}
              onClick={() => handleSelect(type)}
            >
              <div className="space-y-3">
                <div
                  className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
                    isSelected ? 'bg-ak-pri-dim text-primary' : 'bg-[var(--ak-glass-2)] text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-medium text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </GlowCard>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        You can always add a business later.
      </p>
    </div>
  )
}
