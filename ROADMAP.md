# Akount - Development Roadmap

**Version:** 1.1
**Last Updated:** 2026-01-30
**Current Phase:** Phase 0 - Foundation (In Progress - 40% Complete)

---

## Overview

This roadmap outlines the path from current state (5% complete) to a production-ready MVP.

**Guiding Principles:**
- ✅ Complete one phase fully before starting the next
- ✅ Each phase should result in working, testable functionality
- ✅ Prioritize getting data flowing through the stack
- ✅ Build vertical slices (API → DB → UI)

---

## Phase 0: Foundation (CURRENT)

**Goal:** Get authentication, database, and API foundation working

**Duration:** 1-2 weeks (full-time) or 2-4 weeks (part-time)

**Success Criteria:**
- ✅ Users can sign up and log in with passkeys
- ✅ Database is connected and operational
- ✅ API can query and return data
- ✅ One complete vertical slice working (e.g., list entities)

### Tasks

#### 0.1 Authentication (Priority: CRITICAL) ✅ COMPLETE
- [x] Create Clerk account at clerk.com
- [x] Get API keys (publishable key + secret key)
- [x] Configure .env with Clerk keys
- [x] Install @clerk/nextjs middleware
- [x] Create /sign-in and /sign-up pages
- [x] Add ClerkProvider to root layout
- [x] Test sign-up flow with passkey
- [x] Test sign-in flow with passkey
- [x] Add "Sign Out" button to UserMenu

**Deliverable:** ✅ Users can create accounts and log in
**Completed:** 2026-01-30

---

#### 0.2 Database Setup (Priority: CRITICAL) ✅ COMPLETE
- [x] Choose database host (Railway free tier recommended)
- [x] Create PostgreSQL database instance
- [x] Get connection string
- [x] Update DATABASE_URL in .env
- [x] Run `npx prisma migrate dev --name init` in packages/db
- [x] Create seed script with sample data
- [x] Run seed script
- [x] Verify data in Prisma Studio (`npx prisma studio`)

**Deliverable:** ✅ Database is operational with test data
**Completed:** 2026-01-30

---

#### 0.3 API Foundation (Priority: CRITICAL)
- [ ] Set up Prisma Client in apps/api
- [ ] Add Clerk JWT verification middleware
- [ ] Add Zod validation middleware
- [ ] Add error handling middleware (try/catch wrapper)
- [ ] Create /api/health endpoint with DB check
- [ ] Test authentication with Postman/Thunder Client

**Deliverable:** API can authenticate requests and query database

---

#### 0.4 First Vertical Slice (Priority: HIGH)
- [ ] API: Create GET /api/entities endpoint
- [ ] API: Filter entities by authenticated user's tenant
- [ ] API: Return entities with proper types
- [ ] Web: Create useAuth hook to get current user
- [ ] Web: Create API client utility
- [ ] Web: Fetch entities in dashboard page
- [ ] Web: Display entities in UI (replace mock data)
- [ ] Test: Create entity via seed, verify it shows in UI

**Deliverable:** Real data flows from database → API → frontend

---

#### 0.5 Types & Validation (Priority: HIGH)
- [ ] Define Zod schemas in packages/types
  - EntitySchema
  - AccountSchema
  - TransactionSchema
  - UserSchema
- [ ] Export TypeScript types from Zod
- [ ] Import schemas in API for validation
- [ ] Import types in web for type safety
- [ ] Test validation with invalid data

**Deliverable:** End-to-end type safety with runtime validation

---

**Phase 0 Exit Criteria:**
- [x] User can sign up, log in, and log out
- [x] Database has migrations and seed data
- [ ] API has working authentication
- [ ] At least one API endpoint returns real data
- [ ] Frontend displays real data (not mocks)
- [ ] Types are shared between web and API

**Estimated Effort:** 20-30 hours

---

## Phase 1: Accounts Overview

**Goal:** Build the financial dashboard with multi-currency support

**Duration:** 1-2 weeks

**Success Criteria:**
- ✅ Users can view all their accounts (bank, credit card, investment)
- ✅ Multi-currency support (display in base or functional currency)
- ✅ Net worth calculation
- ✅ Cash position calculation
- ✅ Users can create/edit/delete accounts

### Tasks

#### 1.1 Account Management API
- [ ] POST /api/accounts - Create account
- [ ] GET /api/accounts - List accounts (with filtering)
- [ ] GET /api/accounts/:id - Get single account
- [ ] PATCH /api/accounts/:id - Update account
- [ ] DELETE /api/accounts/:id - Delete account
- [ ] Add tenant/entity scoping to all queries
- [ ] Add Zod validation for all endpoints

#### 1.2 Multi-Currency API
- [ ] GET /api/currencies - List supported currencies
- [ ] GET /api/fx-rates - Get current FX rates
- [ ] POST /api/fx-rates - Manually add FX rate
- [ ] Create utility function for currency conversion
- [ ] Add caching for FX rates (Redis or in-memory)

#### 1.3 Dashboard Summary API
- [ ] GET /api/accounts/summary - Calculate net worth
- [ ] Calculate cash position
- [ ] Calculate total assets by type
- [ ] Calculate total liabilities
- [ ] Support entity filtering
- [ ] Support currency toggle (base vs functional)

#### 1.4 Frontend - Account Management
- [ ] Create AccountsList component (real data)
- [ ] Create AccountRow component
- [ ] Create "Add Account" dialog/modal
- [ ] Create "Edit Account" dialog
- [ ] Add delete confirmation
- [ ] Add empty state (no accounts)
- [ ] Add loading states
- [ ] Add error handling

#### 1.5 Frontend - Dashboard
- [ ] Build NetWorthCard with real data
- [ ] Build CashPositionCard with real data
- [ ] Build AccountsOverview with filters
- [ ] Add entity filter dropdown
- [ ] Add currency toggle (base/functional/reporting)
- [ ] Add date range filter (optional)
- [ ] Make dashboard responsive (mobile)

#### 1.6 Testing
- [ ] Write API integration tests for accounts endpoints
- [ ] Write frontend component tests
- [ ] Write E2E test: Create account → See it in dashboard
- [ ] Test multi-currency display
- [ ] Test entity filtering

**Phase 1 Exit Criteria:**
- [ ] All account CRUD operations work
- [ ] Dashboard shows real account data
- [ ] Multi-currency toggle works
- [ ] Entity filtering works
- [ ] Mobile responsive
- [ ] Tests pass

**Estimated Effort:** 30-40 hours

---

## Phase 2: Bank Reconciliation

**Goal:** Connect bank accounts and match transactions

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Users can import bank transactions (CSV or manual)
- ✅ System suggests matches for transactions
- ✅ Users can manually match/unmatch transactions
- ✅ Reconciliation status is tracked

### Tasks

#### 2.1 Import Infrastructure
- [ ] POST /api/imports/csv - Upload CSV file
- [ ] Parse CSV with configurable mapping
- [ ] Store in ImportBatch + BankFeedTransaction
- [ ] Deduplicate transactions (idempotency)
- [ ] GET /api/imports - List import batches
- [ ] GET /api/imports/:id - Get import details

#### 2.2 Transaction Matching API
- [ ] GET /api/bank-feeds - List bank feed transactions
- [ ] GET /api/transactions - List posted transactions
- [ ] POST /api/matches - Match bank feed to transaction
- [ ] DELETE /api/matches/:id - Unmatch
- [ ] POST /api/matches/auto - Auto-match suggestions
- [ ] Matching algorithm (amount + date + description)

#### 2.3 Frontend - Import Flow
- [ ] Create CSV upload component
- [ ] Create column mapping interface
- [ ] Create preview table
- [ ] Show import progress
- [ ] Show import results (success/errors)

#### 2.4 Frontend - Reconciliation
- [ ] Create FeedTransactionTable component
- [ ] Create TransactionMatchRow component
- [ ] Show suggested matches
- [ ] Add "Match" / "Unmatch" buttons
- [ ] Add bulk actions (match multiple)
- [ ] Add filters (matched/unmatched/all)
- [ ] Show reconciliation status card

#### 2.5 Testing
- [ ] Test CSV import with various formats
- [ ] Test duplicate detection
- [ ] Test matching algorithm accuracy
- [ ] Test bulk operations
- [ ] E2E: Import CSV → Match → Verify

**Phase 2 Exit Criteria:**
- [ ] CSV import works end-to-end
- [ ] Users can match transactions manually
- [ ] Auto-match suggestions are reasonable
- [ ] Reconciliation status is accurate
- [ ] Tests pass

**Estimated Effort:** 40-50 hours

---

## Phase 3: Transactions & Bookkeeping

**Goal:** Post transactions and maintain general ledger

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Users can manually post transactions
- ✅ Transactions create journal entries (double-entry)
- ✅ Chart of accounts is manageable
- ✅ Transaction list with filtering

### Tasks

#### 3.1 Chart of Accounts API
- [ ] POST /api/gl-accounts - Create GL account
- [ ] GET /api/gl-accounts - List with hierarchy
- [ ] PATCH /api/gl-accounts/:id - Update
- [ ] DELETE /api/gl-accounts/:id - Delete (if unused)
- [ ] Seed default COA per entity type

#### 3.2 Transaction Posting API
- [ ] POST /api/transactions - Create transaction
- [ ] Validate double-entry (debits = credits)
- [ ] Auto-create journal entries
- [ ] Support multi-currency
- [ ] Support splits
- [ ] GET /api/transactions - List with filters
- [ ] GET /api/transactions/:id - Get detail

#### 3.3 Journal Entry API
- [ ] GET /api/journal-entries - List entries
- [ ] GET /api/journal-entries/:id - Get with lines
- [ ] Support date range filtering
- [ ] Support account filtering
- [ ] Support entity filtering

#### 3.4 Frontend - COA Management
- [ ] Create ChartOfAccounts component
- [ ] Show account hierarchy (tree view)
- [ ] Add/edit/delete accounts
- [ ] Show account balances
- [ ] Add account type badges

#### 3.5 Frontend - Transaction Entry
- [ ] Create TransactionForm component
- [ ] Support split transactions
- [ ] Support multi-currency entry
- [ ] Auto-calculate journal entries (preview)
- [ ] Create TransactionList component
- [ ] Add filtering (date, account, entity)

#### 3.6 Testing
- [ ] Test double-entry validation
- [ ] Test multi-currency posting
- [ ] Test split transactions
- [ ] Test journal entry generation
- [ ] E2E: Post transaction → Verify GL balance

**Phase 3 Exit Criteria:**
- [ ] Users can post transactions manually
- [ ] Double-entry bookkeeping works
- [ ] Chart of accounts is functional
- [ ] Transaction list and filters work
- [ ] Tests pass

**Estimated Effort:** 40-50 hours

---

## Phase 4: Invoicing & Bills

**Goal:** Manage accounts receivable and payable

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Users can create and send invoices
- ✅ Users can track bills from vendors
- ✅ Payment tracking and allocation
- ✅ Aging reports (AR/AP)

### Tasks

#### 4.1 Client/Vendor Management
- [ ] POST /api/clients - Create client
- [ ] GET /api/clients - List clients
- [ ] POST /api/vendors - Create vendor
- [ ] GET /api/vendors - List vendors
- [ ] CRUD operations for both

#### 4.2 Invoice API
- [ ] POST /api/invoices - Create invoice
- [ ] GET /api/invoices - List invoices
- [ ] PATCH /api/invoices/:id - Update
- [ ] POST /api/invoices/:id/send - Send via email
- [ ] Support line items with tax
- [ ] Calculate totals
- [ ] Track payment status

#### 4.3 Bill API
- [ ] POST /api/bills - Create bill
- [ ] GET /api/bills - List bills
- [ ] PATCH /api/bills/:id - Update
- [ ] Track payment status

#### 4.4 Payment API
- [ ] POST /api/payments - Record payment
- [ ] Allocate payment to invoices/bills
- [ ] Support partial payments
- [ ] Update invoice/bill status

#### 4.5 Frontend - Invoicing
- [ ] Create InvoiceForm component
- [ ] Create InvoiceList component
- [ ] Create invoice detail view
- [ ] Add email preview/send
- [ ] Add PDF generation

#### 4.6 Frontend - Bills
- [ ] Create BillForm component
- [ ] Create BillList component
- [ ] Add bill detail view
- [ ] Add payment recording

#### 4.7 Reports
- [ ] AR aging report
- [ ] AP aging report
- [ ] Outstanding invoices list
- [ ] Outstanding bills list

**Phase 4 Exit Criteria:**
- [ ] Invoice creation and sending works
- [ ] Bill tracking works
- [ ] Payment allocation works
- [ ] Aging reports are accurate
- [ ] Tests pass

**Estimated Effort:** 40-50 hours

---

## Phase 5: Financial Analytics

**Goal:** Generate financial reports (P&L, Balance Sheet, Cash Flow)

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Generate P&L by entity
- ✅ Generate balance sheet
- ✅ Generate cash flow statement
- ✅ Support date ranges and comparisons
- ✅ Export to PDF/CSV

### Tasks

#### 5.1 Reporting Engine
- [ ] Build P&L calculation service
- [ ] Build balance sheet calculation service
- [ ] Build cash flow calculation service
- [ ] Support entity filtering
- [ ] Support date range
- [ ] Support period comparison

#### 5.2 Report API
- [ ] GET /api/reports/pl - P&L report
- [ ] GET /api/reports/balance-sheet
- [ ] GET /api/reports/cash-flow
- [ ] GET /api/reports/:id/export (PDF/CSV)
- [ ] Cache report results

#### 5.3 Frontend - Reports
- [ ] Create PLView component
- [ ] Create BalanceSheetView component
- [ ] Create CashFlowView component
- [ ] Add date range picker
- [ ] Add entity filter
- [ ] Add export buttons
- [ ] Add charts/visualizations (Recharts)

#### 5.4 Testing
- [ ] Test P&L accuracy with known data
- [ ] Test balance sheet balances
- [ ] Test cash flow calculations
- [ ] Test multi-entity reports
- [ ] E2E: Post transactions → Generate report

**Phase 5 Exit Criteria:**
- [ ] All three financial statements generate correctly
- [ ] Reports can be filtered and compared
- [ ] Export works (PDF/CSV)
- [ ] Tests pass

**Estimated Effort:** 35-45 hours

---

## Phase 6: Budgets & Goals (Optional for MVP)

**Goal:** Help users plan and track financial goals

**Duration:** 1-2 weeks

**Success Criteria:**
- ✅ Users can create budgets by category
- ✅ Budget vs actual tracking
- ✅ Savings/debt goals with progress

### Tasks

#### 6.1 Budget API
- [ ] POST /api/budgets - Create budget
- [ ] GET /api/budgets - List budgets
- [ ] GET /api/budgets/:id/performance - Actual vs budget

#### 6.2 Goals API
- [ ] POST /api/goals - Create goal
- [ ] GET /api/goals - List goals
- [ ] GET /api/goals/:id/progress - Calculate progress

#### 6.3 Frontend
- [ ] Create BudgetsView component
- [ ] Create GoalsView component
- [ ] Show progress visualizations

**Phase 6 Exit Criteria:**
- [ ] Budget creation works
- [ ] Budget vs actual reporting works
- [ ] Goals tracking works

**Estimated Effort:** 20-30 hours

---

## Phase 7: AI Financial Advisor (Optional for MVP)

**Goal:** Provide AI-powered insights and auto-categorization

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Transactions auto-categorized with confidence scores
- ✅ AI generates financial insights
- ✅ Users can create rules from AI suggestions

### Tasks

#### 7.1 AI Infrastructure
- [ ] Choose AI provider (OpenAI/Anthropic/local)
- [ ] Set up API keys
- [ ] Create prompt templates
- [ ] Add rate limiting

#### 7.2 Categorization
- [ ] Analyze transaction descriptions with AI
- [ ] Return category suggestions with confidence
- [ ] Allow user feedback (correct/incorrect)
- [ ] Create rules from patterns

#### 7.3 Insights
- [ ] Analyze spending patterns
- [ ] Detect anomalies
- [ ] Generate cash flow predictions
- [ ] Suggest optimizations

#### 7.4 Frontend
- [ ] Create InsightsFeed component
- [ ] Create RulesView component
- [ ] Show categorization suggestions
- [ ] Add feedback mechanism

**Phase 7 Exit Criteria:**
- [ ] Auto-categorization works with >80% accuracy
- [ ] Insights are relevant and actionable
- [ ] Users can manage rules
- [ ] Tests pass

**Estimated Effort:** 30-40 hours

---

## Phase 8: Polish & Launch Prep

**Goal:** Production-ready application

**Duration:** 2-3 weeks

**Success Criteria:**
- ✅ Performance optimized
- ✅ Security hardened
- ✅ Tests comprehensive
- ✅ Documentation complete
- ✅ Monitoring in place

### Tasks

#### 8.1 Performance
- [ ] Add database indexes on hot paths
- [ ] Implement caching strategy (Redis)
- [ ] Optimize slow queries
- [ ] Add pagination to large lists
- [ ] Lazy load heavy components

#### 8.2 Security
- [ ] Complete security audit
- [ ] Add rate limiting per user
- [ ] Implement CSRF protection
- [ ] Add input sanitization
- [ ] Test for SQL injection
- [ ] Test for XSS vulnerabilities

#### 8.3 Testing
- [ ] Achieve 80%+ test coverage
- [ ] Write E2E tests for all user flows
- [ ] Load test with 100+ concurrent users
- [ ] Test error scenarios

#### 8.4 Monitoring
- [ ] Set up Sentry error tracking
- [ ] Add Vercel Analytics
- [ ] Set up uptime monitoring
- [ ] Create alerting rules
- [ ] Add performance monitoring

#### 8.5 Documentation
- [ ] Write user guides
- [ ] Write API documentation
- [ ] Create video tutorials
- [ ] Write deployment guide

#### 8.6 Deployment
- [ ] Set up production environment
- [ ] Configure CI/CD pipeline
- [ ] Set up database backups
- [ ] Test disaster recovery
- [ ] Create rollback procedure

**Phase 8 Exit Criteria:**
- [ ] Application is performant (<2s page loads)
- [ ] Security best practices implemented
- [ ] Test coverage >80%
- [ ] Monitoring and alerting operational
- [ ] Documentation complete
- [ ] Ready for users

**Estimated Effort:** 40-50 hours

---

## Total Timeline

| Phase | Duration | Effort (Hours) | Status |
|-------|----------|----------------|--------|
| 0: Foundation | 1-2 weeks | 20-30 | 🚧 In Progress (40% complete - Tasks 0.1 & 0.2 done) |
| 1: Accounts Overview | 1-2 weeks | 30-40 | ⏸️ Not Started |
| 2: Bank Reconciliation | 2-3 weeks | 40-50 | ⏸️ Not Started |
| 3: Transactions | 2-3 weeks | 40-50 | ⏸️ Not Started |
| 4: Invoicing & Bills | 2-3 weeks | 40-50 | ⏸️ Not Started |
| 5: Analytics | 2-3 weeks | 35-45 | ⏸️ Not Started |
| 6: Budgets & Goals | 1-2 weeks | 20-30 | 🔘 Optional |
| 7: AI Advisor | 2-3 weeks | 30-40 | 🔘 Optional |
| 8: Polish & Launch | 2-3 weeks | 40-50 | ⏸️ Not Started |

**Core MVP (Phases 0-5 + 8):** 16-24 weeks (4-6 months)
**Full Product (All Phases):** 20-30 weeks (5-7.5 months)

**Total Effort Estimate:** 265-355 hours for core MVP

---

## Success Metrics

### Phase 0 Success:
- [ ] Can sign up and log in (100% success rate)
- [ ] Can query database from API (no errors)
- [ ] Can see real data in UI (not mocks)

### MVP Success (End of Phase 5):
- [ ] Users can manage accounts
- [ ] Users can import and reconcile transactions
- [ ] Users can post transactions manually
- [ ] Users can generate financial reports
- [ ] All core features tested and documented

### Launch Success (End of Phase 8):
- [ ] 10+ beta users actively using product
- [ ] <5 bugs reported per week
- [ ] Performance targets met (p95 <2s)
- [ ] NPS score >40

---

## Risk Mitigation

**Risk:** Authentication complexity
- **Mitigation:** Use Clerk (managed service), start simple

**Risk:** Database schema changes breaking production
- **Mitigation:** Test migrations in staging first, have rollback plan

**Risk:** Scope creep
- **Mitigation:** Stick to roadmap, say no to features until MVP complete

**Risk:** Performance issues with large datasets
- **Mitigation:** Add pagination early, test with realistic data volumes

**Risk:** Security vulnerabilities
- **Mitigation:** Regular audits, use established libraries, follow OWASP guidelines

---

## Monthly Cost Estimate

**Development Phase:** $0-10/mo (free tiers)
**MVP with 10 users:** $50-100/mo
**Growth with 100 users:** $150-300/mo

See `planning/akount-engineering-roadmap.md` for detailed cost breakdown.

---

## Next Steps

1. **Review this roadmap** - Confirm phases and priorities align with vision
2. **Start Phase 0** - See TASKS.md for immediate next actions
3. **Update STATUS.md** - Mark tasks complete as you finish them
4. **Weekly review** - Check progress against roadmap every week

---

**Last Updated:** 2026-01-30
**Next Review:** 2026-02-06 (1 week from now)
