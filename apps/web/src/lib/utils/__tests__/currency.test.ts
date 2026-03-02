import { describe, it, expect } from 'vitest'
import {
    formatCurrency,
    formatCompactNumber,
    formatCents,
    parseCentsInput,
} from '../currency'

describe('formatCurrency', () => {
    it('formats positive cents as CAD by default', () => {
        const result = formatCurrency(450000)
        expect(result).toContain('4,500.00')
        expect(result).toContain('$')
    })

    it('formats zero cents', () => {
        const result = formatCurrency(0)
        expect(result).toContain('0.00')
    })

    it('formats negative cents', () => {
        const result = formatCurrency(-150075)
        expect(result).toContain('1,500.75')
    })

    it('formats single cent amounts', () => {
        const result = formatCurrency(1)
        expect(result).toContain('0.01')
    })

    it('formats large amounts (millions)', () => {
        const result = formatCurrency(100000000) // $1,000,000.00
        expect(result).toContain('1,000,000.00')
    })

    it('formats with USD currency', () => {
        const result = formatCurrency(10050, 'USD')
        expect(result).toContain('100.50')
        expect(result).toContain('$')
    })

    it('formats with EUR currency', () => {
        const result = formatCurrency(10050, 'EUR', 'en-CA')
        expect(result).toContain('100.50')
    })

    it('always shows 2 decimal places', () => {
        const result = formatCurrency(10000) // $100.00
        expect(result).toMatch(/100\.00/)
    })

    it('handles amounts that could cause float precision issues', () => {
        // 0.1 + 0.2 != 0.3 in float, but we use integer cents
        const result = formatCurrency(30) // $0.30
        expect(result).toContain('0.30')
    })
})

describe('formatCompactNumber', () => {
    it('formats thousands with K suffix', () => {
        const result = formatCompactNumber(1500)
        expect(result).toMatch(/1\.5K/i)
    })

    it('formats millions with M suffix', () => {
        const result = formatCompactNumber(1500000)
        expect(result).toMatch(/1\.5M/i)
    })

    it('formats billions with B suffix', () => {
        const result = formatCompactNumber(1500000000)
        expect(result).toMatch(/1\.5B/i)
    })

    it('formats small numbers without suffix', () => {
        const result = formatCompactNumber(500)
        expect(result).toBe('500')
    })

    it('formats zero', () => {
        const result = formatCompactNumber(0)
        expect(result).toBe('0')
    })

    it('formats negative numbers', () => {
        const result = formatCompactNumber(-2500)
        expect(result).toMatch(/-2\.5K/i)
    })

    it('rounds to 1 decimal place', () => {
        const result = formatCompactNumber(1550)
        expect(result).toMatch(/1\.6K|1\.5K/i) // Locale-dependent rounding
    })
})

describe('formatCents', () => {
    it('formats standard amount', () => {
        expect(formatCents(1050)).toBe('10.50')
    })

    it('formats zero', () => {
        expect(formatCents(0)).toBe('0.00')
    })

    it('formats single cent', () => {
        expect(formatCents(1)).toBe('0.01')
    })

    it('formats whole dollar amount', () => {
        expect(formatCents(10000)).toBe('100.00')
    })

    it('formats negative amount', () => {
        expect(formatCents(-5000)).toBe('-50.00')
    })

    it('formats large amount', () => {
        expect(formatCents(999999)).toBe('9999.99')
    })
})

describe('parseCentsInput', () => {
    it('parses standard decimal input', () => {
        expect(parseCentsInput('10.50')).toBe(1050)
    })

    it('parses whole number input', () => {
        expect(parseCentsInput('100')).toBe(10000)
    })

    it('parses zero', () => {
        expect(parseCentsInput('0')).toBe(0)
    })

    it('returns 0 for invalid input', () => {
        expect(parseCentsInput('invalid')).toBe(0)
    })

    it('returns 0 for empty string', () => {
        expect(parseCentsInput('')).toBe(0)
    })

    it('parses negative values', () => {
        expect(parseCentsInput('-25.50')).toBe(-2550)
    })

    it('rounds fractional cents correctly', () => {
        // 10.555 should round to 1056 cents
        expect(parseCentsInput('10.555')).toBe(1056)
    })

    it('handles leading/trailing spaces via parseFloat', () => {
        expect(parseCentsInput('  50.00  ')).toBe(5000)
    })

    it('parses single decimal place', () => {
        expect(parseCentsInput('10.5')).toBe(1050)
    })

    it('parses no decimal places', () => {
        expect(parseCentsInput('42')).toBe(4200)
    })
})
