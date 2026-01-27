import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  CreditCard,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Calendar,
  Building2,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
} from 'lucide-react'
import type { AnalyticsDashboardProps } from '../types'

export function AnalyticsDashboard({
  metrics,
  cashFlowData,
  insights,
  entities,
  selectedEntityId,
  timePeriods,
  selectedPeriodId,
  onEntityChange,
  onPeriodChange,
  onViewCashFlow,
  onViewPL,
  onViewBalanceSheet,
  onExport,
}: AnalyticsDashboardProps) {
  const [insightsExpanded, setInsightsExpanded] = useState(false)

  // Get selected entity and period labels
  const selectedEntity = entities.find((e) => e.id === selectedEntityId)
  const selectedPeriod = timePeriods.find((p) => p.id === selectedPeriodId)

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

  // Get last 6 months for trend chart
  const recentCashFlow = cashFlowData.slice(-6)
  const maxFlow = Math.max(...recentCashFlow.map((d) => Math.max(d.inflow, d.outflow)))

  // Priority high insights
  const priorityInsights = insights.filter((i) => i.priority === 'high').slice(0, 2)

  const insightIcons = {
    opportunity: Sparkles,
    warning: AlertCircle,
    recommendation: Info,
    positive: CheckCircle,
  }

  const insightColors = {
    opportunity: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/50',
    warning: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/50',
    recommendation: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50',
    positive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Financial overview and insights
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Net Income */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {formatPercent(metrics.revenueGrowth)}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Net Income
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.netIncome)}
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950/50">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {formatPercent(metrics.profitMargin)}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Total Revenue
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.totalRevenue)}
            </p>
          </div>

          {/* Cash Balance */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-violet-100 dark:bg-violet-950/50">
                <Wallet className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Cash Balance
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.cashBalance)}
            </p>
          </div>

          {/* Net Worth */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-950/50">
                <PiggyBank className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Net Worth
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(metrics.netWorth)}
            </p>
          </div>
        </div>

        {/* AI Insights */}
        {priorityInsights.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-violet-50 dark:from-orange-950/20 dark:to-violet-950/20 backdrop-blur-sm rounded-lg border border-orange-200 dark:border-orange-800/50 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Priority Insights
                </h3>
              </div>
              {insights.length > 2 && (
                <button
                  onClick={() => setInsightsExpanded(!insightsExpanded)}
                  className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1"
                >
                  View All ({insights.length})
                  <ChevronRight className={`w-3 h-3 transition-transform ${insightsExpanded ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {(insightsExpanded ? insights : priorityInsights).map((insight) => {
                const Icon = insightIcons[insight.type]
                return (
                  <div
                    key={insight.id}
                    className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md ${insightColors[insight.type]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {insight.title}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium uppercase">
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                          {insight.description}
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {insight.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cash Flow Trend */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Cash Flow Trend
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Last 6 months
                </p>
              </div>
              <button
                onClick={onViewCashFlow}
                className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1"
              >
                View Details
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Simple bar chart */}
            <div className="space-y-3">
              {recentCashFlow.map((data, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {data.monthLabel}
                    </span>
                    <span
                      className={`font-semibold ${
                        data.net >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {formatCurrency(data.net)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {/* Inflow bar */}
                    <div
                      className="h-2 bg-emerald-500 dark:bg-emerald-600 rounded-full"
                      style={{ width: `${(data.inflow / maxFlow) * 100}%` }}
                    />
                    {/* Outflow bar */}
                    <div
                      className="h-2 bg-red-500 dark:bg-red-600 rounded-full"
                      style={{ width: `${(data.outflow / maxFlow) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Inflow</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Outflow</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Financial Summary
              </h3>
            </div>

            <div className="space-y-3">
              {/* Burn Rate */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Burn Rate</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(metrics.burnRate)}/mo
                </span>
              </div>

              {/* Accounts Receivable */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Accounts Receivable
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(metrics.accountsReceivable)}
                </span>
              </div>

              {/* Accounts Payable */}
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Accounts Payable
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(metrics.accountsPayable)}
                </span>
              </div>

              {/* Expense Ratio */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Expense Ratio</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatPercent(metrics.expenseRatio)}
                </span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onViewPL}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                P&L
              </button>
              <button
                onClick={onViewBalanceSheet}
                className="flex-1 px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Balance Sheet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
