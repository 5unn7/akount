import { useState } from 'react'
import type {
  Transaction,
  Category,
  Entity,
  Account,
  GLAccount,
  JournalEntry,
  JournalLine,
  Rule,
  AISuggestion,
} from '../types'
import { TransactionList } from './TransactionList'
import { JournalEntryList } from './JournalEntryList'
import { ChartOfAccounts } from './ChartOfAccounts'
import { FilterBar } from './FilterBar'
import { BulkActionToolbar } from './BulkActionToolbar'

interface TransactionsBookkeepingProps {
  transactions: Transaction[]
  categories: Category[]
  entities: Entity[]
  accounts: Account[]
  glAccounts: GLAccount[]
  journalEntries: JournalEntry[]
  journalLines: JournalLine[]
  rules: Rule[]
  aiSuggestions: AISuggestion[]
  selectedTab?: 'transactions' | 'journal-entries' | 'chart-of-accounts'
  onTabChange?: (tab: 'transactions' | 'journal-entries' | 'chart-of-accounts') => void
  onTransactionClick?: (transactionId: string) => void
  onCategorize?: (transactionIds: string[], categoryId: string) => void
  onCreateRule?: (transactionId: string, categoryId: string) => void
  onAcceptAISuggestion?: (transactionId: string, categoryId: string) => void
  onCreateJournalEntry?: (entry: Partial<JournalEntry>) => void
  onPostJournalEntry?: (entryId: string) => void
  onCreateGLAccount?: (account: Partial<GLAccount>) => void
  onFilterChange?: (filters: any) => void
  onSearch?: (query: string) => void
}

export function TransactionsBookkeeping({
  transactions,
  categories,
  entities,
  accounts,
  glAccounts,
  journalEntries,
  journalLines,
  rules,
  aiSuggestions,
  selectedTab = 'transactions',
  onTabChange,
  onTransactionClick,
  onCategorize,
  onCreateRule,
  onAcceptAISuggestion,
  onCreateJournalEntry,
  onPostJournalEntry,
  onCreateGLAccount,
  onFilterChange,
  onSearch,
}: TransactionsBookkeepingProps) {
  const [activeTab, setActiveTab] = useState(selectedTab)
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    entityId: null as string | null,
    accountId: null as string | null,
    categoryId: null as string | null,
    dateRange: null as { start: string; end: string } | null,
    amountRange: null as { min: number; max: number } | null,
    searchQuery: '',
  })

  const handleTabChange = (tab: 'transactions' | 'journal-entries' | 'chart-of-accounts') => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange?.(updated)
  }

  const handleBulkCategorize = (categoryId: string) => {
    onCategorize?.(Array.from(selectedTransactions), categoryId)
    setSelectedTransactions(new Set())
  }

  const handleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)))
    }
  }

  const uncategorizedCount = transactions.filter(t => !t.categoryId).length

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="px-8 pt-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleTabChange('transactions')}
              className={`pb-4 px-1 border-b-2 transition-colors font-[family-name:var(--font-body)] ${activeTab === 'transactions'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Transactions
              {uncategorizedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  {uncategorizedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('journal-entries')}
              className={`pb-4 px-1 border-b-2 transition-colors font-[family-name:var(--font-body)] flex items-center gap-2 ${activeTab === 'journal-entries'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Journal Entries
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                ADVANCED
              </span>
            </button>
            <button
              onClick={() => handleTabChange('chart-of-accounts')}
              className={`pb-4 px-1 border-b-2 transition-colors font-[family-name:var(--font-body)] flex items-center gap-2 ${activeTab === 'chart-of-accounts'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              Chart of Accounts
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                ADVANCED
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
        <div className="max-w-[1400px] mx-auto p-8">
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Filter Bar */}
              <FilterBar
                entities={entities}
                accounts={accounts}
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearch={(query) => {
                  handleFilterChange({ searchQuery: query })
                  onSearch?.(query)
                }}
              />

              {/* Bulk Action Toolbar */}
              {selectedTransactions.size > 0 && (
                <BulkActionToolbar
                  selectedCount={selectedTransactions.size}
                  categories={categories}
                  onCategorize={handleBulkCategorize}
                  onCreateRule={() => {
                    console.log('Create rule for selected transactions')
                  }}
                  onClear={() => setSelectedTransactions(new Set())}
                />
              )}

              {/* Transaction List */}
              <TransactionList
                transactions={transactions}
                categories={categories}
                accounts={accounts}
                entities={entities}
                aiSuggestions={aiSuggestions}
                selectedTransactionIds={selectedTransactions}
                onToggleSelection={(id) => {
                  const newSelection = new Set(selectedTransactions)
                  if (newSelection.has(id)) {
                    newSelection.delete(id)
                  } else {
                    newSelection.add(id)
                  }
                  setSelectedTransactions(newSelection)
                }}
                onSelectAll={handleSelectAll}
                onTransactionClick={onTransactionClick}
                onCategorize={(id, categoryId) => onCategorize?.([id], categoryId)}
                onAcceptAISuggestion={onAcceptAISuggestion}
                onCreateRule={onCreateRule}
              />
            </div>
          )}

          {activeTab === 'journal-entries' && (
            <JournalEntryList
              journalEntries={journalEntries}
              journalLines={journalLines}
              glAccounts={glAccounts}
              entities={entities}
              onCreateEntry={onCreateJournalEntry}
              onPostEntry={onPostJournalEntry}
            />
          )}

          {activeTab === 'chart-of-accounts' && (
            <ChartOfAccounts
              glAccounts={glAccounts}
              entities={entities}
              selectedEntityId={filters.entityId}
              onEntityChange={(entityId) => handleFilterChange({ entityId })}
              onCreateAccount={onCreateGLAccount}
            />
          )}
        </div>
      </div>
    </div>
  )
}
