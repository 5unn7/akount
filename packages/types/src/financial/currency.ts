/**
 * Supported currencies in Akount.
 * Based on design-system multi-currency requirements.
 */
export const CURRENCIES = [
  'CAD',
  'USD',
  'EUR',
  'GBP',
  'INR',
  'AUD',
  'JPY',
  'CHF',
] as const;

export type Currency = (typeof CURRENCIES)[number];

/**
 * Currency metadata for display and formatting.
 */
export interface CurrencyInfo {
  symbol: string;
  name: string;
  decimals: number;
  flag: string;
  locale: string;
}

export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  CAD: {
    symbol: '$',
    name: 'Canadian Dollar',
    decimals: 2,
    flag: '\u{1F1E8}\u{1F1E6}',
    locale: 'en-CA',
  },
  USD: {
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    flag: '\u{1F1FA}\u{1F1F8}',
    locale: 'en-US',
  },
  EUR: {
    symbol: '\u20AC',
    name: 'Euro',
    decimals: 2,
    flag: '\u{1F1EA}\u{1F1FA}',
    locale: 'de-DE',
  },
  GBP: {
    symbol: '\u00A3',
    name: 'British Pound',
    decimals: 2,
    flag: '\u{1F1EC}\u{1F1E7}',
    locale: 'en-GB',
  },
  INR: {
    symbol: '\u20B9',
    name: 'Indian Rupee',
    decimals: 2,
    flag: '\u{1F1EE}\u{1F1F3}',
    locale: 'en-IN',
  },
  AUD: {
    symbol: '$',
    name: 'Australian Dollar',
    decimals: 2,
    flag: '\u{1F1E6}\u{1F1FA}',
    locale: 'en-AU',
  },
  JPY: {
    symbol: '\u00A5',
    name: 'Japanese Yen',
    decimals: 0,
    flag: '\u{1F1EF}\u{1F1F5}',
    locale: 'ja-JP',
  },
  CHF: {
    symbol: 'Fr',
    name: 'Swiss Franc',
    decimals: 2,
    flag: '\u{1F1E8}\u{1F1ED}',
    locale: 'de-CH',
  },
};

/**
 * Check if a string is a valid currency code.
 */
export function isCurrency(value: string): value is Currency {
  return CURRENCIES.includes(value as Currency);
}

/**
 * Get currency info, with fallback to CAD if not found.
 */
export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_INFO[currency] ?? CURRENCY_INFO.CAD;
}

/**
 * Default currency for new entities.
 */
export const DEFAULT_CURRENCY: Currency = 'CAD';
