import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '../onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  describe('initial state', () => {
    it('starts at step 0 with 2 total steps', () => {
      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.totalSteps).toBe(2)
    })

    it('has no account type selected', () => {
      expect(useOnboardingStore.getState().accountType).toBeNull()
    })

    it('defaults to Canadian locale', () => {
      const state = useOnboardingStore.getState()
      expect(state.country).toBe('CA')
      expect(state.currency).toBe('CAD')
      expect(state.timezone).toBe('America/Toronto')
    })
  })

  describe('setAccountType', () => {
    it('sets personal with 3 total steps', () => {
      useOnboardingStore.getState().setAccountType('personal')
      const state = useOnboardingStore.getState()
      expect(state.accountType).toBe('personal')
      expect(state.totalSteps).toBe(3)
    })

    it('sets business with 4 total steps', () => {
      useOnboardingStore.getState().setAccountType('business')
      const state = useOnboardingStore.getState()
      expect(state.accountType).toBe('business')
      expect(state.totalSteps).toBe(4)
    })

    it('advances to step 1 after selection', () => {
      useOnboardingStore.getState().setAccountType('personal')
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })
  })

  describe('step navigation', () => {
    it('nextStep increments current step', () => {
      useOnboardingStore.getState().setAccountType('personal') // totalSteps=3, step=1
      useOnboardingStore.getState().nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(2)
    })

    it('nextStep does not exceed totalSteps - 1', () => {
      useOnboardingStore.getState().setAccountType('personal') // totalSteps=3
      useOnboardingStore.getState().nextStep() // step 2
      useOnboardingStore.getState().nextStep() // should stay at 2
      expect(useOnboardingStore.getState().currentStep).toBe(2)
    })

    it('previousStep decrements current step', () => {
      useOnboardingStore.getState().setAccountType('personal') // step=1
      useOnboardingStore.getState().previousStep()
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })

    it('previousStep does not go below 0', () => {
      useOnboardingStore.getState().previousStep()
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })

    it('goToStep navigates to specific step within bounds', () => {
      useOnboardingStore.getState().setAccountType('business') // totalSteps=4
      useOnboardingStore.getState().goToStep(3)
      expect(useOnboardingStore.getState().currentStep).toBe(3)
    })

    it('goToStep clamps to valid range', () => {
      useOnboardingStore.getState().setAccountType('personal') // totalSteps=3
      useOnboardingStore.getState().goToStep(10)
      expect(useOnboardingStore.getState().currentStep).toBe(2) // max = totalSteps - 1

      useOnboardingStore.getState().goToStep(-5)
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })
  })

  describe('form field setters', () => {
    it('sets phone number', () => {
      useOnboardingStore.getState().setPhoneNumber('+1-416-555-1234')
      expect(useOnboardingStore.getState().phoneNumber).toBe('+1-416-555-1234')
    })

    it('sets timezone', () => {
      useOnboardingStore.getState().setTimezone('America/Vancouver')
      expect(useOnboardingStore.getState().timezone).toBe('America/Vancouver')
    })

    it('sets entity name', () => {
      useOnboardingStore.getState().setEntityName('Acme Corp')
      expect(useOnboardingStore.getState().entityName).toBe('Acme Corp')
    })

    it('sets entity type', () => {
      useOnboardingStore.getState().setEntityType('CORPORATION')
      expect(useOnboardingStore.getState().entityType).toBe('CORPORATION')
    })

    it('sets country and currency independently', () => {
      useOnboardingStore.getState().setCountry('US')
      useOnboardingStore.getState().setCurrency('USD')
      const state = useOnboardingStore.getState()
      expect(state.country).toBe('US')
      expect(state.currency).toBe('USD')
    })

    it('clamps fiscal year start to 1-12', () => {
      useOnboardingStore.getState().setFiscalYearStart(0)
      expect(useOnboardingStore.getState().fiscalYearStart).toBe(1)

      useOnboardingStore.getState().setFiscalYearStart(13)
      expect(useOnboardingStore.getState().fiscalYearStart).toBe(12)

      useOnboardingStore.getState().setFiscalYearStart(7)
      expect(useOnboardingStore.getState().fiscalYearStart).toBe(7)
    })
  })

  describe('API response storage', () => {
    it('stores tenant and entity IDs', () => {
      useOnboardingStore.getState().setTenantAndEntity('tenant-123', 'entity-456')
      const state = useOnboardingStore.getState()
      expect(state.tenantId).toBe('tenant-123')
      expect(state.entityId).toBe('entity-456')
    })
  })

  describe('reset', () => {
    it('resets all state to initial values', () => {
      // Modify state
      useOnboardingStore.getState().setAccountType('business')
      useOnboardingStore.getState().setEntityName('Test Corp')
      useOnboardingStore.getState().setTenantAndEntity('t-1', 'e-1')
      useOnboardingStore.getState().nextStep()

      // Reset
      useOnboardingStore.getState().reset()

      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.totalSteps).toBe(2)
      expect(state.accountType).toBeNull()
      expect(state.entityName).toBe('')
      expect(state.tenantId).toBeNull()
      expect(state.entityId).toBeNull()
      expect(state.country).toBe('CA')
      expect(state.currency).toBe('CAD')
    })
  })
})
