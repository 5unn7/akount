'use client'

import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { Eye, Briefcase, Receipt, Sparkles, Check } from 'lucide-react'

interface IntentStepProps {
  onNext: () => void
}

const INTENTS = [
  {
    id: 'track-spending',
    label: 'Track spending',
    description: 'See where every dollar goes',
    Icon: Eye,
    color: 'ak-green',
    dimBg: 'bg-ak-green-dim',
    textColor: 'text-ak-green',
    borderColor: 'border-ak-green/30',
    glow: 'glow-success',
  },
  {
    id: 'manage-business',
    label: 'Manage a business',
    description: 'Invoicing, expenses, cash flow',
    Icon: Briefcase,
    color: 'ak-blue',
    dimBg: 'bg-ak-blue-dim',
    textColor: 'text-ak-blue',
    borderColor: 'border-ak-blue/30',
    glow: 'glow-blue',
  },
  {
    id: 'prepare-taxes',
    label: 'Prepare for taxes',
    description: 'Stay organized for tax season',
    Icon: Receipt,
    color: 'ak-purple',
    dimBg: 'bg-ak-purple-dim',
    textColor: 'text-ak-purple',
    borderColor: 'border-ak-purple/30',
    glow: 'glow-purple',
  },
  {
    id: 'financial-clarity',
    label: 'Get financial clarity',
    description: 'Your full picture at a glance',
    Icon: Sparkles,
    color: 'primary',
    dimBg: 'bg-ak-pri-dim',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    glow: 'glow-primary',
  },
] as const

export function IntentStep({ onNext }: IntentStepProps) {
  const intents = useOnboardingStore((s) => s.intents)
  const toggleIntent = useOnboardingStore((s) => s.toggleIntent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          What brings you to Akount?
        </h2>
        <p className="text-sm text-muted-foreground">
          Select all that apply — we'll tailor your experience.
        </p>
      </div>

      {/* Intent cards — compact horizontal layout */}
      <div className="space-y-2 max-w-md mx-auto">
        {INTENTS.map(({ id, label, description, Icon, dimBg, textColor, borderColor, glow }) => {
          const isSelected = intents.includes(id)

          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleIntent(id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                'glass border',
                isSelected
                  ? cn(borderColor, glow)
                  : 'border-ak-border hover:border-ak-border-2 hover:-translate-y-px',
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? dimBg : 'bg-[var(--ak-glass-2)]',
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isSelected ? textColor : 'text-muted-foreground',
                  )}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <span className="text-xs text-muted-foreground ml-2">{description}</span>
              </div>

              {/* Check indicator */}
              <div
                className={cn(
                  'h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isSelected
                    ? cn(dimBg)
                    : 'border border-ak-border-2',
                )}
              >
                {isSelected && (
                  <Check className={cn('h-3 w-3', textColor)} strokeWidth={3} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Continue */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onNext}
          className={cn(
            'px-8 py-2.5 text-sm font-medium rounded-lg transition-all',
            intents.length > 0
              ? 'text-black bg-primary hover:bg-ak-pri-hover glow-primary'
              : 'text-muted-foreground glass-2 border border-ak-border hover:border-ak-border-2',
          )}
        >
          {intents.length > 0 ? 'Continue' : 'Skip for now'}
        </button>
      </div>
    </div>
  )
}
