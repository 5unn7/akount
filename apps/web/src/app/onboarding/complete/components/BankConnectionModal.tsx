'use client'

import { useState } from 'react'
import { X, Building2, CheckCircle } from 'lucide-react'
import { GlassCard } from 'shadcn-glass-ui'

interface BankConnectionModalProps {
  onClose: () => void
  onComplete: () => void
}

export function BankConnectionModal({ onClose, onComplete }: BankConnectionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setError(null)
    setIsLoading(true)

    try {
      // TODO: Integrate with Plaid Link
      // For now, just mark as complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update onboarding progress
      await fetch('/api/system/onboarding/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'bank_connection',
          completed: true,
        }),
      })

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSkip() {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Connect Your Bank</h2>
              <p className="text-sm text-slate-600 mt-1">
                Automatically sync transactions and reconcile accounts
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200 mb-6">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* Coming Soon Message */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
              <Building2 className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bank Integration Coming Soon</h3>
            <p className="text-slate-600 mb-6">
              We're working on integrating with Plaid to bring you secure, automatic bank connections.
              For now, you can manually import transactions or skip this step.
            </p>

            {/* Benefits list */}
            <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
              <h4 className="font-semibold mb-3">What you'll get:</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Automatic transaction sync from 10,000+ banks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Real-time balance updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">AI-powered categorization</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Bank-level security (256-bit encryption)</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-slate-500">
              You can manually add accounts and import transactions in the Banking section.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 px-6 py-3 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
            >
              Skip for now
            </button>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? 'Connecting...' : 'Mark as Complete (Demo)'}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
