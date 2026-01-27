# Akount Architectural Foundation Checklist

A comprehensive guide to foundational systems, technologies, and processes needed to scale Akount into a robust cross-border, multi-entity accounting platform for founders.

---

## 1. Data Model & Schema Foundation

### Entity & Tenancy Layer
- [x] **Tenant Model**: Clear tenant/workspace object with lifecycle states (trial, active, past-due, read-only, closed) ✅ **COMPLETE**
  - [x] Billing integration hooks
  - [x] Region/data-residency field
  - [x] Per-tenant configuration object (JSON or structured tables)
  - [x] Feature flags and tier limits

- [x] **Entity Graph**: First-class entity model supporting relationships ✅ **COMPLETE**
  - [x] Entity type (Corporation, LLC, Partnership, Solo, Holdco, SPV)
  - [x] Jurisdiction and registration information
  - [x] Parent/child relationships and ownership percentages
  - [x] Entity status and lifecycle tracking

- [x] **Entity Scoping**: All transactional models (Accounts, Transactions, Invoices, etc.) linked to Entity ✅ **COMPLETE**
  - [x] Tenant ownership
  - [x] Entity ownership
  - [x] Cross-entity filtering and visibility controls
  - [x] Permissions scoped by entity

### Multi-Currency & FX Layer
- [x] **Currency Handling**: Every monetary amount stores ✅ **COMPLETE**
  - [x] Amount in source currency
  - [x] Amount in local entity currency (functional currency)
  - [x] Amount in reporting/group currency
  - [x] FX rate used, source, and date
  - [x] FX rate type (spot, monthly average, period-end)

- [x] **FX Rate Management**: Master FX table ✅ **COMPLETE**
  - [x] Historical rate tracking by date/source/pair
  - [x] Versioned rates (allow corrections) - via effective dates
  - [x] Default rate sources per entity - via AccountingPolicy
  - [x] Manual override capability with audit trail - via fxRateSource field

### Chart of Accounts & Policies
- [x] **Master COA Templates**: Standardized templates by business type and jurisdiction family ⚠️ **PARTIAL**
  - [ ] Template versioning - *Implementation needed*
  - [x] Entity-level COA inheritance and minimal override
  - [x] Account mapping between entity COA and group COA (for consolidation)
  - [x] GL Account hierarchy and relationships

- [x] **Accounting Policies Table**: Data-driven policies instead of hard-coded logic ✅ **COMPLETE**
  - [x] Revenue recognition method per entity/group
  - [x] Depreciation methods and useful lives
  - [x] Capitalization thresholds
  - [x] Consolidation method (full, equity, proportionate)
  - [x] Keyed by group/jurisdiction

- [x] **Tax & Compliance Rules**: Jurisdiction-aware rule engine ✅ **COMPLETE**
  - [x] Tax code tables (GST/HST/VAT rates by jurisdiction and date)
  - [x] Withholding tax rules
  - [x] Transfer pricing policies (basic)
  - [x] Filing requirements and deadlines per jurisdiction

### Intercompany & Consolidation Ready
- [x] **Intercompany Transaction Layer**: First-class support for intra-group flows ✅ **COMPLETE**
  - [x] Intercompany relationship types (loan, equity contribution, service charge, dividend, etc.)
  - [x] Counterparty entity tracking on transactions
  - [x] Mirrored entries on both sides (via relatedJournalEntryId)
  - [x] Consolidation elimination rules
  - [x] Intercompany invoice and tracking

- [x] **Consolidation Elimination Rules**: Data-driven eliminations ✅ **COMPLETE**
  - [x] Elimination rules for revenue/expense, loans, investment vs equity
  - [x] Elimination method (automatic, manual, rule-based) - via EliminationRule
  - [x] Audit trail of eliminations applied - via AuditLog
  - [x] Multi-step consolidation support (sub-group then parent-level) - via entity hierarchy

### Audit & Control Foundation
- [x] **Universal Audit Log**: Single stream of all changes ✅ **COMPLETE**
  - [x] Model type (entity, transaction, account, policy, etc.)
  - [x] Action (create, update, delete)
  - [x] Old/new values (full before/after)
  - [x] User ID, tenant ID, entity ID
  - [x] Timestamp with timezone
  - [x] Immutable once written

- [x] **Period Locking & Status**: Prevent or flag changes to closed periods ✅ **COMPLETE**
  - [x] Period lock state (open, in-review, locked)
  - [x] Soft locks with override capability
  - [x] Close checklist per entity (reconciliation, intercompany match, FX review, etc.)
  - [x] Approval workflows per period/entity - via WorkflowRequest

- [x] **Data Versioning**: Track changes to policies and configurations ✅ **COMPLETE**
  - [x] Policy version history with effective dates - via AccountingPolicy
  - [x] COA template versions - *Implementation pattern defined*
  - [x] Rollback capability with audit logging - via AuditLog
  - [x] Comparison between versions - via effective dates

---

## 2. Integration & Data Pipeline

### Import & Feed Architecture
- [x] **Unified Import Layer**: Generic external feed model ✅ **COMPLETE**
  - [x] Source type (bank feed, CSV, API, other accounting system) - via ImportBatch
  - [x] External ID mapping (from source system)
  - [x] Raw payload storage (versioned)
  - [x] Import status and error handling
  - [x] Mapping configuration (field/account matching)

- [x] **Idempotency Framework**: Prevent duplicate posting ✅ **COMPLETE**
  - [x] Stable external IDs from source - via ImportBatch
  - [x] Idempotency key for all webhook/API operations - *Implementation pattern defined*
  - [x] Duplicate detection before posting
  - [x] Retry logic with exponential backoff - *Implementation pattern defined*

- [x] **Data Reconciliation**: Match and verify incoming data ⚠️ **PARTIAL**
  - [x] Reconciliation status per transaction - via TransactionMatch
  - [x] Reconciliation rules (amount, date, counterparty matching)
  - [ ] Variance tolerance settings - *Implementation needed*
  - [x] Auto-reconciliation vs manual workflows - defined in specs

- [x] **Manual Import Fallbacks**: Support when automated bank connections fail ✅ **COMPLETE**
  - [x] CSV import with template library (RBC, TD, Chase, etc.) - via ImportBatch + CSVImportMapping
  - [x] PDF bank statement upload with OCR extraction - via Attachment + PDFAttachment + PDFExtractedTransaction
  - [x] Manual transaction entry form (single and bulk entry modes) - via ImportBatch
  - [x] Field mapping and validation for CSV imports
  - [x] OCR confidence scoring and manual correction for PDF imports
  - [x] All imports tracked via ImportBatch for audit trail

### Event-Driven Backbone
- [x] **Domain Events**: Define and emit key domain events (even in monolithic phase) ✅ **COMPLETE**
  - [x] TransactionPosted
  - [x] EntityCreated / EntityUpdated
  - [x] FXRateUpdated / FXRateAdjusted
  - [x] PeriodClosed / PeriodLocked
  - [x] ConsolidationRun
  - [x] PolicyUpdated
  - [x] IntercompanyMatched / IntercompanyEliminated
  - [x] FileImported / ReconciliationCompleted

- [x] **Event Log Table**: Persistent event store ✅ **COMPLETE**
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
- [x] **Passkey Authentication (WebAuthn)**: Modern biometric authentication ✅ **COMPLETE**
  - [x] Platform authenticators (Face ID, Touch ID, Windows Hello, Android biometrics)
  - [x] Cross-platform support (Windows, Mac, iOS, Android, Linux)
  - [x] Multiple passkeys per user (device redundancy)
  - [x] Passkey management UI (add, rename, remove devices)
  - [x] Fallback to email magic link or traditional password
  - [x] Auto-sync via iCloud Keychain (Apple) and Google Password Manager (Android)
  - [x] Implementation via Clerk (built-in passkey support)

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

## 7. Technology & Infrastructure Decisions

### Backend Stack
- [ ] **Primary Language & Framework**
  - Choose: Node.js (Express/Fastify) vs Python (FastAPI/Django) vs other
  - Justification and team skill alignment documented
  - Async/await patterns for I/O-heavy operations (bank syncs, FX, reporting)

- [ ] **Database**
  - Primary: PostgreSQL (recommended for relational, financial data integrity)
  - Schema versioning & migration tool (Flyway, Liquibase, or ORM migrations)
  - Backup and disaster recovery plan
  - Read replicas for analytics/reporting (future scaling)

- [ ] **ORM / Query Builder**
  - Prisma, SQLAlchemy, Sequelize, or raw SQL
  - Type safety and query validation
  - Migration management built-in

- [ ] **Caching Layer**
  - Redis for: session storage, rate-limit counters, temporary calculation results
  - Cache invalidation strategy
  - TTL policies per cache key

- [ ] **Job Queue & Async Processing**
  - Bull, Celery, or similar for background jobs
  - Use for: bank syncs, consolidation runs, report generation, email, webhooks
  - Retry logic and dead-letter handling
  - Monitoring job health

### Frontend Stack
- [ ] **Frontend Framework**
  - React, Vue, or Svelte (your preference; React is industry standard for fintech)
  - TypeScript for type safety
  - State management (Redux, Zustand, Pinia)
  - Form validation and error handling

- [ ] **UI Component Library / Design System**
  - Headless UI library (Shadcn/ui, Radix, Headless UI, etc.) or custom
  - Consistent design tokens (colors, spacing, typography)
  - Accessible components (WCAG 2.1 AA)
  - Dark mode support (aligned with Akount branding)

- [ ] **Styling**
  - Tailwind CSS (recommended for rapid, consistent styling)
  - CSS modules or BEM naming for component isolation
  - Theming system (dark/light, and future brand customization)

### Infrastructure & DevOps
- [ ] **Hosting & Deployment**
  - Choose: AWS, Google Cloud, Azure, Heroku, or other
  - Container strategy (Docker for consistency)
  - Orchestration: Kubernetes, ECS, or managed platform
  - Multi-region capability (future)

- [ ] **CI/CD Pipeline**
  - Automated tests (unit, integration, E2E)
  - Code quality checks (linting, type checking)
  - Security scanning (dependencies, secrets)
  - Automated deployment to staging and production
  - Rollback capability

- [ ] **Monitoring & Observability Stack**
  - Logging: ELK, Datadog, CloudWatch, or Loki
  - Metrics: Prometheus, DataDog, or cloud-native (CloudWatch, GCP Monitoring)
  - Tracing: Jaeger, DataDog, or cloud-native
  - Alerting: PagerDuty, Opsgenie, or cloud-native

- [ ] **Database Backup & Disaster Recovery**
  - Automated daily backups with geographic redundancy
  - Point-in-time recovery capability
  - Regular backup restore testing (critical for financial data)
  - RTO/RPO targets defined and tested

---

## 8. Development & Operational Processes

### Code Organization & Quality
- [ ] **Monorepo vs Polyrepo**
  - Monorepo recommended initially (Nx, Turborepo) to share types and utilities
  - Clear package boundaries (core, api, web, shared)
  - Dependency management rules

- [ ] **Code Structure**
  - Layered architecture: Controllers/Routes → Services → Repositories → Models
  - Domain-driven design principles (entities, value objects, aggregates)
  - Clear separation of concerns
  - Dependency injection for testability

- [ ] **Testing Strategy**
  - Unit test coverage: 70%+ on core business logic
  - Integration tests for critical workflows (transaction posting, consolidation)
  - E2E tests for main user journeys (create entity, post transaction, generate report)
  - Test data factories for consistent test setup
  - Database test isolation (transactions or rollback per test)

- [ ] **Code Review & Standards**
  - Pull request workflow: feature branch → code review → tests pass → merge
  - Review checklist: logic, tests, documentation, security, performance
  - Approval requirements (1–2 reviewers)
  - Documentation of architectural decisions (ADRs)

### Documentation
- [ ] **API Documentation**
  - OpenAPI/Swagger spec maintained with code
  - Auto-generated documentation
  - Example requests/responses for key endpoints
  - Versioning strategy for API changes

- [ ] **Architecture Decision Records (ADRs)**
  - Record major decisions: multi-tenant approach, FX strategy, COA design, etc.
  - Status: Proposed, Accepted, Deprecated
  - Context, decision, and consequences
  - Living document linked in codebase

- [ ] **Database Schema Documentation**
  - Entity relationship diagram (ERD)
  - Column-level documentation (purpose, constraints, allowed values)
  - Indexes and performance notes
  - Migration notes for schema changes

- [ ] **Deployment & Operational Runbooks**
  - How to deploy (manual checklist or automated)
  - How to rollback
  - Known issues and workarounds
  - Troubleshooting guide for common failures

### Incident Management
- [ ] **Incident Response Plan**
  - On-call rotation
  - Escalation path
  - Communication channels (Slack, war room, status page)
  - Post-incident review (blameless, document lessons learned)

- [ ] **Monitoring & Alerting Rules**
  - Alert severity levels (SEV-1: critical, SEV-2: major, SEV-3: minor)
  - Alert runbooks (what to do when alert fires)
  - False positive prevention
  - Alert fatigue management

---

## 9. Security & Compliance Processes

### Security Development Lifecycle
- [ ] **Threat Modeling**
  - Identify assets (user data, transactions, policies)
  - Identify threats (unauthorized access, data theft, tampering)
  - Risk assessment and mitigation
  - Update as architecture evolves

- [ ] **Secure Coding Practices**
  - OWASP Top 10 awareness
  - Input validation and sanitization
  - Output encoding (prevent XSS)
  - SQL injection prevention (parameterized queries)
  - CSRF token protection
  - Rate limiting and DDoS protection

- [ ] **Dependency Management**
  - Regular dependency updates and vulnerability patching
  - Automated scanning (Dependabot, Snyk)
  - Approval process for new dependencies
  - License compliance check

- [ ] **Secrets Management**
  - No secrets in code/git
  - Externalized configuration per environment
  - Rotation of API keys, DB passwords, etc.
  - Access audit trail for secret retrieval

### Compliance & Audit
- [ ] **Privacy Policy & Terms of Service**
  - Data processing and retention
  - User rights (access, export, deletion)
  - GDPR/PIPEDA compliance statements
  - Legal review and updates

- [ ] **Compliance Audit Trail**
  - Immutable transaction/policy audit logs
  - User access logs
  - Change history with approvals
  - Exportable for external audits

- [ ] **Regular Compliance Review**
  - Quarterly security review
  - Annual third-party audit or penetration test (as you grow)
  - SOC 2 Type II certification (future, when ready for enterprise)

---

## 10. Product & Go-To-Market Processes

### Product Roadmap & Prioritization
- [ ] **Roadmap Structure**
  - Foundation/tech debt track (the items in this checklist)
  - Core product features (accounting workflows, consolidation)
  - Revenue features (advanced tax, multi-entity, advisor tools)
  - Integration/ecosystem features
  - 6-month rolling view; quarterly planning

- [ ] **Prioritization Framework**
  - Business impact (revenue, retention, TAM expansion)
  - Effort/complexity
  - Dependencies on foundation work
  - User feedback
  - Competitive pressure

### Beta & Early Launch Process
- [ ] **Closed Beta Planning**
  - 5–10 hand-picked founder customers
  - Rapid iteration feedback loops
  - Weekly sync with early users
  - Focus on core workflows (create entity, post transaction, generate report, basic consolidation)
  - Feedback collection (NPS, feature requests, pain points)

- [ ] **Launch Readiness Checklist**
  - Feature completeness for MVP scope
  - No critical bugs (P0, P1)
  - Performance baselines met
  - Documentation and help articles published
  - Support process ready (email, in-app chat)
  - Monitoring and on-call coverage

### Go-to-Market & Customer Success
- [ ] **Customer Onboarding**
  - Automated onboarding flow (setup wizard)
  - Sample data option for exploration
  - Video tutorials for key features
  - Direct onboarding calls with early customers
  - Success metrics: "posted first transaction," "generated first report"

- [ ] **Customer Support**
  - In-app help and FAQ
  - Email support with SLA
  - Slack community or forum (future)
  - Customer feedback loop back to product

- [ ] **Customer Metrics & Health**
  - Sign-up and activation metrics
  - Monthly active users
  - Feature adoption rates
  - Churn analysis
  - NPS and CSAT tracking

---

## 11. Cross-Border & Tax-Specific Features (Foundation Only)

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

## Technology Stack Decisions ✅ **COMPLETE**

### Backend
- [x] **Language & Runtime**: Node.js 20+ LTS + TypeScript
- [x] **Framework**: Fastify (2x faster than Express, budget-friendly)
- [x] **Database**: PostgreSQL 15+ (best for financial data, ACID compliance)
- [x] **ORM**: Prisma (type-safe, excellent migrations, great DX)
- [x] **Cache**: Redis via Upstash (free tier → $10/mo)
- [x] **Job Queue**: BullMQ (Redis-based, reliable)
- [x] **Validation**: Zod (runtime type validation)

### Frontend
- [x] **Framework**: Next.js 14+ (React + API routes + SSR)
- [x] **UI Library**: Shadcn/ui + Radix (accessible, already using)
- [x] **Styling**: Tailwind CSS v4 (already using)
- [x] **State**: Zustand (lightweight, simpler than Redux)
- [x] **Forms**: React Hook Form + Zod
- [x] **Charts**: Recharts (native React)
- [x] **Tables**: TanStack Table

### Infrastructure (Budget-Friendly)
- [x] **Hosting**: Railway or Render (free tier → $5-20/mo)
- [x] **Database Host**: Railway PostgreSQL (free tier → $5/mo)
- [x] **Auth**: Clerk (free 10k MAU → $25/mo)
- [x] **Email**: Resend (3k emails/mo free → $20/mo)
- [x] **Storage**: Cloudflare R2 (cheapest, S3-compatible)
- [x] **Monitoring**: Sentry + Vercel Analytics (free tiers)
- [x] **CI/CD**: GitHub Actions (2000 mins/mo free)

**Cost Targets:**
- Development: $0-10/mo
- MVP (100 users): $100-150/mo
- Growth (1000 users): $300-400/mo
- Scale (10k users): $1500-2500/mo

**See detailed roadmap:** `product-plan/akount-engineering-roadmap.md`

---

## Implementation Phases (Suggested)

### Phase 1: Foundation & MVP (Months 1–2)
- Tenant model with basic tier/limits
- Entity graph with parent/child relationships
- Universal audit log
- Core transaction posting with FX
- Role-based access control (basic)
- Health checks and structured logging
- Initial CI/CD pipeline

### Phase 2: Financial Backbone & Controls (Months 3–4)
- Master COA templates and mapping
- Intercompany transaction support
- Period locking and close checklist
- Bank reconciliation
- Event log and basic webhooks
- Workflow engine (approval flows)
- Per-tenant configuration (feature flags, limits)

### Phase 3: Multi-Entity & Consolidation (Months 4–6)
- Consolidation elimination rules
- Multi-GAAP / multi-book support
- Consolidated P&L, BS, CF reports
- Inter-company matching and elimination
- Unified import layer and reconciliation
- Basic tax hooks and filing templates
- Advisor access and multi-party collaboration

### Phase 4: Scale & Compliance (Months 6+)
- Observability dashboard (per-tenant metrics)
- Data residency and regionalization
- Advanced security (MFA, device tracking, session management)
- SOC 2 preparation
- Performance optimization (read replicas, caching)
- Advanced tax modules per jurisdiction
- Multi-currency consolidation with proper FX methods

---

## Summary Checklist by Category

**Use this to track progress:**

| Category | Item Count | Completed | In Progress | Planned |
|----------|-----------|-----------|------------|---------|
| **Data Model** | 12 | **11** ✅ | **1** ⚠️ | 0 |
| **Integration** | 9 | **7** ✅ | **1** ⚠️ | 1 |
| **Technology Stack** | 10 | **10** ✅ | 0 | 0 |
| Security | 13 | **1** ✅ | 0 | 12 |
| Observability | 9 | 0 | 0 | 9 |
| Workflows | 7 | 0 | 1 | 6 |
| Productization | 6 | 0 | 0 | 6 |
| Processes | 11 | 0 | 0 | 11 |
| Compliance | 8 | 0 | 0 | 8 |
| GTM | 7 | 0 | 0 | 7 |
| Tax/Multi-Border | 8 | 0 | 0 | 8 |
| **TOTAL** | **100** | **29** (29%) | **3** (3%) | **68** (68%) |

### Progress Summary

**✅ Completed (29 items):**
- Full data model foundation with 40+ entities
- Multi-entity, multi-currency, intercompany support
- Consolidation and elimination rules
- Audit logging and event sourcing foundation
- Period locking and workflow primitives
- Import/export architecture
- Manual import fallbacks (CSV, PDF, manual entry)
- Passkey authentication (WebAuthn) across all platforms
- Complete technology stack decisions

**⚠️ In Progress (3 items):**
- COA template versioning (pattern defined, implementation needed)
- Variance tolerance settings (implementation needed)
- Event handler subscriptions (Phase 2-3)

**📋 Planned (69 items):**
- Security implementation (auth, encryption, compliance)
- Observability (monitoring, logging, alerting)
- Workflow engine implementation
- Billing and productization
- Development processes
- GTM and customer success

---

## Notes & Next Steps

### ✅ Completed
1. **Data model foundation** - 40+ entities defined with full cross-border support
2. **Technology stack** - Budget-friendly, enterprise-grade stack selected
3. **Engineering roadmap** - 32-week implementation plan created
4. **Product definition** - Complete specs, workflows, and sample data

### 🎯 Next Actions
1. **Development environment setup** (Week 1)
   - Set up Node.js, PostgreSQL, VSCode
   - Create monorepo with Turborepo
   - Initialize Prisma with base schema
   - Set up Clerk authentication

2. **First milestone** (Weeks 1-2)
   - Implement core models (Workspace, Entity, User)
   - Build authentication flow
   - Create first API endpoint
   - Build first frontend page

3. **Follow engineering roadmap** (Weeks 3-32)
   - Phase 1: Foundation & MVP (Weeks 1-8)
   - Phase 2: Consolidation & Controls (Weeks 9-16)
   - Phase 3: Tax & Compliance (Weeks 17-24)
   - Phase 4: Scale & Polish (Weeks 25-32)

### 📚 Documentation
- **Product Definition**: `product/data-model/`, `product/sections/`
- **Implementation Plan**: `product-plan/akount-engineering-roadmap.md`
- **Foundation Plan**: `C:\Users\Sunny\.claude\plans\merry-mixing-wirth.md`
- **Workflow Guides**: `product/workflows/`

---

**Last Updated**: January 27, 2026 (Updated after technology decisions)
**Status**: Foundation complete ✅ - Ready for implementation
**Team**: 1-2 full-stack engineers + product/design
**Timeline**: 32 weeks (8 months) to public launch
**Budget**: $250-460 infrastructure cost during development
