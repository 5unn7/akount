import { Suspense } from 'react'
import { OnboardingWizard } from './components/OnboardingWizard'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoadingFallback />}>
      <OnboardingWizard />
    </Suspense>
  )
}

function OnboardingLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      {/* Breathing orb */}
      <div className="h-10 w-10 rounded-full bg-primary/30 animate-pulse shadow-[0_0_36px_rgba(245,158,11,0.22)]" />
      <p className="text-sm text-muted-foreground font-heading italic">
        Preparing your experience...
      </p>
    </div>
  )
}
