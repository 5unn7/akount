/**
 * PII Masking Utilities (P2-34)
 *
 * Mask sensitive data in exports and API responses.
 * Different from pii-redaction.ts which handles PRE-inference redaction.
 * This module handles POST-processing masking for user-facing exports.
 *
 * @module pii-masking
 */

/**
 * Mask tax identification numbers (SSN, SIN, EIN, TIN).
 *
 * Shows last 4 digits only (industry standard).
 *
 * @param taxId - Tax ID to mask (SSN, SIN, EIN, TIN)
 * @returns Masked tax ID (e.g., "***-**-1234")
 *
 * @example
 * maskTaxId("123-45-6789") // => "***-**-6789"
 * maskTaxId("12-3456789")  // => "**-***6789"
 */
export function maskTaxId(taxId: string | null | undefined): string {
  if (!taxId) return '';

  // Remove all non-digits for processing
  const digits = taxId.replace(/\D/g, '');

  if (digits.length === 0) return '';

  // Show last 4 digits
  const last4 = digits.slice(-4);

  // Detect format and mask accordingly
  if (taxId.includes('-')) {
    // Formatted tax ID (SSN, SIN, etc.)
    if (digits.length === 9 && taxId.match(/\d{3}-\d{2}-\d{4}/)) {
      // SSN format: XXX-XX-XXXX
      return `***-**-${last4}`;
    } else if (digits.length === 9 && taxId.match(/\d{3}-\d{3}-\d{3}/)) {
      // SIN format: XXX-XXX-XXX
      return `***-***-${digits.slice(-3)}`;
    } else if (digits.length === 9 && taxId.match(/\d{2}-\d{7}/)) {
      // EIN format: XX-XXXXXXX
      return `**-***${last4}`;
    }
  }

  // Fallback: mask all but last 4
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${last4}`;
}

/**
 * Mask email addresses.
 *
 * Preserves domain for context, masks local part.
 *
 * @param email - Email address to mask
 * @returns Masked email (e.g., "***@example.com")
 *
 * @example
 * maskEmail("john.doe@example.com") // => "***@example.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) return '';

  const [_, domain] = email.split('@');
  return `***@${domain}`;
}

/**
 * Mask phone numbers.
 *
 * Shows last 4 digits only.
 *
 * @param phone - Phone number to mask
 * @returns Masked phone (e.g., "***-***-1234")
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';

  const last4 = digits.slice(-4);
  return `***-***-${last4}`;
}

/**
 * Mask bank account numbers.
 *
 * Shows last 4 digits only.
 *
 * @param accountNumber - Account number to mask
 * @returns Masked account (e.g., "****1234")
 */
export function maskAccountNumber(accountNumber: string | null | undefined): string {
  if (!accountNumber) return '';

  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length === 0) return '';

  const last4 = digits.slice(-4);
  return `****${last4}`;
}
