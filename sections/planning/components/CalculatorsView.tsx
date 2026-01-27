import React, { useState } from 'react'
import {
  Calculator,
  PiggyBank,
  CreditCard,
  PieChart,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import type { CalculatorsViewProps } from '../types'

export function CalculatorsView({
  onSavingsCalculate,
  onDebtCalculate,
  onBudgetAllocationCalculate,
  onRetirementCalculate,
}: CalculatorsViewProps) {
  const [activeCalculator, setActiveCalculator] = useState<'savings' | 'debt' | 'budget' | 'retirement'>('savings')

  // Savings Calculator State
  const [savingsInputs, setSavingsInputs] = useState({
    targetAmount: 10000,
    currentAmount: 2000,
    monthlyContribution: 500,
    annualInterestRate: 5,
  })
  const [savingsResult, setSavingsResult] = useState<any>(null)

  // Debt Calculator State
  const [debtInputs, setDebtInputs] = useState({
    currentBalance: 5000,
    annualInterestRate: 18,
    monthlyPayment: 300,
  })
  const [debtResult, setDebtResult] = useState<any>(null)

  // Budget Allocation State
  const [budgetInputs, setBudgetInputs] = useState({
    monthlyIncome: 5000,
    allocationMethod: '50-30-20' as const,
  })
  const [budgetResult, setBudgetResult] = useState<any>(null)

  // Retirement Calculator State
  const [retirementInputs, setRetirementInputs] = useState({
    currentAge: 30,
    retirementAge: 65,
    currentSavings: 50000,
    monthlyContribution: 1000,
    annualReturn: 7,
  })
  const [retirementResult, setRetirementResult] = useState<any>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const calculators = [
    { id: 'savings' as const, label: 'Savings', icon: PiggyBank },
    { id: 'debt' as const, label: 'Debt Payoff', icon: CreditCard },
    { id: 'budget' as const, label: 'Budget Allocation', icon: PieChart },
    { id: 'retirement' as const, label: 'Retirement', icon: Sparkles },
  ]

  const handleSavingsCalculate = () => {
    const result = onSavingsCalculate?.(savingsInputs)
    setSavingsResult(result || {
      monthsToGoal: 17,
      totalContributions: 8500,
      totalInterest: 500,
      finalAmount: 11000,
    })
  }

  const handleDebtCalculate = () => {
    const result = onDebtCalculate?.(debtInputs)
    setDebtResult(result || {
      monthsToPayoff: 19,
      totalInterestPaid: 720,
      totalAmountPaid: 5720,
    })
  }

  const handleBudgetCalculate = () => {
    const result = onBudgetAllocationCalculate?.(budgetInputs)
    setBudgetResult(result || {
      needs: 2500,
      wants: 1500,
      savings: 1000,
    })
  }

  const handleRetirementCalculate = () => {
    const result = onRetirementCalculate?.(retirementInputs)
    setRetirementResult(result || {
      yearsToRetirement: 35,
      projectedSavings: 1450000,
      totalContributions: 420000,
      totalGrowth: 1030000,
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Calculator Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {calculators.map((calc) => {
          const Icon = calc.icon
          const isActive = activeCalculator === calc.id
          return (
            <button
              key={calc.id}
              onClick={() => setActiveCalculator(calc.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {calc.label}
            </button>
          )
        })}
      </div>

      {/* Savings Calculator */}
      {activeCalculator === 'savings' && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/50">
              <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Savings Calculator</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Calculate how long to reach your savings goal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Amount
              </label>
              <input
                type="number"
                value={savingsInputs.targetAmount}
                onChange={(e) => setSavingsInputs({ ...savingsInputs, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={savingsInputs.currentAmount}
                onChange={(e) => setSavingsInputs({ ...savingsInputs, currentAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Monthly Contribution
              </label>
              <input
                type="number"
                value={savingsInputs.monthlyContribution}
                onChange={(e) => setSavingsInputs({ ...savingsInputs, monthlyContribution: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={savingsInputs.annualInterestRate}
                onChange={(e) => setSavingsInputs({ ...savingsInputs, annualInterestRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            onClick={handleSavingsCalculate}
            className="w-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculate
            <ArrowRight className="w-4 h-4" />
          </button>

          {savingsResult && (
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Results</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Time to Goal</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {savingsResult.monthsToGoal} months
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Contributions</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(savingsResult.totalContributions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Interest Earned</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(savingsResult.totalInterest)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Final Amount</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(savingsResult.finalAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debt Payoff Calculator */}
      {activeCalculator === 'debt' && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/50">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Debt Payoff Calculator</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Calculate time to pay off debt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Balance
              </label>
              <input
                type="number"
                value={debtInputs.currentBalance}
                onChange={(e) => setDebtInputs({ ...debtInputs, currentBalance: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Annual Interest Rate (%)
              </label>
              <input
                type="number"
                value={debtInputs.annualInterestRate}
                onChange={(e) => setDebtInputs({ ...debtInputs, annualInterestRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Monthly Payment
              </label>
              <input
                type="number"
                value={debtInputs.monthlyPayment}
                onChange={(e) => setDebtInputs({ ...debtInputs, monthlyPayment: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            onClick={handleDebtCalculate}
            className="w-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculate
            <ArrowRight className="w-4 h-4" />
          </button>

          {debtResult && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Results</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Payoff Time</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {debtResult.monthsToPayoff} months
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Interest Paid</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(debtResult.totalInterestPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(debtResult.totalAmountPaid)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget Allocation Calculator */}
      {activeCalculator === 'budget' && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/50">
              <PieChart className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Budget Allocation Calculator</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Suggest budget allocations based on income
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Monthly Income
              </label>
              <input
                type="number"
                value={budgetInputs.monthlyIncome}
                onChange={(e) => setBudgetInputs({ ...budgetInputs, monthlyIncome: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Allocation Method
              </label>
              <select
                value={budgetInputs.allocationMethod}
                onChange={(e) => setBudgetInputs({ ...budgetInputs, allocationMethod: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="50-30-20">50/30/20 Rule</option>
                <option value="70-20-10">70/20/10 Rule</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleBudgetCalculate}
            className="w-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculate
            <ArrowRight className="w-4 h-4" />
          </button>

          {budgetResult && (
            <div className="mt-6 p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Results</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Needs (50%)</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(budgetResult.needs)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Wants (30%)</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(budgetResult.wants)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Savings (20%)</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(budgetResult.savings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retirement Calculator */}
      {activeCalculator === 'retirement' && (
        <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950/50">
              <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Retirement Calculator</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Project retirement savings growth over time
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Age
              </label>
              <input
                type="number"
                value={retirementInputs.currentAge}
                onChange={(e) => setRetirementInputs({ ...retirementInputs, currentAge: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Retirement Age
              </label>
              <input
                type="number"
                value={retirementInputs.retirementAge}
                onChange={(e) => setRetirementInputs({ ...retirementInputs, retirementAge: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Savings
              </label>
              <input
                type="number"
                value={retirementInputs.currentSavings}
                onChange={(e) => setRetirementInputs({ ...retirementInputs, currentSavings: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Monthly Contribution
              </label>
              <input
                type="number"
                value={retirementInputs.monthlyContribution}
                onChange={(e) => setRetirementInputs({ ...retirementInputs, monthlyContribution: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                value={retirementInputs.annualReturn}
                onChange={(e) => setRetirementInputs({ ...retirementInputs, annualReturn: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <button
            onClick={handleRetirementCalculate}
            className="w-full px-4 py-3 text-sm font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Calculate
            <ArrowRight className="w-4 h-4" />
          </button>

          {retirementResult && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Results</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Years to Retirement</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {retirementResult.yearsToRetirement} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Projected Savings</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(retirementResult.projectedSavings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Contributions</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatCurrency(retirementResult.totalContributions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Investment Growth</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(retirementResult.totalGrowth)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
