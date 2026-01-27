# Milestone 7: Planning

**Prerequisites:** Foundation, Transactions, Analytics complete

## Goal

Build financial planning tools with budgets, goals, progress tracking, and financial calculators.

## Key Functionality

1. **Budget Creation** - Set budgets by category, entity, time period
2. **Budget Variance** - Actual vs. budgeted with progress bars
3. **Goal Setting** - Savings, debt paydown, investment targets
4. **Goal Progress** - Track progress with suggested monthly contributions
5. **Financial Calculators** - Savings, debt payoff, budget allocation, retirement
6. **Alerts and Warnings** - Notifications when budgets exceeded or goals off-track
7. **Flexible Grouping** - Budget by category, entity, or both
8. **Visual Progress** - Progress bars and charts for budgets and goals

## Components

- `BudgetsView` - Budget list with inline creation, progress bars
- `BudgetRow` - Individual budget with actual vs. budgeted, alerts
- `BudgetForm` - Create budget with category, entity, amount, period
- `GoalsView` - Goal list with inline creation, progress visualization
- `GoalRow` - Individual goal with progress bar, target date, suggestions
- `GoalForm` - Create goal with target amount, deadline, linked accounts
- `CalculatorsView` - Four interactive financial calculators
- `SavingsCalculator` - Calculate savings growth
- `DebtPayoffCalculator` - Plan debt elimination
- `BudgetAllocationCalculator` - Optimize budget distribution
- `RetirementCalculator` - Retirement planning scenarios

## Tab Navigation

- **Budgets** (default)
- **Goals**
- **Calculators**

## Done Checklist

- [ ] Can create budgets with category, entity, period, amount
- [ ] Budget progress bars show actual vs. budgeted
- [ ] Alerts appear when budgets approached or exceeded
- [ ] Can create financial goals with targets and deadlines
- [ ] Goal progress visualizations display correctly
- [ ] Suggested monthly contributions calculate accurately
- [ ] All four calculators work with accurate formulas
- [ ] Calculator results update in real-time
- [ ] Entity and time period filters work
- [ ] Color-coded alerts (green/yellow/red) display
- [ ] Flexible budget grouping by category, entity, or both
- [ ] Tests pass

**Reference:** `sections/planning/`
