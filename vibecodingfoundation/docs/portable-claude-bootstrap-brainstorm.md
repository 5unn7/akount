# Portable Claude Code Bootstrap — Brainstorm

**Date:** 2026-02-21
**Status:** Brainstormed
**Vision:** Extract Akount's A+ Claude setup into a universal bootstrap system

---

## Problem Statement

**How do we make Claude self-configure for ANY project, regardless of starting point?**

**3 User Personas:**
1. **Idea Stage** — Vision only, no docs/code → Claude becomes project architect
2. **PRD Stage** — Requirements/specs exist → Claude generates implementation setup
3. **Code Stage** — Existing codebase → Claude analyzes and configures

**Success Criteria:**
- User runs ONE command → Claude is project-ready
- Setup adapts to: tech stack, team size, complexity, domain
- Generated artifacts match Akount quality bar (A+ tier)
- **Zero Akount coupling** — works for fintech, health, e-commerce, gaming, etc.

---

## Current State Analysis (Akount Setup)

### Directory Structure
```
.claude/
├── rules/              # 10 convention files
│   ├── financial-rules.md        # Domain-specific (30%)
│   ├── api-conventions.md        # Tech-specific (40%)
│   ├── frontend-conventions.md   # Tech-specific
│   ├── design-aesthetic.md       # Project-specific
│   ├── guardrails.md            # Universal (30%)
│   ├── product-thinking.md      # Universal
│   └── workflows.md             # Universal
├── hooks/              # 16 git hooks
├── scripts/            # 15+ automation scripts
├── agents/             # 21 review agents
├── commands/           # 20+ skills
└── [config files]      # task-enrichments.json, session-cost.json, etc.
```

### Key Insight: Modular Composition

| Category | % of Setup | Examples | Portability |
|----------|------------|----------|-------------|
| **Universal** | 30% | Guardrails, investigation protocol, cost tracking | ✅ Works for ANY project |
| **Tech-Specific** | 40% | Next.js patterns, Fastify routes, Prisma migrations | ✅ Swap for Django/Rails/etc |
| **Project-Specific** | 30% | Financial rules, design tokens, domain adjacency | ✅ Generate per domain |

**Implication:** We can build a modular system that composes the right pieces.

---

## Chosen Approach: 3-Tier Hybrid System

### Architecture Overview

**Tier 1: CLI (Quick Start)**
- Standalone npm package: `@claude/bootstrap`
- Auto-detects project stage (Idea/PRD/Code)
- Generates starter setup in 5 minutes
- Works offline, no API key required

**Tier 2: Conversational Refinement (/bootstrap skill)**
- Claude-powered deep-dive interview
- Generates comprehensive architecture docs
- Iterates based on user feedback
- Requires Claude Code installed

**Tier 3: Continuous Evolution**
- Pulls latest best practices from community
- Proposes upgrades (e.g., "Investigation hook v2.0 available")
- User reviews diff, applies selectively

---

## Module System (Shared Core)

### Module Categories

```
@claude/bootstrap-core/
├── modules/
│   ├── universal/          # Always included (30% of setup)
│   │   ├── core/          # CLAUDE.md, MEMORY.md, guardrails
│   │   ├── automation/    # Cost tracking, risk scoring, enrichment
│   │   └── investigation/ # Protocol hooks, session logging
│   │
│   ├── stacks/            # Tech-specific (40% of setup)
│   │   ├── nextjs/        # Next.js rules, App Router patterns
│   │   ├── fastify/       # Fastify routes, validation
│   │   ├── django/        # Django patterns
│   │   ├── rails/         # Rails conventions
│   │   ├── express/       # Express.js patterns
│   │   └── generic/       # Fallback for unknown stacks
│   │
│   ├── domains/           # Industry-specific (30% of setup)
│   │   ├── fintech/       # Double-entry, audit trails, compliance
│   │   ├── health/        # HIPAA, PHI handling, patient privacy
│   │   ├── ecommerce/     # Inventory, payments, fraud prevention
│   │   ├── saas/          # Multi-tenancy, billing, subscriptions
│   │   ├── gaming/        # Real-time, leaderboards, anti-cheat
│   │   └── generic/       # Fallback for custom domains
│   │
│   └── maturity/          # Team-size specific
│       ├── solo/          # Lightweight, minimal ceremony
│       ├── team/          # PR templates, review agents
│       └── enterprise/    # Full compliance, audit logs, SLAs
│
├── generators/            # Code generation logic
│   ├── architecture.ts    # Generates ARCHITECTURE.md
│   ├── data-model.ts      # Generates DATA-MODEL.md
│   ├── design-system.ts   # Generates DESIGN-SYSTEM.md
│   ├── security.ts        # Generates SECURITY.md
│   └── claude-md.ts       # Generates CLAUDE.md
│
└── templates/             # Mustache/Handlebars templates
```

### Module Composition Logic

```typescript
// Pseudo-code for module selection
function selectModules(project: Project): Module[] {
  const modules = [
    ...UNIVERSAL_MODULES,  // Always included
  ];

  // Tech stack (auto-detected or user-selected)
  if (project.hasPackageJson()) {
    const stack = detectStack(project); // Next.js, Django, Rails, etc.
    modules.push(STACK_MODULES[stack] || STACK_MODULES.generic);
  }

  // Domain (user-selected)
  const domain = await askDomain(); // fintech, health, e-commerce, etc.
  modules.push(DOMAIN_MODULES[domain] || DOMAIN_MODULES.generic);

  // Maturity (based on team size)
  const teamSize = await askTeamSize();
  modules.push(MATURITY_MODULES[getMaturityLevel(teamSize)]);

  return modules;
}
```

---

## Idea Stage Flow (NEW — The Full Vision)

### Step 1: CLI Quick Start

```bash
$ npm install -g @claude/bootstrap
$ claude-bootstrap init

🔍 Detecting project stage...
   No code found, no docs found

📋 Project Stage: Idea

Let's set up your project. A few quick questions:

1. Project name? vibe-fintech-app
2. One-line description? Financial command center for solopreneurs
3. Domain? (select)
   › fintech
     e-commerce
     health
     saas
     gaming
     other

4. Expected team size in 6 months?
   › solo
     2-5 people
     5-20 people
     20+ people

✅ Generating starter setup...
   Created: /CLAUDE.md (project context)
   Created: /MEMORY.md (learning log)
   Created: /.claude/rules/ (5 core rules)
   Created: /.claude/hooks/ (3 basic hooks)
   Created: /.claude/scripts/ (automation tools)
   Created: /docs/ROADMAP.md (phase plan)

💡 For deeper architecture guidance, run:
   /bootstrap refine
```

### Step 2: Conversational Refinement (/bootstrap refine)

**Claude becomes project architect:**

```
Claude: I see you're building a fintech app for solopreneurs.
Let me help architect this properly.

Vision Interview (5-7 questions):
1. What's the core financial workflow?
   (e.g., expense tracking, invoicing, payroll, tax prep)
2. Multi-currency support needed?
3. Compliance requirements?
   (GDPR, SOC2, PCI-DSS, regional banking regulations)
4. Key integrations?
   (banks, accounting software, payment processors)
5. Scale expectations?
   (users, transactions/day in year 1)
6. Data sensitivity level?
   (PII, financial data, trade secrets)
7. Monetization model?
   (SaaS subscription, transaction fees, freemium)
```

**User answers...**

**Claude generates comprehensive architecture:**

### Generated: `/docs/ARCHITECTURE.md`

```markdown
# Architecture — Vibe Fintech App

## Tech Stack Recommendation

### Backend
- **Fastify** — High-throughput API framework (handles 10K+ req/sec)
  - Why: Financial transactions need low latency
  - Alternative considered: Express (slower, 3K req/sec)

- **PostgreSQL** — ACID-compliant database
  - Why: Financial data requires strict consistency (no eventual consistency)
  - Features needed: Row-level security, JSONB for flexible schemas

- **Prisma** — Type-safe ORM
  - Why: Prevents SQL injection, compile-time query validation
  - Migration strategy: Version-controlled, reversible migrations

### Frontend
- **Next.js 16 (App Router)** — React framework
  - Why: SEO for marketing pages, RSC for performance
  - Rendering: Server Components (data fetch) + Client Components (interactivity)

### Auth
- **Clerk** — Authentication platform
  - Why: SOC2 compliant, handles MFA, session management
  - Features: Email/password, OAuth (Google/Apple), magic links

### Payments
- **Stripe** — Payment processing
  - Why: PCI-DSS compliant, no need to handle card data directly
  - Features: Subscriptions, invoicing, webhooks

## Security Model

### Multi-Tenancy
- **Row-Level Security (RLS)** — PostgreSQL native
  - Every query automatically filters by `tenantId`
  - Prevents cross-tenant data leaks at DB level

### API Rate Limiting
- **100 req/min per user** (prevent abuse)
- **1000 req/min per tenant** (prevent DoS)
- Redis-backed (distributed rate limiting)

### Audit Logging
- **All financial actions logged** (compliance requirement)
  - Who, what, when, IP address, user agent
  - Immutable (append-only log table)
  - Retention: 7 years (standard for financial records)

### Encryption
- **Data at rest:** PostgreSQL encryption (AES-256)
- **Data in transit:** TLS 1.3 only
- **Secrets:** Environment variables (never commit)

## Data Model (High-Level)

### Core Entities
```
Tenant (company account)
└── Entity (business unit / subsidiary)
    ├── Account (bank, credit card)
    ├── Transaction (bank feed or manual)
    ├── Invoice (accounts receivable)
    ├── Bill (accounts payable)
    ├── Payment (allocations to invoices/bills)
    ├── GLAccount (chart of accounts)
    └── JournalEntry (double-entry bookkeeping)
```

### Financial Invariants
1. **Integer cents only** — Never floats (1050 = $10.50)
2. **Double-entry balanced** — SUM(debits) = SUM(credits) always
3. **Soft delete** — Financial records never hard deleted (audit trail)
4. **Source preservation** — Journal entries store source document snapshots

## Roadmap (6 Phases)

### Phase 1: Foundation (Weeks 1-2)
- Auth (Clerk integration)
- Multi-tenant core (Tenant, Entity models)
- Basic CRUD API
- Admin dashboard skeleton

### Phase 2: Banking (Weeks 3-4)
- Account management (bank, credit card)
- Transaction import (CSV, API integrations)
- Categorization (manual + AI-suggested)

### Phase 3: Invoicing (Weeks 5-6)
- Invoice CRUD (create, edit, send)
- Payment tracking
- Aging reports

### Phase 4: Payables + Bill Pay (Weeks 7-8)
- Bill management (vendor bills)
- Payment allocation
- Approval workflows

### Phase 5: Accounting (Weeks 9-10)
- Chart of Accounts
- Journal entries (auto-posting from invoices/bills)
- Trial balance, P&L, Balance Sheet

### Phase 6: Insights + AI (Weeks 11-12)
- Cash flow projection
- Budget vs actual
- AI-powered insights
```

### Generated: `/docs/DESIGN-SYSTEM.md`

```markdown
# Design System — Vibe Fintech App

## Design Principles

1. **Trust through clarity** — Financial data must be instantly readable
2. **Dark-first** — Reduce eye strain for power users (accountants spend hours daily)
3. **Accessible** — WCAG 2.1 AA compliance (global reach)
4. **Performance** — <2s page load (users compare 10+ transactions)

## Visual Language

### Color Palette

**Primary: Amber Orange** (#F59E0B)
- CTAs, brand accents, active states
- Psychology: Warmth, optimism, action

**Semantic Colors (Dark Mode Optimized):**
- Income/Green: #34D399 (Emerald 400)
- Expense/Red: #F87171 (Red 400)
- Transfer/Blue: #60A5FA (Blue 400)
- AI/Purple: #A78BFA (Purple 400)

**Surfaces (Dark):**
- bg-0: #09090F (page background)
- bg-1: #0F0F17 (cards, panels)
- bg-2: #15151F (elevated cards)
- bg-3: #1A1A26 (hover states)

**Glass Morphism:**
- glass-1: rgba(255,255,255,0.025) — default cards
- glass-2: rgba(255,255,255,0.04) — hover
- glass-3: rgba(255,255,255,0.06) — active

### Typography

**Headings:** Newsreader (serif, elegant)
- Signals: Authority, trustworthiness
- Use: Page titles, section headers

**Body:** Manrope (sans-serif, readable)
- Signals: Clarity, modernity
- Use: All UI text, labels

**Numbers:** JetBrains Mono (monospace)
- Signals: Precision, data integrity
- Use: ALL monetary amounts, dates, IDs

### Component Patterns

**Cards:**
- Glass background + subtle border
- 8px border-radius (consistent across all components)
- Hover: Border brightens, 1px lift

**Buttons:**
- 3 tiers: Ghost (transparent), Dim (primary-dim bg), Solid (primary bg)
- 8px border-radius
- Disabled: 50% opacity (never hide, always show state)

**Tables:**
- Sticky headers (long lists)
- Zebra striping (every other row)
- Hover row highlight
- Right-align numbers (easier to scan)

## Accessibility

**Keyboard Navigation:**
- All actions accessible via keyboard
- Focus indicators (2px outline, primary color)
- Skip links (skip to main content)

**Screen Readers:**
- ARIA labels on all icons
- Descriptive button text (not "Click here")
- Table headers properly marked

**Color Contrast:**
- Minimum 4.5:1 for text (WCAG AA)
- Tested with Stark plugin
```

### Generated: `/docs/SECURITY.md`

```markdown
# Security Model — Vibe Fintech App

## Threat Model

### Assets to Protect
1. **Financial PII** — Account numbers, transaction history, balances
2. **Auth credentials** — Passwords, session tokens, API keys
3. **Business secrets** — Profit margins, client lists, forecasts

### Threat Actors
1. **External attackers** — Data theft, ransomware, fraud
2. **Malicious users** — Cross-tenant access, data exfiltration
3. **Insiders** — Accidental leaks, over-privileged access

### Attack Vectors
1. **API abuse** — SQL injection, rate limit bypass, IDOR
2. **Auth bypass** — Session hijacking, credential stuffing
3. **Data leakage** — Cross-tenant queries, insecure exports

## Security Controls

### Authentication (Clerk)
- **MFA enforced** for financial admin roles
- **Session timeout:** 30 minutes idle, 8 hours absolute
- **Password policy:** 12+ chars, no common passwords
- **OAuth:** Google, Apple (avoid password reuse)

### Authorization (RBAC)
- **6 roles:** Owner, Admin, Manager, Accountant, Viewer, Auditor
- **Principle of least privilege** — Grant minimum access needed
- **Role escalation protected** — Only Owner can promote to Admin

### Input Validation (Zod)
- **All API inputs validated** — Type, length, format
- **Prisma prevents SQL injection** — Parameterized queries only
- **Sanitize user-generated content** — No XSS in comments/notes

### Rate Limiting
- **Global:** 10K req/min per IP
- **Per-user:** 100 req/min
- **Per-tenant:** 1000 req/min
- **Redis-backed** — Distributed across instances

### Audit Logging
- **Log all financial actions:**
  - Create/update/delete: Invoice, Bill, Payment, JournalEntry
  - Export: Reports, data dumps
  - Auth: Login, logout, role changes
- **Immutable** — Append-only log table
- **Retention:** 7 years (compliance)

### Data Encryption
- **At rest:** PostgreSQL encryption (AES-256)
- **In transit:** TLS 1.3 only (no TLS 1.2)
- **Secrets:** Environment variables (never commit to git)

## Compliance Checklist

### GDPR (EU users)
- [ ] Right to access (user can export their data)
- [ ] Right to deletion (anonymize, don't hard delete)
- [ ] Consent for data processing (terms acceptance)
- [ ] Data breach notification (72 hours)

### SOC2 (Enterprise customers)
- [ ] Audit logging (all changes tracked)
- [ ] Access controls (RBAC enforced)
- [ ] Encryption (at rest + in transit)
- [ ] Incident response plan (documented)

### PCI-DSS (Card data)
- [ ] Use Stripe (no direct card storage)
- [ ] No card numbers in logs/UI
- [ ] Tokenize payment methods
```

### Generated: `/docs/DATA-MODEL.md`

```markdown
# Data Model — Vibe Fintech App

## Entity Relationship Diagram

```
Tenant (1) ──────── (*) Entity
                        │
                        ├── (*) Account
                        ├── (*) Transaction
                        ├── (*) Invoice
                        ├── (*) Bill
                        ├── (*) Payment
                        ├── (*) GLAccount
                        └── (*) JournalEntry
                              └── (*) JournalLine
```

## Core Models

### Tenant (Multi-tenant root)
```prisma
model Tenant {
  id            String   @id @default(cuid())
  name          String
  subscription  String   // FREE, PRO, ENTERPRISE
  entities      Entity[]
  createdAt     DateTime @default(now())
}
```

### Entity (Business unit)
```prisma
model Entity {
  id              String   @id @default(cuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  name            String
  currency        String   @default("USD")
  fiscalYearEnd   String   // "12-31"
  accounts        Account[]
  invoices        Invoice[]
  // ... other relations

  @@index([tenantId])
}
```

### Account (Bank, credit card)
```prisma
model Account {
  id              String   @id @default(cuid())
  entityId        String
  entity          Entity   @relation(fields: [entityId], references: [id])
  name            String   // "Chase Business Checking"
  type            AccountType  // BANK, CREDIT_CARD, CASH
  currency        String
  currentBalance  Int      // Integer cents!
  transactions    Transaction[]

  @@index([entityId])
  @@index([entityId, type])
}
```

### Transaction (Bank feed or manual)
```prisma
model Transaction {
  id              String   @id @default(cuid())
  accountId       String
  account         Account  @relation(fields: [accountId], references: [id])
  date            DateTime
  description     String
  amount          Int      // Integer cents (1050 = $10.50)
  currency        String
  category        String?  // "Office Supplies", "Client Payment"
  status          TransactionStatus  // PENDING, POSTED, RECONCILED

  @@index([accountId, date])
  @@index([accountId, status])
}
```

### Invoice (Accounts receivable)
```prisma
model Invoice {
  id              String   @id @default(cuid())
  entityId        String
  entity          Entity   @relation(fields: [entityId], references: [id])
  clientId        String
  invoiceNumber   String
  issueDate       DateTime
  dueDate         DateTime
  amount          Int      // Integer cents
  currency        String
  status          InvoiceStatus  // DRAFT, SENT, PAID, OVERDUE, VOID
  payments        Payment[]
  journalEntry    JournalEntry?
  deletedAt       DateTime?  // Soft delete!

  @@index([entityId, status])
  @@index([entityId, dueDate])
}
```

### JournalEntry (Double-entry bookkeeping)
```prisma
model JournalEntry {
  id              String   @id @default(cuid())
  entityId        String
  entity          Entity   @relation(fields: [entityId], references: [id])
  date            DateTime
  description     String
  sourceType      String?  // "INVOICE", "BILL", "MANUAL"
  sourceId        String?
  sourceDocument  Json?    // Full snapshot of source
  status          JournalEntryStatus  // DRAFT, POSTED, VOID
  lines           JournalLine[]
  deletedAt       DateTime?

  @@index([entityId, date])
  @@index([entityId, status])
}

model JournalLine {
  id              String   @id @default(cuid())
  journalEntryId  String
  journalEntry    JournalEntry @relation(fields: [journalEntryId], references: [id])
  glAccountId     String
  glAccount       GLAccount @relation(fields: [glAccountId], references: [id])
  debitAmount     Int      // 0 if credit
  creditAmount    Int      // 0 if debit

  @@index([journalEntryId])
  @@index([glAccountId])
}
```

## Financial Invariants (CRITICAL)

### 1. Integer Cents Only
```typescript
// ✅ CORRECT
const amount = 1050; // $10.50

// ❌ WRONG
const amount = 10.50; // Float precision errors!
```

### 2. Double-Entry Balanced
```typescript
// Every journal entry MUST satisfy:
SUM(lines.debitAmount) === SUM(lines.creditAmount)

// Validate before creating:
function createJournalEntry(entry: JournalEntry) {
  const debits = entry.lines.reduce((sum, l) => sum + l.debitAmount, 0);
  const credits = entry.lines.reduce((sum, l) => sum + l.creditAmount, 0);

  if (debits !== credits) {
    throw new Error('Journal entry not balanced!');
  }

  // ...
}
```

### 3. Soft Delete Only
```typescript
// ✅ CORRECT — Soft delete
await prisma.invoice.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// ❌ WRONG — Hard delete (loses audit trail!)
await prisma.invoice.delete({ where: { id } });
```

### 4. Source Preservation
```typescript
// When creating journal entry from invoice:
const journalEntry = await prisma.journalEntry.create({
  data: {
    sourceType: 'INVOICE',
    sourceId: invoice.id,
    sourceDocument: JSON.stringify(invoice), // Full snapshot!
    // ...
  }
});
```

## Migration Strategy

### Prisma Migrations
```bash
# Create migration
npx prisma migrate dev --name add_invoice_model

# Apply to production
npx prisma migrate deploy
```

### Rollback Safety
- **Never drop columns with financial data**
- **Add columns as nullable first** (backfill later)
- **Test rollback in staging**

### Data Backfill
```sql
-- Example: Backfill missing currency fields
UPDATE "Transaction"
SET currency = 'USD'
WHERE currency IS NULL;
```
```

---

## Updated CLAUDE.md (Generated)

After architecture generation, CLI updates `/CLAUDE.md` to reference all generated docs:

```markdown
# Vibe Fintech App — Claude Context

## Project Overview

**Vibe Fintech App** is a financial command center for solopreneurs managing global finances.

**Tech Stack:** Next.js 16, Fastify, PostgreSQL, Prisma, Clerk
**Domain:** Fintech (double-entry accounting, multi-currency, compliance)
**Team:** Starting solo, scaling to 2-5 in 6 months

---

## Architecture Reference

**Deep-dive:** See `/docs/ARCHITECTURE.md`

**Key Decisions:**
- Fastify for API (high-throughput)
- PostgreSQL for ACID compliance
- Prisma for type-safe queries
- Clerk for SOC2-compliant auth

---

## Financial Invariants (ZERO EXCEPTIONS)

1. **Integer Cents** — All amounts are integer cents (1050 = $10.50)
2. **Double-Entry** — SUM(debits) = SUM(credits) always
3. **Soft Delete** — Financial records use `deletedAt`, never hard delete
4. **Source Preservation** — Journal entries store source document snapshots

**Reference:** `/docs/DATA-MODEL.md` (Financial Invariants section)

---

## Security Model

**Reference:** `/docs/SECURITY.md`

**Critical:**
- Multi-tenant isolation (row-level security)
- API rate limiting (100 req/min per user)
- Audit logging (all financial actions)
- Encryption at rest + in transit

---

## Design System

**Reference:** `/docs/DESIGN-SYSTEM.md`

**Quick rules:**
- Dark-first design (reduce eye strain)
- Glass morphism components
- Numbers ALWAYS use monospace font (JetBrains Mono)
- 8px border-radius (consistent)

---

## Roadmap

**Reference:** `/docs/ROADMAP.md`

**Current Phase:** Phase 1 (Foundation)
**Next:** Phase 2 (Banking)

---

## Key Conventions

See `.claude/rules/` for detailed conventions:
- `financial-rules.md` — Double-entry, integer cents, soft delete
- `api-conventions.md` — Route → Schema → Service pattern
- `frontend-conventions.md` — Server/Client component separation

---

_Auto-generated by @claude/bootstrap on 2026-02-21_
```

---

## Key Features

### What Makes This Powerful

1. **Zero Akount Coupling**
   - All generated docs are project-specific
   - Modules are swappable (fintech → health → e-commerce)
   - No mentions of "Akount" unless user's project IS fintech

2. **Comprehensive Architecture Guidance**
   - Not just Claude setup, but FULL project architecture
   - Tech stack recommendations with rationale
   - Security model tailored to domain
   - Data model with financial invariants

3. **Scales to Complexity**
   - Idea Stage: Full architecture + Claude setup (comprehensive)
   - PRD Stage: Implementation setup + validation
   - Code Stage: Analysis + configuration

4. **Community-Driven Modules**
   - Anyone can contribute domain modules (gaming, logistics, etc.)
   - Stack modules updated by community (Vue, Svelte, etc.)
   - Best practices evolve over time

---

## Domain Impact

**Primary Domains:**
- Developer Tools (CLI, code generation)
- Project Management (architecture docs, roadmaps)
- Education (teaches best practices via generated docs)

**Adjacent Domains:**
- Community (module contributions)
- Documentation (comprehensive generated docs)

---

## Review Concerns (Phase 2.5)

### Security Sentinel
- Generated security rules must be conservative (fail-safe)
- Don't generate actual secrets/tokens (only placeholders)
- Include security checklist for user review

### Architecture Strategist
- Tech stack recommendations must have clear rationale
- Alternatives should be documented ("Why not X?")
- Avoid over-engineering for MVPs

### Code Simplicity Reviewer
- Generated setup should be minimal for "Idea Stage"
- No unused modules or bloat
- YAGNI principle applies

---

## Alternatives Considered

### Alternative 1: Template Repo Only
**Why not chosen:**
- Requires manual customization (tedious)
- No Idea Stage support (no architecture generation)
- One-size-fits-all doesn't work

### Alternative 2: Fully LLM-Powered (No Modules)
**Why not chosen:**
- Non-deterministic (same input, different output)
- Requires API key + costs money
- Slower (10-15 min generation)
- Quality variance

### Alternative 3: SaaS Web App
**Why not chosen:**
- Requires internet (can't work offline)
- Vendor lock-in
- Harder to extend/customize

---

## Open Questions

1. **Should CLI be LLM-powered or template-based?**
   - LLM: More flexible, costs money, requires API key
   - Template: Faster, offline, deterministic
   - **Hybrid?** Templates for structure, LLM for content?

2. **How to encode design system generation?**
   - Generate actual color palettes? (requires design AI)
   - Generate principles + let user customize? (safer)
   - Pull from existing design systems? (fastest)

3. **Licensing model?**
   - Open source (Apache/MIT)?
   - Freemium (basic free, advanced paid)?
   - Fully free (Anthropic-sponsored)?

4. **Build vs extend?**
   - Is there existing tool we can extend?
   - Or build from scratch?

---

## Next Steps

### Option 1: Build MVP (2-Week Sprint)
- **Week 1:** CLI scaffolding + Code Stage support
  - Auto-detect tech stack
  - Generate universal + stack modules
  - Validate with 3 existing codebases

- **Week 2:** Idea Stage architecture generation
  - 5-domain support (fintech, health, e-commerce, saas, generic)
  - Generate ARCHITECTURE.md, SECURITY.md, DATA-MODEL.md
  - Validate with 3 greenfield projects

### Option 2: RFC + Community Validation
- Write comprehensive RFC (30-40 pages)
- Share with Claude Code community
- Gauge interest before building
- Collect domain module contributions

### Option 3: Partner with Anthropic
- Pitch as official Claude Code bootstrap tool
- Get distribution + official support
- May take longer (corporate process)

---

**Recommendation:** Option 1 (Build MVP) — Fastest path to validation, 2 weeks to working prototype.

---

_Brainstorm complete. Ready for `/processes:plan` when approved._
