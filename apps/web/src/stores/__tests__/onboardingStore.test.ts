import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '../onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  describe('initial state', () => {
    it('starts at step 0 with 4 total steps', () => {
      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.totalSteps).toBe(4)
    })

    it('defaults to personal account type', () => {
      expect(useOnboardingStore.getState().accountType).toBe('personal')
    })

    it('defaults to empty intents', () => {
      expect(useOnboardingStore.getState().intents).toEqual([])
    })

    it('defaults to Canadian locale', () => {
      const state = useOnboardingStore.getState()
      expect(state.country).toBe('CA')
      expect(state.currency).toBe('CAD')
      expect(state.timezone).toBe('America/Toronto')
    })

    it('defaults fiscal year end to December', () => {
      expect(useOnboardingStore.getState().fiscalYearEnd).toBe('12')
    })

    it('defaults industry to empty string', () => {
      expect(useOnboardingStore.getState().industry).toBe('')
    })
  })

  describe('setAccountType', () => {
    it('sets personal account type', () => {
      useOnboardingStore.getState().setAccountType('personal')
      expect(useOnboardingStore.getState().accountType).toBe('personal')
    })

    it('sets business account type', () => {
      useOnboardingStore.getState().setAccountType('business')
      expect(useOnboardingStore.getState().accountType).toBe('business')
    })
  })

  describe('intent selection', () => {
    it('toggles an intent on', () => {
      useOnboardingStore.getState().toggleIntent('track-spending')
      expect(useOnboardingStore.getState().intents).toEqual(['track-spending'])
    })

    it('toggles an intent off', () => {
      useOnboardingStore.getState().toggleIntent('track-spending')
      useOnboardingStore.getState().toggleIntent('track-spending')
      expect(useOnboardingStore.getState().intents).toEqual([])
    })

    it('supports multiple intents', () => {
      useOnboardingStore.getState().toggleIntent('track-spending')
      useOnboardingStore.getState().toggleIntent('prepare-taxes')
      useOnboardingStore.getState().toggleIntent('financial-clarity')
      expect(useOnboardingStore.getState().intents).toEqual([
        'track-spending',
        'prepare-taxes',
        'financial-clarity',
      ])
    })

    it('removes only the toggled intent from multiple', () => {
      useOnboardingStore.getState().toggleIntent('track-spending')
      useOnboardingStore.getState().toggleIntent('prepare-taxes')
      useOnboardingStore.getState().toggleIntent('track-spending')
      expect(useOnboardingStore.getState().intents).toEqual(['prepare-taxes'])
    })
  })

  describe('step navigation', () => {
    it('nextStep increments current step', () => {
      useOnboardingStore.getState().nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('nextStep does not exceed totalSteps - 1', () => {
      useOnboardingStore.getState().nextStep() // step 1
      useOnboardingStore.getState().nextStep() // step 2
      useOnboardingStore.getState().nextStep() // step 3
      useOnboardingStore.getState().nextStep() // should stay at 3
      expect(useOnboardingStore.getState().currentStep).toBe(3)
    })

    it('previousStep decrements current step', () => {
      useOnboardingStore.getState().nextStep() // step 1
      useOnboardingStore.getState().previousStep()
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })

    it('previousStep does not go below 0', () => {
      useOnboardingStore.getState().previousStep()
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })

    it('goToStep navigates to specific step within bounds', () => {
      useOnboardingStore.getState().goToStep(3)
      expect(useOnboardingStore.getState().currentStep).toBe(3)
    })

    it('goToStep clamps to valid range', () => {
      useOnboardingStore.getState().goToStep(10)
      expect(useOnboardingStore.getState().currentStep).toBe(3) // max = totalSteps - 1

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

    it('sets fiscal year end as string month', () => {
      useOnboardingStore.getState().setFiscalYearEnd('7')
      expect(useOnboardingStore.getState().fiscalYearEnd).toBe('7')

      useOnboardingStore.getState().setFiscalYearEnd('1')
      expect(useOnboardingStore.getState().fiscalYearEnd).toBe('1')
    })

    it('sets industry', () => {
      useOnboardingStore.getState().setIndustry('technology')
      expect(useOnboardingStore.getState().industry).toBe('technology')
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
      useOnboardingStore.getState().toggleIntent('track-spending')
      useOnboardingStore.getState().toggleIntent('prepare-taxes')
      useOnboardingStore.getState().setEntityName('Test Corp')
      useOnboardingStore.getState().setTenantAndEntity('t-1', 'e-1')
      useOnboardingStore.getState().setIndustry('consulting')
      useOnboardingStore.getState().nextStep()

      // Reset
      useOnboardingStore.getState().reset()

      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.totalSteps).toBe(4)
      expect(state.accountType).toBe('personal')
      expect(state.intents).toEqual([])
      expect(state.entityName).toBe('')
      expect(state.tenantId).toBeNull()
      expect(state.entityId).toBeNull()
      expect(state.country).toBe('CA')
      expect(state.currency).toBe('CAD')
      expect(state.industry).toBe('')
      expect(state.fiscalYearEnd).toBe('12')
    })
  })
})
