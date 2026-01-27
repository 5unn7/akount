import type {
  Transaction,
  Category,
  Account,
  Entity,
  AISuggestion,
} from '../types'
import { TransactionRow } from './TransactionRow'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
  entities: Entity[]
  aiSuggestions: AISuggestion[]
  selectedTransactionIds: Set<string>
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onTransactionClick?: (id: string) => void
  onCategorize?: (id: string, categoryId: string) => void
  onAcceptAISuggestion?: (transactionId: string, categoryId: string) => void
  onCreateRule?: (transactionId: string, categoryId: string) => void
}

export function TransactionList({
  transactions,
  categories,
  accounts,
  entities,
  aiSuggestions,
  selectedTransactionIds,
  onToggleSelection,
  onSelectAll,
  onTransactionClick,
  onCategorize,
  onAcceptAISuggestion,
  onCreateRule,
}: TransactionListProps) {
  const allSelected = transactions.length > 0 && selectedTransactionIds.size === transactions.length

  const suggestionMap = new Map(aiSuggestions.map(s => [s.transactionId, s]))

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-850">
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
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-1">Account</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Status</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 font-[family-name:var(--font-body)]">
              No transactions found
            </p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const account = accounts.find(a => a.id === transaction.accountId)
            const category = transaction.categoryId
              ? categories.find(c => c.id === transaction.categoryId)
              : undefined
            const entity = entities.find(e => e.id === transaction.entityId)
            const aiSuggestion = suggestionMap.get(transaction.id)

            return (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                account={account}
                category={category}
                entity={entity}
                categories={categories}
                aiSuggestion={aiSuggestion}
                isSelected={selectedTransactionIds.has(transaction.id)}
                onToggleSelection={() => onToggleSelection(transaction.id)}
                onClick={() => onTransactionClick?.(transaction.id)}
                onCategorize={(categoryId) => onCategorize?.(transaction.id, categoryId)}
                onAcceptAISuggestion={(categoryId) => onAcceptAISuggestion?.(transaction.id, categoryId)}
                onCreateRule={(categoryId) => onCreateRule?.(transaction.id, categoryId)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
