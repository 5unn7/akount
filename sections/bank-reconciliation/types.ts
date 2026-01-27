// =============================================================================
// Data Types
// =============================================================================

export interface Account {
  id: string
  name: string
  type: 'bank' | 'credit_card' | 'loan' | 'asset'
  institution: string
  currency: string
  entityId: string
  lastSync: string
}

export interface Entity {
  id: string
  name: string
  type: 'personal' | 'business'
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense' | 'transfer'
  color: string
}

export interface BankFeedTransaction {
  id: string
  accountId: string
  bankTransactionId: string
  date: string
  description: string
  amount: number
  currency: string
  importedAt: string
}

export interface Transaction {
  id: string
  accountId: string
  categoryId: string
  date: string
  description: string
  amount: number
  currency: string
}

export interface TransactionMatch {
  id: string
  bankFeedTransactionId: string
  transactionId: string | null
  status: 'matched' | 'suggested' | 'unmatched'
  confidence: number | null
  suggestedCategoryId?: string
  suggestedDescription?: string
  matchedAt: string | null
  matchedBy: 'auto' | 'manual' | null
}

export interface DetectedTransfer {
  id: string
  fromFeedId: string
  toFeedId: string
  amount: number
  currency: string
  date: string
  confidence: number
  status: 'suggested' | 'confirmed' | 'rejected'
}

export interface PeriodStatus {
  accountId: string
  period: string
  periodLabel: string
  status: 'open' | 'locked'
  totalFeedItems: number
  matchedCount: number
  suggestedCount: number
  unmatchedCount: number
  lastReconciledDate: string
  lockedAt?: string
  lockedBy?: string
  isReadyToLock: boolean
}

// =============================================================================
// Component Props
// =============================================================================

export interface BankReconciliationProps {
  /** List of accounts with bank feeds */
  accounts: Account[]
  /** List of entities that own accounts */
  entities: Entity[]
  /** Available categories for transaction classification */
  categories: Category[]
  /** Raw bank feed transactions to reconcile */
  bankFeedTransactions: BankFeedTransaction[]
  /** Matched internal transactions */
  transactions: Transaction[]
  /** Match records linking feeds to transactions */
  transactionMatches: TransactionMatch[]
  /** Detected transfer pairs between accounts */
  detectedTransfers: DetectedTransfer[]
  /** Reconciliation status per account and period */
  periodStatus: PeriodStatus[]
  /** Currently selected account ID */
  selectedAccountId?: string
  /** Currently selected period (e.g., "2026-01") */
  selectedPeriod?: string
  /** Current filter: all, matched, suggested, unmatched */
  filterStatus?: 'all' | 'matched' | 'suggested' | 'unmatched'
  /** Called when user selects an account to reconcile */
  onAccountSelect?: (accountId: string) => void
  /** Called when user selects a period to view */
  onPeriodSelect?: (period: string) => void
  /** Called when user clicks on a feed transaction to view details */
  onFeedTransactionClick?: (feedId: string) => void
  /** Called when user confirms a suggested match */
  onConfirmMatch?: (matchId: string) => void
  /** Called when user unmatches a feed transaction */
  onUnmatch?: (matchId: string) => void
  /** Called when user creates a new transaction from unmatched feed */
  onCreate?: (feedId: string, categoryId: string, description: string) => void
  /** Called when user manually matches feed to existing transaction */
  onManualMatch?: (feedId: string, transactionId: string) => void
  /** Called when user confirms a detected transfer */
  onConfirmTransfer?: (transferId: string) => void
  /** Called when user rejects a detected transfer */
  onRejectTransfer?: (transferId: string) => void
  /** Called when user bulk confirms multiple suggested matches */
  onBulkConfirmMatches?: (matchIds: string[]) => void
  /** Called when user bulk creates transactions from unmatched feeds */
  onBulkCreateTransactions?: (feedIds: string[]) => void
  /** Called when user locks a period for an account */
  onLockPeriod?: (accountId: string, period: string) => void
  /** Called when user unlocks a previously locked period */
  onUnlockPeriod?: (accountId: string, period: string) => void
  /** Called when user changes the filter status */
  onFilterChange?: (status: 'all' | 'matched' | 'suggested' | 'unmatched') => void
  /** Called when user searches by description or amount */
  onSearch?: (query: string) => void
}
