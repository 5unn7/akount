import { Suspense } from 'react'
import { OnboardingWizard } from './components/OnboardingWizard'

/**
 * Onboarding Page
 *
 * Server component that renders the onboarding wizard.
 * The wizard is wrapped in a Suspense boundary for better loading states.
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingFallback />}>
      <OnboardingWizard />
    </Suspense>
  )
}

/**
 * Loading fallback component displayed while wizard initializes
 */
function OnboardingLoadingFallback() {
  return (
    <div className="space-y-8 py-12">
      {/* Header skeleton */}
      <div className="space-y-4 text-center">
        <div className="h-10 w-32 mx-auto animate-pulse bg-slate-200 rounded" />
        <div className="h-4 w-64 mx-auto animate-pulse bg-slate-100 rounded" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  )
}
