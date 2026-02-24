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

/**
 * Format cents as decimal string (for form inputs)
 * DRY-21: Extracted from inline implementations
 *
 * @param cents - Amount in cents (e.g., 1050 = "10.50")
 * @returns Decimal string without currency symbol
 *
 * @example
 * formatCents(1050) // "10.50"
 * formatCents(100) // "1.00"
 */
export function formatCents(cents: number): string {
    return (cents / 100).toFixed(2);
}

/**
 * Parse decimal input string to cents
 * DRY-21: Extracted from inline implementations
 *
 * @param value - Decimal string (e.g., "10.50")
 * @returns Amount in cents (e.g., 1050)
 *
 * @example
 * parseCentsInput("10.50") // 1050
 * parseCentsInput("invalid") // 0
 */
export function parseCentsInput(value: string): number {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
}
