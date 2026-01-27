import { Lock, LockOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import type { PeriodStatus } from '../types'

interface ReconciliationStatusCardProps {
  periodStatus: PeriodStatus
  onLockPeriod?: () => void
  onUnlockPeriod?: () => void
}

export function ReconciliationStatusCard({
  periodStatus,
  onLockPeriod,
  onUnlockPeriod,
}: ReconciliationStatusCardProps) {
  const isLocked = periodStatus.status === 'locked'
  const isReadyToLock = periodStatus.unmatchedCount === 0 && periodStatus.suggestedCount === 0 && !isLocked

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Status Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {isLocked ? (
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <LockOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white font-[family-name:var(--font-body)]">
                {periodStatus.periodLabel}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
                {isLocked ? `Locked on ${new Date(periodStatus.lockedAt!).toLocaleDateString()}` : 'Open for reconciliation'}
              </p>
            </div>
          </div>

          {/* Status Counts */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)]">
                {periodStatus.matchedCount} matched
              </span>
            </div>
            {periodStatus.suggestedCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)]">
                  {periodStatus.suggestedCount} suggested
                </span>
              </div>
            )}
            {periodStatus.unmatchedCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)]">
                  {periodStatus.unmatchedCount} unmatched
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isLocked ? (
            <button
              onClick={onUnlockPeriod}
              className="px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors font-[family-name:var(--font-body)]"
            >
              Unlock Period
            </button>
          ) : isReadyToLock ? (
            <button
              onClick={onLockPeriod}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-500/25 font-[family-name:var(--font-body)] flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Lock Period
            </button>
          ) : (
            <button
              disabled
              className="px-6 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium text-sm cursor-not-allowed font-[family-name:var(--font-body)]"
            >
              Clear all to lock
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
