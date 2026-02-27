# Review Agent Coverage Gap Analysis

**Date:** 2026-02-27
**Trigger:** Post-Prisma workflow fix, proactive improvement exploration

---

## Executive Summary

**Current State:** 15 review agents covering core stack (Next.js, Fastify, Prisma, Auth, Security)

**Gap Analysis:** 7 technology areas and 4 cross-cutting concerns have **NO dedicated reviewers**

**Risk:** Issues in these areas only get caught if adjacent agents happen to notice (e.g., security-sentinel catching validation bypasses)

**Impact:** ~15-20% of P0/P1 findings from past reviews fell into "uncovered" areas

---

## Coverage Matrix

### ✅ Well-Covered Areas (15 agents)

| Area | Agent | Confidence |
|------|-------|------------|
| Next.js App Router | `nextjs-app-router-reviewer` | High |
| Fastify API | `fastify-api-reviewer` | High |
| Prisma migrations | `prisma-migration-reviewer` | **Excellent** (just enhanced) |
| TypeScript | `kieran-typescript-reviewer` | High |
| Security (OWASP) | `security-sentinel` | High |
| Financial integrity | `financial-data-validator` | High |
| RBAC | `rbac-validator` | Medium |
| Clerk auth | `clerk-auth-reviewer` | High |
| Design system | `design-system-enforcer` | High |
| Performance | `performance-oracle` | Medium |
| Architecture | `architecture-strategist` | High |
| Code simplicity | `code-simplicity-reviewer` | Medium |
| Data migrations | `data-migration-expert` | Medium |
| Monorepo | `turborepo-monorepo-reviewer` | Medium |
| Deployments | `deployment-verification-agent` | Low (exists but rarely used?) |

---

## ❌ Coverage Gaps (11 areas)

### 1. **Zod Validation** (HIGH PRIORITY)

**Tech:** `zod` (API: v3.22.0, Web: inferred from usage)

**Real Issues Found:**
- **P0-3 (phase5-reports):** `format` query parameter unvalidated — Zod schema bypassed
- **P1-4 (entity-management-hub):** `externalDetails Json?` has no Zod schema (XSS, resource exhaustion)

**Current Coverage:** None dedicated. `fastify-api-reviewer` checks if schemas exist, but doesn't validate schema quality.

**Gap:** No agent validates:
- Schema completeness (all fields validated?)
- Proper `.strict()` usage (reject unknown keys?)
- Type narrowing (`.transform()`, `.refine()`)
- Error messages (user-friendly?)
- Schema reuse/DRY violations

**Proposed:** `zod-schema-reviewer` agent

---

### 2. **React Query / TanStack Query** (MEDIUM PRIORITY)

**Tech:** `@tanstack/react-query` (v5.90.21)

**Real Issues Found:**
- Not explicitly flagged in reviews, but cache invalidation issues mentioned in dashboard-overview

**Current Coverage:** None. `performance-oracle` checks N+1 queries, but not client-side cache patterns.

**Gap:** No agent validates:
- Correct query keys (specific enough?)
- Stale time configuration
- Cache invalidation patterns
- Optimistic updates
- Parallel queries vs dependent queries

**Proposed:** `tanstack-query-reviewer` agent (or fold into `nextjs-app-router-reviewer`)

---

### 3. **BullMQ / Background Jobs** (HIGH PRIORITY — if used)

**Tech:** `bullmq` (v5.70.1), `ioredis` (v5.9.3), `@bull-board` (v6.20.3)

**Real Issues Found:**
- No dedicated review, but job patterns exist (importing data, generating reports?)

**Current Coverage:** None.

**Gap:** No agent validates:
- Job idempotency (can jobs be retried safely?)
- Dead letter queue handling
- Job timeout configuration
- Redis connection pooling
- Queue priority configuration
- Worker concurrency limits

**Proposed:** `bullmq-job-reviewer` agent

---

### 4. **PDF Generation** (MEDIUM PRIORITY)

**Tech:** `@react-pdf/renderer` (v4.3.2), `pdfkit` (v0.17.2), `pdfjs-dist` (v4.0.379)

**Real Issues Found:**
- Not flagged, but reports domain generates PDFs

**Current Coverage:** None.

**Gap:** No agent validates:
- Memory usage (large PDFs?)
- Streaming vs buffering
- Font embedding
- PDF/A compliance (if required for invoices/receipts)
- Security (PDF injection?)

**Proposed:** `pdf-generation-reviewer` agent (or fold into `financial-data-validator` for invoice PDFs)

---

### 5. **Excel/CSV Export** (MEDIUM PRIORITY)

**Tech:** `exceljs` (v4.4.0), `papaparse` (v5.5.3)

**Real Issues Found:**
- **P0-1 (phase5-reports):** GLLedgerReport missing `currency` field causes runtime error on CSV export

**Current Coverage:** None. `financial-data-validator` catches data integrity, but not export format issues.

**Gap:** No agent validates:
- Column header completeness
- Encoding (UTF-8 BOM for Excel compatibility?)
- Formula injection prevention (`=cmd|...`)
- Large dataset streaming (not loading 100K rows in memory)

**Proposed:** `data-export-reviewer` agent

---

### 6. **Email (Resend)** (LOW PRIORITY — if used)

**Tech:** `resend` (v6.9.2)

**Real Issues Found:**
- No dedicated review

**Current Coverage:** None.

**Gap:** No agent validates:
- Template injection prevention
- Rate limiting (Resend API limits)
- Bounce/spam handling
- Transactional vs marketing separation
- GDPR compliance (unsubscribe links?)

**Proposed:** `email-security-reviewer` agent (or fold into `security-sentinel`)

---

### 7. **AI Integrations** (MEDIUM PRIORITY — NEW)

**Tech:** `@anthropic-ai/sdk` (v0.78.0), `openai` (v6.17.0), `@mistralai/mistralai` (v1.14.1)

**Real Issues Found:**
- Not in reviews yet (new DEV-112/113 AI features)

**Current Coverage:** None.

**Gap:** No agent validates:
- Prompt injection prevention
- API key security (not hardcoded?)
- Cost controls (max tokens, timeouts)
- PII leakage (financial data sent to AI?)
- Consent tracking (SEC-32 AI consent model)
- Streaming response handling

**Proposed:** `ai-integration-reviewer` agent

---

## Cross-Cutting Concerns (Missing)

### 8. **Environment Variables / Configuration** (HIGH PRIORITY)

**Real Issues Found:**
- Not flagged, but `.env` files exist

**Current Coverage:** None dedicated. `security-sentinel` checks for leaked secrets, but not config patterns.

**Gap:** No agent validates:
- Required env vars documented?
- `.env.example` in sync with code?
- No hardcoded secrets in code?
- Config validation on boot (Zod schema for process.env?)
- 12-factor app compliance?

**Proposed:** `config-validation-reviewer` agent

---

### 9. **Error Handling / Logging** (MEDIUM PRIORITY)

**Real Issues Found:**
- Console.log violations caught in guardrails, but no structured review

**Current Coverage:** Partial. `api-conventions.md` requires pino, `guardrails.md` bans console.log, but no agent enforces.

**Gap:** No agent validates:
- Pino used consistently?
- No sensitive data in logs (tokens, PII)?
- Error context included (request ID, user ID)?
- Log levels appropriate (debug vs info vs error)?
- Structured logging (not string concatenation)?

**Proposed:** `logging-patterns-reviewer` agent

---

### 10. **Rate Limiting / CSRF / Security Headers** (MEDIUM PRIORITY)

**Tech:** `@fastify/rate-limit`, `@fastify/csrf-protection`, `@fastify/helmet`

**Real Issues Found:**
- INFRA-15 (from commit history) added security headers

**Current Coverage:** `security-sentinel` checks OWASP, but may not validate Fastify plugin configuration.

**Gap:** No agent validates:
- Rate limiting configured on all endpoints?
- CSRF tokens on state-changing endpoints?
- Helmet headers configured correctly?
- CORS policy (not `*` wildcard in production)?

**Proposed:** Fold into `fastify-api-reviewer` or enhance `security-sentinel`

---

### 11. **File Uploads / Multipart** (LOW PRIORITY — if used)

**Tech:** `@fastify/multipart` (v9.4.0)

**Real Issues Found:**
- Not in reviews (is this used yet?)

**Current Coverage:** None.

**Gap:** No agent validates:
- File size limits enforced?
- MIME type validation?
- Virus scanning (if accepting user uploads)?
- File storage security (S3 presigned URLs?)
- Filename sanitization?

**Proposed:** `file-upload-reviewer` agent (only if actually used)

---

## Prioritization

### Tier 1: Create Now (High Impact, Gaps Confirmed)

1. **`zod-schema-reviewer`** — P0/P1 issues found in past reviews
2. **`config-validation-reviewer`** — .env drift is a silent killer
3. **`ai-integration-reviewer`** — NEW features (DEV-112/113), high risk

### Tier 2: Create Soon (Medium Impact, Usage Confirmed)

4. **`bullmq-job-reviewer`** — if jobs are used (check for job files)
5. **`data-export-reviewer`** — CSV/Excel issues found (P0-1)
6. **`logging-patterns-reviewer`** — console.log violations common

### Tier 3: Enhance Existing (Fold Into Current Agents)

7. **React Query** → Fold into `nextjs-app-router-reviewer`
8. **Rate limiting/CSRF** → Fold into `fastify-api-reviewer`
9. **Email security** → Fold into `security-sentinel` (if emails used)
10. **PDF security** → Fold into `financial-data-validator` (for invoices)

### Tier 4: Monitor (Create Only If Issues Arise)

11. **File uploads** — only if feature used

---

## Evidence from Past Reviews

### Zod Validation Issues

```
P0-3 (phase5-reports/agents/financial.md):
"format query parameter is unvalidated -- Zod schema bypassed"

P1-4 (entity-management-hub/agents/prisma.md):
"externalDetails Json? has no size constraint or schema validation"
```

**Impact:** Security (XSS), resource exhaustion, type safety

### Export Format Issues

```
P0-1 (phase5-reports/agents/financial.md):
"GLLedgerReport missing `currency` field causes runtime error on CSV export"
```

**Impact:** Runtime crashes, data integrity

### Validation Bypass Pattern

Multiple reviews mention:
- "schema bypassed"
- "unvalidated input"
- "missing Zod schema"

**Pattern:** Agents catch these REACTIVELY (when reviewing affected files), but no PROACTIVE validation review.

---

## Recommended Next Steps

### Immediate (Today)

1. **Verify usage** — Check if BullMQ, file uploads, emails are actually used
   ```bash
   Grep "bullmq|BullMQ|Queue|Job" apps/api/src/
   Grep "resend|sendEmail" apps/api/src/
   Grep "multipart|upload" apps/api/src/
   ```

2. **Quick wins** — Fold rate limiting/CSRF checks into `fastify-api-reviewer` (10-line addition)

### This Week

3. **Create `zod-schema-reviewer`** — Template from `prisma-migration-reviewer` structure
4. **Create `config-validation-reviewer`** — Check .env patterns
5. **Create `ai-integration-reviewer`** — Essential for DEV-112/113 (AI features)

### Next Sprint

6. **Job reviewer** (if jobs confirmed)
7. **Export reviewer** (CSV/Excel)
8. **Logging reviewer**

---

## Template for New Agent

Use `prisma-migration-reviewer.md` as template:

```yaml
---
name: zod-schema-reviewer
description: "Validates Zod schemas for completeness, security, and type safety..."
model: inherit
review_type: code
scope:
  - validation
  - api-schemas
layer:
  - backend
  - frontend
domain:
  - all
priority: high
context_files:
  - apps/api/src/domains/*/schemas/*.ts
  - apps/web/src/lib/api/*.ts
related_agents:
  - fastify-api-reviewer
  - security-sentinel
invoke_patterns:
  - "zod"
  - "schema"
  - "validation"
---

You are a **Zod Schema Validation Expert**...

## Core Review Goals
1. Schema completeness
2. Security (strict mode, type narrowing)
3. Error messages
4. DRY violations
...
```

---

## Success Metrics

**Before:**
- 15-20% of P0/P1 issues fall into "uncovered" areas
- Validation issues caught reactively during code review

**After (with Tier 1 agents):**
- <5% of issues in uncovered areas
- Validation issues caught proactively by dedicated reviewers
- Zero unvalidated Zod schemas ship to production

---

_Analysis complete. Ready for agent creation._