import { getJurisdictionConfig } from '../data/jurisdictions/index.js';

export interface TaxIdValidationResult {
  valid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validate and format a tax ID based on country jurisdiction rules.
 *
 * Returns { valid: true, formatted } for valid IDs.
 * Returns { valid: false, formatted, error } for invalid IDs.
 * Unknown countries pass through without validation.
 */
export function validateTaxId(
  countryCode: string,
  taxId: string
): TaxIdValidationResult {
  const trimmed = taxId.trim();

  if (!trimmed) {
    return { valid: false, formatted: trimmed, error: 'Tax ID is required' };
  }

  const config = getJurisdictionConfig(countryCode);

  // Unknown country — pass through, don't block
  if (!config) {
    return { valid: true, formatted: trimmed };
  }

  // Try each tax ID format for the jurisdiction
  for (const format of config.taxIdFormats) {
    const regex = new RegExp(format.pattern);
    // Strip common formatting characters before matching
    const stripped = trimmed.replace(/[-\s]/g, '');
    const uppercased = stripped.toUpperCase();

    if (regex.test(stripped) || regex.test(trimmed) || regex.test(uppercased)) {
      return {
        valid: true,
        formatted: formatTaxId(countryCode, format.name, stripped),
      };
    }
  }

  // None of the formats matched
  const formatDescriptions = config.taxIdFormats
    .map((f) => `${f.name}: ${f.formatDescription}`)
    .join(', ');

  return {
    valid: false,
    formatted: trimmed,
    error: `Invalid tax ID format. Expected: ${formatDescriptions}`,
  };
}

/**
 * Format a tax ID with country-specific separators.
 */
function formatTaxId(
  countryCode: string,
  formatName: string,
  stripped: string
): string {
  switch (countryCode.toUpperCase()) {
    case 'US':
      // EIN: XX-XXXXXXX
      if (formatName === 'EIN' && stripped.length === 9) {
        return `${stripped.slice(0, 2)}-${stripped.slice(2)}`;
      }
      return stripped;

    case 'CA':
      // BN: 9 digits, no separator
      return stripped;

    case 'IN':
      // PAN and GSTIN: uppercase, no separator
      return stripped.toUpperCase();

    default:
      return stripped;
  }
}
