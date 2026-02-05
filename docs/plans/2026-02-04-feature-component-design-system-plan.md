# Component Design System Implementation Plan

**Date:** 2026-02-04
**Type:** feature
**Status:** Planning
**Related:** `docs/design-system/01-components/`, `packages/ui/`

---

## Summary

Complete design specifications for all Akount UI components, organized hierarchically from primitives to complex financial and AI components. This plan provides exhaustive context for agents to produce correct, brand-aligned output.

---

## Brand Context (CRITICAL FOR AGENTS)

### Visual Direction

**Skeuomorphism + Glassmorphism Blend:**
- **Physical depth**: Cards feel tangible with realistic shadows
- **Frosted glass**: Semi-transparent backgrounds with blur effects
- **Material surfaces**: Substantial, weighted, valuable-feeling
- **Light gradients**: Sophisticated, not playful

**Brand Personality:**
```
Bloomberg Terminal × Notion clarity × Apple-level calm
```

**Emotional Goals:**
- Intelligent (not cute)
- Trustworthy (not flashy)
- Global (not localized)
- Calm under complexity (not overwhelming)

---

## Design Tokens Reference

### Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--ak-action-primary` | `#f97316` | Primary CTAs, brand highlights |
| `--ak-action-secondary` | `#8b5cf6` | AI features, secondary actions |
| `--ak-finance-income` | `#10b981` | Positive cash, money in (GREEN) |
| `--ak-finance-expense` | `#ef4444` | Money out, expenses (RED) |
| `--ak-finance-transfer` | `#3b82f6` | Internal movements (BLUE) |
| `--ak-finance-liability` | `#f59e0b` | Debt, loans, payables (AMBER) |
| `--ak-finance-equity` | `#14b8a6` | Owner's equity, assets (TEAL) |
| `--ak-ai-primary` | `#8b5cf6` | AI insight cards, highlights |
| `--ak-ai-bg` | `rgba(139,92,246,0.10)` | AI backgrounds |
| `--ak-ai-border` | `rgba(139,92,246,0.35)` | AI borders |

### Glassmorphism Values

```css
/* Light mode glass */
--ak-glass-light: rgba(255, 255, 255, 0.7);
--ak-glass-medium: rgba(255, 255, 255, 0.5);
--ak-glass-strong: rgba(255, 255, 255, 0.3);

/* Dark mode glass */
--ak-glass-dark-light: rgba(15, 23, 42, 0.4);
--ak-glass-dark-medium: rgba(15, 23, 42, 0.6);
--ak-glass-dark-strong: rgba(15, 23, 42, 0.8);

/* Glass effect */
backdrop-filter: blur(10px);
```

### Shadow System (Skeuomorphism)

```css
--ak-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--ak-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.08);
--ak-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--ak-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.12);
--ak-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
--ak-shadow-pressed: 0 1px 2px rgba(0, 0, 0, 0.03);
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Newsreader | 48px | Bold |
| H2 | Newsreader | 36px | Bold |
| H3 | Newsreader | 28px | Bold |
| H4 | Newsreader | 24px | Semibold |
| H5 | Newsreader | 20px | Semibold |
| Body | Manrope | 16px | Regular |
| Small | Manrope | 14px | Regular |
| Tiny | Manrope | 12px | Regular |
| **Money/Data** | **JetBrains Mono** | 14px | Regular |

**CRITICAL RULE:** All monetary values MUST use JetBrains Mono (monospace).

### Spacing Scale (8px baseline)

| Token | Size |
|-------|------|
| space-xs | 4px |
| space-sm | 8px |
| space-md | 16px |
| space-lg | 24px |
| space-xl | 32px |
| space-2xl | 48px |

### Border Radius

| Token | Size |
|-------|------|
| radius-sm | 6px |
| radius-md | 10px |
| radius-lg | 14px |
| radius-xl | 18px |

### Motion

| Duration | Use |
|----------|-----|
| 120ms | Micro-interactions (hover, focus) |
| 180ms | Standard transitions (modal opens) |
| 240ms | Emphasis, multi-step animations |

**Easing:** `cubic-bezier(0.2, 0, 0, 1)` (standard), `cubic-bezier(0.2, 0, 0, 1.2)` (emphasized)

---

## Component Specifications

### Category 1: Primitives

#### 1.1 Button

**Variants:**

| Variant | Background | Text | Border | Use |
|---------|------------|------|--------|-----|
| Primary | `--ak-orange-500` | White | None | Main CTAs |
| Secondary | `--ak-violet-100` | `--ak-violet-700` | None | Alternative actions |
| Ghost | Transparent | `--foreground` | 1px `--ak-border` | Tertiary actions |
| Danger | `#ef4444` | White | None | Destructive actions |

**States:**

```
Normal → Hover → Pressed → Disabled
  ↓        ↓        ↓         ↓
Default  Lighter   Darker    Grayed
shadow   shadow    shadow    no shadow
         +scale    -scale    opacity 0.5
```

**Pressed State (Skeuomorphic):**
- Transform: `scale(0.98)`
- Shadow: `--ak-shadow-pressed`
- Duration: 120ms

**Sizes:**

| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px | 8px 12px | 14px |
| md | 40px | 10px 16px | 16px |
| lg | 48px | 12px 20px | 18px |

**Props:**
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
}
```

**Accessibility:**
- Focus: 2px ring in brand color
- Keyboard: Tab, Enter/Space to activate
- Min touch target: 44px
- aria-disabled when loading

---

#### 1.2 Input

**Types:** text, number, email, password, search

**Anatomy:**
```
┌─────────────────────────────────────┐
│ Label *                             │
├─────────────────────────────────────┤
│ [Icon] Placeholder text...          │
├─────────────────────────────────────┤
│ Helper text or error message        │
└─────────────────────────────────────┘
```

**States:**

| State | Border | Background | Text |
|-------|--------|------------|------|
| Default | `--ak-border` | `--ak-bg-primary` | `--ak-text-muted` |
| Focused | `--ak-action-primary` | `--ak-bg-primary` | `--ak-text-primary` |
| Filled | `--ak-border` | `--ak-bg-primary` | `--ak-text-primary` |
| Error | `#ef4444` | `--ak-bg-primary` | `--ak-text-primary` |
| Disabled | `--ak-border-muted` | `--ak-bg-secondary` | `--ak-text-muted` |

**Styling:**
```css
.input {
  height: 40px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--ak-border);
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  transition: border-color 120ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--ak-action-primary);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
}
```

**Props:**
```typescript
interface InputProps {
  type: 'text' | 'number' | 'email' | 'password' | 'search';
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}
```

---

#### 1.3 Textarea

**Features:**
- Auto-expand (up to maxRows)
- Character counter (optional)
- Resize handle (vertical only)

**Styling:**
```css
.textarea {
  min-height: 80px;
  max-height: 240px;
  padding: 12px;
  border-radius: var(--radius-md);
  resize: vertical;
  font-family: 'Manrope', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}
```

---

#### 1.4 Select/Dropdown

**Anatomy:**
```
┌─────────────────────────────────────┐
│ Label                               │
├─────────────────────────────────────┤
│ Selected value                    ▼ │
└─────────────────────────────────────┘
         ↓ (when open)
┌─────────────────────────────────────┐
│ [Search...]                         │
├─────────────────────────────────────┤
│ ▶ Option 1                          │
│   Option 2 (selected) ✓             │
│   Option 3                          │
│ ▶ Group 2                           │
│   Option 4                          │
└─────────────────────────────────────┘
```

**Features:**
- Keyboard navigation (Arrow keys, Enter, Escape)
- Search/filter (type to filter)
- Grouped options
- Multi-select variant
- Option icons

**Dropdown Panel Styling (Glassmorphism):**
```css
.dropdown-panel {
  background: var(--ak-glass-medium);
  backdrop-filter: blur(10px);
  border: 1px solid var(--ak-glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--ak-shadow-lg);
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-option {
  padding: 10px 12px;
  cursor: pointer;
  transition: background 120ms ease;
}

.dropdown-option:hover {
  background: rgba(249, 115, 22, 0.08);
}

.dropdown-option.selected {
  background: rgba(249, 115, 22, 0.12);
  font-weight: 600;
}
```

---

#### 1.5 Badge

**Status Badges:**

| Badge | Background | Text | Icon | Use |
|-------|------------|------|------|-----|
| Reconciled | `#10b981/10%` | `#10b981` | ✓ | Bank matched |
| AI Categorized | `#8b5cf6/10%` | `#8b5cf6` | ✨ | AI suggestion applied |
| Review Needed | `#f59e0b/10%` | `#f59e0b` | ⚠ | Needs attention |
| Locked | `slate-200` | `slate-600` | 🔒 | Fiscal period closed |
| Error | `#ef4444/10%` | `#ef4444` | ✕ | Validation error |

**Styling:**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 9999px; /* pill shape */
  font-family: 'Manrope', sans-serif;
  font-size: 12px;
  font-weight: 500;
}
```

**Props:**
```typescript
interface BadgeProps {
  variant: 'reconciled' | 'ai' | 'review' | 'locked' | 'error' | 'default';
  icon?: ReactNode;
  children: ReactNode;
}
```

---

#### 1.6 Chip

**Filter Chip:**
```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--ak-bg-secondary);
  border: 1px solid var(--ak-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
}

.filter-chip:hover {
  background: var(--ak-bg-hover);
}

.filter-chip.active {
  background: var(--ak-orange-100);
  border-color: var(--ak-orange-300);
  color: var(--ak-orange-700);
}
```

**Suggestion Chip (AI):**
```css
.suggestion-chip {
  background: var(--ak-ai-bg);
  border: 1px solid var(--ak-ai-border);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}
```

---

### Category 2: Financial Components

#### 2.1 MoneyAmount (Read-Only Display)

**CRITICAL: Always monospace, always explicit sign, always currency code**

**Anatomy:**
```
–$1,234.56 CAD
↑ ↑        ↑
│ │        └─ 3-letter currency code
│ └─ Amount with commas
└─ Explicit sign (+ or –)
```

**Color Coding:**

| Direction | Color | Token |
|-----------|-------|-------|
| Income/Positive | Green | `--ak-finance-income` |
| Expense/Negative | Red | `--ak-finance-expense` |
| Transfer | Slate/Blue | `--ak-finance-transfer` |

**Styling:**
```css
.money-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-feature-settings: 'tnum' 1; /* tabular numbers */
  white-space: nowrap;
}

.money-amount.positive {
  color: var(--ak-finance-income);
}

.money-amount.negative {
  color: var(--ak-finance-expense);
}

.money-amount.neutral {
  color: var(--ak-text-primary);
}
```

**With FX Conversion:**
```
–$1,234.56 CAD
≈ –$935.42 USD
```

**Props:**
```typescript
interface MoneyAmountProps {
  amount: number;          // In cents (integer)
  currency: string;        // 3-letter code
  sign: 'positive' | 'negative' | 'neutral';
  showFX?: boolean;
  fxAmount?: number;
  fxCurrency?: string;
  fxRate?: number;
  size?: 'sm' | 'md' | 'lg';
}
```

**Size Variants:**

| Size | Font Size | Use |
|------|-----------|-----|
| sm | 12px | Table cells, compact views |
| md | 14px | Standard displays |
| lg | 20px | KPI cards, headers |

---

#### 2.2 MoneyInput (Editable)

**Anatomy:**
```
┌─────────────────────────────────────┐
│ Amount *                            │
├─────────────────────────────────────┤
│ CAD  │ –$1,234.56                   │
├─────────────────────────────────────┤
│ ≈ –$935.42 USD (1 CAD = 0.758 USD) │
└─────────────────────────────────────┘
```

**Features:**
- Currency selector (if multi-currency)
- Auto-formatting on blur
- Real-time FX preview
- Sign toggle (+/–)
- Numeric-only input

**Validation:**
- Rejects non-numeric characters
- Limits decimal places (2 for most currencies)
- Warns on unusually large amounts

**Props:**
```typescript
interface MoneyInputProps {
  value: number;           // In cents
  currency: string;
  onChange: (value: number) => void;
  onCurrencyChange?: (currency: string) => void;
  allowNegative?: boolean;
  showFXPreview?: boolean;
  fxTargetCurrency?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}
```

---

#### 2.3 EntityBadge

**Anatomy:**
```
🇨🇦 Canadian Corp
```

**Tooltip on Hover:**
```
┌─────────────────────────────────┐
│ Canadian Corp                   │
│ Legal: Acme Inc. (Canada) Ltd.  │
│ Tax ID: 12-3456789              │
│ Jurisdiction: Ontario, Canada   │
│ Currency: CAD                   │
└─────────────────────────────────┘
```

**Styling:**
```css
.entity-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--ak-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.entity-badge:hover {
  background: var(--ak-bg-hover);
}

/* Optional: Entity-specific colors */
.entity-badge[data-color="blue"] {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
}
```

**Props:**
```typescript
interface EntityBadgeProps {
  entity: {
    id: string;
    shortName: string;        // Max 20 chars
    legalName: string;
    taxId?: string;
    jurisdiction: string;
    country: string;          // ISO code for flag
    currency: string;
    color?: string;
  };
  onClick?: () => void;
  showTooltip?: boolean;
}
```

---

#### 2.4 GLAccountSelector

**Anatomy:**
```
┌─────────────────────────────────────┐
│ Category / GL Account               │
├─────────────────────────────────────┤
│ Cloud Services                    ▼ │
└─────────────────────────────────────┘
         ↓ (when open)
┌─────────────────────────────────────┐
│ [Search accounts...]                │
├─────────────────────────────────────┤
│ ▼ Assets                            │
│   1000 · Cash                       │
│   1200 · Accounts Receivable        │
│ ▼ Expenses                          │
│   5100 · Cloud Services ✓           │
│   5200 · Subscriptions              │
└─────────────────────────────────────┘
```

**Features:**
- Grouped by account class
- Show account code + name
- Search by code or name
- Balance preview (optional)
- Recent accounts first

**Account Classes:**

| Class | Color | Range |
|-------|-------|-------|
| Assets | Blue | 1000-1999 |
| Liabilities | Amber | 2000-2999 |
| Equity | Teal | 3000-3999 |
| Revenue | Green | 4000-4999 |
| Expenses | Red | 5000-5999 |

**Props:**
```typescript
interface GLAccountSelectorProps {
  value: string | null;
  onChange: (accountId: string) => void;
  accounts: GLAccount[];
  showBalance?: boolean;
  showRecent?: boolean;
  allowUncategorized?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
}

interface GLAccount {
  id: string;
  code: string;           // e.g., "5100"
  name: string;           // e.g., "Cloud Services"
  class: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance?: number;
  parentId?: string;
}
```

---

#### 2.5 TransactionRow

**Anatomy (Table Row):**
```
☐ │ 2025-12-15 │ Amazon AWS │ 🇨🇦 │ Chase │ Cloud Services │ AWS │ –$1,200.00 │ CAD │ ✓
```

**Columns:**

| Column | Width | Content | Align |
|--------|-------|---------|-------|
| Checkbox | 40px | Bulk select | Center |
| Date | 100px | YYYY-MM-DD | Left |
| Description | Flex | Primary text | Left |
| Entity | 80px | EntityBadge | Left |
| Account | 120px | Account name | Left |
| Category | 140px | Editable dropdown | Left |
| Counterparty | 100px | Name/logo | Left |
| Amount | 120px | MoneyAmount | Right |
| Currency | 50px | 3-letter code | Center |
| Status | 60px | Badge | Center |

**Row States:**

| State | Background | Indicator |
|-------|------------|-----------|
| Default | Transparent | None |
| Hover | `--ak-bg-hover` | None |
| Selected | `--ak-orange-50` | Checkbox filled |
| AI Categorized | Default | Violet dot before category |
| Reconciled | Default | Green ✓ badge |
| Locked | `slate-50` | Lock icon, disabled |
| Error | `red-50` | Red border |

**Styling:**
```css
.transaction-row {
  display: grid;
  grid-template-columns: 40px 100px 1fr 80px 120px 140px 100px 120px 50px 60px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--ak-border-subtle);
  transition: background 120ms ease;
}

.transaction-row:hover {
  background: var(--ak-bg-hover);
}

.transaction-row .amount {
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
}
```

**Props:**
```typescript
interface TransactionRowProps {
  transaction: {
    id: string;
    date: string;
    description: string;
    entity: Entity;
    account: Account;
    category?: Category;
    counterparty?: string;
    amount: number;
    currency: string;
    status: 'pending' | 'reconciled' | 'locked' | 'error';
    aiCategorized?: boolean;
  };
  selected?: boolean;
  onSelect?: (id: string) => void;
  onCategoryChange?: (categoryId: string) => void;
  onClick?: () => void;
}
```

---

#### 2.6 JournalEntryPreview

**Anatomy:**
```
┌─────────────────────────────────────────┐
│ Journal Entry Preview                   │
├─────────────────────────────────────────┤
│ Entity:  🇨🇦 Canadian Corp              │
│ Period:  Q4 2025 (Open)                 │
│ Date:    2025-12-31                     │
├─────────────────────────────────────────┤
│ ACCOUNT                    DR        CR │
│ ─────────────────────────────────────── │
│ 5100 · Cloud Services   $1,200.00       │
│ 1000 · Chase Account              $1,200.00 │
│ ─────────────────────────────────────── │
│ TOTAL                   $1,200.00 $1,200.00 │
├─────────────────────────────────────────┤
│ Status: ✓ Balanced                      │
│ Audit: Sarah Chen, Dec 31 2025 14:23    │
├─────────────────────────────────────────┤
│      [Cancel]  [Save Draft]  [Post]     │
└─────────────────────────────────────────┘
```

**Balance Indicator:**

| State | Color | Icon | Message |
|-------|-------|------|---------|
| Balanced | Green | ✓ | "Balanced" |
| Unbalanced | Red | ✕ | "Difference: –$100.00" |

**Line Items:**
- Account code + name (left)
- Debit amount (monospace, right)
- Credit amount (monospace, right)
- Totals row (bold, separator above)

**Props:**
```typescript
interface JournalEntryPreviewProps {
  entry: {
    entity: Entity;
    period: FiscalPeriod;
    date: string;
    lines: JournalLine[];
    status: 'draft' | 'balanced' | 'unbalanced';
    createdBy?: User;
    createdAt?: string;
  };
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onPost?: () => void;
}

interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit?: number;
  credit?: number;
}
```

---

#### 2.7 KPICard

**Anatomy:**
```
┌────────────────────────────────┐
│ Revenue                        │ ← Label (H5, Newsreader)
│ $45,200 CAD                    │ ← Value (lg, monospace)
│ ↑ +$5,200 (+13%)              │ ← Trend (green/red)
│ vs. last month                 │ ← Context (small, muted)
│ ────────────────────           │ ← Optional sparkline
└────────────────────────────────┘
```

**Trend Indicators:**

| Direction | Icon | Color |
|-----------|------|-------|
| Up (positive context) | ↑ | Green |
| Down (positive context) | ↓ | Red |
| Up (negative context) | ↑ | Red |
| Down (negative context) | ↓ | Green |
| Neutral | → | Slate |

**Card Styling (Glassmorphism):**
```css
.kpi-card {
  background: var(--ak-glass-medium);
  backdrop-filter: blur(10px);
  border: 1px solid var(--ak-glass-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--ak-shadow-md);
}

.kpi-card .label {
  font-family: 'Newsreader', serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--ak-text-secondary);
  margin-bottom: 8px;
}

.kpi-card .value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 600;
  color: var(--ak-text-primary);
}

.kpi-card .trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  margin-top: 8px;
}

.kpi-card .trend.positive {
  color: var(--ak-finance-income);
}

.kpi-card .trend.negative {
  color: var(--ak-finance-expense);
}
```

**Props:**
```typescript
interface KPICardProps {
  label: string;
  value: number;
  currency?: string;
  previousValue?: number;
  trendLabel?: string;        // "vs. last month"
  trendDirection?: 'up' | 'down' | 'neutral';
  trendContext?: 'positive' | 'negative';  // Is up good or bad?
  sparklineData?: number[];
}
```

---

#### 2.8 AccountCard

**Anatomy:**
```
┌────────────────────────────────────┐
│ Chase Checking              ▸      │ ← Name + expand
│ USD                                │ ← Currency
│                                    │
│ $12,543.89                         │ ← Balance (monospace)
│ ↑ +$2,340 this month              │ ← Trend
│                                    │
│ Last synced: 2 min ago      [↻]   │ ← Status + refresh
└────────────────────────────────────┘
```

**Props:**
```typescript
interface AccountCardProps {
  account: {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment';
    institution?: string;
    currency: string;
    balance: number;
    lastSynced?: string;
  };
  trend?: {
    amount: number;
    period: string;
  };
  onRefresh?: () => void;
  onClick?: () => void;
}
```

---

#### 2.9 BudgetCard

**Anatomy:**
```
┌────────────────────────────────────┐
│ Marketing Budget (Q4)              │ ← Label
├────────────────────────────────────┤
│ Budget:    $5,000.00               │ ← Monospace
│ Spent:     $3,200.00 (64%)         │
│ Remaining: $1,800.00               │
│                                    │
│ ████████░░░░░░░░░░░░░░ 64%        │ ← Progress bar
│                                    │
│ [View transactions]                │
└────────────────────────────────────┘
```

**Progress Bar Colors:**

| Percentage | Color | State |
|------------|-------|-------|
| 0-70% | Green | On track |
| 70-90% | Amber | Approaching |
| 90%+ | Red | Over budget |

---

### Category 3: AI Components

#### 3.1 InsightCard

**Anatomy:**
```
┌────────────────────────────────────────┐
│ ✨ 💡 Tax Optimization                 │ ← AI icon + type icon + title
├────────────────────────────────────────┤
│ You may deduct $48,000 for home        │
│ office expenses.                       │ ← Summary
│                                        │
│ 🇨🇦 Canadian Corp · Q4 2025           │ ← Context strip
│ Impact: +$12,500 tax savings           │
│ Confidence: High (87%)                 │ ← ConfidenceBadge
│                                        │
│              [Review]  [Ignore]        │ ← Actions
└────────────────────────────────────────┘
```

**Insight Types:**

| Type | Icon | Border Color | Use |
|------|------|--------------|-----|
| Optimization | 💡 | Violet | Tax, cost savings |
| Alert | ⚠ | Amber | Deadlines, risks |
| Observation | 📊 | Slate | Trends, patterns |
| Confirmation | ✓ | Green | "Good job" |

**Card Styling:**
```css
.insight-card {
  background: var(--ak-ai-bg);
  border: 1px solid var(--ak-ai-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--ak-shadow-sm);
}

.insight-card .header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.insight-card .ai-icon {
  color: var(--ak-ai-primary);
}

.insight-card .context-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ak-text-muted);
  margin: 12px 0;
}
```

**Props:**
```typescript
interface InsightCardProps {
  insight: {
    id: string;
    type: 'optimization' | 'alert' | 'observation' | 'confirmation';
    title: string;
    summary: string;
    entity?: Entity;
    period?: string;
    impact?: string;
    confidence: number;       // 0-100
    reasoning?: string[];
    sources?: string[];
  };
  onReview?: () => void;
  onIgnore?: () => void;
  onApply?: () => void;
}
```

---

#### 3.2 ConfidenceBadge

**Anatomy:**
```
████████░░ 87%
High confidence
```

**Thresholds:**

| Level | Range | Display | Color |
|-------|-------|---------|-------|
| High | 75-100% | Green bar | `--ak-finance-income` |
| Medium | 50-74% | Amber bar | `--ak-finance-liability` |
| Low | 0-49% | Red bar | `--ak-finance-expense` |

**Variants:**
- **Full:** Bar + percentage + label
- **Compact:** Bar + percentage only
- **Text:** "87% confident"

**Props:**
```typescript
interface ConfidenceBadgeProps {
  confidence: number;         // 0-100
  variant?: 'full' | 'compact' | 'text';
  showLabel?: boolean;
}
```

---

#### 3.3 SuggestionChip

**Anatomy:**
```
Category: [Marketing ▼]
          ↓
┌─────────────────────────────────┐
│ ✨ AI Suggests: Cloud Services  │
│    87% confident                │
│    [Apply]  [Ignore]            │
└─────────────────────────────────┘
```

**Behavior:**
- Shows when confidence >75%
- Apply → Updates field, dismisses
- Ignore → Dismisses, records feedback
- Auto-dismiss if user types manually

**Props:**
```typescript
interface SuggestionChipProps {
  currentValue?: string;
  suggestedValue: string;
  confidence: number;
  reasoning?: string;
  onApply: () => void;
  onIgnore: () => void;
}
```

---

#### 3.4 AIPanel (Side Panel)

**Anatomy:**
```
┌─────────────────────────────────┐
│ ✨ Akount Advisor               │
│ Watching your finances          │
├─────────────────────────────────┤
│                                 │
│ Attention Required (3)          │
│ ┌─────────────────────────────┐ │
│ │ ⚠ New policy affects...    │ │
│ │ [Review]                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Optimizations (2)               │
│ [InsightCard]                   │
│ [InsightCard]                   │
│                                 │
│ Observations (1)                │
│ [InsightCard]                   │
│                                 │
│ [View History]                  │
└─────────────────────────────────┘
```

**Layout:**
- Width: 360px
- Position: Slides in from right
- Background: Glassmorphism panel
- Shadow: `--ak-shadow-xl`

**Props:**
```typescript
interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  insights: Insight[];
  onInsightClick: (id: string) => void;
}
```

---

#### 3.5 CriticalAlert

**Anatomy:**
```
┌────────────────────────────────────────┐
│ ⚠ CRITICAL ALERT                       │
│                                        │
│ New US tax law affects your LLC        │
│ effective immediately.                 │
│                                        │
│ Review required before next filing     │
│ to avoid penalties.                    │
│                                        │
│     [Learn More]  [Connect CPA]        │
└────────────────────────────────────────┘
```

**When to use:**
- Tax law changes
- Hard compliance deadlines
- Material financial risk
- **NOT for normal suggestions**

**Styling:**
```css
.critical-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  border-radius: var(--radius-lg);
  padding: 20px;
}

.critical-alert .header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 12px;
}
```

---

#### 3.6 FeedbackComponent

**Anatomy:**
```
Was this helpful?

👍 Yes, this was useful
👎 No, not helpful

[Give detailed feedback]
```

**Props:**
```typescript
interface FeedbackComponentProps {
  insightId: string;
  onFeedback: (helpful: boolean, comment?: string) => void;
  showDetailedOption?: boolean;
}
```

---

### Category 4: Data Display Components

#### 4.1 Card

**Base Card (Glassmorphism):**
```css
.card {
  background: var(--ak-glass-medium);
  backdrop-filter: blur(10px);
  border: 1px solid var(--ak-glass-border);
  border-top: 1px solid var(--ak-glass-border-highlight);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--ak-shadow-md);
}

/* Elevated variant (more prominent) */
.card.elevated {
  background: var(--ak-glass-light);
  box-shadow: var(--ak-shadow-lg);
}

/* Flat variant (no glass) */
.card.flat {
  background: var(--ak-bg-primary);
  backdrop-filter: none;
  box-shadow: var(--ak-shadow-sm);
}
```

**Props:**
```typescript
interface CardProps {
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
}
```

---

#### 4.2 Table

**Anatomy:**
```
┌───────────────────────────────────────────────────┐
│ [Search...]         [Filter ▼]  [Export]  [+ New] │
├───────────────────────────────────────────────────┤
│ □  DATE       DESCRIPTION    AMOUNT       STATUS  │ ← Header (sticky)
├───────────────────────────────────────────────────┤
│ □  2025-12-15 Amazon AWS     –$1,200.00 CAD  ✓   │
│ □  2025-12-14 Stripe fees    –$45.00 CAD     ✓   │
│ □  2025-12-13 Client payment +$5,000.00 CAD  ✓   │
├───────────────────────────────────────────────────┤
│ Showing 1-10 of 234     [◀] 1 2 3 ... 24 [▶]    │ ← Pagination
└───────────────────────────────────────────────────┘
```

**Header Styling:**
```css
.table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ak-border);
}

.table th {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--ak-text-muted);
  padding: 12px 8px;
  text-align: left;
  position: sticky;
  top: 0;
  background: var(--ak-bg-primary);
}

.table td {
  padding: 12px 8px;
  border-bottom: 1px solid var(--ak-border-subtle);
}

/* Amount columns always monospace, right-aligned */
.table td.amount {
  font-family: 'JetBrains Mono', monospace;
  text-align: right;
}
```

---

#### 4.3 Empty State

**Anatomy:**
```
┌─────────────────────────────────────┐
│                                     │
│           [Illustration]            │
│                                     │
│     No transactions yet             │ ← Title (H5)
│                                     │
│   Import your first bank statement  │ ← Description
│   to see transactions here.         │
│                                     │
│        [Import Statement]           │ ← Primary CTA
│                                     │
└─────────────────────────────────────┘
```

**Props:**
```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

#### 4.4 Loading State

**Skeleton Loading:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--ak-bg-secondary) 25%,
    var(--ak-bg-hover) 50%,
    var(--ak-bg-secondary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Spinner:**
```css
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--ak-border);
  border-top-color: var(--ak-action-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

#### 4.5 Toast

**Anatomy:**
```
┌────────────────────────────────────────┐
│ ✓ Transaction saved successfully    ✕  │
└────────────────────────────────────────┘
```

**Variants:**

| Type | Icon | Background | Border |
|------|------|------------|--------|
| Success | ✓ | `green-50` | `green-200` |
| Error | ✕ | `red-50` | `red-200` |
| Warning | ⚠ | `amber-50` | `amber-200` |
| Info | ℹ | `blue-50` | `blue-200` |

**Position:** Bottom-right, stacked

**Animation:** Slide in from right, duration 180ms

---

#### 4.6 Modal

**Anatomy:**
```
┌─────────────────────────────────────────┐
│ Modal Title                          ✕  │
├─────────────────────────────────────────┤
│                                         │
│ Modal content goes here.                │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│                    [Cancel]  [Confirm]  │
└─────────────────────────────────────────┘
```

**Overlay:** `rgba(15, 23, 42, 0.5)` with blur

**Panel Styling (Glassmorphism):**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel {
  background: var(--ak-glass-light);
  backdrop-filter: blur(16px);
  border: 1px solid var(--ak-glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--ak-shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}
```

**Animation:**
- Entrance: Fade in + translateY(-20px), 180ms emphasized
- Exit: Fade out + translateY(10px), 120ms standard

---

### Category 5: Feedback Components

#### 5.1 Alert (Inline)

**Anatomy:**
```
┌─────────────────────────────────────────┐
│ ⚠ Warning title                         │
│   Description text explaining the issue │
│   and what to do about it.              │
│                        [Action]         │
└─────────────────────────────────────────┘
```

**Variants:**

| Type | Background | Border | Icon |
|------|------------|--------|------|
| Info | `blue-50` | `blue-200` | ℹ |
| Success | `green-50` | `green-200` | ✓ |
| Warning | `amber-50` | `amber-200` | ⚠ |
| Error | `red-50` | `red-200` | ✕ |

---

#### 5.2 Confirmation Dialog

**For destructive actions:**

```
┌─────────────────────────────────────────┐
│ Delete transaction?                     │
├─────────────────────────────────────────┤
│ This will permanently delete this       │
│ transaction and cannot be undone.       │
│                                         │
│ Are you sure you want to continue?      │
├─────────────────────────────────────────┤
│                    [Cancel]  [Delete]   │
└─────────────────────────────────────────┘
```

**Rules:**
- Primary button = safe action (Cancel)
- Danger button = destructive action
- Clear explanation of consequences

---

#### 5.3 Progress Indicator

**Linear:**
```
Importing transactions...
████████████░░░░░░░░░░░░ 45%
```

**Circular:**
```css
.progress-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: conic-gradient(
    var(--ak-action-primary) 45%,
    var(--ak-bg-secondary) 45%
  );
}
```

---

## Implementation Guidelines for Agents

### File Structure

```
packages/ui/src/
├── primitives/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.styles.ts
│   │   └── index.ts
│   ├── Input/
│   ├── Select/
│   ├── Badge/
│   └── Chip/
├── financial/
│   ├── MoneyAmount/
│   ├── MoneyInput/
│   ├── EntityBadge/
│   ├── GLAccountSelector/
│   ├── TransactionRow/
│   ├── JournalEntryPreview/
│   ├── KPICard/
│   ├── AccountCard/
│   └── BudgetCard/
├── ai/
│   ├── InsightCard/
│   ├── ConfidenceBadge/
│   ├── SuggestionChip/
│   ├── AIPanel/
│   ├── CriticalAlert/
│   └── FeedbackComponent/
├── data-display/
│   ├── Card/
│   ├── Table/
│   ├── EmptyState/
│   └── LoadingState/
└── feedback/
    ├── Toast/
    ├── Modal/
    ├── Alert/
    ├── ConfirmationDialog/
    └── ProgressIndicator/
```

### Required Patterns

1. **All monetary values:**
   - Font: JetBrains Mono
   - Feature: `font-feature-settings: 'tnum' 1`
   - Alignment: Right
   - Sign: Always explicit

2. **All cards:**
   - Background: Glassmorphism tokens
   - Shadow: Skeuomorphic shadow system
   - Border-radius: `--radius-lg` (14px)

3. **All interactive elements:**
   - Focus ring: 2px in brand color
   - Transition: 120ms standard easing
   - Min touch target: 44px

4. **All AI surfaces:**
   - Background: `--ak-ai-bg`
   - Border: `--ak-ai-border`
   - Icon color: `--ak-ai-primary`

### Testing Checklist

- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Mobile responsiveness (320px minimum)
- [ ] Touch targets (44px minimum)
- [ ] Focus indicators visible
- [ ] Color contrast (WCAG AA)

---

## Success Criteria

- [ ] All components follow brand guidelines exactly
- [ ] Glassmorphism + skeuomorphism blend consistent
- [ ] Financial components use monospace for all amounts
- [ ] AI components include confidence + context
- [ ] All states documented (hover, focus, active, disabled, error)
- [ ] Dark mode variants specified
- [ ] Accessibility requirements met
- [ ] Props interfaces complete with TypeScript types

---

## Open Questions

- [ ] Specific illustration style for empty states?
- [ ] Icon library to use (Lucide? Heroicons? Custom?)
- [ ] Animation library preference (Framer Motion? CSS?)

---

## Resources

- Design System Docs: `docs/design-system/`
- Design Tokens: `packages/design-tokens/src/`
- Existing Components: `packages/ui/src/`
- Color Reference: `docs/design-system/00-foundations/colors.md`
- Typography Reference: `docs/design-system/00-foundations/typography.md`

---

**Complexity:** High
**Effort:** 1-2 weeks
**Risk:** Low (well-documented specifications)
