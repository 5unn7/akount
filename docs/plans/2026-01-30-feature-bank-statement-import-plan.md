# Bank Statement Import Implementation Plan

**Date:** 2026-01-30
**Type:** feature
**Status:** Planning
**Related:**
- [Bank Statement Import Brainstorm](../brainstorms/2026-01-30-bank-statement-import-brainstorm.md)
- [Bank Reconciliation Feature](../features/02-bank-reconciliation.md)
- [Product Overview](../product/overview.md)

---

## Summary

Build a comprehensive file import system that allows users to upload bank statements in multiple formats (CSV, PDF, OFX, XLSX), automatically parse and categorize transactions, detect duplicates, and bulk import transactions into their accounts. This feature bridges the gap before API integrations (Plaid/Flinks) are available and enables historical data migration.

**Target:** 2-3 weeks for Phase 1 MVP (CSV + PDF support with preview workflow)

---

## User Story

**As a** solo entrepreneur or accountant managing financial data,

**I want to** upload bank statement files (CSV, PDF, OFX, XLSX) and have transactions automatically parsed, categorized, and imported into my account,

**So that** I can quickly populate Akount with real financial data without manual entry, see historical trends, and start using the application productively.

---

## Success Criteria

### Functional
- [ ] Users can upload CSV files and successfully import transactions
- [ ] Users can upload PDF bank statements and extract transactions
- [ ] Column mapping UI allows users to map CSV columns to transaction fields
- [ ] Preview table shows parsed transactions with inline editing capabilities
- [ ] Duplicate detection identifies and highlights potential duplicate transactions
- [ ] Auto-categorization suggests categories based on transaction descriptions
- [ ] Import creates Transaction records linked to ImportBatch
- [ ] Import history page displays past imports with status and transaction counts
- [ ] Background processing handles large imports (>100 transactions) without timeouts

### Data Integrity
- [ ] No duplicate transactions created (duplicate detection works correctly)
- [ ] All imported amounts stored as integer cents (no floating-point errors)
- [ ] Tenant isolation enforced (users can only import to their own accounts)
- [ ] Entity isolation enforced (transactions belong to correct entity)
- [ ] Transaction balance calculations are accurate

### Performance
- [ ] Small imports (<100 transactions) complete in <5 seconds
- [ ] Large imports (1,000+ transactions) process in background with progress updates
- [ ] File parsing completes in <3 seconds for files <10MB
- [ ] Preview table renders smoothly with 100+ transactions (virtual scrolling)
- [ ] API endpoints respond in <500ms (excluding background jobs)

### User Experience
- [ ] Drag-and-drop file upload works reliably
- [ ] Loading states shown during parsing and import (no blank screens)
- [ ] Error messages are clear and actionable (no technical jargon)
- [ ] Success feedback celebrates completion with next action suggestions
- [ ] Mobile responsive (view-only on mobile, full functionality on tablet+)

---

## Technical Approach

### Architecture

**Components Affected:**

**Frontend:**
- `apps/web/src/app/(dashboard)/accounts/[accountId]/import/page.tsx` - Import wizard page (Server Component wrapper)
- `apps/web/src/components/import/ImportWizard.tsx` - Multi-step wizard (Client Component)
- `apps/web/src/components/import/FileUpload.tsx` - Drag-and-drop upload area
- `apps/web/src/components/import/ColumnMapper.tsx` - CSV column mapping UI
- `apps/web/src/components/import/TransactionPreviewTable.tsx` - Editable preview table
- `apps/web/src/components/import/CategorySuggester.tsx` - Category dropdown with suggestions
- `apps/web/src/app/(dashboard)/import-history/page.tsx` - Import history list page
- `apps/web/src/lib/hooks/useImport.ts` - Custom TanStack Query hooks for import operations

**API:**
- `apps/api/src/routes/import.ts` - Import-related endpoints
- `apps/api/src/services/importService.ts` - Business logic for parsing and importing
- `apps/api/src/services/parserService.ts` - File parsing logic (CSV, PDF, OFX, XLSX)
- `apps/api/src/services/categorizationService.ts` - Auto-categorization logic
- `apps/api/src/services/duplicationService.ts` - Duplicate detection logic
- `apps/api/src/schemas/import.ts` - Zod validation schemas
- `apps/api/src/workers/importWorker.ts` - Background job processor (for large imports)

**Database:**
- Uses existing `ImportBatch` model (add fields: `fileName`, `fileSize`, `transactionsCount`, `metadata`)
- Uses existing `Transaction` model (link via `importBatchId`)
- Uses existing `Category` model (for categorization)

**Key Decisions:**

1. **Server vs Client Components**:
   - **Server Components**: Import page wrapper, import history page (initial data fetch)
   - **Client Components**: Import wizard, file upload, column mapper, preview table (all interactive)
   - **Reason**: Server Components reduce JS bundle, Client Components needed for file handling and interactivity

2. **File Processing Strategy**:
   - **Upload**: Client uploads file to API, receives `parseId`
   - **Parsing**: Server parses file in memory (not saved to disk initially)
   - **Preview**: Parsed transactions returned to client for review
   - **Import**: Client confirms, server creates transactions in database
   - **Reason**: Keeps parsing fast, allows user control, avoids storing unnecessary files

3. **Background Job Strategy**:
   - **Small imports** (<100 transactions): Synchronous processing (user waits)
   - **Large imports** (≥100 transactions): Background job with progress polling
   - **Implementation**: Simple in-memory queue for Phase 1, upgrade to Bull/BullMQ in Phase 2 if needed
   - **Reason**: Balances simplicity with scalability, most imports are <100 transactions

4. **Data Flow**:
   ```
   User uploads file
       ↓
   POST /api/import/upload → Store in temp memory, parse file → Return parseId + preview
       ↓
   User reviews preview on client
       ↓
   POST /api/import/confirm → Create ImportBatch + Transaction records
       ↓
   Success: Redirect to transaction list or import history
   ```

5. **Authentication & Authorization**:
   - All endpoints require Clerk Bearer token (existing auth middleware)
   - Tenant isolation: Verify user owns the account they're importing to
   - Entity isolation: Ensure account belongs to user's entity
   - **Validation**: GET /api/accounts/:id endpoint to verify ownership before showing import page

---

### Data Model Changes

**Prisma Schema Updates:**

The `ImportBatch` model already exists. We'll enhance it with additional fields:

```prisma
model ImportBatch {
  id         String    @id @default(cuid())
  tenantId   String
  tenant     Tenant    @relation(fields: [tenantId], references: [id])
  entityId   String?
  entity     Entity?   @relation(fields: [entityId], references: [id])

  // Existing fields
  sourceType ImportBatchSourceType  // CSV, PDF, BANK_FEED, API
  status     ImportBatchStatus      // PENDING, PROCESSING, PROCESSED, FAILED
  error      String?
  createdAt  DateTime  @default(now())

  // NEW FIELDS (add via migration)
  accountId          String?              // Which account was imported to
  account            Account?  @relation(fields: [accountId], references: [id])
  fileName           String?              // Original file name
  fileSize           Int?                 // File size in bytes
  transactionsCount  Int       @default(0)  // Total transactions in import
  duplicatesSkipped  Int       @default(0)  // Number of duplicates skipped
  metadata           Json?     @db.JsonB  // Additional import metadata (column mappings, settings)

  // Relations
  transactions Transaction[]

  @@index([tenantId])
  @@index([entityId])
  @@index([accountId])  // NEW INDEX
  @@index([status])
}
```

**Migration Checklist:**
- [ ] Tenant isolation enforced (tenantId foreign key) ✅ Already exists
- [ ] Indexes on frequently queried fields ✅ Add accountId index
- [ ] Integer cents for monetary amounts (no Float) ✅ Transaction model already uses Int
- [ ] Audit fields (createdAt, updatedAt) ✅ createdAt exists, add updatedAt
- [ ] No CASCADE deletes on financial data ✅ Use RESTRICT

**Migration File:**
```sql
-- Add new fields to ImportBatch
ALTER TABLE "ImportBatch" ADD COLUMN "accountId" TEXT;
ALTER TABLE "ImportBatch" ADD COLUMN "fileName" TEXT;
ALTER TABLE "ImportBatch" ADD COLUMN "fileSize" INTEGER;
ALTER TABLE "ImportBatch" ADD COLUMN "transactionsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportBatch" ADD COLUMN "duplicatesSkipped" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ImportBatch" ADD COLUMN "metadata" JSONB;
ALTER TABLE "ImportBatch" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key for account
ALTER TABLE "ImportBatch" ADD CONSTRAINT "ImportBatch_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for account queries
CREATE INDEX "ImportBatch_accountId_idx" ON "ImportBatch"("accountId");
```

**Important: Stable Account Linkage for Future Bank Connections**

The import system must preserve stable links so that later bank feeds (Plaid/Flinks) for the same real-world account land in the same Akount `Account`. This ensures continuity when users transition from manual CSV imports to live API connections.

**Design Principles:**

1. **Entity is the primary scope** ✅ Already enforced
   - All imports must be tied to an `Entity` up front
   - `ImportBatch.entityId` is required (not nullable)

2. **Account as stable anchor**
   - Create or choose a logical `Account` under the Entity
   - Store external identifiers in `metadata` field for later matching:
     ```json
     {
       "externalAccountId": "xxxx1234",  // Last 4 digits or masked account number
       "institutionName": "Chase Bank",
       "accountType": "checking",
       "currency": "USD",
       "iban": "GB29NWBK60161331926819",  // For international accounts
       "routingNumber": "021000021"  // US banks
     }
     ```

3. **BankConnection matching** (for future Plaid/Flinks integration)
   - When user connects live bank feed, match to existing `Account` using:
     - Same `entityId` (required)
     - Same institution name
     - Same masked account number (last 4 digits)
     - Same currency
   - Attach `BankConnection` to matched `Account`
   - Backfill `BankFeedTransaction.bankConnectionId` for past imports where match is confident

4. **Unified import layer**
   - All imports (CSV, PDF, manual, or bank feed) end up under same `Entity`-scoped records
   - `ImportBatch` tracks source (CSV, PDF, BANK_FEED, API)
   - `Transaction` table is unified (source agnostic)
   - `TransactionMatch` links manual imports to future bank feeds

**Validation Rules (for financial-data-validator agent):**
- ✅ All imported transactions must have `entityId` and `accountId` from same Entity
- ✅ Never create cross-entity imports
- ✅ If import metadata suggests account exists (matching identifiers), link to existing Account
- ✅ Store external identifiers in `metadata` for future bank connection matching

**Schema Guards (for prisma-migration-reviewer agent):**
- ✅ Never remove or make nullable: `ImportBatch.entityId`, `Account.entityId`, `BankConnection.entityId`
- ✅ Never allow CASCADE deletes on financial data (ImportBatch, Transaction, BankFeedTransaction)
- ✅ Preserve `metadata` field for external identifier storage

---

### Account Matching Service (for Future Bank Connections)

**Purpose:** Enable seamless transition from manual CSV imports to live bank feeds by maintaining stable account linkage.

**Service: `accountMatcherService.ts`**

```typescript
/**
 * Matches an incoming bank connection to an existing Account based on external identifiers
 */
export async function matchAccountToBankConnection(
  entityId: string,
  bankConnection: BankConnection,
  externalAccountData: {
    accountId: string,      // Plaid account_id or Flinks account number
    mask: string,           // Last 4 digits (e.g., "1234")
    institutionId: string,  // Plaid institution_id or Flinks institution ID
    type: string,           // checking, savings, credit
    currency: string
  }
): Promise<{ account: Account | null, confidence: number, reason: string }> {

  // Query existing Accounts for this Entity
  const candidates = await prisma.account.findMany({
    where: { entityId },
    include: {
      transactions: {
        include: {
          importBatch: true
        },
        take: 1
      }
    }
  })

  // Scoring algorithm
  for (const account of candidates) {
    let score = 0
    let reasons = []

    // Match currency (required)
    if (account.currency === externalAccountData.currency) {
      score += 30
      reasons.push('Currency match')
    } else {
      continue // Skip if currency doesn't match
    }

    // Check import batch metadata for external identifiers
    const importBatch = account.transactions[0]?.importBatch
    if (importBatch?.metadata) {
      const metadata = importBatch.metadata as any

      // Match masked account number (high confidence)
      if (metadata.externalAccountId?.endsWith(externalAccountData.mask)) {
        score += 40
        reasons.push('Account number match (last 4)')
      }

      // Match institution name (medium confidence)
      if (metadata.institutionName &&
          normalizeInstitutionName(metadata.institutionName) ===
          normalizeInstitutionName(externalAccountData.institutionId)) {
        score += 20
        reasons.push('Institution match')
      }

      // Match account type (low confidence)
      if (metadata.accountType === externalAccountData.type) {
        score += 10
        reasons.push('Account type match')
      }
    }

    // High confidence match (score ≥80)
    if (score >= 80) {
      return {
        account,
        confidence: score,
        reason: reasons.join(', ')
      }
    }
  }

  // No confident match found
  return { account: null, confidence: 0, reason: 'No matching account found' }
}

/**
 * Normalize institution names for matching (handle variations)
 */
function normalizeInstitutionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')  // Remove special chars
    .replace(/bank|banking|credit union|cu/g, '')  // Remove common suffixes
    .trim()
}
```

**Usage Scenario (Future Plaid/Flinks Integration):**

1. **User connects bank via Plaid** (happens after they've already imported CSVs)
2. **Plaid returns account data**:
   ```json
   {
     "account_id": "plaid_acc_123",
     "mask": "1234",
     "name": "Chase Checking",
     "type": "depository",
     "subtype": "checking",
     "balances": { "current": 5000 }
   }
   ```
3. **matchAccountToBankConnection()** finds existing `Account`:
   - Same `entityId` ✅
   - Same currency (USD) ✅
   - Import metadata has `externalAccountId: "xxxx1234"` (matches mask) ✅
   - Import metadata has `institutionName: "Chase Bank"` (matches) ✅
   - **Confidence: 90%** → Auto-link
4. **Create `BankConnection` record**, link to matched `Account`
5. **Backfill `BankFeedTransaction.bankConnectionId`** for past imports (optional)
6. **Future bank syncs** go to same `Account`, reconciliation state preserved

**Fallback for Low Confidence (<80%):**
- Show user a selection UI: "We found 2 possible matches. Which account should we link?"
- User manually selects or creates new account
- Store user's choice for future reference

---

### API Endpoints

#### 1. POST /api/import/upload
**Purpose:** Upload file and get parsed transactions preview

**Additional Responsibilities:**
- Extract external account identifiers from file (if available)
- Store in parse cache for later use in ImportBatch metadata

**Request Body (multipart/form-data):**
```typescript
{
  file: File,            // Binary file data
  accountId: string,     // Which account to import to
  dateFormat?: string    // Optional: "MM/DD/YYYY" | "DD/MM/YYYY" (for ambiguous dates)
}
```

**Response:**
```typescript
{
  parseId: string,       // Unique ID for this parse session
  accountId: string,
  fileName: string,
  fileSize: number,      // In bytes
  sourceType: "CSV" | "PDF" | "OFX" | "XLSX",

  // For CSV/XLSX only
  columns?: string[],    // Detected column headers
  columnMappings?: {     // Auto-detected mappings
    date: string,
    description: string,
    amount: string,
    balance?: string
  },
  preview?: {            // First 5 rows for verification
    rows: Array<{
      [column: string]: string
    }>
  },

  // For all formats
  transactions: Array<{
    tempId: string,      // Temporary ID for client-side tracking
    date: string,        // ISO date
    description: string,
    amount: number,      // In cents
    balance?: number,    // In cents (if available)
    category?: {         // Auto-categorization suggestion
      id: string,
      name: string,
      confidence: number // 0-100
    },
    isDuplicate: boolean,  // Potential duplicate
    duplicateConfidence?: number // 0-100 (if duplicate)
  }>,

  summary: {
    total: number,       // Total transactions parsed
    duplicates: number,  // Potential duplicates found
    categorized: number, // Auto-categorized (confidence >50%)
    needsReview: number  // Uncategorized or low confidence
  }
}
```

**Business Logic:**
1. Validate file size (<10MB) and type (CSV, PDF, OFX, XLSX)
2. Parse file based on detected format
3. Extract transactions (date, description, amount, balance)
4. **Extract external account identifiers** (for future bank connection matching):
   - Last 4 digits of account number (if visible in file)
   - Institution name (from file header or transaction descriptions)
   - Account type (checking, savings, credit - infer from context)
   - IBAN or routing number (if present)
   - Store in parse cache metadata
5. Normalize dates and amounts (handle various formats)
6. Run duplicate detection against existing transactions
7. Run auto-categorization on descriptions
8. Store parsed data in memory cache (Redis or in-memory Map) with `parseId`
9. Return preview with all metadata

**Error Responses:**
- 400: File too large, invalid format, parsing failed
- 401: Unauthorized (no valid token)
- 403: Forbidden (account doesn't belong to user's tenant)
- 413: Payload too large
- 500: Server error

---

#### 2. POST /api/import/update-mapping
**Purpose:** Update column mappings for CSV/XLSX (before confirming import)

**Request Body:**
```typescript
{
  parseId: string,
  columnMappings: {
    date: string,        // Column name in CSV
    description: string,
    amount: string,      // Can be single column or "debit|credit" for two columns
    balance?: string
  }
}
```

**Response:**
```typescript
{
  parseId: string,
  transactions: Array<...>,  // Re-parsed transactions with new mappings
  summary: { ... }
}
```

**Business Logic:**
1. Retrieve cached parse data by `parseId`
2. Re-parse CSV with new column mappings
3. Re-run duplicate detection and categorization
4. Update cache
5. Return updated transaction list

---

#### 3. POST /api/import/update-transactions
**Purpose:** Update transactions in preview (e.g., change category, edit description)

**Request Body:**
```typescript
{
  parseId: string,
  updates: Array<{
    tempId: string,                  // Temporary ID from preview
    categoryId?: string | null,      // Updated category
    description?: string,            // Updated description
    exclude?: boolean                // Mark for exclusion from import
  }>
}
```

**Response:**
```typescript
{
  parseId: string,
  updated: number  // Number of transactions updated
}
```

**Business Logic:**
1. Retrieve cached parse data
2. Apply updates to transactions
3. Update cache
4. Return confirmation

---

#### 4. POST /api/import/confirm
**Purpose:** Confirm import and create transactions in database

**Request Body:**
```typescript
{
  parseId: string,
  skipDuplicates: boolean  // Default: true
}
```

**Response (for small imports <100 transactions):**
```typescript
{
  importBatchId: string,
  status: "PROCESSED",
  imported: number,        // Number of transactions created
  skipped: number,         // Duplicates skipped
  failed: number,          // Failed (if any)
  errors?: Array<{
    tempId: string,
    error: string
  }>
}
```

**Response (for large imports ≥100 transactions):**
```typescript
{
  importBatchId: string,
  status: "PROCESSING",
  message: "Import is processing in background. You'll be notified when complete.",
  jobId: string           // For polling progress
}
```

**Business Logic (Synchronous - <100 transactions):**
1. Retrieve cached parse data
2. Verify account ownership (tenant isolation)
3. Create `ImportBatch` record with status PROCESSING
   - **Store external identifiers in `metadata` field**:
     ```json
     {
       "columnMappings": { ... },
       "externalAccountId": "xxxx1234",
       "institutionName": "Chase Bank",
       "accountType": "checking",
       "currency": "USD",
       "iban": "GB29NWBK...",  // if available
       "routingNumber": "021000021",  // if available
       "sourceFileName": "statement-jan-2026.csv"
     }
     ```
4. For each transaction:
   - Check if duplicate (if skipDuplicates=true, skip)
   - Create `Transaction` record with `importBatchId`
   - Set `sourceType` = MANUAL
5. Update `ImportBatch` status to PROCESSED
6. Clear parse cache
7. Return summary

**Why Store External Identifiers:**
- Enables future bank connection matching (see accountMatcherService)
- Preserves account linkage when user adds Plaid/Flinks later
- Allows backfilling `BankFeedTransaction.bankConnectionId` for past imports
- Maintains audit trail (which real-world account this import came from)

**Business Logic (Asynchronous - ≥100 transactions):**
1. Create `ImportBatch` record with status PROCESSING
2. Queue background job with `parseId` and `importBatchId`
3. Return immediately with `jobId`
4. Background job processes transactions in chunks
5. Update `ImportBatch` status when complete
6. Send notification to user (toast + optional email)

---

#### 5. GET /api/import/progress/:jobId
**Purpose:** Poll progress of large background import

**Response:**
```typescript
{
  jobId: string,
  importBatchId: string,
  status: "PROCESSING" | "PROCESSED" | "FAILED",
  progress: {
    processed: number,   // Transactions processed so far
    total: number        // Total transactions
  },
  imported?: number,     // Final count (when complete)
  skipped?: number,
  failed?: number,
  error?: string         // If status=FAILED
}
```

---

#### 6. GET /api/import/history
**Purpose:** List past imports for authenticated user

**Query Parameters:**
```typescript
{
  accountId?: string,    // Filter by account
  page?: number,         // Default: 1
  limit?: number         // Default: 20, max: 100
}
```

**Response:**
```typescript
{
  imports: Array<{
    id: string,
    fileName: string,
    fileSize: number,
    sourceType: "CSV" | "PDF" | "OFX" | "XLSX",
    accountId: string,
    accountName: string,
    status: "PROCESSED" | "FAILED",
    transactionsCount: number,
    duplicatesSkipped: number,
    createdAt: string,   // ISO date
    error?: string
  }>,
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}
```

**Business Logic:**
1. Get user's tenantId
2. Query `ImportBatch` where `tenantId = user.tenantId`
3. Join with `Account` to get account name
4. Order by `createdAt` DESC
5. Paginate results
6. Return list

---

#### 7. DELETE /api/import/:batchId
**Purpose:** Undo import (soft delete transactions)

**Response:**
```typescript
{
  deleted: number  // Number of transactions deleted
}
```

**Business Logic:**
1. Verify `ImportBatch` belongs to user's tenant
2. Soft delete all transactions where `importBatchId = batchId`
3. Update `ImportBatch` status to DELETED (or delete record)
4. Return count

**Constraints:**
- Only allow undo within 24 hours of import
- Cannot undo if transactions have been reconciled or edited

---

**Authentication (All Routes):**
```typescript
// All routes use auth middleware
{
  onRequest: [authMiddleware]
}

// Verify tenant ownership for account-related operations
const account = await prisma.account.findFirst({
  where: {
    id: accountId,
    entity: {
      tenant: {
        memberships: {
          some: {
            user: {
              clerkUserId: request.userId
            }
          }
        }
      }
    }
  }
})

if (!account) {
  return reply.status(403).send({ error: 'Forbidden', message: 'Account not found or access denied' })
}
```

---

### UI Components

**Pages:**

#### 1. `app/(dashboard)/accounts/[accountId]/import/page.tsx` (Server Component)
**Purpose:** Import wizard page wrapper

**Responsibilities:**
- Fetch account details server-side (verify exists and user has access)
- Fetch categories list (for categorization dropdown)
- Render `ImportWizard` client component with initial data

**Layout:**
- Breadcrumb: Accounts > [Account Name] > Import
- Title: "Import Transactions"
- Subtitle: "[Account Name] • [Currency]"

---

#### 2. `app/(dashboard)/import-history/page.tsx` (Server Component)
**Purpose:** Import history list page

**Responsibilities:**
- Fetch import history server-side
- Render table of past imports
- Show status, file name, date, transaction count
- Actions: View details, Undo (if <24 hours), Download errors

**Layout:**
- Breadcrumb: Dashboard > Import History
- Title: "Import History"
- Filter: By account (dropdown)
- Sort: By date (newest first)

---

**Components:**

#### 1. `components/import/ImportWizard.tsx` (Client Component)
**Purpose:** Multi-step wizard orchestrator

**Props:**
```typescript
{
  accountId: string,
  accountName: string,
  accountCurrency: string,
  categories: Category[]
}
```

**State:**
```typescript
{
  step: 1 | 2 | 3 | 4 | 5,  // Upload, Map, Preview, Import, Success
  parseId: string | null,
  parseData: ParsedData | null,
  columnMappings: ColumnMappings | null,
  transactions: Transaction[],
  summary: Summary
}
```

**Steps:**
1. **Upload**: Show `FileUpload` component
2. **Map** (conditional): Show `ColumnMapper` if CSV/XLSX
3. **Preview**: Show `TransactionPreviewTable`
4. **Import**: Show confirmation summary, then import
5. **Success**: Show success message with actions

**Navigation:**
- Next button (advances to next step)
- Back button (returns to previous step)
- Step indicator (visual progress)

---

#### 2. `components/import/FileUpload.tsx` (Client Component)
**Purpose:** Drag-and-drop file upload area

**Features:**
- Large drop zone with dashed border
- "Drag file here or click to browse" text
- File input (hidden, triggered by click)
- File validation (size, type)
- Upload progress indicator
- File preview after selection (name, size, icon)
- Remove file button

**Drag & Drop Implementation:**
```typescript
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  const files = e.dataTransfer.files
  if (files.length > 0) {
    validateAndUpload(files[0])
  }
}

const validateAndUpload = async (file: File) => {
  // Validate file size
  if (file.size > 10 * 1024 * 1024) {
    setError('File too large. Maximum size is 10MB.')
    return
  }

  // Validate file type
  const validTypes = ['.csv', '.pdf', '.ofx', '.qfx', '.xlsx', '.xls']
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!ext || !validTypes.includes(ext)) {
    setError('Invalid file type. Supported: CSV, PDF, OFX, XLSX')
    return
  }

  // Upload file
  const formData = new FormData()
  formData.append('file', file)
  formData.append('accountId', accountId)

  const response = await fetch('/api/import/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  })

  const data = await response.json()
  onUploadComplete(data)
}
```

---

#### 3. `components/import/ColumnMapper.tsx` (Client Component)
**Purpose:** Map CSV/XLSX columns to transaction fields

**Props:**
```typescript
{
  columns: string[],           // Detected column headers
  suggestedMappings: ColumnMappings,  // Auto-detected mappings
  preview: PreviewRow[],       // First 5 rows
  onMappingChange: (mappings: ColumnMappings) => void
}
```

**Layout:**
- Table with 4 rows (Date, Description, Amount, Balance)
- Each row has a dropdown to select column
- Preview section shows first 5 rows with mapped values
- "Amount" field has special handling for Debit/Credit columns

**Special Features:**
- Debit/Credit toggle: If two columns detected, allow combining them
- Date format selector: If dates ambiguous (01/02/2026), ask user to confirm format
- Preview updates live as mappings change

---

#### 4. `components/import/TransactionPreviewTable.tsx` (Client Component)
**Purpose:** Editable table of parsed transactions before import

**Features:**
- Virtual scrolling for large transaction lists (react-virtualized or @tanstack/react-virtual)
- Columns: Status, Date, Description, Category, Amount, Actions
- Inline editing: Click description or category to edit
- Bulk selection: Checkboxes to select multiple rows
- Bulk actions: Toolbar with "Categorize", "Delete", "Select All"
- Filters: All, Needs Review, Duplicates, Ready to Import
- Search: Filter by description

**Status Indicators:**
- ✓ Green: Categorized, ready to import
- ⚠ Yellow: Needs review (uncategorized or low confidence)
- 🔁 Grey: Duplicate (will be skipped)

**Category Dropdown:**
- Shows suggested category (if any) with confidence badge
- Click to open dropdown with all categories
- Search categories by name
- Keyboard navigation (arrow keys, Enter to select)

**Performance:**
- Use virtual scrolling for 100+ rows
- Debounce search input (300ms)
- Memoize row rendering

---

#### 5. `components/import/CategorySuggester.tsx` (Client Component)
**Purpose:** Smart category dropdown with suggestions

**Props:**
```typescript
{
  suggestedCategoryId?: string,
  confidence?: number,
  categories: Category[],
  onCategoryChange: (categoryId: string) => void
}
```

**Features:**
- Show suggested category with confidence badge (if available)
- Dropdown with all categories (grouped by type: Income, Expense, Transfer)
- Search categories
- Visual confidence indicator:
  - Green badge: High confidence (>80%)
  - Yellow badge: Medium confidence (50-80%)
  - Grey: Uncategorized or low confidence (<50%)

---

**Design System:**

- **Colors:**
  - Primary: Orange (`text-orange-600`, `bg-orange-500`)
  - Success: Green (`text-green-600`, `bg-green-100`)
  - Warning: Yellow (`text-yellow-600`, `bg-yellow-100`)
  - Danger: Red (`text-red-600`, `bg-red-100`)
  - Neutral: Slate (`text-slate-600`, `bg-slate-100`)

- **Typography:**
  - Headings: Newsreader (`font-heading`)
  - Body: Manrope (`font-sans`)
  - Monospace (amounts): JetBrains Mono (`font-mono`)

- **Components (from shadcn/ui):**
  - Button, Card, Input, Label, Dropdown, Table, Badge, Progress, Toast

---

## Implementation Phases

### Phase 1: File Upload & CSV Parsing (Week 1: Days 1-3)

**Goal:** Basic file upload and CSV parsing working end-to-end

#### Day 1: API Setup & CSV Parsing

**Tasks:**
- [ ] Install parsing libraries:
  - `npm install papaparse @types/papaparse` (CSV parsing)
  - `npm install multer @fastify/multipart` (File upload)
  - `npm install string-similarity` (for fuzzy matching)
- [ ] Create `apps/api/src/schemas/import.ts` with Zod schemas
- [ ] Create `apps/api/src/services/parserService.ts`:
  - `parseCSV(file: Buffer): ParsedTransaction[]`
  - `extractExternalIdentifiers(file: Buffer, format: string): ExternalAccountData`
  - Auto-detect delimiter (comma, semicolon, tab)
  - Normalize date formats
  - Parse amounts (handle negatives, currency symbols)
  - Extract account identifiers (last 4 digits, institution name, account type)
- [ ] Create `apps/api/src/services/accountMatcherService.ts`:
  - `matchAccountToBankConnection()` - Future bank connection matching logic
  - `normalizeInstitutionName()` - Normalize institution names for comparison
- [ ] Create `POST /api/import/upload` endpoint:
  - Accept multipart/form-data
  - Validate file size and type
  - Parse CSV file
  - Extract external identifiers
  - Return preview with metadata
- [ ] Add Prisma migration for `ImportBatch` new fields (including `metadata` JSONB)
- [ ] Test CSV parsing with sample bank statements (US, Canadian, European formats)

**Acceptance Criteria:**
- Upload CSV file returns parsed transactions
- External identifiers extracted from file headers (account number, institution)
- Various date formats handled (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Amount parsing handles decimals, negatives, commas
- API responds in <3 seconds for files with <1000 transactions

---

#### Day 2: Column Mapping & Duplicate Detection

**Tasks:**
- [ ] Create `apps/api/src/services/duplicationService.ts`:
  - `findDuplicates(transactions: ParsedTransaction[], accountId: string): DuplicateResult[]`
  - Query existing transactions for same account
  - Compare by date, amount, description (fuzzy match)
  - Use Levenshtein distance algorithm (install `string-similarity` library)
  - Return confidence score (0-100)
- [ ] Enhance `POST /api/import/upload` to detect duplicates
- [ ] Create `POST /api/import/update-mapping` endpoint
- [ ] Test duplicate detection with edge cases:
  - Exact matches
  - Similar descriptions (90% match)
  - Same date and amount, different description
  - False positives (two $5 coffees same day)

**Acceptance Criteria:**
- Duplicate detection catches exact matches (100% confidence)
- Fuzzy matching detects similar transactions (80-95% confidence)
- False positive rate <10% (two legitimate transactions not flagged)
- API responds in <2 seconds for duplicate checks on 1000+ existing transactions

---

#### Day 3: Frontend Upload & Column Mapping UI

**Tasks:**
- [ ] Create `apps/web/src/components/import/FileUpload.tsx`:
  - Drag-and-drop zone
  - File validation
  - Upload progress
- [ ] Create `apps/web/src/components/import/ColumnMapper.tsx`:
  - Dropdown to map columns
  - Preview table (first 5 rows)
  - Debit/Credit combination UI
- [ ] Create `apps/web/src/components/import/ImportWizard.tsx`:
  - Step 1: Upload
  - Step 2: Column Mapping (if CSV)
  - State management (React state or Zustand)
- [ ] Create `apps/web/src/lib/hooks/useImport.ts`:
  - `useUploadFile()` - Upload file mutation
  - `useUpdateMapping()` - Update mapping mutation
  - Use TanStack Query
- [ ] Test drag-and-drop on different browsers

**Acceptance Criteria:**
- Drag-and-drop works reliably
- File upload shows progress
- Column mapper auto-detects common column names
- Preview updates when mappings change
- Mobile-friendly (file picker works on mobile)

**Review Points:**
- [ ] Run `security-sentinel` on file upload endpoint (file type validation, size limits)
- [ ] Run `nextjs-app-router-reviewer` on import wizard (Server/Client boundaries)

---

### Phase 2: Categorization & Preview Table (Week 1-2: Days 4-6)

**Goal:** Auto-categorization and preview table with inline editing

#### Day 4: Auto-Categorization Service

**Tasks:**
- [ ] Create `apps/api/src/services/categorizationService.ts`:
  - `categorizeTransaction(description: string, amount: number): CategorySuggestion`
  - Keyword matching dictionary (100 common merchants/categories)
  - Partial string matching (case-insensitive)
  - Return category ID + confidence score
- [ ] Create keyword dictionary:
  - Groceries: walmart, safeway, whole foods, trader joe's, etc.
  - Gas: shell, chevron, exxon, mobil, petro-canada, etc.
  - Entertainment: netflix, spotify, disney+, hulu, etc.
  - Dining: starbucks, mcdonald's, subway, chipotle, etc.
  - (Add 100+ keywords)
- [ ] Integrate categorization into `POST /api/import/upload`
- [ ] Test categorization accuracy:
  - Sample 100 transactions from real bank statements
  - Measure accuracy: % correctly categorized (target >50%)

**Acceptance Criteria:**
- Categorization service returns suggestions with confidence scores
- Common merchants correctly categorized (>70% accuracy)
- Unknown merchants return low confidence (<50%)
- API responds in <500ms for categorization of 100 transactions

---

#### Day 5: Preview Table UI

**Tasks:**
- [ ] Create `apps/web/src/components/import/TransactionPreviewTable.tsx`:
  - Table with columns: Status, Date, Description, Category, Amount, Actions
  - Inline editing for description and category
  - Status indicators (icons and colors)
  - Virtual scrolling for 100+ rows (use `@tanstack/react-virtual`)
- [ ] Create `apps/web/src/components/import/CategorySuggester.tsx`:
  - Category dropdown with search
  - Show suggested category with confidence badge
  - Keyboard navigation
- [ ] Implement filters:
  - All Transactions
  - Needs Review (uncategorized)
  - Duplicates
  - Ready to Import
- [ ] Implement bulk selection and actions:
  - Checkboxes for row selection
  - Toolbar with bulk actions (categorize, delete)

**Acceptance Criteria:**
- Table renders smoothly with 500+ transactions (virtual scrolling)
- Inline editing works (click to edit)
- Category dropdown has search and keyboard navigation
- Filters work correctly
- Bulk operations work (select 50 rows, categorize all)

---

#### Day 6: Transaction Updates & Polish

**Tasks:**
- [ ] Create `POST /api/import/update-transactions` endpoint
- [ ] Create `apps/web/src/lib/hooks/useImport.ts`:
  - `useUpdateTransactions()` - Mutation to update preview
  - Optimistic updates (update UI immediately)
- [ ] Add loading states:
  - Skeleton loaders during parsing
  - Spinners during API calls
  - Progress indicators
- [ ] Add error handling:
  - Toast notifications for errors
  - Retry button on failures
  - Clear error messages
- [ ] Polish UI:
  - Smooth animations (transitions)
  - Hover states
  - Focus states (keyboard navigation)

**Acceptance Criteria:**
- Updates to preview reflect immediately in UI (optimistic updates)
- Loading states shown appropriately (no blank screens)
- Errors displayed with clear messages and retry options
- UI feels polished and responsive

**Review Points:**
- [ ] Run `kieran-typescript-reviewer` on all TypeScript files (type safety)
- [ ] Run `code-simplicity-reviewer` (check for unnecessary complexity)

---

### Phase 3: Import & Background Processing (Week 2: Days 7-9)

**Goal:** Complete import workflow with background processing for large imports

#### Day 7: Synchronous Import

**Tasks:**
- [ ] Create `POST /api/import/confirm` endpoint:
  - Create `ImportBatch` record
  - Loop through transactions
  - Check for duplicates (skip if configured)
  - Create `Transaction` records
  - Update `ImportBatch` status
  - Return summary
- [ ] Test synchronous import:
  - Import 10 transactions (should complete in <2 seconds)
  - Import 100 transactions (should complete in <5 seconds)
  - Verify transactions created correctly in database
  - Verify duplicates skipped
- [ ] Add import confirmation UI:
  - Summary card showing counts
  - "Import X Transactions" button
  - Loading spinner during import
  - Redirect to success page

**Acceptance Criteria:**
- Small imports (<100 transactions) complete synchronously
- Transactions created with correct data (date, description, amount, category)
- Duplicates skipped correctly
- ImportBatch record created with accurate counts
- No database errors or rollbacks

---

#### Day 8: Background Processing

**Tasks:**
- [ ] Create `apps/api/src/workers/importWorker.ts`:
  - Simple in-memory job queue
  - Process transactions in chunks of 100
  - Update progress periodically
  - Handle errors gracefully
- [ ] Enhance `POST /api/import/confirm` for large imports:
  - If transactions ≥100, queue background job
  - Return immediately with `jobId`
- [ ] Create `GET /api/import/progress/:jobId` endpoint:
  - Return current progress
  - Return status (PROCESSING, PROCESSED, FAILED)
- [ ] Add progress polling to frontend:
  - Poll `/api/import/progress/:jobId` every 2 seconds
  - Show progress bar with percentage
  - Show completion message when done
- [ ] Test large import:
  - Import 1,000 transactions
  - Verify background processing works
  - Verify progress updates
  - Verify completion notification

**Acceptance Criteria:**
- Large imports (≥100 transactions) process in background
- Progress polling works (updates every 2 seconds)
- Progress bar shows accurate percentage
- Completion notification shows when done
- Background job completes successfully (no timeouts)

---

#### Day 9: Success Page & Error Handling

**Tasks:**
- [ ] Create success page UI:
  - "✓ 35 transactions imported successfully"
  - Summary: X imported, Y duplicates skipped, Z failed
  - Quick actions: "View Transactions", "Import Another", "Go to Dashboard"
- [ ] Add error handling for partial failures:
  - If some transactions fail, show error details
  - Allow user to download error report (CSV)
  - Allow user to retry failed transactions
- [ ] Add undo functionality:
  - "Undo Import" button on success page (if <24 hours)
  - Confirmation modal: "Are you sure? This will delete X transactions."
  - Create `DELETE /api/import/:batchId` endpoint
- [ ] Test error scenarios:
  - Invalid date format (should fail gracefully)
  - Missing required field (should skip transaction and log error)
  - Database connection error (should rollback and show error)

**Acceptance Criteria:**
- Success page displays accurate summary
- Quick actions work correctly
- Partial failures handled gracefully (show errors, allow retry)
- Undo import works (soft deletes transactions)
- Error messages are clear and actionable

**Review Points:**
- [ ] Run `financial-data-validator` on import logic (data integrity, amount handling)
- [ ] Run `security-sentinel` on import endpoints (tenant isolation, auth)
- [ ] Run `performance-oracle` on import performance (database queries, indexes)

---

### Phase 4: PDF Parsing & Import History (Week 2-3: Days 10-12)

**Goal:** Add PDF parsing and import history page

#### Day 10: PDF Parsing

**Tasks:**
- [ ] Install PDF parsing library: `npm install pdf-parse` or `pdfjs-dist`
- [ ] Create `parsePDF(file: Buffer): ParsedTransaction[]` in parserService:
  - Extract text from PDF
  - Use regex to find transaction table
  - Patterns for common bank formats:
    - US banks: "Date | Description | Amount | Balance"
    - Canadian banks: "Transaction Date | Details | Withdrawal | Deposit | Balance"
    - European banks: Various formats
  - Normalize extracted data (same as CSV)
- [ ] Test PDF parsing:
  - Collect 5-10 sample bank PDFs (different banks)
  - Test extraction accuracy
  - Handle edge cases (multi-page PDFs, complex layouts)
- [ ] Enhance `POST /api/import/upload` to support PDF
- [ ] Add PDF fallback logic:
  - If text extraction fails, return error with message
  - Suggest using CSV export instead
  - (Future: Add OCR support for scanned PDFs)

**Acceptance Criteria:**
- PDF parsing extracts transactions from digital PDFs (not scanned)
- Common bank formats supported (test with 5+ banks)
- Multi-page PDFs handled correctly
- Extraction accuracy >80% (manual verification)
- Clear error message if extraction fails

---

#### Day 11: Import History Page

**Tasks:**
- [ ] Create `GET /api/import/history` endpoint:
  - Query `ImportBatch` records
  - Filter by account (optional)
  - Join with `Account` to get account name
  - Paginate (20 per page)
- [ ] Create `apps/web/src/app/(dashboard)/import-history/page.tsx`:
  - Table of past imports
  - Columns: Date, File Name, Account, Status, Transactions, Actions
  - Filter by account (dropdown)
  - Pagination controls
- [ ] Add import details modal:
  - Click import row to see details
  - Show summary: Imported, duplicates skipped, errors
  - Show transaction list (first 10, with "View All" link)
  - Undo button (if <24 hours)
- [ ] Link to import history from success page and dashboard

**Acceptance Criteria:**
- Import history page loads with past imports
- Filter by account works
- Pagination works (20 per page)
- Details modal shows accurate information
- Undo from history works correctly

---

#### Day 12: Testing & Bug Fixes

**Tasks:**
- [ ] Comprehensive testing:
  - Upload CSV (various formats)
  - Upload PDF (various banks)
  - Large import (1,000+ transactions)
  - Duplicate detection (various scenarios)
  - Column mapping (edge cases)
  - Categorization (verify accuracy)
  - Import history (verify data)
  - Undo import (verify soft delete)
- [ ] Test multi-tenant isolation:
  - Create 2 test tenants
  - Import to tenant A, verify tenant B can't see
  - Import to tenant B, verify tenant A can't see
- [ ] Performance testing:
  - Measure end-to-end import time
  - Profile slow API endpoints
  - Optimize if needed (caching, indexes)
- [ ] Mobile testing:
  - Test file upload on mobile devices
  - Test column mapping (responsive UI)
  - Test preview table (should be scrollable)
- [ ] Bug fixes:
  - Fix any bugs found during testing
  - Handle edge cases discovered
  - Improve error messages if confusing

**Acceptance Criteria:**
- All major features work reliably
- No critical bugs
- Multi-tenant isolation verified
- Performance meets targets (<5s for small imports)
- Mobile experience acceptable (view-only is fine)

**Review Points:**
- [ ] Run all reviewer agents one final time:
  - `security-sentinel` (full feature security audit)
  - `financial-data-validator` (data integrity check)
  - `performance-oracle` (final performance check)
  - `nextjs-app-router-reviewer` (App Router best practices)
  - `kieran-typescript-reviewer` (type safety audit)
  - `code-simplicity-reviewer` (YAGNI final check)
  - `architecture-strategist` (overall design review)

---

### Phase 5: Documentation & Deployment (Week 3: Days 13-14)

**Goal:** Document feature and deploy to staging

#### Day 13: Documentation

**Tasks:**
- [ ] Create `docs/features/bank-statement-import.md`:
  - Feature overview
  - Supported formats (CSV, PDF, OFX, XLSX)
  - User guide (step-by-step import process)
  - Troubleshooting (common issues and solutions)
- [ ] Update API documentation:
  - Document all import endpoints
  - Request/response examples
  - Error codes and messages
- [ ] Create demo data script:
  - Generate realistic sample CSV files
  - Generate sample PDF bank statements (if possible)
  - Seed database with sample imports for demo
- [ ] Add inline help text:
  - Tooltips in column mapper
  - Help text in preview table
  - FAQ section in import wizard

**Acceptance Criteria:**
- Documentation complete and clear
- API docs have request/response examples
- Demo data script generates realistic samples
- Inline help text is helpful and concise

---

#### Day 14: Staging Deployment

**Tasks:**
- [ ] Final code review:
  - Review all new files
  - Check for console.log statements (remove or replace with logger)
  - Verify no hardcoded values (use env variables)
  - Check for security issues
- [ ] Deploy to staging:
  - Push code to staging branch
  - Run Prisma migration on staging database
  - Seed demo data
  - Verify deployment successful
- [ ] Staging smoke test:
  - Import CSV file (verify works end-to-end)
  - Import PDF file (verify works)
  - Large import (verify background processing)
  - Check import history
  - Test undo import
- [ ] Create demo video/screenshots:
  - Record import workflow (for stakeholders)
  - Take screenshots of key screens
  - Prepare for launch announcement

**Acceptance Criteria:**
- Code review complete (no major issues)
- Staging deployment successful
- All features work on staging
- Demo materials ready (video, screenshots)

**Review Points:**
- [ ] Final stakeholder review (demo the feature)
- [ ] Get approval for production deployment

---

## Security Considerations

### File Upload Security

#### 1. File Type Validation
- [ ] **Client-side**: Check file extension before upload (prevent accidental wrong files)
- [ ] **Server-side**: Validate MIME type and file content (prevent malicious files)
- [ ] **Whitelist**: Only allow CSV, PDF, OFX/QFX, XLSX extensions
- [ ] **Magic byte validation**: Check file headers match expected format (e.g., CSV starts with text, PDF starts with `%PDF`)

**Reference**: [File Upload Security in Next.js](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)

#### 2. File Size Limits
- [ ] **Hard limit**: 10MB per file (enforced at API level)
- [ ] **Client-side warning**: Show error before upload if file exceeds 10MB
- [ ] **Server-side enforcement**: Reject requests with `413 Payload Too Large`
- [ ] **Reason**: Prevent DoS attacks via large file uploads, ensure reasonable processing time

**Reference**: [File Size Validation](https://medium.com/@willchesson/build-a-custom-file-upload-component-in-next-js-managing-file-sizes-formats-and-upload-limits-602e6793d0a1)

#### 3. CSV Injection Protection
- [ ] **Sanitize cell values**: Remove leading `=`, `+`, `-`, `@` characters from descriptions
- [ ] **Reason**: Prevent CSV injection (formulas executing in Excel when user opens CSV)
- [ ] **Library**: Use `papaparse` with proper config, or sanitize manually

**Reference**: [CSV Injection Protection](https://dev.to/linolhamelton/im-tired-of-using-two-csv-libraries-i-built-jtcsv-53do)

#### 4. Input Validation
- [ ] **Zod schemas**: Validate all user inputs (accountId, parseId, column mappings)
- [ ] **Date validation**: Reject invalid dates (e.g., Feb 30), dates in future, dates >10 years old
- [ ] **Amount validation**: Reject non-numeric values, extremely large values (>$1 billion)
- [ ] **Description validation**: Max length 500 chars, sanitize special characters

#### 5. Rate Limiting
- [ ] **Per-user limit**: 10 imports per hour (prevent abuse)
- [ ] **Global limit**: 1000 imports per hour (prevent DoS)
- [ ] **Implementation**: Use Fastify rate-limit plugin or Redis-based rate limiter

#### 6. Tenant Isolation (Critical)
- [ ] **All queries**: Filter by tenantId (never trust client-provided IDs)
- [ ] **Account verification**: Before import, verify account belongs to user's tenant
- [ ] **Prisma pattern**:
  ```typescript
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      entity: {
        tenant: {
          memberships: {
            some: { user: { clerkUserId: request.userId } }
          }
        }
      }
    }
  })
  ```
- [ ] **Test**: Create 2 tenants, verify one can't import to other's accounts

#### 7. No File Storage
- [ ] **Parse in memory**: Don't save uploaded files to disk
- [ ] **Temporary cache**: Store parsed data in memory (or Redis) with short TTL (1 hour)
- [ ] **Auto-cleanup**: Clear cache after import completes or expires
- [ ] **Reason**: Reduce attack surface, avoid storing sensitive financial data unnecessarily

---

## Performance Considerations

### Parsing Performance

#### 1. CSV Parsing
- [ ] **Library**: Use `papaparse` (battle-tested, fast)
- [ ] **Streaming**: For large CSVs (>1MB), use streaming API to avoid loading entire file in memory
- [ ] **Target**: Parse 10,000 rows in <3 seconds

**Reference**: [Papa Parse](https://betterstack.com/community/guides/scaling-nodejs/parsing-csv-files-with-papa-parse/)

#### 2. PDF Parsing
- [ ] **Library**: Use `pdf-parse` or `pdfjs-dist`
- [ ] **Text extraction**: Extract text first, then parse with regex (faster than page-by-page)
- [ ] **Fallback**: If extraction fails, return clear error (don't attempt OCR in Phase 1)
- [ ] **Target**: Extract text from 10-page PDF in <5 seconds

**Reference**: [PDF Parsing Libraries](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)

#### 3. Duplicate Detection
- [ ] **Algorithm**: Levenshtein distance (use `string-similarity` library)
- [ ] **Optimization**: Only check transactions within ±7 days of import date (reduce comparisons)
- [ ] **Batch processing**: Check duplicates in chunks of 100 transactions
- [ ] **Target**: Check 1,000 transactions against 10,000 existing transactions in <5 seconds

**Reference**: [Fuzzy Matching for Duplicates](https://optimus.tech/blog/fuzzy-matching-algorithms-in-bank-reconciliation-when-exact-match-fails)

#### 4. Database Queries
- [ ] **Indexes**: Ensure indexes on `Transaction.accountId`, `Transaction.date`, `Transaction.amount`
- [ ] **Batch inserts**: Insert transactions in batches of 100 (use Prisma `createMany`)
- [ ] **Select only needed fields**: Don't fetch entire Transaction objects, use `select` clauses
- [ ] **Target**: Insert 1,000 transactions in <10 seconds

#### 5. Frontend Performance
- [ ] **Virtual scrolling**: Use `@tanstack/react-virtual` for preview table (render only visible rows)
- [ ] **Debounce search**: Wait 300ms after user stops typing before filtering
- [ ] **Optimistic updates**: Update UI immediately, sync with server in background
- [ ] **Lazy loading**: Load categories and other dropdown data only when needed
- [ ] **Target**: Preview table with 1,000 rows renders in <1 second, scrolls smoothly

---

## Financial Integrity

### 1. Amount Handling
- [x] **Integer cents**: All amounts stored as Integer (not Float) ✅ Transaction model already uses Int
- [ ] **Conversion**: Always convert decimal amounts to cents (multiply by 100)
- [ ] **Validation**: Reject amounts >$10 billion (likely data error)
- [ ] **Negative handling**: Debits = negative, Credits = positive
- [ ] **Zero handling**: Allow $0 transactions (transfers, corrections)

**Example:**
```typescript
function parseCurrency(value: string): number {
  // Remove currency symbols, commas
  const cleaned = value.replace(/[$,€£¥]/g, '')

  // Parse as float, convert to cents
  const amount = parseFloat(cleaned) * 100

  // Round to nearest cent (handle floating-point precision)
  return Math.round(amount)
}
```

### 2. Multi-Currency Handling
- [ ] **Store original currency**: Transaction model has `currency` field
- [ ] **Import validation**: Warn if file currency doesn't match account currency
- [ ] **User choice**: Allow user to confirm or cancel if mismatch
- [ ] **No auto-conversion**: Don't convert currencies during import (preserve original data)

### 3. Balance Verification
- [ ] **Optional field**: Balance is not required (many statements don't include it)
- [ ] **Reconciliation check**: If balance provided, calculate expected balance and compare
- [ ] **Mismatch warning**: If balance doesn't match, show warning: "Balance mismatch. Expected: $X, File shows: $Y. Difference: $Z."
- [ ] **User decision**: Allow user to proceed or cancel
- [ ] **Don't auto-adjust**: Never automatically adjust account balance without user confirmation

### 4. Audit Trail
- [ ] **ImportBatch record**: Captures who imported, when, from what file
- [ ] **Transaction.importBatchId**: Links transaction back to import batch
- [ ] **Soft delete**: Use `deleted` flag instead of hard delete (for undo functionality)
- [ ] **Metadata**: Store original file name, column mappings, settings in ImportBatch.metadata

### 5. Transaction Deduplication
- [ ] **Pre-import check**: Detect duplicates before creating transactions
- [ ] **Fuzzy matching**: Use Levenshtein distance (80% similarity threshold)
- [ ] **User confirmation**: Show duplicates to user, allow override if needed
- [ ] **Skip by default**: Default behavior is to skip duplicates (prevent double-counting)

---

## Testing Strategy

### Unit Tests

**Backend (Jest):**

#### 1. Parser Service Tests (`parserService.test.ts`)
```typescript
describe('parseCSV', () => {
  it('should parse basic CSV with standard columns', () => {
    const csv = 'Date,Description,Amount\n01/15/2026,Walmart,-50.00'
    const result = parseCSV(Buffer.from(csv))
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-01-15')
    expect(result[0].amount).toBe(-5000) // cents
  })

  it('should handle MM/DD/YYYY date format', () => {...})
  it('should handle DD/MM/YYYY date format', () => {...})
  it('should parse amounts with currency symbols', () => {...})
  it('should parse negative amounts correctly', () => {...})
  it('should handle Debit/Credit columns', () => {...})
})
```

#### 2. Categorization Service Tests (`categorizationService.test.ts`)
```typescript
describe('categorizeTransaction', () => {
  it('should categorize Walmart as Groceries', () => {
    const result = categorizeTransaction('WALMART SUPERCENTER', -5000)
    expect(result.categoryId).toBe('groceries-id')
    expect(result.confidence).toBeGreaterThan(80)
  })

  it('should return low confidence for unknown merchant', () => {
    const result = categorizeTransaction('XYZ UNKNOWN STORE', -5000)
    expect(result.confidence).toBeLessThan(50)
  })
})
```

#### 3. Duplicate Detection Tests (`duplicationService.test.ts`)
```typescript
describe('findDuplicates', () => {
  it('should detect exact match duplicate', () => {...})
  it('should detect fuzzy match duplicate (90% similar)', () => {...})
  it('should not flag two $5 coffees as duplicates', () => {...})
  it('should check only transactions within ±7 days', () => {...})
})
```

---

### Integration Tests

**API Endpoints:**

#### 1. Upload Endpoint Tests
```typescript
describe('POST /api/import/upload', () => {
  it('should upload CSV and return parsed transactions', async () => {
    const formData = new FormData()
    formData.append('file', csvFile)
    formData.append('accountId', 'account-123')

    const response = await api.post('/import/upload')
      .set('Authorization', `Bearer ${token}`)
      .send(formData)

    expect(response.status).toBe(200)
    expect(response.body.parseId).toBeDefined()
    expect(response.body.transactions).toHaveLength(47)
  })

  it('should reject file >10MB', async () => {...})
  it('should reject unsupported file type', async () => {...})
  it('should return 403 if account not owned by user', async () => {...})
})
```

#### 2. Import Confirmation Tests
```typescript
describe('POST /api/import/confirm', () => {
  it('should create transactions for small import (<100)', async () => {...})
  it('should queue background job for large import (≥100)', async () => {...})
  it('should skip duplicates when skipDuplicates=true', async () => {...})
  it('should rollback on database error', async () => {...})
})
```

---

### Multi-Tenant Isolation Tests

**Critical Security Tests:**
```typescript
describe('Multi-tenant isolation', () => {
  it('Tenant A cannot import to Tenant B account', async () => {
    // Create account for Tenant B
    const accountB = await createTestAccount(tenantB)

    // Attempt import as Tenant A user
    const response = await api.post('/import/upload')
      .set('Authorization', `Bearer ${tenantAToken}`)
      .send({ file: csvFile, accountId: accountB.id })

    expect(response.status).toBe(403)
    expect(response.body.error).toBe('Forbidden')
  })

  it('Tenant A cannot see Tenant B import history', async () => {...})
  it('Tenant A cannot undo Tenant B import', async () => {...})
})
```

---

### E2E Tests (Playwright)

**Critical User Flows:**

#### 1. CSV Import Flow
```typescript
test('Import CSV file end-to-end', async ({ page }) => {
  // Navigate to import page
  await page.goto('/accounts/acc-123/import')

  // Upload CSV file
  await page.setInputFiles('input[type="file"]', 'test-statement.csv')
  await page.click('text=Next')

  // Verify column mapping (skip if auto-detected correctly)
  await expect(page.locator('text=Date: Transaction Date')).toBeVisible()
  await page.click('text=Next')

  // Preview transactions
  await expect(page.locator('table tbody tr')).toHaveCount(47)
  await expect(page.locator('text=12 duplicates will be skipped')).toBeVisible()

  // Confirm import
  await page.click('text=Import 35 Transactions')

  // Verify success
  await expect(page.locator('text=35 transactions imported successfully')).toBeVisible()
})
```

#### 2. Large Import with Background Processing
```typescript
test('Import large file with background processing', async ({ page }) => {
  // Upload large CSV (1000+ transactions)
  await page.setInputFiles('input[type="file"]', 'large-statement.csv')
  await page.click('text=Next')
  await page.click('text=Import 1000 Transactions')

  // Verify background processing message
  await expect(page.locator('text=Import is processing in background')).toBeVisible()

  // Wait for completion (poll progress)
  await page.waitForSelector('text=1000 transactions imported successfully', { timeout: 60000 })
})
```

---

## Rollout Plan

### Staging Deployment

**Pre-Deployment:**
- [ ] Code review complete (2 reviewers minimum)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Database migration tested locally
- [ ] Demo data script ready

**Deployment Steps:**
1. [ ] Push code to staging branch
2. [ ] Deploy API service (Fastify server restart)
3. [ ] Deploy frontend (Next.js build and deploy)
4. [ ] Run Prisma migration on staging database:
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```
5. [ ] Seed demo data (run seed script)

**Verification Checklist:**
- [ ] Smoke test: Import CSV file → verify transactions created
- [ ] Smoke test: Import PDF file → verify transactions extracted
- [ ] Smoke test: Large import (1000+ transactions) → verify background processing
- [ ] Check import history → verify list displays
- [ ] Test undo import → verify soft delete works
- [ ] Check error logs → no unexpected errors

---

### Production Deployment

**Pre-Production Checklist:**
- [ ] Staging testing complete (minimum 2-3 days)
- [ ] Stakeholder approval (demo to product owner/CEO)
- [ ] Database backup completed (before migration)
- [ ] Rollback plan ready (previous version tagged)
- [ ] Monitoring alerts configured

**Deployment Strategy: Feature Flag (Recommended)**

1. **Deploy with flag OFF** (Day 1):
   - [ ] Deploy code to production
   - [ ] Run database migration
   - [ ] Feature flag: `ENABLE_BANK_STATEMENT_IMPORT=false` (default off)
   - [ ] Monitor for deployment issues

2. **Enable for internal users** (Day 2):
   - [ ] Set flag to `internal` (only internal email domains)
   - [ ] Internal team tests feature in production
   - [ ] Monitor error rates, performance

3. **Gradual rollout** (Day 3-7):
   - [ ] Enable for 10% of users (random selection)
   - [ ] Monitor metrics: Import success rate, error rate, user engagement
   - [ ] Increase to 50% if no issues
   - [ ] Increase to 100% if metrics look good

**Feature Flag Implementation:**
```typescript
// apps/api/src/middleware/featureFlag.ts
export function checkFeatureFlag(feature: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.userId // from auth middleware

    // Check if feature is enabled
    const isEnabled = await featureFlagService.isEnabled(feature, user)

    if (!isEnabled) {
      return reply.status(403).send({
        error: 'Feature not available',
        message: 'Bank statement import is not yet available for your account.'
      })
    }
  }
}

// Usage
fastify.post('/import/upload', {
  onRequest: [authMiddleware, checkFeatureFlag('bank-statement-import')]
}, async (request, reply) => {...})
```

---

### Monitoring & Metrics

**Post-Launch Monitoring (First 7 Days):**

**Quantitative Metrics:**
- [ ] Import success rate: Target >95%
- [ ] Import error rate: Target <5%
- [ ] Average import time (small): Target <5 seconds
- [ ] Average import time (large): Target <60 seconds (background)
- [ ] Duplicate detection false positive rate: Target <10%
- [ ] Auto-categorization accuracy: Target >50% (Phase 1)
- [ ] User adoption: % of users who import within first week
- [ ] Import volume: Average imports per day per user

**Qualitative Metrics:**
- [ ] User feedback: "Easy to use", "Saved time", "Accurate"
- [ ] Support tickets: Monitor for common issues
- [ ] Error messages: Are they clear and helpful?
- [ ] User drop-off: At what step do users abandon import?

**Alerts:**
- [ ] Error rate >10% → Alert engineering team
- [ ] Import success rate <90% → Investigate immediately
- [ ] API response time >10 seconds → Check for performance issues
- [ ] Background job failures >5% → Check job queue

---

### Rollback Plan

**If major issues occur:**

1. **Immediate Actions:**
   - [ ] Set feature flag to OFF (disable for all users)
   - [ ] No need to rollback database (migration is additive)
   - [ ] Post status update (if customer-facing)

2. **Investigate:**
   - [ ] Check error logs (identify root cause)
   - [ ] Check database (any data corruption?)
   - [ ] Check user reports (what are users experiencing?)

3. **Fix & Redeploy:**
   - [ ] Fix issues locally
   - [ ] Test thoroughly on staging
   - [ ] Deploy fix to production
   - [ ] Re-enable feature flag gradually

4. **Post-Incident:**
   - [ ] Write incident report (what happened, why, how we fixed)
   - [ ] Update documentation (if needed)
   - [ ] Add tests to prevent regression

---

## Open Questions

### 1. OFX/QFX Support Priority
**Question**: Should OFX/QFX support be in Phase 1 or Phase 2?

**Options:**
- A) Phase 1 (include in MVP) - Adds 2-3 days
- B) Phase 2 (after CSV + PDF working) - Ship faster

**Recommendation**: **Option B (Phase 2)**. OFX is less common than CSV/PDF. Ship CSV+PDF first, validate with users, then add OFX based on demand.

---

### 2. Background Job Infrastructure
**Question**: What technology for background jobs?

**Options:**
- A) Simple in-memory queue (Node.js array)
- B) Bull/BullMQ with Redis
- C) External service (AWS SQS, Cloudflare Queues)

**Recommendation**: **Option A (Phase 1)**, upgrade to **Option B (Phase 2)** if needed. Most imports are <100 transactions (synchronous). In-memory queue sufficient for MVP. Add Redis if we see many large imports.

---

### 3. OCR for Scanned PDFs
**Question**: Should we support scanned PDF bank statements (requires OCR)?

**Options:**
- A) Phase 1 (Tesseract.js OCR)
- B) Phase 2/3 (AWS Textract or Google Vision)
- C) Not supported (users must use CSV)

**Recommendation**: **Option C (Not supported in Phase 1)**. Most banks provide digital PDFs or CSV exports. If users request scanned PDF support, add in Phase 2 with cloud OCR service (better accuracy than Tesseract).

---

### 4. Auto-Categorization Accuracy Threshold
**Question**: What accuracy is acceptable for Phase 1?

**Options:**
- A) >50% accuracy (keyword matching)
- B) >70% accuracy (advanced keyword matching + rules)
- C) >80% accuracy (ML-based)

**Recommendation**: **Option A (>50% accuracy)**. Keyword matching is fast to implement and sufficient for MVP. Users can manually categorize remaining transactions. Phase 2 can add ML for higher accuracy.

---

### 5. Import Undo Time Limit
**Question**: How long should users be able to undo an import?

**Options:**
- A) 1 hour (mistakes only)
- B) 24 hours (until next day)
- C) 7 days (one week)
- D) 30 days (one month)

**Recommendation**: **Option B (24 hours)**. Balances flexibility (catch mistakes) with data integrity. After 24 hours, transactions may be reconciled or referenced elsewhere, making undo risky.

---

### 6. Mobile App Support
**Question**: Should import work on mobile devices?

**Options:**
- A) Full support (responsive UI)
- B) View-only (can't upload on mobile)
- C) Desktop only (redirect mobile users)

**Recommendation**: **Option A (Full support with caveats)**. File upload works on mobile (file picker), but preview table and column mapping may be cramped. Ensure usable on tablet (iPad) at minimum. Phone experience may be view-only for Phase 1.

---

### 7. Multi-File Upload Limit
**Question**: How many files can accountants upload at once?

**Options:**
- A) 1 file (simplest)
- B) 5 files (monthly statements)
- C) 10 files (full support for accountants)

**Recommendation**: **Option C (10 files)**. Supports accountant use case without overwhelming system. Can be increased later if needed. Process files sequentially (not parallel) to avoid memory issues.

---

## Dependencies

**Blocked By:**
- None (Phase 0 complete - auth, database, API ready)

**Blocks:**
- Bank reconciliation feature (depends on imported transactions)
- Historical trend analysis (depends on populated transaction data)
- Budgeting features (depends on transaction history)
- AI categorization improvements (depends on training data from imports)

---

## Resources

### Internal Documentation
- [Bank Statement Import Brainstorm](../brainstorms/2026-01-30-bank-statement-import-brainstorm.md)
- [Bank Reconciliation Feature](../features/02-bank-reconciliation.md)
- [Product Overview](../product/overview.md)
- [Prisma Schema](../../packages/db/prisma/schema.prisma)

### External Resources

**CSV Parsing:**
- [Papa Parse](https://betterstack.com/community/guides/scaling-nodejs/parsing-csv-files-with-papa-parse/)
- [csv-parse (Node CSV)](https://csv.js.org/parse/)
- [CSV Parsers Comparison](https://leanylabs.com/blog/js-csv-parsers-benchmarks/)

**PDF Parsing:**
- [PDF Parsing Libraries for Node.js](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)

**File Upload Security:**
- [Next.js File Upload Security](https://moldstud.com/articles/p-handling-file-uploads-in-nextjs-best-practices-and-security-considerations)
- [File Size Limits in Next.js](https://medium.com/@willchesson/build-a-custom-file-upload-component-in-next-js-managing-file-sizes-formats-and-upload-limits-602e6793d0a1)

**Duplicate Detection:**
- [Fuzzy Matching in Bank Reconciliation](https://optimus.tech/blog/fuzzy-matching-algorithms-in-bank-reconciliation-when-exact-match-fails)
- [Fuzzy Matching Guide 2026](https://matchdatapro.com/fuzzy-matching-101-a-complete-guide-for-2026/)

**TypeScript & Next.js:**
- [Next.js 16 App Router Docs](https://nextjs.org/docs/app)
- [Prisma Docs](https://www.prisma.io/docs)
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)

---

## Estimation

### Complexity
**Medium-High**

**Reasoning:**
- Multiple file formats (CSV, PDF, OFX, XLSX)
- Complex parsing logic (date formats, amounts, column detection)
- Duplicate detection algorithm (fuzzy matching)
- Auto-categorization logic (keyword matching)
- Background job processing (for large imports)
- Multi-step wizard UI (file upload, column mapping, preview, import)
- Database migrations (enhance ImportBatch model)

**Not High Because:**
- No new database models required (ImportBatch exists)
- No external service integrations (except FX rates - simple)
- No ML infrastructure (keyword matching only in Phase 1)
- Clear requirements from brainstorm document

---

### Effort
**2-3 weeks (12-15 working days)**

**Breakdown:**
- **Week 1** (Days 1-5):
  - Backend: CSV parsing, duplicate detection, categorization (3 days)
  - Frontend: File upload, column mapping UI (2 days)
- **Week 2** (Days 6-10):
  - Backend: Import logic, background processing (2 days)
  - Frontend: Preview table, success page (2 days)
  - Backend: PDF parsing (1 day)
- **Week 3** (Days 11-15):
  - Frontend: Import history page (1 day)
  - Testing: Integration tests, E2E tests, bug fixes (3 days)
  - Deployment: Documentation, staging deployment, demo (1 day)

**Assumptions:**
- 1 full-stack developer working full-time
- No major blockers or scope changes
- Existing infrastructure (auth, database, API framework) stable
- Brainstorm decisions finalized (no requirement changes)

**Can Be Accelerated:**
- Parallel development (1 backend + 1 frontend developer) → 10-12 days
- Reduce scope (CSV only, no PDF) → 8-10 days
- Reduce scope (skip import history, skip undo) → 10-12 days

---

### Risk
**Medium**

**Risk Factors:**

1. **PDF Parsing Complexity (Medium-High Risk)**:
   - PDFs have inconsistent layouts (bank-specific formats)
   - Text extraction may fail for complex tables or scanned PDFs
   - **Mitigation:** Start with common banks, test with real PDFs, provide clear fallback (use CSV), add OCR in Phase 2 if needed

2. **Duplicate Detection Accuracy (Medium Risk)**:
   - False positives (flagging legitimate transactions as duplicates)
   - False negatives (missing obvious duplicates)
   - **Mitigation:** Tune similarity threshold (80%), allow user override, collect feedback and adjust

3. **Performance with Large Files (Medium Risk)**:
   - Large CSVs (10,000+ rows) may be slow to parse
   - Background job queue may have scaling issues
   - **Mitigation:** Test with realistic file sizes, implement streaming parsing if needed, add Redis queue in Phase 2

4. **User Experience Complexity (Low-Medium Risk)**:
   - Multi-step wizard may confuse users
   - Column mapping may be unclear
   - **Mitigation:** User testing with 2-3 target users, clear help text, video tutorial

5. **Data Integrity (Low Risk)**:
   - Amount parsing errors (floating-point precision)
   - Date parsing errors (ambiguous formats)
   - **Mitigation:** Use integer cents, extensive unit tests, manual QA with sample data

6. **Security (Low Risk)**:
   - File upload vulnerabilities (malicious files)
   - Tenant isolation bypass (IDOR)
   - **Mitigation:** File type validation, size limits, thorough tenant isolation tests, security review agents

**Overall:** Manageable risk with proper planning, testing, and incremental delivery. PDF parsing is the highest risk - can be deferred to Phase 2 if proves too complex.

---

## Success Metrics (Post-Launch)

### Quantitative Metrics

**Adoption:**
- % of users who import at least one file within first week: Target >60%
- Average imports per user per month: Target >2
- File format distribution: CSV vs PDF vs OFX vs XLSX

**Performance:**
- Import success rate: Target >95% (all imports complete successfully)
- Import error rate: Target <5%
- Average import time (small <100 transactions): Target <5 seconds
- Average import time (large ≥100 transactions): Target <60 seconds (background)
- Duplicate detection false positive rate: Target <10%

**Data Quality:**
- Auto-categorization accuracy: Target >50% (Phase 1 keyword matching)
- % of transactions requiring manual categorization: Target <50%
- Duplicate detection accuracy: >90% (catches true duplicates)

---

### Qualitative Metrics

**User Feedback:**
- Positive sentiment: Target >80% positive feedback
- Common themes: "Easy to use", "Saved time", "Accurate"
- Pain points: What confuses users? Where do they get stuck?

**Support Tickets:**
- Reduction in "How do I add transactions?" tickets: Target 30% reduction
- Common issues: File format errors, column mapping confusion, duplicate questions

**Engagement:**
- Import completion rate: % of users who start import and complete it (Target >80%)
- Drop-off points: Where do users abandon import? (Upload, mapping, preview?)

---

### Internal Metrics

**Engineering:**
- Code quality: No critical bugs in first 2 weeks
- Performance: No API timeouts or database issues
- Monitoring: Alerts working correctly

**Product:**
- Demo readiness: Can demo feature to stakeholders confidently
- Documentation: Users can self-serve (FAQ, troubleshooting)
- Iteration readiness: Clear backlog of Phase 2 improvements

---

## Conclusion

The **Bank Statement Import** feature is a critical bridge between manual data entry and automated API integrations. By supporting multiple file formats (CSV, PDF, OFX, XLSX) with a user-friendly staged import workflow, we enable users to:

1. ✅ **Populate real data quickly** - Import years of historical transactions in minutes
2. ✅ **Avoid manual entry** - Bulk import vs. typing each transaction
3. ✅ **Gain confidence in data** - Preview and review before committing
4. ✅ **Leverage automation** - Auto-categorization saves time
5. ✅ **Maintain data integrity** - Duplicate detection prevents errors

**Key Success Factors:**
- **Phased delivery**: Ship CSV + PDF first (2-3 weeks), add OFX/XLSX later
- **User control**: Preview-before-import workflow builds trust
- **Performance**: Background processing for large imports
- **Security**: Tenant isolation, file validation, rate limiting
- **Quality gates**: Multiple review agents, comprehensive testing

**Next Action:** Get approval and start implementation! 🚀

---

**Document Owner:** Claude Code
**Plan Author:** Claude Sonnet 4.5
**Last Updated:** 2026-01-30
**Status:** Ready for implementation
**Start Date:** TBD (after approval)
**Target Completion:** 2-3 weeks from start date
