/**
 * Parser service barrel — re-exports from focused modules:
 * - parser-csv.ts: CSV and XLSX parsing
 * - parser-pdf-mistral.ts: PDF bank statement parsing via Mistral AI (DEV-242)
 * - parser-pdf.ts: Legacy regex-based PDF parser (kept for fallback/comparison)
 * - parser-shared.ts: Shared types, utilities, institution normalizer
 */
export { parseCSV, parseXLSX } from './parser-csv';
export { parsePDF } from './parser-pdf-mistral'; // DEV-242: Mistral vision primary engine
export { normalizeInstitutionName } from './parser-shared';
export type { ParseResult } from './parser-shared';
