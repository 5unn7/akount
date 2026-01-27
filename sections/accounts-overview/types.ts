// =============================================================================
// Data Types
// =============================================================================

export interface Entity {
  id: string
  name: string
  type: 'personal' | 'business'
  country: string
}

export interface Account {
  id: string
  name: string
  type: 'bank' | 'credit_card' | 'loan' | 'asset'
  institution: string
  balance: number
  currency: string
  country: string
  entityId: string
  lastSync: string
  unmatchedTransactions: number
  // Credit card and line of credit specific fields
  availableCredit?: number
  creditLimit?: number
  // Loan specific fields
  interestRate?: number
  monthlyPayment?: number
}

export interface Currency {
  code: string
  symbol: string
  name: string
  decimals: number
}

export interface FxRate {
  from: string
  to: string
  rate: number
  date: string
}

export interface Insight {
  id: string
  type: 'cash_flow' | 'reconciliation' | 'tax_optimization' | 'spending' | 'goal_progress'
  title: string
  description: string
  severity: 'positive' | 'warning' | 'info' | 'negative'
  linkedView: string
  linkedAccounts?: string[]
  createdAt: string
}

export interface Summary {
  netWorth: {
    total: number
    currency: string
    change: number
    changeAmount: number
    period: string
  }
  cash: {
    total: number
    currency: string
    accounts: number
  }
  debt: {
    total: number
    currency: string
    accounts: number
  }
  assets: {
    total: number
    currency: string
    accounts: number
  }
}

export interface CallToAction {
  id: string
  type: 'reconciliation' | 'connection' | 'invoice' | 'categorization' | 'tax'
  label: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

// =============================================================================
// Component Props
// =============================================================================

export interface AccountsOverviewProps {
  /** List of entities (personal and business) */
  entities: Entity[]
  /** List of all financial accounts */
  accounts: Account[]
  /** Supported currencies */
  currencies: Currency[]
  /** Current exchange rates between currencies */
  fxRates: FxRate[]
  /** AI-generated or rule-based insights */
  insights: Insight[]
  /** Pre-calculated summary metrics */
  summary: Summary
  /** Context-aware action items */
  callToActions: CallToAction[]
  /** Currently selected entity ID (undefined = all entities) */
  selectedEntityId?: string
  /** Currently selected base currency (undefined = native currencies) */
  selectedCurrency?: string
  /** Called when user clicks on an account to view details */
  onAccountClick?: (accountId: string) => void
  /** Called when user clicks on an insight to navigate to linked view */
  onInsightClick?: (linkedView: string) => void
  /** Called when user clicks on a call-to-action button */
  onCallToActionClick?: (action: string) => void
  /** Called when user changes the entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user toggles the base currency */
  onCurrencyToggle?: (currency?: string) => void
  /** Called when user wants to connect a new bank account */
  onConnectBank?: () => void
}
