import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '../onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.getState().reset()
  })

  describe('initial state', () => {
    it('starts at step 0 with 5 total steps (personal flow)', () => {
      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.getTotalSteps()).toBe(5)
    })

    it('defaults to null account type', () => {
      expect(useOnboardingStore.getState().accountType).toBeNull()
    })

    it('defaults to empty intents', () => {
      expect(useOnboardingStore.getState().intents).toEqual([])
    })

    it('defaults to empty country and currency (inferred from IP)', () => {
      const state = useOnboardingStore.getState()
      expect(state.country).toBe('')
      expect(state.currency).toBe('')
      expect(state.timezone).toBe('America/Toronto')
    })

    it('defaults fiscal year end to December', () => {
      expect(useOnboardingStore.getState().fiscalYearEnd).toBe('12')
    })

    it('defaults industry to empty string', () => {
      expect(useOnboardingStore.getState().industry).toBe('')
    })

    it('defaults employment status to null', () => {
      expect(useOnboardingStore.getState().employmentStatus).toBeNull()
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
      useOnboardingStore.getState().toggleIntent('tax-ready')
      useOnboardingStore.getState().toggleIntent('saving')
      expect(useOnboardingStore.getState().intents).toEqual([
        'track-spending',
        'tax-ready',
        'saving',
      ])
    })

    it('removes only the toggled intent from multiple', () => {
      useOnboardingStore.getState().toggleIntent('track-spending')
      useOnboardingStore.getState().toggleIntent('tax-ready')
      useOnboardingStore.getState().toggleIntent('track-spending')
      expect(useOnboardingStore.getState().intents).toEqual(['tax-ready'])
    })
  })

  describe('step navigation', () => {
    it('nextStep increments current step', () => {
      useOnboardingStore.getState().nextStep()
      expect(useOnboardingStore.getState().currentStep).toBe(1)
    })

    it('nextStep does not exceed totalSteps - 1 (personal flow = 5)', () => {
      for (let i = 0; i < 10; i++) {
        useOnboardingStore.getState().nextStep()
      }
      expect(useOnboardingStore.getState().currentStep).toBe(4)
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
      expect(useOnboardingStore.getState().currentStep).toBe(4) // max = totalSteps - 1

      useOnboardingStore.getState().goToStep(-5)
      expect(useOnboardingStore.getState().currentStep).toBe(0)
    })
  })

  describe('conditional business step', () => {
    it('shows business step when accountType=business and employment=self-employed', () => {
      useOnboardingStore.getState().setAccountType('business')
      useOnboardingStore.getState().setEmploymentStatus('self-employed')
      expect(useOnboardingStore.getState().shouldShowBusinessStep()).toBe(true)
      expect(useOnboardingStore.getState().getTotalSteps()).toBe(6)
    })

    it('shows business step when accountType=business and employment=founder', () => {
      useOnboardingStore.getState().setAccountType('business')
      useOnboardingStore.getState().setEmploymentStatus('founder')
      expect(useOnboardingStore.getState().shouldShowBusinessStep()).toBe(true)
      expect(useOnboardingStore.getState().getTotalSteps()).toBe(6)
    })

    it('hides business step for personal account type', () => {
      useOnboardingStore.getState().setAccountType('personal')
      useOnboardingStore.getState().setEmploymentStatus('self-employed')
      expect(useOnboardingStore.getState().shouldShowBusinessStep()).toBe(false)
      expect(useOnboardingStore.getState().getTotalSteps()).toBe(5)
    })

    it('hides business step for non-business employment', () => {
      useOnboardingStore.getState().setAccountType('business')
      useOnboardingStore.getState().setEmploymentStatus('student')
      expect(useOnboardingStore.getState().shouldShowBusinessStep()).toBe(false)
      expect(useOnboardingStore.getState().getTotalSteps()).toBe(5)
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

    it('sets address fields', () => {
      useOnboardingStore.getState().setStreetAddress('123 Main St')
      useOnboardingStore.getState().setCity('Toronto')
      useOnboardingStore.getState().setProvince('ON')
      useOnboardingStore.getState().setPostalCode('M5V 1A1')
      const state = useOnboardingStore.getState()
      expect(state.streetAddress).toBe('123 Main St')
      expect(state.city).toBe('Toronto')
      expect(state.province).toBe('ON')
      expect(state.postalCode).toBe('M5V 1A1')
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
      useOnboardingStore.getState().toggleIntent('tax-ready')
      useOnboardingStore.getState().setEntityName('Test Corp')
      useOnboardingStore.getState().setTenantAndEntity('t-1', 'e-1')
      useOnboardingStore.getState().setIndustry('consulting')
      useOnboardingStore.getState().setEmploymentStatus('founder')
      useOnboardingStore.getState().nextStep()

      // Reset
      useOnboardingStore.getState().reset()

      const state = useOnboardingStore.getState()
      expect(state.currentStep).toBe(0)
      expect(state.getTotalSteps()).toBe(5)
      expect(state.accountType).toBeNull()
      expect(state.intents).toEqual([])
      expect(state.entityName).toBe('')
      expect(state.tenantId).toBeNull()
      expect(state.entityId).toBeNull()
      expect(state.country).toBe('')
      expect(state.currency).toBe('')
      expect(state.industry).toBe('')
      expect(state.fiscalYearEnd).toBe('12')
      expect(state.employmentStatus).toBeNull()
    })
  })
})
