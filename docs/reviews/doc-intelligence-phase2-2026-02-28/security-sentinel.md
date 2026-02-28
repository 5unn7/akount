# Security Sentinel Review - Document Intelligence Phase 2

**Review Date:** 2026-02-28
**Scope:** OWASP Top 10, Authentication, Tenant Isolation, Input Validation
**Period:** Last 24 hours (204 commits, 976 changed files)
**Risk Level:** ANALYZING...

## Executive Summary

**Status:** IN PROGRESS
**Files Reviewed:** 0 / ~150 security-relevant files
**Findings:** 0 (Critical: 0, High: 0, Medium: 0, Low: 0)

---

## Security Findings

### [P1] Missing Entity Ownership Validation in Bill Scan Worker

**Files:**
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts:162-169`
- `apps/api/src/domains/ai/workers/invoice-scan.worker.ts:162-170` (same issue)

**Issue:** Workers accept `entityId` from job data without validating that the entity belongs to the specified `tenantId`. While the **upload routes** validate entity ownership correctly (bill-scan.ts:102-110), workers process job data without re-validation. This creates a defense-in-depth gap.

**Attack Vector:**
1. Attacker gains access to Redis (via exploit or internal service compromise)
2. Manually enqueues job with `tenantId=A` but `entityId=B` (belonging to tenant C)
3. Worker bypasses route-level validation, creates bill/vendor using foreign `entityId`
4. Bill appears in attacker's entity context (cross-tenant data pollution)
5. AIDecisionLog records wrong tenant association

**Impact:** MEDIUM - Cross-tenant data pollution, audit trail corruption, potential GDPR violations (bills created in wrong tenant context). **Likelihood: LOW** (requires Redis access or internal service exploit). **Defense-in-depth issue** - route validation is present but worker lacks redundant check.

**Fix:** Add entity ownership validation in worker before processing:
```typescript
// Bill worker line 74, Invoice worker line 73 — after extracting job data
const entity = await prisma.entity.findFirst({
  where: { id: entityId, tenantId },
  select: { id: true }
});

if (!entity) {
  logger.error({ jobId: job.id, tenantId, entityId }, 'Entity ownership validation failed');
  throw new Error(`Entity ${entityId} not found or access denied for tenant ${tenantId}`);
}
```

---

### [P2] Potential CSRF Bypass on Multipart Upload Endpoints

**Files:**
- `apps/api/src/domains/business/routes/bill-scan.ts:68-73`
- `apps/api/src/domains/business/routes/invoice-scan.ts` (similar)
- `apps/api/src/middleware/csrf.ts:60-89`

**Issue:** CSRF middleware (csrf.ts) uses `request.csrfProtection()` which may not support multipart/form-data uploads by default. The fastify-csrf-protection plugin's `getToken` function reads from `X-CSRF-Token` header, but multipart uploads from `<form>` elements cannot set custom headers (browsers block this).

**Attack Vector:**
1. Attacker creates malicious HTML page: `<form action="https://akount.com/api/business/bills/scan" method="POST" enctype="multipart/form-data">`
2. Form includes hidden `entityId` field + file input
3. Victim visits attacker's page while logged into Akount
4. Form auto-submits via JavaScript
5. If CSRF token is not validated for multipart uploads, bill scan job is created

**Impact:** MEDIUM - CSRF attack allows unauthorized document scans, consuming AI credits and potentially creating fraudulent bills. **Likelihood: MEDIUM** (depends on whether @fastify/csrf-protection validates multipart correctly).

**Verification Needed:**
1. Test if `@fastify/csrf-protection` plugin validates CSRF for multipart/form-data
2. Check if current implementation requires `X-CSRF-Token` header (which forms cannot send)

**Fix (if vulnerable):**
```typescript
// Option 1: Require CSRF token in form field (not header) for multipart uploads
// In csrf.ts getToken function:
getToken: (request) => {
  const headerToken = request.headers['x-csrf-token'];
  if (headerToken && typeof headerToken === 'string') return headerToken;

  // For multipart uploads, read from form field
  if (request.body && typeof request.body === 'object') {
    return (request.body as any)._csrf;
  }

  return request.query._csrf as string | undefined;
}

// Option 2: Use SameSite=Strict cookies (already set in csrf.ts:44)
// This prevents cross-site form submissions entirely (preferred)
```

**Recommended:** Verify current CSRF protection works for multipart uploads via integration test. If SameSite=Strict is working correctly, this is a non-issue (forms from attacker's domain won't send cookies).

---

### [P2] Console.log in Production Code (3 instances)

**Files:**
- `apps/api/src/domains/ai/services/rule-engine.service.ts:75` - `console.error('Failed to increment execution:', err)`
- `apps/api/src/domains/ai/services/rule-engine.service.ts:118` - `console.error('Failed to batch increment execution:', err)`
- `apps/api/src/domains/ai/routes/jobs.ts:18` - `console.log('Progress:', data.progress)` (in comment only — false positive)

**Issue:** Production code uses `console.error` instead of structured logging via `request.log` or `server.log`. This bypasses log aggregation, prevents correlation with request IDs, and makes debugging harder.

**Impact:** LOW - Observability gap, makes incident response slower. Not a direct security issue but violates logging standards.

**Fix:**
```typescript
// rule-engine.service.ts line 75
.catch((err) => logger.error({ err, executionCount }, 'Failed to increment execution count'));

// rule-engine.service.ts line 118
).catch((err) => logger.error({ err, executionCounts }, 'Failed to batch increment execution counts'));
```

---

## Analysis Log

Starting progressive analysis of Document Intelligence Phase 2 changes...

**Files analyzed:**
- apps/api/src/domains/ai/workers/bill-scan.worker.ts (335 lines) ✅
- apps/api/src/domains/ai/workers/invoice-scan.worker.ts (similar issue) ✅
- apps/api/src/lib/file-scanner.ts (297 lines) — EXCELLENT security ✅
- apps/api/src/domains/business/routes/bill-scan.ts (181 lines) — Entity validation present ✅
- apps/api/src/middleware/csrf.ts (108 lines) — Double submit cookie pattern ✅
- apps/api/src/lib/env.ts (API keys properly protected) ✅
- apps/api/src/domains/ai/services/document-extraction.service.ts (PII redaction + prompt defense) ✅
- apps/api/src/domains/ai/routes/jobs.ts (221 lines) — Tenant validation on SSE ✅

**Security strengths observed:**
- ✅ File scanner with 4-layer validation (size, magic bytes, content patterns, ClamAV)
- ✅ PII redaction before sending to Anthropic/Mistral
- ✅ Prompt injection defense
- ✅ CSRF protection with double submit cookie
- ✅ API keys from env, not hardcoded
- ✅ Entity ownership validation in upload routes
- ✅ Job stream validates tenant ownership
- ✅ Rate limiting present (100 jobs/tenant/minute)
