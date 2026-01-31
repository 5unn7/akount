# Phase 1 Enhancements: Running Balance Display

**Document:** Feature Enhancement Specification
**Status:** Approved
**Phase:** Phase 1 (Accounts Overview)
**Date:** 2026-01-31
**Related:** `docs/features/01-accounts-overview.md`, `docs/architecture/lunchmoney-feature-analysis.md`

---

## Overview

Add running balance calculation to transaction list views. This is a core accounting feature that shows the account balance after each transaction, helping users detect errors and understand account history.

**User Demand:** 86 votes on LunchMoney
**Effort:** 2-3 hours (LOW)
**Priority:** ⭐⭐⭐ MUST HAVE for Phase 1

---

## What is Running Balance?

Running balance shows the cumulative account balance after each transaction in a chronological list. This helps users:
- Detect errors (e.g., account went negative unexpectedly)
- Understand historical balance at any point
- Reconcile statements more easily
- Verify transaction order is correct

**Example:**
```
Date       Description    Amount      Balance (Running)
2026-01-31 Groceries      -$50.00     $1,450.00  ← Current state
2026-01-30 Paycheck      +$2,000.00   $1,500.00  ← Before groceries
2026-01-29 Gas            -$40.00     -$500.00   ← Account was negative here!
2026-01-28 Deposit       +$1,000.00    -$460.00
```

---

## User Stories

**As a user, I want to:**
1. See the balance after each transaction in my account history
2. Quickly identify when my account went negative
3. Verify that transaction order matches my expectations
4. Reconcile my account against bank statements

**As an accountant, I want to:**
1. Trace balance discrepancies to specific transactions
2. Verify that opening/closing balances are correct
3. Identify data entry errors by spotting unexpected balance changes

---

## Technical Implementation

### Backend Changes

#### 1. API Enhancement: GET /api/accounts/:id/transactions

**File:** `apps/api/src/routes/accounts.ts`

**Current Response:**
```typescript
{
  transactions: [
    { id, date, description, amount, category, ... }
  ]
}
```

**Enhanced Response:**
```typescript
{
  transactions: [
    {
      id,
      date,
      description,
      amount,
      category,
      runningBalance: 145000 // New field (integer cents)
    }
  ]
}
```

**Algorithm:**
```typescript
// Pseudo-code for running balance calculation
async function getAccountTransactions(accountId: string) {
  // 1. Get current account balance
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { currentBalance: true }
  });

  // 2. Get transactions (descending order - newest first)
  const transactions = await prisma.transaction.findMany({
    where: { accountId, tenantId: user.tenantId },
    orderBy: { date: 'desc' },
    include: { category: true }
  });

  // 3. Calculate running balance (going backwards in time)
  let runningBalance = account.currentBalance;

  const transactionsWithBalance = transactions.map(txn => {
    const result = {
      ...txn,
      runningBalance // Balance AFTER this transaction
    };

    // Subtract amount to go back in time
    // (debits are positive, credits are negative)
    runningBalance -= txn.amount;

    return result;
  });

  return transactionsWithBalance;
}
```

**Edge Cases to Handle:**
- Empty transaction list (just return current balance)
- Single transaction (runningBalance = currentBalance)
- Multi-currency accounts (convert to base currency first)
- Very large transaction lists (pagination required)

---

### Frontend Changes

#### 1. Type Definition Update

**File:** `packages/types/src/transaction.ts`

```typescript
export interface Transaction {
  id: string;
  accountId: string;
  date: string; // ISO date
  description: string;
  amount: number; // Integer cents
  category?: Category;
  // ... existing fields

  // NEW: Running balance after this transaction
  runningBalance?: number; // Integer cents, optional for backward compatibility
}
```

#### 2. Component Update: TransactionList

**File:** `apps/web/src/components/accounts/TransactionList.tsx`

**Add "Balance" Column:**
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Description</TableHead>
      <TableHead>Category</TableHead>
      <TableHead className="text-right">Amount</TableHead>
      <TableHead className="text-right">Balance</TableHead> {/* NEW */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions.map(txn => (
      <TableRow key={txn.id}>
        <TableCell>{formatDate(txn.date)}</TableCell>
        <TableCell>{txn.description}</TableCell>
        <TableCell>{txn.category?.name}</TableCell>
        <TableCell className="text-right">
          {formatCurrency(txn.amount)}
        </TableCell>
        <TableCell className="text-right font-semibold"> {/* NEW */}
          {txn.runningBalance !== undefined
            ? formatCurrency(txn.runningBalance)
            : '—'}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**Visual Enhancement:**
```tsx
// Highlight negative balances
<TableCell
  className={cn(
    "text-right font-semibold",
    txn.runningBalance < 0 && "text-red-600 dark:text-red-400"
  )}
>
  {formatCurrency(txn.runningBalance)}
</TableCell>
```

---

## Testing Requirements

### Unit Tests

**File:** `apps/api/src/routes/accounts.test.ts`

```typescript
describe('GET /api/accounts/:id/transactions', () => {
  it('calculates running balance correctly', async () => {
    // Setup: Create account with balance = $100
    const account = await createTestAccount({ currentBalance: 10000 });

    // Create transactions
    await createTransaction({ accountId: account.id, amount: 5000, date: '2026-01-29' }); // +$50
    await createTransaction({ accountId: account.id, amount: -2000, date: '2026-01-30' }); // -$20
    await createTransaction({ accountId: account.id, amount: 3000, date: '2026-01-31' }); // +$30

    // Current balance should be: $100 + $50 - $20 + $30 = $160

    const response = await request(app)
      .get(`/api/accounts/${account.id}/transactions`)
      .expect(200);

    const txns = response.body.transactions;

    // Transactions returned newest first
    expect(txns[0].runningBalance).toBe(16000); // $160 (current)
    expect(txns[1].runningBalance).toBe(13000); // $130 (before +$30)
    expect(txns[2].runningBalance).toBe(15000); // $150 (before -$20)
  });

  it('handles empty transaction list', async () => {
    const account = await createTestAccount({ currentBalance: 10000 });

    const response = await request(app)
      .get(`/api/accounts/${account.id}/transactions`)
      .expect(200);

    expect(response.body.transactions).toEqual([]);
  });

  it('handles single transaction', async () => {
    const account = await createTestAccount({ currentBalance: 10000 });
    await createTransaction({ accountId: account.id, amount: 2000, date: '2026-01-31' });

    const response = await request(app)
      .get(`/api/accounts/${account.id}/transactions`)
      .expect(200);

    const txns = response.body.transactions;
    expect(txns[0].runningBalance).toBe(10000); // Current balance
  });

  it('handles negative balance correctly', async () => {
    const account = await createTestAccount({ currentBalance: -5000 }); // -$50
    await createTransaction({ accountId: account.id, amount: -3000, date: '2026-01-31' }); // -$30

    const response = await request(app)
      .get(`/api/accounts/${account.id}/transactions`)
      .expect(200);

    const txns = response.body.transactions;
    expect(txns[0].runningBalance).toBe(-5000); // -$50 (current)
  });
});
```

### Component Tests

**File:** `apps/web/src/components/accounts/TransactionList.test.tsx`

```typescript
describe('TransactionList', () => {
  it('displays running balance column', () => {
    const transactions = [
      { id: '1', date: '2026-01-31', description: 'Test', amount: 1000, runningBalance: 10000 },
      { id: '2', date: '2026-01-30', description: 'Test', amount: 2000, runningBalance: 9000 },
    ];

    render(<TransactionList transactions={transactions} />);

    expect(screen.getByText('Balance')).toBeInTheDocument(); // Column header
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // First balance
    expect(screen.getByText('$90.00')).toBeInTheDocument(); // Second balance
  });

  it('highlights negative balances in red', () => {
    const transactions = [
      { id: '1', date: '2026-01-31', description: 'Test', amount: -5000, runningBalance: -5000 },
    ];

    render(<TransactionList transactions={transactions} />);

    const balanceCell = screen.getByText('-$50.00');
    expect(balanceCell).toHaveClass('text-red-600');
  });

  it('handles missing runningBalance gracefully', () => {
    const transactions = [
      { id: '1', date: '2026-01-31', description: 'Test', amount: 1000 }, // No runningBalance
    ];

    render(<TransactionList transactions={transactions} />);

    expect(screen.getByText('—')).toBeInTheDocument(); // Placeholder
  });
});
```

### E2E Test

**File:** `apps/web/src/e2e/accounts.spec.ts`

```typescript
test('running balance calculates correctly in transaction list', async ({ page }) => {
  // Login
  await page.goto('/sign-in');
  await signIn(page);

  // Create test account with $100 balance
  await createAccountViaAPI({ name: 'Test Account', currentBalance: 10000 });

  // Add transactions
  await createTransactionViaAPI({ amount: 5000, date: '2026-01-29' }); // +$50
  await createTransactionViaAPI({ amount: -2000, date: '2026-01-30' }); // -$20

  // Navigate to account
  await page.goto('/accounts/test-account');

  // Verify running balances display
  const rows = page.locator('table tbody tr');

  await expect(rows.nth(0).locator('td').nth(4)).toHaveText('$130.00'); // Latest balance
  await expect(rows.nth(1).locator('td').nth(4)).toHaveText('$80.00'); // Previous balance
});
```

---

## Performance Considerations

### Query Optimization

**Challenge:** Calculating running balance for large transaction lists (10,000+ transactions)

**Solution 1: Pagination**
```typescript
// Only calculate running balance for current page
const pageSize = 50;
const page = req.query.page || 1;

const transactions = await prisma.transaction.findMany({
  where: { accountId },
  orderBy: { date: 'desc' },
  skip: (page - 1) * pageSize,
  take: pageSize
});

// Calculate running balance starting from current balance
// going backwards through paginated results
```

**Solution 2: Lazy Loading**
```typescript
// Frontend: Only calculate running balance when user scrolls to view
// Use virtualization for long lists (react-virtual)
```

**Solution 3: Caching**
```typescript
// Cache running balance calculation for 5 minutes
// Invalidate on new transaction creation
const cacheKey = `running-balance:${accountId}:${page}`;
```

---

## UI/UX Considerations

### Desktop Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Date       Description       Category    Amount       Balance   │
├─────────────────────────────────────────────────────────────────┤
│ 2026-01-31 Groceries         Food        -$50.00     $1,450.00 │
│ 2026-01-30 Paycheck          Income      +$2,000.00  $1,500.00 │
│ 2026-01-29 Gas               Auto        -$40.00     -$500.00  │ ← Red highlight
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Responsive)
```
┌─────────────────────────────────┐
│ 2026-01-31  Groceries           │
│ Food        -$50.00             │
│ Balance: $1,450.00              │
├─────────────────────────────────┤
│ 2026-01-30  Paycheck            │
│ Income      +$2,000.00          │
│ Balance: $1,500.00              │
└─────────────────────────────────┘
```

### Accessibility
- Running balance column should have `aria-label="Balance after transaction"`
- Negative balances should have `aria-describedby="negative-balance-warning"`
- Screen reader announcement: "Account balance after this transaction: negative fifty dollars"

---

## Migration Plan

### Backward Compatibility

**Challenge:** Existing API consumers may not expect `runningBalance` field

**Solution:**
- Add `runningBalance` as optional field
- Old clients ignore it, new clients use it
- No breaking changes

### Database Migration

**No schema changes required** - This is a calculated field, not stored in database.

### Deployment

1. Deploy backend changes (add running balance calculation)
2. Deploy frontend changes (display running balance column)
3. No downtime required (backward compatible)

---

## Success Metrics

**After Implementation:**
1. User feedback: "Running balance helps me reconcile accounts faster"
2. Support tickets: Reduced "my balance doesn't match" inquiries
3. Feature usage: 80%+ of users view transaction list with running balance
4. Performance: Running balance calculation adds <50ms to API response time

---

## Future Enhancements (Post-MVP)

**Potential additions:**
1. **Running balance chart** - Visual sparkline showing balance trend
2. **Balance alerts** - Notify when balance drops below threshold
3. **Balance forecasting** - Project future running balance (integrates with Phase 2 cash flow forecasting)
4. **Export with running balance** - Include in CSV/PDF exports

---

## Related Features

**Dependencies:**
- None (standalone enhancement)

**Integrations:**
- Phase 2 (Cash Flow Forecasting): Use running balance for historical trend analysis
- Phase 2 (Bank Reconciliation): Running balance helps verify statement matching
- Phase 5 (Data Export): Include running balance in transaction exports

---

## Implementation Checklist

### Backend
- [ ] Add running balance calculation to `GET /api/accounts/:id/transactions`
- [ ] Handle pagination (calculate per page)
- [ ] Add caching for performance
- [ ] Write unit tests
- [ ] Test with large transaction lists (10,000+ rows)
- [ ] Test with multi-currency accounts

### Frontend
- [ ] Update Transaction type definition (add `runningBalance?: number`)
- [ ] Add "Balance" column to TransactionList component
- [ ] Add negative balance highlighting (red text)
- [ ] Make responsive for mobile
- [ ] Add loading states
- [ ] Write component tests
- [ ] Write E2E tests

### Documentation
- [ ] Update API documentation
- [ ] Add user guide section ("Understanding Running Balance")
- [ ] Update feature comparison (Akount vs competitors)

---

## Timeline

**Estimated Effort:** 2-3 hours

**Breakdown:**
- Backend implementation: 1 hour
- Frontend implementation: 1 hour
- Testing: 30 minutes
- Documentation: 30 minutes

**Deliverable:** Running balance displays in all transaction lists by end of Phase 1

---

## References

- **LunchMoney Feature Request:** 86 votes for "Show balance after each transaction"
- **Related Analysis:** `docs/architecture/lunchmoney-feature-analysis.md`
- **Original Phase 1 Spec:** `docs/features/01-accounts-overview.md`
- **Roadmap:** `ROADMAP.md` (Phase 1 enhancements)

---

**Status:** ✅ Approved for Phase 1 implementation
**Next Steps:** Begin implementation after Phase 0 foundation is complete
