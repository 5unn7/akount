/**
 * Format cents as currency string
 *
 * @param cents - Amount in cents (e.g., 450000 = $4,500.00)
 * @param currency - ISO currency code (default: CAD)
 * @param locale - Locale for formatting (default: en-CA)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(450000, 'CAD') // "$4,500.00"
 * formatCurrency(100050, 'USD') // "$1,000.50"
 */
export function formatCurrency(
    cents: number,
    currency: string = 'CAD',
    locale: string = 'en-CA'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

/**
 * Format a number as a compact string with K/M/B suffixes
 *
 * @param value - The number to format
 * @param locale - Locale for formatting (default: en-CA)
 * @returns Formatted compact string
 *
 * @example
 * formatCompactNumber(1500) // "1.5K"
 * formatCompactNumber(1500000) // "1.5M"
 */
export function formatCompactNumber(
    value: number,
    locale: string = 'en-CA'
): string {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
    }).format(value);
}
