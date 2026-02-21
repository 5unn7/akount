import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from './components/OnboardingWizard'

export const metadata: Metadata = {
  title: 'Get Started | Akount',
  description: 'Set up your Akount workspace in under 60 seconds',
}

async function getOnboardingProgress(token: string | null) {
  if (!token) {
    return { currentStep: 0, stepData: {}, version: 0, isNew: true }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

  try {
    const response = await fetch(`${apiUrl}/api/system/onboarding/resume`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!response.ok) {
      return { currentStep: 0, stepData: {}, version: 0, isNew: true }
    }

    return await response.json()
  } catch {
    return { currentStep: 0, stepData: {}, version: 0, isNew: true }
  }
}

export default async function OnboardingPage() {
  const { userId, getToken } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const token = await getToken()
  const resumeState = await getOnboardingProgress(token)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-xl">
        <OnboardingWizard initialState={resumeState} />
      </div>
    </div>
  )
}
