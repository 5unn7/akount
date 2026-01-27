import { TrendingUp, AlertTriangle, Info, Sparkles, ChevronRight } from 'lucide-react'
import type { Insight } from '../types'

interface InsightCardProps {
  insight: Insight
  onClick?: () => void
}

export function InsightCard({ insight, onClick }: InsightCardProps) {
  const severityConfig = {
    positive: {
      icon: TrendingUp,
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      descColor: 'text-emerald-700 dark:text-emerald-300',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/30',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      textColor: 'text-amber-900 dark:text-amber-100',
      descColor: 'text-amber-700 dark:text-amber-300',
    },
    info: {
      icon: Info,
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      border: 'border-violet-200 dark:border-violet-900/30',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      iconColor: 'text-violet-600 dark:text-violet-400',
      textColor: 'text-violet-900 dark:text-violet-100',
      descColor: 'text-violet-700 dark:text-violet-300',
    },
    negative: {
      icon: AlertTriangle,
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/30',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100',
      descColor: 'text-red-700 dark:text-red-300',
    },
  }

  const config = severityConfig[insight.severity]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={`
        ${config.bg} ${config.border}
        border rounded-xl p-4 text-left w-full
        hover:shadow-md transition-all duration-200
        group relative overflow-hidden
      `}
    >
      {/* Subtle hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <div className="flex items-start gap-3 mb-2">
          <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${config.textColor} mb-1 font-[family-name:var(--font-body)]`}>
              {insight.title}
            </h3>
            <p className={`text-xs ${config.descColor} leading-relaxed font-[family-name:var(--font-body)]`}>
              {insight.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end mt-3">
          <span className={`text-xs font-medium ${config.iconColor} flex items-center gap-1 font-[family-name:var(--font-body)]`}>
            View details
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </button>
  )
}
