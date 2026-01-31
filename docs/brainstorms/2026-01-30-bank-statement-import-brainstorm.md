# Bank Statement Import Brainstorm

**Date:** 2026-01-30
**Status:** Brainstormed
**Related:**
- [Bank Reconciliation Feature](../features/02-bank-reconciliation.md)
- [Product Overview](../product/overview.md)
- [Prisma Schema - ImportBatch Model](../../packages/db/prisma/schema.prisma)

---

## Problem Statement

Users need to quickly populate Akount with real transaction data from their bank statements to:
1. **Get real transaction data fast** - Start using Akount productively without waiting for API integrations
2. **Avoid manual data entry** - Typing each transaction manually is tedious and error-prone
3. **Bridge gap before API integration** - Manual import is temporary until automated bank feed (Plaid/Flinks) is set up
4. **Historical data migration** - Import past months/years of transactions to see trends and build financial history

Currently, users have no way to bulk import transactions. They must either:
- Wait for Plaid/Flinks integration (not yet built)
- Manually create each transaction (time-consuming, error-prone)
- Leave Akount empty (can't evaluate the product)

This blocks both **testing/demo** (developers can't populate realistic data) and **production use** (users can't migrate from existing systems).

---

## User Needs

### Target Users

**1. Solo Entrepreneurs** (Primary)
- Managing 1-2 business entities + personal accounts
- Need simple upload and quick review workflow
- Want automatic categorization to save time
- Tech-savvy but not accounting experts

**2. Accountants/Bookkeepers** (Secondary)
- Processing statements for multiple clients
- Need bulk operations and validation tools
- Require confidence in data accuracy (no surprises)
- Experienced with reconciliation workflows

**3. Internal Team** (Immediate)
- Developers and demo accounts
- Need to populate realistic test data quickly
- Validate dashboard and reporting features
- Create screenshots and demos for stakeholders

### Desired Outcomes

**Immediate (Post-Import):**
- Transactions are visible in dashboard and transaction list
- Transactions are automatically categorized (or suggested category)
- Duplicates are detected and skipped (no duplicate entries)
- Account balance is updated correctly
- User feels confident data is accurate

**Long-Term (Ongoing Use):**
- Historical trends visible in charts (cash flow, spending by category)
- Dashboard metrics reflect real data (revenue, expenses, net income)
- Can reconcile bank accounts (match imported transactions to bank feed later)
- Categorization improves over time (learns from user corrections)

### User Workflow (Ideal)

**Solo Entrepreneur Flow:**
1. User downloads CSV from their bank website
2. Navigates to Akount → Accounts → [Select Account] → "Import Transactions"
3. Drag-and-drops CSV file onto upload area
4. System automatically detects columns and shows preview
5. User sees 47 transactions, 12 flagged as duplicates, 35 auto-categorized
6. User reviews 10 uncategorized transactions and assigns categories
7. Clicks "Import 35 new transactions"
8. Success: "35 transactions imported successfully. View transactions →"

**Accountant Flow:**
1. Accountant receives 5 PDF bank statements from client via email
2. Uploads all 5 files at once (bulk upload)
3. System processes in background, sends email when complete
4. Reviews import summary: 523 transactions, 18 duplicates, 480 categorized, 25 need review
5. Filters to "Needs Review" and bulk-assigns categories
6. Approves batch import
7. Notifies client: "January reconciliation complete"

---

## Proposed Approach: Staged Import with Preview

### Overview

Multi-step workflow where users upload files, system parses and suggests categorization, user previews and edits transactions, then approves import. Provides transparency, control, and educational value.

### Key Features

#### 1. File Upload UI
- **Drag-and-Drop Area**: Large drop zone with "Drag bank statement here or click to browse"
- **File Picker**: Standard file input with multi-file support
- **Supported Formats**: CSV, PDF, OFX/QFX, XLSX (Excel)
- **File Validation**:
  - Max file size: 10MB per file
  - Max 10 files at once (for accountants)
  - File type validation (reject unsupported formats)
  - Show file size and name after selection

#### 2. Intelligent Parsing
- **Auto-Format Detection**:
  - CSV: Parse with Papa Parse library, auto-detect delimiter (comma, semicolon, tab)
  - PDF: Extract text with PDF.js, use regex patterns to find transaction tables
  - OFX/QFX: Parse XML structure (standard format)
  - XLSX: Parse Excel sheets with SheetJS (xlsx library)
- **Transaction Extraction**:
  - Identify columns: Date, Description, Debit, Credit, Balance
  - Handle multiple formats (US banks, Canadian banks, European banks)
  - Normalize date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
  - Parse amounts (handle negatives, currency symbols, thousand separators)

#### 3. Column Mapping (CSV/XLSX only)
- **Smart Detection**: Auto-map columns based on header names
  - "Date", "Transaction Date", "Posting Date" → `date`
  - "Description", "Merchant", "Details" → `description`
  - "Amount", "Debit", "Withdrawal" → `amount` (negative)
  - "Credit", "Deposit" → `amount` (positive)
  - "Balance", "Running Balance" → `balance`
- **Manual Adjustment**: User can override auto-mapping via dropdowns
- **Preview**: Show first 5 rows with mapped values
- **Validation**: Ensure required columns are mapped (date, description, amount)

#### 4. Duplicate Detection
- **Detection Logic**:
  - Match on: Same account + same date + same amount + similar description (fuzzy match)
  - Confidence score: Exact match (100%), Similar (80-99%), Unlikely (60-79%)
  - Show duplicate indicator in preview table
- **User Options**:
  - Skip duplicates automatically (default)
  - Show duplicates for review (can force import if needed)
  - Highlight in preview table (grey background, "Duplicate" badge)

#### 5. Auto-Categorization
- **Phase 1 (Keyword Matching)**:
  - Predefined rules: "Walmart" → Groceries, "Shell" → Gas, "Netflix" → Entertainment
  - Case-insensitive, partial match
  - Multi-language support (English, French, Spanish)
  - Confidence score based on keyword specificity
- **Phase 2 (ML-Powered)** - Future enhancement:
  - Train classifier on user's historical categorizations
  - Learn merchant patterns specific to user's locale
  - Improve over time with user feedback
- **User Interface**:
  - Show suggested category with confidence indicator
  - Green badge: High confidence (>80%)
  - Yellow badge: Medium confidence (50-80%)
  - Grey badge: Uncategorized (<50%)
  - One-click to accept or dropdown to change

#### 6. Preview & Edit Table
- **Table Columns**:
  - Status: ✓ (ready), ⚠ (needs review), 🔁 (duplicate)
  - Date: Formatted (Jan 15, 2026)
  - Description: Editable inline
  - Category: Dropdown with suggestions
  - Amount: Color-coded (green = income, red = expense)
  - Actions: Edit, Delete from import
- **Filters**:
  - All Transactions (default)
  - Needs Review (uncategorized or low confidence)
  - Duplicates (flagged as potential duplicates)
  - Ready to Import (categorized, no issues)
- **Bulk Actions**:
  - Select multiple rows (checkboxes)
  - Bulk categorize (assign category to all selected)
  - Bulk delete (remove from import)
  - Select all / Deselect all

#### 7. Import Process
- **Summary Card** (Before Import):
  - "Ready to import 35 transactions"
  - "12 duplicates will be skipped"
  - "3 transactions need review (uncategorized)"
  - "Importing to: [Account Name]"
- **Import Button**: "Import 35 Transactions" (disabled if critical errors)
- **Background Processing** (for large imports >100 transactions):
  - Create `ImportBatch` record with status PROCESSING
  - Process in chunks of 100 transactions
  - Update progress indicator (e.g., "Importing... 150/500 complete")
  - Send notification when complete
- **Synchronous Processing** (for small imports <100 transactions):
  - Process immediately
  - Show loading spinner
  - Redirect to success page when done

#### 8. Post-Import Experience
- **Success Page**:
  - "✓ 35 transactions imported successfully"
  - Summary: X categorized, Y need review
  - Quick actions: "View Transactions", "Categorize Remaining", "Import Another File"
- **Import History**: Link to view past imports
  - Table of all `ImportBatch` records
  - Columns: Date, File Name, Transactions Imported, Status
  - Click to expand and see transaction list
  - Option to undo import (soft delete transactions)

---

### Technical Architecture

#### Frontend Components
- **`ImportWizard.tsx`**: Multi-step wizard component
  - Step 1: Upload
  - Step 2: Column Mapping (conditional - only for CSV/XLSX)
  - Step 3: Preview & Edit
  - Step 4: Confirm & Import
  - Step 5: Success / Error
- **`FileUpload.tsx`**: Drag-and-drop upload area with progress indicators
- **`ColumnMapper.tsx`**: Interactive column mapping UI
- **`TransactionPreviewTable.tsx`**: Editable table with filters and bulk actions
- **`CategorySuggester.tsx`**: Smart category dropdown with suggestions
- **`ImportHistory.tsx`**: List of past imports with details

#### Backend API Endpoints
- **`POST /api/import/upload`**: Upload file and get parseId
- **`GET /api/import/parse/:parseId`**: Get parsed transactions (preview)
- **`POST /api/import/confirm`**: Confirm and create transactions
- **`GET /api/import/history`**: List past imports
- **`DELETE /api/import/:batchId`**: Undo import (soft delete)

#### Services & Libraries
- **Parsing Libraries**:
  - `papaparse` - CSV parsing (robust, handles edge cases)
  - `pdf.js` - PDF text extraction
  - `node-ofx-parser` - OFX/QFX parsing
  - `xlsx` (SheetJS) - Excel parsing
- **Auto-Categorization Service**:
  - `categorizeTransaction(description, amount, date)`
  - Returns: `{ categoryId, confidence, reason }`
  - Uses keyword dictionary + fuzzy matching (fuse.js)
- **Duplicate Detection Service**:
  - `findDuplicates(transactions, accountId, dateRange)`
  - Returns: Array of transaction IDs that are potential duplicates
  - Uses similarity algorithm (Levenshtein distance for descriptions)

#### Database
- **`ImportBatch` Model** (already exists):
  - `id`, `tenantId`, `entityId`, `sourceType`, `status`, `error`, `createdAt`
  - Add fields: `fileName`, `fileSize`, `transactionsCount`, `metadata` (JSON)
- **`Transaction` Model** (already exists):
  - Link to `importBatchId` (already exists)
  - `sourceType` set to `MANUAL` or `IMPORT` (enum value)

---

### Constraints

#### 1. File Size Limits
- **Max File Size**: 10MB per file
- **Max Transactions**: ~50,000 transactions per import (typical large file)
- **Rationale**: Prevents memory issues, ensures reasonable processing time
- **User Feedback**: If file exceeds limit, show error: "File too large. Maximum size is 10MB. Try splitting into multiple files."

#### 2. Processing Time
- **Small Imports** (<100 transactions): Synchronous (process immediately)
- **Large Imports** (≥100 transactions): Asynchronous (background job)
- **Timeout**: 60 seconds max for synchronous processing
- **Progress Updates**: WebSocket or polling for real-time progress on async jobs

#### 3. Error Handling
- **File Errors**:
  - Invalid format: "Unable to parse file. Please check it's a valid CSV, PDF, OFX, or XLSX file."
  - Corrupted file: "File appears to be corrupted. Please download a fresh copy from your bank."
  - Empty file: "File contains no transactions. Please check the file."
- **Parsing Errors**:
  - Missing required columns: "Required column 'Date' not found. Please map columns manually."
  - Invalid date format: "Unable to parse date in row 5. Expected format: MM/DD/YYYY."
  - Invalid amount: "Amount in row 12 is not a valid number: 'N/A'."
- **Import Errors**:
  - Database error: "An error occurred while importing. Please try again."
  - Duplicate transaction: "Transaction already exists (skipped)."
  - Category not found: "Category 'XYZ' not found. Please select a different category."

#### 4. Data Validation
- **Required Fields**: Date, Description, Amount (must be present and valid)
- **Date Validation**:
  - Must be a valid date (reject invalid dates like Feb 30)
  - Must be within reasonable range (not future dates, not older than 10 years)
  - Auto-detect format (MM/DD/YYYY vs DD/MM/YYYY) based on patterns
- **Amount Validation**:
  - Must be a number (reject non-numeric values)
  - Convert to integer cents (multiply by 100)
  - Handle negative/positive (some banks use negative for debits, some use separate columns)
- **Description Validation**:
  - Max length: 500 characters
  - Trim whitespace
  - Remove special characters that could break UI

#### 5. Multi-Tenant Isolation
- **Tenant ID**: All imports scoped to authenticated user's tenant
- **Entity ID**: User must select which entity (business) this import belongs to
- **Account ID**: User must select which account these transactions belong to
- **Verification**: Before import, verify account belongs to entity, entity belongs to tenant

#### 6. Multi-Currency Handling
- **Currency Detection**:
  - Read currency from file if available (e.g., OFX has currency field)
  - Otherwise, use account's currency
  - Warn if file currency doesn't match account currency
- **Amount Conversion**: Store all amounts in integer cents in account's currency

#### 7. Pleasant User Experience
- **Loading States**: Show spinners, progress bars, skeleton loaders (never blank screens)
- **Error Messages**: Clear, actionable, user-friendly (no technical jargon)
- **Success Feedback**: Celebrate success with animations, positive messaging
- **Undo Support**: Allow undo import within 24 hours (soft delete + restore)
- **Keyboard Shortcuts**: Arrow keys to navigate table, Enter to edit, Esc to cancel
- **Responsive Design**: Works on desktop (primary), tablet (acceptable), mobile (view-only)

---

## Edge Cases

### 1. Ambiguous Date Formats
**Problem**: File has dates like "01/02/2026" - is it Jan 2 or Feb 1?

**Solutions**:
- Check if all dates fit one format (if day >12 in any row, must be DD/MM/YYYY)
- Ask user to confirm date format before parsing
- Default to user's locale (US = MM/DD/YYYY, Canada/EU = DD/MM/YYYY)
- Show preview with both interpretations and let user choose

### 2. Mixed Debit/Credit Columns
**Problem**: Some banks use separate "Debit" and "Credit" columns, others use single "Amount" column with negatives.

**Solutions**:
- Auto-detect: If two columns named Debit/Credit, combine them (debit = negative, credit = positive)
- Column mapping allows user to specify: "Amount" OR "Debit + Credit"
- Preview shows final amount (positive/negative) for verification

### 3. Duplicate Detection False Positives
**Problem**: Two legitimate transactions on same day with same amount (e.g., two $5 coffees).

**Solutions**:
- Use fuzzy matching on description (not exact match)
- Show confidence score: 100% (exact match) = definitely duplicate, 80% = probably duplicate
- Allow user to override and force import duplicates if needed
- Provide "View existing transaction" link for comparison

### 4. Partial Import Failures
**Problem**: Import batch has 100 transactions, 90 succeed, 10 fail.

**Solutions**:
- Import succeeds partially (90 transactions created)
- Show error summary: "90 imported, 10 failed. View errors →"
- Error details table: Row number, Error message, Transaction preview
- Allow user to fix errors and re-import failed transactions only

### 5. Uncategorized Transactions
**Problem**: Auto-categorization can't categorize all transactions.

**Solutions**:
- Import transactions anyway (category = null)
- Flag as "Needs Categorization" in transaction list
- Show banner on dashboard: "15 transactions need categorization. Categorize now →"
- Bulk categorization tool (select multiple, assign category)

### 6. Balance Reconciliation Mismatches
**Problem**: Imported balance doesn't match account balance in system.

**Solutions**:
- Show warning: "Ending balance mismatch. Expected: $5,432.10, File shows: $5,450.00. Difference: $17.90."
- Suggest possible causes: Missing transactions, duplicate import, wrong account
- Allow user to proceed anyway (or cancel and investigate)
- Create reconciliation discrepancy record for audit trail

### 7. Large File Uploads (>10MB)
**Problem**: User tries to upload 50MB PDF with 6 months of transactions.

**Solutions**:
- Reject upload with clear message: "File too large (50MB). Maximum size is 10MB."
- Suggest splitting into monthly files
- Provide instructions on how to export smaller date ranges from bank
- Future enhancement: Chunked upload for very large files

### 8. PDF Parsing Failures
**Problem**: PDF is scanned image (no extractable text) or complex layout.

**Solutions**:
- Attempt text extraction with pdf.js
- If no text found: "This PDF appears to be an image. Please use CSV export instead."
- If text found but no transactions extracted: "Unable to find transaction table. Please check PDF format."
- Fallback: "Upload as CSV instead" link with instructions

### 9. Currency Mismatch
**Problem**: User imports EUR transactions into USD account.

**Solutions**:
- Detect currency in file (if available)
- Compare to account currency
- Show warning: "File currency (EUR) doesn't match account currency (USD). Convert amounts?"
- Options:
  - Cancel import
  - Import anyway (store original currency)
  - Convert using current exchange rate (show rate and converted amounts)

### 10. Historical Import with Existing Transactions
**Problem**: User imports January statements, but some January transactions already exist (manual entry or previous import).

**Solutions**:
- Duplicate detection catches exact matches (skip automatically)
- Partial matches: Show in preview with "Possible duplicate?" warning
- User can review and decide: Skip, Import anyway, or Merge
- Import summary shows: "35 new, 12 duplicates skipped, 3 possible duplicates imported"

---

## Alternatives Considered

### Alternative 1: Quick Import with Post-Import Review

**Description:** Streamlined one-click import that processes file immediately. User reviews and edits after import is complete.

**User Flow:**
1. Upload file → auto-upload starts immediately
2. Background job parses and creates transactions
3. Notification when complete
4. User reviews imported transactions, edits if needed
5. Clicks "Approve Batch" to finalize

**Pros:**
- Fastest workflow (fewest clicks)
- Great for power users who trust the system
- Can still review and correct after import

**Cons:**
- Less control (transactions created before user reviews)
- Harder to fix errors (need to edit/delete after the fact)
- Less educational (user doesn't see categorization logic)

**Why Not:**
- Akount focuses on financial accuracy - review before commit is safer
- Solo entrepreneurs (primary users) need confidence in accuracy
- Can add "Quick Import" mode later as power user feature

---

### Alternative 2: Smart Import with Machine Learning

**Description:** Advanced workflow with ML-powered categorization that learns from user's past behavior.

**User Flow:**
1. Upload file
2. ML model analyzes transactions and auto-categorizes with high confidence
3. Only shows transactions needing review (duplicates, anomalies, low confidence)
4. User approves import with minimal clicks
5. ML improves over time with user feedback

**Pros:**
- Best long-term UX (minimal user effort)
- Differentiates Akount from competitors
- Aligns with "AI Financial Advisor" vision

**Cons:**
- Significantly more complex (ML infrastructure, training pipeline)
- Doesn't work well for new users (need data to train)
- Higher cost (ML API calls, model hosting)
- Longer development time (3-4 weeks vs 2 weeks)

**Why Not (for Phase 1):**
- **YAGNI**: Basic keyword matching sufficient for MVP
- No training data yet (need user imports first)
- Can add ML incrementally in Phase 2/3 after proving basic workflow
- Option 1's manual categorization provides training data for future ML

---

### Alternative 3: External Service Integration (Plaid Transactions)

**Description:** Instead of manual import, integrate with Plaid to pull transactions automatically via API.

**User Flow:**
1. User connects bank via Plaid
2. Transactions sync automatically daily
3. No file upload needed

**Pros:**
- Fully automated (no manual work)
- Always up-to-date (syncs daily)
- Industry-standard solution

**Cons:**
- Requires Plaid integration (more complex, different feature)
- Costs money (Plaid charges per institution connection)
- Doesn't solve historical data migration (Plaid only syncs last 2 years)
- Doesn't help with PDF-only statements (some banks don't support Plaid)

**Why Not (as replacement):**
- **Complementary, not alternative**: Manual import is bridge until Plaid integration is built
- Manual import still needed for:
  - Historical data (pre-Plaid)
  - Banks not supported by Plaid
  - Users who prefer manual control
  - Testing and demo data
- Plaid integration is separate feature (planned for later phase)

---

## Open Questions

### 1. Date Format Auto-Detection
**Question**: How should we handle ambiguous dates like "01/02/2026"?

**Options:**
- A) Default to user's locale (US = MM/DD, EU = DD/MM)
- B) Analyze all dates in file and infer format (if any day >12, must be DD/MM)
- C) Show preview with both formats and ask user to confirm
- D) Add date format selector in column mapping step

**Recommendation**: Start with Option A (locale default) + Option B (auto-infer). If ambiguous, fall back to Option D (ask user).

---

### 2. Categorization Confidence Threshold
**Question**: What confidence score threshold should require user review?

**Options:**
- A) <50% confidence = uncategorized (user must assign)
- B) <80% confidence = needs review (user should verify)
- C) <95% confidence = needs review (very conservative)
- D) Let user configure threshold in settings

**Recommendation**: Start with Option B (80% threshold). Too conservative (Option C) creates unnecessary work. Too loose (Option A) risks miscategorizations.

---

### 3. Duplicate Detection Sensitivity
**Question**: How strict should duplicate detection be?

**Options:**
- A) Exact match only (date + amount + description exact)
- B) Fuzzy match (date + amount + 80% similar description)
- C) Loose match (date within 1 day + amount within $0.50 + any description match)
- D) Configurable sensitivity (user chooses strict/moderate/loose)

**Recommendation**: Start with Option B (fuzzy match). Exact match (A) misses duplicates with minor description differences. Loose match (C) has too many false positives.

---

### 4. Background Processing Threshold
**Question**: How many transactions should trigger background processing?

**Options:**
- A) Always synchronous (user waits for import to complete)
- B) Background if >100 transactions
- C) Background if >50 transactions
- D) Always background (better UX, user gets notification)

**Recommendation**: Start with Option B (100 transaction threshold). Small imports (<100) finish quickly enough for synchronous. Large imports benefit from background processing + notification.

---

### 5. PDF Parsing Strategy
**Question**: How should we handle PDF bank statements?

**Options:**
- A) Text extraction only (pdf.js) - works for digital PDFs, fails for scanned PDFs
- B) OCR for scanned PDFs (Tesseract.js) - handles images, slower, less accurate
- C) External service (AWS Textract, Google Vision) - best accuracy, costs money
- D) Start with Option A, add B/C later if users need it

**Recommendation**: Option D. Most banks provide digital PDFs (extractable text). If users need scanned PDF support, add OCR in Phase 2.

---

### 6. Import Undo Period
**Question**: How long should users be able to undo an import?

**Options:**
- A) 1 hour (immediate mistakes only)
- B) 24 hours (until next day)
- C) 7 days (one week)
- D) Unlimited (always allow undo)

**Recommendation**: Start with Option B (24 hours). Balances flexibility (catch mistakes) with data integrity (don't allow undoing after reconciliation).

---

### 7. Bulk Upload Limit
**Question**: How many files can user upload at once?

**Options:**
- A) 1 file only (simplest UX)
- B) 5 files max (reasonable for monthly statements)
- C) 10 files max (supports accountants with multiple clients)
- D) Unlimited (let browser handle)

**Recommendation**: Start with Option C (10 files). Supports accountant use case without overwhelming system. Can increase later if needed.

---

### 8. Category Suggestions Display
**Question**: How should we show auto-categorization suggestions?

**Options:**
- A) Auto-apply (don't show suggestions, just categorize)
- B) Inline badge (show suggested category in table with accept/reject)
- C) Sidebar panel (click transaction to see suggestions with confidence scores)
- D) Tooltip on hover (hover to see suggestion details)

**Recommendation**: Combination of B + D. Inline badge for quick acceptance, tooltip for details. Option A removes control (user can't override). Option C requires too many clicks.

---

### 9. Account Balance Update
**Question**: Should import update account balance automatically?

**Options:**
- A) Yes, always update balance to match file's ending balance
- B) No, balance is read-only (updated by manual adjustment or reconciliation)
- C) Ask user: "Update account balance to $X?"
- D) Calculate balance from transactions (don't trust file's balance)

**Recommendation**: Option D. Calculate balance from transactions (sum of all transactions + starting balance). File's balance is for verification only. If mismatch, show warning but don't auto-adjust.

---

## Next Steps

### Immediate Actions

1. **User Validation** (Optional but recommended):
   - Show mockup/prototype to 2-3 target users
   - Validate workflow (upload → map → preview → import)
   - Confirm UI makes sense (especially column mapping)
   - Test with real bank statement files (CSV, PDF)
   - Expected time: 2-3 days

2. **Technical Spike** (Recommended):
   - Prototype PDF parsing with pdf.js (test with real bank PDF)
   - Prototype CSV parsing with papaparse (test edge cases)
   - Test categorization keyword matching (build small keyword dictionary)
   - Measure parsing time for large files (10K+ transactions)
   - Expected time: 1-2 days

3. **Create Detailed Plan**:
   - Run `/workflows:plan bank-statement-import`
   - Break down into tasks (backend parsing, frontend wizard, testing)
   - Estimate timeline (likely 2-3 weeks for Phase 1 MVP)

### Decision Checkpoint

After prototyping and user validation (if applicable), choose:

- **Path A (Recommended)**: Proceed with Option 1 (Staged Import with Preview) as described
- **Path B**: Modify approach based on feedback/prototype learnings
- **Path C**: Start with simpler MVP (CSV only, no column mapping) and iterate

### Success Metrics (Post-Launch)

**Quantitative:**
- 80%+ of users import at least one file within first week
- Average import time <30 seconds for files <1000 transactions
- <5% import failure rate (parsing errors)
- 70%+ of transactions auto-categorized successfully (>80% confidence)
- <10% duplicate detection false positives

**Qualitative:**
- User feedback: "Easy to use", "Saved me hours of manual entry"
- Reduced support tickets: "How do I add transactions?"
- Users share screenshots: "Just imported 2 years of transactions into Akount!"

---

## Phased Implementation Plan

### Phase 1: MVP (2-3 weeks)
**Goal**: Basic import workflow with CSV and PDF support

**Features:**
- [ ] File upload UI (drag-and-drop, file picker)
- [ ] CSV parsing (papaparse)
- [ ] PDF parsing (pdf.js text extraction)
- [ ] Column mapping UI (for CSV)
- [ ] Preview table (with edit capabilities)
- [ ] Keyword-based auto-categorization (100 common keywords)
- [ ] Duplicate detection (fuzzy matching)
- [ ] Import creates transactions (links to ImportBatch)
- [ ] Import history page

**Success Criteria:**
- User can upload CSV and see transactions
- User can upload PDF and see transactions
- Duplicate detection catches obvious duplicates
- Basic categorization works (50%+ accuracy)
- Import completes successfully

---

### Phase 2: Enhancement (1-2 weeks)
**Goal**: Better UX and additional formats

**Features:**
- [ ] OFX/QFX support (Quicken/QuickBooks format)
- [ ] XLSX support (Excel files)
- [ ] Smart column detection (auto-map common formats)
- [ ] Bulk operations (select multiple, bulk categorize)
- [ ] Advanced duplicate settings (adjust sensitivity)
- [ ] Background processing for large imports (>100 transactions)
- [ ] Import notifications (toast + email when complete)
- [ ] Undo import (soft delete + restore within 24 hours)

**Success Criteria:**
- All 4 formats supported (CSV, PDF, OFX, XLSX)
- Background processing works (no timeouts on large imports)
- Users can undo mistakes easily

---

### Phase 3: Intelligence (2-3 weeks)
**Goal**: ML-powered categorization and merchant recognition

**Features:**
- [ ] ML categorization model (train on user's data)
- [ ] Merchant name normalization ("AMZN*Mktplace" → "Amazon")
- [ ] Transfer detection (between owned accounts)
- [ ] Spending anomaly detection (flag unusual transactions)
- [ ] Category learning (improve from user corrections)
- [ ] Confidence scoring (show why category was suggested)
- [ ] Smart suggestions sidebar (show similar transactions)

**Success Criteria:**
- Categorization accuracy >80% (vs 50% in Phase 1)
- Transfer detection catches 90%+ of transfers
- Users see value in AI suggestions (engagement metrics)

---

### Phase 4: Advanced Features (Future)
**Goal**: Power user and accountant tools

**Features:**
- [ ] Batch import (multiple files, multiple accounts)
- [ ] Import templates (save column mappings for reuse)
- [ ] Scheduled imports (recurring imports from email attachments)
- [ ] Import from cloud storage (Dropbox, Google Drive)
- [ ] API for programmatic imports
- [ ] Advanced reconciliation (match imported to existing transactions)
- [ ] Import audit trail (detailed logs for accountants)

---

## Conclusion

The **Staged Import with Preview** approach (Option 1) is the recommended starting point because it:

1. ✅ **Balances control and convenience**: Users see what will be imported before committing
2. ✅ **Maintains financial accuracy**: Review step catches errors before data corruption
3. ✅ **Educates users**: Transparent categorization builds trust and understanding
4. ✅ **Scales for both personas**: Simple for solo entrepreneurs, thorough for accountants
5. ✅ **Provides foundation for ML**: Manual categorization creates training data for Phase 3

**Next Action**: Create detailed implementation plan → `/workflows:plan bank-statement-import`

---

**Document Owner**: Claude Code
**Last Updated**: 2026-01-30
**Status**: Ready for planning phase
