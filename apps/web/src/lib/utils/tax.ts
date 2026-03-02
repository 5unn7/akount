/**
 * Tax rate utilities for basis points ↔ percentage conversion
 *
 * Following integer-based financial data standard:
 * - Database/API: basis points (500 = 5%)
 * - User display: percentage (5%)
 * - Form input: percentage → converted to BP before API call
 *
 * This follows the same pattern as currency.ts for consistent
 * handling of financial data (no floats, integer-based storage).
 */

/**
 * Format basis points as percentage string for display
 *
 * @param basisPoints - Tax rate in basis points (500 = 5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatTaxRate(500) // "5.00%"
 * formatTaxRate(1300) // "13.00%"
 * formatTaxRate(725) // "7.25%"
 * formatTaxRate(500, 0) // "5%"
 */
export function formatTaxRate(basisPoints: number, decimals: number = 2): string {
    const percentage = basisPoints / 100;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * Convert percentage to basis points for API submission
 *
 * @param percentage - Tax rate as percentage (5 = 5%)
 * @returns Basis points (500)
 *
 * @example
 * percentToBasisPoints(5) // 500
 * percentToBasisPoints(13) // 1300
 * percentToBasisPoints(7.25) // 725
 */
export function percentToBasisPoints(percentage: number): number {
    return Math.round(percentage * 100);
}

/**
 * Convert basis points to percentage number (for form inputs)
 *
 * @param basisPoints - Tax rate in basis points (500 = 5%)
 * @returns Percentage as number (5)
 *
 * @example
 * basisPointsToPercent(500) // 5
 * basisPointsToPercent(1300) // 13
 * basisPointsToPercent(725) // 7.25
 */
export function basisPointsToPercent(basisPoints: number): number {
    return basisPoints / 100;
}
