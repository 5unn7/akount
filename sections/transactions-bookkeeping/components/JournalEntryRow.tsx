import { CheckCircle2, Clock } from 'lucide-react'
import type {
  JournalEntry,
  JournalLine,
} from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from '../../shell/components/useSpotlight'

interface JournalEntryRowProps {
  entry: JournalEntry
  lines: JournalLine[]
  getEntityName: (entityId: string) => string
  getGLAccountName: (glAccountId: string) => string
  onPostEntry?: (entryId: string) => void
}

export function JournalEntryRow({
  entry,
  lines,
  getEntityName,
  getGLAccountName,
  onPostEntry,
}: JournalEntryRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()
  const isPosted = entry.status === 'posted'

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className="relative px-6 py-4 transition-colors"
    >
      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Entry Number */}
        <div className="col-span-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white font-[family-name:var(--font-mono)]">
            {entry.entryNumber}
          </span>
        </div>

        {/* Date */}
        <div className="col-span-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
            {new Date(entry.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Memo */}
        <div className="col-span-4">
          <p className="text-sm font-medium text-slate-900 dark:text-white font-[family-name:var(--font-body)] mb-1">
            {entry.memo}
          </p>
          <div className="space-y-0.5">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
                <span>{getGLAccountName(line.glAccountId)}</span>
                <span>•</span>
                {line.debit > 0 ? (
                  <span className="font-[family-name:var(--font-mono)]">
                    Dr ${line.debit.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-[family-name:var(--font-mono)]">
                    Cr ${line.credit.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Entity */}
        <div className="col-span-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
            {getEntityName(entry.entityId)}
          </span>
        </div>

        {/* Amount */}
        <div className="col-span-1">
          <span className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-mono)]">
            ${entry.totalDebits.toFixed(2)}
          </span>
        </div>

        {/* Status */}
        <div className="col-span-1">
          {isPosted ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 font-[family-name:var(--font-body)]">
                Posted
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 font-[family-name:var(--font-body)]">
                  Draft
                </span>
              </div>
              <button
                onClick={() => onPostEntry?.(entry.id)}
                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium font-[family-name:var(--font-body)]"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
