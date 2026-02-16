# Service-Level Test Coverage Gap Analysis & Implementation Plan

**Created:** 2026-02-16
**Status:** Draft
**Type:** Test Infrastructure

---

## Executive Summary

**Current State:**
- Total Services: 27
- Services with Tests: 17 (63%)
- Services without Tests: 10 (37%)
- Current Test Suite: 720 tests passing (100%)

**Gap Analysis:**
- 10 services completely lack test coverage
- Existing tests have good financial invariant coverage but miss some edge cases
- Missing: concurrent operation tests, cross-domain integration tests, bulk operation stress tests

---

## Services Without Tests (Priority Order)

### HIGH RISK (Financial Data, Tenant Isolation Critical)

#### 1. `system/entity.service.ts` — **P0**
- **Why Critical:** Entity is the core multi-tenant boundary. Entity creation/updates affect GL accounts, invoices, payments, transactions across all domains.
- **Risk:** Tenant isolation breach, entity access control bypass
- **Complexity:** 4 methods (listEntities, getEntity, createEntity, updateEntity)
- **Lines:** ~120

**Missing Coverage:**
- Tenant isolation (create entity for wrong tenant)
- Duplicate entity name validation
- Fiscal year validation (1-12 range)
- Currency validation (ISO codes)
- Entity count limits per tenant

---

#### 2. `banking/category.service.ts` — **P0**
- **Why Critical:** Categories drive transaction classification for tax/reporting. Has complex deduplication logic that touches transactions, bill lines, invoice lines.
- **Risk:** Category deduplication bug could reassign transactions to wrong categories, breaking financial reports
- **Complexity:** 7 methods including deduplication algorithm
- **Lines:** ~459

**Missing Coverage:**
- Category deduplication logic (winner selection, transaction reassignment)
- Hierarchical category creation (parent/child validation)
- Duplicate name prevention within tenant+type
- Soft delete cascade to children
- Seed defaults idempotency
- Concurrent category creation race conditions
- Audit log creation

---

#### 3. `ai/categorization.service.ts` — **P1**
- **Why Critical:** Auto-categorizes transactions during import. Incorrect categorization affects financial reporting.
- **Risk:** Wrong categories applied at scale during bulk imports
- **Complexity:** 3 functions (categorizeTransaction, categorizeTransactions, learnFromCorrection)
- **Lines:** ~367

**Missing Coverage:**
- Keyword pattern matching accuracy (85+ known patterns)
- Batch categorization performance (N+1 query prevention)
- AI fallback when Perplexity unavailable
- Case-insensitive matching
- Category not found in tenant scenario
- Confidence score calculation

---

### MEDIUM RISK (Utility Services, Less Financial Impact)

#### 4. `banking/account-matcher.service.ts` — **P2**
- **Why Test:** Matches transactions to accounts during reconciliation
- **Risk:** Failed matches lead to manual reconciliation work
- **Lines:** Unknown (need to check size)

#### 5. `banking/duplication.service.ts` — **P2**
- **Why Test:** Detects duplicate transactions during import
- **Risk:** Duplicate transactions inflate balances
- **Lines:** Unknown

#### 6. `banking/parser.service.ts` — **P2**
- **Why Test:** Parses bank statement PDFs (CIBC, TD, RBC formats)
- **Risk:** Parse failures = manual data entry
- **Lines:** Unknown

#### 7. `ai/ai.service.ts` — **P3**
- **Why Test:** Perplexity API integration wrapper
- **Risk:** Low — mostly HTTP calls, errors are logged
- **Lines:** Unknown

#### 8. `system/audit-query.service.ts` — **P3**
- **Why Test:** Reads audit logs (no writes, low risk)
- **Risk:** Low — query-only service
- **Lines:** Unknown

#### 9. `system/health.service.ts` — **P3**
- **Why Test:** Health check endpoint
- **Risk:** Very low — monitoring only
- **Lines:** Unknown

#### 10. `system/user.service.ts` — **P2**
- **Why Test:** User management within tenant
- **Risk:** Medium — access control issues
- **Lines:** Unknown

---

## Gaps in Existing Service Tests

Even services WITH tests have coverage gaps:

### Missing Test Patterns Across Board

1. **Concurrent Operations**
   - No tests for race conditions (2 users creating same resource simultaneously)
   - Example: 2 users creating invoice with same number

2. **Cross-Domain Integration**
   - Tests mock adjacent services instead of testing real interactions
   - Example: Payment allocation creates journal entries — only tested via mocks

3. **Bulk Operations Stress**
   - Batch endpoints tested with 2-3 items, not realistic scale (100+ items)
   - Example: `categorizeTransactions` tested with 1-2 transactions, not 500

4. **Error Recovery**
   - Few tests for partial failures in transactions
   - Example: What if journal entry creation fails after payment is recorded?

5. **Foreign Key Constraints**
   - Missing tests for cascading behaviors (e.g., deleting entity with active accounts)

6. **Validation Edge Cases**
   - Boundary tests (max string lengths, numeric overflows)
   - Example: Invoice number >255 chars, amount >9_999_999_999_999

---

## Recommended Testing Patterns (Apply to ALL Services)

Based on `test-conventions.md` and existing best practices:

### Template: Comprehensive Service Test Suite

```typescript
describe('ServiceName', () => {
  // 1. CRUD Operations
  describe('create', () => {
    it('should create with valid data')
    it('should validate required fields')
    it('should reject invalid types')
    it('should enforce tenant isolation')
    it('should handle duplicate prevention')
  })

  describe('list', () => {
    it('should return paginated results')
    it('should filter by tenant')
    it('should exclude soft-deleted')
    it('should apply filters correctly')
    it('should handle empty results')
  })

  describe('get', () => {
    it('should return record by id')
    it('should return null when not found')
    it('should enforce tenant isolation')
    it('should exclude soft-deleted')
  })

  describe('update', () => {
    it('should update allowed fields')
    it('should reject updates to immutable fields')
    it('should enforce tenant isolation')
    it('should return null when not found')
  })

  describe('softDelete', () => {
    it('should set deletedAt timestamp')
    it('should keep record in database')
    it('should enforce tenant isolation')
    it('should handle cascade if applicable')
  })

  // 2. Financial Invariants (if applicable)
  describe('financial invariants', () => {
    it('should use integer cents for all amounts')
    it('should maintain double-entry balance')
    it('should preserve source documents')
  })

  // 3. Edge Cases
  describe('edge cases', () => {
    it('should handle concurrent creates')
    it('should validate boundary values')
    it('should handle database errors gracefully')
  })
})
```

---

## Implementation Plan

### Sprint 1: High-Risk Services (P0) — ~8 hours

#### Task 1.1: EntityService Tests
**File:** `apps/api/src/domains/system/services/__tests__/entity.service.test.ts`
**What:** Comprehensive test suite for entity CRUD with tenant isolation
**Depends on:** none
**Risk:** High — core tenant boundary
**Success:**
- All CRUD operations tested
- Tenant isolation verified (cross-tenant access rejected)
- Fiscal year validation (1-12 range)
- Currency validation (ISO codes)
- At least one test for concurrent entity creation

**Test Cases (minimum 15):**
- listEntities filters by tenantId
- listEntities excludes other tenants
- getEntity returns entity with counts
- getEntity returns null for wrong tenant
- createEntity validates required fields
- createEntity defaults reportingCurrency to functionalCurrency
- createEntity defaults fiscalYearStart to 1
- createEntity accepts valid entity types
- createEntity validates country code
- createEntity validates currency code
- updateEntity enforces tenant isolation
- updateEntity returns null when not found
- updateEntity only updates allowed fields
- concurrent createEntity with same name

---

#### Task 1.2: CategoryService Tests
**File:** `apps/api/src/domains/banking/services/__tests__/category.service.test.ts`
**What:** Full test coverage including deduplication algorithm
**Depends on:** none
**Risk:** High — affects financial reporting
**Review:** `financial-data-validator` (soft delete), `security-sentinel` (tenant isolation)
**Success:**
- All 7 methods tested (list, get, create, update, softDelete, seedDefaults, deduplicateCategories)
- Deduplication logic verified (winner selection based on transaction count)
- Transaction reassignment tested
- Audit log creation verified
- Hierarchical validation (parent/child)

**Test Cases (minimum 25):**
- listCategories filters by tenantId
- listCategories filters by type
- listCategories filters by isActive
- listCategories includes/excludes children based on param
- listCategories excludes soft-deleted
- getCategory returns category with children and count
- getCategory returns null when not found
- getCategory enforces tenant isolation
- createCategory validates parent belongs to tenant
- createCategory rejects duplicate name within tenant+type
- createCategory creates audit log
- updateCategory rejects self-parent
- updateCategory validates parent exists
- updateCategory rejects duplicate name
- updateCategory creates audit log
- softDeleteCategory sets deletedAt
- softDeleteCategory cascades to children
- softDeleteCategory creates audit log
- seedDefaults is idempotent
- seedDefaults calls deduplicateCategories first
- deduplicateCategories groups by name+type
- deduplicateCategories keeps category with most transactions
- deduplicateCategories reassigns transactions from losers
- deduplicateCategories soft-deletes duplicates
- deduplicateCategories creates audit log when duplicates found

---

#### Task 1.3: CategorizationService Tests
**File:** `apps/api/src/domains/ai/services/__tests__/categorization.service.test.ts`
**What:** Test keyword matching, batch categorization, AI fallback
**Depends on:** none
**Risk:** Medium — affects transaction classification at scale
**Success:**
- Keyword pattern matching tested (sample of common patterns)
- Batch categorization tested (50+ transactions)
- AI fallback tested when Perplexity unavailable
- Confidence scores validated
- Category not found scenario tested

**Test Cases (minimum 20):**
- categorizeTransaction matches "starbucks" → Meals & Entertainment
- categorizeTransaction matches "uber" → Transportation
- categorizeTransaction matches "aws" → Software & Subscriptions
- categorizeTransaction matches multiple keywords (highest confidence wins)
- categorizeTransaction returns categoryId when found in tenant
- categorizeTransaction returns null categoryId when not found in tenant
- categorizeTransaction returns null when no match
- categorizeTransaction confidence is 85 for keyword matches
- categorizeTransactions batch (50 items) completes efficiently
- categorizeTransactions avoids N+1 queries (single category fetch)
- categorizeTransactions handles case-insensitive matching
- categorizeTransactions handles partial category name matches
- categorizeTransaction uses AI when Perplexity available (mock)
- categorizeTransaction skips AI when Perplexity unavailable
- categorizeTransaction handles AI errors gracefully
- learnFromCorrection logs to logger (placeholder test)

---

### Sprint 2: Medium-Risk Services (P2) — ~6 hours

#### Task 2.1: AccountMatcherService Tests
**File:** `apps/api/src/domains/banking/services/__tests__/account-matcher.service.test.ts`
**What:** Test transaction-to-account matching logic
**Depends on:** Read account-matcher.service.ts to understand methods
**Risk:** Medium — affects reconciliation accuracy
**Success:** All matching methods tested, edge cases covered

---

#### Task 2.2: DuplicationService Tests
**File:** `apps/api/src/domains/banking/services/__tests__/duplication.service.test.ts`
**What:** Test duplicate transaction detection
**Depends on:** Read duplication.service.ts to understand algorithm
**Risk:** Medium — duplicate transactions inflate balances
**Success:** Duplicate detection algorithm tested, false positive scenarios tested

---

#### Task 2.3: UserService Tests
**File:** `apps/api/src/domains/system/services/__tests__/user.service.test.ts`
**What:** Test user management within tenant
**Depends on:** Read user.service.ts
**Risk:** Medium — access control
**Success:** User CRUD tested, role validation tested

---

### Sprint 3: Low-Risk Services (P3) — ~4 hours

#### Task 3.1: ParserService Tests
**File:** `apps/api/src/domains/banking/services/__tests__/parser.service.test.ts`
**What:** Test PDF parsing for bank statements
**Depends on:** Read parser.service.ts
**Risk:** Low — parse failures are recoverable
**Success:** Each bank format tested with sample PDF

---

#### Task 3.2: AIService Tests
**File:** `apps/api/src/domains/ai/services/__tests__/ai.service.test.ts`
**What:** Test Perplexity integration wrapper
**Depends on:** Read ai.service.ts
**Risk:** Low — HTTP client wrapper
**Success:** API calls tested, error handling tested

---

#### Task 3.3: AuditQueryService Tests
**File:** `apps/api/src/domains/system/services/__tests__/audit-query.service.test.ts`
**What:** Test audit log queries
**Depends on:** Read audit-query.service.ts
**Risk:** Low — read-only service
**Success:** Query methods tested

---

#### Task 3.4: HealthService Tests
**File:** `apps/api/src/domains/system/services/__tests__/health.service.test.ts`
**What:** Test health check endpoint
**Depends on:** Read health.service.ts
**Risk:** Very low — monitoring
**Success:** Health check methods tested

---

### Sprint 4: Enhance Existing Tests — ~6 hours

#### Task 4.1: Add Concurrent Operation Tests
**Files:** Enhance existing test suites (account.service.test.ts, invoice.service.test.ts, payment.service.test.ts)
**What:** Add race condition tests (2+ users creating same resource)
**Depends on:** Sprint 1-3 complete
**Success:** At least 1 concurrency test per high-risk service

---

#### Task 4.2: Add Bulk Operation Stress Tests
**Files:** Enhance batch endpoints (categorizeTransactions, import.service.test.ts)
**What:** Test with 100+ items, verify performance
**Depends on:** Sprint 1-3 complete
**Success:** Batch tests use realistic scale (100+ items)

---

#### Task 4.3: Add Error Recovery Tests
**Files:** Enhance transaction services (payment.service.test.ts, invoice.service.test.ts)
**What:** Test partial failures in $transaction blocks
**Depends on:** Sprint 1-3 complete
**Success:** Error scenarios tested (rollback behavior verified)

---

## Reference Files

- `apps/api/src/test-utils/financial-assertions.ts` — Reusable test assertions
- `apps/api/src/domains/banking/services/__tests__/account.service.test.ts` — Gold standard test pattern
- `apps/api/src/domains/invoicing/services/__tests__/payment.service.test.ts` — Financial invariant examples
- `.claude/rules/test-conventions.md` — Test conventions and requirements
- `.claude/rules/financial-rules.md` — Financial invariants to test

---

## Testing Strategy

### Test Data Patterns
- Use `MOCK_*` constants for reusable test data
- Always use integer cents (e.g., 100000 = $1,000.00)
- Use descriptive tenant/user IDs (e.g., `TENANT_ID = 'tenant-abc-123'`)

### Mock Patterns
- Mock Prisma client methods at module level
- Use `vi.fn()` for mocked methods
- Clear mocks in `beforeEach` to prevent test pollution

### Assertion Patterns
- Use `assertIntegerCents()` for all monetary values
- Use `assertMoneyFields()` for objects with multiple money fields
- Use `assertSoftDeleted()` for soft delete verification
- Always test tenant isolation with at least one "wrong tenant" test

### Coverage Goals
- **Per Service:** Minimum 80% line coverage
- **Critical Paths:** 100% coverage (CRUD, tenant isolation, financial invariants)
- **Edge Cases:** At least 3 edge case tests per service

---

## Domain Impact

- **Primary Domains:** Banking, System, AI
- **Adjacent Domains:** Accounting (category affects journal entries), Invoicing (category affects line items)
- **Cross-Domain:** Entity changes affect all domains (tenant boundary)

---

## Review Agent Coverage

| Task | Relevant Agents |
|------|-----------------|
| Task 1.1 (EntityService) | `security-sentinel` (tenant isolation) |
| Task 1.2 (CategoryService) | `financial-data-validator` (soft delete), `security-sentinel` (tenant isolation) |
| Task 1.3 (CategorizationService) | None (utility service) |
| All Sprints | `kieran-typescript-reviewer` (type safety) |

---

## Progress Tracking

### Sprint 1 (P0 Services)
- [ ] Task 1.1: EntityService Tests (~3 hours)
- [ ] Task 1.2: CategoryService Tests (~4 hours)
- [ ] Task 1.3: CategorizationService Tests (~2 hours)

### Sprint 2 (P2 Services)
- [ ] Task 2.1: AccountMatcherService Tests (~2 hours)
- [ ] Task 2.2: DuplicationService Tests (~2 hours)
- [ ] Task 2.3: UserService Tests (~2 hours)

### Sprint 3 (P3 Services)
- [ ] Task 3.1: ParserService Tests (~1 hour)
- [ ] Task 3.2: AIService Tests (~1 hour)
- [ ] Task 3.3: AuditQueryService Tests (~1 hour)
- [ ] Task 3.4: HealthService Tests (~1 hour)

### Sprint 4 (Enhancement)
- [ ] Task 4.1: Add Concurrent Operation Tests (~2 hours)
- [ ] Task 4.2: Add Bulk Operation Stress Tests (~2 hours)
- [ ] Task 4.3: Add Error Recovery Tests (~2 hours)

---

## Success Criteria

- [ ] All 10 untested services have test suites
- [ ] Test count increases from 720 to 900+ (180+ new tests)
- [ ] All new tests pass (100% pass rate maintained)
- [ ] Service test coverage reaches 90%+
- [ ] All financial invariants tested per `test-conventions.md`
- [ ] At least 1 tenant isolation test per service
- [ ] At least 1 concurrent operation test for high-risk services
- [ ] Documentation updated: MEMORY.md (testing patterns learned)

---

## Estimated Effort

- **Sprint 1 (P0):** 8 hours
- **Sprint 2 (P2):** 6 hours
- **Sprint 3 (P3):** 4 hours
- **Sprint 4 (Enhancement):** 6 hours
- **Total:** ~24 hours (~3 days)

---

## Next Steps

1. **Review this plan** — Confirm priorities and scope
2. **Run `/processes:work`** — Execute Sprint 1 tasks systematically
3. **Iterate** — After Sprint 1, review test patterns and adjust Sprint 2-4 as needed

---

_Plan generated: 2026-02-16 | Based on: 27 services, 17 with tests, 720 current tests_
