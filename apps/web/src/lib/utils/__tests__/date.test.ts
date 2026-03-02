import { describe, it, expect } from 'vitest'
import {
    formatDate,
    formatDateTime,
    formatDateSplit,
    formatMonthYear,
} from '../date'

describe('formatDate', () => {
    it('formats standard ISO date', () => {
        const result = formatDate('2024-01-15T10:30:00Z')
        expect(result).toContain('Jan')
        expect(result).toContain('15')
        expect(result).toContain('2024')
    })

    it('formats different months correctly', () => {
        // Use midday UTC to avoid timezone shift across month boundaries
        expect(formatDate('2024-06-15T12:00:00Z')).toContain('Jun')
        expect(formatDate('2024-12-25T12:00:00Z')).toContain('Dec')
    })

    it('formats year boundary dates', () => {
        const result = formatDate('2024-12-31T23:59:59Z')
        expect(result).toContain('2024') // or 2025 depending on timezone
    })

    it('handles ISO date without time', () => {
        const result = formatDate('2024-03-01')
        expect(result).toContain('2024')
    })
})

describe('formatDateTime', () => {
    it('formats date with time', () => {
        const result = formatDateTime('2024-01-15T18:30:00Z')
        expect(result).toContain('Jan')
        expect(result).toContain('15')
        expect(result).toContain('2024')
    })

    it('includes time component with AM/PM', () => {
        const result = formatDateTime('2024-01-15T18:45:00Z')
        expect(result).toContain('2024')
        // Should contain AM or PM since we use hour12: true
        expect(result).toMatch(/[AP]\.?M\.?/i)
    })

    it('formats different times', () => {
        const morning = formatDateTime('2024-06-15T14:00:00Z')
        const evening = formatDateTime('2024-06-15T22:00:00Z')
        // Both should be valid formatted strings
        expect(morning).toBeTruthy()
        expect(evening).toBeTruthy()
    })
})

describe('formatDateSplit', () => {
    it('returns day and month separately', () => {
        const result = formatDateSplit('2024-01-15T10:30:00Z')
        expect(result).toHaveProperty('day')
        expect(result).toHaveProperty('month')
    })

    it('returns day as string number', () => {
        const result = formatDateSplit('2024-01-15T10:30:00Z')
        expect(parseInt(result.day)).toBeGreaterThanOrEqual(1)
        expect(parseInt(result.day)).toBeLessThanOrEqual(31)
    })

    it('returns month as uppercase abbreviation', () => {
        const result = formatDateSplit('2024-06-15T12:00:00Z')
        expect(result.month).toMatch(/^[A-Z]{3}$/)
    })

    it('handles January correctly', () => {
        const result = formatDateSplit('2024-01-15T12:00:00Z')
        expect(result.month).toBe('JAN')
    })

    it('handles December correctly', () => {
        const result = formatDateSplit('2024-12-25T12:00:00Z')
        expect(result.month).toBe('DEC')
    })

    it('handles single-digit days', () => {
        // Use midday UTC to avoid timezone shift across day boundaries
        const result = formatDateSplit('2024-03-05T12:00:00Z')
        expect(result.day).toBe('5') // Not '05'
    })
})

describe('formatMonthYear', () => {
    it('formats month and year', () => {
        const result = formatMonthYear('2024-01-15T10:30:00Z')
        expect(result).toContain('Jan')
        expect(result).toContain('2024')
    })

    it('does not include day', () => {
        const result = formatMonthYear('2024-01-15T10:30:00Z')
        expect(result).not.toContain('15')
    })

    it('handles different months', () => {
        // Use midday UTC to avoid timezone shift across month boundaries
        expect(formatMonthYear('2024-06-15T12:00:00Z')).toContain('Jun')
        expect(formatMonthYear('2024-12-15T12:00:00Z')).toContain('Dec')
        expect(formatMonthYear('2024-09-15T12:00:00Z')).toContain('Sep')
    })

    it('handles year boundaries', () => {
        expect(formatMonthYear('2025-01-15T12:00:00Z')).toContain('2025')
    })
})
