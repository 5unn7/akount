# Security Audit: Phase 5 Reports Implementation

> **Auditor:** security-sentinel
> **Date:** 2026-02-17
> **Scope:** Report API routes, services, cache, export, tenant-scoped-query, data-export, onboarding, RBAC middleware
> **Risk Level:** MEDIUM (2 P1 issues, 5 P2 issues, 5 informational)

---

## Security Assessment Summary

| Metric | Value |
|--------|-------|
| Vulnerabilities Found | 12 |
| P0 (Critical) | 0 |
| P1 (High) | 2 |
| P2 (Medium) | 5 |
| P3 (Low/Informational) | 5 |
| OWASP Categories Affected | A01 (Access Control), A03 (Injection), A04 (Insecure Design), A05 (Misconfiguration), A07 (Auth Failures) |

### Approval Status

- **Status:** SECURITY REVIEW REQUIRED
- **Security Posture:** AT RISK (P1 findings require remediation before Phase 6 launch)

---

## Findings

---

### P1-1: RBAC Middleware Does Not Use the Permission Matrix (OWASP A01)

**Severity:** P1 (High)
**File:** `apps/api/src/middleware/rbac.ts:60-78`
**Category:** Broken Access Control

**Issue:**
The `requirePermission()` function in `rbac.ts` is annotated with a `TODO: Phase 3` comment and does NOT actually consult the `PERMISSION_MATRIX` defined in `packages/types/src/rbac/permissions.ts`. Instead, it uses a hardcoded fallback `rolesByLevel` map that is less restrictive than the canonical matrix.

Specifically, the hardcoded map at line 69-74 maps `VIEW` level to `['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER']`. There are two problems:

1. **VIEWER role does not exist.** The canonical 6 roles are OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR. The code references a non-existent `VIEWER` role, meaning the VIEWER role check will never match any actual user, but it reveals the middleware was never updated to align with the real role set.

2. **INVESTOR and ADVISOR are excluded from report VIEW access.** The canonical `PERMISSION_MATRIX` grants `accounting:reports` VIEW access to OWNER, ADMIN, ACCOUNTANT, INVESTOR, and ADVISOR. But the hardcoded fallback only grants VIEW to `['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER']`. This means INVESTOR and ADVISOR roles are incorrectly denied access to reports -- a functional bug that also represents an authorization design gap.

**Exploit Scenario:**
An INVESTOR or ADVISOR user with legitimate VIEW access to reports will receive HTTP 403 errors, causing support tickets and workarounds. More importantly, the entire RBAC system is not consulting its own canonical permission matrix, which could lead to privilege escalation or incorrect denials across all domains.

**Impact:**
All `withPermission()` calls across the entire API are affected, not just reports. Every domain's permission enforcement is using the wrong role mappings.

**Suggested Fix:**
```typescript
// rbac.ts - Replace the hardcoded fallback with actual matrix lookup
import { canAccess, type PermissionKey, type PermissionLevel, type Role } from '@akount/types';

export function requirePermission(
  domain: string,
  resource: string,
  level: PermissionLevel
) {
  const key: PermissionKey = `${domain}:${resource}`;
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenantRole) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    if (!canAccess(key, request.tenantRole as Role, level)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}
```

---

### P1-2: `format` Query Parameter Is Not Validated by Zod Schema (OWASP A04)

**Severity:** P1 (High)
**File:** `apps/api/src/domains/accounting/routes/report.ts:63,68-86` (and all other report routes)
**File:** `apps/api/src/domains/accounting/schemas/report.schema.ts` (missing `format` field)

**Issue:**
The `format` query parameter (used to select JSON, CSV, or PDF output) is NOT included in any Zod validation schema. The route handler extracts it via unsafe type assertion:

```typescript
const query = request.query as ProfitLossQuery & { format?: string };
const format = query.format || 'json';
```

The `ProfitLossQuerySchema` (and all other report schemas) does not include a `format` field. This means:

1. **No input validation on `format`** -- any string value is accepted. While the code only acts on `'pdf'` and `'csv'` (falling through to JSON for anything else), this violates defense-in-depth principles.

2. **The type assertion `as ProfitLossQuery & { format?: string }` bypasses Zod entirely.** If Fastify's validation strips unknown query params (behavior depends on config), `format` may be silently dropped, or if it doesn't strip them, unvalidated user input flows into the handler.

3. **The `ExportFormatSchema` defined at line 95-96 of `report.schema.ts` exists but is never used.** It was clearly intended for this purpose but was never wired into the query schemas.

**Exploit Scenario:**
An attacker sends `?format=../../etc/passwd` -- while this specific value would not cause harm with current code logic, the pattern of accepting unvalidated input is a security anti-pattern that could become exploitable if format handling logic changes.

**Impact:**
Unvalidated input bypassing the schema layer. Medium severity because current fallback behavior is safe, but the pattern is dangerous.

**Suggested Fix:**
Add `format` to each query schema, or create a shared refinement:

```typescript
// In each query schema, add:
format: z.enum(['json', 'csv', 'pdf']).default('json'),
```

And remove the `& { format?: string }` type assertion from the route handlers.

---

### P2-1: `tenantScopedQuery` String Check Is Bypassable (OWASP A03)

**Severity:** P2 (Medium)
**File:** `apps/api/src/lib/tenant-scoped-query.ts:22-28`

**Issue:**
The defense-in-depth check at line 23-24 inspects the SQL template strings for the presence of `'tenantId'` or `'tenant_id'`:

```typescript
const sqlString = sql.strings.join('');
if (!sqlString.includes('tenantId') && !sqlString.includes('tenant_id')) {
  throw new Error('Raw SQL query does not reference tenantId.');
}
```

This is a string-matching heuristic, not a semantic guarantee. It can be bypassed by:

1. A query that mentions `tenantId` in a comment (e.g., `-- tenantId filter handled elsewhere`).
2. A query that mentions `tenantId` in a string literal or column alias.
3. A query that uses the parameter via a subquery but the outer query is unfiltered.

**Mitigating Factor:**
This is explicitly documented as "defense-in-depth, not a substitute for correct SQL." All current callers in `report.service.ts` correctly filter by tenantId. The check has value as a safety net.

**Impact:**
If a future developer writes a query that mentions tenantId in a non-filtering context, the check would not catch it. The actual risk is LOW given current code, but the bypass potential makes it P2.

**Suggested Fix:**
Enhance to verify the parameter appears in the SQL values array:

```typescript
const hasParamValue = sql.values.some(v => v === tenantId);
if (!hasParamValue) {
  throw new Error('tenantId must be passed as a parameterized value');
}
```

---

### P2-2: Data Export Exposes `accountNumber` Field (OWASP A01)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/system/services/data-export.service.ts:84`

**Issue:**
The `accounts` table export includes the `accountNumber` column in the CSV:

```typescript
columns: ['id', 'entityId', 'name', 'type', 'subtype', 'institution',
           'accountNumber', 'currency', 'currentBalance', ...],
```

Bank account numbers are PII / sensitive financial data. While this export is restricted to OWNER/ADMIN roles, the exported ZIP file could be emailed, shared, or stored insecurely. A full unmasked account number in a CSV file is a data exposure risk.

**Impact:**
If the backup ZIP is compromised, bank account numbers are exposed in plaintext. Relevant for GDPR/SOC 2 compliance.

**Suggested Fix:**
Mask the account number in exports:

```typescript
function maskAccountNumber(num: string): string {
  if (!num || num.length <= 4) return '****';
  return '****' + num.slice(-4);
}
```

---

### P2-3: Data Export Missing Tenant Filter for `client` and `vendor` Models (OWASP A01)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/system/services/data-export.service.ts:58-61,70-73,103-106`

**Issue:**
The `clients`, `vendors`, and `categories` table configs do NOT have `entityScoped: true`. The `buildWhere` function falls through to:

```typescript
} else {
  where.tenantId = tenantId;
}
```

This is correct IF `Client`, `Vendor`, and `Category` Prisma models have a direct `tenantId` column. Based on the CLAUDE.md architecture notes, the model hierarchy shows Client and Vendor as children of Entity, suggesting they may be entity-scoped (via `entityId` -> `entity.tenantId`).

If these models do not have a direct `tenantId` column, the Prisma query would either fail with a column error or silently return zero results, meaning the data backup would be incomplete.

**Suggested Fix:**
Verify the Prisma schema for `Client`, `Vendor`, and `Category`. If entity-scoped, update configs:

```typescript
{
  name: 'clients',
  model: 'client',
  columns: [...],
  entityScoped: true,
},
```

---

### P2-4: Balance Sheet and Other Reports Missing Cache (OWASP A04 / DoS)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/accounting/services/report.service.ts:493-683`

**Issue:**
`generateProfitLoss()` correctly uses the report cache (lines 364-368). However, `generateBalanceSheet()`, `generateCashFlow()`, `generateTrialBalance()`, `generateSpendingByCategory()`, and `generateRevenueByClient()` do NOT use the cache at all.

`generateCashFlow()` is particularly expensive: it calls `generateProfitLoss()` (cached) plus 3 additional raw SQL queries.

**Impact:**
Without caching, repeated requests within the 5-minute window hit the database with expensive aggregation queries. With the 50 req/min rate limit, an attacker could trigger 50 expensive uncached queries per minute per user.

**Suggested Fix:**
Add cache checks to all report generation methods following the `generateProfitLoss()` pattern.

---

### P2-5: CSV Sanitization Inconsistency Between Export Services (OWASP A03)

**Severity:** P2 (Medium)
**File:** `apps/api/src/domains/accounting/services/report-export.service.ts:26-39`
**File:** `apps/api/src/domains/system/services/data-export.service.ts:113-131`

**Issue:**
Two separate CSV sanitization implementations with different behavior:

**report-export.service.ts (line 30):**
```typescript
if (/^[=+\-@\t\r]/.test(value)) {
  return `'${value}`;  // Single-quote prefix, NO wrapping in double quotes
}
```

**data-export.service.ts (line 121-122):**
```typescript
if (/^[=+\-@\t\r]/.test(str)) {
  return `"'${str.replace(/"/g, '""')}"`;  // Properly wrapped in double quotes
}
```

The first implementation prefixes with a single quote but does NOT wrap in double quotes. If the value also contains commas, the CSV structure would break. The second implementation wraps properly.

Additionally, `report-export.service.ts` does not explicitly handle `null`/`undefined` beyond the `!value` falsy check, while `data-export.service.ts` checks `value === null || value === undefined`.

**Impact:**
A crafted GL account name like `=CMD|'/C calc'!A0` with embedded commas could partially survive sanitization in the report export path.

**Suggested Fix:**
Consolidate into a single shared CSV sanitization utility (e.g., `apps/api/src/lib/csv-utils.ts`) using the more robust pattern from `data-export.service.ts`.

---

### P3-1: Error Handler Exposes AccountingError Details to Client (OWASP A05)

**Severity:** P3 (Low)
**File:** `apps/api/src/domains/accounting/routes/report.ts:406-418`

**Issue:**
`handleAccountingError` exposes `error.details` directly to the client:

```typescript
return reply.status(error.statusCode).send({
  error: error.message,
  code: error.code,
  details: error.details,
});
```

While currently controlled, any future code passing internal data into `details` would leak it.

**Suggested Fix:**
Sanitize or omit `details` in production, or review all `AccountingError` constructors for information leakage.

---

### P3-2: Onboarding Route Logs Full Error Objects (OWASP A09)

**Severity:** P3 (Low)
**File:** `apps/api/src/domains/system/routes/onboarding.ts:284-288`

**Issue:**
Logging full error objects and stack traces may capture sensitive data (Prisma SQL fragments, Clerk API responses with user data).

**Suggested Fix:**
Log only `error.message` and `error.code`. Use structured logging with redaction for sensitive fields.

---

### P3-3: `sanitizeFilename` Does Not Prevent Empty Filenames (OWASP A05)

**Severity:** P3 (Low)
**File:** `apps/api/src/domains/accounting/routes/report.ts:396-400`

**Issue:**
If the input is entirely special characters, `sanitizeFilename` could produce an empty string. An empty `Content-Disposition` filename could cause unpredictable browser behavior.

**Suggested Fix:**
```typescript
const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
return sanitized || 'report';
```

---

### P3-4: PDF Timeout Timer Not Cleaned Up (OWASP A04)

**Severity:** P3 (Low)
**File:** `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx:36-38`

**Issue:**
The `setTimeout` timer in `Promise.race` is never cleared after successful PDF generation. Orphaned timers could accumulate under high concurrency.

**Suggested Fix:**
Store the timeout ID and `clearTimeout()` in both success and error paths.

---

### P3-5: Cache TTL Environment Variable Not Validated (OWASP A05)

**Severity:** P3 (Low)
**File:** `apps/api/src/domains/accounting/services/report-cache.ts:27-30`

**Issue:**
If `REPORT_CACHE_TTL_MS` is set to a non-numeric string, `parseInt` returns `NaN`. Since `NaN` comparisons always return `false`, the `Date.now() > entry.expiry` check would never evict entries, making the cache effectively permanent.

**Suggested Fix:**
```typescript
const parsed = parseInt(process.env.REPORT_CACHE_TTL_MS || '300000', 10);
private readonly DEFAULT_TTL_MS = Number.isFinite(parsed) && parsed > 0 ? parsed : 300000;
```

---

## Security Strengths (What Is Done Well)

### 1. Tenant Isolation in Report Queries -- PASS

Every raw SQL query in `report.service.ts` filters by `e."tenantId" = ${tenantId}` via the `tenantScopedQuery` wrapper. The wrapper provides defense-in-depth by checking the SQL template strings. The `validateEntityOwnership()` method adds a second layer of entity-level ownership validation.

### 2. SQL Injection Prevention -- PASS

All raw SQL uses Prisma tagged template literal syntax (`Prisma.sql`) which parameterizes all interpolated values. No use of `$queryRawUnsafe` anywhere in production code, and the hook in `.claude/hooks/hard-rules.sh` blocks it at the development level.

### 3. Authentication Chain -- PASS

The accounting routes index (`routes/index.ts` line 17-18) applies `authMiddleware` and `tenantMiddleware` as hooks on the parent scope. ALL child routes (including all 7 report routes) inherit authentication and tenant context. No report route can be accessed without a valid Clerk JWT.

### 4. Rate Limiting -- PASS

All 7 report endpoints apply `statsRateLimitConfig()` (50 req/min). Rate limiting is tenant+user scoped (line 67-68 of `rate-limit.ts`). The data export endpoint has a stricter limit (3 req/min).

### 5. CSV Formula Injection Prevention -- PASS (with P2-5 caveat)

Both CSV export implementations detect and neutralize formula injection prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`).

### 6. PDF Size Limits and Timeouts -- PASS

PDF generation enforces a 1000 line-item limit and 30-second timeout, preventing resource exhaustion.

### 7. Data Export Authorization -- PASS

The data export route uses `adminOnly` (OWNER/ADMIN), audit logs the export before streaming, and verifies entity ownership within the streaming function.

### 8. Input Validation with Zod -- PASS (with P1-2 caveat)

All report query parameters are validated. Entity IDs use `.cuid()`. Dates use `.coerce.date()`. Pagination limits are bounded (max 200).

### 9. Hook-Level Prevention -- PASS

`hard-rules.sh` blocks `$queryRawUnsafe`, float money values, hard deletes on financial models, and files in wrong locations.

### 10. Filename Sanitization -- PASS

`sanitizeFilename()` strips all characters except `[a-zA-Z0-9._-]` and truncates to 100 characters, preventing path traversal.

---

## Compliance Status

| Control | Status | Notes |
|---------|--------|-------|
| Authentication enforced | PASS | Clerk JWT via authMiddleware on all routes |
| Authorization checked | PARTIAL | RBAC middleware does not use canonical permission matrix (P1-1) |
| Tenant isolation | PASS | All queries filter by tenantId |
| Input validated | PARTIAL | `format` parameter bypasses Zod (P1-2) |
| Output encoded | PASS | CSV formula injection prevented |
| Secrets protected | PASS | No hardcoded secrets found |
| Audit logging present | PARTIAL | Data export logged; report views not logged |
| SQL injection prevented | PASS | All raw SQL parameterized, $queryRawUnsafe blocked |
| Rate limiting | PASS | 50 req/min on reports, 3 req/min on data export |
| Soft delete enforced | PASS | All report queries filter by `deletedAt IS NULL` |

---

## Recommendations by Priority

### Must Fix Before Launch (P1)

1. **Wire RBAC middleware to canonical permission matrix** (P1-1). Affects ALL domains.
2. **Add `format` to Zod schemas** and remove type assertions (P1-2). Quick fix.

### Should Fix Before Launch (P2)

3. **Enhance `tenantScopedQuery` check** to verify parameter presence (P2-1).
4. **Mask account numbers in data export** (P2-2).
5. **Verify client/vendor/category tenant scoping** in data export (P2-3).
6. **Add caching to all report methods** (P2-4).
7. **Consolidate CSV sanitization** into single utility (P2-5).

### Nice to Have (P3)

8. Sanitize error details in production (P3-1).
9. Reduce error logging verbosity (P3-2).
10. Add empty filename fallback (P3-3).
11. Clean up PDF timeout timers (P3-4).
12. Validate cache TTL environment variable (P3-5).

---

## Files Reviewed

| File | Lines | Purpose |
|------|-------|---------|
| `apps/api/src/domains/accounting/routes/report.ts` | 420 | Report API routes |
| `apps/api/src/domains/accounting/services/report.service.ts` | 1232 | Report generation queries |
| `apps/api/src/domains/accounting/services/report-cache.ts` | 158 | Cache with tenant scoping |
| `apps/api/src/domains/accounting/services/report-export.service.ts` | 290 | CSV export |
| `apps/api/src/domains/accounting/schemas/report.schema.ts` | 98 | Zod validation schemas |
| `apps/api/src/domains/accounting/templates/profit-loss-pdf.tsx` | 110 | PDF template |
| `apps/api/src/domains/accounting/templates/shared-styles.ts` | 210 | PDF styles and helpers |
| `apps/api/src/domains/accounting/errors.ts` | 40 | Error types |
| `apps/api/src/domains/accounting/routes/index.ts` | 51 | Route registration with middleware |
| `apps/api/src/lib/tenant-scoped-query.ts` | 33 | SQL injection prevention wrapper |
| `apps/api/src/lib/__tests__/tenant-scoped-query.test.ts` | 91 | Tests for wrapper |
| `apps/api/src/domains/system/services/data-export.service.ts` | 277 | Data backup export |
| `apps/api/src/domains/system/routes.ts` | 431 | System routes including data export |
| `apps/api/src/domains/system/routes/onboarding.ts` | 520 | Onboarding routes |
| `apps/api/src/middleware/auth.ts` | 92 | Clerk JWT verification |
| `apps/api/src/middleware/tenant.ts` | 78 | Tenant context middleware |
| `apps/api/src/middleware/rbac.ts` | 88 | RBAC enforcement |
| `apps/api/src/middleware/withPermission.ts` | 98 | Permission helper |
| `apps/api/src/middleware/rate-limit.ts` | 182 | Rate limiting |
| `packages/types/src/rbac/permissions.ts` | 391 | Canonical permission matrix |
| `.claude/hooks/hard-rules.sh` | 252 | Hook enforcement |

---

*Report generated by security-sentinel agent. All file paths are relative to project root (`w:\Marakana Corp\Companies\akount\Development\Brand\aggoogle\product-plan\`).*
