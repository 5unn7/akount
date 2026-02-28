# Lazy Loading & Bundle Optimization - Implementation Plan

**Created:** 2026-02-27
**Status:** Draft
**Task:** PERF-7 - Lazy-loading heavy frontend components + drop recharts
**Estimated Effort:** 3-4 hours

## Overview

Two-pronged optimization: (1) eliminate the recharts dependency entirely (~400KB gzipped, only used in 4 files) by replacing with custom SVG (matching existing CashFlowChart/ExpenseChart pattern), and (2) implement strategic lazy loading for modals, forms, and heavy page components. Currently only 4 components use lazy loading, while 243 client components exist.

**Key insight:** Dashboard charts (`CashFlowChart`, `ExpenseChart`) already use hand-rolled SVG with zero external deps. Recharts is only used for 3 basic report charts + 1 circular progress indicator.

## Success Criteria

- [ ] Recharts removed from `package.json` — zero chart dependency
- [ ] All 4 recharts usages replaced with custom SVG components
- [ ] Reduce initial bundle size by 30%+ (recharts removal + lazy loading)
- [ ] All modals/sheets/dialogs use lazy loading (not visible on mount)
- [ ] All large page-specific components (>300 LOC) use lazy loading
- [ ] Loading states provided for all lazy-loaded components
- [ ] No visual regressions (charts render identically)
- [ ] `npm run build` passes with zero errors

## Tasks

### Task 1: Replace CircularProgress with Pure CSS/SVG

**File:** `apps/web/src/components/dashboard/CircularProgress.tsx`
**What:** Replace recharts PieChart with a lightweight SVG `<circle>` using `stroke-dasharray` / `stroke-dashoffset`. This is a simple donut chart — no need for a library.
**Depends on:** none
**Success:** CircularProgress renders identically, zero recharts import

**Pattern:**
```typescript
// Pure SVG circular progress — no dependencies
export function CircularProgress({ value = 0, size = 120, strokeWidth = 12 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = value >= 80 ? 'var(--ak-green)' : 'var(--primary)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Background track */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke="var(--color-border)" strokeWidth={strokeWidth} />
        {/* Progress arc */}
        <circle cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold font-mono">{value}%</span>
      </div>
    </div>
  );
}
```

**Callers to verify:**
- `apps/web/src/components/dashboard/CircularProgressDynamic.tsx` (dynamic wrapper)
- `apps/web/src/app/onboarding/components/ProgressIndicator.tsx`
- `apps/web/src/components/layout/SidebarProgressIndicator.tsx`

---

### Task 2: Replace Report Pie Chart (Spending Report)

**File:** `apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx`
**What:** Replace recharts `PieChart` + `Pie` + `Cell` + `Tooltip` + `ResponsiveContainer` with custom SVG donut chart (similar to how ExpenseChart uses custom SVG for bar visualization).
**Depends on:** none
**Success:** Spending report pie chart renders identically, zero recharts import

**What's needed:**
- SVG `<circle>` elements with `stroke-dasharray` segments for each category
- Custom tooltip on hover (useState + mouse events)
- CSS variables for colors (already using `var(--color-ak-red)` etc.)
- `ResponsiveContainer` → simple CSS `width: 100%` + `viewBox`

---

### Task 3: Replace Report Bar Charts (P&L + Balance Sheet)

**Files:**
- `apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx`
- `apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx`

**What:** Replace recharts `BarChart` + `Bar` + `XAxis` + `YAxis` + `Tooltip` + `Legend` with custom SVG bar chart component
**Depends on:** none
**Success:** Both report bar charts render identically, zero recharts import

**Pattern (reusable `SimpleBarChart` component):**
```typescript
// apps/web/src/components/charts/SimpleBarChart.tsx
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  formatValue?: (v: number) => string;
}

export function SimpleBarChart({ data, height = 200, formatValue }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));
  // Render SVG bars with labels, Y-axis, and hover tooltip
}
```

**What it replaces:**
- `ResponsiveContainer` → CSS `width: 100%` + SVG `viewBox`
- `XAxis` / `YAxis` → SVG `<text>` elements
- `Tooltip` → `useState` + `onMouseEnter/Leave`
- `Legend` → Simple flex row with color dots
- `Cell` → Direct SVG `fill` attribute

---

### Task 4: Remove recharts Dependency

**File:** `apps/web/package.json`
**What:** Remove `recharts` from dependencies after Tasks 1-3 complete
**Depends on:** Tasks 1, 2, 3
**Success:** `npm install && npm run build` passes, no recharts in `node_modules`

```bash
cd apps/web && npm uninstall recharts
```

**Verification:**
- `Grep "recharts" apps/web/src/` returns 0 results
- `npm run build` succeeds
- `npx tsc --noEmit` passes

---

### Task 5: Create Shared Lightweight Chart Components

**File:** `apps/web/src/components/charts/index.ts`
**What:** Extract reusable chart primitives from Tasks 1-3 for future use
**Depends on:** Tasks 1, 2, 3
**Success:** Shared chart components available for future features

**Components:**
- `SimpleBarChart` — Horizontal/vertical bars with labels and tooltip
- `SimplePieChart` — Donut/pie chart with segments and legend
- `CircularProgress` — Already in place from Task 1
- Optional: `ChartTooltip` — Reusable hover tooltip wrapper

---

### Task 6: Lazy Load Modal/Dialog/Sheet Forms

**Files:**
- `apps/web/src/components/dashboard/EntityFormSheet.tsx` (337 lines)
- `apps/web/src/components/accounts/AccountFormSheet.tsx` (361 lines)
- `apps/web/src/components/shared/KeyboardShortcutsModal.tsx`
- `apps/web/src/components/business/PaymentForm.tsx` (448 lines)
- `apps/web/src/components/business/InvoiceForm.tsx`
- `apps/web/src/components/business/BillForm.tsx`
- `apps/web/src/components/business/VendorForm.tsx`
- `apps/web/src/components/business/ClientForm.tsx`
- `apps/web/src/components/transactions/CreateTransactionForm.tsx`

**What:** Convert modal/sheet forms to lazy-loaded components via `next/dynamic`
**Depends on:** none
**Success:** Forms only loaded when user clicks "Create" or "Edit" buttons

**Pattern (in parent components):**
```typescript
import dynamic from 'next/dynamic';

const EntityFormSheet = dynamic(
    () => import('@/components/dashboard/EntityFormSheet').then((m) => m.EntityFormSheet),
    { ssr: false }
);

// No skeleton needed — modals aren't visible on mount
```

---

### Task 7: Lazy Load Heavy Page Components

**Files:**
- `apps/web/src/app/(dashboard)/banking/import/page.tsx` → ImportUploadForm
- `apps/web/src/app/(dashboard)/banking/reconciliation/page.tsx` → ReconciliationDashboard
- `apps/web/src/components/business/PaymentTable.tsx` (522 lines)
- `apps/web/src/components/transactions/TransactionsListClient.tsx` (508 lines)
- `apps/web/src/components/entities/EntityDetailClient.tsx` (421 lines)

**What:** Lazy load large page-specific components (>300 LOC)
**Depends on:** none
**Success:** Components loaded on-demand when user navigates to specific pages

**Pattern:**
```typescript
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ImportUploadForm = dynamic(
    () => import('@/components/import/ImportUploadForm').then((m) => m.ImportUploadForm),
    { ssr: false, loading: () => <ImportFormSkeleton /> }
);
```

---

### Task 8: Lazy Load Onboarding Wizard

**File:** `apps/web/src/app/onboarding/page.tsx`
**What:** Lazy load OnboardingWizard (multi-step form, only needed on /onboarding)
**Depends on:** none
**Success:** Onboarding page bundle size reduced

---

### Task 9: Bundle Analysis & Verification

**What:** Run Next.js build before/after, document savings
**Depends on:** Tasks 1-8
**Success:** Documented bundle size reduction

**Metrics to track:**
- Initial bundle size (bytes) — from `next build` output
- Number of chunks
- Lazy-loaded chunk sizes
- `First Load JS` column in build output

---

## Reference Files

- `apps/web/src/components/dashboard/CashFlowChart.tsx` — **Custom SVG chart pattern** (line charts with manual path calc, tooltips, gradients)
- `apps/web/src/components/dashboard/ExpenseChart.tsx` — **Custom SVG bar chart** (stacked bars, period selector)
- `apps/web/src/components/dashboard/MiniSparkline.tsx` — Lightweight sparkline pattern
- `apps/web/src/components/dashboard/DashboardCharts.tsx` — `next/dynamic` + `ssr: false` pattern
- `apps/web/src/components/accounts/AddAccountModal.tsx` — Dynamic modal import pattern

## Edge Cases

**Chart Replacement Risks:**
- Tooltip positioning: Custom tooltips need overflow-aware positioning
- Responsive sizing: Must handle container resize (use `viewBox` + CSS width)
- Accessibility: SVG charts need `role="img"` + `aria-label` for screen readers
- Animation: Recharts provides enter animations — decide if custom SVG needs them (likely not for reports)

**Layout Shift Prevention:**
- For modals/sheets: no skeleton needed (not visible on mount)
- For page components: provide skeleton with matching dimensions
- For charts: set explicit `min-height` on chart containers

**SSR Considerations:**
- Custom SVG charts CAN render on server (no DOM dependency) — no `ssr: false` needed
- This is an improvement over recharts which required `ssr: false`

## Testing Strategy

**Chart Replacement (Tasks 1-3):**
1. Visual comparison: Screenshot before/after for each chart
2. Data validation: Verify correct values displayed
3. Interaction: Hover tooltips work correctly
4. Responsive: Charts resize with container

**Lazy Loading (Tasks 6-8):**
1. Navigate to each affected page, verify loading states
2. Network throttling (Fast 3G): skeletons visible, then component loads
3. No console errors or hydration mismatches

**Build Verification (Task 9):**
```bash
# Before (baseline)
cd apps/web && npm run build  # Note "First Load JS" sizes

# After all changes
cd apps/web && npm run build  # Compare "First Load JS" sizes

# Verify no recharts
Grep "recharts" apps/web/src/  # Should return 0
```

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Tasks 1-3 (Chart replacement) | `nextjs-app-router-reviewer`, `performance-oracle` |
| Task 6 (Forms) | `nextjs-app-router-reviewer` |
| Task 9 (Bundle Analysis) | `performance-oracle` |

## Domain Impact

- **Primary domain:** Frontend Performance
- **Adjacent domains:**
  - UX: Charts must render identically, loading states smooth
  - Accessibility: SVG charts need proper ARIA attributes
  - Accounting Reports: Chart accuracy critical for financial data

## Performance Impact Estimate

**From recharts removal (Tasks 1-4):**
- Dependency elimination: -400KB gzipped
- Tree shaking improvement: recharts pulled in d3 submodules
- SSR benefit: Custom SVG renders server-side (no `ssr: false` needed)

**From lazy loading (Tasks 6-8):**
- Modal/form chunk splitting: -200KB to -300KB from initial bundle
- Page-specific splitting: -100KB to -200KB per page

**Total Expected:**
- Initial bundle: -40% to -50% reduction
- TTI: -500ms to -1200ms improvement
- Lighthouse Performance: +15 to +20 points

## Progress Tracking

- [ ] Task 1: CircularProgress → pure CSS/SVG
- [ ] Task 2: Spending report pie chart → custom SVG
- [ ] Task 3: P&L + Balance Sheet bar charts → custom SVG
- [ ] Task 4: Remove recharts from package.json
- [ ] Task 5: Extract shared chart components
- [ ] Task 6: Lazy load modal/sheet forms (9 files)
- [ ] Task 7: Lazy load heavy page components (5 files)
- [ ] Task 8: Lazy load onboarding wizard
- [ ] Task 9: Bundle analysis & verification

## Time Estimates

| Task | Est. Time | Notes |
|------|-----------|-------|
| Task 1 | 15 min | Simple SVG circle replacement |
| Task 2 | 30 min | Pie chart with segments + tooltip |
| Task 3 | 45 min | Bar chart component + 2 reports |
| Task 4 | 5 min | npm uninstall + verify |
| Task 5 | 20 min | Extract + barrel export |
| Task 6 | 45 min | 9 form files, parent updates |
| Task 7 | 30 min | 5 page components |
| Task 8 | 10 min | Single component |
| Task 9 | 20 min | Build + document |
| **Total** | **~3.5 hours** | |

**Dependencies:** Tasks 1-3 → Task 4 → Task 5. Tasks 6-8 are independent.
**Risk Level:** Low-Medium (charts need visual verification)
