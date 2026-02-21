import { describe, it, expect } from 'vitest'
import { getDashboardConfig } from '../dashboard-personalization'

describe('getDashboardConfig', () => {
  it('returns default config for empty intents', () => {
    const config = getDashboardConfig([])
    expect(config.greeting).toBe('Your financial command center')
    expect(config.statOrder[0]).toBe('Revenue')
    expect(config.highlightWidgets).toEqual([])
  })

  it('returns track-spending config', () => {
    const config = getDashboardConfig(['track-spending'])
    expect(config.greeting).toBe("Let's see where your money went")
    expect(config.statOrder[0]).toBe('Expenses')
    expect(config.highlightWidgets).toContain('Expenses')
  })

  it('returns saving config', () => {
    const config = getDashboardConfig(['saving'])
    expect(config.greeting).toBe('Building your financial foundation')
    expect(config.statOrder[0]).toBe('Profit')
    expect(config.highlightWidgets).toContain('Profit')
  })

  it('returns tax-ready config', () => {
    const config = getDashboardConfig(['tax-ready'])
    expect(config.greeting).toBe('Staying ahead of tax season')
    expect(config.statOrder[0]).toBe('Revenue')
    expect(config.highlightWidgets).toContain('Revenue')
    expect(config.highlightWidgets).toContain('Expenses')
  })

  it('returns debt config', () => {
    const config = getDashboardConfig(['debt'])
    expect(config.greeting).toBe('Keeping your debt under control')
    expect(config.statOrder[0]).toBe('Payables')
    expect(config.highlightWidgets).toContain('Payables')
  })

  it('returns exploring (default) config', () => {
    const config = getDashboardConfig(['exploring'])
    expect(config.greeting).toBe('Your financial command center')
    expect(config.highlightWidgets).toEqual([])
  })

  it('uses first intent as primary when multiple intents given', () => {
    const config = getDashboardConfig(['debt', 'track-spending', 'saving'])
    expect(config.greeting).toBe('Keeping your debt under control')
    expect(config.statOrder[0]).toBe('Payables')
  })

  it('falls back to default for unknown intent', () => {
    const config = getDashboardConfig(['unknown-intent'])
    expect(config.greeting).toBe('Your financial command center')
    expect(config.statOrder[0]).toBe('Revenue')
  })

  it('preserves all 7 stat labels in every config', () => {
    const allLabels = ['Revenue', 'Expenses', 'Profit', 'Receivables', 'Payables', 'Runway', 'Cash Burn']
    const intents = ['track-spending', 'saving', 'tax-ready', 'debt', 'exploring', '']

    for (const intent of intents) {
      const config = getDashboardConfig(intent ? [intent] : [])
      expect(config.statOrder).toHaveLength(7)
      for (const label of allLabels) {
        expect(config.statOrder).toContain(label)
      }
    }
  })
})
