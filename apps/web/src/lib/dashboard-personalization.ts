/**
 * Intent-driven dashboard personalization
 *
 * Maps onboarding intents (goals selected during signup) to dashboard
 * widget ordering and personalized greeting text.
 */

export interface DashboardConfig {
  greeting: string
  /** Stat labels in preferred order (first = most prominent) */
  statOrder: string[]
  /** Widget IDs to visually emphasize */
  highlightWidgets: string[]
}

const DEFAULT_STAT_ORDER = [
  'Revenue',
  'Expenses',
  'Profit',
  'Receivables',
  'Payables',
  'Runway',
  'Cash Burn',
]

const INTENT_CONFIGS: Record<string, DashboardConfig> = {
  'track-spending': {
    greeting: "Let's see where your money went",
    statOrder: ['Expenses', 'Cash Burn', 'Profit', 'Revenue', 'Receivables', 'Payables', 'Runway'],
    highlightWidgets: ['Expenses', 'Cash Burn'],
  },
  saving: {
    greeting: 'Building your financial foundation',
    statOrder: ['Profit', 'Revenue', 'Expenses', 'Runway', 'Cash Burn', 'Receivables', 'Payables'],
    highlightWidgets: ['Profit', 'Runway'],
  },
  'tax-ready': {
    greeting: 'Staying ahead of tax season',
    statOrder: ['Revenue', 'Expenses', 'Profit', 'Receivables', 'Payables', 'Cash Burn', 'Runway'],
    highlightWidgets: ['Revenue', 'Expenses'],
  },
  debt: {
    greeting: 'Keeping your debt under control',
    statOrder: ['Payables', 'Expenses', 'Cash Burn', 'Runway', 'Revenue', 'Profit', 'Receivables'],
    highlightWidgets: ['Payables', 'Cash Burn'],
  },
  exploring: {
    greeting: 'Your financial command center',
    statOrder: DEFAULT_STAT_ORDER,
    highlightWidgets: [],
  },
}

const DEFAULT_CONFIG: DashboardConfig = {
  greeting: 'Your financial command center',
  statOrder: DEFAULT_STAT_ORDER,
  highlightWidgets: [],
}

/**
 * Get dashboard configuration based on user's onboarding intents.
 *
 * Uses the first intent as the primary driver (most users pick 1-2).
 * Falls back to default if no intents or unknown intent.
 */
export function getDashboardConfig(intents: string[]): DashboardConfig {
  if (intents.length === 0) {
    return DEFAULT_CONFIG
  }

  // Use first intent as primary driver
  const primaryIntent = intents[0]
  return INTENT_CONFIGS[primaryIntent] ?? DEFAULT_CONFIG
}
