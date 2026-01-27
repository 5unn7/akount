import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Activity,
  Filter,
} from 'lucide-react'
import type { CashFlowViewProps } from '../types'

export function CashFlowView({
  cashFlowData,
  categories,
  entities,
  selectedEntityId,
  timePeriods,
  selectedPeriodId,
  onEntityChange,
  onPeriodChange,
  onDataPointClick,
  onExport,
}: CashFlowViewProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')

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

  // Calculate summary stats
  const totalInflow = cashFlowData.reduce((sum, d) => sum + d.inflow, 0)
  const totalOutflow = cashFlowData.reduce((sum, d) => sum + d.outflow, 0)
  const totalNet = totalInflow - totalOutflow
  const avgMonthlyInflow = totalInflow / cashFlowData.length
  const avgMonthlyOutflow = totalOutflow / cashFlowData.length

  // For chart scaling
  const maxValue = Math.max(...cashFlowData.map((d) => Math.max(d.inflow, d.outflow)))
  const maxNet = Math.max(...cashFlowData.map((d) => Math.abs(d.net)))

  // Category breakdowns (filter by type)
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cash Flow Analysis</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Track money flowing in and out over time
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

            {/* View Toggle */}
            <div className="flex bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table
              </button>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Total Inflow */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50">
                <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Total Inflow
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalInflow)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Avg: {formatCurrency(avgMonthlyInflow)}/mo
            </p>
          </div>

          {/* Total Outflow */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-950/50">
                <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Total Outflow
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalOutflow)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Avg: {formatCurrency(avgMonthlyOutflow)}/mo
            </p>
          </div>

          {/* Net Cash Flow */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className={`p-1.5 rounded-md ${totalNet >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-red-100 dark:bg-red-950/50'}`}>
                <Activity className={`w-4 h-4 ${totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Net Cash Flow
            </p>
            <p className={`text-xl font-bold ${totalNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totalNet)}
            </p>
          </div>

          {/* Number of Periods */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/50">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Time Periods
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {cashFlowData.length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              months tracked
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                {viewMode === 'chart' ? 'Cash Flow Timeline' : 'Cash Flow Data'}
              </h3>

              {viewMode === 'chart' ? (
                /* Chart View */
                <div className="space-y-4">
                  {cashFlowData.map((data, i) => (
                    <div
                      key={i}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 transition-colors"
                      onClick={() => onDataPointClick?.(data.month)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {data.monthLabel}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            data.net >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
                        </span>
                      </div>

                      {/* Stacked bars */}
                      <div className="space-y-1">
                        {/* Inflow */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-12">In</span>
                          <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(data.inflow / maxValue) * 100}%` }}
                            >
                              {(data.inflow / maxValue) * 100 > 20 && (
                                <span className="text-[10px] font-semibold text-white">
                                  {formatCurrency(data.inflow)}
                                </span>
                              )}
                            </div>
                          </div>
                          {(data.inflow / maxValue) * 100 <= 20 && (
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
                              {formatCurrency(data.inflow)}
                            </span>
                          )}
                        </div>

                        {/* Outflow */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 w-12">Out</span>
                          <div className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${(data.outflow / maxValue) * 100}%` }}
                            >
                              {(data.outflow / maxValue) * 100 > 20 && (
                                <span className="text-[10px] font-semibold text-white">
                                  {formatCurrency(data.outflow)}
                                </span>
                              )}
                            </div>
                          </div>
                          {(data.outflow / maxValue) * 100 <= 20 && (
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
                              {formatCurrency(data.outflow)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr className="text-left">
                        <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300">Period</th>
                        <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300 text-right">Inflow</th>
                        <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300 text-right">Outflow</th>
                        <th className="pb-2 font-semibold text-slate-700 dark:text-slate-300 text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cashFlowData.map((data, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          onClick={() => onDataPointClick?.(data.month)}
                        >
                          <td className="py-2 font-medium text-slate-900 dark:text-white">
                            {data.monthLabel}
                          </td>
                          <td className="py-2 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatCurrency(data.inflow)}
                          </td>
                          <td className="py-2 text-right text-red-600 dark:text-red-400 font-semibold">
                            {formatCurrency(data.outflow)}
                          </td>
                          <td className={`py-2 text-right font-bold ${
                            data.net >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdowns */}
          <div className="space-y-6">
            {/* Income Categories */}
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Income Sources
                </h3>
              </div>

              <div className="space-y-2">
                {incomeCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full bg-${category.color}-500`}
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {category.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Expense Categories
                </h3>
              </div>

              <div className="space-y-2">
                {expenseCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full bg-${category.color}-500`}
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {category.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
