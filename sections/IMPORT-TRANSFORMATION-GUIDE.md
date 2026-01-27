# Import Transformation Guide

This document describes the import path transformations needed when copying components from `src/sections/*/components/` to `product-plan/sections/*/components/`.

## Transformation Rules

### 1. Type Imports
**Original:**
```typescript
import type { Something } from '@/../product/sections/[section-name]/types'
```

**Transformed:**
```typescript
import type { Something } from '../types'
```

### 2. useSpotlight Hook
**Original:**
```typescript
import { useSpotlight } from '@/hooks/useSpotlight'
```

**Transformed:**
```typescript
// TODO: Import useSpotlight hook - either copy locally or import from shared location
// import { useSpotlight } from './useSpotlight'
```

**Note:** The useSpotlight hook should be:
- Copied to each section's components folder, OR
- Moved to a shared location like `product-plan/shared/hooks/useSpotlight.ts`

The hook is already copied to `product-plan/shell/components/useSpotlight.ts` for reference.

### 3. Relative Component Imports
**Original:**
```typescript
import { SomeComponent } from './SomeComponent'
```

**Transformed:**
```typescript
import { SomeComponent } from './SomeComponent'
```
*(No change - relative imports within the same components/ directory remain the same)*

### 4. External Dependencies
Lucide-react and React imports remain unchanged:
```typescript
import { Icon } from 'lucide-react'
import { useState } from 'react'
```

## Sections Completed

✅ **accounts-overview** - 6 components
- AccountsOverview.tsx
- NetWorthCard.tsx
- CashPositionCard.tsx
- InsightCard.tsx
- AccountsList.tsx
- AccountRow.tsx (with useSpotlight TODO comment)
- index.ts

✅ **bank-reconciliation** - 6 components
- BankReconciliation.tsx
- ReconciliationStatusCard.tsx
- FilterChips.tsx
- BulkActionToolbar.tsx
- FeedTransactionTable.tsx
- FeedTransactionRow.tsx (with useSpotlight TODO comment)
- index.ts

⏳ **transactions-bookkeeping** - Partially complete (3/9 components)
- FilterBar.tsx ✅
- BulkActionToolbar.tsx ✅
- TransactionRow.tsx ✅ (with useSpotlight TODO comment)
- TransactionList.tsx ⏳
- TransactionsBookkeeping.tsx ⏳
- JournalEntryList.tsx ⏳
- JournalEntryRow.tsx ⏳
- ChartOfAccounts.tsx ⏳
- GLAccountRow.tsx ⏳
- index.ts ⏳

## Remaining Sections

Each of these sections needs all components copied with the same transformation rules:

### invoicing-bills
Components: InvoiceRow.tsx, BillRow.tsx, InvoiceList.tsx, ClientVendorList.tsx, ProductList.tsx, BillList.tsx, index.ts

### analytics
Components: AnalyticsDashboard.tsx, CashFlowView.tsx, PLView.tsx, BalanceSheetView.tsx, index.ts

### planning
Components: BudgetsView.tsx, GoalsView.tsx, CalculatorsView.tsx, index.ts

### ai-financial-advisor
Components: InsightsFeed.tsx, RulesView.tsx, index.ts

## Implementation Approach

For each remaining component:

1. Read the source file from `src/sections/[section]/components/[Component].tsx`
2. Apply transformations:
   - Replace `@/../product/sections/[section]/types` with `../types`
   - Comment out useSpotlight imports and add TODO
   - Leave all other imports unchanged
3. Write to `product-plan/sections/[section]/components/[Component].tsx`
4. Copy index.ts file (no transformations needed)

## useSpotlight Hook Solution

### Option 1: Copy to Each Section
Copy `src/hooks/useSpotlight.ts` to each section's components folder as `useSpotlight.ts`.

### Option 2: Shared Location (Recommended)
1. Create `product-plan/shared/hooks/useSpotlight.ts`
2. Update all component imports to:
```typescript
import { useSpotlight } from '../../shared/hooks/useSpotlight'
```

### Option 3: Leave as TODOs
Keep the TODO comments and let the implementation team decide where to place the hook based on their project structure.

## Verification Checklist

For each completed section, verify:
- [ ] All .tsx files copied
- [ ] All type imports transformed to `../types`
- [ ] useSpotlight imports handled (commented or transformed)
- [ ] index.ts file copied
- [ ] No remaining `@/` imports (except noted TODOs)
- [ ] Components directory created in product-plan
