import { Wallet, CreditCard } from 'lucide-react'
import type { Summary } from '../types'

interface CashPositionCardProps {
  cash: Summary['cash']
  debt: Summary['debt']
  currency: string
}

export function CashPositionCard({ cash, debt, currency }: CashPositionCardProps) {
  const formattedCash = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cash.currency,
    minimumFractionDigits: 0,
  }).format(cash.total)

  const formattedDebt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: debt.currency,
    minimumFractionDigits: 0,
  }).format(Math.abs(debt.total))

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/50 p-6 shadow-sm">
      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-3xl" />

      <div className="relative">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 font-[family-name:var(--font-body)]">
          Cash Position
        </p>

        <div className="space-y-4">
          {/* Cash */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 font-[family-name:var(--font-body)]">
                  Cash on Hand
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-[family-name:var(--font-body)]">
                  {cash.accounts} accounts
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 font-[family-name:var(--font-mono)]">
              {formattedCash}
            </span>
          </div>

          {/* Debt */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/40">
                <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-100 font-[family-name:var(--font-body)]">
                  Total Debt
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 font-[family-name:var(--font-body)]">
                  {debt.accounts} accounts
                </p>
              </div>
            </div>
            <span className="text-2xl font-bold text-red-900 dark:text-red-100 font-[family-name:var(--font-mono)]">
              {formattedDebt}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
