import { CheckCircle2, FileText, X } from 'lucide-react'

interface BulkActionToolbarProps {
  selectedCount: number
  onConfirmAll?: () => void
  onCreateAll?: () => void
  onClearSelection?: () => void
}

export function BulkActionToolbar({
  selectedCount,
  onConfirmAll,
  onCreateAll,
  onClearSelection,
}: BulkActionToolbarProps) {
  return (
    <div className="mb-6 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/30 rounded-xl p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500 text-white flex items-center justify-center text-sm font-bold font-[family-name:var(--font-mono)]">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-violet-900 dark:text-violet-100 font-[family-name:var(--font-body)]">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onConfirmAll}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm transition-colors flex items-center gap-2 font-[family-name:var(--font-body)]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm All Matches
          </button>

          <button
            onClick={onCreateAll}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-colors flex items-center gap-2 font-[family-name:var(--font-body)]"
          >
            <FileText className="w-4 h-4" />
            Create Transactions
          </button>

          <button
            onClick={onClearSelection}
            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2 font-[family-name:var(--font-body)]"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
