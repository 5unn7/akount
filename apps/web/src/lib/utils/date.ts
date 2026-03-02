/**
 * Date formatting utilities
 *
 * Canonical location for all date formatting functions.
 * Uses en-CA locale for consistency across the app.
 *
 * @example
 * ```ts
 * import { formatDate, formatDateTime, formatDateSplit } from '@/lib/utils/date';
 *
 * formatDate('2024-01-15T10:30:00Z')        // "Jan 15, 2024"
 * formatDateTime('2024-01-15T10:30:00Z')    // "Jan 15, 2024, 10:30 AM"
 * formatDateSplit('2024-01-15T10:30:00Z')   // { day: "15", month: "JAN" }
 * ```
 */

/**
 * Format ISO date string to readable date (e.g., "Jan 15, 2024")
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date string
 */
export function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format ISO date string to date with time (e.g., "Jan 15, 2024, 10:30 AM")
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted date and time string
 */
export function formatDateTime(isoDate: string): string {
    return new Date(isoDate).toLocaleString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Format ISO date string to split day/month object for calendar UI
 *
 * @param isoDate - ISO 8601 date string
 * @returns Object with day (number string) and month (uppercase 3-letter abbrev)
 *
 * @example
 * ```ts
 * formatDateSplit('2024-01-15T10:30:00Z')  // { day: "15", month: "JAN" }
 * ```
 */
export function formatDateSplit(isoDate: string): { day: string; month: string } {
    const date = new Date(isoDate);
    return {
        day: date.getDate().toString(),
        month: date.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase(),
    };
}

/**
 * Format ISO date string to month and year (e.g., "Jan 2024")
 *
 * @param isoDate - ISO 8601 date string
 * @returns Formatted month and year string
 *
 * @example
 * ```ts
 * formatMonthYear('2024-01-15T10:30:00Z')  // "Jan 2024"
 * ```
 */
export function formatMonthYear(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
    });
}
