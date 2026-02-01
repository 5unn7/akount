import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Started | Akount',
  description: 'Complete your Akount setup in minutes',
}

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
