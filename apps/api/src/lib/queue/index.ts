/**
 * Queue Infrastructure
 *
 * BullMQ-based job queue system for async document processing.
 *
 * @module queue
 */

export { queueManager, type QueueName } from './queue-manager';
export { setupBullBoard, getBullBoardAdapter } from './bull-board';

// Job data type definitions for type-safe queue operations

export interface BillScanJobData {
  /** Uploaded file buffer (image/PDF) */
  fileBuffer: Buffer;
  /** Original filename */
  filename: string;
  /** Tenant ID */
  tenantId: string;
  /** Entity ID */
  entityId: string;
  /** User ID who uploaded */
  userId: string;
  /** Job ID for SSE updates */
  jobId: string;
}

export interface InvoiceScanJobData {
  /** Uploaded file buffer (image/PDF) */
  fileBuffer: Buffer;
  /** Original filename */
  filename: string;
  /** Tenant ID */
  tenantId: string;
  /** Entity ID */
  entityId: string;
  /** User ID who uploaded */
  userId: string;
  /** Job ID for SSE updates */
  jobId: string;
}

export interface TransactionImportJobData {
  /** Import batch ID */
  batchId: string;
  /** File buffer (CSV, XLSX, PDF) */
  fileBuffer: Buffer;
  /** File type */
  fileType: 'csv' | 'xlsx' | 'pdf';
  /** Tenant ID */
  tenantId: string;
  /** Entity ID */
  entityId: string;
  /** Account ID for import */
  accountId: string;
}

export interface MatchingJobData {
  /** Entity that triggered matching (Bill, Invoice, Transaction) */
  entityType: 'bill' | 'invoice' | 'transaction';
  /** Entity ID */
  entityId: string;
  /** Tenant ID */
  tenantId: string;
  /** Business entity ID (for scoping) */
  businessEntityId: string;
}

export interface AnomalyDetectionJobData {
  /** Tenant ID */
  tenantId: string;
  /** Entity ID */
  entityId: string;
  /** Detection scope */
  scope: 'transactions' | 'bills' | 'invoices' | 'all';
  /** Date range for analysis */
  dateFrom?: string;
  dateTo?: string;
}
