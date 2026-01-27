import type {
  BankFeedTransaction,
  TransactionMatch,
  Transaction,
  Category,
  DetectedTransfer,
} from '../types'
import { FeedTransactionRow } from './FeedTransactionRow'

interface FeedTransactionTableProps {
  feedTransactions: BankFeedTransaction[]
  transactionMatches: TransactionMatch[]
  transactions: Transaction[]
  categories: Category[]
  detectedTransfers: DetectedTransfer[]
  selectedFeedIds: Set<string>
  onToggleSelection: (feedId: string) => void
  onSelectAll: () => void
  onFeedClick?: (feedId: string) => void
  onConfirmMatch?: (matchId: string) => void
  onConfirmTransfer?: (transferId: string) => void
}

export function FeedTransactionTable({
  feedTransactions,
  transactionMatches,
  transactions,
  categories,
  detectedTransfers,
  selectedFeedIds,
  onToggleSelection,
  onSelectAll,
  onFeedClick,
  onConfirmMatch,
  onConfirmTransfer,
}: FeedTransactionTableProps) {
  const allSelected = feedTransactions.length > 0 && selectedFeedIds.size === feedTransactions.length

  // Group transfers
  const transferMap = new Map<string, DetectedTransfer>()
  detectedTransfers.forEach(transfer => {
    transferMap.set(transfer.fromFeedId, transfer)
    transferMap.set(transfer.toFeedId, transfer)
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide font-[family-name:var(--font-body)]">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500 dark:focus:ring-orange-400"
            />
          </div>
          <div className="col-span-2">Date</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {feedTransactions.map((feed) => {
          const match = transactionMatches.find(m => m.bankFeedTransactionId === feed.id)
          const matchedTransaction = match?.transactionId
            ? transactions.find(t => t.id === match.transactionId)
            : undefined
          const category = match?.suggestedCategoryId
            ? categories.find(c => c.id === match.suggestedCategoryId)
            : matchedTransaction
            ? categories.find(c => c.id === matchedTransaction.categoryId)
            : undefined
          const transfer = transferMap.get(feed.id)
          const isSelected = selectedFeedIds.has(feed.id)

          return (
            <FeedTransactionRow
              key={feed.id}
              feed={feed}
              match={match}
              matchedTransaction={matchedTransaction}
              category={category}
              transfer={transfer}
              isSelected={isSelected}
              onToggleSelection={() => onToggleSelection(feed.id)}
              onFeedClick={() => onFeedClick?.(feed.id)}
              onConfirmMatch={() => match && onConfirmMatch?.(match.id)}
              onConfirmTransfer={() => transfer && onConfirmTransfer?.(transfer.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
