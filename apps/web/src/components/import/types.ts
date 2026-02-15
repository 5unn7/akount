/**
 * Shared types for multi-file import upload flow
 */

export interface ImportAccount {
  id: string;
  name: string;
  type: string;
  currency: string;
  entity: { id: string; name: string };
}

export interface ImportResult {
  id: string;
  sourceType: 'CSV' | 'PDF';
  sourceFileName: string;
  status: string;
  totalRows: number;
  processedRows: number;
  duplicateRows: number;
  errorRows: number;
}

export type UploadFileStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadFileItem {
  id: string;
  file: File;
  accountId: string;
  status: UploadFileStatus;
  result?: ImportResult;
  error?: string;
}

export interface BatchImportResult {
  files: UploadFileItem[];
  aggregateStats: {
    totalFiles: number;
    successFiles: number;
    totalTransactions: number;
    imported: number;
    duplicates: number;
    errors: number;
  };
}
