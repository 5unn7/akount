'use client'

interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

/**
 * Progress indicator for the onboarding wizard
 * Shows which step the user is on and overall progress
 */
export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const progressPercent = ((currentStep + 1) / totalSteps) * 100

  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    number: i + 1,
    label: getStepLabel(i, totalSteps),
  }))

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i <= currentStep
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {i < currentStep ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span className="text-xs text-slate-600 text-center max-w-[80px]">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getStepLabel(stepIndex: number, totalSteps: number): string {
  if (totalSteps === 3) {
    // Personal flow: Welcome → Details → Complete
    return ['Welcome', 'Details', 'Complete'][stepIndex] || ''
  } else {
    // Business flow: Welcome → Details → COA → Complete
    return ['Welcome', 'Details', 'Review', 'Complete'][stepIndex] || ''
  }
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
