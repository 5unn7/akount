import { CheckCircle2, Clock, AlertCircle, Sparkles, Check, MoreHorizontal } from 'lucide-react'
import type {
  Transaction,
  Category,
  Account,
  Entity,
  AISuggestion,
} from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from './useSpotlight'

interface TransactionRowProps {
  transaction: Transaction
  account?: Account
  category?: Category
  entity?: Entity
  categories: Category[]
  aiSuggestion?: AISuggestion
  isSelected: boolean
  onToggleSelection: () => void
  onClick?: () => void
  onCategorize?: (categoryId: string) => void
  onAcceptAISuggestion?: (categoryId: string) => void
  onCreateRule?: (categoryId: string) => void
}

export function TransactionRow({
  transaction,
  account,
  category,
  entity,
  categories,
  aiSuggestion,
  isSelected,
  onToggleSelection,
  onClick,
  onCategorize,
  onAcceptAISuggestion,
  onCreateRule,
}: TransactionRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  const statusConfig = {
    matched: {
      icon: CheckCircle2,
      label: 'Matched',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    suggested: {
      icon: AlertCircle,
      label: 'Suggested',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    unmatched: {
      icon: Clock,
      label: 'Unmatched',
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
    },
  }

  const config = statusConfig[transaction.reconciliationStatus]
  const StatusIcon = config.icon

  const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: transaction.currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(transaction.amount))

  const suggestedCategory = aiSuggestion
    ? categories.find(c => c.id === aiSuggestion.suggestedCategoryId)
    : undefined

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className={`relative px-6 py-4 transition-colors ${
        isSelected ? 'bg-orange-50 dark:bg-orange-950/10' : ''
      }`}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Checkbox */}
        <div className="col-span-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500 dark:focus:ring-orange-400"
          />
        </div>

        {/* Date */}
        <div className="col-span-2">
          <span className="text-sm font-medium text-slate-900 dark:text-white font-[family-name:var(--font-body)]">
            {formattedDate}
          </span>
        </div>

        {/* Description */}
        <div className="col-span-3">
          <button
            onClick={onClick}
            className="text-left group"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-[family-name:var(--font-body)]">
              {transaction.description}
            </p>
            {transaction.merchant && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
                {transaction.merchant}
              </p>
            )}
          </button>
        </div>

        {/* Amount */}
        <div className="col-span-2">
          <span className={`text-sm font-bold font-[family-name:var(--font-mono)] ${
            transaction.amount < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {transaction.amount < 0 ? '-' : '+'}{formattedAmount}
          </span>
        </div>

        {/* Account */}
        <div className="col-span-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
            {account?.name || 'Unknown'}
          </span>
        </div>

        {/* Category */}
        <div className="col-span-2">
          {category ? (
            <select
              value={category.id}
              onChange={(e) => onCategorize?.(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-orange-500 font-medium font-[family-name:var(--font-body)]"
              style={{
                backgroundColor: category.color === 'blue' ? '#dbeafe' :
                  category.color === 'violet' ? '#ede9fe' :
                  category.color === 'amber' ? '#fef3c7' :
                  category.color === 'emerald' ? '#d1fae5' :
                  category.color === 'orange' ? '#fed7aa' :
                  category.color === 'pink' ? '#fce7f3' :
                  category.color === 'red' ? '#fee2e2' :
                  category.color === 'sky' ? '#e0f2fe' :
                  category.color === 'indigo' ? '#e0e7ff' :
                  '#f1f5f9',
                color: category.color === 'blue' ? '#1e3a8a' :
                  category.color === 'violet' ? '#5b21b6' :
                  category.color === 'amber' ? '#78350f' :
                  category.color === 'emerald' ? '#065f46' :
                  category.color === 'orange' ? '#7c2d12' :
                  category.color === 'pink' ? '#831843' :
                  category.color === 'red' ? '#7f1d1d' :
                  category.color === 'sky' ? '#0c4a6e' :
                  category.color === 'indigo' ? '#312e81' :
                  '#475569',
              }}
            >
              <option value={category.id}>{category.name}</option>
              {categories
                .filter((cat) => cat.id !== category.id && !cat.parentId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          ) : aiSuggestion && suggestedCategory ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300 font-[family-name:var(--font-body)]">
                  {suggestedCategory.name}
                </span>
              </div>
              <button
                onClick={() => onAcceptAISuggestion?.(suggestedCategory.id)}
                className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                title="Accept suggestion"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <select
              onChange={(e) => e.target.value && onCategorize?.(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 border-0 text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-orange-500 font-medium font-[family-name:var(--font-body)]"
            >
              <option value="">Uncategorized</option>
              {categories
                .filter((cat) => !cat.parentId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* Status */}
        <div className="col-span-1 flex items-center justify-between">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${config.bg}`}>
            <StatusIcon className={`w-3 h-3 ${config.color}`} />
          </div>
          <button
            onClick={onClick}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
