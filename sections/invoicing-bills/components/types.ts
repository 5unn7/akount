// =============================================================================
// Data Types
// =============================================================================

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  status: 'active' | 'inactive'
  totalOutstanding: number
  currency: string
}

export interface Vendor {
  id: string
  name: string
  email: string
  phone: string
  address: string
  paymentTerms: string
  status: 'active' | 'inactive'
  totalOwed: number
  currency: string
}

export interface Product {
  id: string
  name: string
  description: string
  defaultPrice: number
  taxRate: number
  category: string
  unit: string
}

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
  productId?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  currency: string
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  paidDate?: string
  notes: string
  entityId: string
  lines: InvoiceLine[]
}

export interface BillLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
}

export interface Bill {
  id: string
  billNumber: string
  vendorId: string
  vendorName: string
  issueDate: string
  dueDate: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  currency: string
  subtotal: number
  taxTotal: number
  total: number
  amountPaid: number
  amountDue: number
  paidDate?: string
  notes: string
  entityId: string
  lines: BillLine[]
}

export interface CreditNoteLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  taxAmount: number
  lineTotal: number
}

export interface CreditNote {
  id: string
  creditNoteNumber: string
  type: 'invoice' | 'bill'
  linkedDocumentId: string
  linkedDocumentNumber: string
  clientId?: string
  clientName?: string
  vendorId?: string
  vendorName?: string
  issueDate: string
  currency: string
  subtotal: number
  taxTotal: number
  total: number
  reason: string
  status: 'pending' | 'applied'
  entityId: string
  lines: CreditNoteLine[]
}

export interface Payment {
  id: string
  paymentNumber: string
  type: 'received' | 'paid'
  clientId?: string
  clientName?: string
  vendorId?: string
  vendorName?: string
  paymentDate: string
  amount: number
  currency: string
  paymentMethod: 'bank_transfer' | 'credit_card' | 'cash' | 'check'
  referenceNumber: string
  bankTransactionId?: string
  notes: string
  entityId: string
}

export interface PaymentAllocation {
  id: string
  paymentId: string
  documentType: 'invoice' | 'bill'
  documentId: string
  documentNumber: string
  allocatedAmount: number
  allocationDate: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface InvoiceListProps {
  /** The list of invoices to display */
  invoices: Invoice[]
  /** The list of clients for filtering */
  clients: Client[]
  /** Called when user wants to view an invoice's details */
  onView?: (id: string) => void
  /** Called when user wants to edit an invoice */
  onEdit?: (id: string) => void
  /** Called when user wants to delete an invoice */
  onDelete?: (id: string) => void
  /** Called when user wants to send an invoice to the client */
  onSend?: (id: string) => void
  /** Called when user wants to mark an invoice as paid */
  onMarkPaid?: (id: string) => void
  /** Called when user wants to create a new invoice */
  onCreate?: () => void
  /** Called when user wants to create a credit note for an invoice */
  onCreateCreditNote?: (id: string) => void
}

export interface BillListProps {
  /** The list of bills to display */
  bills: Bill[]
  /** The list of vendors for filtering */
  vendors: Vendor[]
  /** Called when user wants to view a bill's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a bill */
  onEdit?: (id: string) => void
  /** Called when user wants to delete a bill */
  onDelete?: (id: string) => void
  /** Called when user wants to mark a bill as paid */
  onMarkPaid?: (id: string) => void
  /** Called when user wants to create a new bill */
  onCreate?: () => void
  /** Called when user wants to create a credit note for a bill */
  onCreateCreditNote?: (id: string) => void
}

export interface ClientListProps {
  /** The list of clients to display */
  clients: Client[]
  /** Called when user wants to view a client's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a client */
  onEdit?: (id: string) => void
  /** Called when user wants to delete a client */
  onDelete?: (id: string) => void
  /** Called when user wants to create a new client */
  onCreate?: () => void
  /** Called when user wants to create an invoice for a client */
  onCreateInvoice?: (clientId: string) => void
}

export interface VendorListProps {
  /** The list of vendors to display */
  vendors: Vendor[]
  /** Called when user wants to view a vendor's details */
  onView?: (id: string) => void
  /** Called when user wants to edit a vendor */
  onEdit?: (id: string) => void
  /** Called when user wants to delete a vendor */
  onDelete?: (id: string) => void
  /** Called when user wants to create a new vendor */
  onCreate?: () => void
  /** Called when user wants to create a bill for a vendor */
  onCreateBill?: (vendorId: string) => void
}

export interface ProductListProps {
  /** The list of products/services to display */
  products: Product[]
  /** Called when user wants to edit a product */
  onEdit?: (id: string) => void
  /** Called when user wants to delete a product */
  onDelete?: (id: string) => void
  /** Called when user wants to create a new product */
  onCreate?: () => void
}

export interface InvoiceDetailProps {
  /** The invoice to display */
  invoice: Invoice
  /** Client information */
  client: Client
  /** Payment allocations for this invoice */
  paymentAllocations: PaymentAllocation[]
  /** Payments linked to this invoice */
  payments: Payment[]
  /** Credit notes applied to this invoice */
  creditNotes: CreditNote[]
  /** Called when user wants to edit the invoice */
  onEdit?: () => void
  /** Called when user wants to delete the invoice */
  onDelete?: () => void
  /** Called when user wants to send the invoice */
  onSend?: () => void
  /** Called when user wants to record a payment */
  onRecordPayment?: () => void
  /** Called when user wants to link to a bank transaction */
  onLinkTransaction?: () => void
  /** Called when user wants to create a credit note */
  onCreateCreditNote?: () => void
  /** Called when user wants to download/print the invoice */
  onDownload?: () => void
}

export interface BillDetailProps {
  /** The bill to display */
  bill: Bill
  /** Vendor information */
  vendor: Vendor
  /** Payment allocations for this bill */
  paymentAllocations: PaymentAllocation[]
  /** Payments linked to this bill */
  payments: Payment[]
  /** Credit notes applied to this bill */
  creditNotes: CreditNote[]
  /** Called when user wants to edit the bill */
  onEdit?: () => void
  /** Called when user wants to delete the bill */
  onDelete?: () => void
  /** Called when user wants to record a payment */
  onRecordPayment?: () => void
  /** Called when user wants to link to a bank transaction */
  onLinkTransaction?: () => void
  /** Called when user wants to create a credit note */
  onCreateCreditNote?: () => void
  /** Called when user wants to download/print the bill */
  onDownload?: () => void
}

export interface InvoiceFormProps {
  /** The invoice to edit (undefined for new invoice) */
  invoice?: Invoice
  /** The list of clients to choose from */
  clients: Client[]
  /** The list of products/services for line items */
  products: Product[]
  /** Called when the form is submitted */
  onSubmit?: (invoice: Partial<Invoice>) => void
  /** Called when the user cancels */
  onCancel?: () => void
  /** Called when user wants to create a new client inline */
  onCreateClient?: () => void
}

export interface BillFormProps {
  /** The bill to edit (undefined for new bill) */
  bill?: Bill
  /** The list of vendors to choose from */
  vendors: Vendor[]
  /** The list of products/services for line items */
  products: Product[]
  /** Called when the form is submitted */
  onSubmit?: (bill: Partial<Bill>) => void
  /** Called when the user cancels */
  onCancel?: () => void
  /** Called when user wants to create a new vendor inline */
  onCreateVendor?: () => void
}

export interface CreditNoteFormProps {
  /** The invoice or bill this credit note is for */
  linkedDocument: Invoice | Bill
  /** Type of document being credited */
  documentType: 'invoice' | 'bill'
  /** Called when the form is submitted */
  onSubmit?: (creditNote: Partial<CreditNote>) => void
  /** Called when the user cancels */
  onCancel?: () => void
}

export interface PaymentLinkingProps {
  /** The invoice or bill to link payment to */
  document: Invoice | Bill
  /** Type of document */
  documentType: 'invoice' | 'bill'
  /** Available bank transactions to link from */
  bankTransactions: Array<{
    id: string
    date: string
    description: string
    amount: number
  }>
  /** Called when user selects a transaction to link */
  onLink?: (transactionId: string, amount: number) => void
  /** Called when the user cancels */
  onCancel?: () => void
}
