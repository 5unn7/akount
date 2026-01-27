import type { GLAccount } from '../types'
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from '../../shell/components/useSpotlight'

interface GLAccountRowProps {
  account: GLAccount
}

export function GLAccountRow({ account }: GLAccountRowProps) {
  // TODO: Uncomment when useSpotlight is available
  // const { elementRef, spotlightStyle } = useSpotlight()

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: account.currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(account.balance))

  return (
    <div
      // ref={elementRef}
      // style={spotlightStyle}
      className="relative px-6 py-4 transition-colors"
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Code */}
        <div className="col-span-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-mono)]">
            {account.code}
          </span>
        </div>

        {/* Name */}
        <div className="col-span-5">
          <span className="text-sm font-medium text-slate-900 dark:text-white font-[family-name:var(--font-body)]">
            {account.name}
          </span>
        </div>

        {/* Normal Balance */}
        <div className="col-span-2">
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium font-[family-name:var(--font-body)]">
            {account.normalBalance === 'debit' ? 'Dr' : 'Cr'} Balance
          </span>
        </div>

        {/* Balance */}
        <div className="col-span-3 text-right">
          <span className="text-sm font-bold text-slate-900 dark:text-white font-[family-name:var(--font-mono)]">
            {formattedBalance}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-[family-name:var(--font-body)]">
            {account.currency}
          </p>
        </div>
      </div>
    </div>
  )
}
