'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { GlassCard } from 'shadcn-glass-ui'

interface BusinessDetailsModalProps {
  onClose: () => void
  onComplete: () => void
}

export function BusinessDetailsModal({ onClose, onComplete }: BusinessDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    taxId: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    industry: '',
    businessSize: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Update entity with business details
      const response = await fetch('/api/system/entity/business-details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save business details')
      }

      // Update onboarding progress
      await fetch('/api/system/onboarding/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'business_details',
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
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Business Details</h2>
              <p className="text-sm text-slate-600 mt-1">
                Help us understand your business better
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

            {/* Tax ID */}
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-slate-900 mb-2">
                Tax ID / Business Number (Optional)
              </label>
              <input
                type="text"
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                placeholder="e.g., 123456789"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">
                Your EIN, GST/HST number, or similar identifier
              </p>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-900 mb-2">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., 123 Main Street"
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-slate-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Toronto"
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-slate-900 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="M5V 3A8"
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-900 mb-2">
                Province / State
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g., Ontario"
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              />
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-900 mb-2">
                Industry
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              >
                <option value="">Select an industry</option>
                <option value="technology">Technology & Software</option>
                <option value="consulting">Consulting & Professional Services</option>
                <option value="creative">Creative & Design</option>
                <option value="retail">Retail & E-commerce</option>
                <option value="food">Food & Beverage</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education & Training</option>
                <option value="real-estate">Real Estate</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Business Size */}
            <div>
              <label htmlFor="businessSize" className="block text-sm font-medium text-slate-900 mb-2">
                Business Size
              </label>
              <select
                id="businessSize"
                value={formData.businessSize}
                onChange={(e) => setFormData({ ...formData, businessSize: e.target.value })}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 transition-all"
              >
                <option value="">Select business size</option>
                <option value="SOLO">Just me (Solo)</option>
                <option value="2-10">2-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="50+">50+ employees</option>
              </select>
            </div>

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
                {isLoading ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  )
}
