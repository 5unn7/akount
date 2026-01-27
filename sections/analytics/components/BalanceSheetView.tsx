import React, { useState } from 'react'
import {
  Download,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import type { BalanceSheetViewProps } from '../types'

export function BalanceSheetView({
  balanceSheetData,
  entities,
  selectedEntityId,
  asOfDate,
  onEntityChange,
  onDateChange,
  onAccountClick,
  onExport,
}: BalanceSheetViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['current-assets', 'fixed-assets', 'current-liabilities', 'long-term-liabilities', 'equity'])
  )

  // Format currency
  const formatCurrency = (value: number, showDecimals = false) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(Math.abs(value))
    return value < 0 ? `-${formatted}` : formatted
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Check if balance sheet balances
  const isBalanced = Math.abs(balanceSheetData.assets.totalAssets - balanceSheetData.liabilitiesAndEquity) < 0.01

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Balance Sheet</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              As of {new Date(balanceSheetData.asOfDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Entity Filter */}
            <div className="relative">
              <select
                value={selectedEntityId || 'all'}
                onChange={(e) => onEntityChange?.(e.target.value === 'all' ? undefined : e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs font-medium bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Entities</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => onDateChange?.(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs font-medium bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Export */}
            <button
              onClick={() => onExport?.('pdf')}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Balance Check Alert */}
        {!isBalanced && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">Balance Sheet Out of Balance</p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                Assets do not equal Liabilities + Equity. Please review your accounts.
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Total Assets */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Assets</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(balanceSheetData.assets.totalAssets)}
            </p>
          </div>

          {/* Total Liabilities */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Liabilities</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(balanceSheetData.liabilities.totalLiabilities)}
            </p>
          </div>

          {/* Total Equity */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/50">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Equity</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(balanceSheetData.equity.totalEquity)}
            </p>
          </div>
        </div>

        {/* Balance Sheet Statement */}
        <div className="space-y-6">
          {/* ASSETS */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">ASSETS</h2>
            </div>

            {/* Current Assets */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleSection('current-assets')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Current Assets</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balanceSheetData.assets.totalCurrentAssets)}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('current-assets') ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedSections.has('current-assets') && (
                <div className="px-4 pb-4 space-y-2">
                  {balanceSheetData.assets.currentAssets.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onAccountClick?.(item.account)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {item.account}
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fixed Assets */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleSection('fixed-assets')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fixed Assets</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balanceSheetData.assets.totalFixedAssets)}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('fixed-assets') ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedSections.has('fixed-assets') && (
                <div className="px-4 pb-4 space-y-2">
                  {balanceSheetData.assets.fixedAssets.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onAccountClick?.(item.account)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <span className={`text-sm flex items-center gap-2 ${
                        item.amount < 0
                          ? 'text-slate-500 dark:text-slate-400 italic'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {item.account}
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className={`text-sm font-medium ${
                        item.amount < 0
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Other Assets */}
            {balanceSheetData.assets.otherAssets.length > 0 && (
              <div className="border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => toggleSection('other-assets')}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Other Assets</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(balanceSheetData.assets.totalOtherAssets)}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('other-assets') ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedSections.has('other-assets') && (
                  <div className="px-4 pb-4 space-y-2">
                    {balanceSheetData.assets.otherAssets.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => onAccountClick?.(item.account)}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          {item.account}
                          <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatCurrency(item.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Total Assets */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">TOTAL ASSETS</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(balanceSheetData.assets.totalAssets)}
                </span>
              </div>
            </div>
          </div>

          {/* LIABILITIES & EQUITY */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">LIABILITIES & EQUITY</h2>
            </div>

            {/* Current Liabilities */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleSection('current-liabilities')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Current Liabilities</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balanceSheetData.liabilities.totalCurrentLiabilities)}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('current-liabilities') ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedSections.has('current-liabilities') && (
                <div className="px-4 pb-4 space-y-2">
                  {balanceSheetData.liabilities.currentLiabilities.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onAccountClick?.(item.account)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {item.account}
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Long-term Liabilities */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleSection('long-term-liabilities')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Long-term Liabilities</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balanceSheetData.liabilities.totalLongTermLiabilities)}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('long-term-liabilities') ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedSections.has('long-term-liabilities') && (
                <div className="px-4 pb-4 space-y-2">
                  {balanceSheetData.liabilities.longTermLiabilities.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onAccountClick?.(item.account)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {item.account}
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Total Liabilities */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Total Liabilities</span>
                <span className="text-base font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(balanceSheetData.liabilities.totalLiabilities)}
                </span>
              </div>
            </div>

            {/* Equity */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => toggleSection('equity')}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Equity</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(balanceSheetData.equity.totalEquity)}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.has('equity') ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expandedSections.has('equity') && (
                <div className="px-4 pb-4 space-y-2">
                  {balanceSheetData.equity.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onAccountClick?.(item.account)}
                      className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        {item.account}
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Total Liabilities & Equity */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  TOTAL LIABILITIES & EQUITY
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(balanceSheetData.liabilitiesAndEquity)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
