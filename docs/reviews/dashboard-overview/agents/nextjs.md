# Next.js App Router Review: Phase 5 Report Pages

**Reviewer:** `nextjs-app-router-reviewer`
**Date:** 2026-02-17
**Branch:** `feature/phase5-reports`
**Scope:** 7 report page routes, reports API client, planning reports page (21 files)

---

## Summary

| Category | Status |
|----------|--------|
| Server/Client Boundaries | ISSUES FOUND |
| Data Fetching Patterns | MOSTLY CORRECT |
| Metadata/SEO | VERIFIED |
| Loading States | VERIFIED |
| Error Boundaries | VERIFIED |
| Design Token Compliance | MINOR ISSUES |
| Accessibility | ISSUES FOUND |
| Route Structure | VERIFIED |

**Risk Level:** MEDIUM
**Approval Status:** CHANGES REQUIRED

**Critical Findings:** 2 P0 (blocking), 4 P1 (high priority), 7 P2 (should fix)

---

## P0 Findings (Critical / Blocking)

### P0-1: Server-only module imported and called at runtime in Client Component

**File:** `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx:13,52`

**Issue:** The `'use client'` component `GLReportView` imports `getGLLedgerReport` from `@/lib/api/reports`. This function calls `apiClient` from `@/lib/api/client.ts`, which imports `auth` from `@clerk/nextjs/server` -- a server-only module. The `handleLoadMore` function on line 52 **invokes `getGLLedgerReport` at runtime** inside the client component:

```typescript
// gl-report-view.tsx line 13 ('use client' file)
import { getGLLedgerReport } from '@/lib/api/reports';

// gl-report-view.tsx line 52 (runtime call in event handler)
const more = await getGLLedgerReport({ ... }); // RUNTIME ERROR
```

The `apiClient` in `@/lib/api/client.ts` starts with:
```typescript
import { auth } from '@clerk/nextjs/server';
// NOTE: This file is SERVER-ONLY (uses @clerk/nextjs/server)
```

**Impact:** The "Load More Entries" pagination button in the General Ledger report will crash at runtime. This is a broken feature. Depending on bundler behavior, this may also cause a build error or produce a client bundle that includes server-only modules.

**Suggested fix:** Create a Server Action for client-side pagination:

```typescript
// app/(dashboard)/accounting/reports/general-ledger/actions.ts
'use server';
import { getGLLedgerReport } from '@/lib/api/reports';
import type { GLLedgerQuery, GLLedgerReport } from '@/lib/api/reports';

export async function loadMoreGLEntries(params: GLLedgerQuery): Promise<GLLedgerReport> {
    return getGLLedgerReport(params);
}
```

Then in `gl-report-view.tsx`:
```typescript
import { loadMoreGLEntries } from './actions';
// In handleLoadMore:
const more = await loadMoreGLEntries({ ... });
```

---

### P0-2: Mixed server/client concerns in single reports.ts module

**File:** `apps/web/src/lib/api/reports.ts:1-415`

**Issue:** This single file mixes three categories of exports that violate the server/client boundary:

1. **Server-only functions** (lines 243-335): `getProfitLossReport`, `getBalanceSheetReport`, `getCashFlowReport`, `getTrialBalanceReport`, `getGLLedgerReport`, `getSpendingReport`, `getRevenueReport` -- all call `apiClient` which imports `@clerk/nextjs/server`
2. **Client-only function** (lines 345-388): `downloadReport` -- accesses `window.Clerk` and `document.createElement`
3. **Universal helpers** (lines 394-414): `formatCurrency`, `formatPercentage`, `formatReportDate` -- pure functions usable anywhere

All `'use client'` view components import from this file for formatting helpers, types, and `downloadReport`. While tree-shaking should exclude unused server functions, the module graph still links server-only code into the client dependency tree. The `@/lib/api/client.ts` file itself warns: "NOTE: This file is SERVER-ONLY."

**Impact:** Build instability. Turbopack/webpack may attempt to bundle `@clerk/nextjs/server` into client bundles, causing cryptic errors. The GL report already demonstrates a concrete runtime failure (P0-1). Even for other view components that only import types and helpers, the bundler must analyze the full module to tree-shake, which can trigger server-only module detection errors.

**Suggested fix:** Split into three files:

```
apps/web/src/lib/api/reports.ts           -- Server-only API functions (add `import 'server-only'`)
apps/web/src/lib/api/reports-client.ts    -- Client-side downloadReport function
apps/web/src/lib/api/reports-types.ts     -- Shared types, formatCurrency, formatPercentage, formatReportDate
```

Update imports across all files:
- `page.tsx` files: `import { getProfitLossReport } from '@/lib/api/reports'`
- `*-view.tsx` files: `import { formatCurrency, downloadReport, type ProfitLossReport } from '@/lib/api/reports-types'` and `import { downloadReport } from '@/lib/api/reports-client'`

---

## P1 Findings (High Priority)

### P1-1: Hardcoded currency 'CAD' in PLSection and BSSection sub-components

**File:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:286,288`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx:329,331`

**Issue:** The `PLSection` and `BSSection` helper components hardcode the currency as `'CAD'` instead of using the report's `currency` field from the parent:

```typescript
// pl-report-view.tsx line 286 (inside PLSection)
<span>{formatCurrency(item.balance, 'CAD')}</span>
// pl-report-view.tsx line 288
<span className="text-muted-foreground">{formatCurrency(item.previousBalance, 'CAD')}</span>

// bs-report-view.tsx line 329 (inside BSSection)
<span>{formatCurrency(item.balance, 'CAD')}</span>
// bs-report-view.tsx line 331
<span className="text-muted-foreground">{formatCurrency(item.previousBalance, 'CAD')}</span>
```

Meanwhile, the parent components correctly use `initialData.currency` in their total lines (e.g., pl-report-view.tsx line 216, bs-report-view.tsx line 219). This means totals display in the correct currency but individual line items are always shown in CAD.

**Impact:** Incorrect currency display for non-CAD entities. Financial reporting accuracy is compromised for USD, EUR, GBP, or any other currency. This is a data correctness issue on financial reports.

**Suggested fix:** Pass `currency` as a prop to both helper components:

```typescript
function PLSection({ items, showComparison, currency }: {
    items: ReportLineItem[];
    showComparison: boolean;
    currency: string;
}) {
    // ...
    <span>{formatCurrency(item.balance, currency)}</span>
    // ...
}

// Usage:
<PLSection items={initialData.revenue.sections} showComparison={showComparison} currency={initialData.currency} />
```

Apply the same fix to `BSSection` in `bs-report-view.tsx`.

---

### P1-2: Tooltip contentStyle uses hardcoded hex fallback values

**File:** `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:191`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx:194`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx:173`

**Issue:** Recharts Tooltip `contentStyle` contains a fallback hex value `#15151F` in three files:

```typescript
contentStyle={{
    background: 'var(--color-ak-bg-2, #15151F)',  // <-- hardcoded hex fallback
    border: '1px solid var(--color-ak-border)',
    borderRadius: 8
}}
```

Per the design-aesthetic rules: "NEVER hardcode hex colors." While this is a CSS variable fallback rather than a Tailwind arbitrary value, it embeds a dark-mode-specific color. If the CSS variable is undefined (e.g., in light mode or if the token name changes), the tooltip background falls back to a dark hex color.

**Impact:** In light mode (if/when enabled), the tooltip background would fall back to `#15151F` (near-black), creating an unreadable tooltip on a light page.

**Suggested fix:** Remove the fallback. The CSS variable should always be defined:

```typescript
contentStyle={{
    background: 'var(--color-ak-bg-2)',
    border: '1px solid var(--color-ak-border)',
    borderRadius: 8
}}
```

---

### P1-3: No accessibility attributes on report tables or progress bars

**File:** `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/tb-report-view.tsx:141-183`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx:181-224`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-report-view.tsx:163-168`
**File:** `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx:218-223`

**Issue:** Multiple accessibility gaps:

1. **Tables** (Trial Balance, General Ledger): No `<caption>` element, no `aria-label` on `<table>`, no `scope` attributes on `<th>` elements. Screen readers cannot convey the table's purpose.

2. **Progress bars** (Revenue, Spending): Visual percentage bars are `<div>` elements with no ARIA attributes:
```tsx
<div className="w-full bg-ak-bg-3 rounded-full h-2">
    <div className="bg-ak-green h-2 rounded-full transition-all"
         style={{ width: `${Math.min(client.percentage, 100)}%` }} />
</div>
```
No `role="progressbar"`, no `aria-valuenow`, no `aria-label`. Screen readers will not announce these visual indicators.

3. **Zero `aria-*` attributes found** across all 21 reviewed files. A grep for `aria-|role=` returned zero results.

**Impact:** WCAG 2.1 Level A violation. Users relying on assistive technology cannot understand the financial data tables or percentage bars. Financial reports are critical documents where accessibility is particularly important.

**Suggested fix for tables:**
```tsx
<table className="w-full" aria-label="Trial Balance Report">
    <caption className="sr-only">
        Trial balance for {initialData.entityName} as of {formatReportDate(initialData.asOfDate)}
    </caption>
    <thead>
        <tr>
            <th scope="col" className="...">Code</th>
            <th scope="col" className="...">Account Name</th>
            <th scope="col" className="...">Debit</th>
            <th scope="col" className="...">Credit</th>
        </tr>
    </thead>
```

**Suggested fix for progress bars:**
```tsx
<div
    className="w-full bg-ak-bg-3 rounded-full h-2"
    role="progressbar"
    aria-valuenow={client.percentage}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={`${client.clientName}: ${formatPercentage(client.percentage)} of total revenue`}
>
    <div className="bg-ak-green h-2 rounded-full transition-all"
         style={{ width: `${Math.min(client.percentage, 100)}%` }} />
</div>
```

---

### P1-4: Silent error swallowing in GL handleLoadMore

**File:** `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx:63-64`

**Issue:** The `handleLoadMore` catch block silently discards errors with no user feedback:

```typescript
} catch {
    // Silently fail -- user can retry
}
```

The user receives no indication that loading more entries failed. There is no error state, no toast notification, and no visual change. The "Load More" button returns to its default state silently.

**Impact:** Users clicking "Load More" may see nothing happen with no explanation. For financial reports where data completeness matters, silently failing to load journal entries could lead to incomplete analysis without the user realizing data is missing.

**Suggested fix:** Add an error state:

```typescript
const [loadError, setLoadError] = useState<string | null>(null);

const handleLoadMore = async () => {
    if (!nextCursor || !initialData || isLoadingMore) return;
    setLoadError(null);
    setIsLoadingMore(true);
    try {
        const more = await loadMoreGLEntries({ ... });
        setEntries((prev) => [...prev, ...more.entries]);
        setNextCursor(more.nextCursor);
    } catch {
        setLoadError('Failed to load more entries. Please try again.');
    } finally {
        setIsLoadingMore(false);
    }
};

// In JSX, after the Load More button:
{loadError && (
    <p className="text-sm text-destructive text-center">{loadError}</p>
)}
```

---

## P2 Findings (Should Fix)

### P2-1: Array index used as key for list items across all report views

**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx:276`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx:319`
- `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/cf-report-view.tsx:175,191,221,248`
- `apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-report-view.tsx:145`
- `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx:167,205`

**Issue:** Multiple components use array index (`idx`) as the React `key` prop:

```typescript
{items.map((item, idx) => (
    <div key={idx} ...>
```

Many of these items have stable identifiers: `ReportLineItem` has `accountId`, `GLLedgerEntry` has `id`, `RevenueClient` has `clientId`, `TrialBalanceAccount` has `id`.

**Impact:** Low risk for current static rendering (data is not reordered or filtered client-side). However, if sorting/filtering is added later, this can cause subtle reconciliation bugs. Violates React best practices.

**Suggested fix:** Use stable identifiers where available:
```typescript
// PLSection / BSSection: use accountId
{items.map((item) => (
    <div key={item.accountId} ...>

// Revenue: use clientId or clientName
{initialData.clients.map((client) => (
    <div key={client.clientId || client.clientName} ...>

// Cash Flow adjustments: idx is acceptable (no natural unique ID)
```

---

### P2-2: Missing planning/reports page referenced in sidebar

**File:** `apps/web/src/app/(dashboard)/planning/reports/page.tsx` -- DOES NOT EXIST

**Issue:** The `apps/web/CLAUDE.md` lists `/planning/reports` as a built page under Planning section. However, no file exists at this path. Users navigating to `/planning/reports` via the sidebar will see a 404.

**Impact:** Broken navigation link. Users expecting financial reports under the Planning section will encounter a dead end.

**Suggested fix:** Either create a redirect page or remove the sidebar link:

```typescript
// app/(dashboard)/planning/reports/page.tsx
import { redirect } from 'next/navigation';
export default function PlanningReportsPage() {
    redirect('/accounting/reports');
}
```

---

### P2-3: Entity selector dropdowns have no dynamic options (all reports)

**Files:** All 7 report view components contain entity `<Select>` dropdowns with only a hardcoded "All Entities" option and `{/* TODO: Load entities from API */}` comments:

- `pl-report-view.tsx:62-70`
- `bs-report-view.tsx:56-66`
- `cf-report-view.tsx:49-59`
- `tb-report-view.tsx:44-53`
- `gl-report-view.tsx:83-92`
- `revenue-report-view.tsx:46-55`
- `spending-report-view.tsx:58-67`

**Issue:** Users cannot select a specific entity. The Trial Balance and General Ledger reports **require** `entityId` to generate a report, but the dropdown has no selectable options. This makes these two reports completely non-functional from the UI alone (users would need to manually type the URL with query parameters).

**Impact:** Trial Balance and General Ledger reports are unusable through the UI. Other reports default to "all entities" which may be acceptable but limits usefulness for multi-entity users.

**Suggested fix:** Fetch entities in the Server Component page and pass them as props:

```typescript
// In page.tsx (Server Component):
import { listEntities } from '@/lib/api/entities';

export default async function TrialBalancePage({ searchParams }: PageProps) {
    const params = await searchParams;
    const entities = await listEntities().catch(() => []);
    // ...
    return <TBReportView entities={entities} initialData={report} ... />;
}

// In tb-report-view.tsx (Client Component):
<SelectContent>
    {entities.map((e) => (
        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
    ))}
</SelectContent>
```

---

### P2-4: GL Account ID input requires user to know internal database IDs

**File:** `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx:96-103`

**Issue:** The General Ledger report requires a `glAccountId` which is entered as a raw text `<Input>` with placeholder "Account ID":

```tsx
<Input
    id="glAccountId"
    placeholder="Account ID"
    value={glAccountId}
    onChange={(e) => setGlAccountId(e.target.value)}
/>
```

Users must know and type the internal database CUID of a GL account, which is not user-friendly. Account codes (like "1000", "4100") or names (like "Cash", "Revenue") are what users know.

**Impact:** Poor UX. The General Ledger report is effectively unusable without separately looking up account IDs from the Chart of Accounts page.

**Suggested fix:** Replace with a searchable select component that lists GL accounts (code + name), fetched from the server and passed as props.

---

### P2-5: Empty Label elements used for layout alignment

**Files:** All 7 report view components use `<Label>&nbsp;</Label>` for vertical alignment:

```tsx
<div className="space-y-2">
    <Label>&nbsp;</Label>
    <Button onClick={handleGenerate} className="w-full" ...>
```

**Issue:** Empty `<Label>` elements create semantic labels with no associated form control. Screen readers may announce an empty or whitespace label.

**Impact:** Minor accessibility issue. Confusing for assistive technology users.

**Suggested fix:** Use a non-semantic spacer element:
```tsx
<div className="space-y-2">
    <span className="block h-5" aria-hidden="true" />
    <Button ...>
```

---

### P2-6: Manual bullet characters in reports home page list

**File:** `apps/web/src/app/(dashboard)/accounting/reports/page.tsx:110-114`

**Issue:** The "Report Tips" section uses literal bullet characters inside `<li>` elements:

```tsx
<ul className="text-sm text-muted-foreground space-y-1">
    <li>* All reports support multi-entity consolidation...</li>
    <li>* Use date range filters to compare periods</li>
```

The `<ul>` element already provides list semantics. The manual `*` adds redundant visual bullets.

**Impact:** Minor visual inconsistency. Double-bullet appearance if list-style is visible.

**Suggested fix:** Remove the `*` characters and optionally add `list-disc list-inside` classes:
```tsx
<ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
    <li>All reports support multi-entity consolidation...</li>
```

---

### P2-7: Duplicate CHART_COLORS entry in spending-report-view

**File:** `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx:13-22`

**Issue:** The `CHART_COLORS` array has a duplicate entry:

```typescript
const CHART_COLORS = [
    'var(--color-ak-red)',
    'var(--color-ak-blue)',       // <-- first occurrence
    'var(--color-ak-purple)',
    'var(--color-ak-green)',
    'var(--color-ak-teal)',
    'var(--color-primary)',
    'var(--color-muted-foreground)',
    'var(--color-ak-blue)',       // <-- duplicate
];
```

`var(--color-ak-blue)` appears at index 1 and index 7, meaning the 2nd and 8th spending categories would have identical colors.

**Impact:** If a user has 8+ expense categories, categories 2 and 8 will have the same blue color, making them visually indistinguishable in the pie chart.

**Suggested fix:** Replace the duplicate with a distinct color:
```typescript
const CHART_COLORS = [
    'var(--color-ak-red)',
    'var(--color-ak-blue)',
    'var(--color-ak-purple)',
    'var(--color-ak-green)',
    'var(--color-ak-teal)',
    'var(--color-primary)',
    'var(--color-muted-foreground)',
    'var(--color-finance-income)',  // distinct from ak-blue
];
```

---

## Architecture Assessment

### What Works Well

1. **Server/Client boundary pattern is correct for 6 of 7 reports.** All `page.tsx` files are async Server Components that fetch data and pass serializable props to `'use client'` view components. This is textbook Next.js App Router architecture.

2. **Every page has sibling `loading.tsx` and `error.tsx` files.** All 8 route segments (reports home + 7 sub-reports) have proper loading skeletons and error boundaries. This exceeds minimum requirements.

3. **Metadata is properly configured on all pages.** Every `page.tsx` exports static `Metadata` with title and description. The title format is consistent: `"Report Name | Akount"`.

4. **`searchParams` is correctly typed as `Promise<...>` and awaited.** This matches the Next.js 15+/16+ behavior where `searchParams` is asynchronous in Server Components.

5. **Loading skeletons match the actual page layout.** The P&L loading skeleton mirrors the three-section structure (controls, revenue section, expenses section) of the actual report, providing a smooth visual transition.

6. **Error boundaries include context-specific titles.** The P&L error page shows "Profit & Loss Statement" as a header before the error card, maintaining user context.

7. **Design tokens are used correctly throughout.** Glass utility classes (`glass`, `glass-2`), semantic color tokens (`text-finance-income`, `text-finance-expense`, `text-ak-blue`, `text-ak-purple`, `text-ak-teal`), border tokens (`border-ak-border`, `border-ak-border-2`), background tokens (`bg-ak-pri-dim`, `bg-ak-red-dim`, `bg-ak-blue-dim`, `bg-ak-green-dim`, `bg-ak-purple-dim`, `bg-ak-bg-3`), and font classes (`font-heading`, `font-mono`) are used consistently. No hardcoded Tailwind arbitrary values (like `text-[#34D399]`) were found.

8. **Money formatting correctly converts integer cents to display dollars.** The `formatCurrency` helper divides by 100 and uses `Intl.NumberFormat` for locale-correct display. All type interfaces document amounts as `// cents`.

9. **Charts use CSS variables for colors.** Recharts `Cell` components reference `var(--color-ak-green)` etc., ensuring chart colors follow the theme system.

10. **Conditional data fetching in Server Components.** Pages check for required params before calling API functions (e.g., P&L checks `startDate && endDate`, TB checks `entityId`). This avoids unnecessary API calls when the page loads without query parameters.

11. **Report API client is well-structured.** Type interfaces are clearly documented with comments explaining units (`// cents`, `// ISO date`, `// 0-100`). The `downloadReport` function handles blob downloads with proper Content-Disposition header parsing.

12. **Consistent URL-based report generation pattern.** All reports use `router.push` with query parameters to trigger report generation, which means the browser URL always reflects the current report state. Users can bookmark or share report URLs.

### What Needs Attention

1. **The `reports.ts` file is a mixed server/client module** that creates a fundamental boundary violation. This is the most architecturally significant finding (P0-2).

2. **The GL report "Load More" calls a server-only function client-side** -- a concrete runtime crash (P0-1).

3. **Entity selection is completely non-functional** across all 7 report views. Trial Balance and General Ledger are unusable from the UI (P2-3).

4. **Hardcoded 'CAD' currency** in PLSection and BSSection breaks multi-currency support (P1-1).

5. **Zero accessibility attributes** across all report views (P1-3).

---

## Compliance Checklist

| Check | Status | Notes |
|-------|--------|-------|
| Server/Client boundaries correct | FAIL | GL view imports server module (P0-1); reports.ts mixed (P0-2) |
| Data fetching server-side | PASS | All page.tsx fetch in Server Components |
| No client-side data waterfalls | PASS (6/7) | GL "Load More" is only client-side fetch (by design) |
| Parallel data fetching | N/A | Each report has a single API call per generation |
| Metadata configured | PASS | All 8 pages have static Metadata exports |
| loading.tsx exists | PASS | All 8 routes have loading.tsx |
| error.tsx exists | PASS | All 8 routes have error.tsx |
| Authentication checked | PASS | Handled by apiClient (server) and middleware |
| TypeScript types correct | PASS | searchParams typed as Promise, all props typed |
| Design token compliance | PASS (minor) | 3 hex fallbacks in Tooltip contentStyle (P1-2) |
| Glass morphism used | PASS | Consistent glass utility class usage |
| Font tokens used | PASS | font-heading for titles, font-mono for amounts |
| Accessibility | FAIL | No aria attributes on tables, progress bars (P1-3) |
| No dead code | PASS | All imports are used |

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Next.js Compliance:** ISSUES FOUND
- **Blocking issues:** P0-1 (GL client-side server import), P0-2 (mixed module boundary)
- **Must fix before merge:** P0-1, P0-2, P1-1 (hardcoded 'CAD' currency)
- **Should fix:** P1-2 (hex fallbacks), P1-3 (accessibility), P1-4 (silent errors)
- **Can defer:** P2-1 through P2-7

---

## Summary of Required Changes

| Priority | Finding | Effort |
|----------|---------|--------|
| **P0-1** | Create Server Action for GL "Load More" pagination | 15 min |
| **P0-2** | Split reports.ts into server/client/shared modules | 30 min |
| **P1-1** | Pass currency prop to PLSection and BSSection | 10 min |
| **P1-2** | Remove hardcoded hex fallback from 3 Tooltip contentStyles | 5 min |
| **P1-3** | Add aria-label, caption, scope to tables; role to progress bars | 45 min |
| **P1-4** | Add error state to GL handleLoadMore | 10 min |
| **P2-1** | Replace array index keys with stable identifiers | 15 min |
| **P2-2** | Create redirect for /planning/reports | 5 min |
| **P2-3** | Implement entity selector with real options | 1-2 hr |
| **P2-4** | Replace GL Account ID text input with searchable select | 1 hr |
| **P2-5** | Replace empty Label spacers with aria-hidden spans | 10 min |
| **P2-6** | Remove manual bullet characters from tips list | 2 min |
| **P2-7** | Fix duplicate color in CHART_COLORS array | 2 min |

**Total estimated effort:** ~1.5 hours for P0+P1, ~3 hours including all P2s.

---

## Files Reviewed

| File | Lines | Verdict |
|------|-------|---------|
| `apps/web/src/app/(dashboard)/accounting/reports/page.tsx` | 121 | PASS (minor P2-6) |
| `apps/web/src/app/(dashboard)/accounting/reports/loading.tsx` | 43 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/error.tsx` | 39 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/page.tsx` | 41 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx` | 296 | ISSUES (P1-1, P1-2, P2-1) |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/loading.tsx` | 89 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/error.tsx` | 46 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/page.tsx` | 39 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx` | 339 | ISSUES (P1-1, P1-2, P2-1) |
| `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/page.tsx` | 38 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/cash-flow/cf-report-view.tsx` | 291 | PASS (minor P2-1) |
| `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/page.tsx` | 36 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/trial-balance/tb-report-view.tsx` | 190 | ISSUES (P1-3, P2-3, P2-5) |
| `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/page.tsx` | 41 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx` | 253 | ISSUES (P0-1, P1-3, P1-4, P2-4, P2-5) |
| `apps/web/src/app/(dashboard)/accounting/reports/revenue/page.tsx` | 38 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-report-view.tsx` | 179 | ISSUES (P1-3, P2-1) |
| `apps/web/src/app/(dashboard)/accounting/reports/spending/page.tsx` | 38 | PASS |
| `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx` | 234 | ISSUES (P1-2, P1-3, P2-1, P2-7) |
| `apps/web/src/lib/api/reports.ts` | 415 | ISSUES (P0-2) |
| `apps/web/src/app/(dashboard)/planning/reports/page.tsx` | N/A | MISSING (P2-2) |
