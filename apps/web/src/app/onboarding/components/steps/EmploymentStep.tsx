'use client'

import { cn } from '@/lib/utils'
import {
  useOnboardingStore,
  type EmploymentStatus,
} from '@/stores/onboardingStore'
import {
  GraduationCap,
  Briefcase,
  Clock,
  Laptop,
  Rocket,
  Coffee,
  ShieldQuestion,
} from 'lucide-react'

interface EmploymentStepProps {
  onNext: () => void
}

const EMPLOYMENT_OPTIONS = [
  {
    id: 'student' as EmploymentStatus,
    label: 'Student',
    Icon: GraduationCap,
  },
  {
    id: 'employed-full-time' as EmploymentStatus,
    label: 'Employed full-time',
    Icon: Briefcase,
  },
  {
    id: 'employed-part-time' as EmploymentStatus,
    label: 'Employed part-time',
    Icon: Clock,
  },
  {
    id: 'self-employed' as EmploymentStatus,
    label: 'Self-employed / Freelance',
    Icon: Laptop,
  },
  {
    id: 'founder' as EmploymentStatus,
    label: 'Business owner / Founder',
    Icon: Rocket,
  },
  {
    id: 'not-working' as EmploymentStatus,
    label: 'Not currently working',
    Icon: Coffee,
  },
  {
    id: 'prefer-not-to-say' as EmploymentStatus,
    label: 'Prefer not to say',
    Icon: ShieldQuestion,
  },
] as const

export function EmploymentStep({ onNext }: EmploymentStepProps) {
  const employmentStatus = useOnboardingStore((s) => s.employmentStatus)
  const setEmploymentStatus = useOnboardingStore((s) => s.setEmploymentStatus)

  const handleSelect = (status: EmploymentStatus) => {
    setEmploymentStatus(status)
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-heading font-normal text-foreground">
          A little about you
        </h2>
        <p className="text-sm text-muted-foreground">
          This helps us show you the right tools and tips.
        </p>
      </div>

      {/* Employment options — single select, auto-advance */}
      <div className="space-y-2 max-w-md mx-auto">
        {EMPLOYMENT_OPTIONS.map(({ id, label, Icon }) => {
          const isSelected = employmentStatus === id

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                'glass border',
                isSelected
                  ? 'border-primary/30 glow-primary'
                  : 'border-ak-border hover:border-ak-border-2 hover:-translate-y-px',
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'bg-ak-pri-dim' : 'bg-[var(--ak-glass-2)]',
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] transition-colors',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
              </div>

              {/* Label */}
              <span className="text-sm font-medium text-foreground flex-1">
                {label}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
