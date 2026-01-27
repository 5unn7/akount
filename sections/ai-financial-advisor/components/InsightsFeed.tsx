import React, { useState } from 'react'
import {
  Sparkles,
  TrendingDown,
  Receipt,
  Gift,
  Zap,
  ThumbsUp,
  ThumbsDown,
  X,
  Check,
  Share2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Target,
} from 'lucide-react'
import type { InsightsFeedProps } from '../types'

export function InsightsFeed({
  insights,
  onDismiss,
  onApply,
  onFeedback,
  onShare,
  onInsightClick,
  onViewRelatedTransactions,
  priorityFilter = 'all',
  typeFilter = 'all',
  onPriorityFilterChange,
  onTypeFilterChange,
}: InsightsFeedProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set())

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Filter insights
  const filteredInsights = insights.filter((insight) => {
    if (priorityFilter !== 'all' && insight.priority !== priorityFilter) return false
    if (typeFilter !== 'all' && insight.type !== typeFilter) return false
    return true
  })

  // Type config
  const typeConfig = {
    spending: {
      icon: TrendingDown,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-950/50',
      label: 'Spending',
    },
    tax: {
      icon: Receipt,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      label: 'Tax',
    },
    subsidy: {
      icon: Gift,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-100 dark:bg-violet-950/50',
      label: 'Subsidy',
    },
    rule: {
      icon: Zap,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-950/50',
      label: 'Automation',
    },
  }

  // Priority config
  const priorityConfig = {
    high: {
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/50',
      border: 'border-red-200 dark:border-red-800',
      label: 'High Priority',
    },
    medium: {
      icon: Info,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/50',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Medium Priority',
    },
    low: {
      icon: CheckCircle2,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      label: 'Low Priority',
    },
  }

  const handleFeedback = (insightId: string, helpful: boolean) => {
    onFeedback?.(insightId, helpful)
    setFeedbackGiven(new Set(feedbackGiven).add(insightId))
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <button
            onClick={() => onPriorityFilterChange?.('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              priorityFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onPriorityFilterChange?.('high')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              priorityFilter === 'high'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            High
          </button>
          <button
            onClick={() => onPriorityFilterChange?.('medium')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              priorityFilter === 'medium'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Medium
          </button>
          <button
            onClick={() => onPriorityFilterChange?.('low')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              priorityFilter === 'low'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Low
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <button
            onClick={() => onTypeFilterChange?.('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => onTypeFilterChange?.('spending')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'spending'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spending
          </button>
          <button
            onClick={() => onTypeFilterChange?.('tax')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'tax'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tax
          </button>
          <button
            onClick={() => onTypeFilterChange?.('subsidy')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'subsidy'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Subsidies
          </button>
          <button
            onClick={() => onTypeFilterChange?.('rule')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              typeFilter === 'rule'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rules
          </button>
        </div>
      </div>

      {/* Insights Feed */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const typeConf = typeConfig[insight.type]
          const priorityConf = priorityConfig[insight.priority]
          const TypeIcon = typeConf.icon
          const PriorityIcon = priorityConf.icon
          const hasFeedback = feedbackGiven.has(insight.id)

          return (
            <div
              key={insight.id}
              onClick={() => onInsightClick?.(insight.id)}
              className={`bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border ${priorityConf.border} p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${typeConf.bg} shrink-0`}>
                  <TypeIcon className={`w-4 h-4 ${typeConf.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {insight.title}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Priority Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${priorityConf.bg}`}>
                        <PriorityIcon className={`w-3 h-3 ${priorityConf.color}`} />
                        <span className={`text-[10px] font-semibold uppercase ${priorityConf.color}`}>
                          {insight.priority}
                        </span>
                      </div>

                      {/* Type Badge */}
                      <div className={`px-2 py-0.5 rounded-full ${typeConf.bg}`}>
                        <span className={`text-[10px] font-semibold uppercase ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    {insight.description}
                  </p>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Impact */}
                    {insight.impact > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(insight.impact)}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">{insight.impactLabel}</span>
                      </div>
                    )}

                    {/* Confidence */}
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {(insight.confidence * 100).toFixed(0)}% confident
                      </span>
                    </div>

                    {/* Deadline */}
                    {insight.actionDeadline && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {insight.actionDeadlineLabel}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {new Date(insight.actionDeadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {/* Related Transactions */}
                    {insight.relatedTransactionIds.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewRelatedTransactions?.(insight.relatedTransactionIds)
                        }}
                        className="flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{insight.relatedTransactionIds.length} transactions</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                {/* Dismiss */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss?.(insight.id)
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3 h-3" />
                  Dismiss
                </button>

                {/* Apply */}
                {insight.actionable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onApply?.(insight.id)
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3 h-3" />
                    Apply
                  </button>
                )}

                {/* Share */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare?.(insight.id)
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3 h-3" />
                  Share
                </button>

                {/* Feedback */}
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400 mr-1">Helpful?</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFeedback(insight.id, true)
                    }}
                    disabled={hasFeedback}
                    className={`p-1.5 rounded-lg transition-colors ${
                      hasFeedback
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFeedback(insight.id, false)
                    }}
                    disabled={hasFeedback}
                    className={`p-1.5 rounded-lg transition-colors ${
                      hasFeedback
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredInsights.length === 0 && (
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              No insights found
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Try adjusting your filters or check back later for new AI recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
