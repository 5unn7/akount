# Database Schema Design Validation

**Last Updated:** 2026-01-27
**Purpose:** Validate that Prisma schema supports all required features for multi-tenant, multi-entity, multi-currency accounting.

**IMPORTANT:** This checklist reflects SCHEMA DESIGN STATUS, not implementation status.
**For actual implementation progress, see [STATUS.md](/STATUS.md) and [TASKS.md](/TASKS.md)**

---

## 1. Data Model & Schema Foundation

### Entity & Tenancy Layer

- [x] **Tenant Model**: Schema defined with lifecycle states (trial, active, past-due, read-only, closed) ✅ **SCHEMA COMPLETE**
  - [x] Billing integration hooks
  - [x] Region/data-residency field
  - [x] Per-tenant configuration object (JSON or structured tables)
  - [x] Feature flags and tier limits
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Entity Graph**: Schema defined for entity relationships ✅ **SCHEMA COMPLETE**
  - [x] Entity type (Corporation, LLC, Partnership, Solo, Holdco, SPV)
  - [x] Jurisdiction and registration information
  - [x] Parent/child relationships and ownership percentages
  - [x] Entity status and lifecycle tracking
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Entity Scoping**: All transactional models linked to Entity in schema ✅ **SCHEMA COMPLETE**
  - [x] Tenant ownership
  - [x] Entity ownership
  - [x] Cross-entity filtering and visibility controls
  - [x] Permissions scoped by entity
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

### Multi-Currency & FX Layer

- [x] **Currency Handling**: Schema supports multi-currency ✅ **SCHEMA COMPLETE**
  - [x] Amount in source currency
  - [x] Amount in local entity currency (functional currency)
  - [x] Amount in reporting/group currency
  - [x] FX rate used, source, and date
  - [x] FX rate type (spot, monthly average, period-end)
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **FX Rate Management**: FX rate tables defined ✅ **SCHEMA COMPLETE**
  - [x] Historical rate tracking by date/source/pair
  - [x] Versioned rates (allow corrections) - via effective dates
  - [x] Default rate sources per entity - via AccountingPolicy
  - [x] Manual override capability with audit trail - via fxRateSource field
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

### Chart of Accounts & Policies

- [x] **Master COA Templates**: Schema supports COA templates ⚠️ **SCHEMA PARTIAL**
  - [ ] Template versioning - *Schema pattern needs refinement*
  - [x] Entity-level COA inheritance and minimal override
  - [x] Account mapping between entity COA and group COA (for consolidation)
  - [x] GL Account hierarchy and relationships
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Accounting Policies Table**: Schema defined for policies ✅ **SCHEMA COMPLETE**
  - [x] Revenue recognition method per entity/group
  - [x] Depreciation methods and useful lives
  - [x] Capitalization thresholds
  - [x] Consolidation method (full, equity, proportionate)
  - [x] Keyed by group/jurisdiction
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Tax & Compliance Rules**: Tax tables in schema ✅ **SCHEMA COMPLETE**
  - [x] Tax code tables (GST/HST/VAT rates by jurisdiction and date)
  - [x] Withholding tax rules
  - [x] Transfer pricing policies (basic)
  - [x] Filing requirements and deadlines per jurisdiction
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

### Intercompany & Consolidation Ready

- [x] **Intercompany Transaction Layer**: Schema supports intercompany ✅ **SCHEMA COMPLETE**
  - [x] Intercompany relationship types (loan, equity contribution, service charge, dividend, etc.)
  - [x] Counterparty entity tracking on transactions
  - [x] Mirrored entries on both sides (via relatedJournalEntryId)
  - [x] Consolidation elimination rules
  - [x] Intercompany invoice and tracking
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Consolidation Elimination Rules**: Schema supports eliminations ✅ **SCHEMA COMPLETE**
  - [x] Elimination rules for revenue/expense, loans, investment vs equity
  - [x] Elimination method (automatic, manual, rule-based) - via EliminationRule
  - [x] Audit trail of eliminations applied - via AuditLog
  - [x] Multi-step consolidation support (sub-group then parent-level) - via entity hierarchy
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

### Audit & Control Foundation

- [x] **Universal Audit Log**: Schema defined ✅ **SCHEMA COMPLETE**
  - [x] Model type (entity, transaction, account, policy, etc.)
  - [x] Action (create, update, delete)
  - [x] Old/new values (full before/after)
  - [x] User ID, tenant ID, entity ID
  - [x] Timestamp with timezone
  - [x] Immutable once written
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Period Locking & Status**: Schema supports period controls ✅ **SCHEMA COMPLETE**
  - [x] Period lock state (open, in-review, locked)
  - [x] Soft locks with override capability
  - [x] Close checklist per entity (reconciliation, intercompany match, FX review, etc.)
  - [x] Approval workflows per period/entity - via WorkflowRequest
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

- [x] **Data Versioning**: Schema supports versioning ✅ **SCHEMA COMPLETE**
  - [x] Policy version history with effective dates - via AccountingPolicy
  - [x] COA template versions - *Implementation pattern defined*
  - [x] Rollback capability with audit logging - via AuditLog
  - [x] Comparison between versions - via effective dates
  - [ ] **IMPLEMENTATION**: Not started (see STATUS.md)

---

## 2. Integration & Data Pipeline

### Import & Feed Architecture

- [x] **Unified Import Layer**: Generic external feed model ✅ **SCHEMA COMPLETE**
  - [x] Source type (bank feed, CSV, API, other accounting system) - via ImportBatch
  - [x] External ID mapping (from source system)
  - [x] Raw payload storage (versioned)
  - [x] Import status and error handling
  - [x] Mapping configuration (field/account matching)

- [x] **Idempotency Framework**: Prevent duplicate posting ✅ **SCHEMA COMPLETE**
  - [x] Stable external IDs from source - via ImportBatch
  - [x] Idempotency key for all webhook/API operations - *Implementation pattern defined*
  - [x] Duplicate detection before posting
  - [x] Retry logic with exponential backoff - *Implementation pattern defined*

- [x] **Data Reconciliation**: Match and verify incoming data ⚠️ **SCHEMA PARTIAL**
  - [x] Reconciliation status per transaction - via TransactionMatch
  - [x] Reconciliation rules (amount, date, counterparty matching)
  - [ ] Variance tolerance settings - *Implementation needed*
  - [x] Auto-reconciliation vs manual workflows - defined in specs

- [x] **Manual Import Fallbacks**: Support when automated bank connections fail ✅ **SCHEMA COMPLETE**
  - [x] CSV import with template library (RBC, TD, Chase, etc.) - via ImportBatch + CSVImportMapping
  - [x] PDF bank statement upload with OCR extraction - via Attachment + PDFAttachment + PDFExtractedTransaction
  - [x] Manual transaction entry form (single and bulk entry modes) - via ImportBatch
  - [x] Field mapping and validation for CSV imports
  - [x] OCR confidence scoring and manual correction for PDF imports
  - [x] All imports tracked via ImportBatch for audit trail

### Event-Driven Backbone

- [x] **Domain Events**: Define and emit key domain events (even in monolithic phase) ✅ **SCHEMA COMPLETE**
  - [x] TransactionPosted
  - [x] EntityCreated / EntityUpdated
  - [x] FXRateUpdated / FXRateAdjusted
  - [x] PeriodClosed / PeriodLocked
  - [x] ConsolidationRun
  - [x] PolicyUpdated
  - [x] IntercompanyMatched / IntercompanyEliminated
  - [x] FileImported / ReconciliationCompleted

- [x] **Event Log Table**: Persistent event store ✅ **SCHEMA COMPLETE**
  - [x] Event type, aggregateId, aggregateType - via DomainEvent
  - [x] Payload (JSON)
  - [x] Timestamp, tenant, entity
  - [x] Processed status (for async handlers)
  - [x] Consumer tracking (which systems have handled this event)

- [ ] **Event Handlers & Subscriptions**: Hook for later expansions ⚠️ **IMPLEMENTATION NEEDED**
  - [ ] Analytics/reporting (fan-out to data warehouse) - *Phase 3*
  - [ ] Notifications (user alerts, digest emails) - *Phase 2*
  - [ ] Webhooks (external integrations) - *Phase 3*
  - [ ] Background jobs (reconciliation, consolidation, reporting) - *Phase 2*

### Bank & External Integrations

- [ ] **Bank Connection Model**: Structure for holding connection metadata
  - Provider (Plaid, Finicity, Flinks for Canada, etc.)
  - Connection status and last sync
  - Connected accounts (linked to Akount Accounts)
  - Sync history and error tracking
  - Refresh token management (secure)

- [ ] **Transaction Normalization**: Standardize incoming transactions
  - Normalize raw bank transaction fields
  - Category suggestion engine
  - Duplicate handling between sources
  - Memo/description enrichment

---

## 3. Security, Compliance & Access Control

### Authentication & Authorization

- [x] **Passkey Authentication (WebAuthn)**: Modern biometric authentication ✅ **SCHEMA COMPLETE**
  - [x] Platform authenticators (Face ID, Touch ID, Windows Hello, Android biometrics)
  - [x] Cross-platform support (Windows, Mac, iOS, Android, Linux)
  - [x] Multiple passkeys per user (device redundancy)
  - [x] Passkey management UI (add, rename, remove devices)
  - [x] Fallback to email magic link or traditional password
  - [x] Auto-sync via iCloud Keychain (Apple) and Google Password Manager (Android)
  - [x] Implementation via Clerk (built-in passkey support)
  - [ ] **Recovery Codes**: Generate backup codes for lost device recovery (Critical)

- [ ] **Multi-Factor Authentication (MFA)**
  - TOTP (time-based one-time password)
  - Email/SMS options
  - Backup codes
  - Recovery flows
  - Enforcement per tenant tier

- [ ] **Session & Device Management**
  - IP address history
  - Device fingerprinting (basic)
  - Session duration limits
  - "Remember this device" with secure cookie
  - Admin session review/revocation

- [ ] **Role-Based Access Control (RBAC)**
  - Roles: Owner, Admin, Accountant, Auditor, Viewer
  - Roles scoped to tenant level and entity level
  - Permission granularity (view, create, edit, delete per model)
  - Custom role support (future)

- [ ] **External Advisor Access**
  - Separate identity for external accountants/CFOs
  - Multi-client practice view (scoped to clients they serve)
  - Time-limited access tokens
  - Audit trail of advisor actions
  - Client confidentiality controls

### Data Security

- [ ] **Encryption at Rest**
  - Database encryption (native DB feature or column-level)
  - Key management (KMS, AWS KMS, etc.)
  - Encrypted backup strategy

- [ ] **Encryption in Transit**
  - TLS 1.2+ for all communications
  - Certificate management and rotation
  - HSTS headers

- [ ] **Secrets Management**
  - No hardcoded API keys, DB passwords, FX rate secrets
  - Use external secret vault (HashiCorp Vault, AWS Secrets Manager, etc.)
  - Rotation policies
  - Access logging for secret retrieval

- [ ] **PII & Sensitive Data Handling**
  - Identification of PII fields (SSN, passport, bank account numbers, etc.)
  - Masking/redaction in logs and errors
  - Data retention/deletion policies per jurisdiction
  - Audit trail of PII access

### Compliance & Regulatory

- [ ] **Data Residency**: Support region-specific storage
  - [ ] **[Legal Check]**: Verify EU/US Privacy Shield status before delaying this to Phase 4.
  - Region field on tenant and entities
  - Routing logic to keep data in specified regions
  - Ready for GDPR, PIPEDA, local data sovereignty

- [ ] **Financial Audit Trail Requirements**
  - Non-repudiation (who did what, when)
  - Immutable transactions once posted
  - Supporting documentation attachment capability
  - Compliance audit report generation

- [ ] **Regulatory Reporting Hooks**
  - Structure for filing requirement definitions per jurisdiction
  - Reporting schedule templates (quarterly, annual)
  - Data preparation for standard forms (T1 General, corporate tax return, GST/HST returns, etc.)
  - Export formats for tax software integration

---

## 4. Observability & Monitoring

### Structured Logging

- [ ] **Centralized Logging Infrastructure**
  - All logs include: timestamp, log level, service, request ID, tenant ID, entity ID, user ID
  - Structured JSON format (not free-form text)
  - Log aggregation (ELK, Datadog, CloudWatch, etc.)
  - Log retention policy

- [ ] **Request Tracing**
  - Unique request IDs propagated across all logs
  - Distributed tracing headers (if moving to microservices later)
  - Timing information per operation
  - Error/exception capture with full stack traces

### Metrics & Dashboards

- [ ] **Application Metrics**
  - Key SLI metrics: API latency (p50, p95, p99), error rates, throughput
  - Business metrics: transactions per hour, consolidations run, active tenants, entities
  - Resource metrics: DB query times, memory usage, API rate limit usage

- [ ] **Per-Tenant Metrics**
  - Usage meters: transactions/month, active entities, users, bank connections
  - Performance: slow queries, sync failures, calculation times
  - Health: import success rates, reconciliation completion rate

- [ ] **Dashboard & Alerting**
  - Internal ops dashboard (system health)
  - Per-tenant health dashboard (for support triage)
  - Alerts on error rate spikes, failed imports, slow queries, quota breaches

### Monitoring & Health Checks

- [ ] **Health Check Endpoints**
  - Liveness (is the app running?)
  - Readiness (is it ready to accept requests?)
  - Dependency checks (DB, cache, external APIs)
  - Per-service health (if moving to services)

- [ ] **External Dependency Monitoring**
  - Bank API availability and latency
  - FX rate data source health
  - Email delivery status
  - Payment processing (Stripe, etc.)

---

## 5. Workflows, Approvals & Controls

### Generic Workflow Engine

- [ ] **Workflow Primitives**
  - Request (object, action, context, status)
  - Step (sequential or parallel workflow steps)
  - Approver (user, role, or group)
  - Status tracking and history
  - Optional: SLA/deadline tracking

- [ ] **Workflow Types (Configured as Data)**
  - Intercompany charge approval (above threshold)
  - Entity-level spend approval
  - Period close sign-off
  - User/role access requests
  - Policy change reviews

### Period Close & Reconciliation

- [ ] **Close Checklist Model**
  - Per-entity close task template
  - Tasks: lock period, reconcile bank accounts, match intercompany, review FX, approve consolidation, etc.
  - Completion tracking and timestamps
  - Comments/notes per task
  - Sign-off tracking (who approved the close)

- [ ] **Bank Reconciliation Engine**
  - Outstanding items (cleared vs uncleared)
  - Reconciliation status per account/period
  - Variance detection and alerts
  - Auto-matching logic
  - Manual match interface

- [ ] **Intercompany Reconciliation**
  - Match invoice/charge from payor to payee
  - Variance tolerance (small rounding differences)
  - Status tracking (matched, unmatched, exception)
  - Exception workflow to resolve

---

## 6. Productization & Billing

### Tenant Tier & Limits

- [ ] **Pricing Tier Model**
  - Tier definition (Starter, Pro, Enterprise, Custom)
  - Feature access per tier (multi-entity on/off, consolidation, tax modules, etc.)
  - Hard limits (entities, users, transactions/month, storage)
  - Soft limits with overage pricing
  - Free trial configuration

- [ ] **Feature Flags**
  - Per-tenant feature toggle
  - Gradual rollout support (% of tenants, by region, by created-at date, etc.)
  - Kill switch for rapid rollback
  - Admin UI to enable/disable per tenant

- [ ] **Usage Meter & Quota**
  - Meter definition: transactions, entities, FX conversions, storage
  - Daily/monthly aggregation
  - Quota enforcement (reject or bill on overage)
  - Hard-stop thresholds for trial/free accounts

### Billing Integration

- [ ] **Billing Entity Model**
  - Subscription: tenant → tier → price
  - Billing period (monthly, annual)
  - Overages and their pricing
  - Invoice generation
  - Payment method and status tracking

- [ ] **Usage-Based Pricing Ready**
  - Meter data flowing to billing system
  - Flexible pricing formula (base + usage × rate)
  - Invoice itemization by meter type
  - Test/production billing separation

---

## 7. Cross-Border & Tax-Specific Features (Foundation Only)

These are foundational hooks; actual tax logic comes later, but the architecture should support them.

### Tax & Jurisdiction Hooks

- [ ] **Jurisdiction Master Data**
  - Entity jurisdiction field
  - Tax authority (CRA for Canada, IRS for US, etc.)
  - Filing requirements and deadlines
  - Tax identifier field (BN for Canada, EIN for US, etc.)
  - Currency and accounting standard

- [ ] **Tax Rule Configuration**
  - GST/HST/VAT rates by jurisdiction and effective date
  - Withholding tax rules (if applicable)
  - Capitalization thresholds
  - Depreciation method per asset class
  - Transfer pricing method (if multi-entity)

- [ ] **Reporting & Filing**
  - Tax period definition (calendar year, fiscal year)
  - Required tax forms per jurisdiction (T1 General, T2 Corporation, GST/HST, etc.)
  - Data mapping to standard tax forms (not actual filing, just structure)
  - Export formats for accountant software

### Multi-Currency & FX Consolidation Hooks

- [ ] **Consolidation FX Method**
  - Choose and document: temporal method (asset/liability distinction) vs. current rate method (all items at period-end rate)
  - Unrealized FX gain/loss tracking
  - Stored in accounting policy table keyed by group/jurisdiction

- [ ] **Consolidated Reporting**
  - FX revaluation reserve (captured on consolidation)
  - Translation adjustments (OCI if applicable)
  - Inter-company eliminations in multiple currencies
  - Per-entity P&L and BS in local currency
  - Consolidated P&L and BS in reporting currency

---

## References

- [decisions.md](./decisions.md) - Technology stack and rationale
- [processes.md](./processes.md) - Development processes
- [operations.md](./operations.md) - Operational procedures
- [ROADMAP.md](/ROADMAP.md) - Implementation phases
- [STATUS.md](/STATUS.md) - Current implementation status
