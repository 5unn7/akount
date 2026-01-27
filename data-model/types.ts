/**
 * Akount Data Model TypeScript Types
 *
 * Core type definitions for the Akount data model.
 * These types represent the minimal schema - implementations should extend as needed.
 */

// ============================================================================
// Core Accounting Backbone
// ============================================================================

export interface Entity {
  id: string;
  name: string;
  type: 'personal' | 'corporation' | 'llc' | 'partnership';
  country: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GLAccount {
  id: string;
  entityId: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  normalBalance: 'debit' | 'credit';
  description?: string;
  parentAccountId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  entityId: string;
  date: string;
  memo: string;
  sourceType?: string;
  sourceId?: string;
  status: 'draft' | 'posted';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  journalEntryId: string;
  glAccountId: string;
  debitAmount: number;
  creditAmount: number;
  memo?: string;
}

export interface TaxRate {
  id: string;
  code: string;
  name: string;
  rate: number;
  jurisdiction: string;
  isInclusive: boolean;
  glAccountId?: string;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export interface FxRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
}

export interface FiscalCalendar {
  id: string;
  entityId: string;
  year: number;
  startDate: string;
  endDate: string;
}

export interface FiscalPeriod {
  id: string;
  fiscalCalendarId: string;
  periodNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'locked';
}

// ============================================================================
// Accounts Receivable & Payable
// ============================================================================

export interface Client {
  id: string;
  entityId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  entityId: string;
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  taxAmount: number;
  amount: number;
  glAccountId?: string;
  categoryId?: string;
}

export interface CreditNote {
  id: string;
  entityId: string;
  creditNoteNumber: string;
  date: string;
  currency: string;
  amount: number;
  reason: string;
  linkedInvoiceId?: string;
  linkedBillId?: string;
  status: 'draft' | 'issued' | 'applied';
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  entityId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  entityId: string;
  vendorId: string;
  billNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillLine {
  id: string;
  billId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  taxAmount: number;
  amount: number;
  glAccountId?: string;
  categoryId?: string;
}

export interface Payment {
  id: string;
  entityId: string;
  date: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'transfer' | 'cash' | 'check';
  reference?: string;
  clientId?: string;
  vendorId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId?: string;
  billId?: string;
  amount: number;
}

// ============================================================================
// Banking, Feeds & Reconciliation
// ============================================================================

export interface Account {
  id: string;
  entityId: string;
  name: string;
  type: 'bank' | 'credit_card' | 'loan' | 'mortgage' | 'investment' | 'other';
  institution?: string;
  currency: string;
  country: string;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankConnection {
  id: string;
  entityId: string;
  institutionId: string;
  institutionName: string;
  status: 'active' | 'error' | 'disconnected';
  lastSyncAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankFeedTransaction {
  id: string;
  bankConnectionId: string;
  accountId: string;
  bankTransactionId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  balance?: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  categoryId?: string;
  notes?: string;
  sourceType: 'bank_feed' | 'manual' | 'invoice' | 'bill';
  sourceId?: string;
  journalEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionMatch {
  id: string;
  bankFeedTransactionId: string;
  transactionId?: string;
  journalEntryId?: string;
  status: 'matched' | 'suggested' | 'unmatched';
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  date: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  parentCategoryId?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Budgeting, Goals & Analytics
// ============================================================================

export interface Budget {
  id: string;
  entityId: string;
  name: string;
  categoryId?: string;
  glAccountId?: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  entityId: string;
  name: string;
  type: 'savings' | 'debt_paydown' | 'investment';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  accountId?: string;
  categoryId?: string;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
}

export interface ReportDefinition {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  type: 'cash_flow' | 'p_and_l' | 'balance_sheet' | 'custom';
  filters: Record<string, any>;
  layout: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  id: string;
  entityId: string;
  date: string;
  glAccountId?: string;
  categoryId?: string;
  balance: number;
  createdAt: string;
}

// ============================================================================
// Users, Sharing & SaaS
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  workspaceId: string;
  entityId?: string;
  role: 'owner' | 'admin' | 'collaborator' | 'bookkeeper' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  renewalDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  entityId?: string;
  action: string;
  entityType: string;
  entityId_affected: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  timestamp: string;
}

// ============================================================================
// AI, Rules & Documents
// ============================================================================

export interface Insight {
  id: string;
  entityId: string;
  triggerId: string;
  title: string;
  description: string;
  type: 'spending' | 'tax' | 'subsidy' | 'alert' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  impact?: number;
  confidence?: number;
  actionable: boolean;
  status: 'active' | 'dismissed' | 'applied';
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsightTrigger {
  id: string;
  name: string;
  description: string;
  conditions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Rule {
  id: string;
  entityId: string;
  name: string;
  conditions: Record<string, any>;
  action: Record<string, any>;
  isActive: boolean;
  source: 'user' | 'ai';
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  linkedEntityType: string;
  linkedEntityId: string;
  ocrStatus?: 'pending' | 'completed' | 'failed';
  ocrText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTemplate {
  id: string;
  entityId: string;
  type: 'invoice' | 'bill' | 'journal_entry';
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  template: Record<string, any>;
  nextRunDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Optional High-Value Entities
// ============================================================================

export interface Project {
  id: string;
  entityId: string;
  name: string;
  code: string;
  description?: string;
  status: 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntercompanyMapping {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  name: string;
  rules: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  linkedEntityType?: string;
  linkedEntityId?: string;
  createdAt: string;
}
