/**
 * NLSearchBar Type Definitions
 *
 * Shared types for Natural Language Search functionality.
 * Safe for both client and server components.
 */

/**
 * Filter chip displayed after AI search parsing
 */
export interface FilterChip {
  /** Human-readable label (e.g., "Restaurant", "> $100", "Q4 2026") */
  label: string;
  /** Actual filter value (string for IDs, number for amounts, etc.) */
  value: string | number;
  /** Field name this chip applies to (e.g., "categoryId", "amountMin") */
  field: string;
}

/**
 * Search filters returned by AI parsing
 * Maps to transaction query parameters
 */
export interface SearchFilters {
  /** Text search on description field (keyword mode or AI-extracted) */
  description?: string;
  /** Category ID filter (AI-extracted from category names) */
  categoryId?: string;
  /** Minimum amount in cents (AI-extracted from "over $100") */
  amountMin?: number;
  /** Maximum amount in cents (AI-extracted from "under $500") */
  amountMax?: number;
  /** Start date filter in ISO format (AI-extracted from "Q4", "last month") */
  dateFrom?: string;
  /** End date filter in ISO format (AI-extracted from date ranges) */
  dateTo?: string;
  /** Account ID filter (AI-extracted from account names) */
  accountId?: string;
  /** Transaction type filter (AI-extracted from "expenses", "income") */
  type?: 'income' | 'expense' | 'transfer';
}

/**
 * Response from Natural Search API (POST /api/ai/search/natural)
 */
export interface NaturalSearchResponse {
  /** Parsed filter object ready to pass to list API */
  parsed: SearchFilters;
  /** Filter chips for UI display (with human-readable labels) */
  filterChips: FilterChip[];
  /** AI-generated explanation of what was parsed */
  explanation: string;
  /** Confidence score (0-100) - below 50 = uncertain parse */
  confidence: number;
}

/**
 * Search scope for Natural Search API
 */
export type SearchScope = 'transactions' | 'invoices' | 'bills' | 'all';

/**
 * Props for NLSearchBar component
 */
export interface NLSearchBarProps {
  /** Entity ID to search within (required for tenant isolation) */
  entityId: string;
  /** Callback when filters change (either from keyword or AI search) */
  onFiltersChange: (filters: SearchFilters) => void;
  /** Custom placeholder text (defaults based on mode) */
  placeholder?: string;
  /** Search scope - which domain to search (default: 'transactions') */
  scope?: SearchScope;
}

/**
 * Search mode (keyword vs AI)
 */
export type SearchMode = 'keyword' | 'ai';

/**
 * Example search queries for AI mode
 */
export const EXAMPLE_QUERIES = [
  'Show me restaurant expenses over $100 in Q4',
  'All income transactions last month',
  'Expenses under $50 from checking account',
  'Transfers between accounts in December',
  'Uncategorized transactions this year',
  'Rent payments over $1000',
] as const;

/**
 * Filter field metadata for UI hints
 */
export interface FilterFieldMetadata {
  field: keyof SearchFilters;
  label: string;
  type: 'text' | 'amount' | 'date' | 'select';
  examples: string[];
}

/**
 * Available filter fields with metadata
 */
export const FILTER_FIELDS: FilterFieldMetadata[] = [
  {
    field: 'description',
    label: 'Description',
    type: 'text',
    examples: ['restaurant', 'uber', 'grocery'],
  },
  {
    field: 'categoryId',
    label: 'Category',
    type: 'select',
    examples: ['meals', 'transportation', 'utilities'],
  },
  {
    field: 'amountMin',
    label: 'Amount (Min)',
    type: 'amount',
    examples: ['over $100', 'more than $50', 'at least $25'],
  },
  {
    field: 'amountMax',
    label: 'Amount (Max)',
    type: 'amount',
    examples: ['under $500', 'less than $100', 'below $200'],
  },
  {
    field: 'dateFrom',
    label: 'Date (From)',
    type: 'date',
    examples: ['last month', 'Q4', 'since January', 'after March 1'],
  },
  {
    field: 'dateTo',
    label: 'Date (To)',
    type: 'date',
    examples: ['before December', 'until last week', 'by end of year'],
  },
  {
    field: 'accountId',
    label: 'Account',
    type: 'select',
    examples: ['checking', 'savings', 'credit card'],
  },
  {
    field: 'type',
    label: 'Type',
    type: 'select',
    examples: ['income', 'expenses', 'transfers'],
  },
];
