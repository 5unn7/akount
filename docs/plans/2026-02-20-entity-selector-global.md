# Entity Selector — Global Filtering Plan

**Created:** 2026-02-20
**Status:** Approved (post-review)
**Subsumes:** UX-1 (entity selector hardcoded entities[0])
**Review:** [.reviews/entity-selector/REVIEW.md](../../.reviews/entity-selector/REVIEW.md) — 2 P0, 6 P1, 5 P2

## Overview

Make entity selection a persistent global preference that every screen respects. Currently the entity selector exists in the Navbar but 78% of pages ignore it. Users switch entities and see no change on banking, invoicing, client, and vendor pages. The EntityProvider and cookie persistence are already coded but not wired into the app.

**Not a key invariant** — entity selection is a UI preference (like locale/theme), not a data integrity rule. Unlike `tenantId` (security-critical), entity is a view filter that persists via cookie.

## Success Criteria

- [ ] Entity selection persists across page navigations via cookie
- [ ] "All Entities" option in Navbar dropdown shows consolidated view
- [ ] Banking, Invoicing, Client, Vendor pages all filter by selected entity
- [ ] Accounting pages force entity selection (disable "All Entities")
- [ ] Entity switch triggers data refresh on current page
- [ ] Single-entity users still see selector (future-proof for adding entities)
- [ ] Cookie entityId validated against user's entities (defense-in-depth)

## Architecture

```
                    Cookie: ak-entity-id
                           ↓ (read server-side)
    layout.tsx → validate against entities[] → EntityProvider(initialEntityId, entities)
                           ↓
        ┌──────────────────┼───────────────────┐
        ↓                  ↓                   ↓
    Navbar           Server Components     Client Components
   (setEntity)      (getEntitySelection)   (useEntity() hook)
        ↓
  Cookie update + router.refresh()
```

Server Components read `entityId` from cookie via existing `getEntitySelection()` in `entity-cookies.ts`. Client Components use `useEntity()` hook. `router.refresh()` in EntityProvider triggers Server Component re-render with new cookie value.

**Key security property:** Cookie entityId is validated against fetched entities in layout.tsx before passing downstream. Tampered cookies fall back to "All Entities" (null). Backend always enforces `tenantId` regardless.

## Review Findings Incorporated

| Finding | Resolution |
|---------|-----------|
| **P0-1:** Cookie entityId not validated | Added validation in Task 2 (layout validates against entities list) |
| **P0-2:** Service layer pattern unspecified | Task 7 specifies compound `entity: { tenantId, id }` pattern |
| **P1-1:** Cookie missing Secure flag, 365-day lifetime | Task 3 updates cookie: add Secure, reduce to 90 days |
| **P1-2:** router.refresh() re-fires layout fetches | Accepted for MVP, documented as known tradeoff |
| **P1-3:** Accounting pages require entityId | **Accounting pages force entity selection** — "All Entities" disabled on those pages |
| **P1-4:** Task 1 creates duplicate file | Task 1 now enhances existing `entity-cookies.ts` |
| **P1-5:** Transaction types already have entityId | Verified: frontend types have it, backend schema does NOT. Task 7 adds to backend. |
| **P1-6:** Multi-currency aggregation undefined | "All Entities" shows last-selected currency, with "(mixed)" warning if entities differ |
| **P2-5:** Stale entity cookie self-healing | EntityProvider auto-clears stale cookies (entity not in list → setEntity(null)) |

## Tasks

### Task 1: Enhance existing entity-cookies.ts with validation support
**File:** `apps/web/src/lib/entity-cookies.ts` (existing — NOT creating new file)
**What:** Add a `validateEntityId` helper that checks cookie value against a provided entities list. Returns null if entityId not found (stale/tampered). Keep existing `getEntitySelection()` unchanged for backward compat.
**Depends on:** none
**Success:** `validateEntityId(rawId, entities)` returns validated ID or null

```typescript
// Add to existing entity-cookies.ts:
export function validateEntityId(
  rawEntityId: string | null,
  entities: { id: string }[]
): string | null {
  if (!rawEntityId) return null;
  return entities.some(e => e.id === rawEntityId) ? rawEntityId : null;
}
```

### Task 2: Wire EntityProvider into dashboard layout with cookie validation
**File:** `apps/web/src/app/(dashboard)/layout.tsx`
**What:** Import EntityProvider, read cookies via `getEntitySelection()`, validate entityId against fetched entities list (P0-1 fix), wrap children. Pass validated `initialEntityId` + `entities`.
**Depends on:** Task 1
**Review:** `nextjs-app-router-reviewer`
**Success:** EntityProvider wraps dashboard, `useEntity()` works in any Client Component, tampered cookies gracefully fall back to null

```typescript
const { entityId: rawEntityId, currency } = await getEntitySelection();
const validatedEntityId = validateEntityId(rawEntityId, entities);

<EntityProvider
  entities={entities}
  initialEntityId={validatedEntityId}
  initialCurrency={currency}
>
  {/* existing layout content */}
</EntityProvider>
```

**Known tradeoff (P1-2):** `router.refresh()` re-executes layout fetches (onboarding + entities) on every entity switch. Accepted for MVP — Next.js fetch caching mitigates most of the cost.

### Task 3: Refactor Navbar to use EntityProvider + add "All Entities" + harden cookie
**File:** `apps/web/src/components/layout/Navbar.tsx`, `apps/web/src/providers/entity-provider.tsx`
**What:**
1. Replace `useSearchParams` entity/currency logic with `useEntity()` hook
2. Add "All Entities" as first dropdown item (sets `entityId: null`)
3. Show isPending loading state during entity switch
4. Update cookie helper: add `Secure` flag conditionally, reduce max-age to 90 days (P1-1)
5. Add stale entity self-healing: if entityId not in entities list, auto-clear to null (P2-5)
**Depends on:** Task 2
**Review:** `nextjs-app-router-reviewer`
**Success:** Entity selector uses context, "All Entities" option visible, entity switch triggers data refresh, cookie has Secure flag in production

### Task 4: Wire banking accounts page to entity cookie
**File:** `apps/web/src/app/(dashboard)/banking/accounts/page.tsx`
**What:** Read entity from `getEntitySelection()` + validate, pass `entityId` to `listAccounts()` and `listTransactions()`. API already supports entityId on accounts.
**Depends on:** Task 1
**Success:** Switching entity in Navbar filters accounts page to selected entity

### Task 5: Wire overview page to entity cookie
**File:** `apps/web/src/app/(dashboard)/overview/page.tsx`
**What:** Replace `searchParams.entityId` with `getEntitySelection()` + validate. Already passes entityId to `getDashboardMetrics` and `getPerformanceMetrics`. Add currency "(mixed)" indicator when entities have different currencies in "All Entities" mode (P1-6).
**Depends on:** Task 1
**Success:** Overview reads entity from cookie instead of URL params

### Task 6: Wire accounting pages — force entity selection, disable "All Entities"
**Files:**
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/page.tsx`
- `apps/web/src/app/(dashboard)/accounting/journal-entries/page.tsx`
- 7 report pages under `accounting/reports/*/page.tsx`
**What:** Replace `searchParams.entityId` with `getEntitySelection()` + validate. **If entityId is null (All Entities), fall back to first entity** rather than breaking the page. Show a subtle indicator: "Showing [Entity Name] — accounting requires entity selection." For Trial Balance and GL Ledger (which require entityId), this is mandatory. For P&L/BS/CF (which support optional), still use the selected entity.
**Depends on:** Task 1
**Success:** Accounting pages always have a valid entityId. No 500 errors when "All Entities" is active.

### Task 7: Add optional entityId to backend list schemas (clients, vendors, invoices, transactions)
**Files:**
- `apps/api/src/domains/clients/schemas/client.schema.ts` — add `entityId: z.string().cuid().optional()` to ListClientsSchema
- `apps/api/src/domains/vendors/schemas/vendor.schema.ts` — add to ListVendorsSchema
- `apps/api/src/domains/invoicing/schemas/invoice.schema.ts` — add to ListInvoicesSchema
- `apps/api/src/domains/banking/schemas/transaction.schema.ts` — add to ListTransactionsQuerySchema
- Corresponding service files for each domain
- Corresponding route files (destructure and pass entityId)
**What:** Add optional entityId query param to each list schema. Update service methods using the **compound pattern** matching `account.service.ts` (P0-2):
```typescript
entity: {
  tenantId: ctx.tenantId,
  ...(entityId && { id: entityId }),
},
```
**NOT** flat `where.entityId = entityId`. This ensures consistent defense-in-depth across all services.
**Depends on:** none
**Review:** `fastify-api-reviewer`, `security-sentinel`
**Success:** API list endpoints accept `?entityId=X` and filter results. Omitting entityId returns all entities (existing behavior).

### Task 8: Add entityId to frontend API clients
**Files:**
- `apps/web/src/lib/api/clients.ts` — add `entityId?: string` to ListClientsParams + forward in searchParams
- `apps/web/src/lib/api/vendors.ts` — same
- `apps/web/src/lib/api/invoices.ts` — same
- `apps/web/src/lib/api/transactions.ts` — add entityId forwarding to `listTransactions()` (types already have it)
**What:** Add entityId to params interfaces and forward in API calls.
**Depends on:** Task 7
**Success:** Frontend API client functions accept and forward entityId

### Task 9: Wire business pages to entity cookie (invoices, clients, vendors)
**Files:**
- `apps/web/src/app/(dashboard)/business/invoices/page.tsx`
- `apps/web/src/app/(dashboard)/business/clients/page.tsx`
- `apps/web/src/app/(dashboard)/business/vendors/page.tsx`
**What:** Read entity from `getEntitySelection()` + validate, pass to list API calls.
**Depends on:** Task 1, Task 8
**Success:** Business pages filter by selected entity

### Task 10: Backend tests for entityId filtering
**Files:** Existing test files for clients, vendors, invoices, transactions
**What:** Add test cases verifying:
1. `?entityId=X` filters results to that entity only
2. Omitting entityId returns all entities (backward compat)
3. Invalid entityId (valid CUID but wrong tenant) returns empty results (not error)
4. Tenant isolation maintained regardless of entityId value
**Depends on:** Task 7
**Review:** `security-sentinel`
**Success:** Tests pass confirming entityId filtering works and doesn't break existing behavior

## Implementation Order

```
Task 1 → Task 2 → Task 3 (foundation)
Task 4, Task 5 (parallel — already have API support)
Task 7 (backend — independent of frontend tasks)
Task 6 (accounting — needs entity-forced-selection logic)
Task 8 → Task 9 (business pages — needs Task 7 backend)
Task 10 (tests — needs Task 7 backend)
```

Optimized for fastest user-visible progress: banking + overview pages work after Tasks 1-5 without any backend changes.

## Reference Files

- `apps/web/src/lib/entity-cookies.ts` — existing cookie helper (Task 1 enhances this)
- `apps/web/src/providers/entity-provider.tsx` — EntityProvider (already complete)
- `apps/api/src/domains/banking/services/account.service.ts` — compound entityId filter pattern
- `apps/api/src/domains/accounting/schemas/report.schema.ts` — existing optional entityId pattern

## Edge Cases

- **First visit (no cookie):** Fall back to null → "All Entities" (aggregated view)
- **Stale cookie (entity deleted/archived):** `validateEntityId()` returns null → auto-cleared to "All Entities"
- **Single entity user:** Still show selector for consistency; when they add a second entity, it just works
- **"All Entities" on accounting pages:** Force-select first entity, show indicator message
- **Multi-currency "All Entities":** Show last-selected currency. If entities have mixed currencies, show "(mixed currencies)" badge near currency selector
- **Tampered cookie (foreign CUID):** Validated out by `validateEntityId()` → falls back to null. Backend returns empty results even if validation missed (tenantId gate).

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| Task 2 | `nextjs-app-router-reviewer` |
| Task 3 | `nextjs-app-router-reviewer` |
| Task 7 | `fastify-api-reviewer`, `security-sentinel` |
| Task 10 | `security-sentinel` |

## Domain Impact

- **Primary domains:** All 8 dashboard domains
- **Adjacent domains:** None — this is a cross-cutting UI concern, not a domain logic change
- **Migration impact:** None — no schema changes

## Testing Strategy

**Per-task verification:**
1. Tasks 1-3: Manual — entity switch in Navbar, check cookie set, check data refresh
2. Tasks 4-6: Manual — navigate to page, switch entity, verify data changes
3. Task 7: Automated — API tests with `?entityId=X` filter
4. Tasks 8-9: Manual — business pages filter by entity
5. Task 10: Automated — vitest run

**Smoke test flow:**
1. Log in → "All Entities" shown by default
2. Select "Entity A" → banking accounts page shows only Entity A's accounts
3. Navigate to invoices → still filtered by Entity A (cookie persists)
4. Select "All Entities" → see all invoices across entities
5. Navigate to Chart of Accounts → auto-selects first entity, shows indicator
6. Refresh page → entity selection preserved
7. Open new tab → same entity selection (shared cookie)
8. Tamper cookie in DevTools → next page load auto-clears to "All Entities"

## Progress

- [ ] Task 1: Enhance entity-cookies.ts with validation
- [ ] Task 2: Wire EntityProvider into layout + validate cookie
- [ ] Task 3: Navbar refactor + "All Entities" + cookie hardening
- [ ] Task 4: Banking accounts page
- [ ] Task 5: Overview page
- [ ] Task 6: Accounting pages (force entity selection)
- [ ] Task 7: Backend schemas + services (compound filter pattern)
- [ ] Task 8: Frontend API clients
- [ ] Task 9: Business pages (invoices, clients, vendors)
- [ ] Task 10: Backend tests
