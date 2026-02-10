'use client'

import { useState } from 'react'
import { X, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { GlassCard } from 'shadcn-glass-ui'

interface GoalsSetupModalProps {
  onClose: () => void
  onComplete: () => void
}

export function GoalsSetupModal({ onClose, onComplete }: GoalsSetupModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    revenueTarget: '',
    expenseTarget: '',
    savingsTarget: '',
    timeframe: 'monthly',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // TODO: Save goals to database
      const response = await fetch('/api/goals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          revenueTarget: parseFloat(formData.revenueTarget) * 100, // Convert to cents
          expenseTarget: parseFloat(formData.expenseTarget) * 100,
          savingsTarget: parseFloat(formData.savingsTarget) * 100,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save goals')
      }

      // Update onboarding progress
      await fetch('/api/system/onboarding/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'goals_setup',
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
              <h2 className="text-2xl font-bold">Set Financial Goals</h2>
              <p className="text-sm text-slate-600 mt-1">
                Define your targets to track progress and get insights
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-900 border border-red-200">
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            )}

            {/* Timeframe */}
            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-slate-900 mb-2">
                Timeframe
              </label>
              <select
                id="timeframe"
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Revenue Target */}
            <div>
              <label htmlFor="revenueTarget" className="block text-sm font-medium text-slate-900 mb-2">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Revenue Target
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  id="revenueTarget"
                  value={formData.revenueTarget}
                  onChange={(e) => setFormData({ ...formData, revenueTarget: e.target.value })}
                  placeholder="10000"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  required
                  className="w-full pl-8 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                How much revenue do you want to generate?
              </p>
            </div>

            {/* Expense Target */}
            <div>
              <label htmlFor="expenseTarget" className="block text-sm font-medium text-slate-900 mb-2">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Expense Budget
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  id="expenseTarget"
                  value={formData.expenseTarget}
                  onChange={(e) => setFormData({ ...formData, expenseTarget: e.target.value })}
                  placeholder="5000"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  required
                  className="w-full pl-8 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Maximum amount you want to spend
              </p>
            </div>

            {/* Savings Target */}
            <div>
              <label htmlFor="savingsTarget" className="block text-sm font-medium text-slate-900 mb-2">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Savings Goal
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  id="savingsTarget"
                  value={formData.savingsTarget}
                  onChange={(e) => setFormData({ ...formData, savingsTarget: e.target.value })}
                  placeholder="5000"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  required
                  className="w-full pl-8 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                How much do you want to save? (Revenue - Expenses)
              </p>
            </div>

            {/* Calculated profit */}
            {formData.revenueTarget && formData.expenseTarget && (
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Projected Profit:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${(parseFloat(formData.revenueTarget) - parseFloat(formData.expenseTarget)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="flex-1 px-6 py-3 text-sm font-medium text-slate-700 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {isLoading ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  )
}
