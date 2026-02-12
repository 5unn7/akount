import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { apiClient } from '@/lib/api/client'

export const metadata: Metadata = {
  title: 'Get Started | Akount',
  description: 'Complete your Akount setup in minutes',
}

interface OnboardingStatus {
  status: 'new' | 'in_progress' | 'completed'
  tenantId?: string
}

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // If already onboarded, redirect to dashboard (3s timeout to avoid hanging)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const onboarding = await apiClient<OnboardingStatus>(
      '/api/system/onboarding/status',
      { signal: controller.signal }
    )
    clearTimeout(timeout);
    if (onboarding.status === 'completed') {
      redirect('/overview')
    }
  } catch {
    // API down or status check failed — let user proceed to onboarding
  }

  return (
    <div className="min-h-screen bg-[#09090F] text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
