# Testing Review Agents

This document contains test scenarios to validate the agents work correctly.

---

## Testing the financial-data-validator Agent

### Test Scenario 1: Unbalanced Journal Entry

#### Code to Review:
```typescript
async function createInvoiceJournalEntry(invoice: Invoice) {
  return await prisma.journalEntry.create({
    data: {
      entityId: invoice.entityId,
      date: invoice.issueDate,
      memo: `Invoice ${invoice.invoiceNumber}`,
      status: "POSTED",
      lines: {
        create: [
          // Debit AR
          {
            glAccountId: "ar-account-id",
            debitAmount: invoice.total,
            creditAmount: 0,
          },
          // Credit Revenue - WRONG AMOUNT!
          {
            glAccountId: "revenue-account-id",
            debitAmount: 0,
            creditAmount: invoice.subtotal, // ❌ Missing tax!
          },
        ],
      },
    },
  });
}
```

#### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: Unbalanced journal entry (debits ≠ credits)
- **Impact**: General ledger will be out of balance, financial statements incorrect
- **Recommendation**: Credit amount must equal debit amount (include tax in revenue or use separate tax payable account)

---

### Test Scenario 2: Float Arithmetic on Money

#### Code to Review:
```typescript
function calculateInvoiceTotal(invoice: Invoice) {
  const subtotal = parseFloat(invoice.subtotalCents) / 100; // ❌ Converting to float!
  const taxRate = 0.05;
  const tax = subtotal * taxRate; // ❌ Float arithmetic
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100),
    tax: Math.round(tax * 100),
    total: Math.round(total * 100),
  };
}
```

#### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Using floating-point arithmetic for monetary calculations
- **Impact**: Precision loss, rounding errors accumulate over many transactions
- **Recommendation**: Keep all calculations in integer cents:
```typescript
function calculateInvoiceTotal(invoice: Invoice) {
  const subtotal = invoice.subtotalCents; // Already in cents
  const tax = Math.round(subtotal * 0.05); // Integer cents
  const total = subtotal + tax;
  return { subtotal, tax, total };
}
```

---

### Test Scenario 3: Currency Mismatch

#### Code to Review:
```typescript
async function allocatePayment(payment: Payment, invoices: Invoice[]) {
  let remainingAmount = payment.amount; // USD

  for (const invoice of invoices) {
    const amountToAllocate = Math.min(
      remainingAmount,
      invoice.total - invoice.paidAmount // CAD! ❌
    );

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount: invoice.paidAmount + amountToAllocate },
    });

    remainingAmount -= amountToAllocate;
  }
}
```

#### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: Currency mismatch - adding USD payment to CAD invoice without conversion
- **Impact**: Incorrect payment allocation, financial statements in wrong currency
- **Recommendation**: Convert currencies using FX rate before allocation:
```typescript
if (payment.currency !== invoice.currency) {
  const fxRate = await getFxRate(payment.currency, invoice.currency, payment.date);
  amountToAllocate = Math.round(amountToAllocate * fxRate);
}
```

---

### Test Scenario 4: Non-Atomic Financial Operations

#### Code to Review:
```typescript
async function postInvoicePayment(invoiceId: string, paymentAmount: number) {
  // Create journal entry
  const journalEntry = await prisma.journalEntry.create({
    data: { /* ... */ },
  });

  // Update invoice - ❌ Not in transaction!
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "PAID",
      paidAmount: paymentAmount,
    },
  });

  // If this fails, invoice is marked PAID but no journal entry exists!
}
```

#### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Non-atomic financial operations - partial updates possible on failure
- **Impact**: Invoice can be marked as paid without journal entry, breaking audit trail
- **Recommendation**: Wrap in database transaction:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.journalEntry.create({ /* ... */ });
  await tx.invoice.update({ /* ... */ });
});
```

---

### Test Scenario 5: Modifying Posted Entry

#### Code to Review:
```typescript
async function updateJournalEntryMemo(entryId: string, newMemo: string) {
  return await prisma.journalEntry.update({
    where: { id: entryId },
    data: { memo: newMemo }, // ❌ No status check!
  });
}
```

#### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Allowing modification of potentially posted journal entries
- **Impact**: Breaks audit trail, violates immutability of posted transactions
- **Recommendation**: Prevent updates to posted entries:
```typescript
const entry = await prisma.journalEntry.findUnique({ where: { id: entryId } });
if (entry.status === "POSTED") {
  throw new Error("Cannot modify posted journal entries");
}
```

---

### Test Scenario 6: Safe Financial Logic (Should Pass)

#### Code to Review:
```typescript
async function createInvoiceWithPayment(invoiceData: any, paymentAmount: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create invoice
    const invoice = await tx.invoice.create({
      data: {
        ...invoiceData,
        subtotal: invoiceData.subtotalCents, // Integer cents
        taxAmount: Math.round(invoiceData.subtotalCents * 0.05), // Integer
        total: invoiceData.subtotalCents + Math.round(invoiceData.subtotalCents * 0.05),
        currency: "USD",
        status: "DRAFT",
      },
    });

    // 2. Create journal entry (balanced)
    const journalEntry = await tx.journalEntry.create({
      data: {
        entityId: invoice.entityId,
        date: invoice.issueDate,
        status: "POSTED",
        sourceType: "INVOICE",
        sourceId: invoice.id,
        lines: {
          create: [
            { debitAmount: invoice.total, creditAmount: 0, glAccountId: "ar-id" },
            { debitAmount: 0, creditAmount: invoice.total, glAccountId: "rev-id" },
          ],
        },
      },
    });

    // 3. Create audit log
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "Invoice",
        entityId: invoice.id,
        userId: "user-id",
      },
    });

    return { invoice, journalEntry };
  });
}
```

#### Expected Agent Response:
- **Risk Level**: LOW
- **Status**: APPROVED
- **Financial Accuracy**: VERIFIED
- **Notes**:
  - ✓ Integer cents arithmetic throughout
  - ✓ Balanced journal entry (debits = credits)
  - ✓ Wrapped in database transaction
  - ✓ Audit log created
  - ✓ Source linking (sourceType/sourceId)
  - ✓ Currency specified

---

## Testing the nextjs-app-router-reviewer Agent

### Test Scenario 1: Over-Using 'use client'

#### Code to Review:
```tsx
// app/invoices/page.tsx
'use client'; // ❌ Unnecessary!

export default function InvoicesPage() {
  // No hooks, no event handlers, no browser APIs
  return (
    <div>
      <h1>Invoices</h1>
      <p>Static content</p>
    </div>
  );
}
```

#### Expected Agent Response:
- **Risk Level**: MEDIUM
- **Issue**: Entire page marked as 'use client' without necessity
- **Impact**: Can't use server-side data fetching, slower initial load
- **Recommendation**: Remove 'use client' and fetch data server-side:
```tsx
export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany();
  return <InvoiceList invoices={invoices} />;
}
```

---

### Test Scenario 2: Client-Side Data Fetching Waterfall

#### Code to Review:
```tsx
'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div>Loading...</div>;
  return <div>{JSON.stringify(data)}</div>;
}
```

#### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Client-side data fetching in component that could be Server Component
- **Impact**: Slower page load, loading flash, unnecessary API route
- **Recommendation**: Convert to Server Component with direct data fetch:
```tsx
export default async function DashboardPage() {
  const data = await prisma.invoice.findMany();
  return <InvoiceList data={data} />;
}
```

---

### Test Scenario 3: Using Hooks in Server Component

#### Code to Review:
```tsx
// Missing 'use client'!
import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0); // ❌ Error!

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

#### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: Using useState hook without 'use client' directive
- **Impact**: Runtime error, page will not render
- **Recommendation**: Add 'use client' at top of file:
```tsx
'use client';
import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
```

---

### Test Scenario 4: Sequential Fetches (Waterfall)

#### Code to Review:
```tsx
export default async function DashboardPage() {
  const invoices = await prisma.invoice.findMany(); // Wait
  const payments = await prisma.payment.findMany(); // Then wait
  const accounts = await prisma.account.findMany(); // Then wait

  return <Dashboard invoices={invoices} payments={payments} accounts={accounts} />;
}
```

#### Expected Agent Response:
- **Risk Level**: MEDIUM
- **Issue**: Sequential data fetches creating waterfall (slow)
- **Impact**: Total load time = sum of all fetches instead of max of fetches
- **Recommendation**: Parallelize with Promise.all():
```tsx
export default async function DashboardPage() {
  const [invoices, payments, accounts] = await Promise.all([
    prisma.invoice.findMany(),
    prisma.payment.findMany(),
    prisma.account.findMany(),
  ]);

  return <Dashboard invoices={invoices} payments={payments} accounts={accounts} />;
}
```

---

### Test Scenario 5: Deprecated Clerk Pattern

#### Code to Review:
```tsx
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'; // ❌ Deprecated!

export default authMiddleware({
  publicRoutes: ['/'],
});
```

#### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Using deprecated `authMiddleware` from Clerk (v5 pattern)
- **Impact**: Won't work properly with Clerk v6+, missing async auth protection
- **Recommendation**: Use clerkMiddleware from Clerk v6+:
```tsx
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

---

### Test Scenario 6: Missing Metadata

#### Code to Review:
```tsx
// app/invoices/[id]/page.tsx
export default async function InvoicePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  });

  return <div>Invoice #{invoice.invoiceNumber}</div>;
}
```

#### Expected Agent Response:
- **Risk Level**: LOW
- **Issue**: Missing generateMetadata for dynamic page
- **Impact**: Poor SEO, generic page title in browser tab
- **Recommendation**: Add generateMetadata:
```tsx
export async function generateMetadata({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  });

  return {
    title: `Invoice #${invoice.invoiceNumber} - Akount`,
    description: `Invoice for ${invoice.client.name}`,
  };
}
```

---

### Test Scenario 7: Correct Next.js App Router Code (Should Pass)

#### Code to Review:
```tsx
// app/(dashboard)/invoices/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices - Akount',
  description: 'Manage your invoices',
};

async function InvoiceList() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issueDate: 'desc' },
  });

  return (
    <div>
      {invoices.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <div>
      <h1 className="text-3xl font-heading">Invoices</h1>
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList />
      </Suspense>
    </div>
  );
}
```

#### Expected Agent Response:
- **Risk Level**: LOW
- **Status**: APPROVED
- **Next.js Compliance**: VERIFIED
- **Notes**:
  - ✓ Server Component with async data fetching
  - ✓ Metadata export for SEO
  - ✓ Suspense boundary for streaming
  - ✓ Proper route group organization
  - ✓ TypeScript types correct

---

## Testing the prisma-migration-reviewer Agent

This document contains test scenarios to validate the agent works correctly.

## Test Scenario 1: Dangerous CASCADE Delete

### Code to Review:
```prisma
model Payment {
  id        String   @id @default(cuid())
  amount    Decimal  @db.Decimal(19, 4)
  invoiceId String

  // DANGEROUS: CASCADE delete on financial data
  invoice   Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}
```

### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: CASCADE delete on Payment table (financial data)
- **Recommendation**: Change to `onDelete: Restrict` or `onDelete: NoAction`

---

## Test Scenario 2: Float for Monetary Amount

### Code to Review:
```prisma
model Invoice {
  id          String  @id @default(cuid())
  subtotal    Float   // DANGEROUS: Float loses precision
  tax         Float
  total       Float
}
```

### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: Using Float for monetary amounts (precision loss)
- **Recommendation**: Change to `Decimal @db.Decimal(19, 4)`

---

## Test Scenario 3: Required Field Without Default

### Code to Review:
```prisma
model Invoice {
  id          String         @id @default(cuid())
  status      InvoiceStatus  @default(DRAFT)
  // DANGEROUS: Adding required field to existing table
  taxRate     Decimal        @db.Decimal(5, 4)
}
```

### Expected Agent Response:
- **Risk Level**: HIGH
- **Issue**: Required field `taxRate` without default on existing table
- **Recommendation**: Add `@default(0)` or make field nullable with backfill strategy

---

## Test Scenario 4: Enum Value Removal

### Code to Review:
```prisma
enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  // REMOVED: OVERDUE (what happens to existing records?)
  CANCELLED
  PARTIALLY_PAID
}
```

### Expected Agent Response:
- **Risk Level**: CRITICAL
- **Issue**: Removed OVERDUE enum value - breaks existing data
- **Recommendation**: Never remove enum values; deprecate instead or add new enum

---

## Test Scenario 5: Safe Migration (Should Pass)

### Code to Review:
```prisma
model Invoice {
  id          String         @id @default(cuid())
  subtotal    Decimal        @db.Decimal(19, 4)
  tax         Decimal        @db.Decimal(19, 4)
  total       Decimal        @db.Decimal(19, 4)
  status      InvoiceStatus  @default(DRAFT)

  // SAFE: New optional field
  notes       String?

  // SAFE: No cascade delete
  payments    Payment[]      @relation(onDelete: Restrict)
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
  PARTIALLY_PAID
  // SAFE: Adding new enum value
  VOIDED
}
```

### Expected Agent Response:
- **Risk Level**: LOW
- **Status**: APPROVED
- **Notes**: Changes are safe - optional field, proper Decimal types, no cascade deletes, append-only enum

---

## How to Test

1. Copy one of the dangerous code snippets above
2. Ask Claude: "Use the prisma-migration-reviewer agent to review this schema change"
3. Paste the code snippet
4. Verify the agent catches the issue and provides proper guidance

## Quick Test Command

You can test the agent is loaded correctly by asking:
```
List all available review agents in .claude/agents/review/
```

Expected response should include:
- prisma-migration-reviewer
