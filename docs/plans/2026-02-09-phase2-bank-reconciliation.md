# Phase 2: Bank Reconciliation Implementation Plan

**Created:** 2026-02-09
**Phase:** Phase 2 - Bank Reconciliation
**Status:** Ready for Implementation
**Estimated Effort:** 45-60 hours (over 2-3 weeks)

---

## Overview

Phase 2 enables users to import bank transactions from CSV files, match them with manually posted transactions, and track reconciliation status. This is the foundation for automated bookkeeping and cash flow management.

**Key Features:**
1. **Transaction Management** - CRUD operations for posted transactions
2. **CSV & PDF Import** - Upload and parse bank statements (CSV/PDF) with deduplication
3. **Auto-Matching** - Suggest matches between bank feeds and posted transactions
4. **Manual Reconciliation** - Users can match/unmatch transactions manually

---

## Success Criteria

- [ ] Users can create, edit, view, and delete posted transactions
- [ ] Users can upload CSV bank statements with column mapping
- [ ] Users can upload PDF bank statements (auto-parsed with regex)
- [ ] System deduplicates transactions automatically (idempotent imports)
- [ ] Auto-match suggests matches with confidence scores (>80% accuracy for exact matches)
- [ ] Users can manually match/unmatch transactions
- [ ] Reconciliation status is tracked per account (matched vs unmatched counts)
- [ ] All services follow SRP (Single Responsibility Principle)
- [ ] 80%+ test coverage for new services and routes
- [ ] Tenant isolation enforced in all queries

---

## Architecture

### Data Flow
```
CSV/PDF Upload → File Type Detection → Parser (CSV or PDF) → Deduplicator → ImportBatch + BankFeedTransactions
                                                                                     ↓
Posted Transactions ← Manual Entry                                            Auto-Match Algorithm
         ↓                                                                           ↓
    TransactionMatch ← Manual Match/Unmatch Decision
         ↓
    Reconciliation Status (Dashboard Widget)
```

### Services (SRP-Compliant)
1. **TransactionService** - Manage posted Transaction records (CRUD)
2. **ImportService** - Orchestrate CSV import workflow
3. **ReconciliationService** - Match bank feeds to posted transactions
4. **ParserService** ✅ (exists) - Parse CSV/PDF/OFX files
5. **DuplicationService** ✅ (exists) - Detect duplicate transactions

---

## Sprint Breakdown

### Sprint 1: Transaction Foundation (Week 1 - 15-20 hours)
**Goal:** Enable manual transaction posting

**Tasks:**
- Create TransactionService with CRUD operations
- Create transaction routes with Zod validation
- Write comprehensive tests (20+ tests)
- Frontend: Manual transaction entry form (optional - can defer to Phase 3)

**Deliverable:** Users can manually post transactions via API

---

### Sprint 2: CSV & PDF Import Infrastructure (Week 2 - 18-24 hours)
**Goal:** Enable CSV and PDF bank statement imports

**Tasks:**
- Create ImportService (orchestrator for both CSV and PDF)
- Enhance existing import.ts route for CSV upload
- Add PDF upload route
- Connect Parser (CSV/PDF) → Deduplicator → Storage flow
- Add column mapping UI for CSV (frontend)
- Add import batch listing and status

**Deliverable:** Users can upload CSV or PDF files and see imported BankFeedTransactions

---

### Sprint 3: Auto-Matching & Reconciliation (Week 2-3 - 15-20 hours)
**Goal:** Match imported transactions with posted transactions

**Tasks:**
- Create ReconciliationService with matching algorithm
- Create match/unmatch routes
- Add reconciliation status endpoint
- Add reconciliation dashboard widget (frontend)

**Deliverable:** Users can see suggested matches and manually match/unmatch

---

## Tasks (Detailed)

### Task 1: Create TransactionService (Est: 3-4 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/services/transaction.service.ts`

**Description:**
Create service class following AccountService pattern with CRUD operations for Transaction model.

**Methods to Implement:**
```typescript
class TransactionService {
  constructor(private tenantId: string) {}

  // List transactions with filters and pagination
  async listTransactions(params: ListTransactionsParams): Promise<PaginatedTransactions>

  // Get single transaction by ID
  async getTransaction(id: string): Promise<Transaction | null>

  // Create new posted transaction
  async createTransaction(data: CreateTransactionInput): Promise<Transaction>

  // Update existing transaction
  async updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction>

  // Soft delete transaction
  async softDeleteTransaction(id: string): Promise<void>
}
```

**Tenant Isolation:**
- All queries filter by `account.entity.tenantId`
- Verify account belongs to tenant before creating transaction

**Success Criteria:**
- [ ] Service class exported with all 5 methods
- [ ] Tenant isolation enforced (nested entity check)
- [ ] Soft delete filter applied (deletedAt: null)
- [ ] Cursor-based pagination for listTransactions
- [ ] TypeScript types defined for inputs/outputs

**Edge Cases:**
- **Account doesn't belong to tenant:** Throw 403 error
- **Transaction not found:** Return null (getTransaction) or throw 404
- **Invalid data:** Zod validation in route will catch

---

### Task 2: Create Transaction Schemas (Est: 1-2 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/schemas/transaction.schema.ts`

**Description:**
Define Zod schemas for transaction validation following existing schema patterns.

**Schemas to Create:**
```typescript
// POST /api/banking/transactions
export const CreateTransactionSchema = z.object({
  accountId: z.string().cuid(),
  date: z.string().datetime(), // ISO 8601
  description: z.string().min(1).max(500),
  amount: z.number().int(), // Integer cents
  currency: z.string().length(3), // ISO 4217 (USD, CAD, EUR)
  categoryId: z.string().cuid().optional(),
  notes: z.string().max(1000).optional(),
  sourceType: z.enum(['MANUAL', 'BANK_FEED', 'INVOICE', 'BILL']),
  sourceId: z.string().cuid().optional(),
})

// PATCH /api/banking/transactions/:id
export const UpdateTransactionSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  categoryId: z.string().cuid().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

// GET /api/banking/transactions (query params)
export const ListTransactionsQuerySchema = z.object({
  accountId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  categoryId: z.string().cuid().optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
})
```

**Success Criteria:**
- [ ] All schemas export successfully
- [ ] Integer cents validation for amount
- [ ] Date validation (ISO 8601)
- [ ] Currency code validation (3 letters)
- [ ] Optional fields properly typed

---

### Task 3: Create Transaction Routes (Est: 3-4 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/routes/transactions.ts`

**Description:**
Create RESTful routes for transaction CRUD operations.

**Routes to Implement:**
```typescript
// GET /api/banking/transactions - List transactions
fastify.get('/', { onRequest: [authMiddleware, tenantMiddleware] })

// GET /api/banking/transactions/:id - Get single transaction
fastify.get('/:id', { onRequest: [authMiddleware, tenantMiddleware] })

// POST /api/banking/transactions - Create transaction
fastify.post('/', { onRequest: [authMiddleware, tenantMiddleware] })

// PATCH /api/banking/transactions/:id - Update transaction
fastify.patch('/:id', { onRequest: [authMiddleware, tenantMiddleware] })

// DELETE /api/banking/transactions/:id - Soft delete
fastify.delete('/:id', { onRequest: [authMiddleware, tenantMiddleware] })
```

**Middleware Chain:**
1. authMiddleware → set request.userId
2. tenantMiddleware → set request.tenantId
3. Zod validation → validate request body/params
4. Route handler → call TransactionService

**Success Criteria:**
- [ ] All 5 routes registered
- [ ] Zod schemas applied to all routes
- [ ] Auth + tenant middleware on all routes
- [ ] Proper status codes (200, 201, 204, 400, 404)
- [ ] Error handling for all edge cases

**Edge Cases:**
- **Missing required fields:** Return 400 with Zod errors
- **Invalid transaction ID format:** Return 400 (CUID validation)
- **Transaction not found:** Return 404
- **Account doesn't belong to tenant:** Return 403

---

### Task 4: Register Transaction Routes (Est: 15 minutes)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/routes/index.ts`

**Description:**
Register new transaction routes in banking routes index.

**Changes:**
```typescript
import { transactionRoutes } from './transactions'

export async function bankingRoutes(fastify: FastifyInstance) {
  // ... existing routes
  await fastify.register(transactionRoutes, { prefix: '/transactions' })
}
```

**Success Criteria:**
- [ ] Route registered with /transactions prefix
- [ ] No TypeScript errors
- [ ] Server starts without errors
- [ ] Routes accessible at /api/banking/transactions

---

### Task 5: Write Transaction Service Tests (Est: 4-5 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/services/__tests__/transaction.service.test.ts`

**Description:**
Comprehensive unit tests for TransactionService following existing test patterns.

**Test Cases (25+ tests):**

**listTransactions:**
- [ ] Returns transactions for tenant accounts only
- [ ] Filters by accountId correctly
- [ ] Filters by date range (startDate, endDate)
- [ ] Filters by categoryId
- [ ] Excludes soft-deleted transactions
- [ ] Returns cursor pagination (nextCursor, hasMore)
- [ ] Respects limit (default 50, max 100)
- [ ] Orders by date DESC (newest first)
- [ ] Includes account + entity relations

**getTransaction:**
- [ ] Returns transaction for valid ID in tenant
- [ ] Returns null for transaction in different tenant
- [ ] Returns null for soft-deleted transaction
- [ ] Returns null for non-existent ID

**createTransaction:**
- [ ] Creates transaction with valid data
- [ ] Enforces tenant isolation (account must belong to tenant)
- [ ] Sets default values (isStaged: false, isSplit: false)
- [ ] Stores amount as integer cents
- [ ] Rejects if account doesn't belong to tenant

**updateTransaction:**
- [ ] Updates description successfully
- [ ] Updates categoryId successfully
- [ ] Updates notes successfully
- [ ] Rejects if transaction in different tenant
- [ ] Rejects if transaction is soft-deleted

**softDeleteTransaction:**
- [ ] Sets deletedAt timestamp
- [ ] Rejects if already deleted
- [ ] Rejects if transaction in different tenant

**Success Criteria:**
- [ ] 25+ tests passing
- [ ] Test coverage >80%
- [ ] Uses mockDeep<PrismaClient>() pattern
- [ ] Tests tenant isolation thoroughly
- [ ] Tests soft delete filtering

---

### Task 6: Write Transaction Route Tests (Est: 2-3 hours)
**Priority:** 🟡 HIGH
**File:** `apps/api/src/domains/banking/routes/__tests__/transactions.test.ts`

**Description:**
Integration tests for transaction routes.

**Test Cases (15+ tests):**

**GET /api/banking/transactions:**
- [ ] Returns 200 with transactions array
- [ ] Returns 401 without auth
- [ ] Respects query filters (accountId, dates)
- [ ] Returns pagination metadata

**GET /api/banking/transactions/:id:**
- [ ] Returns 200 with transaction
- [ ] Returns 404 for non-existent ID
- [ ] Returns 400 for invalid ID format
- [ ] Returns 404 for other tenant's transaction

**POST /api/banking/transactions:**
- [ ] Returns 201 with created transaction
- [ ] Returns 400 for invalid data
- [ ] Returns 403 if account not in tenant
- [ ] Validates required fields (accountId, date, description, amount)

**PATCH /api/banking/transactions/:id:**
- [ ] Returns 200 with updated transaction
- [ ] Returns 404 for non-existent ID
- [ ] Returns 400 for invalid data
- [ ] Prevents updating immutable fields (amount, date)

**DELETE /api/banking/transactions/:id:**
- [ ] Returns 204 on success
- [ ] Returns 404 for non-existent ID
- [ ] Soft deletes (sets deletedAt)
- [ ] Transaction excluded from future queries

**Success Criteria:**
- [ ] 15+ tests passing
- [ ] Tests all status codes (200, 201, 204, 400, 401, 403, 404)
- [ ] Tests Zod validation errors
- [ ] Tests tenant isolation

---

### Task 7: Create ImportService (Est: 5-6 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/services/import.service.ts`

**Description:**
Orchestrate CSV and PDF import workflow: detect format → parse → deduplicate → store.

**Methods to Implement:**
```typescript
class ImportService {
  constructor(private tenantId: string) {}

  // Create import batch and parse CSV (with column mapping)
  async createCSVImport(
    file: Buffer,
    accountId: string,
    columnMappings?: ColumnMappings
  ): Promise<ImportBatchWithPreview>

  // Create import batch and parse PDF (auto-parsed with regex)
  async createPDFImport(
    file: Buffer,
    accountId: string
  ): Promise<ImportBatchWithPreview>

  // Get import batch status
  async getImportBatch(id: string): Promise<ImportBatchWithTransactions | null>

  // List import batches for tenant
  async listImportBatches(params: ListImportsParams): Promise<PaginatedImportBatches>
}
```

**Workflow (CSV):**
1. Validate account belongs to tenant
2. Create ImportBatch record (status: PROCESSING, sourceType: CSV)
3. Call ParserService.parseCSV(file, columnMappings)
4. Call DuplicationService.detectDuplicates(parsed, accountId)
5. Filter out duplicates
6. Create BankFeedTransaction records
7. Update ImportBatch (status: COMPLETED or FAILED)
8. Return batch with stats (total, imported, duplicates)

**Workflow (PDF):**
1. Validate account belongs to tenant
2. Create ImportBatch record (status: PROCESSING, sourceType: PDF)
3. Call ParserService.parsePDF(file) ✅ (already exists)
4. Call DuplicationService.detectDuplicates(parsed, accountId)
5. Filter out duplicates
6. Create BankFeedTransaction records
7. Update ImportBatch (status: COMPLETED or FAILED)
8. Return batch with stats (total, imported, duplicates)

**Success Criteria:**
- [ ] Service orchestrates full import workflow for both CSV and PDF
- [ ] Creates ImportBatch + BankFeedTransactions atomically
- [ ] Handles parser errors gracefully (status: FAILED)
- [ ] Deduplicates using existing DuplicationService
- [ ] Tenant isolation enforced
- [ ] PDF parsing uses existing parsePDF function

**Edge Cases:**
- **Account doesn't belong to tenant:** Throw 403
- **CSV/PDF parsing fails:** Set batch status to FAILED, store error
- **All transactions are duplicates:** Import 0, status COMPLETED
- **Partial duplicates:** Import non-duplicates only
- **PDF has no transactions:** Set batch status to FAILED with helpful error
- **PDF is password-protected or image-only:** Return clear error message

---

### Task 8: Enhance Import Routes (Est: 3-4 hours)
**Priority:** 🔴 CRITICAL
**File:** `apps/api/src/domains/banking/routes/import.ts` (modify existing)

**Description:**
Update existing import route to use new ImportService with both CSV and PDF support.

**Current State:**
- Route exists but may be incomplete or use old patterns
- Check and refactor to follow new service pattern

**Routes to Implement:**
```typescript
// POST /api/banking/imports/csv - Upload CSV file
fastify.post('/csv', {
  onRequest: [authMiddleware, tenantMiddleware],
  schema: {
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        accountId: { type: 'string' },
        columnMappings: { type: 'object' }, // optional for CSV
      },
      required: ['file', 'accountId'],
    },
  },
})

// POST /api/banking/imports/pdf - Upload PDF file (NEW)
fastify.post('/pdf', {
  onRequest: [authMiddleware, tenantMiddleware],
  schema: {
    consumes: ['multipart/form-data'],
    body: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        accountId: { type: 'string' },
      },
      required: ['file', 'accountId'],
    },
  },
})

// GET /api/banking/imports - List import batches
fastify.get('/', { onRequest: [authMiddleware, tenantMiddleware] })

// GET /api/banking/imports/:id - Get import details
fastify.get('/:id', { onRequest: [authMiddleware, tenantMiddleware] })
```

**File Type Validation:**
- CSV: Check `file.mimetype === 'text/csv'` or `.csv` extension
- PDF: Check `file.mimetype === 'application/pdf'` or `.pdf` extension
- Return 400 if wrong file type for endpoint

**Success Criteria:**
- [ ] CSV upload working with multipart/form-data
- [ ] PDF upload working with multipart/form-data (NEW)
- [ ] Column mappings passed to ImportService for CSV
- [ ] File type validation on both routes
- [ ] Returns import batch ID immediately (async processing)
- [ ] List imports route returns batches for tenant
- [ ] Get import route returns batch + transactions
- [ ] Both routes use ImportService methods (createCSVImport, createPDFImport)

---

### Task 9: Create ReconciliationService (Est: 5-6 hours)
**Priority:** 🟡 HIGH
**File:** `apps/api/src/domains/banking/services/reconciliation.service.ts`

**Description:**
Match bank feed transactions with posted transactions using fuzzy matching algorithm.

**Methods to Implement:**
```typescript
class ReconciliationService {
  constructor(private tenantId: string) {}

  // Suggest matches for a bank feed transaction
  async suggestMatches(
    bankFeedTransactionId: string,
    limit?: number
  ): Promise<MatchSuggestion[]>

  // Create manual match
  async createMatch(
    bankFeedTransactionId: string,
    transactionId: string
  ): Promise<TransactionMatch>

  // Unmatch transaction
  async unmatch(matchId: string): Promise<void>

  // Get reconciliation status for account
  async getReconciliationStatus(accountId: string): Promise<ReconciliationStatus>
}
```

**Matching Algorithm:**
```typescript
// Confidence scoring (0.0 - 1.0)
1. Exact amount match + date within ±3 days + description fuzzy >70% = 0.95 (HIGH)
2. Exact amount match + date within ±3 days = 0.80 (MEDIUM)
3. Exact amount match + date within ±7 days = 0.60 (MEDIUM)
4. Amount match only = 0.40 (LOW)

// Return top 5 suggestions sorted by confidence DESC
```

**Fuzzy Description Matching:**
- Use Levenshtein distance or similar algorithm
- Normalize: lowercase, remove extra spaces, remove special chars
- Match threshold: >70% similarity

**Success Criteria:**
- [ ] Suggests top 5 matches with confidence scores
- [ ] Exact amount + close date = high confidence
- [ ] CreateMatch updates TransactionMatch table
- [ ] Unmatch soft deletes TransactionMatch
- [ ] Reconciliation status shows matched/unmatched counts

**Edge Cases:**
- **No matches found:** Return empty array
- **Already matched:** Throw error (409 Conflict)
- **Transaction in different tenant:** Throw 403
- **Multiple high-confidence matches:** Return all, let user choose

---

### Task 10: Create Reconciliation Routes (Est: 2-3 hours)
**Priority:** 🟡 HIGH
**File:** `apps/api/src/domains/banking/routes/reconciliation.ts`

**Description:**
Create routes for matching and reconciliation status.

**Routes to Implement:**
```typescript
// GET /api/banking/reconciliation/:bankFeedTransactionId/suggestions
// Returns suggested matches with confidence scores
fastify.get('/:bankFeedTransactionId/suggestions', { ... })

// POST /api/banking/reconciliation/matches
// Create manual match
fastify.post('/matches', {
  schema: {
    body: z.object({
      bankFeedTransactionId: z.string().cuid(),
      transactionId: z.string().cuid(),
    }),
  },
})

// DELETE /api/banking/reconciliation/matches/:matchId
// Unmatch transaction
fastify.delete('/matches/:matchId', { ... })

// GET /api/banking/reconciliation/status/:accountId
// Get reconciliation status (matched vs unmatched counts)
fastify.get('/status/:accountId', { ... })
```

**Success Criteria:**
- [ ] All 4 routes registered
- [ ] Zod validation on all inputs
- [ ] Auth + tenant middleware on all routes
- [ ] Returns proper status codes

---

### Task 11: Write Reconciliation Tests (Est: 4-5 hours)
**Priority:** 🟡 HIGH
**File:** `apps/api/src/domains/banking/services/__tests__/reconciliation.service.test.ts`

**Description:**
Unit tests for matching algorithm and reconciliation service.

**Test Cases (20+ tests):**

**suggestMatches:**
- [ ] Returns exact amount + close date as HIGH confidence
- [ ] Returns exact amount + far date as MEDIUM confidence
- [ ] Returns top 5 suggestions max
- [ ] Excludes already matched transactions
- [ ] Fuzzy matches on description
- [ ] Returns empty array if no matches

**createMatch:**
- [ ] Creates TransactionMatch record
- [ ] Updates BankFeedTransaction status to MATCHED
- [ ] Rejects if already matched
- [ ] Rejects if transaction in different tenant

**unmatch:**
- [ ] Deletes TransactionMatch
- [ ] Updates BankFeedTransaction status to PENDING
- [ ] Rejects if match doesn't exist

**getReconciliationStatus:**
- [ ] Returns matched count
- [ ] Returns unmatched count
- [ ] Calculates reconciliation percentage
- [ ] Filters by account correctly

**Success Criteria:**
- [ ] 20+ tests passing
- [ ] Algorithm accuracy tested
- [ ] Tenant isolation tested
- [ ] Edge cases covered

---

## Files Summary

### Create (New Files)
```
apps/api/src/domains/banking/
├── services/
│   ├── transaction.service.ts           (Task 1)
│   ├── import.service.ts                (Task 7)
│   └── reconciliation.service.ts        (Task 9)
├── routes/
│   ├── transactions.ts                  (Task 3)
│   └── reconciliation.ts                (Task 10)
├── schemas/
│   └── transaction.schema.ts            (Task 2)
└── __tests__/
    ├── services/
    │   ├── transaction.service.test.ts  (Task 5)
    │   └── reconciliation.service.test.ts (Task 11)
    └── routes/
        └── transactions.test.ts         (Task 6)
```

### Modify (Existing Files)
```
apps/api/src/domains/banking/
├── routes/
│   ├── index.ts                         (Task 4 - register routes)
│   └── import.ts                        (Task 8 - enhance with ImportService)
```

### Reference (Read for Patterns)
```
packages/db/prisma/schema.prisma         (Transaction, BankFeedTransaction, TransactionMatch models)
apps/api/src/domains/banking/services/account.service.ts  (Service pattern)
apps/api/src/domains/banking/routes/accounts.ts           (Route pattern)
apps/api/src/domains/banking/services/parser.service.ts   (Parser for CSV)
apps/api/src/domains/banking/services/duplication.service.ts (Deduplication)
```

---

## Testing Strategy

### Unit Tests (vitest)
- **TransactionService:** 25+ tests (CRUD + tenant isolation)
- **ReconciliationService:** 20+ tests (matching algorithm)
- **ImportService:** 15+ tests (orchestration flow)

### Integration Tests (vitest)
- **Transaction Routes:** 15+ tests (HTTP status codes)
- **Import Routes:** 10+ tests (file upload)
- **Reconciliation Routes:** 10+ tests (match/unmatch)

### E2E Tests (Playwright) - Phase 3
- Defer to Phase 3 (requires frontend)

### Target Coverage
- **Overall:** 80%+ for new code
- **Critical paths:** 90%+ (transaction creation, matching)

---

## Edge Cases & Error Handling

### Tenant Isolation Violations
- **Account doesn't belong to tenant:** Return 403 Forbidden
- **Transaction in different tenant:** Return 404 Not Found
- **All queries filter by entity.tenantId**

### Data Validation
- **Invalid CUID:** Return 400 Bad Request (Zod validation)
- **Invalid date format:** Return 400 Bad Request
- **Amount not integer:** Return 400 Bad Request
- **Missing required fields:** Return 400 with Zod errors

### Import Edge Cases
- **Empty CSV file:** Return 400 with error message
- **Invalid CSV format:** Return 400 with parser error
- **All duplicates:** Import batch COMPLETED, 0 imported
- **Partial duplicates:** Import non-duplicates only

### Matching Edge Cases
- **No matches found:** Return empty array (200 OK)
- **Already matched:** Return 409 Conflict
- **Multiple high-confidence matches:** Return all, user chooses
- **Transaction amount mismatch:** Lower confidence score

### Soft Delete
- **Deleted transactions:** Excluded from all queries (WHERE deletedAt IS NULL)
- **Cascade deletes:** NOT used on financial data (preserve audit trail)

---

## Rollback Plan

### If Critical Bug Found
1. Revert latest commit: `git revert HEAD`
2. Deploy previous version
3. Fix bug in feature branch
4. Re-test thoroughly
5. Re-deploy

### Database Migrations
- **No schema changes in Phase 2** (all models already exist)
- If migration needed: Test in staging first, have rollback SQL ready

### Feature Flags (Future)
- Phase 8: Add feature flags for phased rollout
- For now: Deploy to staging first, manual testing

---

## SRP Compliance Checklist

Before merging each service:
- [ ] Can describe service in ONE sentence without "and"
- [ ] Service has single clear responsibility
- [ ] File size under 400 lines (split if larger)
- [ ] No mixing of HTTP + business logic
- [ ] No mixing of unrelated domains
- [ ] Tests are focused and easy to write

**Examples:**
- ✅ TransactionService: "Manage posted transaction records"
- ✅ ImportService: "Orchestrate CSV import workflow"
- ✅ ReconciliationService: "Match bank feeds to posted transactions"

---

## Progress Tracking

### Sprint 1: Transaction Foundation ✅ COMPLETE
- [x] Task 1: TransactionService (3-4h) — Commit: ff37830
- [x] Task 2: Transaction Schemas (1-2h)
- [x] Task 3: Transaction Routes (3-4h)
- [x] Task 4: Register Routes (15m)
- [x] Task 5: Service Tests (4-5h) — 35 tests
- [x] Task 6: Route Tests (2-3h) — 20 tests

**Total:** 55 tests passing

### Sprint 2: CSV & PDF Import ✅ COMPLETE
- [x] Task 7: ImportService with CSV + PDF support (5-6h) — Commit: 4e89ae5
- [x] Task 8: Enhance Import Routes (CSV + PDF endpoints) (3-4h) — Commit: 376a030
- [ ] Frontend: CSV/PDF Upload UI (deferred)

**Total:** 19 tests passing

### Sprint 3: Reconciliation ✅ COMPLETE
- [x] Task 9: ReconciliationService (5-6h) — Commit: a1e3340
- [x] Task 10: Reconciliation Routes (2-3h) — Commit: a1e3340
- [x] Task 11: Reconciliation Tests (4-5h) — 43 tests (25 service + 18 route)

**Total:** 43 tests passing

### Grand Total
**Backend:** 34-44 hours
**Frontend (CSV/PDF upload, reconciliation UI):** 10-15 hours
**Phase 2 Total:** 44-59 hours

---

## Next Steps

1. **Start Sprint 1:** Begin with Task 1 (TransactionService)
2. **Run `/processes:work`:** Execute plan systematically
3. **Daily commits:** Commit after each completed task
4. **Update progress:** Check off tasks as completed
5. **Weekly review:** Review progress vs estimates every Friday

---

## Dependencies

**Requires:**
- ✅ Phase 1 complete (Account API working)
- ✅ Database schema deployed (Transaction, BankFeedTransaction models exist)
- ✅ ParserService exists (CSV parsing)
- ✅ DuplicationService exists (duplicate detection)

**Blocks:**
- Phase 3: Transactions & Bookkeeping (needs Transaction CRUD)
- Cash Flow Forecasting (needs transaction history)

---

## Related Documents

- **Roadmap:** `ROADMAP.md` (Phase 2 section)
- **Status:** `STATUS.md` (track completion)
- **Schema:** `packages/db/prisma/schema.prisma` (models)
- **API Patterns:** `.claude/rules/api-conventions.md` (SRP, validation)
- **Financial Rules:** `.claude/rules/financial-rules.md` (tenant isolation, soft delete)

---

**Plan Status:** ✅ Backend COMPLETE (117+ tests) | Frontend remaining
**Completed:** 2026-02-09 (all 3 backend sprints)
