---
name: quality:test-coverage-analyze
description: Identify gaps in test coverage
model: claude-sonnet-3-7-20250219
aliases:
  - test-gaps
  - coverage-check
  - test-analysis
keywords:
  - test
  - coverage
  - testing
  - gaps
  - edge-cases
---

# Test Coverage Analyzer

Identifies missing tests and edge cases.

## What to Check

**Unit Tests:**

- All public functions tested
- Edge cases covered
- Error handling tested

**Integration Tests:**

- Multi-tenant isolation verified
- Database transactions tested
- API endpoints validated

**Financial Tests:**

- Integer cent arithmetic verified
- Double-entry bookkeeping validated
- Currency conversions tested

**Security Tests:**

- Tenant isolation enforced
- Input validation checked
- Authentication tested

## Usage

```bash
/quality:test-coverage-analyze
```

Reviews code changes, suggests missing tests.

## Review Process

### Step 1: Identify Changed Code

```bash
# Find changed files
git diff main --name-only

# Exclude test files
git diff main --name-only | grep -v '\.test\.'
```

### Step 2: Find Existing Tests

```bash
# For each changed file, find corresponding test
# Example: apps/api/src/routes/invoices.ts
# Should have: apps/api/src/routes/invoices.test.ts

Glob "**/*.test.{ts,tsx}"
```

### Step 3: Analyze Test Coverage

For each changed file:

1. **Functions without tests:**
   - List all exported functions
   - Check if each has corresponding test
   - Flag untested functions

2. **Edge cases without tests:**
   - Null/undefined inputs
   - Empty arrays/objects
   - Boundary values (min/max)
   - Error conditions

3. **Financial logic without tests:**
   - Money calculations
   - Currency conversions
   - Double-entry bookkeeping
   - Precision checks

4. **Security logic without tests:**
   - TenantId validation
   - Authentication checks
   - Input sanitization
   - SQL injection prevention

### Step 4: Generate Test Recommendations

For each gap, suggest:

- Test case description
- Expected behavior
- Priority (High/Medium/Low)

## Edge Cases to Consider

### 1. Nulls and Undefined

```typescript
// Function to test
function calculateTotal(items: Item[] | undefined): number {
  return items?.reduce((sum, item) => sum + item.amount, 0) ?? 0
}

// Tests needed
test('handles undefined items', () => {
  expect(calculateTotal(undefined)).toBe(0)
})

test('handles empty array', () => {
  expect(calculateTotal([])).toBe(0)
})

test('handles null items in array', () => {
  expect(calculateTotal([null])).toBe(0)
})
```

### 2. Boundary Values

```typescript
// Function to test
function validateAmount(amount: number): boolean {
  return amount >= 0 && amount <= 1000000000 // $10M max
}

// Tests needed
test('rejects negative amounts', () => {
  expect(validateAmount(-1)).toBe(false)
})

test('accepts zero', () => {
  expect(validateAmount(0)).toBe(true)
})

test('accepts max value', () => {
  expect(validateAmount(1000000000)).toBe(true)
})

test('rejects above max', () => {
  expect(validateAmount(1000000001)).toBe(false)
})
```

### 3. Multi-Tenant Isolation

```typescript
// Function to test
async function getInvoices(tenantId: string): Promise<Invoice[]> {
  return prisma.invoice.findMany({
    where: { tenantId }
  })
}

// Tests needed
test('returns only invoices for given tenant', async () => {
  const tenant1Invoices = await getInvoices('tenant-1')
  expect(tenant1Invoices.every(i => i.tenantId === 'tenant-1')).toBe(true)
})

test('does not return other tenant invoices', async () => {
  const tenant1Invoices = await getInvoices('tenant-1')
  expect(tenant1Invoices.some(i => i.tenantId !== 'tenant-1')).toBe(false)
})
```

### 4. Financial Calculations

```typescript
// Function to test
function applyDiscount(amount: number, discountPercent: number): number {
  return Math.round(amount * (1 - discountPercent / 100))
}

// Tests needed
test('applies discount correctly', () => {
  expect(applyDiscount(1000, 10)).toBe(900) // $10.00 - 10% = $9.00
})

test('handles fractional cents correctly', () => {
  expect(applyDiscount(1000, 33.33)).toBe(667) // Rounds to $6.67
})

test('handles zero discount', () => {
  expect(applyDiscount(1000, 0)).toBe(1000)
})

test('handles 100% discount', () => {
  expect(applyDiscount(1000, 100)).toBe(0)
})
```

### 5. Error Handling

```typescript
// Function to test
async function createInvoice(data: InvoiceInput): Promise<Invoice> {
  if (!data.clientId) {
    throw new Error('Client ID required')
  }
  return prisma.invoice.create({ data })
}

// Tests needed
test('throws error for missing clientId', async () => {
  await expect(createInvoice({ clientId: null }))
    .rejects.toThrow('Client ID required')
})

test('throws error for invalid amount', async () => {
  await expect(createInvoice({ amount: -100 }))
    .rejects.toThrow()
})
```

## Test Priority Guidelines

### High Priority (Must Have)

- **Financial calculations** - Money errors are unacceptable
- **Multi-tenant isolation** - Security critical
- **Authentication/authorization** - Security critical
- **Data integrity** - Double-entry bookkeeping
- **Critical user flows** - Invoice creation, payment processing

### Medium Priority (Should Have)

- **Edge cases** - Null handling, boundaries
- **Error handling** - Graceful failures
- **Input validation** - Prevent bad data
- **API endpoints** - Contract validation
- **Business logic** - Core features

### Low Priority (Nice to Have)

- **UI components** - Visual regression testing
- **Utility functions** - Simple helpers
- **Formatting** - Display logic
- **Non-critical features** - Experimental features

## Output Format

### Summary

- **Files Analyzed:** X files
- **Functions Without Tests:** Y functions
- **Edge Cases Missing:** Z cases
- **Priority Distribution:** High: A, Medium: B, Low: C

### Missing Tests

For each gap:

```
❌ File: apps/api/src/services/invoice.service.ts
Function: calculateInvoiceTotal(invoice: Invoice): number
Edge Cases Missing:
  - Null/undefined invoice
  - Empty line items array
  - Fractional cent rounding
  - Multi-currency handling
Priority: High (Financial calculation)

Suggested Test:
test('handles empty line items', () => {
  const invoice = { lineItems: [] }
  expect(calculateInvoiceTotal(invoice)).toBe(0)
})
```

### Test Coverage Score

```
Overall Coverage: XX%

By Category:
- Financial Logic: XX%
- Security Logic: XX%
- Business Logic: XX%
- Utilities: XX%

Recommendation: [Continue / Improve / Urgent]
```

### Approval

- ✅ **APPROVED** - Adequate test coverage (>80%)
- ⚠️ **SUGGESTIONS** - Gaps identified (60-80%)
- ❌ **REQUIRES TESTS** - Insufficient coverage (<60%)

## Test Template Generator

For identified gaps, generate test templates:

```typescript
// Generated test template
import { describe, it, expect } from 'vitest'
import { functionName } from './file'

describe('functionName', () => {
  it('handles normal case', () => {
    // Arrange
    const input = // TODO: Add test input

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toBe(/* TODO: Expected value */)
  })

  it('handles null input', () => {
    // TODO: Test null case
  })

  it('handles empty input', () => {
    // TODO: Test empty case
  })

  it('handles error case', () => {
    // TODO: Test error handling
  })
})
```

## Related Resources

- `docs/standards/financial-data.md` - Financial testing requirements
- `docs/standards/multi-tenancy.md` - Tenant isolation testing
- `docs/standards/security.md` - Security testing guidelines
- Vitest documentation (external)
