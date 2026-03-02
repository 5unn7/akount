# Next.js App Router Review: Entity Management Hub

> **Auditor:** nextjs-app-router-reviewer
> **Date:** 2026-02-20
> **Scope:** Overview layout, entity pages, wizard component architecture, server/client boundaries
> **Plan Reviewed:** `docs/plans/2026-02-20-entity-management-hub.md`
> **Risk Level:** MEDIUM

---

## Assessment Summary

| Metric | Value |
|--------|-------|
| Issues Found | 11 |
| P0 (Critical) | 1 |
| P1 (High) | 4 |
| P2 (Medium) | 6 |

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/app/(dashboard)/overview/layout.tsx` | 21 | Overview tab navigation (DomainTabs) |
| `apps/web/src/app/(dashboard)/overview/page.tsx` | 213 | Dashboard server component (parallel fetch) |
| `apps/web/src/app/(dashboard)/overview/loading.tsx` | 112 | Dashboard loading skeleton |
| `apps/web/src/app/(dashboard)/overview/cash-flow/page.tsx` | 195 | Cash flow sub-tab (canonical pattern) |
| `apps/web/src/app/(dashboard)/overview/cash-flow/loading.tsx` | 36 | Cash flow loading skeleton |
| `apps/web/src/app/(dashboard)/overview/cash-flow/error.tsx` | 53 | Cash flow error boundary |
| `apps/web/src/app/(dashboard)/overview/net-worth/page.tsx` | 142 | Net worth sub-tab (canonical pattern) |
| `apps/web/src/app/(dashboard)/overview/net-worth/loading.tsx` | 36 | Net worth loading skeleton |
| `apps/web/src/app/(dashboard)/overview/net-worth/error.tsx` | 53 | Net worth error boundary |
| `apps/web/src/app/(dashboard)/layout.tsx` | 124 | Dashboard shell (auth, entity fetch, Navbar) |
| `apps/web/src/components/shared/DomainTabs.tsx` | 50 | Tab navigation with active state detection |
| `apps/web/src/components/dashboard/EntityFormSheet.tsx` | 338 | Current entity creation form (Sheet, client) |
| `apps/web/src/components/dashboard/EntitiesSection.tsx` | 50 | Current entity section (collapsible) |
| `apps/web/src/components/dashboard/EntitiesList.tsx` | 109 | Current entity card list (GlowCard) |
| `apps/web/src/providers/entity-provider.tsx` | 110 | Entity context (selection, currency, cookies) |
| `apps/web/src/lib/api/entities.ts` | 49 | Entity API client (server-only via apiClient) |
| `apps/web/src/lib/api/client.ts` | 50+ | Server-only API client (import 'server-only') |

## Pattern Compliance

| Pattern | Status | Notes |
|---------|--------|-------|
| Server Component for data fetch | YES | Plan correctly specifies Task 10 and Task 14 as async Server Components |
| Client Component for interactivity | YES | EntityHubClient (Task 11), EntityDetailClient (Task 15), wizard steps all correctly marked as client |
| loading.tsx for every page.tsx | YES | Plan explicitly calls out loading.tsx in Tasks 10 and 14 |
| error.tsx for every page.tsx | YES | Plan explicitly calls out error.tsx in Tasks 10 and 14 |
| No server imports in 'use client' | RISK | Wizard needs careful handling -- see P1-1 below |
| Metadata export on pages | PARTIAL | Task 10 mentions metadata; Task 14 does not -- see P2-3 |
| Parallel data fetching | NOT ADDRESSED | Task 14 detail page does not specify Promise.all -- see P2-5 |

---

## Findings

### P0-1: DomainTabs Active-State Logic Will Break for `/overview/entities/[id]` Sub-Routes

**Location:** `apps/web/src/components/shared/DomainTabs.tsx` lines 28-30
**Plan Reference:** Task 9 (add Entities tab), Task 14 (entity detail route at `/overview/entities/[id]`)

**Issue:** The current `DomainTabs` active-state matching uses this logic:

```typescript
const isActive =
    pathname === tab.href ||
    (tab.href !== tabs[0]?.href && pathname.startsWith(tab.href + '/'));
```

This works correctly for shallow sub-tabs (like `/overview/cash-flow`) because there are no deeper child routes under them. However, the plan introduces a nested dynamic route at `/overview/entities/[id]`. When the user navigates to `/overview/entities/clxyz123`, the condition `pathname.startsWith('/overview/entities/')` will correctly match the Entities tab -- this is fine.

**But the critical problem is different:** The `Dashboard` tab (first tab, `href: '/overview'`) has a special exemption: `tab.href !== tabs[0]?.href` prevents `startsWith` matching for the first tab. This means navigating to `/overview/entities/anything` will NOT incorrectly highlight Dashboard. That is correct.

**The actual P0 issue is:** When the entity detail page at `/overview/entities/[id]` renders, the `DomainTabs` will still be visible (it's in the layout), but the user is now deep in a detail view. There is no consideration in the plan for how the entity detail page relates to the tab bar. Should the tab bar remain visible? Should there be a back-navigation pattern? The cash-flow and net-worth tabs render full pages with no child navigation -- they are leaf pages. Entities introduces a list-to-detail drill-down pattern that does not exist in the current Overview section.

**Impact:** Users will see the tab bar on the entity detail page with "Entities" highlighted, but there is no breadcrumb or back button to return to the entity list. The UX pattern is inconsistent with how cash-flow and net-worth work (no sub-navigation). If more detail sub-pages are added later (e.g., `/overview/entities/[id]/relationships`), the tab bar provides no navigation context for where the user is within the entity detail.

**Recommendation:** The plan needs to specify one of two approaches:
1. **Keep the detail page inline** (recommended for consistency): The entity detail should NOT be a separate route. Instead, it should be a sheet/modal or an expandable panel within the entities list page, keeping the UX consistent with cash-flow and net-worth (both are leaf pages under Overview).
2. **Add breadcrumb navigation**: If the detail page IS a separate route, add a breadcrumb component to the entity detail page (e.g., "Entities > My Company LLC") and consider whether the DomainTabs should still render at this depth.

Option 1 is strongly preferred because it avoids a fundamentally different navigation paradigm within the Overview section.

---

### P1-1: Wizard API Client Import Strategy Not Specified -- Risk of Server/Client Boundary Violation

**Location:** Plan Tasks 18-25 (wizard components)
**Invariant:** #7 (Server/Client Separation)

**Issue:** The plan specifies the wizard as a set of client components (`'use client'`) that will call `POST /api/system/entities` on the final step (Task 19, line: "Calls `POST /api/system/entities` on final step"). However, the plan does not specify WHICH API client the wizard should use.

The existing codebase has two API clients:
- `apps/web/src/lib/api/client.ts` -- imports `'server-only'` and `@clerk/nextjs/server`. **Cannot be imported from client components.**
- `apps/web/src/lib/api/client-browser.ts` -- browser-safe client using `useAuth()` or similar client-side auth pattern.

The current `EntityFormSheet.tsx` (line 5) correctly uses `apiFetch` from `client-browser`:
```typescript
import { apiFetch } from '@/lib/api/client-browser'
```

But Task 13 (API client expansion) references `apps/web/src/lib/api/entities.ts`, which currently imports from the **server-only** client:
```typescript
import { apiClient } from './client';  // server-only!
```

If the wizard components try to import `listEntities`, `createEntity`, or the new functions from `entities.ts`, it will trigger a build error because `entities.ts` transitively imports `'server-only'`.

**Impact:** Build failure. Any `'use client'` component that imports from `entities.ts` will crash with "server-only module imported from client component."

**Recommendation:** Task 13 must explicitly create TWO sets of entity API functions:
1. **Server functions** in `entities.ts` (existing, for Server Components) -- used by page.tsx files
2. **Client functions** in a new `entities-client.ts` (or add to `dashboard-client.ts`) -- used by wizard, EntityFormSheet, and other client components

This follows the established pattern where `client.ts` (server) and `client-browser.ts` (client) coexist. The plan should call this out explicitly.

---

### P1-2: Wizard Architecture Should Be a Sheet, Not a Full-Screen Modal or Route

**Location:** Plan Task 19 (wizard shell component)
**Plan Text:** "Full-screen modal/sheet wizard container"

**Issue:** The plan is ambiguous about the wizard container ("Full-screen modal/sheet wizard container"). The existing entity creation UX uses a `Sheet` (slide-over panel from the right), as seen in `EntityFormSheet.tsx`:

```typescript
<Sheet open={open} onOpenChange={...}>
    <SheetContent className="w-full sm:max-w-lg">
```

A full-screen modal would be a significant departure from the established pattern. Additionally, a route-based wizard (e.g., `/overview/entities/new/step-1`) would create major complexity:
- Each step would need its own `loading.tsx` and `error.tsx`
- Browser back/forward would need to navigate wizard steps
- The overview layout and DomainTabs would render behind/around the wizard
- Abandoning the wizard mid-flow would leave orphan URL state

**Impact:** Inconsistent UX pattern. A full-screen modal blocks the entire app. A route-based wizard adds unnecessary routing complexity for what is fundamentally a form flow.

**Recommendation:** The wizard should be implemented as a **wide Sheet** (matching the existing `EntityFormSheet` pattern but wider, e.g., `sm:max-w-2xl`). This approach:
- Reuses the established component pattern (`Sheet` from shadcn/ui)
- Keeps the wizard state entirely in client-side React state (the `useEntityWizard` hook -- Task 18 -- is correctly designed for this)
- Does not require additional routes, `loading.tsx`, or `error.tsx`
- Allows the user to see the entities list behind the sheet for context
- Is consistent with how the navbar currently opens the entity form

The plan's Task 19 should be updated to say "Sheet-based wizard container" and specify width (`sm:max-w-2xl` or `sm:max-w-xl`).

---

### P1-3: Entity List Page Fetches Data Redundantly -- Dashboard Layout Already Fetches Entities

**Location:** Plan Task 10 (entities server component), existing `apps/web/src/app/(dashboard)/layout.tsx` line 65-68

**Issue:** The dashboard root layout already fetches entities for the Navbar:

```typescript
// apps/web/src/app/(dashboard)/layout.tsx lines 65-68
const [onboarding, entities] = await Promise.all([
    checkOnboardingStatus(),
    listEntities().catch(() => [] as Entity[]),
]);
// ...
<Navbar entities={entities} />
```

The plan's Task 10 proposes the entities page as a Server Component that "fetches entities via expanded `listEntities()`." This means every navigation to `/overview/entities` will re-fetch the entity list even though the dashboard layout already has it.

In Next.js App Router, `fetch` calls with the same URL and options within the same render pass are deduplicated. However, the plan calls for an **expanded** `listEntities()` (with `status`, `_count`, `country`) which is a different endpoint or different query parameters than what the layout fetches. This means two separate API calls will be made.

**Impact:** Double API calls on every entity page load -- one from the layout (basic entity list for the Navbar) and one from the page (expanded entity list for the hub). This is not a correctness issue but is a performance concern.

**Recommendation:** Two options:
1. **Preferred:** Accept the double fetch since the payloads serve different purposes (Navbar needs minimal data, Hub needs full data with `_count`). This is the standard Next.js pattern -- layouts and pages are independent data-fetching boundaries. Document this as intentional.
2. **Alternative:** Expand the layout's `listEntities()` to always include the extra fields and pass them down via a React context or a shared cache. This is over-engineering and not recommended.

The plan should note that the layout and page fetch different entity projections and that this is by design.

---

### P1-4: Task 27 Option B (Navigate to `/overview/entities?action=create`) Conflicts with Server Component Pattern

**Location:** Plan Task 27 (update EntityFormSheet to use wizard)

**Issue:** Task 27 proposes two options:
- **Option A:** Replace EntityFormSheet internals with wizard import
- **Option B:** Change the trigger to navigate to `/overview/entities?action=create`

Option B is problematic. The entities page (`page.tsx`) is a Server Component. Reading `?action=create` from `searchParams` on the server side means the server would need to pass this flag down to the client `EntityHubClient`, which would then auto-open the wizard on mount. This creates:
1. A `searchParams` dependency on the page that triggers a re-render on every navigation
2. An awkward `useEffect` in the client component to check for `action=create` and auto-open
3. URL state that persists after the wizard closes (user needs to clean up the URL)

**Impact:** Poor UX with stale URL state and unnecessary server re-renders.

**Recommendation:** Use **Option A exclusively**. The EntityFormSheet should import and render the new wizard's Sheet component. The trigger mechanism remains the same (click "Add Entity" in navbar, sheet opens). The wizard state machine (`useEntityWizard` hook) manages all state internally. No URL changes needed.

---

### P2-1: Cash Flow and Net Worth Pages Use Direct `await` Without `Promise.allSettled` -- Entity Page Should Be Consistent

**Location:** Plan Task 10, existing `overview/cash-flow/page.tsx` line 14, `overview/net-worth/page.tsx` line 13

**Issue:** The existing sub-tab pages use a simple `await` for their single data fetch:

```typescript
// cash-flow/page.tsx
const data = await getCashFlow();

// net-worth/page.tsx
const data = await getNetWorth();
```

Both use a single `await` with no `try/catch` -- they rely on the `error.tsx` boundary to catch failures. The dashboard page (`overview/page.tsx`) uses `Promise.allSettled` because it fetches multiple independent data sources and wants partial rendering.

The plan's Task 10 does not specify which error-handling pattern the entities page should use. Since the entity list page has a single primary data source (the expanded entity list), it should follow the cash-flow/net-worth pattern of a direct `await` with `error.tsx` as the catch-all.

**Impact:** Low. This is a consistency recommendation.

**Recommendation:** Task 10 should specify:
```typescript
export default async function EntitiesPage() {
    const entities = await listEntitiesExpanded(); // single await, error.tsx catches
    return <EntityHubClient entities={entities} />;
}
```

This matches the cash-flow and net-worth pattern exactly.

---

### P2-2: Entity Detail Page (Task 14) Needs `generateMetadata` for Dynamic Titles

**Location:** Plan Task 14 (entity detail page)

**Issue:** The plan specifies `loading.tsx` and `error.tsx` for the detail page but does not mention metadata. The entity detail page at `/overview/entities/[id]` should have dynamic metadata showing the entity name:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const entity = await getEntityDetail(id);
    return {
        title: `${entity.name} | Entities | Akount`,
        description: `Manage ${entity.name} entity settings and relationships`,
    };
}
```

The existing sub-tab pages all use static `export const metadata` because they have fixed titles. A dynamic `[id]` route requires `generateMetadata` instead.

**Impact:** Browser tab will show a generic or missing title when viewing entity detail pages, hurting both UX and SEO.

**Recommendation:** Add `generateMetadata` to Task 14's specification. Note that this function makes a server-side fetch, so it should be deduplicated with the page's own fetch using Next.js request memoization (same `getEntityDetail(id)` call in both will be deduped within the same render pass if using `fetch` internally).

---

### P2-3: Task 10 Entities Page Metadata Should Follow Existing Pattern Exactly

**Location:** Plan Task 10

**Issue:** The plan mentions "Includes metadata: `title: 'Entities | Akount'`" but does not show the full pattern. The existing pages consistently use:

```typescript
export const metadata: Metadata = {
    title: "Cash Flow | Akount",
    description: "Monitor your cash flow across all accounts",
};
```

Both `title` and `description` are always provided. The plan only mentions `title`.

**Impact:** Minor SEO/consistency gap.

**Recommendation:** Task 10 should specify:
```typescript
export const metadata: Metadata = {
    title: "Entities | Akount",
    description: "Manage your business entities, jurisdictions, and relationships",
};
```

---

### P2-4: Wizard Component Count Is High -- Risk of Over-Engineering

**Location:** Plan Tasks 18-25 (8 files for the wizard)

**Issue:** The wizard is specified as 8 separate files:
1. `useEntityWizard.ts` (hook)
2. `EntityCreationWizard.tsx` (shell)
3. `SituationStep.tsx`
4. `FastPathStep.tsx`
5. `GuidedQuestionsStep.tsx`
6. `RecommendationStep.tsx`
7. `PreRegistrationStep.tsx`
8. `ReviewStep.tsx`

All 8 files are `'use client'` components. This is fine from a Server/Client boundary perspective (all wizard state is client-side, no server imports needed). However, the file count is high for a wizard that lives inside a Sheet.

**Impact:** Maintenance overhead. Each step is a separate file import, increasing the client bundle.

**Recommendation:** Consider consolidating the three path-specific steps (FastPathStep, GuidedQuestionsStep, PreRegistrationStep) into a single `WizardStepContent.tsx` that switches on the current path/step. The hook (`useEntityWizard`) and shell (`EntityCreationWizard`) are correctly separated. The SituationStep, RecommendationStep, and ReviewStep are shared across paths and merit their own files.

Suggested consolidation (5 files instead of 8):
1. `useEntityWizard.ts` -- state machine hook
2. `EntityCreationWizard.tsx` -- shell (Sheet + progress + nav buttons)
3. `SituationStep.tsx` -- path selection (shared)
4. `PathSteps.tsx` -- fast, guided, and pre-registration step content (path-specific)
5. `ReviewStep.tsx` -- review and create (shared)

This is a P2 suggestion, not a blocker. The plan's 8-file structure is defensible for clarity.

---

### P2-5: Entity Detail Page Should Use Parallel Fetching for Entity + Relationships

**Location:** Plan Task 14

**Issue:** Task 14 specifies: "Server component that fetches entity detail + relationships." The plan does not specify whether these are fetched as a single API call (Task 7 specifies `GET /api/system/entities/:id` returns detail WITH relationships) or as two separate calls.

If the API returns everything in one call, this is a non-issue. But if the relationships are fetched separately (via `GET /api/system/entities/:id/relationships`), then the detail page should use `Promise.all`:

```typescript
const [entity, relationships] = await Promise.all([
    getEntityDetail(id),
    listRelationships(id),
]);
```

**Impact:** Potential waterfall if two sequential awaits are used instead of parallel.

**Recommendation:** Task 14 should explicitly state whether the entity detail endpoint returns relationships inline or whether a separate relationships fetch is needed. If separate, mandate `Promise.all`. The plan's Task 7 suggests `GET /api/system/entities/:id` returns "full detail with relationships," so this may already be a single call. Clarify in the plan.

---

### P2-6: EntityProvider Does Not Need Modification, But the Plan Should State This Explicitly

**Location:** `apps/web/src/providers/entity-provider.tsx`, Plan general

**Issue:** The `EntityProvider` manages the currently **selected** entity for filtering dashboard data (via cookies and `router.refresh()`). The Entity Management Hub is about **managing** entities (CRUD), not about **selecting** them for filtering.

The plan does not mention `EntityProvider` at all. This is likely correct -- entity management should not touch the entity selection context. However, there is an implicit dependency: when a new entity is created via the wizard or an entity is archived, the `EntityProvider`'s `entities` list (passed from the dashboard layout) becomes stale.

Currently, `EntityFormSheet.tsx` calls `router.refresh()` after creation (line 109), which triggers a server-side re-render of the layout, which re-fetches entities. The wizard should follow the same pattern.

**Impact:** If the wizard does not call `router.refresh()` after entity creation, the Navbar entity selector will show stale data until the next full page navigation.

**Recommendation:** Task 19 should explicitly note: "On success: call `router.refresh()` to update the entity list in the Navbar, then optionally navigate to the new entity detail page." This matches the existing `EntityFormSheet` pattern (line 109).

---

## Route Architecture Assessment

### Proposed Route Structure

```
app/(dashboard)/overview/
    layout.tsx               # Existing -- add "Entities" tab to overviewTabs array
    page.tsx                 # Existing -- remove EntitiesSection embed
    loading.tsx              # Existing
    error.tsx                # Existing
    cash-flow/
        page.tsx             # Existing (canonical pattern)
        loading.tsx          # Existing
        error.tsx            # Existing
    net-worth/
        page.tsx             # Existing (canonical pattern)
        loading.tsx          # Existing
        error.tsx            # Existing
    entities/                # NEW
        page.tsx             # Server Component: fetch expanded entity list
        loading.tsx          # Skeleton: 3 placeholder entity cards
        error.tsx            # Error boundary with retry
        [id]/                # NEW -- REVIEW CONCERN (see P0-1)
            page.tsx         # Server Component: fetch entity detail
            loading.tsx      # Skeleton: entity detail placeholder
            error.tsx        # Error boundary with retry
```

### Assessment

The top-level `/overview/entities` route is **correct and well-aligned** with the existing pattern. Adding it as a sibling to `cash-flow` and `net-worth` is the natural place. The one-line change to `layout.tsx` (Task 9) is clean:

```typescript
const overviewTabs = [
    { label: 'Dashboard', href: '/overview' },
    { label: 'Cash Flow', href: '/overview/cash-flow' },
    { label: 'Net Worth', href: '/overview/net-worth' },
    { label: 'Entities', href: '/overview/entities' },  // NEW
];
```

The `DomainTabs` component will correctly highlight the "Entities" tab for both `/overview/entities` (exact match) and `/overview/entities/[id]` (startsWith match, non-first tab).

**However, the `[id]` sub-route is architecturally inconsistent** (see P0-1). Neither `cash-flow` nor `net-worth` have child routes. Introducing a detail sub-route under `entities` breaks the "leaf page" pattern of the Overview section. The recommended approach is to keep entity detail as an inline expansion (Sheet or expandable panel) rather than a separate route.

If the team decides the `[id]` route is necessary (e.g., for deep-linking to entity settings), it is technically sound from a Next.js perspective but introduces a navigation pattern that the rest of the Overview section does not have.

---

## Wizard Architecture Assessment

### Should It Be Route-Based or Modal/Sheet?

**Verdict: Sheet-based (not route-based, not full-screen modal).**

**Rationale:**

1. **Existing pattern:** `EntityFormSheet.tsx` is a Sheet. Users are trained to expect entity creation in a slide-over panel.

2. **No server data needed during wizard flow:** The wizard's state machine (`useEntityWizard` hook) manages all state client-side. Jurisdiction data comes from static JSON files (Task 1), not from API calls during the flow. The only API call is `POST` at the end. This means there is no benefit to route-based rendering (no server-side data fetching per step).

3. **Route-based would require 7+ files of routing infrastructure:** Each wizard step as a route would need its own `page.tsx`, `loading.tsx`, and `error.tsx` (21 files for 7 steps). This is excessive for a client-side form flow.

4. **Sheet preserves context:** The user can see the entity list behind the sheet, providing context for what they are creating.

5. **Close confirmation is simpler in a Sheet:** The plan mentions "Close confirmation if form has data" (Task 19). In a Sheet, this is an `onOpenChange` handler that checks for dirty state. In a route-based flow, this requires `beforeunload` events and router guards, which are fragile in Next.js App Router.

### Component Architecture for the Wizard

The wizard should be structured as:

```
components/entities/wizard/
    useEntityWizard.ts           # State machine hook (Task 18) -- CORRECT
    EntityCreationWizard.tsx      # Sheet shell + step renderer (Task 19) -- CORRECT
    steps/
        SituationStep.tsx         # Path selection (Task 20) -- CORRECT
        FastPathStep.tsx          # Fast path form (Task 21) -- CORRECT
        GuidedQuestionsStep.tsx   # Decision tree (Task 22) -- CORRECT
        RecommendationStep.tsx    # Recommendation display (Task 23) -- CORRECT
        PreRegistrationStep.tsx   # Pre-reg form (Task 24) -- CORRECT
        ReviewStep.tsx            # Summary + create (Task 25) -- CORRECT
```

All files are `'use client'`. No server imports. The hook manages step navigation, answers, and derived recommendations. The shell renders the current step. This architecture is sound.

**Key implementation note:** The `EntityCreationWizard` component should use `apiFetch` from `client-browser.ts` (not `apiClient` from `client.ts`) for the final POST. Follow the existing `EntityFormSheet` pattern exactly.

---

## Recommendations Summary

| # | Priority | Recommendation | Plan Task |
|---|----------|---------------|-----------|
| 1 | P0 | Reconsider `/overview/entities/[id]` as a route -- use Sheet or expandable panel instead to maintain Overview section consistency | Task 14 |
| 2 | P1 | Specify client-safe API client (`client-browser.ts` / `apiFetch`) for all wizard and client component API calls; create separate client-side entity functions | Task 13 |
| 3 | P1 | Specify wizard as Sheet-based (`sm:max-w-2xl`), not full-screen modal or route-based | Task 19 |
| 4 | P1 | Accept double entity fetch (layout vs page) as intentional; document different projections | Task 10 |
| 5 | P1 | Use Option A exclusively for EntityFormSheet update; reject Option B (URL-based action) | Task 27 |
| 6 | P2 | Follow direct `await` pattern (like cash-flow) for entity list page, rely on `error.tsx` | Task 10 |
| 7 | P2 | Add `generateMetadata` for entity detail page with dynamic entity name | Task 14 |
| 8 | P2 | Include `description` in entities page metadata, matching cash-flow/net-worth pattern | Task 10 |
| 9 | P2 | Consider consolidating wizard steps from 8 files to 5 for maintainability | Tasks 18-25 |
| 10 | P2 | Clarify whether entity detail API returns relationships inline or requires separate fetch | Task 14 |
| 11 | P2 | Explicitly note `router.refresh()` requirement after wizard entity creation | Task 19 |

---

## Approval Status

- **Status:** CHANGES REQUIRED
- **Next.js Compliance:** AT RISK (P0-1 introduces an inconsistent navigation pattern; P1-1 risks a build-breaking server/client boundary violation)
- **Blocking Issues:** P0-1 (route architecture), P1-1 (API client boundary)
- **Non-Blocking but Important:** P1-2 (wizard container), P1-4 (Option B rejection)

The plan is architecturally sound in its Server/Client boundary design for the main entities list page and the wizard state machine. The primary concerns are (1) the entity detail sub-route breaking the Overview section's leaf-page pattern, and (2) the missing specification for which API client the wizard's client components should use. Addressing these two issues before implementation will prevent rework.
