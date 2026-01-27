// =============================================================================
// Data Types
// =============================================================================

export interface Entity {
  id: string
  name: string
  type: 'personal' | 'business'
  currency: string
}

export interface Budget {
  id: string
  entityId: string
  entityName: string
  categoryId: string | null
  categoryName: string
  period: 'monthly' | 'quarterly' | 'yearly'
  periodLabel: string
  startDate: string
  endDate: string
  budgetedAmount: number
  actualAmount: number
  variance: number
  percentUsed: number
  status: 'on-track' | 'warning' | 'exceeded'
}

export interface Goal {
  id: string
  entityId: string
  entityName: string
  name: string
  description: string
  type: 'savings' | 'debt-paydown' | 'retirement'
  targetAmount: number
  currentAmount: number
  remainingAmount: number
  percentComplete: number
  targetDate: string
  startDate: string
  daysRemaining: number
  monthsRemaining: number
  suggestedMonthlyContribution: number
  status: 'on-track' | 'warning' | 'off-track'
  linkedAccountId: string
  linkedAccountName: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
}

export interface TimePeriod {
  id: string
  label: string
  startDate: string | null
  endDate: string | null
}

export interface SavingsCalculatorInputs {
  targetAmount: number
  currentAmount: number
  monthlyContribution: number
  annualInterestRate: number
}

export interface SavingsCalculatorResult {
  monthsToGoal: number
  totalContributions: number
  totalInterest: number
  finalAmount: number
}

export interface DebtPayoffCalculatorInputs {
  currentBalance: number
  annualInterestRate: number
  monthlyPayment: number
}

export interface DebtPayoffCalculatorResult {
  monthsToPayoff: number
  totalInterestPaid: number
  totalAmountPaid: number
}

export interface BudgetAllocationInputs {
  monthlyIncome: number
  allocationMethod: '50-30-20' | '70-20-10' | 'custom'
}

export interface BudgetAllocationResult {
  needs: number
  wants: number
  savings: number
}

export interface RetirementCalculatorInputs {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  annualReturn: number
}

export interface RetirementCalculatorResult {
  yearsToRetirement: number
  projectedSavings: number
  totalContributions: number
  totalGrowth: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface BudgetsViewProps {
  /** List of budgets to display */
  budgets: Budget[]
  /** Available entities for filtering */
  entities: Entity[]
  /** Available categories for budget creation */
  categories: Category[]
  /** Available time periods */
  timePeriods: TimePeriod[]
  /** Currently selected entity ID (undefined = all entities) */
  selectedEntityId?: string
  /** Currently selected time period */
  selectedPeriodId: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes time period */
  onPeriodChange?: (periodId: string) => void
  /** Called when user creates a new budget */
  onCreate?: (budget: Partial<Budget>) => void
  /** Called when user wants to edit a budget */
  onEdit?: (budgetId: string) => void
  /** Called when user wants to delete a budget */
  onDelete?: (budgetId: string) => void
  /** Called when user clicks on a budget for details */
  onBudgetClick?: (budgetId: string) => void
}

export interface GoalsViewProps {
  /** List of goals to display */
  goals: Goal[]
  /** Available entities for filtering */
  entities: Entity[]
  /** Available time periods */
  timePeriods: TimePeriod[]
  /** Currently selected entity ID (undefined = all entities) */
  selectedEntityId?: string
  /** Currently selected time period */
  selectedPeriodId: string
  /** Called when user changes entity filter */
  onEntityChange?: (entityId?: string) => void
  /** Called when user changes time period */
  onPeriodChange?: (periodId: string) => void
  /** Called when user creates a new goal */
  onCreate?: (goal: Partial<Goal>) => void
  /** Called when user wants to edit a goal */
  onEdit?: (goalId: string) => void
  /** Called when user wants to delete a goal */
  onDelete?: (goalId: string) => void
  /** Called when user clicks on a goal for details */
  onGoalClick?: (goalId: string) => void
  /** Called when user wants to make a contribution to a goal */
  onContribute?: (goalId: string) => void
}

export interface CalculatorsViewProps {
  /** Called when savings calculator is run */
  onSavingsCalculate?: (inputs: SavingsCalculatorInputs) => SavingsCalculatorResult
  /** Called when debt payoff calculator is run */
  onDebtCalculate?: (inputs: DebtPayoffCalculatorInputs) => DebtPayoffCalculatorResult
  /** Called when budget allocation calculator is run */
  onBudgetAllocationCalculate?: (inputs: BudgetAllocationInputs) => BudgetAllocationResult
  /** Called when retirement calculator is run */
  onRetirementCalculate?: (inputs: RetirementCalculatorInputs) => RetirementCalculatorResult
}
