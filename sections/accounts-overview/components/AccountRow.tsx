import { AlertCircle, Building2, User } from 'lucide-react'
import type { Account, Entity, FxRate } from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from './useSpotlight'

interface AccountRowProps {
  account: Account
  entity?: Entity
  selectedCurrency?: string
  baseCurrency: string
  fxRates: FxRate[]
  onClick?: () => void
}

export function AccountRow({
  account,
  entity,
  selectedCurrency,
  baseCurrency,
  fxRates,
  onClick,
}: AccountRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  // Find exchange rate if currency conversion is needed
  const needsConversion = selectedCurrency && account.currency !== selectedCurrency
  const fxRate = needsConversion
    ? fxRates.find(rate => rate.from === account.currency && rate.to === selectedCurrency)
    : undefined
  const convertedBalance = fxRate ? account.balance * fxRate.rate : account.balance

  const formattedNativeBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: account.currency,
    minimumFractionDigits: 2,
  }).format(account.balance)

  const formattedConvertedBalance = selectedCurrency && needsConversion
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
      }).format(convertedBalance)
    : null

  // Country flag emoji mapping
  const countryFlags: Record<string, string> = {
    CA: '🇨🇦',
    US: '🇺🇸',
    IN: '🇮🇳',
  }

  const hasWarning = account.unmatchedTransactions > 0

  return (
    <button
      // ref={elementRef as any}
      // style={spotlightStyle}
      onClick={onClick}
      className="relative w-full px-6 py-4 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Account Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate font-[family-name:var(--font-body)]">
              {account.name}
            </h4>
            {hasWarning && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium font-[family-name:var(--font-body)]">
                <AlertCircle className="w-3 h-3" />
                {account.unmatchedTransactions}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-[family-name:var(--font-body)]">{account.institution}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>{countryFlags[account.country] || account.country}</span>
            </span>
            {entity && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-[family-name:var(--font-body)]">
                  {entity.type === 'personal' ? (
                    <User className="w-3 h-3" />
                  ) : (
                    <Building2 className="w-3 h-3" />
                  )}
                  {entity.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className={`text-base font-bold font-[family-name:var(--font-mono)] ${
            account.balance < 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {formattedNativeBalance}
          </p>
          {formattedConvertedBalance && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-[family-name:var(--font-mono)]">
              ≈ {formattedConvertedBalance}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
