'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { OnboardingWizard } from '@/app/onboarding/components/OnboardingWizard'

/**
 * Onboarding Overlay
 *
 * Modal overlay that renders the onboarding wizard on top of the dashboard.
 * Appears when onboarding is incomplete. Dismissible via close button.
 * Dashboard chrome (sidebar, navbar) visible through the backdrop blur.
 */
export function OnboardingOverlay() {
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — dashboard visible through blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Atmospheric gradient wash */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-ak-purple/[0.015] blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl relative">
          {/* Close / dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -top-10 right-0 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            aria-label="Close and explore"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              I'll do this later
            </span>
            <X className="h-4 w-4" />
          </button>

          <OnboardingWizard />
        </div>
      </div>
    </div>
  )
}
