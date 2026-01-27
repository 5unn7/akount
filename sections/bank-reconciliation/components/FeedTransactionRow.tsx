import { CheckCircle2, AlertCircle, Clock, ArrowRightLeft, MoreHorizontal, Check } from 'lucide-react'
import type {
  BankFeedTransaction,
  TransactionMatch,
  Transaction,
  Category,
  DetectedTransfer,
} from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from './useSpotlight'

interface FeedTransactionRowProps {
  feed: BankFeedTransaction
  match?: TransactionMatch
  matchedTransaction?: Transaction
  category?: Category
  transfer?: DetectedTransfer
  isSelected: boolean
  onToggleSelection: () => void
  onFeedClick?: () => void
  onConfirmMatch?: () => void
  onConfirmTransfer?: () => void
}

export function FeedTransactionRow({
  feed,
  match,
  matchedTransaction,
  category,
  transfer,
  isSelected,
  onToggleSelection,
  onFeedClick,
  onConfirmMatch,
  onConfirmTransfer,
}: FeedTransactionRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()
  const status = match?.status || 'unmatched'

  const statusConfig = {
    matched: {
      icon: CheckCircle2,
      label: 'Matched',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-300',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    suggested: {
      icon: AlertCircle,
      label: 'Suggested',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    unmatched: {
      icon: Clock,
      label: 'Unmatched',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      textColor: 'text-slate-700 dark:text-slate-300',
      iconColor: 'text-slate-500 dark:text-slate-400',
    },
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: feed.currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(feed.amount))

  const formattedDate = new Date(feed.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className={`relative px-6 py-4 transition-colors ${
        isSelected ? 'bg-violet-50 dark:bg-violet-950/10' : ''
      } ${transfer ? 'border-l-4 border-violet-500' : ''}`}
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
        <div className="col-span-4">
          <button
            onClick={onFeedClick}
            className="text-left group"
          >
            <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors font-[family-name:var(--font-body)]">
              {feed.description}
            </p>
            {category && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-[family-name:var(--font-body)]">
                {category.name}
              </p>
            )}
            {transfer && (
              <div className="flex items-center gap-1 mt-1">
                <ArrowRightLeft className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                <span className="text-xs text-violet-700 dark:text-violet-300 font-medium font-[family-name:var(--font-body)]">
                  Transfer detected
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Amount */}
        <div className="col-span-2">
          <span className={`text-sm font-bold font-[family-name:var(--font-mono)] ${
            feed.amount < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {feed.amount < 0 ? '-' : '+'}{formattedAmount}
          </span>
        </div>

        {/* Status Badge */}
        <div className="col-span-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${config.iconColor}`} />
            <span className={`text-xs font-medium ${config.textColor} font-[family-name:var(--font-body)]`}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex items-center justify-end gap-2">
          {status === 'suggested' && (
            <button
              onClick={onConfirmMatch}
              className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
              title="Confirm match"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {transfer && transfer.status === 'suggested' && (
            <button
              onClick={onConfirmTransfer}
              className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 dark:text-violet-400 transition-colors"
              title="Confirm transfer"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onFeedClick}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
