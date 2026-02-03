# Implementation Plan: Today's Tasks (2026-02-03)

**Date:** 2026-02-03
**Type:** Daily Work Plan
**Status:** Planning
**Related:**
- `docs/plans/2026-02-02-expert-review-now-items.md` (foundational work - DONE)
- `TASKS.md` (code review fixes + Phase 1 work)
- `STATUS.md` (current state)

---

## Summary

Today's work focuses on two parallel tracks:
1. **Complete High Priority Code Review Fixes (CR.5-CR.9)** - Security and performance improvements identified from multi-agent review
2. **Start Phase 1 Frontend Integration** - Connect dashboard to real API data

Yesterday completed the CRITICAL fixes (CR.1-CR.4) and the expert review NOW items (soft deletes, indexes, CI/CD, security headers, tests). Today continues that momentum.

---

## User Story

As a **developer**, I want to **complete code review fixes and start frontend integration** so that **the codebase is production-ready and users can see real financial data**.

---

## Success Criteria

- [ ] CR.5: Remove `any` default from API client
- [ ] CR.6: Add pagination to listAccounts
- [ ] CR.7: Configure rate limit trust proxy
- [ ] CR.8: Fix arbitrary tenant selection (add ordering)
- [ ] CR.9: Add CUID validation to ID params
- [ ] Dashboard connected to real API data
- [ ] All changes committed and CI passing

---

## Today's Tasks Overview

| Track | Task | Priority | Effort |
|-------|------|----------|--------|
| Code Review | CR.5: Remove `any` default | HIGH | 15min |
| Code Review | CR.6: Add pagination to listAccounts | HIGH | 45min |
| Code Review | CR.7: Rate limit trust proxy | HIGH | 15min |
| Code Review | CR.8: Fix tenant selection ordering | HIGH | 15min |
| Code Review | CR.9: Add CUID validation | HIGH | 30min |
| Phase 1 | Dashboard API integration | MEDIUM | 2-3h |
| Phase 1 | Entity filter dropdown | MEDIUM | 1h |

**Total Estimated Effort:** 5-6 hours

---

## Track 1: Code Review Fixes (HIGH Priority)

### CR.5: Remove `any` Default from API Client

**File:** `apps/web/src/lib/api/client.ts:7`

**Problem:** `apiClient<T = any>` defeats type safety when callers forget to specify types.

**Fix:**
```typescript
// BEFORE
export async function apiClient<T = any>(...)

// AFTER
export async function apiClient<T>(...)
```

**Verification:**
- TypeScript will error on callers without explicit type argument
- Find and fix any callers that relied on implicit `any`

**Acceptance Criteria:**
- [ ] Default `any` removed
- [ ] All callers provide explicit type arguments
- [ ] No TypeScript errors

---

### CR.6: Add Pagination to listAccounts

**Files:**
- `apps/api/src/services/account.service.ts`
- `apps/api/src/routes/accounts.ts`
- `apps/web/src/lib/api/accounts.ts`

**Problem:** Current implementation fetches ALL accounts, will fail at scale (1000+ accounts).

**API Changes:**
```typescript
// Request params (add to Zod schema)
{
  cursor?: string;    // For cursor-based pagination
  limit?: number;     // Default 50, max 100
}

// Response shape
{
  accounts: Account[];
  nextCursor?: string;  // For fetching next page
  hasMore: boolean;
}
```

**Service Changes:**
```typescript
async listAccounts(params: {
  tenantId: string;
  entityId?: string;
  cursor?: string;
  limit?: number;
}) {
  const limit = Math.min(params.limit || 50, 100);

  const accounts = await prisma.account.findMany({
    where: {
      tenantId: params.tenantId,
      entityId: params.entityId,
      deletedAt: null,
    },
    take: limit + 1,  // Fetch one extra to check hasMore
    ...(params.cursor && {
      cursor: { id: params.cursor },
      skip: 1,  // Skip the cursor record
    }),
    orderBy: { createdAt: 'desc' },
  });

  const hasMore = accounts.length > limit;
  const data = hasMore ? accounts.slice(0, limit) : accounts;

  return {
    accounts: data,
    nextCursor: hasMore ? data[data.length - 1].id : undefined,
    hasMore,
  };
}
```

**Acceptance Criteria:**
- [ ] Service accepts cursor and limit params
- [ ] API route validates limit (max 100)
- [ ] Response includes nextCursor and hasMore
- [ ] Frontend handles pagination (or uses default limit)

---

### CR.7: Configure Rate Limit Trust Proxy

**File:** `apps/api/src/index.ts`

**Problem:** Without trust proxy, rate limiting uses wrong IP behind reverse proxy (X-Forwarded-For spoofing).

**Fix:**
```typescript
// Configure before rate limit
const app = Fastify({
  trustProxy: true,  // Trust X-Forwarded-For from trusted proxies
  logger: true,
});

// Rate limit already configured (yesterday), verify keyGenerator
```

**Verification:**
- Test with X-Forwarded-For header
- Confirm correct IP is used for rate limiting

**Acceptance Criteria:**
- [ ] `trustProxy: true` set in Fastify config
- [ ] Rate limiting uses correct client IP

---

### CR.8: Fix Arbitrary Tenant Selection

**File:** `apps/api/src/middleware/tenant.ts:30-47`

**Problem:** Users with multiple tenants get arbitrary tenant assigned (non-deterministic).

**Fix:**
```typescript
// BEFORE
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: user.id },
});

// AFTER - deterministic ordering
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: user.id },
  orderBy: { createdAt: 'asc' },  // Always get oldest tenant
});
```

**Future Enhancement:** Add tenant selection header for multi-tenant users (deferred to Phase 2).

**Acceptance Criteria:**
- [ ] `findFirst` includes `orderBy: { createdAt: 'asc' }`
- [ ] Same user always gets same tenant

---

### CR.9: Add CUID Validation to ID Params

**File:** `apps/api/src/routes/accounts.ts:14-15`

**Problem:** ID params accept arbitrary strings, enabling enumeration attacks.

**Fix:**
```typescript
// BEFORE
params: z.object({
  id: z.string(),
})

// AFTER - validates CUID format
params: z.object({
  id: z.string().cuid(),
})
```

**Apply to all route files:**
- `apps/api/src/routes/accounts.ts`
- `apps/api/src/routes/entities.ts`
- `apps/api/src/routes/dashboard.ts`
- Any other routes with ID params

**Acceptance Criteria:**
- [ ] All ID params use `z.string().cuid()`
- [ ] Invalid IDs return 400 Bad Request

---

## Track 2: Phase 1 Frontend Integration

### Task 1.1: Dashboard API Integration

**Goal:** Connect dashboard to GET /api/dashboard/metrics

**Files to Modify:**
- `apps/web/src/app/(dashboard)/page.tsx` (or dashboard page)
- `apps/web/src/lib/api/dashboard.ts` (create if needed)
- `apps/web/src/components/dashboard/MetricsCards.tsx` (modify)

**Implementation Approach:**

1. **Create API function:**
```typescript
// apps/web/src/lib/api/dashboard.ts
import { apiClient } from './client';

interface DashboardMetrics {
  netWorth: number;
  cashPosition: number;
  totalAssets: number;
  totalLiabilities: number;
  currency: string;
}

export async function getDashboardMetrics(entityId?: string) {
  return apiClient<DashboardMetrics>('/dashboard/metrics', {
    params: entityId ? { entityId } : undefined,
  });
}
```

2. **Fetch in Server Component:**
```typescript
// apps/web/src/app/(dashboard)/page.tsx
import { getDashboardMetrics } from '@/lib/api/dashboard';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      <MetricsCards metrics={metrics} />
    </div>
  );
}
```

3. **Display real data:**
- Replace mock KPI values with actual metrics
- Format currency values (divide by 100 for display)
- Add loading state (loading.tsx)
- Add error boundary (error.tsx)

**Acceptance Criteria:**
- [ ] Dashboard fetches metrics from API
- [ ] KPI cards show real data
- [ ] Loading state displays during fetch
- [ ] Error state handles API failures

---

### Task 1.2: Entity Filter Dropdown

**Goal:** Allow users to filter dashboard by entity

**Files to Modify:**
- `apps/web/src/components/dashboard/EntityFilter.tsx` (create)
- `apps/web/src/app/(dashboard)/page.tsx`

**Implementation Approach:**

1. **Create EntityFilter component:**
```typescript
// apps/web/src/components/dashboard/EntityFilter.tsx
'use client';

import { Select } from '@/components/ui/select';

interface EntityFilterProps {
  entities: Array<{ id: string; name: string }>;
  selectedId?: string;
  onChange: (entityId: string | undefined) => void;
}

export function EntityFilter({ entities, selectedId, onChange }: EntityFilterProps) {
  return (
    <Select value={selectedId || 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
      <SelectTrigger>
        <SelectValue placeholder="All Entities" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Entities</SelectItem>
        {entities.map((entity) => (
          <SelectItem key={entity.id} value={entity.id}>
            {entity.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

2. **Add URL state management:**
- Use `searchParams` for entity filter state
- Update URL when filter changes
- Refetch metrics when entity changes

**Acceptance Criteria:**
- [ ] Dropdown shows all user's entities
- [ ] "All Entities" option shows combined view
- [ ] Selecting entity filters dashboard data
- [ ] Filter state persists in URL

---

## Implementation Phases

### Phase 1: Code Review Fixes (Morning - 2 hours)

**Order:**
1. CR.7: Trust proxy (quick fix, security)
2. CR.8: Tenant ordering (quick fix, determinism)
3. CR.5: Remove `any` (type safety)
4. CR.9: CUID validation (security)
5. CR.6: Pagination (performance, largest change)

**Review Points:**
- Run TypeScript checks after each change
- Run tests to ensure nothing breaks

### Phase 2: Frontend Integration (Afternoon - 3-4 hours)

**Order:**
1. Create dashboard API function
2. Update dashboard page to fetch real data
3. Add loading.tsx and error.tsx
4. Create EntityFilter component
5. Wire up filter to URL state

**Review Points:**
- Test with real database data
- Verify tenant isolation (can't see other tenant's data)
- Check performance (< 200ms response)

---

## Testing Strategy

**After Code Review Fixes:**
- Run `npm run typecheck` - no errors
- Run `npm run test` - all pass
- Manual test rate limiting (verify 429)
- Test with invalid CUIDs (verify 400)

**After Frontend Integration:**
- Navigate to dashboard as authenticated user
- Verify real metrics display
- Test entity filter changes data
- Test loading state (add network throttling)
- Test error state (stop API server)

---

## Security Considerations

- [ ] Rate limit configured with trust proxy
- [ ] ID validation prevents enumeration
- [ ] Tenant isolation verified
- [ ] No sensitive data in logs

---

## Performance Considerations

- [ ] Pagination prevents large result sets
- [ ] Dashboard metrics cached (React cache/revalidate)
- [ ] Entity list fetched once, not per filter change

---

## Open Questions

1. **Pagination UX:** Should accounts page show "Load More" button or infinite scroll?
   - Recommendation: Start with "Load More" (simpler)

2. **Entity filter persistence:** Use URL params or session storage?
   - Recommendation: URL params (shareable, bookmarkable)

---

## Rollback Plan

All changes are backward compatible:
- Pagination: API returns same data if no cursor provided
- CUID validation: Existing valid IDs will pass
- Trust proxy: No behavior change for valid requests

If frontend breaks:
- Revert to mock data while debugging
- API changes are independent

---

## Next Steps After Today

1. **CR.10-CR.13:** Medium/Low priority fixes (can defer)
2. **Account List Page:** Create /accounts route with real data
3. **Currency Toggle:** Add CAD/USD display toggle
4. **Testing:** Add frontend component tests

---

## Resources

- TASKS.md - Full task definitions
- `docs/architecture/decisions.md` - Tech decisions
- `docs/standards/api-design.md` - API patterns
- `docs/design-system/` - UI component guidelines

---

## Estimation

**Complexity:** Medium
**Effort:** 5-6 hours
**Risk:** Low (incremental improvements)

**Risk Factors:**
- TypeScript errors when removing `any` default
- Pagination may require frontend changes

---

**Plan Status:** Ready for Implementation
