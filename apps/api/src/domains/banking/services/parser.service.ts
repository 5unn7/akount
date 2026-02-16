/**
 * Parser service barrel — re-exports from focused modules:
 * - parser-csv.ts: CSV and XLSX parsing
 * - parser-pdf.ts: PDF bank statement parsing
 * - parser-shared.ts: Shared types, utilities, institution normalizer
 */
export { parseCSV, parseXLSX } from './parser-csv';
export { parsePDF } from './parser-pdf';
export { normalizeInstitutionName } from './parser-shared';
export type { ParseResult } from './parser-shared';
