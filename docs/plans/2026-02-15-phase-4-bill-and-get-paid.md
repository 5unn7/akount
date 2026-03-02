# Phase 4: Bill & Get Paid — Implementation Plan

**Created:** 2026-02-15
**Status:** Draft
**Feature Spec:** [docs/design-system/03-screens/invoicing.md](../design-system/03-screens/invoicing.md)
**Dependencies:** Phase 3 complete (GL, PostingService, Chart of Accounts)

---

## Overview

Phase 4 transforms Akount from a bookkeeping tool into an operational financial platform. Users will create invoices for clients, track bills from vendors, record payments with allocation to specific documents, and have all transactions automatically post to the general ledger with proper double-entry journal entries.

This phase also adds invoice PDF generation and email sending — enabling users to actually *bill* from Akount.

## What Already Exists (Slice 4 Foundation)

| Component | Status | Notes |
|-----------|--------|-------|
| Client CRUD (service + routes + UI) | COMPLETE | 12 tests, stats, search |
| Vendor CRUD (service + routes + UI) | COMPLETE | 12 tests, stats, search |
| Invoice CRUD (service + routes) | COMPLETE | 14 tests, line items, tax, aging stats |
| Bill CRUD (service + routes) | COMPLETE | 14 tests, line items, tax, aging stats |
| Invoice/Bill Prisma models | COMPLETE | With lines, soft delete, unique numbers |
| Payment Prisma model | PARTIAL | Model exists, no service/routes/allocation |
| CreditNote Prisma model | EXISTS | No service/routes (deferred) |
| Invoicing page (UI) | PARTIAL | AR/AP aging bars, tables — no forms |
| InvoiceStatus/BillStatus enums | COMPLETE | DRAFT, SENT/PENDING, PAID, OVERDUE, CANCELLED, PARTIALLY_PAID |

## What Phase 4 Builds

| Capability | Sprint | Priority |
|------------|--------|----------|
| PaymentAllocation schema + migration | Sprint 1 | P0 (blocker) |
| Invoice/Bill status transitions | Sprint 1 | P0 |
| Invoice/Bill/Payment GL posting | Sprint 2 | P0 |
| Payment service + routes + tests | Sprint 3 | P0 |
| Invoice/Bill creation forms (UI) | Sprint 4 | P1 |
| Payment recording form (UI) | Sprint 4 | P1 |
| Invoice PDF generation | Sprint 5 | P1 |
| Invoice email sending | Sprint 5 | P1 |
| Detail pages + AR/AP reports | Sprint 6 | P2 |

## Success Criteria

- [ ] Payments can be recorded and allocated to invoices/bills (partial + full)
- [ ] Invoice posting creates: DR Accounts Receivable, CR Revenue, CR Tax Payable
- [ ] Bill posting creates: DR Expense, CR Accounts Payable
- [ ] Payment posting creates: DR Cash CR AR (customer) or DR AP CR Cash (vendor)
- [ ] SUM(debits) === SUM(credits) for every generated journal entry
- [ ] Invoices can be sent via email with PDF attachment
- [ ] Invoice/Bill creation forms with line item builder work end-to-end
- [ ] All services have tenant isolation and soft delete
- [ ] 80+ new tests (payment service/routes, GL posting, status transitions)
- [ ] Frontend: Invoice form, Bill form, Payment form, Detail pages functional

---

## Sprint 1: Schema Migration + Status Transitions (~6 hours)

### Task 1.1: Add PaymentAllocation model + BILL source type

**File:** `packages/db/prisma/schema.prisma`
**What:** Add `PaymentAllocation` model linking payments to invoices/bills. Add `BILL` to `JournalEntrySourceType` enum (currently missing — only INVOICE, PAYMENT exist).

```prisma
model PaymentAllocation {
  id         String   @id @default(cuid())
  paymentId  String
  invoiceId  String?
  billId     String?
  amount     Int      // Integer cents allocated to this document
  createdAt  DateTime @default(now())
  payment    Payment  @relation(fields: [paymentId], references: [id])
  invoice    Invoice? @relation(fields: [invoiceId], references: [id])
  bill       Bill?    @relation(fields: [billId], references: [id])

  @@index([paymentId])
  @@index([invoiceId])
  @@index([billId])
}
```

Also add reverse relations on Payment, Invoice, and Bill models:
- `Payment.allocations PaymentAllocation[]`
- `Invoice.paymentAllocations PaymentAllocation[]`
- `Bill.paymentAllocations PaymentAllocation[]`

**Depends on:** none
**Risk:** high (schema migration on financial models)
**Review:** `prisma-migration-reviewer`
**Success:** `npx prisma migrate dev` succeeds, `npx prisma generate` succeeds

### Task 1.2: Generate and verify migration

**File:** `packages/db/prisma/migrations/<timestamp>_add_payment_allocation/`
**What:** Run `npx prisma migrate dev --name add_payment_allocation` from packages/db. Verify migration SQL is correct (creates table, indexes, FKs). Verify `BILL` added to `JournalEntrySourceType` enum.
**Depends on:** Task 1.1
**Risk:** high (database migration)
**Review:** `prisma-migration-reviewer`
**Success:** Migration applies cleanly, Prisma Client regenerated

### Task 1.3: Invoice status transition service

**File:** `apps/api/src/domains/invoicing/services/invoice.service.ts`
**What:** Add status transition methods to existing invoice service:
- `sendInvoice(id, ctx)` — DRAFT → SENT (validates all required fields present)
- `markOverdue(id, ctx)` — SENT/PARTIALLY_PAID → OVERDUE (called by scheduler or on-demand)
- `recordPayment(id, amount, ctx)` — Updates paidAmount, transitions to PARTIALLY_PAID or PAID
- `cancelInvoice(id, ctx)` — DRAFT/SENT → CANCELLED (cannot cancel if payments exist)

Guard invalid transitions (e.g., PAID → DRAFT). Status changes are logged.
**Depends on:** none
**Review:** `financial-data-validator`
**Success:** Status transitions enforce valid state machine from spec

### Task 1.4: Bill status transition service

**File:** `apps/api/src/domains/invoicing/services/bill.service.ts`
**What:** Add status transition methods to existing bill service:
- `approveBill(id, ctx)` — DRAFT → PENDING
- `markOverdue(id, ctx)` — PENDING/PARTIALLY_PAID → OVERDUE
- `recordPayment(id, amount, ctx)` — Updates paidAmount, transitions to PARTIALLY_PAID or PAID
- `cancelBill(id, ctx)` — DRAFT/PENDING → CANCELLED

Same state machine validation approach as invoices.
**Depends on:** none
**Review:** `financial-data-validator`
**Success:** Status transitions enforce valid state machine from spec

### Task 1.5: Add status transition routes

**File:** `apps/api/src/domains/invoicing/routes/invoice.ts`, `apps/api/src/domains/invoicing/routes/bill.ts`
**What:** Add new endpoints for status transitions:
- `POST /api/invoicing/invoices/:id/send` — send invoice (DRAFT → SENT)
- `POST /api/invoicing/invoices/:id/cancel` — cancel invoice
- `POST /api/invoicing/bills/:id/approve` — approve bill (DRAFT → PENDING)
- `POST /api/invoicing/bills/:id/cancel` — cancel bill

Zod schemas for transition requests. Auth + tenant middleware applied.
**Depends on:** Task 1.3, Task 1.4
**Success:** Endpoints return updated document with new status

### Task 1.6: Status transition tests

**File:** `apps/api/src/domains/invoicing/__tests__/invoice-transitions.test.ts`, `apps/api/src/domains/invoicing/__tests__/bill-transitions.test.ts`
**What:** Test valid and invalid transitions for both invoices and bills:
- Valid transitions succeed (DRAFT → SENT, etc.)
- Invalid transitions fail (PAID → DRAFT, etc.)
- Cancellation blocked when payments exist
- paidAmount updates on payment recording
- Tenant isolation on all transition endpoints
**Depends on:** Task 1.3, Task 1.4, Task 1.5
**Success:** 20+ tests passing (10 invoice, 10 bill)

---

## Sprint 2: GL Posting for Invoices, Bills & Payments (~12 hours)

### Task 2.1: Invoice posting service

**File:** `apps/api/src/domains/accounting/services/posting.service.ts`
**What:** Add `postInvoice(invoiceId: string)` method to PostingService:

```
DR Accounts Receivable    (invoice.total)
CR Revenue                (per line item — line.amount - line.taxAmount)
CR Tax Payable            (per line item — line.taxAmount, if > 0)
```

- Uses serializable isolation (matching existing pattern)
- Stores sourceType: INVOICE, sourceId: invoice.id, sourceDocument: JSON snapshot
- Multi-currency: if invoice.currency !== entity.functionalCurrency, use FX rate
- Prevents double-posting (check if journal entry already exists for this invoice)
- Updates invoice status to indicate GL posting (or adds `journalEntryId` to Invoice)

**Depends on:** Task 1.2 (migration for BILL enum)
**Risk:** high (financial double-entry)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Journal entry balances (debits === credits), source preserved

### Task 2.2: Bill posting service

**File:** `apps/api/src/domains/accounting/services/posting.service.ts`
**What:** Add `postBill(billId: string)` method to PostingService:

```
DR Expense / Asset GL     (per line item — line.amount - line.taxAmount, uses line.glAccountId)
DR Recoverable Tax        (per line item — line.taxAmount, if > 0)
CR Accounts Payable       (bill.total)
```

Same pattern as invoice posting (serializable isolation, source preservation, double-post prevention).

**Depends on:** Task 1.2
**Risk:** high (financial double-entry)
**Review:** `financial-data-validator`
**Success:** Journal entry balances, correct GL accounts used per line

### Task 2.3: Payment posting service

**File:** `apps/api/src/domains/accounting/services/posting.service.ts`
**What:** Add `postPayment(paymentId: string)` method to PostingService:

**Customer payment (clientId set):**
```
DR Cash / Bank            (payment.amount)
CR Accounts Receivable    (payment.amount)
```

**Vendor payment (vendorId set):**
```
DR Accounts Payable       (payment.amount)
CR Cash / Bank            (payment.amount)
```

**FX handling:** If payment.currency !== entity.functionalCurrency:
- Calculate FX gain/loss vs. original invoice/bill rate
- Post FX gain/loss to "Foreign Exchange Gain/Loss" GL account

**Depends on:** Task 1.2
**Risk:** high (financial double-entry + FX)
**Review:** `financial-data-validator`
**Success:** Journal entry balances, FX difference handled, source preserved

### Task 2.4: GL posting routes

**File:** `apps/api/src/domains/invoicing/routes/invoice.ts`, `apps/api/src/domains/invoicing/routes/bill.ts`
**What:** Add posting endpoints:
- `POST /api/invoicing/invoices/:id/post` — Post invoice to GL (creates JE)
- `POST /api/invoicing/bills/:id/post` — Post bill to GL (creates JE)

These call PostingService.postInvoice() / postBill(). Payments are posted automatically when recorded (Sprint 3).
**Depends on:** Task 2.1, Task 2.2
**Success:** Posting creates journal entry, returns entry ID

### Task 2.5: GL posting tests

**File:** `apps/api/src/domains/accounting/__tests__/posting-invoices.test.ts`, `apps/api/src/domains/accounting/__tests__/posting-bills.test.ts`
**What:** Comprehensive GL posting tests:

**Invoice posting tests (15+):**
- Single line → correct DR AR / CR Revenue
- Multi-line → correct CR per revenue line
- With tax → CR Tax Payable entries
- Multi-currency → FX rate applied, baseCurrencyAmount correct
- Double-post prevention → error on second attempt
- Source document preserved → sourceType, sourceId, sourceDocument
- Tenant isolation → wrong tenant gets 404
- Debits === Credits invariant on every test

**Bill posting tests (15+):**
- Same pattern as invoice tests but DR Expense / CR AP

**Depends on:** Task 2.1, Task 2.2, Task 2.3
**Risk:** high (validating financial invariants)
**Review:** `financial-data-validator`
**Success:** 30+ tests passing, every test asserts balance

---

## Sprint 3: Payment Service + Routes (~10 hours)

### Task 3.1: Payment Zod schemas

**File:** `apps/api/src/domains/invoicing/schemas/payment.schema.ts`
**What:** Define Zod validation schemas:
- `CreatePaymentSchema` — date, amount (int), currency, paymentMethod, clientId OR vendorId (not both), reference?, notes?, allocations[] (invoiceId/billId + amount)
- `ListPaymentsSchema` — cursor pagination, filter by clientId, vendorId, date range, method
- `AllocatePaymentSchema` — array of { invoiceId/billId, amount } pairs
- Validation: total allocations <= payment amount
- Validation: clientId XOR vendorId required (not both, not neither)
**Depends on:** Task 1.2 (PaymentAllocation model)
**Success:** Schemas export and validate correctly

### Task 3.2: Payment service

**File:** `apps/api/src/domains/invoicing/services/payment.service.ts`
**What:** Complete PaymentService:
- `recordPayment(data, ctx)` — Create payment + allocations in a transaction. For each allocation, update invoice/bill paidAmount and status. Auto-post to GL via PostingService.
- `listPayments(filters, ctx)` — Cursor pagination with tenant isolation, include allocations + invoice/bill refs
- `getPayment(id, ctx)` — Single payment with allocations, invoice/bill details
- `allocatePayment(paymentId, allocations, ctx)` — Add/update allocations. Recalculate invoice/bill paidAmount. Re-validate totals.
- `deletePayment(id, ctx)` — Soft delete. Reverse allocations (reduce invoice/bill paidAmount). Void associated journal entry.

**Business rules:**
- Allocation amount per document cannot exceed document's remaining balance (total - paidAmount)
- Sum of allocations cannot exceed payment amount
- Unallocated payments are allowed (credit balance)
- Deleting a payment reverses its allocations
- Payment automatically transitions invoice/bill status (PARTIALLY_PAID or PAID)

**Depends on:** Task 3.1, Task 2.3 (payment posting)
**Risk:** high (financial allocation logic + cross-domain updates)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Payment creation + allocation updates invoice paidAmount, posts to GL

### Task 3.3: Payment routes

**File:** `apps/api/src/domains/invoicing/routes/payment.ts`
**What:** 5 endpoints:
- `POST /api/invoicing/payments` — Record payment (with inline allocations)
- `GET /api/invoicing/payments` — List payments (cursor pagination, filters)
- `GET /api/invoicing/payments/:id` — Get single payment (with allocations)
- `POST /api/invoicing/payments/:id/allocate` — Update allocations
- `DELETE /api/invoicing/payments/:id` — Soft delete + reverse allocations

**Depends on:** Task 3.2
**Success:** All endpoints respond with correct status codes, tenant-scoped

### Task 3.4: Register payment routes

**File:** `apps/api/src/domains/invoicing/routes/index.ts`
**What:** Register payment routes under the invoicing domain prefix. Ensure auth + tenant middleware applied.
**Depends on:** Task 3.3
**Success:** Payment routes accessible at `/api/invoicing/payments/*`

### Task 3.5: Payment service tests

**File:** `apps/api/src/domains/invoicing/__tests__/payment.service.test.ts`
**What:** 25+ tests:
- Record payment with single allocation → paidAmount updated
- Record payment with multiple allocations → all documents updated
- Partial payment → status becomes PARTIALLY_PAID
- Full payment → status becomes PAID
- Over-allocation rejected → error
- Unallocated payment → allowed (credit balance)
- Delete payment → allocations reversed, paidAmount reduced, JE voided
- Tenant isolation → wrong tenant gets 404
- Integer cents invariant on all monetary fields
- Soft delete verification
- XOR validation (clientId or vendorId, not both)
**Depends on:** Task 3.2
**Review:** `financial-data-validator`
**Success:** 25+ tests passing

### Task 3.6: Payment route tests

**File:** `apps/api/src/domains/invoicing/__tests__/payment.routes.test.ts`
**What:** 15+ tests:
- POST /payments → 201 + allocations applied
- GET /payments → paginated list, tenant-filtered
- GET /payments/:id → payment with allocations
- POST /payments/:id/allocate → allocations updated
- DELETE /payments/:id → 204, soft deleted
- Auth required → 401 without token
- Tenant isolation → 404 for other tenant's payments
- Validation errors → 400 with details
**Depends on:** Task 3.3
**Success:** 15+ tests passing

---

## Sprint 4: Frontend Forms (~14 hours)

### Task 4.1: Line item builder component

**File:** `apps/web/src/components/line-item-builder.tsx`
**What:** Reusable client component for invoice/bill line items:
- Add/remove line rows (minimum 1 line)
- Per-line fields: description, quantity, unit price, tax rate (dropdown), GL account (dropdown)
- Auto-calculate: line amount = qty * unitPrice, line tax = amount * taxRate
- Display: subtotal, total tax, total (at bottom)
- All amounts in integer cents (format as currency for display)
- Glass UI styling (glass card rows, ak-border separators)
- Keyboard navigation: Tab between fields, Enter to add row

Uses design tokens: `glass`, `border-ak-border`, `text-muted-foreground`, `font-mono` for amounts.
**Depends on:** none
**Success:** Component renders, calculates correctly, usable in both invoice and bill forms

### Task 4.2: Invoice creation form

**File:** `apps/web/src/app/(dashboard)/business/invoices/invoice-form.tsx`
**What:** Client component Sheet/dialog for creating invoices:
- Header: client dropdown (fetches from /api/clients), invoice date, due date, currency, invoice number (auto-generated)
- Body: LineItemBuilder component
- Footer: subtotal, tax, total display + Create button
- On submit: POST /api/invoicing/invoices with line items
- Validation: all required fields, at least 1 line, totals match
- Error handling: display API errors, highlight invalid fields
- Success: close sheet, refresh invoice list

**Depends on:** Task 4.1
**Success:** Can create a new invoice with line items end-to-end

### Task 4.3: Bill creation form

**File:** `apps/web/src/app/(dashboard)/business/invoices/bill-form.tsx`
**What:** Client component Sheet/dialog for creating bills (mirrors invoice form):
- Header: vendor dropdown (fetches from /api/vendors), bill date, due date, currency, bill number
- Body: LineItemBuilder component (with GL expense account dropdowns)
- Footer: subtotal, tax, total display + Create button
- Same validation and error handling pattern as invoice form

**Depends on:** Task 4.1
**Success:** Can create a new bill with line items end-to-end

### Task 4.4: Payment recording form

**File:** `apps/web/src/app/(dashboard)/business/invoices/payment-form.tsx`
**What:** Client component Sheet/dialog for recording payments:
- Header: payment type toggle (Customer / Vendor), client/vendor dropdown, date, amount, currency, payment method dropdown, reference
- Allocation section: table of open invoices/bills for selected client/vendor. Each row shows document number, total, outstanding balance, allocation input.
- Auto-fill: clicking "Pay in full" fills allocation = outstanding balance
- Remaining display: payment amount - sum(allocations) = unallocated
- Validation: allocations <= payment amount, each allocation <= document outstanding
- On submit: POST /api/invoicing/payments with allocations

**Depends on:** Task 3.3 (payment routes must exist)
**Success:** Can record a payment, allocate to invoices/bills, see updated statuses

### Task 4.5: API client functions for payments

**File:** `apps/web/src/lib/api/payments.ts`
**What:** API client functions:
- `listPayments(params)` — GET /api/invoicing/payments
- `getPayment(id)` — GET /api/invoicing/payments/:id
- `recordPayment(data)` — POST /api/invoicing/payments
- `allocatePayment(id, allocations)` — POST /api/invoicing/payments/:id/allocate
- `deletePayment(id)` — DELETE /api/invoicing/payments/:id

Also add status transition functions to existing `invoices.ts` and `bills.ts`:
- `sendInvoice(id)`, `cancelInvoice(id)`, `postInvoice(id)`
- `approveBill(id)`, `cancelBill(id)`, `postBill(id)`

**Depends on:** none (can be built against API spec)
**Success:** Functions export with correct types

### Task 4.6: Update invoicing page with forms + actions

**File:** `apps/web/src/app/(dashboard)/business/invoices/page.tsx` (and related client components)
**What:** Wire up creation forms and action buttons:
- "New Invoice" button opens InvoiceForm sheet
- "New Bill" button opens BillForm sheet
- "Record Payment" button opens PaymentForm sheet
- Invoice table rows: status badge, "Send" / "Post" / "Cancel" action buttons
- Bill table rows: status badge, "Approve" / "Post" / "Cancel" action buttons
- Refresh data after mutations (revalidatePath or optimistic update)

**Depends on:** Task 4.2, Task 4.3, Task 4.4, Task 4.5
**Success:** Full CRUD workflow accessible from invoicing page

---

## Sprint 5: Invoice PDF + Email Sending (~12 hours)

### Task 5.1: Install PDF + Email dependencies

**File:** `apps/api/package.json`
**What:** Install:
- `@react-pdf/renderer` — PDF generation (React-based, good for invoices)
- `resend` — Email sending (modern, simple API, free tier 100 emails/day)

Add to `apps/api/package.json`, run `pnpm install`.
**Depends on:** none
**Success:** Dependencies installed, importable

### Task 5.2: Invoice PDF template

**File:** `apps/api/src/domains/invoicing/services/pdf.service.ts`
**What:** PDF generation service using @react-pdf/renderer:
- `generateInvoicePdf(invoice, entity, client)` → Buffer
- Template includes: entity logo/name, client info, invoice number, dates, line items table (description, qty, unit price, tax, amount), subtotal, tax total, total, payment terms, notes
- Professional layout (clean, minimal — matching Akount brand)
- All amounts formatted as currency (integer cents → "$10.50")
- Multi-currency support (show currency symbol)

**Depends on:** Task 5.1
**Success:** Generates valid PDF buffer from invoice data

### Task 5.3: Email service

**File:** `apps/api/src/lib/email.ts`
**What:** Email sending service using Resend:
- `sendEmail({ to, subject, html, text, attachments })` — generic send function
- Environment variable: `RESEND_API_KEY`
- Error handling with retry (1 retry on transient failure)
- Uses `request.log` for structured logging (no console.log)
- Returns send result (success/failure + messageId)

**Depends on:** Task 5.1
**Success:** Can send email with attachment via Resend

### Task 5.4: Invoice send endpoint

**File:** `apps/api/src/domains/invoicing/services/invoice.service.ts`, `apps/api/src/domains/invoicing/routes/invoice.ts`
**What:** Update `sendInvoice()` to:
1. Validate invoice is DRAFT status
2. Generate PDF via PdfService
3. Send email to client with PDF attachment
4. Transition status to SENT
5. Return updated invoice

New route: `POST /api/invoicing/invoices/:id/send` (update existing from Task 1.5 to include PDF + email)

Requires client to have email address. If no email, return 400 with message.

**Depends on:** Task 5.2, Task 5.3, Task 1.3
**Risk:** high (external service integration)
**Review:** `security-sentinel`
**Success:** Invoice sent via email with PDF, status updated to SENT

### Task 5.5: PDF download endpoint

**File:** `apps/api/src/domains/invoicing/routes/invoice.ts`
**What:** Add endpoint to download invoice as PDF:
- `GET /api/invoicing/invoices/:id/pdf` — Generate and return PDF
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="INV-{number}.pdf"
- Tenant-scoped (only accessible by tenant members)

**Depends on:** Task 5.2
**Success:** GET returns downloadable PDF file

### Task 5.6: Email + PDF tests

**File:** `apps/api/src/domains/invoicing/__tests__/pdf.service.test.ts`, `apps/api/src/domains/invoicing/__tests__/invoice-send.test.ts`
**What:** Tests:
- PDF generation produces valid buffer (non-empty, starts with %PDF)
- PDF includes invoice number, client name, line items
- Email send mocked (don't actually send in tests)
- Send endpoint transitions status to SENT
- Send fails gracefully if client has no email
- Send fails if invoice not in DRAFT status
- PDF download returns application/pdf content type

**Depends on:** Task 5.4, Task 5.5
**Success:** 10+ tests passing

---

## Sprint 6: Detail Pages + AR/AP Reports + Polish (~8 hours)

### Task 6.1: Invoice detail page

**File:** `apps/web/src/app/(dashboard)/business/invoices/[id]/page.tsx`
**What:** Server component that fetches invoice by ID:
- Header: invoice number, status badge, client name, dates
- Line items table (read-only)
- Totals section (subtotal, tax, total, paid, outstanding)
- Payment history (list of allocated payments)
- Action buttons: Send (if DRAFT), Post to GL (if not posted), Download PDF, Cancel
- Timeline of status changes (if audit data available)
- Loading.tsx and error.tsx siblings

**Depends on:** Task 4.5 (API client), Task 5.5 (PDF download)
**Success:** Invoice detail page renders with full data, actions work

### Task 6.2: Bill detail page

**File:** `apps/web/src/app/(dashboard)/business/invoices/bills/[id]/page.tsx`
**What:** Same pattern as invoice detail but for bills:
- Bill number, vendor name, status, dates
- Line items table
- Payment history
- Action buttons: Approve (if DRAFT), Post to GL, Cancel

**Depends on:** Task 4.5
**Success:** Bill detail page renders with full data

### Task 6.3: Payment list page

**File:** `apps/web/src/app/(dashboard)/business/payments/page.tsx`
**What:** Server component showing all payments:
- Table: date, client/vendor name, amount, method, allocations count, reference
- Filters: type (customer/vendor), date range, payment method
- Click → payment detail (expandable row or Sheet)
- "Record Payment" button
- Loading.tsx and error.tsx siblings

**Depends on:** Task 4.5
**Success:** Payment list renders with real data, filterable

### Task 6.4: AR/AP aging report enhancement

**File:** `apps/web/src/app/(dashboard)/business/invoices/page.tsx` (enhance existing)
**What:** Enhance the existing invoicing page with:
- AR aging summary card (Current, 1-30, 31-60, 60+ day buckets with amounts)
- AP aging summary card (same buckets for bills)
- Total outstanding AR/AP prominently displayed
- Aging bar visualization (already partially exists)
- These already have backend stats APIs — wire them up more prominently

**Depends on:** none (stats endpoints already exist)
**Success:** AR/AP aging visible at a glance on invoicing page

### Task 6.5: Loading + error states for new pages

**File:** Multiple `loading.tsx` and `error.tsx` files
**What:** Add loading skeletons and error boundaries for:
- `invoices/[id]/loading.tsx` + `error.tsx`
- `invoices/bills/[id]/loading.tsx` + `error.tsx`
- `business/payments/loading.tsx` + `error.tsx`

Follow existing patterns from `banking/accounts/loading.tsx`.
**Depends on:** Task 6.1, Task 6.2, Task 6.3
**Success:** All new pages have loading and error states

---

## Reference Files

**Patterns to follow:**
- `apps/api/src/domains/accounting/services/posting.service.ts` — GL posting pattern (serializable isolation, source preservation)
- `apps/api/src/domains/invoicing/services/invoice.service.ts` — existing invoice service (tenant isolation, validation)
- `apps/api/src/domains/invoicing/schemas/invoice.schema.ts` — existing Zod schema pattern
- `apps/api/src/domains/banking/routes/transaction.ts` — route handler pattern
- `apps/web/src/app/(dashboard)/business/invoices/page.tsx` — existing invoicing page
- `apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entry-form.tsx` — dynamic line item form pattern (reference for LineItemBuilder)

**Specifications:**
- `docs/design-system/03-screens/invoicing.md` — feature spec (posting logic, state machines, FX handling)
- `packages/db/prisma/schema.prisma` — data models
- `packages/db/CLAUDE.md` — model reference table

---

## Edge Cases

- **Over-payment:** Payment amount > invoice total → allow (creates credit balance on client). Display warning in UI.
- **Multi-currency payment:** Payment in different currency than invoice → use FX rate at payment date, post gain/loss to FX GL account.
- **Partial payment:** Multiple payments against one invoice → each allocation updates paidAmount incrementally. Status = PARTIALLY_PAID until paidAmount >= total.
- **Delete payment with allocations:** Soft delete payment → reverse all allocations (reduce paidAmount on each invoice/bill) → void associated journal entry.
- **Post already-posted invoice:** Return error "Invoice already posted" (idempotency check via existing JE link).
- **Send invoice without client email:** Return 400 "Client email required for sending".
- **Cancel invoice with payments:** Block cancellation → return error "Cannot cancel: payments exist. Void via credit note."
- **Concurrent payment recording:** Use database transactions with serializable isolation for paidAmount updates to prevent race conditions.
- **Zero-amount line items:** Reject at schema level (quantity and unitPrice must be > 0).

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 1.1-1.2 (Schema migration) | `prisma-migration-reviewer` |
| Task 1.3-1.4 (Status transitions) | `financial-data-validator` |
| Task 2.1-2.3 (GL posting) | `financial-data-validator`, `security-sentinel` |
| Task 3.2 (Payment service) | `financial-data-validator`, `security-sentinel` |
| Task 4.1-4.4 (Frontend forms) | `nextjs-app-router-reviewer`, `design-system-enforcer` |
| Task 5.3-5.4 (Email sending) | `security-sentinel` |
| Sprint 5 overall | `kieran-typescript-reviewer` |

---

## Domain Impact

- **Primary domains:** Invoicing (invoices, bills, payments), Clients, Vendors
- **Adjacent domains:**
  - **Accounting** — GL posting creates journal entries (new PostingService methods)
  - **Banking** — Payment recording may reference bank accounts (cash account for GL)
  - **Overview** — Dashboard should show AR/AP totals (existing overview API may need new data)

---

## Testing Strategy

**Unit tests (service layer):**
- Invoice/Bill status transitions (valid + invalid)
- Payment service (record, allocate, delete, edge cases)
- GL posting (debit/credit balance, source preservation, FX)

**Route tests (API layer):**
- Payment endpoints (CRUD, validation, auth, tenant isolation)
- Status transition endpoints
- PDF download + invoice send

**Invariant tests (every test file):**
- `assertIntegerCents()` on all monetary fields
- Debits === Credits on all journal entries
- Soft delete verification on DELETE endpoints
- Tenant isolation (cross-tenant rejection)

**Target:** 80+ new tests across 6 test files

---

## Pre-Existing Issues to Address

Before starting Sprint 1, resolve remaining code review items:
- [ ] 16 pages need loading/error states (Issue 1 partial — can be done in parallel)
- [ ] Service tests for invoice/bill (Issue 5 — some overlap with Sprint tasks)

These overlap with Phase 4 work and should be addressed in Sprint 1 or Sprint 4.

---

## Progress

- [ ] **Sprint 1:** Schema migration + status transitions (6 tasks)
- [ ] **Sprint 2:** GL posting for invoices/bills/payments (5 tasks)
- [ ] **Sprint 3:** Payment service + routes + tests (6 tasks)
- [ ] **Sprint 4:** Frontend forms (6 tasks)
- [ ] **Sprint 5:** PDF + email (6 tasks)
- [ ] **Sprint 6:** Detail pages + reports + polish (5 tasks)

**Total:** 34 tasks across 6 sprints