import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react'
import type { PLViewProps } from '../types'

export function PLView({
  plData,
  entities,
  selectedEntityId,
  timePeriods,
  selectedPeriodId,
  onEntityChange,
  onPeriodChange,
  onCategoryClick,
  onExport,
}: PLViewProps) {
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

  // Format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const profitMargin = plData.netIncome / plData.totalRevenue

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Profit & Loss Statement
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {plData.period}
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

            {/* Time Period */}
            <div className="relative">
              <select
                value={selectedPeriodId}
                onChange={(e) => onPeriodChange?.(e.target.value)}
                className="appearance-none px-3 py-1.5 pr-8 text-xs font-medium bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {timePeriods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.label}
                  </option>
                ))}
              </select>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {/* Total Revenue */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50">
                <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Revenue</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(plData.totalRevenue)}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50">
                <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Expenses</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(plData.totalExpenses)}
            </p>
          </div>

          {/* Net Income */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${plData.netIncome >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
                <DollarSign className={`w-4 h-4 ${plData.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase">Net Income</p>
            </div>
            <p className={`text-2xl font-bold ${plData.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(plData.netIncome)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {formatPercent(profitMargin)} margin
            </p>
          </div>
        </div>

        {/* P&L Statement */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700">
          {/* Revenue Section */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Revenue</h3>
            </div>

            <div className="space-y-2">
              {plData.revenue.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onCategoryClick?.(item.category)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-12 text-right">
                      {formatPercent(item.percentage)}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white w-24 text-right">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </button>
              ))}

              {/* Total Revenue */}
              <div className="flex items-center justify-between py-2 px-3 mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Total Revenue
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(plData.totalRevenue)}
                </span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Expenses</h3>
            </div>

            <div className="space-y-2">
              {plData.expenses.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onCategoryClick?.(item.category)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium w-12 text-right">
                      {formatPercent(item.percentage)}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white w-24 text-right">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </button>
              ))}

              {/* Total Expenses */}
              <div className="flex items-center justify-between py-2 px-3 mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Total Expenses
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(plData.totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Net Income Section */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Net Income</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Revenue - Expenses
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${plData.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(plData.netIncome)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {formatPercent(profitMargin)} profit margin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
