# Planning System Upgrade — Additional Improvements

**Date:** 2026-02-16
**Source:** Onboarding review patterns, past session analysis, industry frameworks
**Status:** DRAFT — To be merged into main planning system upgrade plan

---

## Overview

This document contains additional improvements gathered from:
1. ✅ Onboarding flow review patterns (cross-agent synthesis)
2. ✅ Past session repeated issues (2026-02-15 to 2026-02-16)
3. 🔄 Industry frameworks (ADRs, threat modeling) — research in progress
4. ✅ Domain-specific checklists (frontend, migrations, testing)

---

## Section 1: Patterns from Onboarding Review

### 1.1: Cross-Agent Pattern Detection

**Learning:** Issues flagged by multiple agents have the highest confidence and should be prioritized.

**Add to template:**

```markdown
## Cross-Agent Validation Checkpoints

After running each agent review, compare findings:

- [ ] **P0 issues flagged by 2+ agents** — These are HIGH CONFIDENCE blockers
- [ ] **P0 issues flagged by 1 agent** — Verify with code inspection before dismissing
- [ ] **Repeated anti-patterns** — Same issue across multiple tasks = systemic problem

**Pattern Matrix:** (fill during review)

| Issue | Security | Prisma | Next.js | Arch | Priority |
|-------|----------|--------|---------|------|----------|
| [Example: Missing userId field] | ✓ | ✓ | - | ✓ | P0 ×3 |

**Rule:** If 3+ agents flag the same issue → Add to Sprint 0 as BLOCKER
```

**Add to `.claude/skills/processes-review.md`:**

```markdown
### Step 5.5: Cross-Agent Pattern Analysis (NEW)

After all agents complete, analyze cross-agent patterns:

1. Create issue matrix (issue × agents)
2. Identify issues flagged by 2+ agents (highest confidence)
3. Upgrade priority if cross-flagged:
   - P1 → P0 if flagged by 3+ agents
   - P2 → P1 if flagged by 2+ agents
4. Note in synthesis: "Cross-agent issue (×N agents)"
```

---

### 1.2: Alternative Approach Analysis

**Learning:** Architecture agent proposed 3 alternatives with effort/risk estimates. This helped user choose simpler path (2 days vs 10-13 days).

**Add to template:**

```markdown
## Alternative Architectural Approaches

For complex changes (middleware, state management, multi-domain), propose 2-3 alternatives:

### Alternative 1: [Name] (RECOMMENDED if lowest risk)
**Approach:** [Description]
**Effort:** X days
**Risk:** LOW/MEDIUM/HIGH
**Pros:**
- [Benefit 1]
**Cons:**
- [Tradeoff 1]

### Alternative 2: [Name]
[Same structure]

### Alternative 3: [Name]
[Same structure]

**Decision Matrix:**

| Approach | Effort | Risk | Complexity | Score |
|----------|--------|------|------------|-------|
| Alt 1 | 2d | LOW | Simple | ⭐⭐⭐⭐⭐ |
| Alt 2 | 7d | MED | Moderate | ⭐⭐⭐ |
| Alt 3 | 10d | HIGH | Complex | ⭐⭐ |
```

---

### 1.3: Architectural Questions Framework

**Learning:** Architecture agent posed 6 key questions that surfaced hidden assumptions.

**Add to planning template:**

```markdown
## Architectural Questions

Answer these BEFORE finalizing plan:

1. **Does this change break existing contracts?**
   - What assumptions does current code make?
   - Which files depend on these assumptions?

2. **Can the system maintain isolation WITHOUT middleware guarantees?**
   - How many files use request.tenantId?
   - What breaks if this becomes optional?

3. **What happens in concurrent scenarios?**
   - Multiple tabs open?
   - Rapid button clicking?
   - Simultaneous API calls?

4. **How do we recover from partial failures?**
   - What happens if step 3 of 5 fails?
   - Are external API calls inside or outside transactions?

5. **What's the cache invalidation strategy?**
   - When does cached data become stale?
   - How do users recover from stale redirects?

6. **Should this be a separate bounded context?**
   - Is this feature orthogonal to main system?
   - Would separate service/module simplify?
```

---

## Section 2: Repeated Issues from Past Sessions

### 2.1: Import Pattern Issues (Turbopack)

**Frequency:** 2 occurrences (2026-02-16 sessions)
**Pattern:** `import { type X }` breaks Turbopack, must use `import type { X }`

**Add to `.claude/rules/frontend-conventions.md`:**

```markdown
## Critical: Turbopack Type Import Pattern

**ALWAYS use declaration-level type imports:**

```typescript
// ✅ CORRECT - Declaration-level
import type { Invoice, Client } from '@/types'

// ❌ WRONG - Inline type specifier (breaks Turbopack)
import { type Invoice, type Client } from '@/types'
```

**Why:** Turbopack only recognizes `import type` at declaration level. Inline `type` specifiers cause full module graph tracing (slow builds, potential circular deps).

**Enforcement:** Add to pre-commit hook or ESLint rule.
```

**Add to pre-commit hook check:**

```bash
# Check for inline type imports
if git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -E 'import \{ type ' >/dev/null; then
  echo "❌ ERROR: Found inline type imports (import { type X })"
  echo "   Use declaration-level instead: import type { X }"
  echo "   Files:"
  git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -l 'import { type '
  exit 1
fi
```

---

### 2.2: Zod Schema `.refine()` + `.partial()` Incompatibility

**Frequency:** 2 occurrences (invoice.schema.ts, bill.schema.ts)
**Pattern:** `.partial()` called on `ZodEffects` (result of `.refine()`) fails

**Add to `.claude/rules/api-conventions.md`:**

```markdown
## Zod Schema Patterns

### Pattern: Base Schema + Refinements

When you need BOTH `.partial()` and `.refine()`, extract a base schema:

```typescript
// ✅ CORRECT
const CreateInvoiceBaseSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().int(),
  // ... fields
})

// Apply refinements separately
const CreateInvoiceSchema = CreateInvoiceBaseSchema.refine(
  data => data.dueDate > data.issueDate,
  { message: 'Due date must be after issue date' }
)

// Use base for .partial()
const UpdateInvoiceSchema = CreateInvoiceBaseSchema.partial()

// ❌ WRONG
const CreateInvoiceSchema = z.object({ ... }).refine(...)
const UpdateInvoiceSchema = CreateInvoiceSchema.partial()
// TypeError: .partial is not a function (on ZodEffects)
```

**Rule:** NEVER call `.partial()` on a schema with `.refine()` applied. Always extract base schema first.
```

---

### 2.3: apiClient Obscures HTTP Error Details

**Frequency:** 1 occurrence, but impacts debugging across all API calls
**Pattern:** apiClient replaces fetch errors with JSON body message, losing HTTP status context

**Add to `.claude/rules/frontend-conventions.md`:**

```markdown
## API Client Usage Guidelines

### When to Use Direct fetch vs apiClient

**Use `apiClient` for:**
- Standard CRUD operations
- Happy path scenarios
- Errors that don't need HTTP status distinction

**Use direct `fetch` for:**
- Authentication flows (need to distinguish 401 vs 403 vs network error)
- File uploads/downloads (need progress events)
- Debugging complex errors (need full response object)

```typescript
// ✅ Direct fetch when HTTP details matter
try {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(credentials)
  })

  if (res.status === 401) {
    // Invalid credentials
  } else if (res.status === 403) {
    // Account locked
  } else if (!res.ok) {
    // Other error
  }
} catch (err) {
  // Network error (no response)
}

// ❌ apiClient loses this distinction
try {
  await apiClient('/api/auth/login', { method: 'POST', body: credentials })
} catch (err) {
  // err.message = "Invalid credentials" (from JSON body)
  // Can't tell if 401, 403, or network error
}
```
```

---

### 2.4: Duplicate Seeding Sources

**Frequency:** 1 major occurrence (category duplicates), high risk
**Pattern:** Multiple files seed default data, causing duplicates

**Add to `.claude/rules/api-conventions.md`:**

```markdown
## Default Data Seeding (Single Source of Truth)

**Rule:** All default/seed data MUST have exactly ONE source of truth.

### Anti-Pattern (Causes Duplicates)

```typescript
// ❌ WRONG — Two independent lists
// File 1: import.service.ts
const DEFAULT_CATEGORIES = ['Income', 'Expense', ...] // 16 items

// File 2: category.service.ts
const DEFAULT_CATEGORIES = ['Revenue', 'Expense', ...] // 20 items

// Both seed independently → 36 duplicates in DB
```

### Correct Pattern

```typescript
// ✅ CORRECT — Single source
// category.service.ts (OWNER of categories)
export const DEFAULT_CATEGORIES = [...]
export async function seedDefaultCategories(tenantId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(name => ({ name, tenantId })),
    skipDuplicates: true
  })
}

// import.service.ts (CONSUMER)
import { seedDefaultCategories } from '../category/category.service'

async function onFirstImport(tenantId: string) {
  await seedDefaultCategories(tenantId) // Delegates to single source
}
```

**Enforcement:** Before adding seeding logic, `Grep` for existing seed files:

```bash
Grep "DEFAULT_.*=.*\[" apps/api/src/  # Find all default data arrays
Grep "seedDefault" apps/api/src/      # Find all seeding functions
```

If found, import and reuse. Do NOT duplicate.
```

---

### 2.5: Soft Delete Filter Missing

**Frequency:** 1 occurrence, but applies to ALL financial queries
**Pattern:** Queries include soft-deleted records unintentionally

**Add to `.claude/rules/financial-rules.md`:**

```markdown
## Soft Delete Queries (REQUIRED for Financial Models)

**Models with soft delete:** Invoice, Bill, Payment, JournalEntry, JournalLine, Account, Transaction, Category, Client, Vendor, CreditNote

**ALWAYS filter `deletedAt IS NULL` unless explicitly querying deleted records:**

```typescript
// ✅ CORRECT
const categories = await prisma.category.findMany({
  where: {
    tenantId,
    deletedAt: null  // REQUIRED
  }
})

// ❌ WRONG (includes soft-deleted records)
const categories = await prisma.category.findMany({
  where: { tenantId }
})
```

**Why this matters:** Soft-deleted categories/transactions can match AI categorization, duplicate invoices, break aggregations.

**Pre-Flight Check:** Before finalizing query:
- [ ] Does this model have `deletedAt` field? (Check schema)
- [ ] Am I filtering `deletedAt: null`?
- [ ] Exception: Admin "view deleted records" feature (explicit intent)
```

---

### 2.6: Tenant Isolation Depth Varies by Model

**Frequency:** 1 occurrence, but affects ALL multi-hop queries
**Pattern:** Middleware checks `where.tenantId` and `where.entity.tenantId` but misses 2-hop `where.account.entity.tenantId`

**Add to `.claude/rules/api-conventions.md`:**

```markdown
## Tenant Isolation Nesting Depths

**1-hop (direct):** Tenant, Entity, User
**2-hop (entity-scoped):** Invoice, Bill, Client, Vendor, GLAccount, Category
**3-hop (account-scoped):** Transaction, Reconciliation

**Query patterns:**

```typescript
// 1-hop: Direct tenantId
const entities = await prisma.entity.findMany({
  where: { tenantId }
})

// 2-hop: Via entity
const invoices = await prisma.invoice.findMany({
  where: { entity: { tenantId } }
})

// 3-hop: Via account → entity
const transactions = await prisma.transaction.findMany({
  where: {
    account: {
      entity: { tenantId }
    }
  }
})
```

**Middleware detection:** `hasTenantFilter()` must check all nesting depths:

```typescript
function hasTenantFilter(where: unknown): boolean {
  if (!isObject(where)) return false

  // 1-hop
  if ('tenantId' in where) return true

  // 2-hop
  if ('entity' in where && isObject(where.entity)) {
    if ('tenantId' in where.entity) return true
  }

  // 3-hop
  if ('account' in where && isObject(where.account)) {
    if ('entity' in where.account && isObject(where.account.entity)) {
      if ('tenantId' in where.account.entity) return true
    }
  }

  return false
}
```
```

---

## Section 3: Industry Frameworks

### 3.1: Architecture Decision Records (ADRs)

**What:** Lightweight docs that capture "why" behind architectural decisions

**Add to planning template:**

```markdown
## Architecture Decision Record (Optional for Complex Plans)

For plans with significant architectural changes (middleware, state management, database schema), create an ADR:

**File:** `docs/architecture/ADR-NNN-title.md`

**Template:**

```markdown
# ADR-001: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** YYYY-MM-DD
**Decision Makers:** [Names/Roles]
**Related:** [Links to related ADRs]

## Context

What is the issue we're facing? What constraints exist?

## Decision

What did we decide? (One sentence summary)

## Consequences

**Positive:**
- [Benefit 1]

**Negative:**
- [Tradeoff 1]

**Risks:**
- [Risk 1]

## Alternatives Considered

- **Alternative 1:** [Description] — Rejected because [reason]
- **Alternative 2:** [Description] — Rejected because [reason]

## Implementation Notes

- [Key implementation detail]
- [Migration strategy]
```

**When to create ADR:**
- Choosing between architectural patterns (REST vs GraphQL, monolith vs microservices)
- Major refactors (middleware changes, state management overhaul)
- Technology selection (database, cache, queue)
- Security/compliance decisions (auth strategy, encryption)

**When NOT to create ADR:**
- Feature implementations (standard CRUD)
- Bug fixes
- Performance optimizations (unless changing architecture)
```

---

### 3.2: STRIDE Threat Modeling

**What:** Microsoft's framework for identifying security threats

**Add to Security Considerations template section:**

```markdown
## Security Threat Model (STRIDE)

For high-risk features (auth, payments, data export), apply STRIDE:

| Threat | Attack Vector | Mitigation |
|--------|---------------|------------|
| **S**poofing | Can attacker impersonate another user? | [Auth mechanism] |
| **T**ampering | Can attacker modify data in transit/rest? | [Encryption, signing] |
| **R**epudiation | Can attacker deny actions? | [Audit logs, signatures] |
| **I**nformation Disclosure | Can attacker read sensitive data? | [Encryption, access controls] |
| **D**enial of Service | Can attacker exhaust resources? | [Rate limiting, resource limits] |
| **E**levation of Privilege | Can attacker gain higher access? | [RBAC, input validation] |

**Example:**

| Threat | Attack Vector | Mitigation |
|--------|---------------|------------|
| Spoofing | Attacker forges JWT to access tenant B | Clerk JWT validation, tenant middleware |
| Tampering | Attacker modifies invoice amount in request | Zod schema validation, server-side recalc |
| Repudiation | User denies creating journal entry | Audit log with userId, timestamp, IP |
| Info Disclosure | Attacker queries `/invoices` without tenantId | Tenant isolation in all queries |
| DoS | Attacker floods `/reports` endpoint | Rate limit: 10 req/min per user |
| Elevation | VIEWER role accesses DELETE endpoint | Permission check: require ACCOUNTANT+ |
```

---

### 3.3: Pre-Mortem Analysis

**What:** Imagine the plan failed — what went wrong?

**Add to planning template (before finalizing):**

```markdown
## Pre-Mortem Exercise

**Scenario:** It's 3 months after deployment. This plan failed spectacularly. What happened?

**Failure Modes:**

1. **[Most likely failure]**
   - What went wrong: [Description]
   - Root cause: [Underlying issue]
   - How to prevent: [Mitigation]

2. **[Second most likely]**
   [Same structure]

3. **[Third most likely]**
   [Same structure]

**Example (for Phase 5 plan):**

1. **Raw SQL queries leak data across tenants**
   - What: Production breach — Tenant A sees Tenant B's financial data
   - Root cause: Forgot tenantId filter in one complex report query
   - Prevention: tenantScopedQuery wrapper + cross-tenant test for EVERY raw SQL query

2. **Cache never invalidates, users see stale reports for hours**
   - What: Customer complaints — "My invoice is paid but report shows unpaid"
   - Root cause: Cache has no TTL, invalidation triggers missing
   - Prevention: Bounded cache with 5min TTL + explicit invalidation on mutations

3. **Data export crashes with 500MB+ tenants**
   - What: /data-export times out, user gets blank ZIP
   - Root cause: Tried to load all data into memory before streaming
   - Prevention: Cursor-paginated reads + streaming ZIP generation
```

---

## Section 4: Domain-Specific Checklists

### 4.1: Frontend (Next.js App Router) Checklist

**File:** `.claude/rules/nextjs-app-router-checklist.md`

```markdown
# Next.js App Router Pre-Flight Checklist

## Before Creating New Page

- [ ] **loading.tsx exists** — REQUIRED for all data-fetching pages
- [ ] **error.tsx exists** — REQUIRED for all pages
- [ ] **Server vs Client boundary clear** — Is this page Server or Client Component?
- [ ] **Data fetching location** — Server Component (preferred) or useEffect (if client-side state needed)?

## Server Component Checklist

- [ ] Uses `async` function
- [ ] Fetches data directly (no useState/useEffect)
- [ ] Returns JSX (no event handlers)
- [ ] Passes data to Client Components via props
- [ ] Uses `redirect()` for navigation (not `router.push`)

## Client Component Checklist

- [ ] Has `'use client'` directive at top
- [ ] Event handlers defined (`onClick`, `onChange`, etc.)
- [ ] React hooks used (useState, useEffect, etc.)
- [ ] Receives data via props (not direct fetch)
- [ ] Uses `useRouter()` for navigation (not `redirect()`)

## Import Pattern Checklist

- [ ] Type imports use `import type { X }` (NOT `import { type X }`)
- [ ] Client Components only import what they need (avoid large barrel imports)
- [ ] Server Components can import anything

## Hydration Safety Checklist

- [ ] No client-side fetch in useEffect for initial render
- [ ] Server and client render same HTML initially
- [ ] Dynamic content (timestamps, user-specific data) handled via props
- [ ] No `window` or `localStorage` access during SSR

## Accessibility Checklist

- [ ] Form labels associated with inputs
- [ ] Buttons have descriptive text or aria-label
- [ ] Images have alt text
- [ ] Focus management for modals/dialogs
- [ ] Keyboard navigation works (Tab, Enter, Esc)

## Performance Checklist

- [ ] Images use Next.js `<Image>` component (not `<img>`)
- [ ] Large datasets paginated (not all-at-once)
- [ ] Expensive computations memoized (useMemo)
- [ ] API calls debounced (if triggered by user input)

## Validation Checklist

```typescript
// ✅ CORRECT — Server-side validation + Client-side UX
// Server Component
export default async function Page() {
  const data = await fetchData() // Fetch on server
  return <ClientForm initialData={data} />
}

// Client Component
'use client'
export function ClientForm({ initialData }) {
  const [data, setData] = useState(initialData)
  // Client-side interactivity
}

// ❌ WRONG — Client-side fetch causes hydration mismatch
'use client'
export function Page() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetchData().then(setData) // Server renders null, client renders data
  }, [])
}
```
```

---

### 4.2: Database Migration Checklist

**File:** `.claude/rules/database-migration-checklist.md`

```markdown
# Database Migration Pre-Flight Checklist

## Before Creating Migration

- [ ] **Schema change backward compatible?** — Can old code run against new schema?
- [ ] **Data migration needed?** — Do existing records need updating?
- [ ] **Indexes impact performance?** — Will CREATE INDEX lock table?
- [ ] **Rollback strategy defined?** — How to revert if deployment fails?

## Migration Safety Tiers

### Tier 1: Safe (No Downtime)
- Adding nullable column
- Adding table (not referenced yet)
- Adding index CONCURRENTLY (Postgres)
- Creating enum (not used yet)

### Tier 2: Risky (Short Downtime)
- Adding NOT NULL column with default
- Adding foreign key constraint
- Renaming column (requires code deploy coordination)
- Changing column type (may lock table)

### Tier 3: Dangerous (Long Downtime or Data Loss)
- Dropping column (data loss if not backed up)
- Dropping table (cascade effects)
- Changing column to NOT NULL (breaks if nulls exist)
- Removing enum value (breaks if in use)

## Multi-Step Migration Pattern

**For breaking changes, use 3-phase approach:**

### Phase 1: Add New (Backward Compatible)
```prisma
model Invoice {
  // Old field (keep)
  customerId  String?

  // New field (add)
  clientId    String?  // New FK to Client model
}
```

**Deploy:** Code writes to BOTH fields, reads from old field
**Wait:** 1 week (ensure no rollback needed)

### Phase 2: Backfill Data
```sql
-- Migrate data from old to new
UPDATE "Invoice"
SET "clientId" = "customerId"
WHERE "clientId" IS NULL;
```

**Deploy:** Code reads from new field, writes to both
**Wait:** 1 week

### Phase 3: Remove Old (Breaking Change)
```prisma
model Invoice {
  // Old field (removed)
  // customerId  String?

  // New field (now required)
  clientId    String  // No longer nullable
  client      Client  @relation(...)
}
```

**Deploy:** Code uses only new field
**Result:** Zero-downtime migration

## Financial Model Migrations (Extra Safety)

For tables with financial data (Invoice, Payment, JournalEntry):

- [ ] **Backup before migration** — Export to JSON or CSV
- [ ] **Dry-run on staging** — Test with production-like data
- [ ] **Soft delete preserved** — Don't remove deletedAt in refactor
- [ ] **Audit trail intact** — createdAt, updatedAt, userId preserved
- [ ] **Balance assertions** — Verify SUM(debits) = SUM(credits) after migration

## Index Creation Best Practices

```sql
-- ✅ CORRECT (non-blocking)
CREATE INDEX CONCURRENTLY idx_journal_entry_entity_posted
  ON "JournalEntry"(entityId, postedAt)
  WHERE deletedAt IS NULL;

-- ❌ WRONG (blocks writes)
CREATE INDEX idx_journal_entry_entity_posted
  ON "JournalEntry"(entityId, postedAt);
```

**Note:** `CONCURRENTLY` prevents table lock but takes longer. Use for production migrations.

## Rollback Strategy Template

```markdown
### Rollback Plan

**If migration succeeds but code fails:**
1. Deploy previous code version
2. Old code compatible with new schema? [YES/NO]
3. If NO: Run rollback migration immediately

**If migration fails mid-execution:**
1. Check Prisma migration status: `npx prisma migrate status`
2. Mark failed migration as rolled back: `npx prisma migrate resolve --rolled-back <migration-name>`
3. Fix schema, create new migration

**If data corruption detected:**
1. Stop writes (maintenance mode)
2. Restore from backup (taken before migration)
3. Investigate root cause before retry
```

## Testing Migrations

```typescript
// ✅ Test migration with realistic data
describe('Migration: Add clientId to Invoice', () => {
  it('should migrate existing invoices to new schema', async () => {
    // 1. Seed old schema data
    await prisma.$executeRaw`INSERT INTO "Invoice" (id, customerId, amount) ...`

    // 2. Run migration
    await runMigration('20240216-add-client-id')

    // 3. Verify data intact
    const invoices = await prisma.invoice.findMany()
    expect(invoices).toHaveLength(100)
    expect(invoices.every(i => i.clientId === i.customerId)).toBe(true)
  })

  it('should rollback cleanly', async () => {
    // 1. Run migration
    await runMigration('20240216-add-client-id')

    // 2. Rollback
    await rollbackMigration('20240216-add-client-id')

    // 3. Verify schema reverted
    const hasClientId = await schemaHasColumn('Invoice', 'clientId')
    expect(hasClientId).toBe(false)
  })
})
```
```

---

### 4.3: Integration Testing Checklist

**File:** `.claude/rules/integration-testing-checklist.md`

```markdown
# Integration Testing Pre-Flight Checklist

## When to Write Integration Tests

- [ ] Feature touches multiple domains (e.g., Invoice → Payment → JournalEntry → GL)
- [ ] External API involved (Clerk, Stripe, email service)
- [ ] Complex business logic spans 3+ services
- [ ] Data flows through multiple layers (route → service → repository)

## Test Pyramid Balance

**Target ratios:**
- Unit tests: 70% (services, utilities, pure functions)
- Integration tests: 20% (route → service → DB)
- E2E tests: 10% (browser automation, critical paths)

**If integration tests >30%:** Some should be unit tests (mock dependencies)
**If integration tests <10%:** Missing cross-domain coverage

## Cross-Domain Integration Test Template

```typescript
// ✅ CORRECT — Tests full flow across domains
describe('Integration: Invoice Payment to GL', () => {
  it('should post invoice, apply payment, create journal entries', async () => {
    // Arrange: Create invoice (Invoicing domain)
    const invoice = await createInvoice({
      clientId: MOCK_CLIENT_ID,
      amount: 100000, // $1000.00
      entityId: MOCK_ENTITY_ID
    })

    // Act 1: Post invoice (creates GL entry)
    await postInvoice(invoice.id, tenantContext)

    // Assert 1: Journal entry created (Accounting domain)
    const jeInvoice = await prisma.journalEntry.findFirst({
      where: { sourceType: 'INVOICE', sourceId: invoice.id },
      include: { lines: true }
    })
    expect(jeInvoice.lines).toHaveLength(2)
    expect(jeInvoice.lines[0].glAccountId).toBe(AR_ACCOUNT_ID) // 1200
    expect(jeInvoice.lines[1].glAccountId).toBe(REVENUE_ACCOUNT_ID) // 4000

    // Act 2: Apply payment (Banking domain)
    const payment = await createPayment({
      invoiceId: invoice.id,
      amount: 100000,
      accountId: BANK_ACCOUNT_ID
    })

    // Assert 2: Payment allocation created
    const allocation = await prisma.paymentAllocation.findFirst({
      where: { paymentId: payment.id }
    })
    expect(allocation.amount).toBe(100000)

    // Assert 3: Journal entry for payment posted
    const jePayment = await prisma.journalEntry.findFirst({
      where: { sourceType: 'PAYMENT', sourceId: payment.id },
      include: { lines: true }
    })
    expect(jePayment.lines).toHaveLength(2)
    expect(jePayment.lines[0].glAccountId).toBe(BANK_ACCOUNT_ID) // 1000
    expect(jePayment.lines[1].glAccountId).toBe(AR_ACCOUNT_ID) // 1200

    // Assert 4: Double-entry bookkeeping maintained
    const debits = jeInvoice.lines.reduce((sum, l) => sum + l.debitAmount, 0) +
                   jePayment.lines.reduce((sum, l) => sum + l.debitAmount, 0)
    const credits = jeInvoice.lines.reduce((sum, l) => sum + l.creditAmount, 0) +
                    jePayment.lines.reduce((sum, l) => sum + l.creditAmount, 0)
    expect(debits).toBe(credits)

    // Assert 5: Invoice status updated
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id }
    })
    expect(updatedInvoice.status).toBe('PAID')
  })
})
```

## Tenant Isolation Integration Test (REQUIRED)

**Every cross-domain feature MUST have a tenant isolation test:**

```typescript
describe('Integration: Cross-Tenant Isolation', () => {
  it('should not allow payment from tenant A to apply to tenant B invoice', async () => {
    // Arrange: Invoice for tenant A
    const invoiceA = await createInvoice({
      tenantId: TENANT_A_ID,
      amount: 100000
    })

    // Act: Tenant B tries to pay tenant A's invoice
    const paymentB = createPayment({
      tenantId: TENANT_B_ID,
      invoiceId: invoiceA.id, // Cross-tenant reference
      amount: 100000
    })

    // Assert: Payment creation fails or allocation rejected
    await expect(paymentB).rejects.toThrow('No tenant access')

    // Verify: No payment allocation created
    const allocations = await prisma.paymentAllocation.findMany({
      where: { invoiceId: invoiceA.id }
    })
    expect(allocations).toHaveLength(0)
  })
})
```

## Performance Baseline Testing

For features with query-heavy operations:

```typescript
describe('Performance: Invoice List', () => {
  beforeAll(async () => {
    // Seed 1000 invoices
    await seedInvoices(TENANT_ID, 1000)
  })

  it('should load 50 invoices in <500ms', async () => {
    const start = Date.now()

    const invoices = await listInvoices({
      tenantId: TENANT_ID,
      limit: 50,
      offset: 0
    })

    const duration = Date.now() - start

    expect(invoices).toHaveLength(50)
    expect(duration).toBeLessThan(500)
  })

  it('should use index for entityId filter', async () => {
    // Query with EXPLAIN to verify index usage
    const plan = await prisma.$queryRaw`
      EXPLAIN ANALYZE
      SELECT * FROM "Invoice"
      WHERE "entityId" = ${ENTITY_ID}
      LIMIT 50
    `

    expect(plan).toContain('Index Scan')
    expect(plan).not.toContain('Seq Scan')
  })
})
```

## Test Data Management

```typescript
// ✅ CORRECT — Isolated test data per test
beforeEach(async () => {
  // Each test gets fresh tenant + entity
  tenant = await createTestTenant()
  entity = await createTestEntity(tenant.id)
  tenantContext = { tenantId: tenant.id, userId: 'test-user', role: 'OWNER' }
})

afterEach(async () => {
  // Cleanup (cascade deletes entity's invoices, payments, etc.)
  await prisma.tenant.delete({ where: { id: tenant.id } })
})

// ❌ WRONG — Shared test data across tests
beforeAll(async () => {
  // Test 1 modifies invoice, Test 2 sees modified state
  sharedInvoice = await createInvoice({ ... })
})
```
```

---

## Section 5: Process Improvements

### 5.1: Pre-Planning Codebase Exploration

**Learning:** Session 2026-02-15-1700 discovered Phase 3 was 95% built, saving 40-50 hours of work.

**Add to `/processes:plan` workflow:**

```markdown
### Step 0.5: Deep Codebase Exploration (NEW)

Before writing ANY tasks, explore what already exists:

1. **Search for similar features:**
   ```
   Grep "[feature-related-keyword]" apps/
   Glob "**/*[feature]*"
   ```

2. **Check domain services:**
   ```bash
   ls apps/api/src/domains/[relevant-domain]/services/
   ```

3. **Review existing routes:**
   ```bash
   Grep "fastify.get\|fastify.post" apps/api/src/domains/[domain]/routes/
   ```

4. **Check frontend pages:**
   ```bash
   ls apps/web/src/app/\(dashboard\)/[domain]/
   ```

5. **Search tests for clues:**
   ```bash
   Grep "describe\(" apps/api/src/**/*.test.ts
   ```

**Time investment:** 15-30 minutes
**Potential savings:** Hours to days (avoid rebuilding existing features)

**Update TASKS.md strategy:** If feature 50%+ built, create "completion plan" instead of full implementation plan.
```

---

### 5.2: Phase Tracking Drift Detection

**Learning:** TASKS.md showed "Not started" when 95% complete — status files drifted from reality.

**Add to `/processes:begin` workflow:**

```markdown
### Step 3: Status File Drift Check (NEW)

Compare TASKS.md/STATUS.md claims vs actual codebase:

1. **For each "In Progress" or "Not Started" phase:**
   ```
   Grep "[phase-keyword]" apps/api/src/  # Check if endpoints exist
   Grep "[phase-keyword]" apps/web/src/  # Check if pages exist
   ```

2. **If endpoints/pages exist but marked "Not Started":**
   - Flag as DRIFT
   - Run quick audit: `ls [domain]/routes/*.ts | wc -l` (count files)
   - Update status to actual percentage

3. **Recommend:**
   - If >50% built: "Phase X appears 50%+ complete (X files found). Run deep exploration before planning."
   - If <10% built: "Phase X matches status (minimal files). Safe to proceed with planning."

**Output in session dashboard:**

```
⚠️ DRIFT DETECTED:
- TASKS.md: Phase 3 marked "Not started"
- Reality: 18 endpoints found in accounting/reports/
- Recommendation: Run exploration before planning
```
```

---

### 5.3: Commit Frequency & Slice Size

**Learning:** Multiple sessions with "All X planned tasks completed" — suggests good slice size.

**Add to MEMORY.md:**

```markdown
## Commit Strategy (Validated Pattern)

**Ideal commit frequency:** Every 1-2 hours during active implementation
**Ideal slice size:** Feature that takes 1-3 hours (route + service + tests)

**Good commit pattern:**
- 1-2 files changed per commit (focused)
- Tests passing before commit
- Commit message references task ID (e.g., "BE-3.1: Add GL Account CRUD")

**Bad commit pattern:**
- 10+ files changed (too large, hard to review)
- Multiple unrelated changes bundled
- Tests failing at commit time

**Session-level commits:**
- End of session: Bundle remaining small fixes
- Use descriptive message: "feat(domain): Add X, Y, Z"
```

---

## Section 6: Tool & Workflow Enhancements

### 6.1: Review Agent Parallel Execution

**Current:** Agents run sequentially (8-12 minutes total)
**Proposed:** Run security + performance in parallel (4-6 minutes)

**Add to `.claude/skills/processes-review.md`:**

```markdown
### Step 4: Parallel Agent Execution (Optimization)

**If plan has >20 tasks, run agents in parallel:**

```typescript
// Single message with multiple Task invocations
Task({ subagent_type: "security-sentinel", description: "Security review", prompt: "[plan]" })
Task({ subagent_type: "performance-oracle", description: "Performance review", prompt: "[plan]" })
```

**Wait for both to complete, then proceed to synthesis.**

**Time savings:** 4-6 minutes per review (50% reduction)
```

---

### 6.2: Finding Pattern Database

**Proposed:** Track findings across phases to build pattern library

**Create:** `docs/review-patterns/common-findings.md`

```markdown
# Common Review Findings Database

## Purpose
Track recurring issues across plans to:
1. Update pre-flight checklists
2. Improve planning template
3. Train agents to catch patterns early

## Pattern Format

### Pattern: [Name]
**Frequency:** X occurrences across Y phases
**Severity:** P0/P1/P2
**Domains Affected:** [List]
**Detection:** [How agents catch it]
**Fix:** [Standard solution]
**Prevention:** [Checklist item or template section]

---

## Tracked Patterns (Examples)

### Pattern: Missing Tenant Isolation in Raw SQL
**Frequency:** 3 occurrences (Phase 5, Onboarding refactor)
**Severity:** P0
**Domains:** Accounting (reports), System (onboarding)
**Detection:** Security agent flags `$queryRaw` without tenantId check
**Fix:** Wrap in `tenantScopedQuery()`, add test
**Prevention:** raw-sql-checklist.md (created 2026-02-16)

### Pattern: Unbounded Cache Growth
**Frequency:** 2 occurrences (Phase 5, onboarding middleware)
**Severity:** P0
**Domains:** Accounting, System
**Detection:** Performance agent flags `new Map()` without size limit
**Fix:** Add MAX_ENTRIES + active sweep
**Prevention:** cache-design-checklist.md (created 2026-02-16)

### Pattern: Hydration Mismatch from Client Fetch
**Frequency:** 1 occurrence (onboarding refactor)
**Severity:** P0
**Domains:** Frontend
**Detection:** Next.js agent flags useEffect fetch for initial data
**Fix:** Move to Server Component, pass via props
**Prevention:** nextjs-app-router-checklist.md (created 2026-02-16)

---

## Pattern Analysis (Quarterly)

Review this file every 3 months:
1. Identify top 5 most frequent patterns
2. Create/update checklists
3. Train agents with pattern examples
4. Update planning template
```

---

## Summary of Additions

| Section | Items | Status | Priority |
|---------|-------|--------|----------|
| **1. Onboarding Review Patterns** | 3 items | ✅ Ready | HIGH |
| - Cross-agent pattern detection | Template + workflow update | Ready | P0 |
| - Alternative approach framework | Template section | Ready | P1 |
| - Architectural questions | Template section | Ready | P1 |
| **2. Repeated Session Issues** | 6 items | ✅ Ready | HIGH |
| - Turbopack import pattern | Rule + hook | Ready | P0 |
| - Zod refine + partial | Rule + example | Ready | P1 |
| - apiClient error obscuring | Rule + guidance | Ready | P2 |
| - Duplicate seeding | Rule + enforcement | Ready | P1 |
| - Soft delete filter missing | Rule + checklist | Ready | P0 |
| - Tenant isolation depth | Rule + middleware | Ready | P1 |
| **3. Industry Frameworks** | 3 items | ✅ Ready | MEDIUM |
| - ADRs (decision records) | Template + guidance | Ready | P2 |
| - STRIDE threat modeling | Template section | Ready | P1 |
| - Pre-mortem analysis | Template section | Ready | P2 |
| **4. Domain Checklists** | 3 files | ✅ Ready | HIGH |
| - Next.js App Router | Full checklist | Ready | P0 |
| - Database migrations | Full checklist | Ready | P0 |
| - Integration testing | Full checklist | Ready | P1 |
| **5. Process Improvements** | 3 items | ✅ Ready | MEDIUM |
| - Pre-planning exploration | Workflow step | Ready | P1 |
| - Status drift detection | Workflow step | Ready | P2 |
| - Commit strategy | MEMORY pattern | Ready | P2 |
| **6. Tool Enhancements** | 2 items | ✅ Ready | LOW |
| - Parallel agent execution | Workflow optimization | Ready | P2 |
| - Finding pattern database | New artifact | Ready | P2 |

**Total additions:** 20 items across 6 categories
**Estimated integration time:** 4-6 hours
**Expected impact:** Further 20-30% reduction in findings (57 → 15 → 10-12)

---

## Next Steps

1. **User reviews this document**
2. **User shares article insights** (Twitter link didn't work)
3. **Merge approved items into main planning system upgrade plan**
4. **Prioritize implementation:** P0 items first (import pattern, checklists)
5. **Validate in Phase 6 planning cycle**

---

_Created: 2026-02-16_
_Status: DRAFT — Pending article insights and user approval_