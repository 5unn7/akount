import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccountType = 'personal' | 'business' | 'accountant'
export type EntityType = 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'

export interface OnboardingState {
  // Current step tracking
  currentStep: number
  totalSteps: number

  // Account type selection
  accountType: AccountType | null

  // User details
  phoneNumber: string
  timezone: string

  // Entity details
  entityName: string
  entityType: EntityType | null
  country: string
  currency: string
  fiscalYearStart: number | null

  // API response
  tenantId: string | null
  entityId: string | null

  // State transitions
  setAccountType: (type: AccountType) => void
  setPhoneNumber: (phone: string) => void
  setTimezone: (timezone: string) => void
  setEntityName: (name: string) => void
  setEntityType: (type: EntityType) => void
  setCountry: (country: string) => void
  setCurrency: (currency: string) => void
  setFiscalYearStart: (month: number) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  setTenantAndEntity: (tenantId: string, entityId: string) => void
  reset: () => void
}

const initialState = {
  currentStep: 0,
  totalSteps: 2, // Will be adjusted based on accountType
  accountType: null,
  phoneNumber: '',
  timezone: 'America/Toronto', // Default to Eastern Time
  entityName: '',
  entityType: null,
  country: 'CA',
  currency: 'CAD',
  fiscalYearStart: 1,
  tenantId: null,
  entityId: null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setAccountType: (type: AccountType) =>
        set((state) => ({
          accountType: type,
          // Adjust total steps based on account type
          // Personal: Welcome → Details → Complete (3 steps)
          // Business: Welcome → Details → COA → Complete (4 steps)
          totalSteps: type === 'business' ? 4 : 3,
          currentStep: 1, // Move to entity details after selection
        })),

      setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

      setTimezone: (timezone: string) => set({ timezone }),

      setEntityName: (name: string) => set({ entityName: name }),

      setEntityType: (type: EntityType) => set({ entityType: type }),

      setCountry: (country: string) => set({ country }),

      setCurrency: (currency: string) => set({ currency }),

      setFiscalYearStart: (month: number) =>
        set({ fiscalYearStart: Math.max(1, Math.min(12, month)) }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
        })),

      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),

      goToStep: (step: number) =>
        set((state) => ({
          currentStep: Math.max(0, Math.min(step, state.totalSteps - 1)),
        })),

      setTenantAndEntity: (tenantId: string, entityId: string) =>
        set({ tenantId, entityId }),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      version: 1,
    }
  )
)
