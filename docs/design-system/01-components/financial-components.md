# Financial Components

> **Purpose:** Specialized components for displaying and interacting with financial data
>
> **Last Updated:** 2026-02-04

## Overview

Financial components combine primitives and data display components to create Akount-specific controls that enforce accounting best practices:

- **Monospace numbers** - All amounts use JetBrains Mono
- **Direction-aware** - Explicit +/– signs and color coding
- **Multi-currency** - Handle CAD, USD, INR, GBP, EUR, etc.
- **Entity-aware** - Show which legal entity each item belongs to
- **Audit-trail ready** - Track who/what/when/why

---

## Amount Display

### Money Amount (Read-Only)

Display a financial value:

```
–$1,234.56 CAD
≈ –$935.42 USD  (on hover: rate + timestamp)
```

**Format:**
- Sign: Always explicit (+ or –)
- Font: Monospace (JetBrains Mono)
- Color: Income (green), Expense (red), Transfer (slate)
- Currency: 3-letter code always shown
- FX: Secondary amount in parentheses or tooltip

**Implementation:**

```typescript
<MoneyAmount
  amount={-123456}  // cents
  currency="CAD"
  sign="negative"   // or "positive"
  showFX={true}
  fxAmount={-93542}
  fxCurrency="USD"
/>

// Renders: –$1,234.56 CAD ≈ –$935.42 USD
```

### Money Input

User-editable amount field:

```
Amount in CAD
[–$1,234.56]
↓ Automatically converts to USD at current rate
≈ –$935.42 USD (rate: 1 CAD = 0.758 USD)
```

**Features:**
- Accepts negative numbers (for expenses)
- Enforces currency (don't mix)
- Shows conversion in real-time
- FX rate shown with timestamp

**Validation:**
- Numeric only (decimals allowed)
- Rejects values that will round incorrectly

---

## GL Account Selector

Dropdown for selecting General Ledger account:

```
Category / GL Account
[Cloud Services..................▼]

Search or select:
▼ Assets
  ├─ 1000 Cash
  ├─ 1200 Accounts Receivable
▼ Expenses
  ├─ 5100 Cloud Services ← Selected
  └─ 5200 Subscriptions
```

**Features:**
- Grouped by account class (Assets, Liabilities, etc.)
- Show account code + name
- Search/filter by name or code
- Show balance on hover (optional)
- "Uncategorized" pseudo-account option

**Behavior:**
- Cannot select parent categories (only leaf accounts)
- Keyboard navigation: Arrow keys + Enter
- Recent accounts appear first

---

## Entity Badge

Show which legal entity a transaction belongs to:

```
🇨🇦 Canadian Corp
```

On hover:

```
Canadian Corp
Legal Name: Acme Inc. (Canada) Ltd.
Tax ID: 12-3456789
Jurisdiction: Ontario, Canada
Currency: CAD
```

**Properties:**
- Flag emoji (country of registration)
- Short entity name (≤20 chars)
- Color optional (each entity can have color)
- Clickable to filter by entity

---

## Account Card

Summary card for a bank account:

```
┌──────────────────────────────┐
│ Chase Checking               │
│ USD                          │
│                              │
│ Balance: $12,543.89 USD      │
│ ↑ +$2,340 (this month)      │
│                              │
│ Last synced: 2 minutes ago   │
│ [View Transactions]          │
└──────────────────────────────┘
```

**Components:**
- Account name (14px, medium)
- Currency code (12px, muted)
- Balance (24px, monospace, green if positive)
- Trend (arrow + change)
- Sync status
- Action link

---

## Journal Entry Preview

Read-only summary before posting:

```
┌─────────────────────────────────┐
│ Journal Entry Preview           │
├─────────────────────────────────┤
│ Entity: 🇨🇦 Canadian Corp       │
│ Period: Q4 2025 (Open)          │
│ Date: 2025-12-31                │
│                                 │
│ Lines:                          │
│   Cloud Services Exp   DR  $1,200
│   Chase Account        CR  $1,200
│                                 │
│ Status: Balanced ✓              │
│ Audit trail: User, timestamp    │
├─────────────────────────────────┤
│      [Cancel] [Save Draft]      │
│             [Post to GL]         │
└─────────────────────────────────┘
```

**Sections:**
- Header: Entity, period, date
- Journal lines: Monospace amounts, DR/CR labels
- Balance indicator: Green ✓ when balanced
- Action buttons: Clear state transitions

---

## Transaction Row (Table)

Complete row for transaction table:

```
☐ 2025-12-15 │ Amazon AWS       │ 🇨🇦 │ Chase │ Cloud Services │ AWS    │ –$1,200 │ CAD │ USD │ ✓
```

**Columns (default):**
1. Checkbox (bulk actions)
2. Date (sortable)
3. Description (searchable)
4. Entity (flag + name)
5. Account (name + code)
6. Category (editable dropdown)
7. Counterparty (linked)
8. Amount (monospace, color-coded)
9. Currency (3-letter code)
10. FX rate (tooltip)
11. Status (badge)

**States:**
- AI Categorized: Violet dot
- Reconciled: Green checkmark
- Locked: Gray + lock icon
- Error: Red highlight

**Interactions:**
- Click to expand details panel
- Checkbox for bulk operations
- Category editable inline
- Right-click for context menu

---

## Category Suggestion Chip

Inline AI suggestion for categorization:

```
Category: Marketing  [▾]
AI Suggests: Cloud Services  [Apply] [Ignore]
            87% confident
```

**Components:**
- Current value in dropdown
- AI suggestion with confidence %
- [Apply] button
- [Ignore] button or dismissible (✕)

**Behavior:**
- Shows when AI confidence >75%
- Click [Apply] → Updates category, removes chip
- Click [Ignore] → Removes chip, records feedback

---

## Invoice / Bill Row

Special transaction type for accounts receivable/payable:

```
INV-0234  │ 2025-12-15 │ Acme Corp    │ $5,000 CAD │ Partial │ Due: 2026-01-15
  └─ Linked to transaction: AWS payment
  └─ Amount due: $2,500
  └─ Paid: $2,500
  └─ Status: Partially paid
```

**Linked data:**
- Show related transaction
- Payment allocation details
- Due dates
- Aging (days overdue)

---

## Budget Card

Visual display of budget vs. actual:

```
┌──────────────────────────────┐
│ Marketing Budget (Q4)        │
├──────────────────────────────┤
│ Budget:     $5,000           │
│ Spent:      $3,200 (64%)     │
│ Remaining:  $1,800           │
│                              │
│ ████████░░░░░░░░░░░░░░ (64%) │
│                              │
│ [View transactions]          │
└──────────────────────────────┘
```

**Components:**
- Label (budget period)
- Budget amount (monospace)
- Actual spend (monospace)
- Percentage bar (filled)
- Action: View transactions

**Colors:**
- Green (0-70% spent): On track
- Amber (70-90% spent): Approaching limit
- Red (90%+ spent): Over budget

---

## Balance Sheet Item

Account balance display for reporting:

```
Asset
  1000 Cash                          $45,230
  1200 Accounts Receivable          $18,500
                          Subtotal  $63,730
```

**Properties:**
- Hierarchy: Parent → children with indentation
- Amount: Monospace, right-aligned
- Subtotals: Bold, slightly darker background
- Links: Can drill down to transactions

---

## KPI Indicator

Key performance indicator card:

```
┌────────────────────┐
│ Revenue            │  ← Label
│ $45,200 CAD        │  ← Value (monospace)
│ ↑ +$5,200 (↑13%)  │  ← Trend with % change
│ vs. last month    │  ← Context
└────────────────────┘
```

**Variants:**
- **With sparkline:** Mini chart (7 data points)
- **With comparison:** vs. last period / vs. budget
- **With color:** Green (positive), Red (negative), Gray (neutral)

---

## Fiscal Period Status

Shows which periods are open, locked, in review:

```
Q1 2025: ✓ Locked (Apr 1)
Q2 2025: 🔄 In Review (May 1 → May 15)
Q3 2025: ⊗ Open (Jun 1 → today)
Q4 2025: (Future)

[Lock Period] [Request Exception]
```

**States:**
- ✓ Locked: No changes allowed (gray)
- 🔄 In Review: Read-only, awaiting approval (amber)
- ⊗ Open: Editable (green)
- (Future): Not yet available (muted)

---

## Audit Trail Entry

Single action in audit log:

```
2025-12-31 14:23 EST
Sarah Chen categorized this transaction
  From: Uncategorized
  To:   Cloud Services

Method: AI suggestion (87% confidence)
Comment: "Looked correct, applied"

[View changes] [Undo]
```

**Components:**
- Timestamp (with timezone)
- User name + action
- Before/after values (if applicable)
- Method (user, AI, rule, system)
- Optional comment
- Optional undo action

---

## Error Prevention Components

### Balance Validator

Shows real-time debit/credit balance:

```
Debits:   $1,200.00
Credits:  $1,100.00
────────────────────
Difference: –$100 ✕

(Cannot post until balanced)
```

- Shows both sides
- Highlights imbalance
- Color-coded (green = balanced, red = error)
- Explains how to fix

### Fiscal Period Warning

Warns when posting to closed/locked period:

```
⚠ WARNING: Period Locked

Q4 2025 is locked as of Jan 15.
This entry cannot be posted.

[Request Exception] [Choose Different Period]
```

### Duplicate Detector

Flags potential duplicate transactions:

```
⚠ Potential duplicate detected

This matches:
• Bank: $2,400 Amazon (Dec 1)
• Book: $2,400 Cloud Services (Dec 1)

Amount:  Exact match
Date:    Same day
Description: Similar

Is this a duplicate? [Yes] [No]
```

---

## Component Composition

**Financial data flow:**

```
Primitives (buttons, inputs, badges)
    ↓
Financial Components (amount, GL selector, entity badge)
    ↓
Patterns (journal form, transaction table, invoice list)
    ↓
Screens (transactions, reconciliation, dashboards)
```

---

## Accessibility

All financial components:
- ✓ Display amounts as text (not images)
- ✓ Use semantic HTML for numbers
- ✓ Provide context (currency, sign, entity)
- ✓ Support screen reader announcements for changes
- ✓ Keyboard navigation for all interactions
- ✓ Clear error messages for validation

---

## Dark Mode

Financial component-specific notes:
- Monospace amounts: Use light gray text (not pure white)
- Amount colors: Ensure sufficient contrast for green/red
- Backgrounds: Elevated cards contrast from page background
- Badges: Accent colors may need adjustment for visibility

---

## See Also

- [`primitives.md`](./primitives.md) - Button and input primitives
- [`data-display.md`](./data-display.md) - Table and list components
- [`../02-patterns/tables-data.md`](../02-patterns/tables-data.md) - Transaction table pattern
- [`../02-patterns/financial-workflows.md`](../02-patterns/financial-workflows.md) - Journal entry and reconciliation workflows
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Financial semantic colors
