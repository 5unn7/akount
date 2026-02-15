import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Onboarding is now handled as an overlay on the dashboard.
  // Redirect all traffic to /overview where the overlay renders.
  redirect('/overview')
}
