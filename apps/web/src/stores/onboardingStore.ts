import { create } from 'zustand'

export type AccountType = 'personal' | 'business'
export type EntityType = 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'

export type EmploymentStatus =
  | 'student'
  | 'employed-full-time'
  | 'employed-part-time'
  | 'self-employed'
  | 'founder'
  | 'not-working'
  | 'prefer-not-to-say'

/** Steps that trigger the conditional business setup question */
export const BUSINESS_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['self-employed', 'founder']

export interface OnboardingState {
  // Current step tracking
  currentStep: number
  version: number

  // Step 1: Account type ("Just me" / "Me + my business")
  accountType: AccountType | null

  // Step 2: Intent selection (multi-select goals)
  intents: string[]

  // Step 3: Employment situation
  employmentStatus: EmploymentStatus | null

  // Step 4: Business setup (conditional)
  wantsBusinessEntity: boolean
  businessName: string
  businessEntityType: EntityType | null
  businessCountry: string
  businessIndustry: string

  // Step 5: Residential address
  country: string
  currency: string
  streetAddress: string
  city: string
  province: string
  postalCode: string

  // Legacy fields (kept for backward compat with existing API)
  entityName: string
  entityType: EntityType | null
  phoneNumber: string
  timezone: string
  fiscalYearEnd: string
  industry: string

  // API response
  tenantId: string | null
  entityId: string | null

  // Actions
  setAccountType: (type: AccountType) => void
  toggleIntent: (intent: string) => void
  setEmploymentStatus: (status: EmploymentStatus) => void
  setWantsBusinessEntity: (wants: boolean) => void
  setBusinessName: (name: string) => void
  setBusinessEntityType: (type: EntityType) => void
  setBusinessCountry: (country: string) => void
  setBusinessIndustry: (industry: string) => void
  setCountry: (country: string) => void
  setCurrency: (currency: string) => void
  setStreetAddress: (address: string) => void
  setCity: (city: string) => void
  setProvince: (province: string) => void
  setPostalCode: (code: string) => void
  setPhoneNumber: (phone: string) => void
  setTimezone: (timezone: string) => void
  setEntityName: (name: string) => void
  setEntityType: (type: EntityType) => void
  setFiscalYearEnd: (month: string) => void
  setIndustry: (industry: string) => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  setTenantAndEntity: (tenantId: string, entityId: string) => void
  setVersion: (version: number) => void
  hydrate: (data: Partial<OnboardingState>) => void
  reset: () => void

  /** Whether the business setup step should be shown based on current state */
  shouldShowBusinessStep: () => boolean
  /** Total steps accounting for conditional business step */
  getTotalSteps: () => number
}

const initialState = {
  currentStep: 0,
  version: 0,

  // Step 1
  accountType: null as AccountType | null,

  // Step 2
  intents: [] as string[],

  // Step 3
  employmentStatus: null as EmploymentStatus | null,

  // Step 4 (conditional)
  wantsBusinessEntity: false,
  businessName: '',
  businessEntityType: null as EntityType | null,
  businessCountry: '',
  businessIndustry: '',

  // Step 5
  country: '',
  currency: '',
  streetAddress: '',
  city: '',
  province: '',
  postalCode: '',

  // Legacy
  entityName: '',
  entityType: null as EntityType | null,
  phoneNumber: '',
  timezone: 'America/Toronto',
  fiscalYearEnd: '12',
  industry: '',

  // API
  tenantId: null as string | null,
  entityId: null as string | null,
}

/**
 * Onboarding Store (DB-backed, no localStorage)
 * State is hydrated from server on mount and auto-saved to database
 *
 * Flow: AccountType → Intent → Employment → [BusinessSetup] → Address → Completion
 */
export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  ...initialState,

  setAccountType: (type: AccountType) => set({ accountType: type }),

  toggleIntent: (intent: string) =>
    set((state) => ({
      intents: state.intents.includes(intent)
        ? state.intents.filter((i) => i !== intent)
        : [...state.intents, intent],
    })),

  setEmploymentStatus: (status: EmploymentStatus) => set({ employmentStatus: status }),
  setWantsBusinessEntity: (wants: boolean) => set({ wantsBusinessEntity: wants }),
  setBusinessName: (name: string) => set({ businessName: name }),
  setBusinessEntityType: (type: EntityType) => set({ businessEntityType: type }),
  setBusinessCountry: (country: string) => set({ businessCountry: country }),
  setBusinessIndustry: (industry: string) => set({ businessIndustry: industry }),

  setCountry: (country: string) => set({ country }),
  setCurrency: (currency: string) => set({ currency }),
  setStreetAddress: (address: string) => set({ streetAddress: address }),
  setCity: (city: string) => set({ city }),
  setProvince: (province: string) => set({ province: province }),
  setPostalCode: (code: string) => set({ postalCode: code }),

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  setTimezone: (timezone: string) => set({ timezone }),
  setEntityName: (name: string) => set({ entityName: name }),
  setEntityType: (type: EntityType) => set({ entityType: type }),
  setFiscalYearEnd: (month: string) => set({ fiscalYearEnd: month }),
  setIndustry: (industry: string) => set({ industry }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, get().getTotalSteps() - 1),
    })),

  previousStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  goToStep: (step: number) =>
    set(() => ({
      currentStep: Math.max(0, Math.min(step, get().getTotalSteps() - 1)),
    })),

  setTenantAndEntity: (tenantId: string, entityId: string) =>
    set({ tenantId, entityId }),

  setVersion: (version: number) => set({ version }),

  hydrate: (data: Partial<OnboardingState>) =>
    set((state) => ({ ...state, ...data })),

  reset: () => set(initialState),

  shouldShowBusinessStep: () => {
    const { accountType, employmentStatus } = get()
    return (
      accountType === 'business' &&
      employmentStatus !== null &&
      BUSINESS_EMPLOYMENT_STATUSES.includes(employmentStatus)
    )
  },

  getTotalSteps: () => {
    return get().shouldShowBusinessStep() ? 6 : 5
  },
}))
