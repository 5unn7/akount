# Transaction Screen

> **Extracted from:** `transaction-table.md` (general patterns in `02-patterns/tables-data.md`)
>
> **Last Updated:** 2026-02-04

## Overview

The Transactions screen is **the control center for financial events**. It displays all bank-originated, manually-entered, and derived transactions in a power-user-friendly table that supports:

- **Multi-entity bookkeeping** - See which entity each transaction belongs to
- **Multi-currency awareness** - View converted amounts with FX rates
- **AI categorization** - Accept or override AI suggestions
- **Bank reconciliation** - Match transactions to bank feed
- **Bulk operations** - Select multiple rows and categorize, reconcile, or split
- **Audit trail** - See who/what/when/why for every change

**Mental model:** "All my money movements, organized and explained."

---

## Screen Layout

### Header Bar

```
🔄 Transactions
[Entity Filter ▼]  [Period ▼]  [Currency: CAD ▼]  [Search]  [⚙️ Columns]
────────────────────────────────────────────────────────────────
[All] [Uncategorized] [Categorized] [Reconciled] [Exceptions] [AI Suggestions]
```

**Components:**

- Entity filter (respect multi-tenant isolation)
- Time period selector (month/quarter/year)
- Currency view toggle (native or functional currency)
- Global search (description, amount, counterparty)
- Column customizer (user-configurable columns)

---

## Main Table View

### Reference: Table Pattern

Uses the canonical data table pattern from [`02-patterns/tables-data.md`](../02-patterns/tables-data.md):

- **11-column default:** Date, Description, Entity, Account, Category, Counterparty, Amount, Currency, FX, Status
- **Row states:** AI Categorized, Reconciled, Locked, Error
- **Bulk actions:** Select ≥1 row → Floating action bar
- **Expandable rows:** Click row → Side panel with full details

**Customizations for transactions:**

- Default sort: Date (descending - newest first)
- Amount column sticky right (always visible while scrolling)
- Entity column always shown (multi-entity visibility)
- Category column is editable dropdown with AI suggestions

---

## Tabs / Views

### Tab 1: All Transactions

**Default view.** Shows every transaction regardless of state.

**Count:** Total transactions in period
**Sort:** Most recent first

### Tab 2: Uncategorized

**For review.** Transactions missing GL account mapping.

**Count:** N uncategorized
**Filter logic:** `category IS NULL OR category = "Uncategorized"`
**Action:** Click to categorize, or use bulk action to apply rule

### Tab 3: Categorized

**For verification.** All mapped transactions (manual or AI).

**Count:** N categorized
**Shows:** Category source (AI badge vs neutral for manual)

### Tab 4: Reconciled

**For assurance.** Transactions matched with bank feed.

**Count:** N reconciled / N total
**Visual:** Green checkmark on each row
**Status:** "Bank verified — all matched"

### Tab 5: Exceptions

**For attention.** Transactions needing intervention.

**Issues that appear here:**

- Duplicate detection (potential duplicates)
- FX differences (exchange rate mismatches)
- Amount mismatches (posted vs. received)
- Missing source documents
- Multi-entity violations

**Action:** Drill down to understand and resolve

### Tab 6: AI Suggestions

**For optimization.** Transactions where AI has high-confidence categorization.

**Count:** N suggestions available
**Confidence threshold:** Show ≥75% confidence only
**Action:** Review and apply suggestions in bulk

---

## Row Interactions

### Hover State

```
[☐] [Date] [Description] [Entity] [Account] [Category▾] ...
─────────────────────────────────────────────────────────────
    [Subtle highlight]

    Quick actions appear on hover:
    - [View details]
    - [Reconcile]
    - [Edit category]
    - [Split transaction]
```

### Click to Expand

Clicking anywhere in the row (except actions) opens **Transaction Detail Panel** on the right side.

No navigation. No modal. Just deepens the current view.

---

## Transaction Detail Panel

### When Expanded

```
✕ Transaction Details
────────────────────────────

Date:           2025-12-15
Description:    Amazon Web Services
Category:       Cloud Services ▾  [AI Suggests: Infrastructure] 87%
Amount:         –$1,200.00 CAD
Status:         Reconciled ✓

Linked to:      Invoice INV-0234  [View]
Source:         Bank Feed (Chase)
Counterparty:   AWS

Account:        Chase USD Checking
FX Rate:        1 USD = 1.32 CAD
Original:       –$909.09 USD

Journal Entry:
  DR Cloud Services Expense  $1,200.00
  CR Chase Account           $1,200.00

Audit Log:
  • 2025-12-15 14:23: Categorized by AI (87% confidence)
  • 2025-12-15 14:23: Matched with bank transaction
  • 2025-12-14 09:15: Imported from bank feed

Actions:
[Change Category]  [Reconcile]  [Split]  [View Journal]  [Delete]
```

### Key Sections

**1. Transaction Basics**

- Date, description, amount (monospace)
- Quick category editor with AI suggestion chip
- Status badge (reconciled, error, etc.)

**2. Context & Linking**

- Related invoice/bill if applicable
- Source (bank feed, manual entry, import)
- Counterparty name with hover details

**3. Financial Details**

- Account & account code
- Native currency + FX rate (if multi-currency)
- Original amount in source currency

**4. Journal Entry Breakdown**

- Double-entry lines (debit/credit)
- GL account mapping
- Shows exact accounting impact

**5. Audit Trail**

- Chronological history of changes
- Who made the change, when, what
- Confidence scores if AI-involved

**6. Actions**

- Change category (inline editor with suggestions)
- Reconcile/unreconcile toggle
- Split into multiple categories
- View full journal entry
- Delete (guarded with confirmation)

---

## Workflows

### Workflow 1: Categorize Uncategorized Transaction

**Current state:** Transaction with no category

**Steps:**

1. Find transaction in "Uncategorized" tab
2. Click row to open detail panel
3. Click category dropdown
4. If AI suggestion shown → [Apply] or search manually
5. Select category from chart of accounts
6. Save automatically (debounce 300ms)
7. Row updates immediately
8. System records: "Categorized by [user]" in audit log

**Bulk version:**

1. Select ≥2 rows in "Uncategorized" tab
2. Floating action bar appears: [Categorize] [Create Rule]
3. Click [Categorize]
4. Choose category or AI suggestion
5. Apply to all selected
6. Rows update instantly

### Workflow 2: Mark as Reconciled

**Current state:** Transaction not yet matched with bank

**Steps:**

1. Open transaction detail panel
2. Click [Reconcile] button
3. System matches with bank feed automatically (if match found)
4. If manual match needed → Reconciliation matcher launches
5. Row shows green checkmark when done
6. System records: "Manually reconciled by [user]"

### Workflow 3: Split Transaction

**Current state:** One transaction, multiple categories needed

**Example:** Invoice payment split between 2 projects

**Steps:**

1. Open transaction detail panel
2. Click [Split Transaction]
3. Split modal appears:

   ```
   Original: –$1,500

   Split into:
   □ $900  → Project A
   □ $600  → Project B
   ─────────────
     $1,500 ✓
   ```

4. Create separate GL lines for each split
5. Save → Creates child transactions
6. Parent row now shows "Split into 2" badge
7. Can expand to see child rows

### Workflow 4: Correct Miscategorized Transaction

**Current state:** Transaction has wrong category

**Steps:**

1. Open transaction detail panel
2. Click category dropdown
3. Select new category
4. Save (auto)
5. System shows: "Changed from [old] to [new]"
6. Old and new entries in audit log
7. If posted to GL → System may flag for reversal/correction

### Workflow 5: Investigate Duplicate

**Current state:** Transactions appear to be duplicates

**Steps:**

1. Navigate to "Exceptions" tab
2. Find pair flagged as "Potential duplicate"
3. Click to expand both rows side-by-side
4. If truly duplicate:
   - Click [Mark as duplicate]
   - Specify which is source, which is duplicate
   - System soft-deletes duplicate
   - Audit log preserves original
5. If false positive:
   - Click [Not a duplicate]
   - System learns from correction

---

## Keyboard Shortcuts

**For power users:**

| Shortcut | Action |
|----------|--------|
| `J` | Jump to next uncategorized |
| `A` | Apply AI category suggestion (if shown) |
| `C` | Open category editor |
| `R` | Toggle reconcile |
| `D` | Open detail panel |
| `S` | Split transaction |
| `↓` / `↑` | Move to next/previous row |
| `Esc` | Close detail panel |
| `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows) | Save & move to next |

**Bulk actions:**

- Click checkbox (or `Space` to toggle)
- `Cmd+A` / `Ctrl+A` → Select all visible
- Selected action buttons appear in floating bar

---

## Bulk Action Bar

Appears when ≥1 row selected:

```
3 selected                [Categorize] [Reconcile] [Split] [Create Rule] [Delete]
```

### Actions

**[Categorize]**

- Apply same category to all selected rows
- Shows AI suggestion if high confidence
- Can also choose manually
- Action: "Categorized 3 transactions"

**[Reconcile]**

- Mark all selected as reconciled
- Action: "Marked 3 as reconciled"

**[Split]**

- Only if single row selected (otherwise grayed)
- Opens split modal

**[Create Rule]**

- Generates rule from selected transactions
- Example: "All transactions from Amazon → Cloud Services"
- Applies to future matching transactions

**[Delete]**

- Guarded confirmation
- Soft delete only (preserves audit trail)
- Action: "Deleted 3 transactions"

---

## Performance Characteristics

### Large Dataset Handling

**Virtual scrolling:** Required for 1000+ rows

- Render only visible rows + buffer
- Smooth 60fps scrolling

**Pagination:** Cursor-based (after ID)

```
[Prev]  Showing 50–100 of 2,450  [Next]
```

**Lazy loading:** Details panel loads on demand

- Don't fetch until row expanded
- Cache for 5 minutes

**Debouncing:**

- Search filter: 300ms
- Category changes: Auto-save, but debounce updates
- Column resize: 200ms

**Target:** Interactive with 10K+ transactions in <500ms

---

## Responsive Behavior

### Desktop (1280px+)

- Full table with all 11 columns
- Sticky header, sticky amount column
- Horizontal scroll for overflow
- Detail panel slides from right (doesn't replace table)

### Tablet (768px–1279px)

- Essential columns only: Date, Description, Amount, Status
- Swipe left to reveal Category, Entity, FX
- Detail panel fullscreen (overlays table)
- Reduce bulk action count (show only top 3 actions)

### Mobile (<768px)

- Card-based layout instead of table
- Each row is a card:

  ```
  [Date]       [Amount: –$1,200 CAD]

  Description  [Category ▾] [Status ✓]

  [View Details]
  ```

- Tap to expand full details
- Swipe for quick actions (reconcile, split)

---

## Filtering & Search

### Column-Level Filters

**Date Range:**

- Quick options: This month, Last 30 days, This quarter, Custom range
- Respects period selector at top

**Entity Filter:**

- Dropdown of available entities
- Only shows entities user has access to
- "All entities" option for multi-entity view

**Account Filter:**

- Bank, credit card, loan, etc.
- Only shows accounts with transactions

**Category Filter:**

- Searchable dropdown of GL accounts
- "Uncategorized" pseudo-category
- Recent categories appear first

**Amount Range:**

- Input: "Between $[amount] and $[amount]"
- Quick filters: ">$1,000", "<$100"

### Search

**Global search (top right):**

- Searches description, counterparty, amount
- Real-time as you type (debounce 300ms)
- Highlights matching terms

**Advanced search** (optional button):

```
Description  [contains] [text]
Amount       [equals/between] [value]
Date         [range] [picker]
Category     [is] [dropdown]
Entity       [is] [dropdown]
Status       [is] [dropdown]

[Search] [Clear] [Save as view]
```

---

## Dark Mode

### Specific Adjustments

**Row states:**

- AI Categorized: Violet dot becomes brighter (higher contrast)
- Reconciled: Green checkmark remains green (semantic)
- Locked: Gray text becomes lighter gray
- Error: Red highlight becomes brighter red

**Amounts:**

- Monospace text color: Light gray (not black)
- Maintains contrast ratio ≥4.5:1 (WCAG AA)

**Detail panel:**

- Background elevated from page background
- Card-like appearance with subtle shadow

---

## Accessibility

**Keyboard Navigation:**

- Tab through table, arrow keys to move rows
- Enter to expand, Escape to collapse
- All actions keyboard-accessible

**Screen Readers:**

- Proper ARIA labels on all interactive elements
- Row headers announce: "[Date], [Description], [Amount], [Category], [Status]"
- State changes announced: "Marked as reconciled"
- Alerts for errors: "Duplicate detected"

**Focus Indicators:**

- Visible focus ring on all interactive elements (min 2px)
- Color: Akount brand color (not blue default)

**Color + Icons:**

- Never rely on color alone (always add icon/text)
- Status badges: Icon + text label
- Financial direction: Icon (arrow) + sign (+ or –)

**Mobile Touch:**

- Touch targets: ≥44px square
- Swipe actions clearly labeled
- Avoid hover-dependent interactions

---

## Implementation Notes

### Data Structure

```typescript
interface Transaction {
  id: string
  tenantId: string
  entityId: string
  date: Date
  description: string
  amount: number // in cents
  currency: string // CAD, USD, etc
  accountId: string
  counterpartyId?: string
  category?: string // GL account code
  status: 'draft' | 'categorized' | 'reconciled' | 'posted' | 'locked'
  aiCategoryId?: string
  aiConfidence?: number // 0-100
  sourceType: 'bank_feed' | 'manual' | 'import'
  sourceId?: string
  relatedInvoiceId?: string
  relatedBillId?: string
  auditLog: AuditEntry[]
  fxRate?: number
  originalAmount?: number
  originalCurrency?: string
}
```

### State Management

```typescript
interface TransactionState {
  filter: {
    entityId?: string
    dateRange: [Date, Date]
    category?: string
    searchTerm?: string
  }
  sort: {
    field: 'date' | 'amount' | 'category'
    direction: 'asc' | 'desc'
  }
  selectedIds: Set<string>
  expandedId?: string // Detail panel
  view: 'all' | 'uncategorized' | 'categorized' | 'reconciled' | 'exceptions' | 'suggestions'
}
```

---

---

## Planned Enhancements (From Roadmap)

### Projects / Cost Centers (HIGH Priority, 3-6 months)

**Future enhancement:** Transactions will support project-level tracking and cost allocation.

**What's planned:**

- Project-aware transactions (tag transactions with project)
- Optional allocation % across multiple projects
- Project-level reporting and profitability analysis
- Project hierarchies (parent/child projects)

**Why:** Consultants track billability by project. Founders want profitability by revenue stream. Accountants need allocation clarity.

**Expected impact:** Unlocks decision-grade reporting. "How much did we spend on this project?"

### Partial Information Handling

**Future enhancement:** Graceful handling of incomplete data without validation errors.

**What's planned:**

- Explicit "incomplete data" state (not treated as error)
- Deferred resolution flags ("come back to this later")
- AI-assisted enrichment without auto-commit
- Smart prompts for ambiguous data

**Why:** Prevents premature assumptions. Keeps data quality high without workflow friction.

### Evidence & Attachments (MEDIUM Priority, 9-12 months)

**Future enhancement:** Required attachments for audit compliance.

**What's planned:**

- Attachment requirements by transaction type
- Completeness checks before posting
- OCR with verification (not blind ingestion)
- Attachment search and retrieval

**Why:** Receipts, contracts, letters are evidence, not decoration. System should require them for audit readiness.

---

## See Also

- [`02-patterns/tables-data.md`](../02-patterns/tables-data.md) - Canonical table patterns and components
- [`02-patterns/financial-workflows.md`](../02-patterns/financial-workflows.md) - Journal entry and reconciliation workflows
- [`03-screens/reconciliation.md`](./reconciliation.md) - Dedicated reconciliation screen
- [`02-patterns/ai-interaction.md`](../02-patterns/ai-interaction.md) - AI suggestions and insight patterns
- [`00-foundations/colors.md`](../00-foundations/colors.md) - Financial semantic colors (income/expense/transfer)
- [`00-foundations/typography.md`](../00-foundations/typography.md) - Monospace font usage rules
