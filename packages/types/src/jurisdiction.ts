/**
 * Jurisdiction Configuration Types
 *
 * Defines entity types, tax ID formats, and fiscal defaults
 * for supported jurisdictions (US, CA, IN).
 */

export interface EntityTypeConfig {
  /** Prisma EntityType enum value */
  enumValue: string;
  /** Display name (e.g., "Limited Liability Company") */
  displayName: string;
  /** Short description */
  description: string;
  /** Optional sub-types (e.g., S-Corp, C-Corp) */
  subTypes?: Array<{
    value: string;
    displayName: string;
  }>;
}

export interface TaxIdFormat {
  /** Name of the tax ID (e.g., "EIN", "BN", "PAN") */
  name: string;
  /** Display label (e.g., "Employer Identification Number") */
  label: string;
  /** Regex pattern for validation */
  pattern: string;
  /** Placeholder showing expected format (e.g., "XX-XXXXXXX") */
  placeholder: string;
  /** Human-readable format description */
  formatDescription: string;
}

export interface JurisdictionConfig {
  /** ISO 3166-1 alpha-2 country code */
  countryCode: string;
  /** Country display name */
  countryName: string;
  /** Flag emoji */
  flag: string;
  /** Available entity types for this jurisdiction */
  entityTypes: EntityTypeConfig[];
  /** Tax ID formats (some jurisdictions have multiple, e.g., IN has PAN + GSTIN) */
  taxIdFormats: TaxIdFormat[];
  /** Default fiscal year start month (1-12) */
  defaultFiscalYearStartMonth: number;
  /** Common currency ISO code */
  defaultCurrency: string;
}
