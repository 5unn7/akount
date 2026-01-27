import { ChevronDown, TrendingUp, ChevronRight, AlertCircle, Sparkles, Plus } from 'lucide-react'
import type { AccountsOverviewProps } from '../types'
import { NetWorthCard } from './NetWorthCard'
import { CashPositionCard } from './CashPositionCard'
import { InsightCard } from './InsightCard'
import { AccountsList } from './AccountsList'

/**
 * Accounts Overview - Financial command center
 *
 * Design tokens:
 * - Primary: orange (warm, friendly)
 * - Secondary: violet (sophisticated, modern)
 * - Neutral: slate (cool, professional)
 * - Typography: Newsreader (headings), Manrope (body), JetBrains Mono (numbers)
 */
export function AccountsOverview({
  entities,
  accounts,
  currencies,
  fxRates,
  insights,
  summary,
  callToActions,
  selectedEntityId,
  selectedCurrency,
  onAccountClick,
  onInsightClick,
  onCallToActionClick,
  onEntityChange,
  onCurrencyToggle,
  onConnectBank,
}: AccountsOverviewProps) {
  const selectedEntity = selectedEntityId
    ? entities.find(e => e.id === selectedEntityId)
    : undefined

  const baseCurrency = selectedCurrency || summary.netWorth.currency

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header with controls */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 font-[family-name:var(--font-heading)]">
                Financial Overview
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-[family-name:var(--font-body)]">
                Your complete financial picture across all accounts
              </p>
            </div>

            {/* Control Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Entity Selector */}
              <button
                onClick={() => onEntityChange?.(undefined)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)] flex items-center gap-2"
              >
                <span>{selectedEntity ? selectedEntity.name : 'All Entities'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Currency Toggle */}
              <button
                onClick={() => onCurrencyToggle?.(selectedCurrency ? undefined : baseCurrency)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 font-[family-name:var(--font-body)] flex items-center gap-2"
              >
                <span>{selectedCurrency ? `View all in ${selectedCurrency}` : 'Native Currencies'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <NetWorthCard
            netWorth={summary.netWorth}
            currency={baseCurrency}
          />
          <CashPositionCard
            cash={summary.cash}
            debt={summary.debt}
            currency={baseCurrency}
          />
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 font-[family-name:var(--font-heading)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Insights & Recommendations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.slice(0, 3).map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => onInsightClick?.(insight.linkedView)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Call to Actions */}
        {callToActions.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3">
              {callToActions.map((cta) => {
                const isHighPriority = cta.priority === 'high'
                return (
                  <button
                    key={cta.id}
                    onClick={() => onCallToActionClick?.(cta.action)}
                    className={`
                      px-4 py-2.5 rounded-lg font-medium text-sm font-[family-name:var(--font-body)] transition-all flex items-center gap-2
                      ${isHighPriority
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }
                    `}
                  >
                    {cta.type === 'connection' && <Plus className="w-4 h-4" />}
                    {cta.type === 'reconciliation' && <AlertCircle className="w-4 h-4" />}
                    {cta.label}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Accounts List */}
        <AccountsList
          accounts={accounts}
          entities={entities}
          selectedEntityId={selectedEntityId}
          selectedCurrency={selectedCurrency}
          baseCurrency={baseCurrency}
          fxRates={fxRates}
          onAccountClick={onAccountClick}
        />
      </div>
    </div>
  )
}
