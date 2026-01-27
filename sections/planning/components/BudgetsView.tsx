import React, { useState } from 'react'
import {
  Plus,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
} from 'lucide-react'
import type { BudgetsViewProps } from '../types'

export function BudgetsView({
  budgets,
  entities,
  categories,
  timePeriods,
  selectedEntityId,
  selectedPeriodId,
  onEntityChange,
  onPeriodChange,
  onCreate,
  onEdit,
  onDelete,
  onBudgetClick,
}: BudgetsViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Calculate summary stats
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgetedAmount, 0)
  const totalActual = budgets.reduce((sum, b) => sum + b.actualAmount, 0)
  const totalVariance = totalBudgeted - totalActual
  const overallPercentUsed = (totalActual / totalBudgeted) * 100

  // Status counts
  const onTrackCount = budgets.filter((b) => b.status === 'on-track').length
  const warningCount = budgets.filter((b) => b.status === 'warning').length
  const exceededCount = budgets.filter((b) => b.status === 'exceeded').length

  const statusConfig = {
    'on-track': {
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      border: 'border-emerald-200 dark:border-emerald-800',
      barColor: 'bg-emerald-500 dark:bg-emerald-600',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/50',
      border: 'border-amber-200 dark:border-amber-800',
      barColor: 'bg-amber-500 dark:bg-amber-600',
    },
    exceeded: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/50',
      border: 'border-red-200 dark:border-red-800',
      barColor: 'bg-red-500 dark:bg-red-600',
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
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
        </div>

        <button
          onClick={() => onCreate?.({})}
          className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Budget
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Total Budgeted */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Total Budgeted
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalBudgeted)}
          </p>
        </div>

        {/* Total Spent */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Total Spent
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalActual)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {overallPercentUsed.toFixed(1)}% used
          </p>
        </div>

        {/* Remaining */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Remaining
          </p>
          <p className={`text-xl font-bold ${totalVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(totalVariance)}
          </p>
        </div>

        {/* Status Summary */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Status
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {onTrackCount} OK
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              {warningCount} Warning
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
              {exceededCount} Over
            </span>
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-3">
        {budgets.map((budget) => {
          const config = statusConfig[budget.status]
          const StatusIcon = config.icon

          return (
            <div
              key={budget.id}
              onClick={() => onBudgetClick?.(budget.id)}
              className={`bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border ${config.border} p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-md ${config.bg} shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {budget.categoryName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {budget.entityName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {budget.periodLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatCurrency(budget.actualAmount)} / {formatCurrency(budget.budgetedAmount)}
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${budget.variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {budget.variance >= 0 ? '+' : ''}{formatCurrency(budget.variance)} remaining
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">
                    {budget.percentUsed.toFixed(1)}% used
                  </span>
                  <span className={`font-medium ${config.color}`}>
                    {budget.status === 'on-track' && 'On Track'}
                    {budget.status === 'warning' && 'Approaching Limit'}
                    {budget.status === 'exceeded' && 'Over Budget'}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.barColor} rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {budgets.length === 0 && (
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              No budgets found
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Create your first budget to start tracking spending
            </p>
            <button
              onClick={() => onCreate?.({})}
              className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Create Budget
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
