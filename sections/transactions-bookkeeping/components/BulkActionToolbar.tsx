import { Check, X } from 'lucide-react'
import type { Category } from '../types'

interface BulkActionToolbarProps {
  selectedCount: number
  categories: Category[]
  onCategorize: (categoryId: string) => void
  onCreateRule: () => void
  onClear: () => void
}

export function BulkActionToolbar({
  selectedCount,
  categories,
  onCategorize,
  onCreateRule,
  onClear,
}: BulkActionToolbarProps) {
  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold font-[family-name:var(--font-body)]">
            {selectedCount}
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white font-[family-name:var(--font-body)]">
            {selectedCount} transaction{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex-1" />

        {/* Categorize Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onCategorize(e.target.value)
                e.target.value = ''
              }
            }}
            className="px-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-slate-900 dark:text-white font-medium font-[family-name:var(--font-body)] focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Categorize As...</option>
            {categories
              .filter((cat) => !cat.parentId)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </div>

        {/* Create Rule */}
        <button
          onClick={onCreateRule}
          className="px-4 py-2 text-sm bg-violet-500 hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-500 text-white rounded-lg transition-colors font-medium font-[family-name:var(--font-body)]"
        >
          Create Rule
        </button>

        {/* Clear Selection */}
        <button
          onClick={onClear}
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
