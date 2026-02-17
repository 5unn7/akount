import { create } from 'zustand'

export type AccountType = 'personal' | 'business'
export type EntityType = 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'

export interface OnboardingState {
  // Current step tracking
  currentStep: number
  totalSteps: number

  // Version for optimistic locking (from DB)
  version: number

  // Account type selection
  accountType: AccountType | null

  // Intent selection (what the user wants to achieve)
  intents: string[]

  // User details
  phoneNumber: string
  timezone: string

  // Entity details
  entityName: string
  entityType: EntityType | null
  country: string
  currency: string
  fiscalYearEnd: string
  industry: string

  // API response
  tenantId: string | null
  entityId: string | null

  // State transitions
  setAccountType: (type: AccountType) => void
  toggleIntent: (intent: string) => void
  setPhoneNumber: (phone: string) => void
  setTimezone: (timezone: string) => void
  setEntityName: (name: string) => void
  setEntityType: (type: EntityType) => void
  setCountry: (country: string) => void
  setCurrency: (currency: string) => void
  setFiscalYearEnd: (month: string) => void
  setIndustry: (industry: string) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  setTenantAndEntity: (tenantId: string, entityId: string) => void
  setVersion: (version: number) => void
  hydrate: (data: Partial<OnboardingState>) => void
  reset: () => void
}

const initialState = {
  currentStep: 0,
  totalSteps: 4, // Welcome → Intent → Workspace → Ready
  version: 0,
  accountType: 'personal' as AccountType | null,
  intents: [] as string[],
  phoneNumber: '',
  timezone: 'America/Toronto',
  entityName: '',
  entityType: null,
  country: 'CA',
  currency: 'CAD',
  fiscalYearEnd: '12', // December
  industry: '',
  tenantId: null,
  entityId: null,
}

/**
 * Onboarding Store (DB-backed, no localStorage)
 * State is hydrated from server on mount and auto-saved to database
 */
export const useOnboardingStore = create<OnboardingState>()((set) => ({
  ...initialState,

  setAccountType: (type: AccountType) => set({ accountType: type }),

  toggleIntent: (intent: string) =>
    set((state) => ({
      intents: state.intents.includes(intent)
        ? state.intents.filter((i) => i !== intent)
        : [...state.intents, intent],
    })),

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

  setTimezone: (timezone: string) => set({ timezone }),

  setEntityName: (name: string) => set({ entityName: name }),

  setEntityType: (type: EntityType) => set({ entityType: type }),

  setCountry: (country: string) => set({ country }),

  setCurrency: (currency: string) => set({ currency }),

  setFiscalYearEnd: (month: string) => set({ fiscalYearEnd: month }),

  setIndustry: (industry: string) => set({ industry }),

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

  setVersion: (version: number) => set({ version }),

  hydrate: (data: Partial<OnboardingState>) =>
    set((state) => ({ ...state, ...data })),

  reset: () => set(initialState),
}))
