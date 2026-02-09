import { z } from 'zod';

export const SHARED_CONSTANT = "Akount";

// ============================================================================
// Common Validation Schemas
// ============================================================================

/**
 * UUID validation schema
 * Used for all entity IDs in the system
 */
export const uuidSchema = z.string().uuid({
  message: 'Invalid UUID format',
});

/**
 * Pagination schema for list endpoints
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // SECURITY: Allowlist of sortable fields to prevent SQL injection
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'name',
    'id',
    'amount',
    'date',
    'status',
    'type',
    'code',
    'email',
    'description',
  ]).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Date range schema for filtering
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Currency code schema (ISO 4217)
 */
export const currencySchema = z.enum([
  'CAD', 'USD', 'EUR', 'GBP', 'AUD', 'JPY', 'CNY', 'INR', 'MXN', 'BRL',
]).default('CAD');

/**
 * Money amount schema (integer cents)
 * IMPORTANT: Always store as integer cents, never float
 */
export const moneyAmountSchema = z.number().int({
  message: 'Amount must be in integer cents (e.g., 1050 for $10.50)',
});

/**
 * Email validation schema
 */
export const emailSchema = z.string().email({
  message: 'Invalid email address',
});

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * Entity type enum
 */
export const entityTypeSchema = z.enum([
  'personal',
  'business',
  'trust',
  'estate',
  'partnership',
  'corporation',
  'non-profit',
]);

/**
 * Entity schema (business or personal entity)
 */
export const entitySchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  name: z.string().min(1).max(255),
  type: entityTypeSchema,
  baseCurrency: currencySchema,
  functionalCurrency: currencySchema.optional(),
  reportingCurrency: currencySchema.optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Entity = z.infer<typeof entitySchema>;

// ============================================================================
// Account Schemas
// ============================================================================

/**
 * Account type enum
 */
export const accountTypeSchema = z.enum([
  'checking',
  'savings',
  'credit_card',
  'investment',
  'loan',
  'line_of_credit',
  'mortgage',
  'other_asset',
  'other_liability',
]);

/**
 * Account schema
 */
export const accountSchema = z.object({
  id: uuidSchema,
  entityId: uuidSchema,
  name: z.string().min(1).max(255),
  type: accountTypeSchema,
  currency: currencySchema,
  currentBalance: moneyAmountSchema,
  institutionName: z.string().max(255).optional(),
  accountNumber: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Account = z.infer<typeof accountSchema>;

/**
 * Account summary schema (for dashboard)
 */
export const accountSummarySchema = z.object({
  totalAssets: moneyAmountSchema,
  totalLiabilities: moneyAmountSchema,
  netWorth: moneyAmountSchema,
  cashPosition: moneyAmountSchema,
  currency: currencySchema,
  asOfDate: z.string().datetime(),
});

export type AccountSummary = z.infer<typeof accountSummarySchema>;

// ============================================================================
// Transaction Schemas
// ============================================================================

/**
 * Transaction status enum
 */
export const transactionStatusSchema = z.enum([
  'pending',
  'posted',
  'reconciled',
  'void',
]);

/**
 * Transaction schema
 */
export const transactionSchema = z.object({
  id: uuidSchema,
  accountId: uuidSchema,
  date: z.string().datetime(),
  description: z.string().min(1).max(500),
  amount: moneyAmountSchema,
  status: transactionStatusSchema,
  categoryId: uuidSchema.optional(),
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Transaction = z.infer<typeof transactionSchema>;

/**
 * Transaction with running balance schema
 * Used when fetching transactions for an account with cumulative balance
 */
export const transactionWithBalanceSchema = transactionSchema.extend({
  runningBalance: moneyAmountSchema,
});

export type TransactionWithBalance = z.infer<typeof transactionWithBalanceSchema>;

// ============================================================================
// Category Schemas
// ============================================================================

/**
 * Category type enum
 */
export const categoryTypeSchema = z.enum([
  'income',
  'expense',
  'transfer',
  'asset',
  'liability',
  'equity',
]);

/**
 * Category schema
 */
export const categorySchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  parentId: uuidSchema.optional(),
  name: z.string().min(1).max(255),
  type: categoryTypeSchema,
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Category = z.infer<typeof categorySchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

/**
 * Standard success response wrapper
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
    }).optional(),
  });

/**
 * Standard error response
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    // SECURITY: Use z.unknown() instead of z.any() for type safety
    details: z.record(z.unknown()).optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  }).optional(),
});

/**
 * Paginated response wrapper
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
      hasMore: z.boolean(),
    }),
    meta: z.object({
      timestamp: z.string().datetime(),
    }).optional(),
  });

// ============================================================================
// Export Type Helpers
// ============================================================================

export type SuccessResponse<T> = {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
  };
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta?: {
    timestamp: string;
  };
};

// ============================================================================
// Onboarding Schemas
// ============================================================================

/**
 * Account type for onboarding
 */
export const onboardingAccountTypeSchema = z.enum(['personal', 'business', 'accountant']);
export type OnboardingAccountType = z.infer<typeof onboardingAccountTypeSchema>;

/**
 * Entity type for onboarding (subset of EntityType enum)
 */
export const onboardingEntityTypeSchema = z.enum([
  'PERSONAL',
  'CORPORATION',
  'SOLE_PROPRIETORSHIP',
  'PARTNERSHIP',
  'LLC',
]);
export type OnboardingEntityType = z.infer<typeof onboardingEntityTypeSchema>;

/**
 * Initialize onboarding schema
 */
export const initializeOnboardingSchema = z.object({
  accountType: onboardingAccountTypeSchema,
  // SECURITY: Sanitize input to prevent XSS/injection attacks
  entityName: z.string()
    .trim()
    .min(1, 'Entity name is required')
    .max(255, 'Entity name must be 255 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-'&.,()]+$/,
      'Entity name can only contain letters, numbers, spaces, and common business characters (- \' & . , ( ))'
    ),
  entityType: onboardingEntityTypeSchema,
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
});
export type InitializeOnboarding = z.infer<typeof initializeOnboardingSchema>;

/**
 * Complete onboarding schema
 */
export const completeOnboardingSchema = z.object({
  tenantId: z.string(),
  // SECURITY: Sanitize input to prevent XSS/injection attacks
  entityName: z.string()
    .trim()
    .min(1, 'Entity name is required')
    .max(255, 'Entity name must be 255 characters or less')
    .regex(
      /^[a-zA-Z0-9\s\-'&.,()]+$/,
      'Entity name can only contain letters, numbers, spaces, and common business characters (- \' & . , ( ))'
    ),
  entityType: onboardingEntityTypeSchema,
  country: z.string().length(2).toUpperCase(),
  currency: z.string().length(3).toUpperCase(),
  fiscalYearStart: z.number().int().min(1).max(12),
});
export type CompleteOnboarding = z.infer<typeof completeOnboardingSchema>;

/**
 * Onboarding status response
 */
export const onboardingStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'completed']),
  tenantId: z.string().optional(),
  currentStep: z.string().optional(),
});
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

// ============================================================================
// Type Guards
// ============================================================================

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === false
  );
}

export function isSuccessResponse<T>(response: unknown): response is SuccessResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    response.success === true
  );
}

// ============================================================================
// Financial Types (branded Cents, Currency, formatting)
// ============================================================================

export * from './financial';

// ============================================================================
// RBAC Types (Role, PermissionLevel, permission matrix)
// ============================================================================

export * from './rbac';
