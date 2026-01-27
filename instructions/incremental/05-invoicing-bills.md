# Milestone 5: Invoicing & Bills

**Prerequisites:** Foundation and Transactions & Bookkeeping complete

## Goal

Build AR/AP management with invoice/bill creation, client/vendor directory, payment tracking, and GL integration.

## Key Functionality

1. **Invoice Management** - Create, edit, send invoices with line items and tax
2. **Bill Management** - Track vendor bills with line items and tax
3. **Client/Vendor Directory** - Contact management
4. **Product/Service Catalog** - Reusable line items
5. **Payment Recording** - Link payments to invoices/bills
6. **Payment Allocation** - Split payment across multiple invoices
7. **Credit Notes** - Adjustments and refunds
8. **Status Tracking** - Draft → Sent/Issued → Paid → Overdue
9. **Aging Reports** - Track overdue invoices and bills

## Components

- `InvoiceList` - Table with status, client, amount, due date, filters
- `InvoiceRow` - Single invoice with status badge
- `InvoiceDetail` - Full invoice with line items, payments, actions
- `InvoiceForm` - Create/edit with multi-line items, tax calculation
- `BillList` - Similar to invoices but for payables
- `BillRow` - Single bill row
- `ClientVendorList` - Directory with contact details, transaction history
- `ProductList` - Catalog of reusable line items
- `PaymentModal` - Record payment and allocate to invoices/bills
- `CreditNoteForm` - Create credit note against invoice/bill

## Tab Navigation

- **Invoices** (default)
- **Bills**
- **Clients/Vendors**
- **Products & Services**

## Done Checklist

- [ ] Can create invoices with multiple line items
- [ ] Tax auto-calculates per line item
- [ ] Invoice statuses update correctly (Draft/Sent/Paid/Overdue)
- [ ] Can create and manage bills similarly
- [ ] Client/vendor directory displays with contact details
- [ ] Product catalog for reusable line items
- [ ] Can record payments and allocate to invoices/bills
- [ ] Payment allocation supports partial and overpayments
- [ ] Can create credit notes
- [ ] Invoice/bill detail view shows full breakdown
- [ ] Aging reports identify overdue items
- [ ] GL integration posts to accounts receivable/payable
- [ ] Tests pass

**Reference:** `sections/invoicing-bills/`
