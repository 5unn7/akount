# TypeScript Type Safety Review - Document Intelligence Phase 2

**Reviewer:** kieran-typescript-reviewer
**Review Date:** 2026-02-28
**Scope:** Last 24 hours (976 changed files, 204 commits)
**Focus:** Type safety, modern TS patterns, `:any` elimination

---

## Executive Summary

**Status:** IN PROGRESS

**Pre-flight Findings:** 3 `:any` types detected
- `apps/api/src/lib/prisma-observer.ts:200` - Prisma event listener
- `apps/api/src/middleware/csrf.ts:104` - CSRF token extraction
- `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx:89` - Query params

**Review Progress:**
- [x] Validate pre-flight `:any` findings - 3 examined
- [x] Check worker file job data typing - Excellent (InvoiceScanJobData, BillScanJobData properly typed)
- [x] Verify Anthropic API response types - Excellent (type guards, proper SDK types)
- [ ] Check async callback types
- [ ] Verify no dead exports
- [ ] Scan new Document Intelligence files for type safety

---

## Findings

### [P2] Justified `:any` in Prisma Query Observer
**File:** `apps/api/src/lib/prisma-observer.ts:200`
```typescript
prisma.$on('query', (event: any) => {
```
**Assessment:** **ACCEPTABLE** - Prisma's `$on` event types are not exported by the SDK. The event shape is documented but not typed. Alternative would be to define a local interface, but since this is logging-only code with no downstream type inference, the `:any` is justified.
**Recommendation:** Add comment explaining why `:any` is needed:
```typescript
// Prisma query event types are not exported - use any for now
prisma.$on('query', (event: any) => {
```

### [P2] Fastify Request Extension Type Gap
**File:** `apps/api/src/middleware/csrf.ts:104`
```typescript
export function getCsrfToken(request: any): string {
  return request.generateCsrf();
}
```
**Issue:** `@fastify/csrf-protection` adds `generateCsrf()` to the request object, but the types are not automatically extended. Using `:any` defeats type safety.
**Impact:** LOW - Single utility function, limited usage scope
**Fix:** Use Fastify type augmentation:
```typescript
import type { FastifyRequest } from 'fastify';

interface CsrfRequest extends FastifyRequest {
  generateCsrf(): string;
}

export function getCsrfToken(request: CsrfRequest): string {
  return request.generateCsrf();
}
```

### [P1] Query Params Should Use Type-Safe Pattern
**File:** `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx:89`
```typescript
const params: any = { entityId };
if (search) params.search = search;
if (filterType !== 'all') params.type = filterType;
```
**Issue:** Using `:any` for dynamic params object defeats type inference and creates runtime errors if backend API changes.
**Impact:** MEDIUM - Pattern repeated across frontend, causes API contract drift
**Fix:** Use explicit type or Record:
```typescript
const params: Record<string, string | undefined> = { entityId };
if (search) params.search = search;
if (filterType !== 'all') params.type = filterType;

// OR define interface matching API contract
interface GLAccountsParams {
  entityId: string;
  search?: string;
  type?: AccountType;
}

const params: Partial<GLAccountsParams> = { entityId };
```

### [P0] EXCELLENT: Worker Job Data Typing
**Files:**
- `apps/api/src/domains/ai/workers/invoice-scan.worker.ts`
- `apps/api/src/domains/ai/workers/bill-scan.worker.ts`

**Assessment:** Outstanding TypeScript patterns:
- Explicit `InvoiceScanJobData` interface with JSDoc
- Explicit `InvoiceScanJobResult` interface
- Fully typed BullMQ `Job<T>` generics: `Job<InvoiceScanJobData>`
- Worker typed as `Worker<InvoiceScanJobData, InvoiceScanJobResult>`
- No `:any` types in 338 lines of complex async processing

**Pattern to replicate:**
```typescript
export interface JobData {
  /** Field documentation */
  tenantId: string;
  imageBase64: string;
}

export interface JobResult {
  invoiceId?: string;
  confidence: number;
  status: 'DRAFT' | 'REVIEW_REQUIRED';
}

async function processJob(job: Job<JobData>): Promise<JobResult> {
  // Fully type-safe
}

const worker = new Worker<JobData, JobResult>('queue-name', processJob, options);
```

### [P0] EXCELLENT: Anthropic API Type Safety
**File:** `apps/api/src/domains/ai/services/providers/claude.provider.ts`

**Assessment:** Exceptional type safety:
- Type guard for content blocks: `block is Anthropic.TextBlock`
- Proper SDK error typing: `error instanceof Anthropic.APIError`
- Sanitized error re-throwing with explicit types
- No `:any` usage despite complex SDK types

**Highlight:**
```typescript
const textContent = response.content
  .filter((block): block is Anthropic.TextBlock => block.type === 'text')
  .map((block) => block.text)
  .join('');
```
This is **modern TypeScript** (type predicates) at its best.

### [P1] Async Callback Typed as Synchronous
**File:** `apps/web/src/app/(dashboard)/accounting/chart-of-accounts/gl-account-sheet.tsx:45`
```typescript
interface GLAccountSheetProps {
  onSubmit: () => void; // ❌ WRONG
}
```
**Issue:** The `handleSubmit` function passed to `onSubmit` is `async` (line 131 in `chart-of-accounts-client.tsx`), but the type signature is `() => void`. This drops the Promise return type, hiding potential unhandled rejections.
**Impact:** MEDIUM - Async errors may not surface properly
**Fix:**
```typescript
interface GLAccountSheetProps {
  onSubmit: () => void | Promise<void>; // ✅ CORRECT
}
```
**Pattern note:** All async callbacks (`onClick`, `onSubmit`, `onSave`) should use `() => void | Promise<void>` to allow both sync and async implementations.

