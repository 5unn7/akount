# Invoicing & Bills

Manage accounts receivable and payable with full invoice and bill creation, client/vendor management, and payment tracking linked to bank transactions.

## Key Features
- Invoice creation with line items, tax calculations, client linking
- Bill management with vendor tracking
- Client/vendor directory with contact details and history
- Product/service catalog for reusable line items
- Payment recording and allocation to multiple invoices/bills
- Credit notes for adjustments and refunds
- Status tracking (Draft → Sent/Issued → Paid → Overdue)
- Aging reports for receivables and payables
- GL integration for AR/AP posting

## Tab Navigation
- **Invoices** (default)
- **Bills**
- **Clients/Vendors**
- **Products & Services**

## Components
- Invoice/bill list tables with status badges
- Invoice/bill detail views with line item breakdown
- Create/edit forms with multi-line items and auto tax calculation
- Client/vendor directory
- Product catalog
- Payment modal with allocation
- Credit note forms

**Reference:** `product/sections/invoicing-bills/spec.md`, `types.ts`, `sample-data.json`, `tests.md`
