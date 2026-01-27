// =============================================================================
// Data Types
// =============================================================================

export interface Entity {
  id: string
  name: string
  type: 'personal' | 'business'
  currency: string
}

export interface DashboardMetrics {
  netIncome: number
  totalRevenue: number
  totalExpenses: number
  burnRate: number
  netWorth: number
  cashBalance: number
  accountsReceivable: number
  accountsPayable: number
  profitMargin: number
  revenueGrowth: number
  expenseRatio: number
}

export interface CashFlowDataPoint {
  month: string
  monthLabel: string
  inflow: number
  outflow: number
  net: number
}

export interface PLLineItem {
  category: string
  amount: number
  percentage: number
}

export interface PLData {
  period: string
  revenue: PLLineItem[]
  totalRevenue: number
  expenses: PLLineItem[]
  totalExpenses: number
  netIncome: number
}

export interface BalanceSheetItem {
  account: string
  amount: number
}

export interface BalanceSheetAssets {
  currentAssets: BalanceSheetItem[]
  totalCurrentAssets: number
  fixedAssets: BalanceSheetItem[]
  totalFixedAssets: number
  otherAssets: BalanceSheetItem[]
  totalOtherAssets: number
  totalAssets: number
}

export interface BalanceSheetLiabilities {
  currentLiabilities: BalanceSheetItem[]
  totalCurrentLiabilities: number
  longTermLiabilities: BalanceSheetItem[]
  totalLongTermLiabilities: number
  totalLiabilities: number
}

export interface BalanceSheetEquity {
  items: BalanceSheetItem[]
  totalEquity: number
}

export interface BalanceSheetData {
  asOfDate: string
  assets: BalanceSheetAssets
  liabilities: BalanceSheetLiabilities
  equity: BalanceSheetEquity
  liabilitiesAndEquity: number
}

export interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'recommendation' | 'positive'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  category: string
}

export interface TimePeriod {
  id: string
  label: string
  startDate: string | null
  endDate: string | null
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface AnalyticsDashboardProps {
  /** Dashboard metrics to display */
  metrics: DashboardMetrics
  /** Cash flow data points for trend charts */
  cashFlowData: CashFlowDataPoint[]
  /** Recent AI insights */
  insights: AIInsight[]
  /** Available entities for filtering */
  entities: Entity[]
  /** Currently selected entity ID (undefined = all entities) */
  selectedEntityId?: string
  /** Available time periods */
  timePeriods: TimePeriod[]
  /** Currently selected time period */
  selectedPeriodId: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes time period */
  onPeriodChange?: (periodId: string) => void
  /** Called when user wants to view detailed cash flow */
  onViewCashFlow?: () => void
  /** Called when user wants to view P&L */
  onViewPL?: () => void
  /** Called when user wants to view balance sheet */
  onViewBalanceSheet?: () => void
  /** Called when user wants to export dashboard */
  onExport?: (format: 'pdf' | 'csv') => void
}

export interface CashFlowViewProps {
  /** Cash flow data points to visualize */
  cashFlowData: CashFlowDataPoint[]
  /** Categories for breakdown charts */
  categories: Category[]
  /** Available entities for filtering */
  entities: Entity[]
  /** Currently selected entity ID */
  selectedEntityId?: string
  /** Available time periods */
  timePeriods: TimePeriod[]
  /** Currently selected time period */
  selectedPeriodId: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes time period */
  onPeriodChange?: (periodId: string) => void
  /** Called when user clicks on a data point for details */
  onDataPointClick?: (month: string) => void
  /** Called when user wants to export */
  onExport?: (format: 'pdf' | 'csv') => void
}

export interface PLViewProps {
  /** P&L data to display */
  plData: PLData
  /** Available entities for filtering */
  entities: Entity[]
  /** Currently selected entity ID */
  selectedEntityId?: string
  /** Available time periods */
  timePeriods: TimePeriod[]
  /** Currently selected time period */
  selectedPeriodId: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes time period */
  onPeriodChange?: (periodId: string) => void
  /** Called when user clicks on a category for drill-down */
  onCategoryClick?: (category: string) => void
  /** Called when user wants to export */
  onExport?: (format: 'pdf' | 'csv') => void
}

export interface BalanceSheetViewProps {
  /** Balance sheet data to display */
  balanceSheetData: BalanceSheetData
  /** Available entities for filtering */
  entities: Entity[]
  /** Currently selected entity ID */
  selectedEntityId?: string
  /** As-of date for the balance sheet */
  asOfDate: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes as-of date */
  onDateChange?: (date: string) => void
  /** Called when user clicks on an account for details */
  onAccountClick?: (account: string) => void
  /** Called when user wants to export */
  onExport?: (format: 'pdf' | 'csv') => void
}

export interface AIInsightsProps {
  /** AI-generated insights to display */
  insights: AIInsight[]
  /** Called when user clicks on an insight for more details */
  onInsightClick?: (insightId: string) => void
  /** Called when user dismisses an insight */
  onDismiss?: (insightId: string) => void
  /** Called when user wants to take action on an insight */
  onTakeAction?: (insightId: string) => void
}
