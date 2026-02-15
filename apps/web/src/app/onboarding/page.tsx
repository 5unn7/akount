import type { Metadata } from 'next'
import { OnboardingWizard } from './components/OnboardingWizard'

export const metadata: Metadata = {
  title: 'Get Started | Akount',
  description: 'Set up your Akount workspace in under 60 seconds',
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl">
        <OnboardingWizard />
      </div>
    </div>
  )
}
