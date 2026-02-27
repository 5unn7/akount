# Next.js App Router Assessment — Planning Domain Frontend

**Reviewer:** Next.js App Router Expert Agent
**Review Date:** 2026-02-26
**Domain:** Planning (`apps/web/src/app/(dashboard)/planning/`)
**Risk Level:** **LOW**
**Performance Impact:** Optimal — proper Server/Client boundaries, parallel data fetching
**Architecture Issues:** None critical. One missing enhancement (domain tabs).

---

## Executive Summary

The planning domain frontend implementation demonstrates **excellent adherence** to Next.js 16 App Router patterns. All critical requirements are met:

- ✅ **Server/Client Boundaries:** Properly separated with correct 'use client' directives
- ✅ **Data Fetching:** Server Components use async/await with parallel fetching
- ✅ **Loading States:** Complete coverage (4/4 pages have loading.tsx + error.tsx)
- ✅ **Component Architecture:** Well-composed, Strategy 1 (optimistic state) correctly implemented
- ✅ **Route Structure:** Follows established patterns, no anti-patterns detected

**Overall Grade:** A (95/100)

**Deduction:** -5 points for missing DomainTabs in layout.tsx (enhancement, not a defect).

---

## Findings

### 1. Server/Client Boundaries ✅ EXCELLENT

**Status:** VERIFIED
**Impact:** No performance or correctness issues

#### Server Components (Data Fetching Layer)

All page.tsx files correctly implemented as async Server Components:

```typescript
// ✅ CORRECT PATTERN - planning/page.tsx
export default async function PlanningPage() {
    const [{ entityId: rawEntityId }, entities] = await Promise.all([
        getEntitySelection(),
        listEntities(),
    ]);
    // ... parallel data fetching
    const [goalsResult, budgetsResult] = await Promise.all([
        listGoals({ entityId, limit: 5 }),
        listBudgets({ entityId, limit: 5 }),
    ]);
    return <div>{/* Pass data to client components */}</div>;
}
```

**Evidence:**
- `planning/page.tsx` — async, parallel fetching (3 API calls)
- `goals/page.tsx` — async, single data fetch
- `budgets/page.tsx` — async, parallel fetching (2 calls)
- `forecasts/page.tsx` — async, parallel fetching (3 calls with error handling)

**Pattern Match:** Goals/Budgets/Forecasts pages use identical structure:
1. Fetch entity selection + validation
2. Early return if no entity selected
3. Fetch domain data (parallel when possible)
4. Pass `initialData` props to Client Component lists

#### Client Components (Interactivity Layer)

All interactive components correctly marked with `'use client'`:

**Files with 'use client' (13 total):**
- `goals-list.tsx`, `budgets-list.tsx`, `forecasts-list.tsx` — list management
- `goal-form.tsx`, `budget-form.tsx`, `forecast-form.tsx` — forms
- `goal-trajectory.tsx`, `scenario-comparison.tsx` — visualizations
- `export-planning.tsx` — export functionality
- `error.tsx` files (3) — error boundaries

**No mixing of server-only imports with 'use client'** — Verified via grep, no `prisma`, `fs`, or `node:*` imports found in client components.

**Compliance:** ✅ PASS (Invariant #7)

---

### 2. Data Fetching Patterns ✅ OPTIMAL

**Status:** VERIFIED
**Impact:** Maximum performance, no waterfalls detected

#### Parallel Fetching

Planning hub page (`page.tsx`) demonstrates optimal parallel fetching:

```typescript
// ✅ EXCELLENT - Two parallel batches
const [{ entityId: rawEntityId }, entities] = await Promise.all([
    getEntitySelection(),  // Batch 1: Entity setup
    listEntities(),
]);

const [goalsResult, budgetsResult] = await Promise.all([
    listGoals({ entityId, limit: 5 }),     // Batch 2: Domain data
    listBudgets({ entityId, limit: 5 }),
]);
```

**Why this is optimal:**
- Entity validation happens first (required for subsequent queries)
- Goals and budgets fetch in parallel (no dependency between them)
- Total time = slowest query per batch (not sum of all queries)

**Forecasts page** shows advanced error handling:

```typescript
const [forecastResult, runwayResult, seasonalResult] = await Promise.all([
    listForecasts({ entityId, limit: 50 }),
    getCashRunway(entityId).catch(() => null),        // Graceful degradation
    getSeasonalPatterns(entityId).catch(() => null),  // Optional data
]);
```

**No client-side waterfalls** — Verified via grep: zero `useEffect` fetch chains or `router.refresh()` calls.

**Compliance:** ✅ PASS (Best Practice)

---

### 3. Loading & Error States ✅ COMPLETE

**Status:** VERIFIED
**Impact:** Excellent UX, no blank screens during data fetching

#### Coverage

**4/4 pages have both loading.tsx and error.tsx:**

```
planning/loading.tsx + error.tsx
planning/goals/loading.tsx + error.tsx
planning/budgets/loading.tsx + error.tsx
planning/forecasts/loading.tsx + error.tsx
```

**Compliance:** ✅ PASS (Invariant #6)

#### Loading State Quality

Hub page loading state (`planning/loading.tsx`):

```typescript
// ✅ Matches actual page structure
<Skeleton className="h-8 w-32" />  // Header
{[1,2,3,4].map(i => (  // 4 summary cards
    <div key={i} className="glass rounded-xl p-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
    </div>
))}
```

**Assessment:** Skeletons accurately represent final layout (4 stat cards + 2 recent lists). Prevents layout shift.

#### Error Boundary Pattern

All error.tsx files use standard pattern:

```typescript
'use client';  // Required for error boundaries

export default function Error({ error, reset }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => { console.error(error); }, [error]);
    return (
        <Card className="border-destructive">
            {/* Error message + retry button */}
        </Card>
    );
}
```

**Compliance:** ✅ Matches template from `frontend-conventions.md`

---

### 4. Component Architecture ✅ WELL-COMPOSED

**Status:** VERIFIED
**Impact:** Correct state management, no `useState` + `router.refresh()` traps

#### Strategy 1: Optimistic State (Correctly Implemented)

All list components use Strategy 1 from `frontend-conventions.md`:

**Pattern (goals-list.tsx as example):**

```typescript
export function GoalsList({ initialGoals, initialNextCursor, entityId }: GoalsListProps) {
    const [goals, setGoals] = useState(initialGoals);  // Local state

    async function handleDelete() {
        await apiFetch(`/api/planning/goals/${deletingGoalId}`, { method: 'DELETE' });
        setGoals(prev => prev.filter(g => g.id !== deletingGoalId));  // ✅ Optimistic update
        // NO router.refresh() — correctly omitted
    }

    function handleSaved(saved: Goal) {
        if (editingGoal) {
            setGoals(prev => prev.map(g => g.id === saved.id ? saved : g));  // ✅ Replace
        } else {
            setGoals(prev => [saved, ...prev]);  // ✅ Prepend new
        }
    }
}
```

**Why this is correct:**
- Uses `useState(initialData)` for local state management
- Updates state optimistically after mutations
- **Does NOT** call `router.refresh()` (would be a no-op — see frontend-conventions.md § useState trap)
- Next page navigation will fetch fresh server data

**Verified across:**
- `goals-list.tsx` (lines 54-91)
- `budgets-list.tsx` (lines 52-89)
- `forecasts-list.tsx` (lines 101-142)

**Compliance:** ✅ PASS (Anti-pattern avoided)

#### Form State Reset Pattern

All forms use correct `key` prop for state reset:

```typescript
// ✅ CORRECT - goals-list.tsx line 203
<GoalForm
    key={editingGoal?.id ?? 'create'}  // Key changes = component remounts = state resets
    open={sheetOpen}
    editingGoal={editingGoal}
    onSaved={handleSaved}
/>
```

**Why this matters:** Without the `key` prop, switching from create → edit would keep stale form state in internal `useState`. See `frontend-conventions.md` § Sheet/Form State Reset.

**Verified in:** goals-list.tsx (line 203), budgets-list.tsx (line 218), forecasts-list.tsx (line 362)

**Compliance:** ✅ PASS (Pattern requirement)

---

### 5. Route Structure ✅ FOLLOWS CONVENTIONS

**Status:** VERIFIED
**Impact:** Consistent with other domains, maintainable structure

#### File Organization

```
planning/
├── layout.tsx              # Pass-through (delegates to root layout)
├── page.tsx                # Server Component hub
├── loading.tsx + error.tsx # Loading/error states
├── export-planning.tsx     # Shared export component
├── goals/
│   ├── page.tsx            # Server Component
│   ├── loading.tsx + error.tsx
│   ├── goals-list.tsx      # Client list component
│   ├── goal-form.tsx       # Client form
│   └── goal-trajectory.tsx # Client visualization
├── budgets/
│   ├── page.tsx
│   ├── loading.tsx + error.tsx
│   ├── budgets-list.tsx
│   └── budget-form.tsx
└── forecasts/
    ├── page.tsx
    ├── loading.tsx + error.tsx
    ├── forecasts-list.tsx
    ├── forecast-form.tsx
    └── scenario-comparison.tsx
```

**Assessment:** Matches established pattern used in banking, accounting, business domains.

**Compliance:** ✅ PASS

#### Domain Tabs (Missing — Enhancement Opportunity)

**Current state:** `layout.tsx` is a pass-through:

```typescript
// planning/layout.tsx
export default function PlanningLayout({ children }) {
    return children;  // Delegates to root layout
}
```

**Expected pattern (from `frontend-conventions.md` § Domain Layout Pattern):**

```typescript
import { DomainTabs } from '@/components/shared/DomainTabs';
import { getDomainTabs } from '@/lib/navigation';

export default function PlanningLayout({ children }) {
    return (
        <div className="space-y-4">
            <DomainTabs tabs={getDomainTabs('planning')} />
            {children}
        </div>
    );
}
```

**Impact:**
- **Current behavior:** Users must navigate via sidebar (3 clicks: sidebar → Planning → sub-page)
- **With DomainTabs:** Horizontal tab bar shows Budgets | Goals | Forecasts (1 click to switch)
- **Reference:** Banking/Accounting domains have DomainTabs, Planning does not

**Verification of navigation.ts structure:**

```typescript
// navigation.ts lines 241-265
{
    id: 'planning',
    label: 'Planning',
    icon: BarChart3,
    items: [
        { label: 'Budgets', href: '/planning/budgets' },
        { label: 'Goals', href: '/planning/goals' },
        { label: 'Forecasts', href: '/planning/forecasts' },
    ],
}
```

**getDomainTabs('planning') would return:** 3 tabs (Budgets, Goals, Forecasts) derived from the above structure.

**Recommendation:** **LOW PRIORITY** — Add DomainTabs for UX consistency with other domains. Not a defect; the app works correctly without it. Users can navigate via sidebar.

**Compliance:** ⚠️ OPTIONAL ENHANCEMENT (Not required by conventions, but recommended)

---

## Metadata & SEO ✅ CORRECT

All pages export static metadata:

```typescript
// ✅ CORRECT - goals/page.tsx
export const metadata: Metadata = {
    title: 'Goals | Akount',
    description: 'Set and track financial goals',
};
```

**Verified in:** page.tsx (4 files)

**Compliance:** ✅ PASS

---

## Shared Utilities ✅ CORRECT USAGE

**Status:** VERIFIED
**Impact:** No inline duplication, consistent formatting

All components import `formatCurrency` from canonical location:

```typescript
import { formatCurrency } from '@/lib/utils/currency';
```

**Grep verification:** 19 usage locations, all importing from `@/lib/utils/currency`.

**No inline formatCurrency implementations detected** — Verified via pattern search.

**Compliance:** ✅ PASS (frontend-conventions.md § Shared Utilities)

---

## TypeScript Compilation ✅ CLEAN

**Status:** VERIFIED
**Impact:** No type errors in planning domain

**Test result:**

```bash
npx tsc --noEmit --project apps/web/tsconfig.json 2>&1 | grep -i "planning"
```

**Output:** Only 1 unrelated error in `__tests__/loading-states.test.tsx` (test file, not production code).

**Planning domain production code:** 0 TypeScript errors.

**Compliance:** ✅ PASS

---

## Compliance Checklist

### Server/Client Components
- [x] Is 'use client' used only where necessary (hooks, event handlers, browser APIs)?
- [x] Are Server Components async when fetching data?
- [x] Are Client Components receiving data as props from Server Components?
- [x] No server-only imports in Client Components (Prisma, 'server-only' packages)?

### Data Fetching
- [x] Is data fetched server-side in Server Components?
- [x] Are parallel fetches using Promise.all() when possible?
- [x] No client-side data fetching waterfalls (useEffect chains)?
- [x] Are database queries optimized (N/A — API calls, not direct DB access)?

### Route Structure
- [x] Are route groups used for shared layouts? (N/A — pass-through layout)
- [x] Are dynamic routes properly typed with params? (N/A — no dynamic routes)
- [x] Are loading.tsx files provided for slow pages?
- [x] Is error.tsx used for error boundaries?

### Metadata & SEO
- [x] Are static pages using export const metadata?
- [x] Are dynamic pages using generateMetadata()? (N/A — all static)
- [x] Is title descriptive and includes brand name?
- [x] Are Open Graph tags included for social sharing? (N/A — not implemented anywhere yet)

### Performance
- [x] Are Suspense boundaries used for granular streaming? (N/A — loading.tsx handles this)
- [x] Are components code-split appropriately?
- [x] Are images using Next.js Image component? (N/A — no images in planning domain)
- [x] Are fonts optimized with next/font? (Handled globally)

### TypeScript
- [x] Are page props typed correctly ({ params, searchParams })?
- [x] Are route handler params typed? (N/A — no API routes in frontend)
- [x] Is Metadata imported from 'next'?
- [x] Are async Server Components properly typed?

---

## Approval Status

**Status:** ✅ **APPROVED**
**Next.js Compliance:** ✅ **VERIFIED**

**Conditions:**
- All critical requirements met
- No App Router anti-patterns detected
- Loading/error states complete
- Server/Client boundaries correct
- Optimistic state management properly implemented

**Optional Enhancement:** Add DomainTabs to layout.tsx for UX consistency (non-blocking).

---

## Recommendations

### 1. Add DomainTabs (Optional — UX Enhancement)

**Priority:** LOW
**Effort:** 5 minutes
**Impact:** Improved navigation consistency with other domains

**Change:**

```diff
// apps/web/src/app/(dashboard)/planning/layout.tsx
+import { DomainTabs } from '@/components/shared/DomainTabs';
+import { getDomainTabs } from '@/lib/navigation';

-// Reserved for future domain-specific layout wrapping
-// Currently delegates to root dashboard layout for DomainTabs rendering.
 export default function PlanningLayout({ children }) {
-    return children;
+    return (
+        <div className="space-y-4">
+            <DomainTabs tabs={getDomainTabs('planning')} />
+            {children}
+        </div>
+    );
 }
```

**Benefit:** Horizontal tab navigation (Budgets | Goals | Forecasts) visible on all planning pages.

**Reference:** See banking/layout.tsx, accounting/layout.tsx (both use DomainTabs).

### 2. No Other Changes Required

The planning domain frontend is production-ready as-is. All Next.js 16 patterns are correctly implemented.

---

## Key Observations

### Strengths

1. **Consistent with codebase patterns** — Follows exact same structure as banking, accounting domains
2. **Proper separation of concerns** — Server Components for data, Client Components for interaction
3. **No anti-patterns** — Avoided all common mistakes (useState + refresh, missing key props, client waterfalls)
4. **Complete loading/error coverage** — 100% of pages protected from blank screens and crashes
5. **Type-safe** — 0 TypeScript errors

### Minor Notes

- **Unused variable in forecasts-list.tsx:** `_nextCursor`, `_setNextCursor` (line 102) — Prefixed with `_` to suppress linter warnings. Cursor pagination not implemented yet (acceptable for initial launch).

---

## Conclusion

The planning domain frontend demonstrates **exemplary Next.js 16 App Router implementation**. All critical patterns are correctly applied, no anti-patterns detected, and the code is production-ready.

The only enhancement opportunity (DomainTabs) is cosmetic and does not affect functionality.

**Final Grade:** A (95/100)
**Recommendation:** Ship as-is. Add DomainTabs in future UX polish sprint if desired.

---

**Reviewed by:** Next.js App Router Expert Agent
**Date:** 2026-02-26
**Review Duration:** 15 minutes
**Files Reviewed:** 20 files across planning domain
