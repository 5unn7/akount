import React from 'react'
import {
  Plus,
  Calendar,
  Building2,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  ArrowRight,
} from 'lucide-react'
import type { GoalsViewProps } from '../types'

export function GoalsView({
  goals,
  entities,
  timePeriods,
  selectedEntityId,
  selectedPeriodId,
  onEntityChange,
  onPeriodChange,
  onCreate,
  onEdit,
  onDelete,
  onGoalClick,
  onContribute,
}: GoalsViewProps) {
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
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalRemainingAmount = goals.reduce((sum, g) => sum + g.remainingAmount, 0)
  const overallProgress = (totalCurrentAmount / totalTargetAmount) * 100

  // Type icons and colors
  const typeConfig = {
    savings: {
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      label: 'Savings',
    },
    'debt-paydown': {
      icon: TrendingDown,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/50',
      label: 'Debt Paydown',
    },
    retirement: {
      icon: DollarSign,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-950/50',
      label: 'Retirement',
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
          New Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {/* Total Target */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Total Target
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalTargetAmount)}
          </p>
        </div>

        {/* Current Progress */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Current Progress
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalCurrentAmount)}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {overallProgress.toFixed(1)}% complete
          </p>
        </div>

        {/* Remaining */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Remaining
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalRemainingAmount)}
          </p>
        </div>

        {/* Active Goals */}
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
            Active Goals
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {goals.length}
          </p>
        </div>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const config = typeConfig[goal.type]
          const TypeIcon = config.icon
          const isOnTrack = goal.status === 'on-track'

          return (
            <div
              key={goal.id}
              onClick={() => onGoalClick?.(goal.id)}
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-md ${config.bg} shrink-0`}>
                    <TypeIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {goal.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {goal.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400">
                        {goal.entityName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-3 mb-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400">
                      {goal.percentComplete.toFixed(1)}% complete
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goal.percentComplete, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Time Left</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {goal.monthsRemaining} {goal.monthsRemaining === 1 ? 'month' : 'months'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {new Date(goal.targetDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Monthly</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(goal.suggestedMonthlyContribution)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      suggested
                    </p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onContribute?.(goal.id)
                }}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-1.5"
              >
                Make Contribution
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )
        })}

        {goals.length === 0 && (
          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
            <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              No goals found
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
              Set your first financial goal to start tracking progress
            </p>
            <button
              onClick={() => onCreate?.({})}
              className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Create Goal
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
