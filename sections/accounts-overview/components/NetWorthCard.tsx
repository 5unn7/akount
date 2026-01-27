import { TrendingUp, TrendingDown } from 'lucide-react'
import type { Summary } from '../types'

interface NetWorthCardProps {
  netWorth: Summary['netWorth']
  currency: string
}

export function NetWorthCard({ netWorth, currency }: NetWorthCardProps) {
  const isPositiveChange = netWorth.change >= 0
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: netWorth.currency,
    minimumFractionDigits: 2,
  }).format(netWorth.total)

  const formattedChange = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: netWorth.currency,
    minimumFractionDigits: 0,
  }).format(Math.abs(netWorth.changeAmount))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 p-6 shadow-sm">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 font-[family-name:var(--font-body)]">
              Total Net Worth
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-mono)] tracking-tight">
              {formattedAmount}
            </h2>
          </div>
          <div className={`
            p-2 rounded-lg
            ${isPositiveChange
              ? 'bg-emerald-50 dark:bg-emerald-950/30'
              : 'bg-red-50 dark:bg-red-950/30'
            }
          `}>
            {isPositiveChange ? (
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`
            text-lg font-semibold font-[family-name:var(--font-mono)]
            ${isPositiveChange
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
            }
          `}>
            {isPositiveChange ? '+' : ''}{netWorth.change.toFixed(1)}%
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
            ({isPositiveChange ? '+' : ''}{formattedChange} this {netWorth.period})
          </span>
        </div>
      </div>
    </div>
  )
}
