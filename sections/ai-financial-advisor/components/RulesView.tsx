import React from 'react'
import {
  Zap,
  Check,
  X,
  Play,
  Pause,
  Edit,
  Trash2,
  Sparkles,
  User,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import type { RulesViewProps } from '../types'

export function RulesView({
  rules,
  onApprove,
  onReject,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
  onRuleClick,
  statusFilter = 'all',
  creatorFilter = 'all',
  onStatusFilterChange,
  onCreatorFilterChange,
}: RulesViewProps) {
  // Filter rules
  const filteredRules = rules.filter((rule) => {
    if (statusFilter !== 'all' && rule.status !== statusFilter) return false
    if (creatorFilter !== 'all' && rule.createdBy !== creatorFilter) return false
    return true
  })

  // Status config
  const statusConfig = {
    active: {
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/50',
      border: 'border-emerald-200 dark:border-emerald-800',
      label: 'Active',
    },
    inactive: {
      icon: XCircle,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      border: 'border-slate-200 dark:border-slate-700',
      label: 'Inactive',
    },
    pending: {
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/50',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Pending Approval',
    },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <button
            onClick={() => onStatusFilterChange?.('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onStatusFilterChange?.('active')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'active'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => onStatusFilterChange?.('pending')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'pending'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => onStatusFilterChange?.('inactive')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inactive
          </button>
        </div>

        {/* Creator Filter */}
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          <button
            onClick={() => onCreatorFilterChange?.('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              creatorFilter === 'all'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => onCreatorFilterChange?.('AI')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              creatorFilter === 'AI'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI-Generated
          </button>
          <button
            onClick={() => onCreatorFilterChange?.('User')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              creatorFilter === 'User'
                ? 'bg-orange-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            User-Created
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const statusConf = statusConfig[rule.status]
          const StatusIcon = statusConf.icon
          const isPending = rule.status === 'pending'

          return (
            <div
              key={rule.id}
              onClick={() => onRuleClick?.(rule.id)}
              className={`bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border ${statusConf.border} p-4 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg ${statusConf.bg} shrink-0`}>
                  <Zap className={`w-4 h-4 ${statusConf.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {rule.name}
                    </h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusConf.bg}`}>
                        <StatusIcon className={`w-3 h-3 ${statusConf.color}`} />
                        <span className={`text-[10px] font-semibold uppercase ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </div>

                      {/* Creator Badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        rule.createdBy === 'AI'
                          ? 'bg-violet-100 dark:bg-violet-950/50'
                          : 'bg-blue-100 dark:bg-blue-950/50'
                      }`}>
                        {rule.createdBy === 'AI' ? (
                          <Sparkles className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        )}
                        <span className={`text-[10px] font-semibold uppercase ${
                          rule.createdBy === 'AI'
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {rule.createdBy}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    {rule.description}
                  </p>

                  {/* Conditions & Action */}
                  <div className="space-y-2 mb-3">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Conditions:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {rule.conditions.map((condition, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300"
                          >
                            {condition.field} {condition.operator} "{condition.value}"
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Action:
                      </span>
                      <span className="ml-2 text-slate-700 dark:text-slate-300">
                        Categorize as <span className="font-medium">{rule.action.categoryName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <span>
                      Affects <span className="font-semibold">{rule.affectedTransactionCount}</span> transactions
                    </span>
                    {rule.createdBy === 'AI' && (
                      <span>
                        {(rule.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                    <span>
                      Created {new Date(rule.createdDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                {isPending ? (
                  <>
                    {/* Approve */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onApprove?.(rule.id)
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      Approve
                    </button>

                    {/* Reject */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onReject?.(rule.id)
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-3 h-3" />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    {/* Activate/Deactivate */}
                    {rule.status === 'active' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeactivate?.(rule.id)
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                      >
                        <Pause className="w-3 h-3" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onActivate?.(rule.id)
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3" />
                        Activate
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(rule.id)
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-1.5"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(rule.id)
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1.5 ml-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {filteredRules.length === 0 && (
          <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
              No rules found
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Try adjusting your filters or wait for AI to suggest new automation rules
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
