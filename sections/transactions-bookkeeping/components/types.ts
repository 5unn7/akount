export interface Entity {
  id: string
  name: string
  type: 'personal' | 'business'
  country: string
}

export interface Account {
  id: string
  name: string
  type: 'bank' | 'credit_card' | 'loan' | 'asset'
  currency: string
  entityId: string
}

export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  parentId: string | null
  usageCount: number
}

export interface Transaction {
  id: string
  date: string
  description: string
  merchant: string | null
  amount: number
  currency: string
  accountId: string
  categoryId: string | null
  entityId: string
  status: 'matched' | 'unmatched'
  source: 'bank_feed' | 'manual' | 'invoice' | 'bill'
  reconciliationStatus: 'matched' | 'suggested' | 'unmatched'
  notes: string | null
  linkedInvoiceId?: string
  linkedBillId?: string
  createdAt: string
  updatedAt: string
}

export interface GLAccount {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  normalBalance: 'debit' | 'credit'
  entityId: string
  balance: number
  currency: string
  isActive: boolean
}

export interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  memo: string
  entityId: string
  status: 'draft' | 'posted'
  source: 'manual' | 'automatic'
  createdBy: string
  createdAt: string
  postedAt: string | null
  totalDebits: number
  totalCredits: number
}

export interface JournalLine {
  id: string
  journalEntryId: string
  glAccountId: string
  description: string
  debit: number
  credit: number
  lineNumber: number
}

export interface Rule {
  id: string
  name: string
  conditions: {
    descriptionContains: string
    accountId: string | null
  }
  action: {
    categoryId: string
  }
  isActive: boolean
  priority: number
  createdAt: string
}

export interface AISuggestion {
  id: string
  transactionId: string
  suggestedCategoryId: string
  confidence: number
  reasoning: string
  createdAt: string
}
