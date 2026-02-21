# Security Audit: Entity Management Hub

> **Auditor:** security-sentinel
> **Date:** 2026-02-20
> **Scope:** Entity routes, services, schema, frontend form, RBAC middleware, tenant middleware
> **Risk Level:** HIGH

---

## Security Assessment Summary

| Metric | Value |
|--------|-------|
| Vulnerabilities Found | 12 |
| P0 (Critical) | 2 |
| P1 (High) | 4 |
| P2 (Medium) | 4 |
| P3 (Low/Informational) | 2 |
| OWASP Categories Affected | A01 (Broken Access Control), A03 (Injection), A04 (Insecure Design), A07 (Identification/Auth Failures), A08 (Software/Data Integrity), A09 (Security Logging Failures) |

### Approval Status
- **Status:** SECURITY REVIEW REQUIRED
- **Security Posture:** Two P0 vulnerabilities in existing code (broken tenant isolation in `entity.ts` route and missing RBAC on read routes) must be resolved before or during implementation. The plan itself introduces additional risks around `Float` for ownership percentage and missing audit logging on entity mutations. Implementation should not proceed without addressing the P0 and P1 findings first.

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `docs/plans/2026-02-20-entity-management-hub.md` | 1-530 | Implementation plan -- checked for security design gaps |
| `apps/api/src/domains/system/routes.ts` | 1-433 | Entity CRUD routes -- checked RBAC, validation, tenant isolation |
| `apps/api/src/domains/system/services/entity.service.ts` | 1-119 | Entity service -- checked tenant isolation, query safety |
| `apps/api/src/domains/system/routes/entity.ts` | 1-83 | Business details route -- checked tenant isolation, RBAC, response exposure |
| `packages/db/prisma/schema.prisma` | 62-109, 910-915 | Entity model + TenantUserRole enum -- checked model security |
| `apps/web/src/components/dashboard/EntityFormSheet.tsx` | 1-338 | Frontend entity form -- checked XSS, input validation, CSRF |
| `apps/web/src/lib/api/entities.ts` | 1-49 | Frontend API client -- checked request construction |
| `apps/web/src/lib/api/client-browser.ts` | 1-65 | Browser API client -- checked auth token handling |
| `apps/api/src/middleware/rbac.ts` | 1-92 | RBAC middleware -- checked enforcement logic |
| `apps/api/src/middleware/withPermission.ts` | 1-98 | Permission helper -- checked preset roles |
| `apps/api/src/middleware/tenant.ts` | 1-93 | Tenant middleware -- checked isolation mechanism |
| `apps/api/src/middleware/auth.ts` | 1-104 | Auth middleware -- checked JWT handling |
| `apps/api/src/middleware/validation.ts` | 1-84 | Validation middleware -- checked Zod usage |
| `apps/api/src/lib/audit.ts` | 1-286 | Audit logging -- checked coverage for entity ops |
| `apps/api/src/middleware/security-headers.ts` | 1-86 | Security headers -- checked completeness |
| `packages/types/src/rbac/permissions.ts` | 280-309 | Permission matrix -- checked entity role definitions |

---

## Findings

### P0-1: Broken Tenant Isolation in `PATCH /entity/business-details` (OWASP A01)

**Severity:** P0 (Critical)
**File:** `apps/api/src/domains/system/routes/entity.ts:33-35`
**Category:** A01 Broken Access Control / A07 Identification and Authentication Failures

**Issue:** The `PATCH /api/system/entity/business-details` route performs its own tenant lookup by querying `prisma.tenantUser.findFirst({ where: { userId: request.userId } })`. However, `request.userId` is set by the auth middleware (`apps/api/src/middleware/auth.ts:53`) to `payload.sub`, which is the **Clerk external user ID** (e.g., `user_2abc...`). The `TenantUser.userId` field references `User.id` which is an **internal cuid** (e.g., `clz1abc...`). These are two different ID types.

The correct pattern is used in `tenant.ts` middleware (line 34): `user: { clerkUserId: request.userId }` -- which joins through the User model's `clerkUserId` field. The entity.ts route skips this join and queries `TenantUser.userId` directly with a Clerk ID, which will:

1. **Fail to find the correct user** in most cases (Clerk ID does not match internal cuid), causing a 404 instead of performing the update.
2. **Potentially match the wrong user** in a theoretical collision scenario (different ID formats but extremely unlikely with cuids vs Clerk IDs).

Additionally, this route **bypasses the already-attached `request.tenantId`** from the tenant middleware (which is available since this route is registered inside the `tenantScope`). It redundantly queries the database for the tenant instead of using `request.tenantId`.

**Exploit Scenario:** An authenticated user sends `PATCH /api/system/entity/business-details`. Instead of using the tenant middleware's verified `request.tenantId`, the route independently queries `TenantUser` by Clerk ID. If there were ever a Clerk ID that coincidentally matched a different user's internal `User.id`, the route would operate on the wrong tenant's entity. More practically, the query currently fails silently for most users because the ID format mismatch returns null.

**Impact:** Tenant isolation bypass (theoretical), functional breakage (practical -- updates may silently fail for legitimate users).

**Suggested Fix:**
```typescript
// Replace lines 33-47 with:
const tenantId = request.tenantId;
if (!tenantId) {
  return reply.status(401).send({ error: 'Unauthorized', message: 'Missing tenant context' });
}

const entity = await prisma.entity.findFirst({
  where: { tenantId },
});
```

---

### P0-2: Missing RBAC on Entity Read Routes (OWASP A01)

**Severity:** P0 (Critical)
**File:** `apps/api/src/domains/system/routes.ts:84-138`
**Category:** A01 Broken Access Control

**Issue:** The `GET /api/system/entities` (line 84) and `GET /api/system/entities/:id` (line 114) routes have **no RBAC check**. They are protected by auth + tenant middleware (line 69-70) but do not use `withPermission()` or any role check.

Per the canonical permission matrix in `packages/types/src/rbac/permissions.ts:287-294`, the `system:entities` resource defines:
- OWNER: ADMIN
- ADMIN: ADMIN
- ACCOUNTANT: VIEW
- BOOKKEEPER: HIDDEN
- INVESTOR: HIDDEN
- ADVISOR: HIDDEN

This means BOOKKEEPER, INVESTOR, and ADVISOR roles should have **no access** to entity data (HIDDEN level). However, the current routes allow **any authenticated tenant member** to read entity data regardless of role.

The `POST /entities` route (line 146) correctly uses `withPermission('system', 'entities', 'ADMIN')`, but the read routes do not use `withPermission('system', 'entities', 'VIEW')`.

**Exploit Scenario:** A user with BOOKKEEPER or INVESTOR role (once the DB schema supports those roles) sends `GET /api/system/entities`. They receive the full list of entities including entity names, types, currencies, and countries -- data they should not have access to per the permission matrix.

**Impact:** Unauthorized data disclosure. Users with restricted roles can enumerate all entities in the tenant, including entity types, currencies, and jurisdictions. This becomes more severe with the hub plan because entity detail pages will expose tax IDs, addresses, and relationship data.

**Suggested Fix:**
```typescript
// GET /entities - add VIEW permission
tenantScope.get<{ Reply: EntityListResponse | ErrorResponse }>(
  '/entities',
  {
    ...withPermission('system', 'entities', 'VIEW'),
  },
  async (request, reply) => { /* ... */ }
);

// GET /entities/:id - add VIEW permission
tenantScope.get(
  '/entities/:id',
  {
    ...withPermission('system', 'entities', 'VIEW'),
  },
  async (request, reply) => { /* ... */ }
);
```

---

### P1-1: Missing RBAC on `PATCH /entity/business-details` (OWASP A01)

**Severity:** P1 (High)
**File:** `apps/api/src/domains/system/routes/entity.ts:28-30`
**Category:** A01 Broken Access Control

**Issue:** The `PATCH /api/system/entity/business-details` route has `preValidation` for body schema, but **no RBAC check**. Any authenticated tenant member can update the entity's business details (address, tax ID, industry, business size) regardless of their role.

Per the permission matrix, only OWNER and ADMIN should have write access to entities (`system:entities` requires ADMIN level for mutations). The route uses `preValidation: [validateBody(UpdateBusinessDetailsSchema)]` but never calls `withPermission` or `requirePermission`.

**Exploit Scenario:** A user with VIEWER or ACCOUNTANT role sends `PATCH /api/system/entity/business-details` and changes the business address, tax ID, or industry of the entity. This could be used to tamper with data that appears on invoices, tax filings, and official reports.

**Impact:** Unauthorized entity modification. Any tenant member can alter business-critical registration details.

**Suggested Fix:**
```typescript
fastify.patch('/business-details', {
  preValidation: [validateBody(UpdateBusinessDetailsSchema)],
  preHandler: requirePermission('system', 'entities', 'ADMIN'),
}, async (request, reply) => { /* ... */ });
```

---

### P1-2: No Audit Logging on Entity Mutations (OWASP A09)

**Severity:** P1 (High)
**Files:** `apps/api/src/domains/system/routes.ts:146-210`, `apps/api/src/domains/system/routes/entity.ts:28-82`
**Category:** A09 Security Logging and Monitoring Failures

**Issue:** Entity creation (`POST /entities`, line 146) and entity business details update (`PATCH /entity/business-details`, line 28) have **no audit logging**. A `Grep` for `createAuditLog.*entity` across the entire `apps/api/src/` directory returns zero matches for entity-specific operations.

The codebase has a robust audit logging system (`apps/api/src/lib/audit.ts`) with SHA-256 hash chain integrity and is used for data exports (`routes.ts:369`), but it is completely absent from entity CRUD operations.

The plan proposes new mutations: `PATCH /entities/:id`, `POST /entities/:id/archive`, `POST /entities/:id/upgrade`, and entity relationship CRUD. None of these mention audit logging in the plan's task descriptions (Tasks 4, 5, 7).

**Exploit Scenario:** An insider (or compromised account) modifies entity details -- changes the tax ID, business address, or archives an entity. There is no audit trail to detect or investigate the change. For a financial application handling multi-jurisdiction compliance, this is a significant gap.

**Impact:** No forensic trail for entity modifications. Violates SOC 2 CC7.2 (change detection), GDPR accountability principle, and internal compliance requirements. The tamper-proof audit chain is worthless if mutations are never logged.

**Suggested Fix:** Add `createAuditLog()` calls to all entity mutation endpoints:
```typescript
// POST /entities - after successful creation
await createAuditLog({
  tenantId: request.tenantId as string,
  userId: request.userId as string,
  model: 'Entity',
  recordId: entity.id,
  action: 'CREATE',
  after: { name: entity.name, type: entity.type, country: entity.country },
});

// Similarly for PATCH, archive, upgrade, and relationship mutations
```

---

### P1-3: Plan Proposes `Float` for `ownershipPercent` (OWASP A04)

**Severity:** P1 (High)
**File:** `docs/plans/2026-02-20-entity-management-hub.md:57`
**Category:** A04 Insecure Design / Financial Data Integrity

**Issue:** The plan's Task 2 proposes adding `ownershipPercent Float?` to the `EntityRelationship` model. The project's Key Invariant #2 states: "All amounts are integer cents (1050 = $10.50). Never use floats." While ownership percentage is not a monetary value per se, it is a financial/legal value used in:

1. Consolidated financial reporting (IFRS 10, US GAAP ASC 810)
2. Tax liability calculations (pass-through entities)
3. Legal compliance (ownership disclosure thresholds)
4. Inter-entity elimination calculations

Using `Float` introduces IEEE 754 floating-point precision errors. For example, `33.33 + 33.33 + 33.34` may not sum to exactly `100.00` in floating-point arithmetic, which would cause the `validateOwnershipTotal()` validation in Task 5 to produce false positives or false negatives.

The existing Prisma schema already has a `ConsolidationElimination` model that would consume this data for reporting.

**Exploit Scenario:** Three partners each own 33.33%. Due to floating-point rounding, the sum evaluates to `99.99000000000001` or `100.00000000000001`. The validation logic either incorrectly rejects a valid ownership structure or allows ownership to exceed 100%. This is not a traditional "exploit" but a data integrity failure with legal consequences.

**Impact:** Incorrect ownership calculations affect consolidated reporting, tax liability, and legal compliance. The project explicitly prohibits floats for financial values.

**Suggested Fix:** Use `Int` with basis points (100.00% = 10000 basis points):
```prisma
ownershipPercent Int?  // Basis points: 3333 = 33.33%, max 10000 = 100%
```
Or use `Decimal` type in Prisma which maps to PostgreSQL's arbitrary-precision `NUMERIC`:
```prisma
ownershipPercent Decimal? @db.Decimal(5, 2)  // Up to 100.00 with exact precision
```

---

### P1-4: No Rate Limiting on Entity Creation (OWASP A04)

**Severity:** P1 (High)
**File:** `apps/api/src/domains/system/routes.ts:146-210`
**Category:** A04 Insecure Design

**Issue:** The `POST /api/system/entities` route has no rate limiting. The data export route (`GET /data-export`, line 354) correctly applies `rateLimit: { max: 3, timeWindow: '1 minute' }`, but entity creation has no such protection.

The plan expands this with additional creation paths (fast, guided, pre-registration wizard) and proposes an AI Advisor endpoint (Task 29) which does mention rate limiting ("max 5 calls per user per hour"), but the core entity creation endpoint remains unprotected.

Entity creation triggers database writes, potentially default Chart of Accounts seeding, and other cascading operations. An attacker could create hundreds of entities per second, exhausting database connections and disk space.

**Exploit Scenario:** An authenticated user (or compromised account) sends rapid-fire `POST /api/system/entities` requests in a loop. Each creates a database record, potentially triggering COA seeding (which creates dozens of GL accounts per entity). Within seconds, the tenant has thousands of junk entities and the database is under heavy write pressure.

**Impact:** Denial of service through resource exhaustion. Database bloat. Potential cascading failures if entity creation triggers downstream operations (COA seeding, default account creation).

**Suggested Fix:**
```typescript
tenantScope.post(
  '/entities',
  {
    ...withPermission('system', 'entities', 'ADMIN'),
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => { /* ... */ }
);
```

---

### P2-1: Entity Response Exposes Full Model Without Field Selection (OWASP A01)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/system/routes/entity.ts:71-74`
**Category:** A01 Broken Access Control / A04 Insecure Design

**Issue:** The `PATCH /entity/business-details` route returns `entity: updatedEntity` where `updatedEntity` is the result of `prisma.entity.update()` **without a `select` clause**. This returns ALL fields of the Entity model, including:

- `taxId` -- sensitive PII (tax identification number)
- `tenantId` -- internal identifier (information leakage)
- `coaTemplateUsed` -- internal implementation detail
- `setupCompletedAt` -- internal state
- `industryCode` -- potentially sensitive business metadata

The `GET /entities` route (line 84-107) correctly maps the response to only expose `id`, `name`, `type`, `currency`. But the business details update route returns the raw Prisma result.

**Exploit Scenario:** A user (or API consumer) calls `PATCH /entity/business-details` and receives the full entity record in the response, including the `taxId` and other fields that should only be visible to users with appropriate access.

**Impact:** Sensitive data exposure (tax IDs, internal IDs) to any user who can access the endpoint.

**Suggested Fix:** Add a `select` clause or map the response:
```typescript
const updatedEntity = await prisma.entity.update({
  where: { id: entity.id },
  data: { /* ... */ },
  select: {
    id: true,
    name: true,
    type: true,
    address: true,
    city: true,
    state: true,
    postalCode: true,
    industry: true,
    businessSize: true,
  },
});
```

---

### P2-2: No Input Validation on `id` Parameter in Entity Routes (OWASP A03)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/system/routes.ts:118`
**Category:** A03 Injection / A08 Software and Data Integrity Failures

**Issue:** The `GET /api/system/entities/:id` route extracts the `id` parameter via `const { id } = request.params as { id: string }` without any validation. The parameter is not validated as a cuid, UUID, or even a non-empty string before being passed to `service.getEntity(id)`.

While Prisma parameterizes queries (preventing SQL injection), passing unsanitized input to the service layer violates defense-in-depth. An attacker could send:
- `GET /api/system/entities/` (empty string)
- `GET /api/system/entities/../../../etc/passwd` (path traversal, not exploitable here but indicates missing validation)
- `GET /api/system/entities/a]` (malformed cuid)

The plan proposes adding several new parameterized routes: `GET /entities/:id`, `PATCH /entities/:id`, `POST /entities/:id/archive`, `POST /entities/:id/upgrade`, `GET /entities/:id/relationships`, etc. Each will need `:id` validation.

**Exploit Scenario:** Submitting garbage or overly long strings as entity IDs causes unnecessary database queries and potentially confusing error messages. Not directly exploitable for data access due to Prisma parameterization, but represents missing input validation.

**Impact:** Low direct impact due to Prisma's parameterized queries, but violates defense-in-depth. Missing validation compounds across the planned 8+ new parameterized endpoints.

**Suggested Fix:** Add a Zod schema for URL parameters:
```typescript
const EntityIdParams = z.object({
  id: z.string().cuid(),
});

// Use in route:
tenantScope.get('/entities/:id', async (request, reply) => {
  const params = EntityIdParams.safeParse(request.params);
  if (!params.success) {
    return reply.status(400).send({ error: 'Invalid entity ID' });
  }
  const entity = await service.getEntity(params.data.id);
  // ...
});
```

---

### P2-3: Frontend Tax ID Field Lacks Input Sanitization (OWASP A03)

**Severity:** P2 (Medium)
**File:** `apps/web/src/components/dashboard/EntityFormSheet.tsx:249-261`
**Category:** A03 Injection / A08 Software and Data Integrity

**Issue:** The Tax ID field accepts freeform text input with no format validation or character restriction on the frontend. While the backend Zod schema limits it to `z.string().max(50)` (line 165 in routes.ts), the frontend does not:

1. Validate tax ID format per jurisdiction
2. Restrict input to expected characters (alphanumeric + dashes)
3. Warn on obviously invalid formats

The plan (Task 6) correctly proposes a `validateTaxId()` utility with per-jurisdiction regex patterns, but the **existing** EntityFormSheet has no validation. The plan's Task 16 (EntityEditForm) mentions "inline format validation" but the existing code has none.

Tax IDs are sensitive PII that appear on invoices and tax filings. Storing unvalidated tax IDs risks:
- Incorrect tax filings
- Invoice display corruption
- Data quality degradation

**Exploit Scenario:** A user enters `<script>alert('xss')</script>` as a tax ID. React's JSX escaping prevents XSS in the browser, but if this value is later rendered in a PDF invoice, email template, or server-side rendered document without proper escaping, it becomes an XSS vector. Additionally, entering `000000000` passes validation but is a known invalid EIN.

**Impact:** Data quality degradation. Potential stored XSS in non-React rendering contexts (PDF generation, emails). Invalid tax IDs on official documents.

**Suggested Fix:** Add character restriction and format hint on the frontend:
```typescript
<input
  id="entity-taxid"
  type="text"
  value={taxId}
  onChange={e => setTaxId(e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, ''))}
  pattern="[a-zA-Z0-9\s\-]+"
  maxLength={50}
  placeholder={getTaxIdPlaceholder(country)} // Dynamic per jurisdiction
/>
```

---

### P2-4: Plan Missing Entity Archival Authorization Checks (OWASP A04)

**Severity:** P2 (Medium)
**File:** `docs/plans/2026-02-20-entity-management-hub.md:104, 149-150`
**Category:** A04 Insecure Design

**Issue:** The plan's Task 4 proposes `archiveEntity(id)` which "sets status to ARCHIVED" and Task 7 proposes `POST /entities/:id/archive`. The plan states: "validate no active financial data before archiving" (line 104). However, the plan does not specify:

1. **What constitutes "active financial data"** -- unpaid invoices? open bank accounts? unreconciled transactions? pending journal entries?
2. **Whether archiving is reversible** -- the plan mentions "Archive/Restore" in the detail page (Task 15, line 266) but no `unarchive` or `restore` endpoint is defined
3. **What happens to archived entity data** -- can it still be queried? Do reports exclude it? Can you create transactions against it?
4. **Authorization escalation** -- archiving an entity effectively disables access to all its financial data. This is a destructive operation that should require OWNER role, not just ADMIN.

Archiving an entity with active financial data (open invoices, bank connections, unposted journal entries) could cause cascading failures across the banking, invoicing, and accounting domains.

**Impact:** Inadequate specification of a security-critical operation. Without clear rules, implementation may allow premature archival that breaks downstream financial operations.

**Suggested Fix:** Define explicit pre-archival checks:
```typescript
async archiveEntity(id: string, tenantId: string): Promise<void> {
  const checks = await prisma.entity.findFirst({
    where: { id, tenantId },
    select: {
      _count: {
        select: {
          invoices: { where: { status: { in: ['DRAFT', 'SENT', 'OVERDUE'] }, deletedAt: null } },
          bills: { where: { status: { in: ['DRAFT', 'PENDING', 'OVERDUE'] }, deletedAt: null } },
          accounts: { where: { deletedAt: null } },
          journalEntries: { where: { status: 'DRAFT', deletedAt: null } },
        },
      },
    },
  });

  if (checks._count.invoices > 0 || checks._count.bills > 0 || ...) {
    throw new Error('Cannot archive: entity has active financial records');
  }
}
```

---

### P3-1: `(window as any).Clerk` TypeScript Escape in API Client (OWASP A08)

**Severity:** P3 (Low)
**File:** `apps/web/src/lib/api/client-browser.ts:27`
**Category:** A08 Software and Data Integrity Failures

**Issue:** The browser API client accesses the Clerk global object via `(window as any).Clerk`. The `as any` cast suppresses TypeScript type checking, meaning:

1. If Clerk is not loaded (script blocked by content blocker, CDN failure), `clerk?.session?.getToken()` silently returns `undefined` and the `!token` check throws a generic "Not authenticated" error -- masking the real issue.
2. No type safety on `clerk.session.getToken()` -- if the Clerk API changes, this fails silently at runtime.
3. Violates project invariant: "NEVER use `: any`".

**Impact:** Reduced type safety in authentication-critical code. Potential runtime errors masked as auth failures. Low direct security impact but degrades the security of the auth token acquisition path.

**Suggested Fix:**
```typescript
import type { Clerk } from '@clerk/types';

declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

const clerk = window.Clerk;
```

---

### P3-2: Plan Does Not Address `externalDetails Json?` Injection Risk (OWASP A03)

**Severity:** P3 (Low/Informational)
**File:** `docs/plans/2026-02-20-entity-management-hub.md:59`
**Category:** A03 Injection

**Issue:** The proposed `EntityRelationship` model includes `externalDetails Json?` for storing "Additional info about external partner". The plan does not specify:

1. What fields are expected in this JSON (schema-less data)
2. Maximum size limit for the JSON payload
3. Whether the JSON content is validated before storage
4. How the JSON is rendered in the UI (risk of stored XSS if rendered without sanitization)

Storing arbitrary JSON without validation creates a risk of:
- Oversized payloads (DoS via database bloat)
- Unexpected data types that cause rendering errors
- Malicious content stored for later retrieval

**Impact:** Low immediate risk (Prisma handles JSON parameterization), but schema-less data is an anti-pattern that can accumulate technical debt and future security issues.

**Suggested Fix:** Define a Zod schema for `externalDetails`:
```typescript
const ExternalDetailsSchema = z.object({
  registrationNumber: z.string().max(100).optional(),
  jurisdiction: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().max(500).optional(),
}).strict(); // Reject unknown keys
```

---

## Additional Plan-Specific Security Observations

### Observation A: New Route Prefix Collision

The existing routes register entity subroutes at two different prefixes:
- `tenantScope.register(entityRoutes, { prefix: '/entity' })` (line 72) -- handles `PATCH /entity/business-details`
- `tenantScope.get('/entities', ...)` (line 84) -- handles entity list
- `tenantScope.get('/entities/:id', ...)` (line 114) -- handles entity detail

The plan (Task 7) proposes expanding routes under `/entities` and adding relationship subroutes. The existing `/entity` (singular) prefix should be consolidated into `/entities` (plural) to avoid confusion and potential routing conflicts. Having both `/entity/business-details` and `/entities/:id` is a maintenance hazard.

### Observation B: Role Schema Gap (4 vs 6 Roles)

The DB schema defines 4 roles (`OWNER`, `ADMIN`, `ACCOUNTANT`, `VIEWER`) while the permission matrix defines 6 roles (adding `BOOKKEEPER`, `INVESTOR`, `ADVISOR`). The RBAC middleware at `rbac.ts:53` explicitly filters to DB-supported roles: `const DB_ROLES = new Set<string>(['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'])`.

When the proposed entity relationship routes check `withPermission('system', 'entities', 'ADMIN')`, the matrix correctly restricts to OWNER and ADMIN. But the `HIDDEN` role restriction for BOOKKEEPER/INVESTOR/ADVISOR is effectively unenforced because those roles do not exist in the DB yet. Once the schema is migrated to 6 roles, the RBAC middleware will correctly filter them -- but there is no guarantee the migration happens before the entity hub ships. This should be a documented prerequisite.

### Observation C: AI Advisor Endpoint Input Validation

Task 29 proposes `POST /api/ai/entity-recommendation` accepting `{ country, answers: Record<string, string>, currentEntities: string[] }`. The `answers` field is an open `Record<string, string>` which could contain:
- Very long strings (DoS)
- Prompt injection payloads (if answers are concatenated into AI prompts)
- Unexpected keys

The plan correctly mentions rate limiting but does not mention input validation or prompt injection prevention for the AI endpoint.

---

## Recommendations

### Immediate (Before Implementation Begins)

1. **Fix P0-1:** Refactor `apps/api/src/domains/system/routes/entity.ts` to use `request.tenantId` instead of performing its own broken tenant lookup.
2. **Fix P0-2:** Add `withPermission('system', 'entities', 'VIEW')` to `GET /entities` and `GET /entities/:id` routes.
3. **Fix P1-1:** Add RBAC check to `PATCH /entity/business-details` route.

### During Implementation

4. **Fix P1-2:** Add `createAuditLog()` calls to all entity mutation endpoints (create, update, archive, upgrade, relationship CRUD).
5. **Fix P1-3:** Change `ownershipPercent` from `Float?` to either `Int?` (basis points) or `Decimal?` in the Prisma schema.
6. **Fix P1-4:** Add rate limiting to `POST /entities` and all new entity mutation endpoints.
7. **Fix P2-1:** Add `select` clause to the business details update response.
8. **Fix P2-2:** Add Zod validation for `:id` parameters on all entity routes.
9. **Fix P2-3:** Add frontend tax ID format validation using the jurisdiction config from Task 1.
10. **Fix P2-4:** Define explicit pre-archival checks and document reversibility.

### Post-Implementation

11. Consolidate `/entity` and `/entities` route prefixes.
12. Add `externalDetails` JSON schema validation.
13. Add prompt injection prevention for the AI Advisor endpoint.
14. Ensure the 4-to-6 role migration is a documented prerequisite or concurrent task.
