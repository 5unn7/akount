# Data Table Patterns

> **Extracted from:** `transaction-table.md`
>
> **Last Updated:** 2026-02-04

## Overview

Data tables in Akount are not generic tables. They are **financial control surfaces** that must simultaneously support:

- Multi-entity bookkeeping
- Multi-currency accuracy
- Double-entry accounting
- Bank reconciliation
- AI categorization
- Audit & compliance
- Power-user workflows

Without ever feeling heavy.

---

## Core Principles

### 1. Each Row Represents an Event

Not a "line item"—a **financial event** with semantic meaning, state, and context.

### 2. Monospace Numbers

All monetary values use monospace fonts (JetBrains Mono) for:
- Scanability
- Vertical alignment
- Trust (signals precision)

### 3. Financial Direction is Explicit

- Color coding: Green (income), Red (expense), Slate (transfer)
- Direction arrows: ↑ (inflow), ↓ (outflow)
- Sign always explicit: + or –

This eliminates ambiguity.

### 4. State Over Data

Each row has **state** (AI Categorized, Reconciled, Locked, Error) not just data. Users trust systems that show state clearly.

### 5. Multi-Entity Awareness

- Entity column always visible when >1 entity exists
- Flag + short label
- Hover → legal name + tax jurisdiction

### 6. Multi-Currency Handling

Display format:
```
–$1,200 CAD
≈ –$890 USD
```

FX rate shown on hover with timestamp. Never hide original currency.

---

## Canonical Table Anatomy

### Default Column Structure

| Column      | Purpose                 | Display Rules |
| ----------- | ----------------------- | ------------- |
| ☐           | Bulk actions (checkbox) | Sticky left   |
| Date        | Posting / transaction date | Sortable |
| Description | Human-readable context  | Full text, searchable |
| Entity      | Legal owner             | Flag + label, if multi-entity |
| Account     | Source account          | Name + code  |
| Category/GL | Accounting mapping      | Dropdowns, searchable |
| Counterparty | Client / Vendor         | Linked entity |
| Amount      | Monetary value          | Monospace, color-coded |
| Currency    | Native currency         | Code (CAD, USD, etc) |
| FX          | Converted value         | Monospace, secondary |
| Status      | Reconciled/AI/Manual    | Badge or icon |

**Columns are user-configurable**, but this is the canonical model.

---

## Row States & Visual Treatment

| State           | Visual Treatment | Use Case |
| --------------- | ---------------- | -------- |
| AI Categorized  | Violet dot       | AI suggested categorization |
| Manual          | Neutral          | User-entered |
| Reconciled      | Green check      | Matched with bank |
| Needs Review    | Amber highlight  | Attention required |
| Locked/Posted   | Gray + lock icon | Fiscal period locked |
| Error           | Red highlight    | Validation error |

---

## Key Features

### Bulk Action System

Once ≥1 row selected, a **floating action bar** appears with:
- Categorize
- Assign Entity
- Mark Reconciled
- Create Rule
- Split Transaction
- Delete (guarded)

Power users love this.

### Expandable Rows

Click row → **slide-down details panel** showing:
- Journal entry (debit / credit breakdown)
- Linked invoice / bill
- Attachments
- Audit log
- AI explanation
- FX rate details

Avoids navigation hell.

### Transfer & Split Handling

**Transfers:**
- Show paired rows (Account A → Account B)
- Visual connector line
- Marked as "Internal Transfer"

**Splits:**
- Parent transaction collapsible
- Child rows indented
- Totals always visible

### Reconciliation Mode

Table switches to **matching mode**:
- Left panel: Bank feed transactions
- Right panel: Book transactions
- Drag to match or auto-match with confidence score
- Visual indicators for matched/unmatched

This is a separate **mode**, not a different table.

---

## Visual & Interaction Rules

| Element              | Rule                   | Why |
| -------------------- | ---------------------- | --- |
| Row height           | Compact but breathable | Balance density and readability |
| Hover state          | Subtle highlight       | Soft interaction |
| Sticky header        | Yes                    | Reference while scrolling |
| Sticky amount column | Yes                    | Always visible amount |
| Pagination           | Cursor-based           | Scales better than offset |
| Virtualization       | Required               | Performance for large datasets |

**Performance is trust.** Slow tables undermine credibility.

---

## Guardrails & Safety

Before destructive actions:
- **Locked transactions** require confirmation
- **Entity mismatch** warnings
- **Fiscal period lock** enforcement

Accounting UX must prevent mistakes, not allow them.

---

## Component Decomposition

### Primitives
- `AmountCell` - Monospace, color-coded amount display
- `EntityBadge` - Flag + label with hover details
- `StatusBadge` - State indicator (reconciled, AI, error, etc)
- `FXTooltip` - Currency conversion details
- `DateCell` - Sortable, formatted date
- `CategoryCell` - Dropdown with AI suggestion

### Composites
- `TableRow` - Complete row with all columns
- `ExpandableDetailsPanel` - Slide-down context
- `BulkActionBar` - Floating action toolbar
- `AIInlineSuggestion` - Category suggestion chip
- `TransferConnector` - Visual link between paired transactions

### Modes
- **View Mode** - Read-only display
- **Edit Mode** - Inline editing, AI suggestions
- **Reconciliation Mode** - Matching interface

---

## Implementation Examples

### HTML/CSS Structure

```css
.table-container {
  display: grid;
  grid-template-columns:
    40px                    /* checkbox */
    120px                   /* date */
    1fr                     /* description */
    120px                   /* entity */
    150px                   /* account */
    150px                   /* category */
    150px                   /* counterparty */
    140px                   /* amount (sticky) */
    80px                    /* currency */
    120px                   /* FX */
    80px;                   /* status */
  gap: var(--space-sm);
  padding: var(--space-md);
}

.amount-cell {
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
  position: sticky;
  right: 0;
  background: inherit;
}

.row-state {
  display: flex;
  align-items: center;
  gap: 4px;
}

.row-state.reconciled::before {
  content: '✓';
  color: var(--ak-finance-income);
}

.row-state.ai-suggested::before {
  content: '✨';
  color: var(--ak-ai-primary);
}
```

### React Component Pattern

```tsx
export function FinancialTable({ rows, onRowSelect, onCategoryChange }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [expandedRow, setExpandedRow] = useState(null);

  return (
    <>
      <TableHeader sticky />

      <VirtualizedList
        items={rows}
        renderItem={(row) => (
          <TableRow
            row={row}
            isSelected={selectedRows.has(row.id)}
            isExpanded={expandedRow === row.id}
            onSelect={() => toggleRow(row.id)}
            onExpand={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
            onCategoryChange={(newCategory) => onCategoryChange(row.id, newCategory)}
          />
        )}
      />

      {expandedRow && (
        <RowDetailsPanel
          row={rows.find(r => r.id === expandedRow)}
          onClose={() => setExpandedRow(null)}
        />
      )}

      {selectedRows.size > 0 && (
        <BulkActionBar
          count={selectedRows.size}
          onCategorize={() => {...}}
          onReconcile={() => {...}}
          onDelete={() => {...}}
        />
      )}
    </>
  );
}

function TableRow({ row, isSelected, isExpanded, onSelect, onExpand, onCategoryChange }) {
  return (
    <div className={`table-row row-state-${row.state}`}>
      <CheckboxCell value={isSelected} onChange={onSelect} />
      <DateCell value={row.date} />
      <DescriptionCell value={row.description} onClick={onExpand} />
      <EntityBadge entity={row.entity} />
      <AccountCell value={row.account} />
      <CategoryCell
        value={row.category}
        aiSuggestion={row.aiCategory}
        onApply={(cat) => onCategoryChange(cat)}
      />
      <CounterpartyCell value={row.counterparty} />
      <AmountCell
        amount={row.amount}
        currency={row.currency}
        type={row.transactionType}
      />
      <CurrencyCell value={row.currency} />
      <FXCell amount={row.fxAmount} onHover={() => showRate(row)} />
      <StatusBadge state={row.state} />
    </div>
  );
}
```

---

## Responsive Behavior

### Desktop (1280px+)
- All columns visible
- Horizontal scroll for overflow
- Sticky header and amount column

### Tablet (768px–1279px)
- Columns: Date, Description, Amount, Status (essential only)
- Swipe to see more columns
- Expandable row for full details

### Mobile (<768px)
- Card-based layout instead of table
- Date, Amount, Description stacked
- Tap to expand full details

---

## Performance Considerations

- **Virtualization:** Required for datasets >1000 rows
- **Pagination:** Cursor-based (after ID) scales better
- **Debouncing:** For search/filter (300ms)
- **Lazy loading:** Details expand only on demand
- **Caching:** Memoize expensive components

**Target:** Interactive table with 10K+ rows in <500ms

---

## Accessibility

- **Keyboard navigation:** Tab through table, arrow keys to move
- **Screen readers:** Proper ARIA labels on all cells
- **Focus indicators:** Visible focus ring on interactive elements
- **Color:** Never color-only indicator (use icons + text)
- **Contrast:** All text meets WCAG AA standards

---

## Mental Model

This table should make users feel:

> "This is the source of truth for my financial life."

Not: "This is a spreadsheet."

---

## See Also

- [`../00-foundations/typography.md`](../00-foundations/typography.md) - Monospace usage for financial data
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Financial semantic colors
- [`../03-screens/transactions.md`](../03-screens/transactions.md) - Transaction screen using this pattern
- [`../01-components/financial-components.md`](../01-components/financial-components.md) - Reusable components
