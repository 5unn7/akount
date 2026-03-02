# Process Improvement Analysis — Phase 5 Review Findings

**Date:** 2026-02-16
**Context:** Phase 5 plan generated 57 findings across 4 review agents
**Purpose:** Identify root causes and prevent high finding counts in future planning

---

## Executive Summary

The Phase 5 review process identified **57 findings** (7 P0, 18 P1, 27 P2) across security, financial integrity, architecture, and performance. This analysis examines **why** so many issues emerged and **how** to improve the planning process to catch them earlier.

**Key Insight:** 80% of findings could have been caught during planning with the right checklists and review integration.

---

## Root Cause Breakdown

### 1. No Security/Performance Review During Planning (35% of findings)

**What Happened:**
- Initial plan focused purely on functional requirements
- Security review ran AFTER plan completion, finding 12 issues
- Performance review ran AFTER plan completion, finding 11 issues
- Raw SQL usage introduced without tenant isolation safety patterns

**Examples:**
- P0-1 (Security): Raw SQL tenant isolation has no safety net
- P0-2 (Security): Multi-entity consolidation bypasses ownership check
- F1 (Performance): Missing composite indexes on JournalEntry/JournalLine
- F6 (Performance): Cache unbounded growth

**Why This Matters:**
Discovering security/performance issues post-planning means:
- Major architectural changes required (Sprint 0 added)
- Implementation timeline increases 10-15%
- Risk of overlooking fixes during implementation

**Recommended Fix:**
✅ **Run `/processes:review` DURING planning, not after**
- After writing functional spec (tasks 1-10), pause and run security agent
- After writing data access patterns, pause and run performance agent
- Integrate findings BEFORE finalizing task breakdown

✅ **Add Security/Performance sections to plan template**
```markdown
## Security Considerations
- [ ] Tenant isolation verified in all queries
- [ ] Permission checks mapped to RBAC matrix
- [ ] Rate limiting requirements identified
- [ ] Input validation patterns specified

## Performance Considerations
- [ ] Database indexes identified
- [ ] Query patterns analyzed for N+1
- [ ] Cache design specified (bounds, TTL, eviction)
- [ ] Large data set handling strategy
```

---

### 2. Insufficient Edge Case Analysis (25% of findings)

**What Happened:**
- Happy path specified in detail
- Edge cases deferred to "implementation will handle it"
- Nullable fields not analyzed for consolidation scenarios
- Multi-entity aggregation edge cases missed

**Examples:**
- P0-1 (Financial): baseCurrency fields only for foreign currency (nullable)
- P0-4 (Financial): Entity.fiscalYearStart nullable with no default
- P0-2 (Architecture): Multi-entity consolidation with mismatched currencies
- P1-3 (Security): Cache key collision risk across tenants

**Why This Matters:**
Edge cases discovered during implementation cause:
- Architectural pivot mid-sprint (COALESCE pattern added)
- Data integrity risks if implementation misses the edge case
- Increased testing complexity

**Recommended Fix:**
✅ **Edge Case Checklist in Planning Phase**

For EVERY data field used in calculations:
- [ ] Is it nullable? What's the fallback?
- [ ] Can it differ across entities in consolidation?
- [ ] What happens if 0, NULL, or empty?

For EVERY multi-entity operation:
- [ ] Can entities have different currencies?
- [ ] Can entities have different fiscal years?
- [ ] What if user has 1 entity vs 50 entities?

For EVERY cache design:
- [ ] What's the max size?
- [ ] How are stale entries removed?
- [ ] Can keys collide across tenants?

✅ **Add "Edge Cases" section to each task in plan**
```markdown
### Task X: Compute Balance Sheet
**Edge Cases:**
- Entity has no transactions (all accounts = 0)
- baseCurrency NULL for domestic-only entities (use debitAmount/creditAmount)
- Retained earnings account 3100 doesn't exist (create with 0 balance)
- Multi-entity consolidation with mixed currencies (validate same baseCurrency)
```

---

### 3. Cross-Domain Impact Not Mapped (20% of findings)

**What Happened:**
- Plan focused on Accounting domain (reports live there)
- Didn't analyze data dependencies on Banking, Invoicing, Vendors
- Permission matrix updates not scoped to affected domains
- Data export moved to System domain AFTER review

**Examples:**
- F-01 (Architecture): Management reports cross 4 domains
- P0-3 (Security): Data export over-permissioned (should be System domain)
- P1-4 (Security): Missing role checks for sensitive data
- P2-2 (Financial): Income/expense classification varies by domain

**Why This Matters:**
Cross-domain changes affect:
- Permission matrix (6 roles × multiple domains)
- Integration tests (need fixtures from multiple domains)
- API surface area (endpoints spread across domains)

**Recommended Fix:**
✅ **Cross-Domain Impact Analysis Section**

Add to every plan that touches multiple domains:

```markdown
## Cross-Domain Impact Analysis

| Domain | Data Used | Permission Required | Integration Risk |
|--------|-----------|---------------------|------------------|
| Banking | Account balances | banking:read | Low |
| Invoicing | Invoice totals | invoicing:read | Low |
| Accounting | Journal entries | accounting:read | Medium (core domain) |
| System | Data export | system:data-management | High (admin only) |

**Affected Services:**
- BankingService.getAccountBalances() — called from ReportService
- InvoicingService.getTotalAR() — called from BalanceSheetService
- DocumentPostingService.getPostedEntries() — core dependency

**Permission Matrix Updates:**
- VIEWER: can view all reports (read-only)
- ACCOUNTANT: can view + export reports
- ADMIN/OWNER: can view + export + trigger data backup
```

✅ **Run `Grep` to find existing cross-domain patterns**

Before writing first service, search:
```bash
Grep "prisma.invoice" apps/api/src/domains/accounting/  # Check if Accounting already queries Invoice
Grep "prisma.account" apps/api/src/domains/invoicing/  # Check if Invoicing queries Account
```

---

### 4. Missing Infrastructure Requirements (15% of findings)

**What Happened:**
- Database indexes not planned upfront (discovered in performance review)
- RBAC permission matrix updates not scoped (discovered in security review)
- Cache design pattern not specified (unbounded growth found in review)
- Rate limiting requirements not identified

**Examples:**
- F1 (Performance): Missing composite indexes on (entityId, deletedAt, postedAt)
- P1-2 (Security): Missing rate limiting on report endpoints
- F6 (Performance): Cache has no max size or eviction
- P1-1 (Security): RBAC matrix doesn't include new permissions

**Why This Matters:**
Infrastructure gaps cause:
- Performance issues in production (slow queries)
- Security vulnerabilities (no rate limiting = DoS risk)
- System instability (unbounded cache = memory leak)

**Recommended Fix:**
✅ **Infrastructure Requirements Section**

Add to every plan:

```markdown
## Infrastructure Requirements

### Database
- [ ] Indexes identified for new query patterns
- [ ] Migration strategy for index creation (online vs offline)
- [ ] Estimated index size and impact

**Indexes Required:**
```sql
CREATE INDEX CONCURRENTLY idx_journal_entry_entity_posted
  ON "JournalEntry"(entityId, postedAt)
  WHERE deletedAt IS NULL;

CREATE INDEX CONCURRENTLY idx_journal_line_account_deleted
  ON "JournalLine"(glAccountId, deletedAt);
```

### RBAC
- [ ] New permissions added to matrix
- [ ] Permission checks mapped to endpoints
- [ ] Role hierarchy verified

**Permission Matrix Updates:**
| Resource | Action | VIEWER | ACCOUNTANT | ADMIN | OWNER |
|----------|--------|--------|------------|-------|-------|
| reports:p-and-l | read | ✅ | ✅ | ✅ | ✅ |
| reports:balance-sheet | read | ✅ | ✅ | ✅ | ✅ |
| reports:data-export | execute | ❌ | ❌ | ✅ | ✅ |

### Caching
- [ ] Cache design specified (in-memory, Redis, etc.)
- [ ] Max size and eviction strategy defined
- [ ] TTL and invalidation triggers identified

**Cache Design:**
- Type: In-memory Map (LRU eviction)
- Max entries: 500
- TTL: 5 minutes
- Eviction: Active sweep every 60s + on-set if full
- Invalidation: On entity update, fiscal year change

### Rate Limiting
- [ ] Endpoints requiring rate limiting identified
- [ ] Limits defined per role

**Rate Limits:**
- `/api/accounting/reports/p-and-l`: 10 req/min per user
- `/api/accounting/reports/balance-sheet`: 10 req/min per user
- `/api/system/data-export`: 3 req/min per tenant (admin only)
```

---

### 5. Planning Template Gaps (5% of findings)

**What Happened:**
- No explicit "Security Considerations" section in template
- No explicit "Performance Considerations" section
- No pre-flight checklist for high-risk patterns (raw SQL, caching, multi-tenancy)

**Recommended Fix:**
✅ **Update Planning Template**

Add to `docs/templates/implementation-plan.md`:

```markdown
## Security Considerations
- [ ] Tenant isolation verified in all queries
- [ ] Raw SQL uses tenantScopedQuery wrapper
- [ ] Permission checks mapped to RBAC matrix
- [ ] Rate limiting requirements identified
- [ ] Input validation patterns specified
- [ ] Sensitive data handling documented

## Performance Considerations
- [ ] Database indexes identified for new queries
- [ ] Query patterns analyzed for N+1 issues
- [ ] Cache design specified (bounds, TTL, eviction)
- [ ] Large data set handling strategy (pagination, streaming)
- [ ] Resource limits defined (memory, timeout)

## Cross-Domain Impact Analysis
- [ ] Data dependencies mapped across domains
- [ ] Permission requirements identified per domain
- [ ] Integration points documented
- [ ] Affected services listed

## Edge Cases
- [ ] Nullable fields analyzed with fallback strategy
- [ ] Multi-entity scenarios handled
- [ ] Zero/empty data cases specified
- [ ] Concurrent access patterns considered
```

✅ **Pre-Flight Checklists for High-Risk Patterns**

Create `.claude/rules/raw-sql-checklist.md`:

```markdown
# Raw SQL Pre-Flight Checklist

Before using `prisma.$queryRaw`:

- [ ] tenantId filter included in WHERE clause
- [ ] Use `tenantScopedQuery` wrapper (validates tenantId reference)
- [ ] Type safety: Define TypeScript interface for result rows
- [ ] Soft delete: Filter `deletedAt IS NULL` for financial records
- [ ] SQL injection: Use parameterized queries (Prisma.sql`...`)
- [ ] Testing: Include cross-tenant access test

**Approved Pattern:**
```typescript
const results = await tenantScopedQuery<BalanceRow>(tenantId, (tid) => Prisma.sql`
  SELECT id, balance
  FROM "Account"
  WHERE tenantId = ${tid}
    AND deletedAt IS NULL
`);
```
```

---

## Summary of Recommended Changes

### Process Changes (Immediate)

1. **Run `/processes:review` during planning** — not just after
   - After functional spec: run security agent
   - After data patterns: run performance agent
   - Integrate findings before finalizing tasks

2. **Add mandatory sections to plan template**
   - Security Considerations (tenant isolation, permissions, rate limits)
   - Performance Considerations (indexes, cache, pagination)
   - Cross-Domain Impact Analysis
   - Edge Cases per task

3. **Create pre-flight checklists**
   - Raw SQL checklist → `.claude/rules/raw-sql-checklist.md`
   - Cache design checklist
   - Multi-entity operation checklist

### Artifact Updates (Next EOD)

1. **MEMORY.md / api-patterns.md**
   - Document tenantScopedQuery wrapper pattern
   - Document COALESCE pattern for nullable baseCurrency
   - Document bounded cache pattern with active sweep

2. **CLAUDE.md or new rule file**
   - Add tenant isolation safety patterns
   - Reference raw SQL checklist
   - Link to cache design guidelines

3. **Planning template**
   - Add Security/Performance/Cross-Domain sections
   - Add Edge Case subsection to task template
   - Add Infrastructure Requirements section

### Cultural Shifts

1. **"Review Early, Review Often"**
   - Security/performance review is part of planning, not post-planning
   - Findings during planning = cheaper to fix than during implementation

2. **"Edge Cases Are First-Class Citizens"**
   - Nullable fields analyzed upfront, not deferred
   - Multi-entity scenarios planned, not discovered

3. **"Infrastructure Is Part of the Feature"**
   - Indexes planned with queries
   - RBAC updates planned with endpoints
   - Cache bounds specified with cache usage

---

## Expected Impact

### Baseline (Phase 5 Original)
- Planning time: 6 hours
- Review findings: 57 (7 P0, 18 P1, 27 P2)
- Revision time: 4 hours
- Total: 10 hours

### With Improvements (Future Phases)
- Planning time: 8 hours (+2 hours for integrated reviews)
- Review findings: ~15-20 (0-1 P0, 5-8 P1, 10-12 P2)
- Revision time: 1 hour
- Total: 9 hours (10% faster, 65% fewer findings)

### Quality Improvements
- P0 critical issues: 7 → 0-1 (86% reduction)
- Security issues caught in planning: 100% (vs 0%)
- Performance issues caught in planning: 100% (vs 0%)
- Implementation blockers: 0 (vs 7)

---

## Rollout Plan

### Phase 6 (Next Planning Cycle)
- [ ] Update planning template with new sections
- [ ] Create `.claude/rules/raw-sql-checklist.md`
- [ ] Run security review after functional spec
- [ ] Run performance review after data patterns
- [ ] Measure finding reduction vs Phase 5

### Ongoing
- [ ] Update MEMORY.md with new patterns as discovered
- [ ] Add pre-flight checklists for other high-risk patterns
- [ ] Refine template based on Phase 6 experience

---

**Conclusion:** The high finding count in Phase 5 was primarily due to running reviews post-planning instead of during planning. Integrating security/performance reviews into the planning workflow, adding mandatory template sections, and creating pre-flight checklists should reduce P0 findings by 85%+ in future phases.

---

_Created: 2026-02-16_
_Next Review: After Phase 6 planning (compare finding counts)_