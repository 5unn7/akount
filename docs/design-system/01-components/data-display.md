# Data Display Components

> **Purpose:** Components for displaying financial data, lists, and structured information
>
> **Last Updated:** 2026-02-04

## Overview

Data display components present information in organized, scannable formats. They must balance:

- **Readability** - Clear hierarchy, good contrast
- **Density** - Show relevant data without overwhelming
- **Scannability** - Use visual patterns and alignment
- **Monospace numbers** - Financial data must use monospace fonts

---

## Cards

### Information Card

Container for related information:

```
┌─────────────────────────────┐
│ Title                       │
├─────────────────────────────┤
│ Content area (flexible)     │
│                             │
│ 2-3 key pieces of info      │
└─────────────────────────────┘
```

**Usage:**

- Dashboard KPI cards
- Summary information
- Grouped related data

**Variants:**

- Elevated (shadow)
- Flat (border only)
- Interactive (hover state, clickable)

### KPI Card (Special)

Financial metric display:

```
┌──────────────────────┐
│ Cash on Hand         │
│ $45,230.50 CAD       │  ← Monospace
│                      │
│ ↑ +$5,200 (↑12.9%)  │  ← Trend indicator
│ Since last month     │
└──────────────────────┘
```

**Components:**

- Label (14px, medium weight)
- Value (32px, monospace, brand color if positive)
- Trend (arrow + percentage, colored)
- Period (12px, muted)

**Colors:**

- Positive: Green (--ak-finance-income)
- Negative: Red (--ak-finance-expense)
- Neutral: Slate

---

## Tables

### Reference: Data Table Pattern

See [`../02-patterns/tables-data.md`](../02-patterns/tables-data.md) for comprehensive table specification including:

- Column anatomy (11 columns default)
- Row states (AI, reconciled, locked, error)
- Bulk actions
- Expandable details
- Virtual scrolling for large datasets

**Key principles for tables:**

- Monospace amounts (right-aligned)
- Color-coded direction (↑ green income, ↓ red expense)
- Multi-entity awareness (flag + label)
- Multi-currency handling (amount + FX rate)

---

## Lists

### Simple List

Bullet list with consistent styling:

```
• Item 1
• Item 2
• Item 3
```

- Use for sequential steps
- Unordered (•) or ordered (1, 2, 3)
- Hover: Subtle highlight optional
- Link items: Underline on hover

### Grouped List

Related items grouped with headers:

```
Recent Transactions
  • Amazon Web Services    –$1,200 CAD
  • Client Payment         +$5,000 CAD
  • Bank Fee               –$35 CAD

Pending Actions
  • 2 invoices need review
  • 1 reconciliation pending
```

- Header: Medium weight, muted color
- Items: Regular weight
- Visual separator between groups

### Selectable List

List with checkboxes or radio buttons:

```
☐ Uncategorized (5)
☑ Categorized (23)
☐ Reconciled (18)
☑ Needs review (2)
```

- Checkbox for multi-select
- Radio for single-select
- Count badges optional
- Hover: Subtle highlight

---

## Alerts & Messages

### Info Alert

General information:

```
ℹ️ Entity filter applied. Showing Canadian Corp only.
   [Clear filter]
```

- Icon: Information (ℹ️)
- Color: Blue/slate
- Action optional: Clear, Learn more

### Success Alert

Operation completed:

```
✓ Entry posted successfully
  Reference: JE-001524
```

- Icon: Checkmark (✓)
- Color: Green
- Auto-dismiss after 4 seconds (optional)

### Warning Alert

Caution required:

```
⚠ This period is locked. Changes may require approval.
  [Request exception]
```

- Icon: Warning (⚠)
- Color: Amber
- Action optional: Acknowledge, Request, Learn more

### Error Alert

Problem occurred:

```
✕ Failed to post entry
  Debit total ($1,200) ≠ Credit total ($1,100)
```

- Icon: X mark (✕)
- Color: Red
- Clear error message (not generic)
- Action: Retry, View details

### Inline Error

Within form, below field:

```
Amount
[Input field]
✕ Must be greater than $0
```

- Small red text
- Icon optional
- Specific guidance

---

## Empty States

When no data to display:

```
┌────────────────────────────┐
│                            │
│          📄                │
│  No transactions yet       │
│                            │
│  Your transactions will    │
│  appear here once you      │
│  connect a bank account.   │
│                            │
│  [Connect Bank Account]    │
└────────────────────────────┘
```

**Components:**

- Icon (large, muted)
- Heading (14px, medium)
- Description (12px, muted)
- Action button (optional)

---

## Loading States

### Skeleton Loading

Placeholder while content loads:

```
┌──────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │  ← Pulsing gray bar
│ ▒▒▒▒▒▒                │
│                      │
│ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒    │
│ ▒▒▒▒▒▒▒▒ ▒▒▒▒▒▒    │
└──────────────────────┘
```

- Pulse animation (opacity 0.5 → 1.0)
- Same shape as final content
- Load priority: Title → Data → Details

### Spinner

In-progress indicator:

```
  ↻ Loading...
```

- Center on page or inline
- Icon: Rotating spinner
- Text: "Loading..." or "Processing..."
- Do not block interaction (unless critical)

---

## Modals / Dialogs

### Modal Structure

```
┌───────────────────────────────┐
│ Title                       ✕ │  ← Close button
├───────────────────────────────┤
│ Content area                  │
│                               │
│ (form, list, confirmation)    │
├───────────────────────────────┤
│           [Cancel]  [Confirm] │  ← Action buttons
└───────────────────────────────┘
```

**Properties:**

- Width: 500px (default), 700px (large), 350px (small)
- Backdrop: Dark overlay (opacity 0.5)
- Keyboard: Escape to close, Tab cycles focus
- Focus trap: Focus stays within modal

### Confirmation Dialog

Simple yes/no:

```
┌─────────────────────────────┐
│ Delete Entry                │
├─────────────────────────────┤
│ Are you sure? This will:    │
│ • Remove from GL            │
│ • Require reversal          │
│                             │
│ Cannot be undone.           │
├─────────────────────────────┤
│        [Cancel]  [Delete]   │
└─────────────────────────────┘
```

- Destructive button (red) on right
- Clear consequence statement
- Default focus: Cancel button

---

## Tooltips

### Hover Tooltip

Additional info on hover:

```
FX Rate [?]
 └─→ Shows rate + timestamp
```

- Appear on hover (100ms delay)
- Max 2 lines of text
- Position: Above/below field
- Auto-hide: Leave after 2 seconds

### Informational

```
[?] → "Enter amount in base currency (CAD). System will convert automatically."
```

### Warning

```
[!] → "This amount exceeds monthly budget by $500"
```

---

## Accordions

Expandable sections:

```
▼ Section 1 (expanded)
  Content is visible

▶ Section 2 (collapsed)
  Content hidden
```

**Interaction:**

- Click header to toggle
- Only one open at a time (optional)
- Icon: ▼ (open) / ▶ (closed)
- Smooth animation

**Use case:**

- Multi-step workflows
- Grouped transaction details
- Report drill-down

---

## Badges & Labels

### Status Badge

Already covered in [`primitives.md`](./primitives.md)

### Category Tag

Categorical label:

```
[Marketing] [Cloud Services] [Office Supplies]
```

- Small padding
- Optional color coding
- Optional close button (removable)

### Count Badge

Numeric indicator:

```
Invoices (5)
Notifications ●3
```

- Parentheses or bullet point
- Right-aligned or overlay
- Muted color

---

## Component Composition Example

**Building a transaction row:**

```
Row
├── Checkbox (primitive)
├── Date (text)
├── Description (text, searchable)
├── Entity Badge (primitive)
├── Account name (text)
├── Category Dropdown (primitive)
├── Counterparty (text, link)
├── Amount (AmountInput primitive, monospace)
├── Currency Badge (primitive)
├── FX tooltip (primitive)
└── Status Badge (primitive)

Together: Single TableRow component
Used in: FinancialTable pattern
Used in: Transactions screen
```

---

## Accessibility

All data display components must:

- ✓ Proper heading hierarchy (H1, H2, H3)
- ✓ Alt text for icons/images
- ✓ Semantic HTML (`<table>`, `<list>`, etc.)
- ✓ ARIA live regions for dynamic content
- ✓ Color + text (never color-only)
- ✓ Sufficient contrast (4.5:1 WCAG AA)

---

## Performance

- Virtualization for large lists (1000+ items)
- Lazy-load images
- Memoize components that don't change
- Debounce search/filter (300ms)
- Cache expensive calculations

---

## See Also

- [`primitives.md`](./primitives.md) - Button, input, badge building blocks
- [`../02-patterns/tables-data.md`](../02-patterns/tables-data.md) - Complete table pattern
- [`../02-patterns/forms-input.md`](../02-patterns/forms-input.md) - Form patterns
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Color system
