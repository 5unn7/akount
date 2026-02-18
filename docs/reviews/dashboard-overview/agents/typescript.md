# TypeScript Code Review -- Dashboard Redesign

**Reviewer:** kieran-typescript-reviewer (Elite TypeScript)
**Date:** 2026-02-17
**Branch:** feature/phase5-reports (uncommitted changes)
**Files reviewed:** 10 files (3 new components, 4 modified, 1 new shadcn primitive, 2 supporting)

---

## TypeScript Quality Assessment

- **Type Safety**: GOOD -- No `any` types found. Interfaces are well-defined. A few structural gaps noted below.
- **Modern Patterns**: `as const` assertions used well on color maps. `satisfies` operator not used where it could improve safety. Missing discriminated unions for trend state modeling.
- **Testability**: MODERATE -- Pure helper functions (`formatTrend`, `formatCurrency`, `getGreeting`) are testable. Data transformation logic in the server component is dense and would benefit from extraction.

---

## P0 -- Critical Issues

### P0-1: Dead Code -- `SparkCardsSkeleton` Function Never Used

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx:256-268`
**Issue:** The `SparkCardsSkeleton` component is defined at the bottom of the file but never referenced anywhere in the JSX tree or exported.
**Impact:** Dead code increases bundle size (marginally) and confuses future developers who may think it is used or try to maintain it. More importantly, the actual `loading.tsx` should provide skeleton states -- an unused skeleton function suggests the loading state may be incomplete.
**Fix:** Delete lines 256-268 entirely. If a skeleton is needed, it belongs in `apps/web/src/app/(dashboard)/overview/loading.tsx`.

```typescript
// DELETE this entire block (lines 256-268):
function SparkCardsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass rounded-lg px-4 py-3.5">
                    <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
            ))}
        </div>
    );
}
```

---

### P0-2: XSS Vulnerability via `dangerouslySetInnerHTML` in AIBrief

**File:** `apps/web/src/components/dashboard/AIBrief.tsx:31`
**Issue:** The `body` prop (an optional string) is rendered via `dangerouslySetInnerHTML={{ __html: body }}` with no sanitization. If `body` ever contains user-controlled or LLM-generated content, this is a direct XSS vector.
**Impact:** Arbitrary script execution in the user's browser. This is a security vulnerability, not strictly a TypeScript type issue, but the type system should model this constraint.
**Fix:** Either sanitize the HTML with a library like `dompurify`, or use a type-safe approach:

```typescript
// Option A: Mark the type as branded to signal it must be sanitized
type SanitizedHTML = string & { __brand: 'sanitized' };

interface AIBriefProps {
    body?: SanitizedHTML;
    date?: string;
}

// Option B: Don't use dangerouslySetInnerHTML at all
// If body only contains simple formatting, use a markdown renderer
<p className="text-sm font-heading italic text-foreground/90 leading-relaxed">
    {body}
</p>
```

---

## P1 -- High Severity Issues

### P1-1: Duplicated Interface Definitions -- `StatCardData` and `SparkCardData`

**File:** `apps/web/src/components/dashboard/DashboardLeftRail.tsx:7-16` and `apps/web/src/components/dashboard/SparkCards.tsx:7-16`
**Issue:** `StatCardData` (DashboardLeftRail) and `SparkCardData` (SparkCards) are structurally identical interfaces with different names. Both define the same shape: `{ label, value, trend?, sparkline?, color? }`. The trend sub-object `{ direction: 'up' | 'down' | 'flat'; text: string }` is also duplicated.
**Impact:** If one is updated (e.g., adding a new color), the other will diverge. The parent `page.tsx` constructs both `sparkCards` and `leftRailStats` arrays with the same shape, confirming they should share a type.
**Fix:** Extract a shared type to a common location:

```typescript
// apps/web/src/components/dashboard/types.ts
export type TrendDirection = 'up' | 'down' | 'flat';
export type MetricColor = 'green' | 'red' | 'blue' | 'purple' | 'primary';

export interface TrendIndicator {
    direction: TrendDirection;
    text: string;
}

export interface MetricCardData {
    label: string;
    value: string;
    trend?: TrendIndicator;
    sparkline?: number[];
    color?: MetricColor;
}
```

Then import this in both DashboardLeftRail and SparkCards.

---

### P1-2: Duplicated Color Map Constants Across Two Files

**File:** `apps/web/src/components/dashboard/DashboardLeftRail.tsx:22-51` and `apps/web/src/components/dashboard/SparkCards.tsx:23-45`
**Issue:** Four constant maps are duplicated nearly identically between the two files: `sparkColorMap`, `trendColorMap`, `glowColorMap`, and `TrendIcon`. The `DashboardLeftRail` additionally has `colorMap` which SparkCards does not.
**Impact:** A token change (e.g., renaming `--ak-green-fill`) must be made in two places. This violates DRY without justification since both files serve the same visual purpose (metric cards with sparklines).
**Fix:** Co-locate shared constants with the shared type:

```typescript
// apps/web/src/components/dashboard/constants.ts
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TrendDirection, MetricColor } from './types';

export const sparkColorMap: Record<MetricColor, { stroke: string; fill: string }> = {
    green: { stroke: 'var(--ak-green)', fill: 'var(--ak-green-fill)' },
    // ...
} as const;

export const trendColorMap: Record<TrendDirection, string> = {
    up: 'text-ak-green',
    down: 'text-ak-red',
    flat: 'text-muted-foreground',
} as const;

export const glowColorMap: Record<MetricColor, string> = { /* ... */ } as const;
export const TrendIcon: Record<TrendDirection, typeof TrendingUp> = { /* ... */ } as const;
```

---

### P1-3: Duplicated `MiniSparkline` Component

**File:** `apps/web/src/components/dashboard/DashboardLeftRail.tsx:54-100` and `apps/web/src/components/dashboard/SparkCards.tsx:47-93`
**Issue:** The `MiniSparkline` component is copy-pasted between both files. They differ only in `width`/`height` constants (56x20 vs 80x24) and SVG gradient ID prefix (`rail-spark-grad-` vs `spark-grad-`).
**Impact:** Bug fixes to SVG rendering logic must be applied twice. The gradient ID prefix difference suggests awareness of potential ID collisions, but this would be better handled by a size prop.
**Fix:** Extract to a shared component with configurable dimensions:

```typescript
// apps/web/src/components/dashboard/MiniSparkline.tsx
interface MiniSparklineProps {
    data: number[];
    color?: MetricColor;
    width?: number;
    height?: number;
    idPrefix?: string;
}

export function MiniSparkline({
    data,
    color = 'primary',
    width = 80,
    height = 24,
    idPrefix = 'spark',
}: MiniSparklineProps) {
    // ... shared implementation
}
```

---

### P1-4: SVG Gradient ID Collision Risk

**File:** `apps/web/src/components/dashboard/SparkCards.tsx:76` and `DashboardLeftRail.tsx:83`
**Issue:** SVG gradient IDs are constructed as `spark-grad-${color}` and `rail-spark-grad-${color}`. If two sparklines with the same color render on the same page (which they do -- both rails show "Revenue" with color `green`), the gradient `<defs>` ID `spark-grad-green` will be duplicated in the DOM. Browsers may reference the wrong gradient or the first one found.
**Impact:** Visual rendering bugs where sparkline fills reference the wrong gradient definition. Hard to reproduce because it depends on DOM order.
**Fix:** Use `React.useId()` for unique gradient IDs:

```typescript
function MiniSparkline({ data, color = 'primary' }: MiniSparklineProps) {
    const gradientId = React.useId();

    // ...
    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
    // ...
    <path d={fillPath} fill={`url(#${gradientId})`} />
}
```

---

### P1-5: `TYPE_LABELS` and `TYPE_COLORS` Use Loose `Record<string, ...>` Instead of `EntityType`

**File:** `apps/web/src/components/dashboard/EntitiesList.tsx:11-25`
**Issue:** Both maps are typed as `Record<string, string>` and `Record<string, { icon: string; border: string }>`, but the keys are entity types. The `EntityType` union (`'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC'`) is imported in the same file (indirectly via `Entity`). Using `Record<string, ...>` means TypeScript cannot verify that all entity types have entries, and allows arbitrary string access without error.
**Impact:** If a new entity type is added to `EntityType`, the compiler will not flag the missing entry in these maps. The fallback `|| TYPE_COLORS.CORPORATION` on line 46 and `|| entity.type` on line 64 silently mask missing entries.
**Fix:**

```typescript
import type { EntityType } from '@/lib/api/entities';

const TYPE_LABELS: Record<EntityType, string> = {
    PERSONAL: 'Personal',
    CORPORATION: 'Corporation',
    SOLE_PROPRIETORSHIP: 'Sole Prop.',
    PARTNERSHIP: 'Partnership',
    LLC: 'LLC',
};

const TYPE_COLORS: Record<EntityType, { icon: string; border: string }> = {
    PERSONAL: { icon: 'text-ak-green', border: 'border-l-[color:var(--ak-green)]' },
    CORPORATION: { icon: 'text-ak-blue', border: 'border-l-[color:var(--ak-blue)]' },
    SOLE_PROPRIETORSHIP: { icon: 'text-ak-purple', border: 'border-l-[color:var(--ak-purple)]' },
    PARTNERSHIP: { icon: 'text-ak-teal', border: 'border-l-[color:var(--ak-teal)]' },
    LLC: { icon: 'text-primary', border: 'border-l-primary' },
};
```

With this change, the fallback lookups become unnecessary since TypeScript guarantees completeness.

---

### P1-6: `EntitiesList` Return Type Uses Bare `React.ReactElement` Without Import

**File:** `apps/web/src/components/dashboard/EntitiesList.tsx:27`
**Issue:** The function signature `export function EntitiesList({ entities }: EntitiesListProps): React.ReactElement` references `React.ReactElement` but `React` is not imported. This relies on the global JSX namespace from `tsconfig.json` JSX settings. While this works in Next.js, it is inconsistent with the other components in this review which do not annotate return types at all.
**Impact:** Fragile -- depends on ambient type availability. Inconsistent with codebase patterns.
**Fix:** Either add the import or remove the explicit return type to match other components:

```typescript
// Option A: Remove return type (matches SparkCards, NetWorthHero, etc.)
export function EntitiesList({ entities }: EntitiesListProps) {

// Option B: Add import (explicit is better for public APIs)
import type { ReactElement } from 'react';
export function EntitiesList({ entities }: EntitiesListProps): ReactElement {
```

---

### P1-7: Server Component Data Transformation Logic is Too Dense in page.tsx

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx:59-182`
**Issue:** Over 120 lines of data transformation logic (`formatTrend`, `formatCurrency`, `convertSparkline`, `sparkCards` construction, `leftRailStats` construction) live directly inside the `OverviewPage` server component function. This violates SRP -- the page component is responsible for both data fetching AND complex data transformation.
**Impact:** Untestable without rendering the full server component. Difficult to refactor. The `formatCurrency` helper on line 66 also shadows the imported `formatCurrency` from `@/lib/utils/currency` (line 6 of NetWorthHero imports it) -- they have different signatures (this one takes cents and returns `$X,XXX` with no decimals; the shared one returns `$X,XXX.XX`).
**Fix:** Extract transformation logic into a dedicated module:

```typescript
// apps/web/src/lib/dashboard/transformers.ts
import type { PerformanceMetrics } from '@/lib/api/performance';
import type { DashboardMetrics } from '@/lib/api/dashboard';
import type { MetricCardData } from '@/components/dashboard/types';

export function buildSparkCards(performance: PerformanceMetrics | null): MetricCardData[] {
    // ... extracted logic
}

export function buildLeftRailStats(
    performance: PerformanceMetrics | null,
    metrics: DashboardMetrics | null,
    currency: string,
): MetricCardData[] {
    // ... extracted logic
}
```

---

## P2 -- Medium Severity Issues

### P2-1: `formatTrend` Return Type Could Use Discriminated Union

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx:59-64`
**Issue:** The `formatTrend` function returns `{ direction: 'up' | 'down' | 'flat'; text: string }` but the `'flat'` case has a fundamentally different meaning (no change) than `'up'`/`'down'`. Additionally, the callers frequently pass `{ direction: 'flat' as const, text: 'Coming soon' }` or `{ direction: 'flat' as const, text: 'No data' }` as hardcoded fallbacks, conflating "no data available" with "data is flat."
**Impact:** Consumers cannot distinguish between "flat trend" and "feature not yet available." The `as const` assertions scattered across the file (lines 79, 80, 81, 95, 100, 101, 109, 135, 161, 173, 180) suggest the type is not strict enough at the definition site.
**Fix:**

```typescript
type TrendIndicator =
    | { direction: 'up' | 'down'; text: string }
    | { direction: 'flat'; text: string }
    | { direction: 'unavailable'; text: string };
```

Or better yet, make the trend optional and use `undefined` for "no data" (which is already done in `leftRailStats` but not in `sparkCards`).

---

### P2-2: `ExpenseChart` Period State is Unused

**File:** `apps/web/src/components/dashboard/ExpenseChart.tsx:31`
**Issue:** The `period` state (`useState<Period>('month')`) is set by the period toggle buttons but never used to filter or transform the data. The `data` prop is rendered as-is regardless of which period is selected.
**Impact:** The period toggle is cosmetic-only. Users will click "week" or "year" and see no change, which is confusing. This is either dead interactive state or an incomplete feature.
**Fix:** Either remove the period toggle until the feature is implemented, or wire it to a callback prop:

```typescript
interface ExpenseChartProps {
    data?: ExpenseMonth[];
    className?: string;
    onPeriodChange?: (period: Period) => void; // Add callback
}

// In the button handler:
onClick={() => {
    setPeriod(p);
    onPeriodChange?.(p);
}}
```

---

### P2-3: Hardcoded `text-[9px]` and `text-[10px]` Font Sizes Across Multiple Files

**File:** Multiple files: `DashboardLeftRail.tsx:133`, `NetWorthHero.tsx:63,92,104`, `RecentTransactions.tsx:91,93,97`, `SparkCards.tsx:125`, `EntitiesList.tsx:63,73,79,87`, `ExpenseChart.tsx:140,164,168,174`
**Issue:** The arbitrary values `text-[9px]` and `text-[10px]` appear 20+ times across the dashboard files. While not a TypeScript type issue per se, these are Tailwind arbitrary values that bypass the design token system. If the design system ever standardizes a "micro" text size, all of these must be found and replaced.
**Impact:** Inconsistent sizing if the design system evolves. Not caught by token validation.
**Fix:** Define utility classes in `globals.css`:

```css
@utility text-micro {
    font-size: 9px;
    line-height: 1.2;
}

@utility text-mini {
    font-size: 10px;
    line-height: 1.4;
}
```

---

### P2-4: `DashboardMetrics` Has Explicit `Promise<React.ReactElement>` Return Type

**File:** `apps/web/src/components/dashboard/DashboardMetrics.tsx:20`
**Issue:** The async server component declares `: Promise<React.ReactElement>` as its return type. This is unusual for React components. The `React` namespace is used without an explicit import (it works via JSX transform ambient types). More importantly, the catch block on line 81 catches `error` without typing it:

```typescript
} catch (error) {
    // error is implicitly `unknown` in strict mode, but used as:
    error instanceof Error ? error.message : 'Unknown error'
```

This is actually correct TypeScript 4.4+ behavior (`useUnknownInCatchVariables`), but the return type annotation is unnecessarily verbose.
**Impact:** Minor -- the return type adds no safety that inference wouldn't provide.
**Fix:** Remove the explicit return type to match other components, or use the JSX.Element shorthand:

```typescript
export async function DashboardMetrics({
    entityId,
    currency = 'CAD'
}: {
    entityId?: string;
    currency?: string;
}) {
```

---

### P2-5: `DashboardRightRail` className Prop Has Implicit Default Via Logical OR

**File:** `apps/web/src/components/dashboard/DashboardRightRail.tsx:12`
**Issue:** The className is applied via `className={className || "hidden xl:block w-80 shrink-0"}`. This means if a consumer passes `className=""` (empty string), the fallback kicks in because empty string is falsy. Also, this replaces the entire class string rather than merging with `cn()`, which is the established pattern everywhere else.
**Impact:** The caller in `page.tsx:246` passes `className="block w-full"` which completely replaces the default, losing `shrink-0`. The caller on `page.tsx:251` passes no className, getting the default. This works for the current two call sites but is fragile.
**Fix:**

```typescript
export function DashboardRightRail({ className }: DashboardRightRailProps) {
    return (
        <aside className={cn("hidden xl:block w-80 shrink-0", className)}>
```

Or if the intent is truly to replace (not merge), document this with a comment.

---

### P2-6: `Unused Import -- `TrendingUp` in DashboardMetrics

**File:** `apps/web/src/components/dashboard/DashboardMetrics.tsx:3`
**Issue:** `TrendingUp` is imported from `lucide-react` but never used in the component. The metrics cards show cash position, debt, and working capital -- none display trend icons.
**Impact:** Unused import bloats the bundle (tree-shaking should catch this, but it signals code that was started and not finished).
**Fix:**

```typescript
// Before:
import { DollarSign, CreditCard, Activity, TrendingUp } from "lucide-react";

// After:
import { DollarSign, CreditCard, Activity } from "lucide-react";
```

---

### P2-7: `handleMouseMove` Ref Cleanup Missing in Both Glow Components

**File:** `apps/web/src/components/dashboard/DashboardLeftRail.tsx:103,113-114` and `apps/web/src/components/dashboard/SparkCards.tsx:96,104-105`
**Issue:** Both `StatCard` and `SparkCard` components use `useRef<number>(0)` for `frameRef` and call `cancelAnimationFrame(frameRef.current)` inside the mouse move handler, then `requestAnimationFrame(...)`. However, neither component cancels the pending animation frame on unmount. If the component unmounts while a rAF is pending, the callback will execute and call `target.style.setProperty` on a potentially detached DOM node.
**Impact:** Memory leak (minor) and potential console error if the component unmounts during a mouse move interaction. React strict mode will make this more visible in development.
**Fix:** Add cleanup via `useEffect`:

```typescript
useEffect(() => {
    return () => {
        cancelAnimationFrame(frameRef.current);
    };
}, []);
```

---

### P2-8: `ExpenseCategory.color` is `string` -- Should Use Token Reference

**File:** `apps/web/src/components/dashboard/ExpenseChart.tsx:10`
**Issue:** The `color` field in `ExpenseCategory` is typed as `string` and directly applied via `style={{ backgroundColor: cat.color }}` on line 133. This bypasses the design token system entirely -- the caller can pass any arbitrary color string.
**Impact:** If the backend returns hex colors like `#FF6384`, these are hardcoded values that will not adapt to light/dark mode themes. This contradicts the design system rule "NEVER hardcode colors."
**Fix:** Either use the semantic `MetricColor` type and map to CSS variables, or document this as an intentional exception (chart colors from data source):

```typescript
interface ExpenseCategory {
    name: string;
    amount: number;
    color: `var(--${string})` | `hsl(${string})`; // Constrain to CSS variables
}
```

---

### P2-9: `formatCurrency` in page.tsx Shadows the Shared Utility

**File:** `apps/web/src/app/(dashboard)/overview/page.tsx:66-70`
**Issue:** A local `formatCurrency` function is defined that formats cents to `$X,XXX` (no decimals). However, a shared `formatCurrency` utility exists at `@/lib/utils/currency` that formats cents to `$X,XXX.XX` (with decimals) and supports proper locale/currency via `Intl.NumberFormat`. The local version also uses `en-US` locale hardcoded, while the shared utility defaults to `en-CA`.
**Impact:** Inconsistent currency formatting across the dashboard. The NetWorthHero card uses the shared `formatCurrency` (with decimals) while the sparkCards and leftRailStats use the local version (without decimals). This could confuse users who see `$4,500` in one place and `$4,500.00` in another for the same value.
**Fix:** If the no-decimals format is intentional for compact display, create a named variant:

```typescript
// In @/lib/utils/currency.ts
export function formatCurrencyCompact(cents: number, currency = 'CAD'): string {
    if (cents === 0) return '--';
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(cents / 100);
}
```

---

## Informational Notes

### INFO-1: dialog.tsx is Standard shadcn/ui Boilerplate

**File:** `apps/web/src/components/ui/dialog.tsx`
**Assessment:** This is a standard shadcn/ui dialog component with glass morphism styling applied (line 41: `glass border border-ak-border`). No custom TypeScript logic. The `forwardRef` patterns are standard. The `displayName` assignments are correct. No issues found. The component correctly uses `React.ComponentPropsWithoutRef` and `React.ElementRef` generics.

### INFO-2: `RecentTransactions` is Well-Typed

**File:** `apps/web/src/components/dashboard/RecentTransactions.tsx`
**Assessment:** Good use of the imported `Transaction` type. The `getTransactionStyle` function returns a well-structured object. The component correctly handles the empty state. The `formatDate` helper is appropriately scoped. One minor note: `formatDate` is defined inside the component body, so it is recreated on every render. Since this is a server component (no `'use client'` directive), this is not a performance concern.

### INFO-3: `EntitiesSection` is Clean

**File:** `apps/web/src/components/dashboard/EntitiesSection.tsx`
**Assessment:** Clean client component. Good use of the `useKeyboardShortcuts` hook. Proper typing of the `Entity[]` prop. No issues found.

---

## Summary Statistics

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 2 | Dead code (SparkCardsSkeleton), XSS via dangerouslySetInnerHTML |
| P1 | 7 | Duplicated types/constants/components, loose Record types, SRP violation |
| P2 | 9 | Unused state, missing cleanup, naming shadows, hardcoded font sizes |
| Info | 3 | Clean files noted |

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **TypeScript Quality:** MEDIUM
- **Blocking Issues:** P0-2 (XSS), P0-1 (dead code)

The codebase demonstrates solid fundamentals -- explicit interfaces, `as const` assertions, proper React event typing (`React.MouseEvent<HTMLDivElement>`), and no `any` types anywhere. The main concerns are structural: significant code duplication between `DashboardLeftRail` and `SparkCards` (shared types, constants, and the `MiniSparkline` component), and a server component that handles too much data transformation inline.

**Recommended priority for fixes:**
1. Remove dead `SparkCardsSkeleton` function (P0-1) -- trivial
2. Address `dangerouslySetInnerHTML` in AIBrief (P0-2) -- security
3. Extract shared `MetricCardData` type and color constants (P1-1, P1-2) -- structural
4. Extract shared `MiniSparkline` component with `useId()` for gradient IDs (P1-3, P1-4)
5. Tighten `TYPE_LABELS` / `TYPE_COLORS` to `Record<EntityType, ...>` (P1-5)
6. Extract data transformation from page.tsx to testable module (P1-7)
7. Remaining P2 items at discretion
