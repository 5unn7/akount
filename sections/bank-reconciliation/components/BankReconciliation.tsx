import { useState } from 'react'
import { ChevronDown, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { BankReconciliationProps } from '../types'
import { ReconciliationStatusCard } from './ReconciliationStatusCard'
import { FeedTransactionTable } from './FeedTransactionTable'
import { BulkActionToolbar } from './BulkActionToolbar'
import { FilterChips } from './FilterChips'

/**
 * Bank Reconciliation - Reconciliation workspace
 *
 * Design tokens:
 * - Primary: orange (actions, confirmations)
 * - Secondary: violet (transfers, suggestions)
 * - Neutral: slate (backgrounds, text)
 * - Typography: Newsreader (headings), Manrope (body), JetBrains Mono (amounts)
 */
export function BankReconciliation({
  accounts,
  entities,
  categories,
  bankFeedTransactions,
  transactions,
  transactionMatches,
  detectedTransfers,
  periodStatus,
  selectedAccountId,
  selectedPeriod,
  filterStatus = 'all',
  onAccountSelect,
  onPeriodSelect,
  onFeedTransactionClick,
  onConfirmMatch,
  onUnmatch,
  onCreate,
  onManualMatch,
  onConfirmTransfer,
  onRejectTransfer,
  onBulkConfirmMatches,
  onBulkCreateTransactions,
  onLockPeriod,
  onUnlockPeriod,
  onFilterChange,
  onSearch,
}: BankReconciliationProps) {
  const [selectedFeedIds, setSelectedFeedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Default to first account if none selected
  const currentAccountId = selectedAccountId || accounts[0]?.id
  const currentAccount = accounts.find(a => a.id === currentAccountId)
  const currentEntity = entities.find(e => e.id === currentAccount?.entityId)

  // Get period status for current account
  const accountPeriodStatus = periodStatus.filter(ps => ps.accountId === currentAccountId)
  const currentPeriodStatus = selectedPeriod
    ? accountPeriodStatus.find(ps => ps.period === selectedPeriod)
    : accountPeriodStatus.find(ps => ps.status === 'open')

  // Filter feed transactions for current account and period
  const feedsForAccount = bankFeedTransactions.filter(f => {
    if (f.accountId !== currentAccountId) return false
    if (selectedPeriod) {
      const feedMonth = f.date.substring(0, 7) // "2026-01"
      return feedMonth === selectedPeriod
    }
    return true
  })

  // Apply match status filter
  const filteredFeeds = feedsForAccount.filter(feed => {
    const match = transactionMatches.find(m => m.bankFeedTransactionId === feed.id)
    if (filterStatus === 'all') return true
    if (!match) return filterStatus === 'unmatched'
    return match.status === filterStatus
  })

  // Apply search filter
  const displayedFeeds = searchQuery
    ? filteredFeeds.filter(feed =>
        feed.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feed.amount.toString().includes(searchQuery)
      )
    : filteredFeeds

  // Calculate status counts for filters
  const statusCounts = {
    all: feedsForAccount.length,
    matched: feedsForAccount.filter(f => {
      const match = transactionMatches.find(m => m.bankFeedTransactionId === f.id)
      return match?.status === 'matched'
    }).length,
    suggested: feedsForAccount.filter(f => {
      const match = transactionMatches.find(m => m.bankFeedTransactionId === f.id)
      return match?.status === 'suggested'
    }).length,
    unmatched: feedsForAccount.filter(f => {
      const match = transactionMatches.find(m => m.bankFeedTransactionId === f.id)
      return !match || match.status === 'unmatched'
    }).length,
  }

  const handleToggleSelection = (feedId: string) => {
    const newSelected = new Set(selectedFeedIds)
    if (newSelected.has(feedId)) {
      newSelected.delete(feedId)
    } else {
      newSelected.add(feedId)
    }
    setSelectedFeedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFeedIds.size === displayedFeeds.length) {
      setSelectedFeedIds(new Set())
    } else {
      setSelectedFeedIds(new Set(displayedFeeds.map(f => f.id)))
    }
  }

  const handleBulkConfirm = () => {
    const matchIds = Array.from(selectedFeedIds)
      .map(feedId => transactionMatches.find(m => m.bankFeedTransactionId === feedId)?.id)
      .filter((id): id is string => !!id)
    onBulkConfirmMatches?.(matchIds)
    setSelectedFeedIds(new Set())
  }

  const handleBulkCreate = () => {
    onBulkCreateTransactions?.(Array.from(selectedFeedIds))
    setSelectedFeedIds(new Set())
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 font-[family-name:var(--font-heading)]">
                Bank Reconciliation
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
                Match bank feeds to internal transactions
              </p>
            </div>

            {/* Account and Period Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onAccountSelect?.(currentAccountId!)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)] flex items-center gap-2"
              >
                <span>{currentAccount?.name || 'Select Account'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => onPeriodSelect?.(selectedPeriod || '')}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)] flex items-center gap-2"
              >
                <span>{currentPeriodStatus?.periodLabel || 'This Month'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Card */}
          {currentPeriodStatus && (
            <ReconciliationStatusCard
              periodStatus={currentPeriodStatus}
              onLockPeriod={() => onLockPeriod?.(currentAccountId!, currentPeriodStatus.period)}
              onUnlockPeriod={() => onUnlockPeriod?.(currentAccountId!, currentPeriodStatus.period)}
            />
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <FilterChips
            statusCounts={statusCounts}
            activeFilter={filterStatus}
            onFilterChange={onFilterChange}
          />

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description or amount..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                onSearch?.(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-[family-name:var(--font-body)] focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedFeedIds.size > 0 && (
          <BulkActionToolbar
            selectedCount={selectedFeedIds.size}
            onConfirmAll={handleBulkConfirm}
            onCreateAll={handleBulkCreate}
            onClearSelection={() => setSelectedFeedIds(new Set())}
          />
        )}

        {/* Feed Transaction Table */}
        <FeedTransactionTable
          feedTransactions={displayedFeeds}
          transactionMatches={transactionMatches}
          transactions={transactions}
          categories={categories}
          detectedTransfers={detectedTransfers}
          selectedFeedIds={selectedFeedIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          onFeedClick={onFeedTransactionClick}
          onConfirmMatch={onConfirmMatch}
          onConfirmTransfer={onConfirmTransfer}
        />

        {/* Empty State */}
        {displayedFeeds.length === 0 && !searchQuery && (
          <div className="text-center py-16">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 font-[family-name:var(--font-heading)]">
              All cleared!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Ready to lock this period
            </p>
          </div>
        )}

        {/* No Search Results */}
        {displayedFeeds.length === 0 && searchQuery && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 font-[family-name:var(--font-heading)]">
              No results found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
