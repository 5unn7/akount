# Phase 6: Documentation Cleanup

**Days:** 9-12
**Status:** ✅ COMPLETE (2026-02-05)
**Dependencies:** Phase 0 must be complete ✅
**Can Parallel With:** Phase 4 (API), Phase 5 (Web)

---

## Objectives

1. Delete superseded documentation
2. Consolidate redundant files
3. Establish new docs/ structure
4. Rewrite CLAUDE.md to reference new structure

---

## Tasks

### 6.1 Archive Pre-Restructure Files

Before deleting, archive everything:

- [ ] Create archive directory:
  ```bash
  mkdir -p docs/archive/pre-restructure
  ```

- [ ] Archive superseded docs:
  ```bash
  # Features folder (superseded by design-system/03-screens/)
  mv docs/features docs/archive/pre-restructure/features

  # Old architecture docs
  mv docs/architecture/evolution.md docs/archive/pre-restructure/
  mv docs/architecture/PHASED-EXTRACTION-GUIDE.md docs/archive/pre-restructure/
  mv docs/architecture/ARCHITECTURE-DECISION-SUMMARY.md docs/archive/pre-restructure/
  mv docs/architecture/VISUAL-ARCHITECTURE-GUIDE.md docs/archive/pre-restructure/
  mv docs/architecture/1M-USER-ARCHITECTURE-REVIEW.md docs/archive/pre-restructure/

  # Old design system
  mv docs/design-system/old docs/archive/pre-restructure/design-system-old

  # Outdated plans
  mv docs/plans/2026-01-31-*.md docs/archive/pre-restructure/
  ```

- [ ] Create archive README:
  ```bash
  cat > docs/archive/pre-restructure/README.md << 'EOF'
  # Pre-Restructure Archive

  **Archived:** 2026-02-XX
  **Reason:** Superseded by design-system restructure

  ## Contents

  - `features/` - Old feature specs (now in design-system/03-screens/)
  - `design-system-old/` - Legacy design system docs
  - `*.md` - Old architecture and planning docs

  ## Why Archived (Not Deleted)

  These files contain historical context and decisions that may be
  useful for understanding past approaches. They are preserved for
  reference but are no longer authoritative.

  ## Authoritative Sources

  - UI/UX: `docs/design-system/`
  - Implementation: `docs/standards/`
  - Architecture: `docs/architecture/`
  EOF
  ```

---

### 6.2 Delete Redundant Files

After archiving, these locations should be empty or removed:

- [ ] Remove old design-system folder:
  ```bash
  rm -rf docs/design-system/old
  ```

- [ ] Remove features folder (already archived):
  ```bash
  # Verify archived first, then remove if exists
  [ -d docs/archive/pre-restructure/features ] && rm -rf docs/features
  ```

- [ ] Remove legacy .agent folder (if exists):
  ```bash
  rm -rf .agent
  ```

---

### 6.3 Consolidate Documentation

#### 6.3.1 Product Documentation

- [ ] Consolidate to single `docs/product/README.md`:
  ```markdown
  # Akount Product Overview

  > **Last Updated:** 2026-02-XX

  ## What is Akount?

  Akount is an **AI-powered financial command center** for globally-operating
  solopreneurs. It combines multi-entity accounting, multi-currency support,
  and AI-powered insights into a single platform.

  ## Target Users

  - **Founders** operating businesses across multiple countries
  - **Freelancers** with clients in multiple currencies
  - **Accountants** managing client books with AI assistance

  ## Key Features

  See `docs/design-system/03-screens/` for detailed feature specifications.

  ## Data Model

  See `docs/architecture/schema-design.md` for database design.

  ## Design Vision

  See `docs/design-system/00-foundations/philosophy.md` for design philosophy.
  ```

- [ ] Remove old product files if they exist separately

#### 6.3.2 Setup Documentation

- [ ] Consolidate to single `docs/guides/setup.md`:
  ```markdown
  # Development Setup Guide

  > **Last Updated:** 2026-02-XX

  ## Prerequisites

  - Node.js 20+
  - pnpm 8+
  - PostgreSQL 15+
  - Clerk account (for auth)

  ## Quick Start

  ```bash
  # Clone repository
  git clone <repo-url>
  cd akount

  # Install dependencies
  pnpm install

  # Set up environment
  cp .env.example .env
  # Edit .env with your credentials

  # Set up database
  pnpm db:push
  pnpm db:seed

  # Start development
  pnpm dev
  ```

  ## Environment Variables

  See `.env.example` for all required variables.

  ## Services

  - **Web:** http://localhost:3000 (Next.js)
  - **API:** http://localhost:4000 (Fastify)

  ## Database

  - Schema: `packages/db/prisma/schema.prisma`
  - Migrations: `packages/db/prisma/migrations/`

  ## Troubleshooting

  ### Common Issues

  1. **Database connection failed**
     - Check PostgreSQL is running
     - Verify DATABASE_URL in .env

  2. **Clerk auth errors**
     - Verify CLERK_SECRET_KEY in .env
     - Check Clerk dashboard for API keys

  3. **Build errors**
     - Run `pnpm install` to update dependencies
     - Clear `.next` and `node_modules` if needed
  ```

- [ ] Remove old setup files:
  ```bash
  rm -f docs/setup/backup-security.md
  rm -f docs/setup/database-setup.md
  rm -f docs/setup/next-steps.md
  # Keep only docs/guides/setup.md
  ```

---

### 6.4 Establish New docs/ Structure

Final structure should be:

```
docs/
├── restructuring/              <- Phase execution plans (current)
│   ├── README.md
│   ├── phase-0-audit.md
│   ├── phase-1-foundation.md
│   ├── phase-2-ui-components.md
│   ├── phase-3-security.md
│   ├── phase-4-api-restructure.md
│   ├── phase-5-web-restructure.md
│   ├── phase-6-docs-cleanup.md
│   └── phase-7-agents-update.md
│
├── design-system/              <- UI/UX specifications
│   ├── README.md
│   ├── 00-foundations/
│   ├── 01-components/
│   ├── 02-patterns/
│   ├── 03-screens/
│   ├── 04-workflows/
│   ├── 05-governance/
│   ├── 06-compliance/
│   └── 07-reference/
│
├── standards/                  <- Implementation rules
│   ├── README.md               <- Links to design-system
│   ├── api-design.md
│   ├── financial-data.md
│   ├── multi-tenancy.md
│   └── security.md
│
├── architecture/               <- Technical decisions
│   ├── README.md
│   ├── decisions.md
│   └── schema-design.md
│
├── guides/                     <- How-to guides
│   ├── setup.md
│   └── contributing.md
│
├── product/                    <- Product overview
│   └── README.md
│
└── archive/                    <- Historical
    ├── pre-restructure/
    └── sessions/
```

- [ ] Create/update `docs/README.md`:
  ```markdown
  # Akount Documentation

  > **Last Updated:** 2026-02-XX
  > **Source of Truth:** This docs/ folder

  ## Documentation Structure

  | Folder | Purpose | When to Use |
  |--------|---------|-------------|
  | `design-system/` | UI/UX specifications | Building features, reviewing UI |
  | `standards/` | Implementation rules | Writing code, code reviews |
  | `architecture/` | Technical decisions | Understanding system design |
  | `guides/` | How-to guides | Onboarding, setup |
  | `product/` | Product overview | Understanding the product |
  | `restructuring/` | Phase execution plans | Executing restructure |
  | `archive/` | Historical docs | Reference only |

  ## Quick Links

  ### For Designers
  - [Design Philosophy](./design-system/00-foundations/philosophy.md)
  - [Component Specs](./design-system/01-components/)
  - [UI Patterns](./design-system/02-patterns/)

  ### For Developers
  - [Setup Guide](./guides/setup.md)
  - [API Standards](./standards/api-design.md)
  - [Financial Data Rules](./standards/financial-data.md)
  - [Multi-tenancy](./standards/multi-tenancy.md)

  ### For Reviewers
  - [Information Architecture](./design-system/05-governance/information-architecture.md)
  - [Permissions Matrix](./design-system/05-governance/permissions-matrix.md)
  - [SOC 2 Controls](./design-system/06-compliance/soc2.md)

  ## Governance

  - Design system changes require review
  - Standards changes require team approval
  - Architecture changes require ADR
  ```

- [ ] Update `docs/standards/README.md`:
  ```markdown
  # Implementation Standards

  These standards define HOW to implement features correctly.

  ## Reference Design System

  For WHAT to build, see:
  - `docs/design-system/` - UI/UX specifications

  ## Standards

  | Standard | Purpose |
  |----------|---------|
  | [api-design.md](./api-design.md) | API patterns, validation, errors |
  | [financial-data.md](./financial-data.md) | Money handling, double-entry |
  | [multi-tenancy.md](./multi-tenancy.md) | Tenant isolation |
  | [security.md](./security.md) | OWASP, input validation |

  ## Key Rules

  1. **Money = Integer Cents** (never float)
  2. **TenantId in EVERY query** (no exceptions)
  3. **Soft deletes only** (deletedAt, not DELETE)
  4. **Audit all financial changes**
  ```

---

### 6.5 Rewrite CLAUDE.md

- [ ] Create new simplified `CLAUDE.md`:
  ```markdown
  # Akount Project - Agent Context

  > **Last Updated:** 2026-02-XX
  > **Source of Truth:** `docs/` folder

  ## Quick Reference

  | Need | Go To |
  |------|-------|
  | UI/UX specs | `docs/design-system/` |
  | Implementation rules | `docs/standards/` |
  | Architecture decisions | `docs/architecture/` |
  | Setup guide | `docs/guides/setup.md` |

  ## Critical Rules

  ### 1. Multi-Tenancy (ZERO EXCEPTIONS)
  ```typescript
  // ALWAYS filter by tenantId
  const data = await prisma.entity.findMany({
    where: { tenantId: user.tenantId } // REQUIRED
  })
  ```

  ### 2. Money as Integer Cents
  ```typescript
  // CORRECT: Integer cents
  amount: 1050 // $10.50

  // WRONG: Never float
  amount: 10.50 // BAD
  ```

  ### 3. RBAC with 6 Roles
  - OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR
  - See: `docs/design-system/05-governance/permissions-matrix.md`

  ### 4. 8 Domain Structure
  - Overview, Money Movement, Business, Accounting
  - Planning, AI Advisor, Services, System
  - See: `docs/design-system/05-governance/information-architecture.md`

  ## File Locations

  | File Type | Location |
  |-----------|----------|
  | Feature specs | `docs/design-system/03-screens/` |
  | Component specs | `docs/design-system/01-components/` |
  | API routes | `apps/api/src/domains/` |
  | Web routes | `apps/web/src/app/(dashboard)/` |
  | UI components | `packages/ui/src/` |
  | Types | `packages/types/src/` |

  ## Agents

  See `.claude/agents/review/README.md` for available review agents.

  Key agents:
  - `financial-data-validator` - Money handling, double-entry
  - `architecture-strategist` - System design, domains
  - `security-sentinel` - OWASP, tenant isolation
  - `design-system-enforcer` - UI compliance

  ## Decision Protocol

  Always ask when:
  - Requirements unclear
  - Multiple valid approaches exist
  - Security/compliance implications unknown
  - Financial calculations involved
  ```

---

## Verification Checklist

Before marking Phase 6 complete:

- [ ] `docs/archive/pre-restructure/` contains all archived files
- [ ] `docs/features/` no longer exists
- [ ] `docs/design-system/old/` no longer exists
- [ ] `docs/README.md` updated with new structure
- [ ] `docs/standards/README.md` links to design-system
- [ ] `docs/product/README.md` consolidated
- [ ] `docs/guides/setup.md` consolidated
- [ ] `CLAUDE.md` simplified and updated
- [ ] No broken links in docs/

**Test:**
```bash
# Check for broken links
grep -r "design-system/v1" docs/
# Should return no results

# Check structure
ls -la docs/
# Should show: design-system/, standards/, architecture/, guides/, product/, archive/, restructuring/
```

---

## Handoff

When complete:
- Phase 7 can update agent instructions
- All documentation points to new structure
- Update status in `docs/restructuring/README.md` to ✅ COMPLETE
