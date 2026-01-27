# Akount Engineering Roadmap

**Last Updated:** January 27, 2026
**Purpose:** Implementation plan for foundational systems, technologies, and processes to build Akount as a scalable, secure, budget-friendly cross-border accounting platform.

---

## Technology Stack Decisions

### Core Principles
- **Budget-Friendly**: Maximize free tiers, open-source tools, and pay-as-you-grow services
- **Enterprise-Grade**: Security, compliance, and reliability from day one
- **Developer Velocity**: Modern tools with great DX to ship fast
- **Type Safety**: End-to-end TypeScript for fewer bugs and better refactoring

---

### Backend Stack

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Language** | TypeScript | Type safety, matches frontend, easier hiring | Free |
| **Runtime** | Node.js 20+ LTS | Excellent async I/O for financial ops, mature ecosystem | Free |
| **Framework** | Fastify | 2x faster than Express, lower hosting costs, great plugins | Free |
| **Database** | PostgreSQL 15+ | Best for financial data (ACID), jsonb for flexibility | Free tier → $5-20/mo |
| **ORM** | Prisma | Type-safe, excellent migrations, great DX | Free |
| **Cache** | Redis (Upstash) | Session storage, rate limits, temp calculations | Free tier → $10/mo |
| **Job Queue** | BullMQ | Redis-based, reliable retries, monitoring | Free |
| **Validation** | Zod | Runtime type validation, integrates with Prisma | Free |

**Monthly Cost Estimate:**
- Development: $0 (free tiers)
- Production (MVP): $15-35/mo (Railway PostgreSQL + Upstash Redis)
- Production (Scale): $100-300/mo (dedicated DB, more Redis memory)
- OCR Usage: Pay per use (~$15-50/mo for 10-30 PDF uploads)

---

### Frontend Stack

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Framework** | Next.js 14+ | React with API routes, SSR, great DX | Free |
| **Language** | TypeScript | End-to-end type safety | Free |
| **UI Library** | Shadcn/ui + Radix | Already using, accessible, customizable | Free |
| **Styling** | Tailwind CSS v4 | Already using, consistent, fast | Free |
| **State** | Zustand | Lightweight, simpler than Redux | Free |
| **Forms** | React Hook Form + Zod | Best validation DX | Free |
| **Charts** | Recharts | Native React charts, free | Free |
| **Tables** | TanStack Table | Powerful, flexible, free | Free |

**Monthly Cost Estimate:**
- Hosting: $0 (Vercel free tier for hobby) → $20/mo (Pro for production)

---

### Infrastructure & DevOps

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Hosting** | Railway or Render | Generous free tiers, great DX, easy scaling | Free → $5-20/mo |
| **Database Host** | Railway PostgreSQL | Managed, backups, easy to use | Free tier → $5/mo |
| **Cache/Queue** | Upstash Redis | Generous free tier, serverless pricing | Free → $10/mo |
| **Auth** | Clerk | Passkeys (WebAuthn), MFA, magic links, great UX | Free → $25/mo |
| **Email** | Resend | 3k emails/mo free, great API | Free → $20/mo |
| **File Storage** | Cloudflare R2 | Cheapest object storage, S3-compatible | Free 10GB → $0.015/GB |
| **OCR Service** | Google Vision API | PDF bank statement extraction | $1.50/1000 pages (pay per use) |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking + frontend analytics | Free tiers |
| **CI/CD** | GitHub Actions | 2000 mins/mo free, integrated | Free |

**Monthly Cost Estimate:**
- Development: $0
- MVP (100 users): $30-60/mo
- Scale (1000 users): $150-300/mo

---

### Security & Compliance

| Component | Choice | Rationale | Cost |
|-----------|--------|-----------|------|
| **Auth** | Clerk | Passkeys (WebAuthn), MFA, session management, device tracking | Free → $25/mo |
| **Secrets** | GitHub Secrets + Railway Env | Secure by default, no extra service needed | Free |
| **Encryption** | PostgreSQL native + TLS | Database encryption at rest, TLS in transit | Free |
| **Backups** | Railway auto backups | Daily automated backups with retention | Included |
| **Logging** | Railway Logs + Sentry | Structured logging, error tracking | Free tiers |

---

## Implementation Phases

### Phase 1: Foundation & MVP (Weeks 1-8)

**Goal:** Ship core accounting functionality with multi-entity and multi-currency support

#### Week 1-2: Project Setup & Core Models
- [ ] Set up monorepo (Turborepo or Nx)
  - `apps/web` - Next.js frontend
  - `apps/api` - Fastify backend
  - `packages/db` - Prisma schema and migrations
  - `packages/types` - Shared TypeScript types
  - `packages/ui` - Shared UI components

- [ ] Database schema (Prisma)
  - Implement enhanced data model with all 40+ entities
  - Workspace, Entity, User, UserRole models
  - Core accounting: GLAccount, JournalEntry, Transaction
  - Multi-currency: Currency, FxRate
  - Audit: AuditLog, DomainEvent

- [ ] Authentication (Clerk)
  - **Passkey authentication (WebAuthn)** - Primary auth method
    - Enable passkeys in Clerk dashboard
    - Face ID, Touch ID, Windows Hello, Android biometrics
    - Multiple passkeys per user for device redundancy
    - Passkey management UI (add, rename, remove)
    - Auto-sync via iCloud Keychain and Google Password Manager
  - Fallback authentication methods
    - Email magic links (passwordless)
    - Traditional password + MFA (optional)
  - Sign up, login, MFA
  - Session management
  - Workspace membership
  - Basic RBAC (owner, admin, viewer)

- [ ] API foundation
  - Fastify setup with Zod validation
  - Error handling middleware
  - Request logging with structured logs
  - Rate limiting
  - Health check endpoints

#### Week 3-4: Core Transactions & Reconciliation
- [ ] Transaction posting
  - Multi-currency transaction creation
  - FX rate fetching and storage
  - Base currency conversion
  - Double-entry journal entry generation
  - Period validation (can't post to locked period)

- [ ] Bank connection integration
  - Plaid integration (US/Canada)
  - BankFeedTransaction import
  - Duplicate detection (idempotency)
  - Transaction matching suggestions
  - Manual match/unmatch workflows

- [ ] Basic reconciliation
  - Match bank feeds to transactions
  - Transfer detection between accounts
  - Reconciliation status tracking
  - Outstanding items report

- [ ] Manual import fallbacks (critical for MVP)
  - **CSV Import**: Upload CSV, map columns, preview, import transactions
    - Template library for major banks (RBC, TD, Chase, etc.)
    - Column mapping interface (drag-drop or dropdown)
    - Data validation and error highlighting
  - **PDF Bank Statement Upload**: Upload PDF, OCR extraction, review, import
    - Integrate AWS Textract or Google Vision API
    - Extract transactions with confidence scores
    - Manual correction interface for OCR errors
  - **Manual Transaction Entry**: Form-based entry for one-off transactions
    - Single entry mode and bulk entry mode
    - Quick add with minimal fields (date, description, amount)
    - All imported via ImportBatch for audit trail

#### Week 5-6: Multi-Entity & Intercompany
- [ ] Entity management
  - Create/edit entities with hierarchy
  - Ownership percentage tracking
  - Functional/reporting currency setup
  - Consolidation method configuration

- [ ] Intercompany transactions
  - Tag transactions with counterparty entity
  - Intercompany type selection
  - Auto-create offsetting entries (basic)
  - Intercompany reconciliation report

- [ ] Chart of Accounts
  - GL account creation per entity
  - Account type and normal balance
  - Intercompany account flagging
  - Account hierarchy

#### Week 7-8: Basic Reporting & Polish
- [ ] Financial reports
  - P&L by entity
  - Balance sheet by entity
  - Cash flow statement
  - Entity filter and date range
  - Export to PDF/CSV

- [ ] Dashboard
  - Net worth and cash position
  - Account list with balances
  - Recent transactions
  - Multi-currency toggle

- [ ] Polish & testing
  - E2E tests for critical flows
  - Security audit
  - Performance optimization
  - Bug fixes and UX improvements

**Success Criteria:**
- ✅ User can sign up and create workspace
- ✅ User can create multiple entities (personal, business)
- ✅ User can connect bank accounts via Plaid
- ✅ User can upload CSV or PDF bank statements when bank connection unavailable
- ✅ User can manually enter transactions as fallback
- ✅ User can reconcile transactions (automated and manual)
- ✅ User can post transactions in multiple currencies
- ✅ User can generate basic P&L and balance sheet per entity

---

### Phase 2: Consolidation & Controls (Weeks 9-16)

**Goal:** Enable consolidated reporting and period controls

#### Week 9-10: Period Management
- [ ] Fiscal calendar setup
  - Define fiscal year per entity
  - Create periods (monthly/quarterly)
  - Period status (open, in_review, locked)

- [ ] Period close workflow
  - Close checklist per entity
  - Task tracking and completion
  - Approval workflows (basic)
  - Lock/unlock with audit trail

- [ ] Period controls
  - Prevent posting to locked periods
  - Soft lock with override permission
  - Lock cascade (close period → lock transactions)

#### Week 11-12: Consolidation Engine
- [ ] Consolidation logic
  - Traverse entity hierarchy
  - Aggregate GL balances from children
  - Apply ownership percentages (proportionate method)
  - FX translation to reporting currency

- [ ] Elimination rules
  - Configure elimination rules per entity pair
  - Auto-eliminate intercompany AR/AP
  - Auto-eliminate intercompany revenue/expense
  - Elimination adjustment tracking

- [ ] Consolidated reports
  - Consolidated P&L with entity columns
  - Consolidated balance sheet
  - Consolidated cash flow
  - Elimination detail drill-down

#### Week 13-14: Invoicing & AP/AR
- [ ] Invoice management
  - Create/send invoices
  - Line items with tax calculation
  - Multi-currency invoicing
  - Payment tracking and allocation

- [ ] Bill management
  - Create/track bills
  - Payment scheduling
  - Vendor management

- [ ] Aging reports
  - AR aging by client
  - AP aging by vendor
  - Overdue alerts

#### Week 15-16: Analytics & AI Foundation
- [ ] Enhanced reporting
  - Custom report builder (basic)
  - Saved report definitions
  - Scheduled report exports

- [ ] AI categorization (basic)
  - Transaction description analysis
  - Category suggestions with confidence
  - Auto-apply rules
  - Feedback loop

- [ ] Insights engine
  - Cash flow insights
  - Spending pattern detection
  - Budget variance alerts

**Success Criteria:**
- ✅ User can close and lock periods per entity
- ✅ User can generate consolidated reports across entities
- ✅ System auto-eliminates intercompany transactions
- ✅ User can create and track invoices/bills
- ✅ AI suggests transaction categories with good accuracy

---

### Phase 3: Tax & Compliance (Weeks 17-24)

**Goal:** Add jurisdiction-aware tax handling and compliance tools

#### Week 17-18: Tax Engine
- [ ] Tax rate management
  - Create tax codes per jurisdiction
  - Effective date handling
  - Rate versioning
  - Auto-select rate by date and jurisdiction

- [ ] Tax calculation
  - Line-item tax calculation
  - Inclusive vs exclusive handling
  - Multi-tax scenarios (GST + PST)
  - Tax summary reports

#### Week 19-20: Accounting Policies
- [ ] Policy management
  - Define policies per entity/group
  - Revenue recognition method
  - Depreciation methods
  - FX translation method
  - Effective date tracking

- [ ] Multi-GAAP support
  - Local GAAP book per entity
  - Group GAAP book for consolidation
  - Policy-driven report generation

#### Week 21-22: Import & Integration
- [ ] Enhanced import
  - CSV import with field mapping
  - Template library for common formats
  - Preview before import
  - Error handling and correction

- [ ] Bank integration expansion
  - Flinks (Canada)
  - Additional Plaid institutions
  - Manual CSV upload fallback
  - Connection health monitoring

#### Week 23-24: Workflow Engine
- [ ] Generic workflow
  - Workflow definition model
  - Step sequencing (serial/parallel)
  - Assignee management
  - Status tracking

- [ ] Approval workflows
  - Spend approval above threshold
  - Period close approval
  - Policy change approval
  - Email notifications

**Success Criteria:**
- ✅ Tax calculated correctly per jurisdiction with version history
- ✅ Policies configurable per entity with effective dates
- ✅ Flexible import system handles various formats
- ✅ Approval workflows function end-to-end

---

### Phase 4: Scale & Polish (Weeks 25-32)

**Goal:** Production-ready performance, security, and operational tooling

#### Week 25-26: Performance & Observability
- [ ] Performance optimization
  - Database query optimization
  - Indexes on hot paths
  - Read replica for reports (if needed)
  - Caching strategy (Redis)

- [ ] Monitoring dashboard
  - Application metrics (latency, errors, throughput)
  - Business metrics (transactions/day, active tenants)
  - Per-tenant health metrics
  - Alert rules and runbooks

- [ ] Logging & tracing
  - Structured JSON logs
  - Request ID propagation
  - Error tracking (Sentry)
  - Log aggregation and search

#### Week 27-28: Advanced Security
- [ ] Enhanced auth
  - Device management
  - Session review and revocation
  - IP tracking
  - Security audit log

- [ ] Data protection
  - PII field identification
  - Data masking in logs
  - Retention policies
  - Export for GDPR compliance

- [ ] Secrets rotation
  - API key rotation process
  - Database credential rotation
  - Access logging

#### Week 29-30: Multi-Tenant Operations
- [ ] Tenant management
  - Subscription tier enforcement
  - Feature flags per tenant
  - Usage metering (transactions, entities)
  - Quota enforcement

- [ ] Billing integration
  - Stripe integration
  - Usage-based pricing calculation
  - Invoice generation
  - Payment tracking

#### Week 31-32: Launch Readiness
- [ ] Documentation
  - API documentation (OpenAPI)
  - User guides
  - Admin guides
  - Architecture decision records

- [ ] Testing & QA
  - Comprehensive E2E test suite
  - Load testing
  - Security penetration test
  - Accessibility audit

- [ ] Operations
  - Backup/restore procedures
  - Disaster recovery plan
  - Incident response plan
  - On-call rotation setup

**Success Criteria:**
- ✅ System handles 1000+ concurrent users
- ✅ All security best practices implemented
- ✅ Monitoring and alerting fully operational
- ✅ Documentation complete
- ✅ Ready for public launch

---

## Development Processes

### Code Organization

**Monorepo Structure (Turborepo):**
```
akount/
├── apps/
│   ├── web/           # Next.js frontend
│   ├── api/           # Fastify backend
│   └── docs/          # Documentation site
├── packages/
│   ├── db/            # Prisma schema, migrations
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared UI components (Shadcn)
│   ├── lib/           # Shared utilities
│   └── config/        # Shared config (ESLint, TS, etc.)
├── product/           # Product specs (this repo)
└── product-plan/      # Plans and checklists
```

**Layered Architecture:**
```
Controllers/Routes → Services → Repositories → Models
                              ↓
                         Domain Logic
                         (pure functions)
```

### Testing Strategy

**Coverage Targets:**
- Unit tests: 80%+ on domain logic, utilities
- Integration tests: All critical API endpoints
- E2E tests: 10-15 critical user journeys

**Test Pyramid:**
- Unit tests: Fast, isolated, many
- Integration tests: Database, external services
- E2E tests: Full user flows, fewer, slower

**Tools:**
- Unit/Integration: Vitest
- E2E: Playwright
- Database: Test containers or transaction rollback
- Factories: Faker for test data

### Code Review & Standards

**Pull Request Workflow:**
1. Feature branch from `main`
2. Write tests first (TDD where possible)
3. Implement feature
4. Self-review code
5. Create PR with description, screenshots
6. 1-2 reviewers approve
7. All tests pass (CI)
8. Merge to `main`
9. Auto-deploy to staging

**Review Checklist:**
- [ ] Logic correct and efficient
- [ ] Tests cover new code
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Errors handled gracefully
- [ ] Types are correct
- [ ] Documentation updated

**Commit Message Format:**
```
type(scope): brief description

- Detailed change 1
- Detailed change 2

Closes #123
```

Types: feat, fix, refactor, test, docs, chore

### CI/CD Pipeline (GitHub Actions)

**On Pull Request:**
1. Install dependencies
2. Lint (ESLint, Prettier)
3. Type check (TypeScript)
4. Run unit tests
5. Run integration tests
6. Build frontend and backend
7. Security scan (npm audit, Snyk)

**On Merge to Main:**
1. All PR checks
2. Run E2E tests
3. Deploy to staging
4. Run smoke tests
5. Manual approval for production
6. Deploy to production
7. Run post-deploy health checks

**Deployment Strategy:**
- Staging: Auto-deploy on merge to `main`
- Production: Manual approval required
- Rollback: One-click rollback to previous version
- Database: Migrations run automatically, with backup first

---

## Operational Processes

### Incident Management

**Severity Levels:**
- **SEV-1 (Critical)**: Complete service outage, data loss
  - Response: Immediate, all hands
  - Communication: Status page, email
  - Resolution: Within 1 hour

- **SEV-2 (Major)**: Significant functionality broken, no workaround
  - Response: Within 30 mins
  - Communication: Status page
  - Resolution: Within 4 hours

- **SEV-3 (Minor)**: Small issue, workaround available
  - Response: Within 2 hours
  - Communication: Ticket system
  - Resolution: Within 24 hours

**Incident Response Plan:**
1. Detect (monitoring alert or user report)
2. Triage (assess severity)
3. Communicate (status page, team notification)
4. Investigate (logs, metrics, tracing)
5. Fix (deploy hotfix or rollback)
6. Verify (health checks, user testing)
7. Post-mortem (blameless, document lessons)

### Monitoring & Alerting

**Critical Alerts (SEV-1):**
- API error rate >5% for 5 minutes
- Database connection failures
- Payment processing failures
- Security breach indicators

**Warning Alerts (SEV-2):**
- API latency p95 >2s for 10 minutes
- Disk usage >80%
- Memory usage >85%
- Failed background jobs >10%

**Info Alerts:**
- Slow queries >5s
- High memory usage >70%
- Bank sync failures

**Alert Routing:**
- SEV-1: PagerDuty (on-call rotation)
- SEV-2: Slack + Email
- SEV-3: Email
- Info: Dashboard only

### Backup & Disaster Recovery

**Backup Strategy:**
- Database: Automated daily backups with 30-day retention
- Attachments: Daily sync to separate region
- Configuration: Version controlled in git

**Recovery Targets:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours (daily backups)

**DR Plan:**
1. Restore database from latest backup
2. Deploy application to DR region
3. Verify data integrity
4. Update DNS to point to DR
5. Communicate to users

**Testing:**
- Quarterly backup restore test
- Annual DR failover drill

---

## Security Best Practices

### Development
- No secrets in code/git
- Input validation on all endpoints (Zod)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escaping + CSP headers)
- CSRF protection (SameSite cookies + tokens)
- Rate limiting per IP and per user

### Infrastructure
- TLS 1.2+ only, strong cipher suites
- Database encryption at rest (native)
- Encrypted backups
- Secrets in environment variables (Railway/Render)
- Principle of least privilege (IAM, DB roles)

### Operations
- Regular dependency updates (Dependabot)
- Security scanning in CI (npm audit, Snyk)
- Quarterly security review
- Incident response plan tested
- Log all security events

---

## Cost Optimization

### Development Phase
**Target: $0-50/mo**
- Railway: Free tier (500 hrs) or $5/mo
- Upstash Redis: Free tier
- Vercel: Free tier
- Clerk: Free tier
- GitHub Actions: Free tier
- **Total: $0-10/mo**

### MVP Launch (100 users)
**Target: $100-150/mo**
- Railway (DB + API): $20-30/mo
- Upstash Redis: $10/mo
- Vercel Pro: $20/mo
- Clerk: $25/mo (100 MAU)
- Resend: $20/mo
- Cloudflare R2: $5/mo
- Sentry: Free tier
- **Total: $100-110/mo**

### Growth Phase (1000 users)
**Target: $400-600/mo**
- Railway (scaled): $100-150/mo
- Upstash Redis: $30/mo
- Vercel Pro: $20/mo
- Clerk: $75/mo (1000 MAU)
- Resend: $40/mo
- Cloudflare R2: $20/mo
- Sentry: $29/mo
- **Total: $314-364/mo**

### Scale Phase (10k users)
**Target: $1500-2500/mo**
- Railway or AWS: $500-800/mo
- Redis: $100/mo
- Vercel: $20-150/mo
- Clerk: $400/mo
- Email: $200/mo
- Storage: $100/mo
- Monitoring: $100/mo
- **Total: $1420-1750/mo**

---

## Summary Roadmap

| Phase | Duration | Focus | Budget | Outcome |
|-------|----------|-------|--------|---------|
| 1: Foundation | Weeks 1-8 | Core accounting, multi-entity, reconciliation | $0-10/mo | MVP ready for closed beta |
| 2: Consolidation | Weeks 9-16 | Consolidated reporting, period controls, invoicing | $50-100/mo | Feature-complete for target users |
| 3: Tax & Compliance | Weeks 17-24 | Tax engine, policies, imports, workflows | $100-150/mo | Enterprise-ready foundation |
| 4: Scale & Polish | Weeks 25-32 | Performance, security, monitoring, launch prep | $100-200/mo | Public launch ready |

**Total Timeline:** 32 weeks (8 months)
**Total Development Cost:** $250-460 (infrastructure only)
**Team:** 1-2 full-stack engineers + product/design

---

**Next Steps:**
1. ✅ Set up development environment (Node.js, PostgreSQL, VSCode)
2. ✅ Create monorepo structure with Turborepo
3. ✅ Initialize Prisma with base schema from product definition
4. ✅ Set up Clerk authentication
5. ✅ Build first API endpoint (health check)
6. ✅ Build first frontend page (login)
7. Start Phase 1, Week 1 tasks
