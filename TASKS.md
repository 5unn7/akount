# Akount - Task List

**Last Updated:** 2026-02-09
**Current Phase:** Phase 2 - Bank Reconciliation (Starting)
**Previous Phase:** Phase 1 - Accounts Overview (✅ COMPLETE)

---

## 📋 Product Management Tasks

### Phase 2: Bank Reconciliation - Requirements & Planning

- [ ] **PM-2.1:** Define CSV import flow and column mapping UX
  - Specify supported bank formats (at least 3 major Canadian banks)
  - Define error handling for malformed CSV files
  - Document required columns (date, description, amount, balance)
  - Define deduplication strategy (hash of date+amount+description?)

- [ ] **PM-2.2:** Design transaction matching algorithm rules
  - Exact match criteria (amount + date + description)
  - Fuzzy match rules (amount + date range ±3 days)
  - Manual match workflow (user confirms suggested matches)
  - Unmatch workflow (undo reconciliation)

- [ ] **PM-2.3:** Define reconciliation status states
  - Unmatched (bank transaction exists, no GL transaction)
  - Matched (bank transaction linked to GL transaction)
  - Manually Matched (user confirmed match)
  - Ignored (user marked as "don't match")

- [ ] **PM-2.4:** Cash flow forecasting requirements
  - Define projection periods (7/30/90 days)
  - Specify confidence levels (high/medium/low based on data quality)
  - Define assumptions to display (recurring transactions, average burn rate)
  - Identify when to show "low balance" warnings

- [ ] **PM-2.5:** Acceptance criteria for Phase 2
  - Users can upload CSV and see parsed transactions
  - System suggests matches with confidence scores
  - Users can confirm/reject/manually match transactions
  - Reconciliation status displays on accounts page
  - Cash flow forecast shows on dashboard

### Phase 1: Accounts Overview (✅ COMPLETE)

- [x] **PM-1.1:** Defined multi-currency display strategy (base/USD toggle)
- [x] **PM-1.2:** Defined account CRUD workflows (Sheet panel for create/edit)
- [x] **PM-1.3:** Specified dashboard KPI metrics (net worth, cash position, assets/liabilities)
- [x] **PM-1.4:** Documented entity filtering behavior (dropdown, default to all)
- [x] **PM-1.5:** Defined account type filtering (CHECKING, SAVINGS, CREDIT_CARD, etc.)

---

## 🎨 Frontend Tasks

### Phase 2: Bank Reconciliation - UI Implementation

- [ ] **FE-2.1:** CSV Upload Component
  - Create FileUploadZone with drag-and-drop
  - Add file validation (CSV only, max 10MB)
  - Show upload progress indicator
  - Display parse errors with line numbers

- [ ] **FE-2.2:** Column Mapping Interface
  - Create interactive table for mapping CSV columns → expected fields
  - Add dropdown for each column (Date, Description, Amount, Balance, Ignore)
  - Show preview of first 5 rows
  - Add "Auto-detect" button for common formats

- [ ] **FE-2.3:** Transaction Matching UI
  - Create BankFeedTransactionTable component
  - Show unmatched bank transactions with suggested GL matches
  - Add "Match" / "Unmatch" / "Ignore" action buttons
  - Display confidence score for suggestions (green/yellow/red)
  - Add bulk selection for multi-match

- [ ] **FE-2.4:** Reconciliation Status Display
  - Add "Reconciliation" tab to accounts detail page
  - Show matched/unmatched counts
  - Add filter: All / Matched / Unmatched / Ignored
  - Display reconciliation status badges on transaction rows

- [ ] **FE-2.5:** Cash Flow Forecast Widget
  - Create CashFlowForecastCard component for dashboard
  - Display 7/30/90 day projections with chart (Recharts)
  - Show confidence indicator (high/medium/low)
  - List assumptions used in forecast
  - Add "Low Balance Warning" alert if projection dips below threshold

- [ ] **FE-2.6:** Import History Page
  - Create /money-movement/imports page
  - List import batches with status (Processing, Complete, Failed)
  - Show import details (filename, date, row count, errors)
  - Add "Re-import" button for failed imports

### Phase 1: Accounts Overview (✅ COMPLETE)

- [x] **FE-1.1:** Dashboard integration (metrics, entity filter, currency toggle)
- [x] **FE-1.2:** Account list page with type filtering
- [x] **FE-1.3:** AccountFormSheet (create/edit/delete in Sheet panel)
- [x] **FE-1.4:** Account detail page with transaction history
- [x] **FE-1.5:** Running balance display in transactions table
- [x] **FE-1.6:** Loading states (loading.tsx), error boundaries (error.tsx), SEO metadata

---

## ⚙️ Backend Tasks

### Phase 2: Bank Reconciliation - API & Services

- [ ] **BE-2.1:** Import Infrastructure
  - POST /api/imports/csv - Upload and parse CSV file
  - Create ImportBatch model to track uploads
  - Create BankFeedTransaction model for parsed rows
  - Add CSV parsing service with configurable column mapping
  - Implement deduplication (hash of date+amount+description)

- [ ] **BE-2.2:** Import Batch Management
  - GET /api/imports - List import batches with pagination
  - GET /api/imports/:id - Get import details + transactions
  - DELETE /api/imports/:id - Delete import batch (soft delete)
  - Add status tracking (PROCESSING, COMPLETE, FAILED)

- [ ] **BE-2.3:** Transaction Matching Algorithm
  - Create MatchingService with auto-match logic
  - Implement exact match (amount + date + description)
  - Implement fuzzy match (amount + date ±3 days + partial description)
  - Calculate confidence score (0-100)
  - Return top 3 suggestions per unmatched transaction

- [ ] **BE-2.4:** Matching API Endpoints
  - GET /api/bank-feeds - List unmatched bank transactions
  - GET /api/bank-feeds/:id/suggestions - Get match suggestions
  - POST /api/matches - Manually match bank feed to GL transaction
  - DELETE /api/matches/:id - Unmatch transactions
  - POST /api/matches/auto - Auto-match high-confidence suggestions (>90%)

- [ ] **BE-2.5:** Reconciliation Status Tracking
  - Add `reconciliationStatus` field to Transaction model
  - Add `bankFeedTransactionId` foreign key to Transaction
  - Create ReconciliationService for status queries
  - GET /api/accounts/:id/reconciliation - Get reconciliation summary

- [ ] **BE-2.6:** Cash Flow Forecasting Service
  - Create ForecastingService with projection algorithm
  - POST /api/forecasting/cash-flow - Generate forecast
  - Calculate 7/30/90 day projections based on historical burn rate
  - Detect recurring patterns (monthly subscriptions, payroll)
  - Return confidence level (HIGH if >6 months data, MEDIUM if 3-6, LOW if <3)
  - Identify low balance warnings (balance < $500 projected)

- [ ] **BE-2.7:** Testing
  - Write unit tests for CSV parser (20+ test cases for edge cases)
  - Write unit tests for matching algorithm (10+ scenarios)
  - Write integration tests for import flow (upload → parse → match)
  - Write integration tests for forecasting (5+ data scenarios)
  - E2E test: Upload CSV → Auto-match → Verify reconciliation

### Phase 1: Accounts Overview (✅ COMPLETE)

- [x] **BE-1.1:** Account CRUD endpoints (POST/GET/PATCH/DELETE /api/banking/accounts)
- [x] **BE-1.2:** Dashboard metrics endpoint (GET /api/dashboard/metrics)
- [x] **BE-1.3:** Multi-currency support (base/USD conversion via FX rates)
- [x] **BE-1.4:** Cursor-based pagination for accounts list
- [x] **BE-1.5:** Running balance computation (GET /api/banking/accounts/:id/transactions)
- [x] **BE-1.6:** Soft delete implementation for accounts
- [x] **BE-1.7:** 62+ backend tests passing (services + routes)

---

## 🎯 Current Sprint (Week of 2026-02-09)

**Focus:** Phase 2 Planning & Initial Implementation

**This Week:**
1. PM: Define CSV import requirements (PM-2.1)
2. PM: Design matching algorithm rules (PM-2.2)
3. BE: Build CSV import infrastructure (BE-2.1)
4. BE: Create import batch management (BE-2.2)
5. FE: Build CSV upload component (FE-2.1)

**Next Week:**
1. BE: Implement matching algorithm (BE-2.3)
2. BE: Build matching API endpoints (BE-2.4)
3. FE: Build column mapping UI (FE-2.2)
4. FE: Build transaction matching UI (FE-2.3)

---

## 📊 Phase Progress

| Phase | PM Tasks | FE Tasks | BE Tasks | Status |
|-------|----------|----------|----------|--------|
| Phase 0: Foundation | 0/0 | 0/0 | 0/0 | ✅ 100% |
| Phase 1: Accounts | 5/5 | 6/6 | 7/7 | ✅ 100% |
| Phase 2: Reconciliation | 0/5 | 0/6 | 0/7 | 🚧 0% |

**Overall Progress:** Phase 1 Complete → Phase 2 Starting

---

## 🏆 Recent Accomplishments

### 2026-02-09 - Phase 1 Complete + 3 Quick Wins
- ✅ Running balance computation (backend + 8 tests)
- ✅ Account detail page with transaction history
- ✅ E2E test structure (Playwright, 8 test cases)

### 2026-02-08 - Phase 1 CRUD + Testing
- ✅ Account CRUD operations (POST/PATCH/DELETE)
- ✅ Account type filtering in UI
- ✅ 62 backend tests passing

### 2026-02-03 - Phase 1 Foundation
- ✅ Dashboard connected to API
- ✅ Entity filter + currency toggle
- ✅ Code review fixes (CR.1-CR.13)

---

## 📝 Notes

**Task Naming Convention:**
- PM-X.Y: Product Management (requirements, specs, acceptance criteria)
- FE-X.Y: Frontend (UI components, pages, client-side logic)
- BE-X.Y: Backend (API routes, services, database, tests)

**How to Use This File:**
1. Pick tasks from your discipline (PM/FE/BE)
2. Update checkboxes as you complete work
3. Move completed tasks to "Recent Accomplishments"
4. Update STATUS.md when milestones are reached

**Weekly Rhythm:**
- Monday: Review current sprint, pick tasks
- Friday: Update progress, plan next week
- End of Phase: Update ROADMAP.md and STATUS.md

---

**Next Update:** 2026-02-16 (Weekly review)