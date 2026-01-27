# Section Components Export Package

This directory contains exported section components from the Design OS application, ready for integration into your product codebase.

## Directory Structure

```
sections/
├── accounts-overview/
│   └── components/           ✅ 7 components (100% complete)
├── bank-reconciliation/
│   └── components/           ✅ 7 components (100% complete)
├── transactions-bookkeeping/
│   └── components/           ⏳ 3/10 components (30% complete)
├── invoicing-bills/
│   └── components/           ❌ Not started
├── analytics/
│   └── components/           ❌ Not started
├── planning/
│   └── components/           ❌ Not started
├── ai-financial-advisor/
│   └── components/           ❌ Not started
├── COPY-COMPLETION-STATUS.md
├── IMPORT-TRANSFORMATION-GUIDE.md
└── README.md (this file)
```

## What's Included

### Completed Sections

#### 1. accounts-overview ✅
Financial command center showing net worth, cash position, and account lists.

**Components:**
- `AccountsOverview.tsx` - Main container component
- `NetWorthCard.tsx` - Net worth display with trend
- `CashPositionCard.tsx` - Cash vs debt summary
- `InsightCard.tsx` - AI insight display
- `AccountsList.tsx` - Collapsible account groups
- `AccountRow.tsx` - Individual account row with spotlight effect
- `index.ts` - Component exports

#### 2. bank-reconciliation ✅
Reconciliation workspace for matching bank feeds to transactions.

**Components:**
- `BankReconciliation.tsx` - Main reconciliation interface
- `ReconciliationStatusCard.tsx` - Period lock/unlock controls
- `FilterChips.tsx` - Status filter chips
- `BulkActionToolbar.tsx` - Bulk action controls
- `FeedTransactionTable.tsx` - Feed transaction table
- `FeedTransactionRow.tsx` - Individual feed transaction row
- `index.ts` - Component exports

#### 3. transactions-bookkeeping ⏳ (Partial)
Transaction categorization and bookkeeping interface.

**Completed Components:**
- `FilterBar.tsx` - Search and filter controls
- `BulkActionToolbar.tsx` - Bulk categorization toolbar
- `TransactionRow.tsx` - Transaction row with AI suggestions

**Remaining Components:**
- TransactionList.tsx
- TransactionsBookkeeping.tsx (main container)
- JournalEntryList.tsx
- JournalEntryRow.tsx
- ChartOfAccounts.tsx
- GLAccountRow.tsx
- index.ts

## Import Transformations Applied

All components have been transformed for standalone use:

### Before (Design OS paths):
```typescript
import type { Account } from '@/../product/sections/accounts-overview/types'
import { useSpotlight } from '@/hooks/useSpotlight'
```

### After (Export package paths):
```typescript
import type { Account } from '../types'
import { useSpotlight } from '../../shared/hooks/useSpotlight'
```

## Shared Resources

### useSpotlight Hook
Located at: `../shared/hooks/useSpotlight.ts`

An interactive spotlight effect hook used by row components. Import as:
```typescript
import { useSpotlight } from '../../shared/hooks/useSpotlight'
```

**Usage:**
```typescript
const { elementRef, spotlightStyle } = useSpotlight()

return (
  <div ref={elementRef} style={spotlightStyle}>
    {/* content */}
  </div>
)
```

## Component Dependencies

### External Dependencies
All components use these external packages:
- `react` - Core React library
- `lucide-react` - Icon library

### Internal Dependencies
Each component requires:
- **Types:** Located at `../types.ts` for each section
- **Sample Data:** Located at `../data.json` for each section (for preview/testing)

## Integration Guide

### 1. Install Dependencies
```bash
npm install react lucide-react
# or
yarn add react lucide-react
```

### 2. Import Components
```typescript
// Import main component
import { AccountsOverview } from './sections/accounts-overview/components'

// Or import specific components
import {
  AccountsList,
  NetWorthCard,
  CashPositionCard
} from './sections/accounts-overview/components'
```

### 3. Provide Props
All components accept data via props. Check the types file for each section to see required props.

```typescript
import type { AccountsOverviewProps } from './sections/accounts-overview/types'

function MyPage() {
  const data: AccountsOverviewProps = {
    accounts: [...],
    entities: [...],
    // ... other props
  }

  return <AccountsOverview {...data} />
}
```

### 4. Add Callbacks
Components emit events via callback props:

```typescript
<AccountsOverview
  accounts={accounts}
  onAccountClick={(id) => navigate(`/accounts/${id}`)}
  onEntityChange={(id) => setSelectedEntity(id)}
  // ... other callbacks
/>
```

## Design Tokens

The exported components use Tailwind CSS with these design tokens:

### Colors
- **Primary:** orange (actions, accents)
- **Secondary:** violet (suggestions, transfers)
- **Neutral:** slate (backgrounds, text)
- **Success:** emerald
- **Warning:** amber
- **Error:** red

### Typography
Components use CSS custom properties for fonts:
- `--font-heading` - Newsreader
- `--font-body` - Manrope
- `--font-mono` - JetBrains Mono

Define these in your root CSS:
```css
:root {
  --font-heading: 'Your Heading Font', serif;
  --font-body: 'Your Body Font', sans-serif;
  --font-mono: 'Your Mono Font', monospace;
}
```

Or use the fonts from the design system:
```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap');
```

## Testing

Each section includes sample data at `../data.json`. Use this for:
- Component preview
- Unit testing
- Storybook stories
- Development

Example:
```typescript
import data from './sections/accounts-overview/data.json'
import { AccountsOverview } from './sections/accounts-overview/components'

<AccountsOverview {...data} />
```

## Next Steps

1. **Complete remaining sections** - See COPY-COMPLETION-STATUS.md
2. **Add tests** - Each section needs tests.md (TDD specifications)
3. **Create stories** - Add Storybook stories for each component
4. **Document callbacks** - Document all callback prop behaviors
5. **Add error handling** - Add error boundaries and fallbacks

## Support

For questions about:
- **Component structure** → See IMPORT-TRANSFORMATION-GUIDE.md
- **Completion status** → See COPY-COMPLETION-STATUS.md
- **Design tokens** → See ../design-system/
- **Data models** → See ../data-model/
- **Implementation instructions** → See ../instructions/

## License

These components are part of your product export package from Design OS.
