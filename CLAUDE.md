# Akount Project - Agent Context

> **Purpose:** This file is automatically loaded by Claude Code at the start of every conversation.
> It provides essential context about documentation, architecture, standards, and constraints.
> Keep this concise - link to detailed docs rather than including full content here.

**Last Updated:** 2026-02-01
**Project:** Akount - Multi-tenant Accounting Platform for Canadian Freelancers
**Current Phase:** Phase 0 Complete (100%) - Bank Statement Import Feature Added

---

## 🏗️ Architecture & Technical Decisions

### Core Architecture Documents
- **`docs/architecture/decisions.md`** - Tech stack choices and rationale (Next.js 16, Fastify, PostgreSQL)
- **`docs/architecture/summary.md`** - Architecture evolution approach (phase-by-phase hooks)
- **`docs/architecture/ARCHITECTURE-HOOKS.md`** - Future-proof hooks inventory and activation guide
- **`docs/architecture/schema-design.md`** - Database design patterns and Prisma conventions
- **`docs/architecture/processes.md`** - Development workflows and deployment processes
- **`docs/architecture/operations.md`** - Operational procedures, security, and compliance

### Critical Architectural Principles

**1. Multi-Tenancy (ZERO EXCEPTIONS)**
```typescript
// ALWAYS filter by tenantId - NO EXCEPTIONS
const entities = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})
```
- ALL queries MUST include `tenantId` filter
- Middleware enforces tenant isolation
- See: `docs/standards/multi-tenancy.md`

**2. Server-First Architecture**
- Maximize React Server Components (default)
- Only use `'use client'` when absolutely necessary (interactivity, hooks, browser APIs)
- Data fetching happens on server
- Prefer Server Components for data fetching, Client Components for interactivity

**3. Integer Cents for Money (NEVER Float)**
```typescript
// CORRECT: Store money as integer cents
amount: Int // 1000 = $10.00

// WRONG: Never use Float for money
amount: Float // Precision errors destroy accounting integrity
```
- All monetary values stored as `Int` (cents)
- Division ONLY for display
- See: `docs/standards/financial-data.md`

**4. Monorepo Structure**
```
apps/
  web/     - Next.js 16 frontend (port 3000)
  api/     - Fastify backend (port 4000)
packages/
  db/      - Prisma schema & migrations
  types/   - Shared TypeScript types
  ui/      - Shared UI components
```
- Turborepo for build orchestration
- Shared packages via workspace protocol

---

## 📊 Product Context

### What We're Building
- **`docs/product/overview.md`** - Product vision, target users (Canadian freelancers), value proposition
- **`docs/product/data-model/README.md`** - Complete database schema explanation (40+ Prisma models)

### Data Model Overview
**40+ Prisma Models across 7 categories:**
- **Multi-tenancy:** Tenant, TenantUser, User
- **Financial Core:** Entity, GLAccount, JournalEntry, JournalLine
- **Banking:** Account, BankConnection, BankFeedTransaction
- **Transactions:** Transaction, TransactionSplit, TransactionMatch
- **Invoicing:** Invoice, InvoiceLine, Bill, BillLine, Payment, PaymentAllocation
- **Relationships:** Client, Vendor
- **Supporting:** Category, Budget, Goal, FiscalCalendar, Tag, Rule, Attachment, AuditLog

**Key Schema Patterns:**
- Soft deletes (`deletedAt`) - NEVER hard delete financial data
- Audit trails (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`)
- Multi-currency ready (`baseCurrency`, `functionalCurrency`)
- Source tracking (`sourceType`, `sourceId`, `sourceDocument`)

### Feature Specifications (7 Phases)
- **`docs/features/01-accounts-overview.md`** - Dashboard, accounts list, entity filter
- **`docs/features/02-bank-reconciliation.md`** - Bank feeds, reconciliation, Flinks integration
- **`docs/features/03-transactions-bookkeeping.md`** - Transaction entry, categorization, journal posting
- **`docs/features/04-invoicing-bills.md`** - Invoice creation, payment tracking, aging reports
- **`docs/features/05-analytics.md`** - Reports, charts, financial insights
- **`docs/features/06-planning.md`** - Budgets, forecasting, goals
- **`docs/features/07-ai-financial-advisor.md`** - AI categorization, insights, rule suggestions

---

## 📍 Current State & Progress

### What's Implemented (Phase 0 - 100% Complete)
**See:** `STATUS.md` (updated weekly), `ROADMAP.md` (phase plan), `TASKS.md` (daily work)

**✅ Completed:**
- Authentication (Clerk with passkeys/WebAuthn)
- Database (PostgreSQL + Prisma, 40+ models, migrations, seed data)
- API Foundation (Fastify + Clerk JWT auth + Zod validation)
- First Vertical Slice (GET /api/entities with frontend display)
- Bank Statement Import (PDF parsing, account matching, duplicate detection)

**Current Work:**
- Bank statement import enhancements
- Frontend dashboard improvements
- Transaction categorization

**Next Phase:** Phase 1 - Accounts Overview (dashboard with real data)

### Recent Milestones
**See:** `CHANGELOG.md` (milestone tracking)
- 2026-01-31: Claude Code configuration optimized (hooks, permissions, documentation)
- 2026-01-30: Bank statement import feature added (PDF parsing, intelligent account matching)
- 2026-01-29: Architecture hooks documented, backup system implemented
- 2026-01-27: Phase 0 foundation complete (auth + database + API)

---

## 📐 Standards & Conventions

### Akount Standards (Domain Patterns)
**Location:** `docs/standards/`

Domain-specific patterns for accounting platform:
- **`multi-tenancy.md`** - Tenant isolation enforcement, query patterns, middleware (CRITICAL)
- **`financial-data.md`** - Double-entry bookkeeping, money handling, audit trails (CRITICAL)
- **`api-design.md`** - Fastify route patterns, error handling, validation schemas
- **`security.md`** - OWASP Top 10 for Akount, input validation, sensitive data (CRITICAL)
- **`README.md`** - Standards overview and usage guide

**Total:** 2,073 lines of domain-specific guidance for accounting software development

### Design System
**Location:** `docs/design-system/`
- **`tailwind-colors.md`** - Color palette (Orange primary, Violet secondary, Slate neutral)
- **`fonts.md`** - Typography system (Newsreader, Manrope, JetBrains Mono)
- **`tokens.css`** - CSS custom properties

---

## 🔎 Smart Skill Discovery

**Before starting any task, check if these skills apply:**

**Planning & Design:**
- Feature unclear? → `/processes:brainstorm` or `brainstorm`
- Ready to plan? → `/processes:plan` or `plan`
- Need to enhance plan? → `/deepen-plan` or `enhance-plan`
- Validate plan? → `/plan_review` or `review-plan`

**Implementation:**
- Start development? → `/processes:work` or `work`
- Need to fix PR comments? → `/resolve_pr_parallel` or `fix-pr`

**Quality & Review:**
- Code complete? → `/processes:review` or `review`
- Check brand voice? → `/quality:brand-voice-check` or `brand-check`
- Check design system? → `/quality:design-system-enforce` or `design-check`
- Check test coverage? → `/quality:test-coverage-analyze` or `test-gaps`
- Check accessibility? → `/quality:a11y-review` or `a11y-check`

**Documentation:**
- Create changelog? → `/changelog` or `generate-changelog`
- Document solution? → `/processes:compound` or `compound`

**Session Start:**
- New session? → `/processes:begin` or `begin`

**Not sure which skill?** Use aliases (shorter names work) or ask!

---

## 🤖 Available Agents & Workflows

### Review Agents (15 Specialized Agents)
**Location:** `.claude/agents/review/`
**Master Index:** `.claude/agents/review/README.md`
**Configuration:** See `.claude/agents/REGISTRY.json` for complete metadata

**Key agents:**
- `financial-data-validator` - Double-entry bookkeeping, money precision, audit trails
- `architecture-strategist` - System design, multi-tenant validation, component boundaries
- `security-sentinel` - OWASP Top 10, tenant isolation, input validation
- `prisma-migration-reviewer` - Schema safety, migration validation, breaking changes
- `kieran-typescript-reviewer` - Strict TypeScript, modern patterns, type safety
- `performance-oracle` - N+1 queries, algorithmic complexity, caching strategies

**Maintenance:** Run `bash .claude/hooks/validate-config.sh` to validate configuration.

**See `.claude/agents/review/README.md` for complete list (15 agents) and usage examples.**

### Development Workflows
**Location:** `.claude/commands/processes/`
**Master Guide:** `.claude/commands/processes/README.md`

**Structured Development Process:**
```
Idea → /processes:brainstorm → /processes:plan → /processes:work → /processes:review → Merge
```

**Available Workflows:**
- `/processes:brainstorm` - Feature exploration and requirements gathering
- `/processes:plan` - Implementation planning with architectural decisions
- `/processes:work` - Systematic development execution
- `/processes:review` - Multi-agent code review
- `/processes:compound` - Document solved problems for organizational knowledge
- `/processes:begin` - Session startup dashboard

**See `.claude/commands/processes/README.md` for detailed workflow documentation.**

---

## 🚨 Critical Constraints & Rules

### Security (ZERO TOLERANCE)

**1. Tenant Isolation**
```typescript
// NEVER allow cross-tenant data access
// ALWAYS include tenantId in WHERE clauses
// ALWAYS validate tenantId matches authenticated user

// CORRECT:
const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    tenantId: user.tenantId // REQUIRED
  }
})

// WRONG: Missing tenantId check (security vulnerability)
const invoice = await prisma.invoice.findFirst({
  where: { id: invoiceId }
})
```

**2. Input Validation**
- ALWAYS validate user input with Zod schemas
- NEVER trust client data
- ALWAYS sanitize before database queries
- See: `docs/standards/security.md`

**3. Sensitive Data**
- NEVER log tokens, passwords, or PII
- NEVER commit secrets to git (use .env)
- ALWAYS use HTTPS/TLS in production

### Financial Data (ACCOUNTING INTEGRITY)

**1. Money Precision**
```typescript
// CORRECT: Integer cents
const amount = 1050 // $10.50

// WRONG: Float (precision errors)
const amount = 10.50 // BAD - will cause rounding errors
```

**2. Double-Entry Bookkeeping**
```typescript
// ALWAYS maintain: SUM(debits) = SUM(credits)
const journalEntry = await prisma.journalEntry.create({
  data: {
    lines: {
      create: [
        { glAccountId: '...', debitAmount: 1000, creditAmount: 0 },  // Debit $10.00
        { glAccountId: '...', debitAmount: 0, creditAmount: 1000 },  // Credit $10.00
      ]
    }
  }
})
// Validate: debits (1000) = credits (1000) ✓
```

**3. Audit Trails**
- NEVER delete financial data (use soft delete: `deletedAt`)
- ALWAYS preserve source documents (`sourceDocument` JSON field)
- ALWAYS track who/when/what/why (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`)
- See: `docs/standards/financial-data.md`

### Database (DATA INTEGRITY)

**1. Transactions for Multi-Table Updates**
```typescript
// CORRECT: Use transaction
await prisma.$transaction(async (tx) => {
  await tx.journalEntry.create(...)
  await tx.transaction.update(...)
  await tx.account.update(...)
})

// WRONG: Separate operations (can leave inconsistent state)
await prisma.journalEntry.create(...)
await prisma.transaction.update(...)
await prisma.account.update(...) // What if this fails?
```

**2. Soft Deletes Only**
```typescript
// CORRECT: Soft delete
await prisma.invoice.update({
  where: { id },
  data: { deletedAt: new Date() }
})

// WRONG: Hard delete (destroys audit trail)
await prisma.invoice.delete({ where: { id } })
```

**3. TenantId in ALL Queries**
- See Multi-Tenancy section above
- See: `docs/standards/multi-tenancy.md`

---

## 📚 Additional Resources

### Setup & Installation
**Location:** `docs/setup/`
- `backup-security.md` - Comprehensive backup and security guide
- `database-setup.md` - PostgreSQL and Prisma setup
- `next-steps.md` - Post-installation next steps

### Development Guides
**Location:** `docs/guides/`
- `quick-start-agents.md` - Getting started with custom agents
- `custom-agents-templates.md` - Agent creation templates
- `tracking-guide.md` - How to maintain STATUS, TASKS, ROADMAP
- `passkey-auth.md` - WebAuthn implementation guide

### Configuration & Hooks
**Location:** `.claude/`
- `PERMISSIONS-REFERENCE.md` - Permission structure explanation
- `MCP-SERVERS.md` - MCP server configuration guide
- `hooks/` - File protection, validation, auto-format hooks
- `settings.local.json` - Claude Code configuration

### Session Archives
**Location:** `docs/archive/sessions/`
- Historical session reports (WEEK_*.md)
- Completed code reviews (CODE_REVIEW_REPORT.md)
- Feature performance reviews (PERFORMANCE_REVIEW_*.md)
- Engineering analyses (COMPOUND_ENGINEERING_*.md)

### Exploration & Planning
**Location:** `docs/brainstorms/` and `docs/plans/`
- Feature brainstorms (timestamped)
- Implementation plans (timestamped)
- Solution designs

---

## 🎯 Quick Reference

### For New Agents Starting a Task
1. Read this file (CLAUDE.md) - you're doing it now! ✓
2. Check `STATUS.md` - what's implemented?
3. Check `ROADMAP.md` - what phase are we in?
4. Read relevant feature spec in `docs/features/`
5. Review architectural decisions in `docs/architecture/`
6. Review relevant standards in `docs/standards/` (multi-tenancy, financial, security, API)

### For Code Reviews
1. Use specialized review agents from `.claude/agents/review/`
2. **Financial code?** → `financial-data-validator`
3. **Architecture changes?** → `architecture-strategist`
4. **Security concerns?** → `security-sentinel`
5. **Schema changes?** → `prisma-migration-reviewer`
6. **TypeScript patterns?** → `kieran-typescript-reviewer`
7. **Performance issues?** → `performance-oracle`

### For Finding Information
- **Architecture decisions?** → `docs/architecture/decisions.md`
- **How does X model work?** → `docs/product/data-model/README.md`
- **What are the coding standards?** → `docs/standards/` (comprehensive domain standards)
- **What's the feature spec?** → `docs/features/`
- **Current progress?** → `STATUS.md`
- **What to work on?** → `TASKS.md`

---

## 💡 Development Philosophy

**"Architecture for scale, implement for lean"**

- Build MVP first, activate advanced features later
- Schema includes architectural hooks (optional fields) for future features
- No premature optimization or over-engineering
- Clear phase-by-phase evolution (see: `docs/architecture/summary.md`)
- Every decision documented in `docs/architecture/`

**Key Patterns:**
- Server-first (maximize Server Components)
- Progressive enhancement (basic → advanced)
- Convention over configuration
- Type safety everywhere (TypeScript + Zod + Prisma)

---

## 🤔 Decision-Making Protocol (CRITICAL)

**ALWAYS STOP AND ASK when:**
- Requirements are ambiguous or unclear
- Multiple valid approaches exist with tradeoffs
- User preference matters (style, architecture, naming)
- Business logic is unclear
- Destructive action proposed (delete, overwrite, major refactor)
- Security/compliance implications unknown
- Financial calculations involved
- Multi-tenant isolation concerns

**Example good questions:**
- "I found 3 approaches. Want quick/simple or robust/scalable?"
- "Should this support multi-currency initially or just CAD?"
- "Found similar pattern in X. Reuse that or create new?"

**Example bad behavior (DON'T DO THIS):**
- Assuming requirements without asking
- Picking approach without presenting alternatives
- Guessing business rules
- Making architectural decisions unilaterally

**Philosophy:** Better to ask 5 questions than implement wrong solution.

---

## 🔍 Search-First Development (MANDATORY)

**Before creating anything new, CHECK:**

1. **Documentation Search:**
   ```bash
   Grep "feature-name" docs/
   ls docs/brainstorms/ docs/plans/
   ```

2. **Codebase Pattern Search:**
   ```bash
   Grep "similar-pattern" apps/ packages/
   Glob "**/*similar*.ts*"
   ```

3. **Git History:**
   ```bash
   git log --grep="feature-name" --oneline
   git log --all --full-history -- "**/filename*"
   ```

4. **Existing Skills/Agents:**
   - Check `.claude/SKILLS-INDEX.md`
   - Review `.claude/agents/review/README.md`

5. **Ask User:**
   - "Found X in codebase. Should I extend it or create new?"
   - "Similar feature in git history. Use that approach?"

**NEVER:**
- Create duplicates without checking first
- Ignore git history and existing solutions
- Assume something doesn't exist without searching

**Example:**
User: "Add invoice PDF generation"
Claude: *searches first* "Found PDFAttachment model and import parsing code. Should invoice PDF use similar approach or different?"

---

## 💡 Proactive Optimization (SUGGEST BETTER)

**Before implementing, CONSIDER:**

1. **Is there a simpler approach?**
   - "You asked for X with 5 steps. I can achieve 80% value with 2 steps. Which do you prefer?"

2. **Does it follow existing patterns?**
   - "Found 3 similar implementations. Use pattern Y for consistency?"

3. **Can we avoid over-engineering?**
   - "This adds 200 lines. Do you need all features now or start with core?"

4. **Cost/performance implications?**
   - "This works but might be slow with 10K+ records. Want optimization or acceptable?"

5. **Alternative technologies?**
   - "Could use library X (maintained) instead of custom code. Preference?"

**Present options, explain tradeoffs, LET USER DECIDE.**

**Don't:**
- Silently implement what you think is better
- Override user's explicit instructions without discussion
- Add features not requested (YAGNI)

**Do:**
- Suggest simplifications
- Point out pattern inconsistencies
- Highlight potential issues
- Respect user's final decision

---

## 🏗️ Meta-Skills: Creating Skills & Agents

**Recognize when to suggest skill creation:**

**Triggers for "Should we create a skill?":**
- User repeats same sequence 3+ times in session
- User says "I wish there was a command for..."
- Task takes >5 steps but is repeatable
- Multiple similar requests across sessions
- Pattern would benefit future work

**When you recognize these, ASK:**
> "I notice you're doing [X] repeatedly. Should we create a `/custom-skill` for this? It would:
> - Save time (5 steps → 1 command)
> - Ensure consistency
> - Make it reusable
>
> Would take ~15 mins to create. Want to?"

**Creating New Skills:**
1. Check `.claude/guides/SKILL_CREATION_GUIDE.md` for decision tree
2. Use templates from `.claude/templates/`
3. Follow naming conventions
4. Test independently
5. Register in SKILLS-INDEX.md

**Creating New Agents:**
1. Use templates from `docs/guides/custom-agents-templates.md`
2. Choose appropriate tier (Haiku/Sonnet/Opus)
3. Add to agent README
4. Test with sample code

**Key principle:** If you're doing it repeatedly, automate it.

---

## 📞 Getting Help

**Questions about:**
- **Architecture?** → Read `docs/architecture/ARCHITECTURE-HOOKS.md`
- **Schema?** → Read `docs/product/data-model/README.md`
- **Standards?** → Read `docs/standards/` (multi-tenancy, financial, security, API)
- **Current work?** → Check `TASKS.md` or `STATUS.md`
- **How to use agents?** → Read `.claude/agents/review/README.md`
- **Configuration?** → Read `.claude/PERMISSIONS-REFERENCE.md` and `.claude/MCP-SERVERS.md`

**Not sure where to start?**
→ Use `/processes:begin` to see session startup dashboard

---

**End of Agent Context**
**This file is version controlled and updated as the project evolves.**
**Last significant update: 2026-02-01 (Behavior protocols: decision-making, search-first, proactive optimization, meta-skills)**
