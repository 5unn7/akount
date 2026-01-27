# Akount Documentation

**Last Updated:** 2026-01-27
**Purpose:** Central index for all architecture, product, and technical documentation.

---

## 📚 Documentation Overview

This folder contains reference documentation that changes rarely. For active work tracking, see the root-level files (STATUS.md, ROADMAP.md, TASKS.md).

---

## 🚀 Quick Start Paths

### For New Developers

1. **[/README.md](/README.md)** - Project overview and quick start
2. **[product/overview.md](./product/overview.md)** - What we're building
3. **[architecture/decisions.md](./architecture/decisions.md)** - Tech stack and why
4. **[/STATUS.md](/STATUS.md)** - Current implementation state
5. **[/TASKS.md](/TASKS.md)** - Pick a task to work on

### For AI Agents

**To understand the project:**
1. Read **/README.md** for tech stack and structure
2. Read **product/overview.md** for product vision
3. Read **architecture/decisions.md** for technical decisions
4. Read **product/data-model/README.md** for database schema

**To work on implementation:**
1. Check **/STATUS.md** for current state (5% complete)
2. Check **/ROADMAP.md** for planned work (Phases 0-8)
3. Check **/TASKS.md** for immediate tasks
4. Read relevant **features/*.md** spec for requirements

**To update progress:**
1. Mark tasks complete in **/TASKS.md** (daily)
2. Update **/STATUS.md** when completing major work (weekly)
3. Update **/CHANGELOG.md** on milestones

---

## 📁 Documentation Structure

### Root Level (Active Work)
Located in project root - updated frequently:

- **/README.md** - Project overview, tech stack summary, quick start
- **/STATUS.md** - Implementation progress (updated weekly)
- **/ROADMAP.md** - Development plan, phases 0-8 (updated weekly)
- **/TASKS.md** - Current week's tasks (updated daily)
- **/CHANGELOG.md** - Project history (updated on milestones)
- **/TRACKING-GUIDE.md** - How to maintain tracking system

### docs/ (Reference Documentation)
This folder - updated rarely:

```
docs/
├── README.md (this file)
├── product/                    # Product specifications
├── architecture/               # Technical decisions
├── design-system/              # UI/UX specifications
├── features/                   # Feature requirements
├── guides/                     # Implementation guides
└── archive/                    # Historical documents
```

---

## 📖 Product Documentation

### [product/overview.md](./product/overview.md)
**Purpose:** Product vision, target users, key features
**Audience:** Everyone - stakeholders, new team members
**Last Updated:** 2026-01-27

**Contents:**
- What is Akount
- Target users (founders, startups, SMBs)
- Core features (7 main sections)
- Product principles

### [product/data-model/](./product/data-model/)
**Purpose:** Database schema documentation
**Audience:** Developers, architects
**Last Updated:** 2026-01-27

**Contents:**
- **README.md** - Explains all 40+ Prisma models
- **types.ts** - TypeScript interfaces
- **sample-data.json** - Example data structure

**Key Models:**
- Tenant, User, Entity (multi-tenant, multi-entity)
- Account, Transaction (financial)
- Invoice, Bill, Payment (AR/AP)
- GLAccount, JournalEntry (bookkeeping)
- Budget, Goal, Insight (planning)

---

## 🏗️ Architecture Documentation

### [architecture/decisions.md](./architecture/decisions.md)
**Purpose:** Single source of truth for tech stack decisions
**Audience:** Developers, architects, AI agents
**Last Updated:** 2026-01-27

**Contents:**
- **Tech Stack** - Backend, Frontend, Infrastructure with rationale
- **Cost Analysis** - Development, MVP, Growth, Scale phases
- **Alternative Considerations** - Why we chose X over Y
- **Decision Log** - Historical tech decisions

**Key Decisions:**
- Fastify (backend) - 2x faster than Express
- Next.js (frontend) - Industry standard, great DX
- Prisma (ORM) - Type-safe, excellent migrations
- PostgreSQL (database) - Best for financial data
- Clerk (auth) - Passkeys, great UX

### [architecture/processes.md](./architecture/processes.md)
**Purpose:** Development workflows and standards
**Audience:** Developers
**Last Updated:** 2026-01-27

**Contents:**
- **Code Organization** - Monorepo structure, layered architecture
- **Testing Strategy** - Coverage targets, test pyramid, TDD
- **Code Review** - PR workflow, review checklist
- **CI/CD Pipeline** - GitHub Actions, deployment strategy
- **Code Quality** - Linting, formatting, TypeScript config

### [architecture/operations.md](./architecture/operations.md)
**Purpose:** Operational procedures and security
**Audience:** Developers, DevOps, on-call engineers
**Last Updated:** 2026-01-27

**Contents:**
- **Incident Management** - SEV-1/2/3 levels, response plan
- **Monitoring & Alerting** - Critical alerts, warning alerts
- **Backup & DR** - Backup strategy, recovery targets, DR plan
- **Security Best Practices** - Development, infrastructure, operations
- **Health Checks** - Endpoints, smoke tests
- **On-Call Rotation** - Schedule, responsibilities

### [architecture/schema-design.md](./architecture/schema-design.md)
**Purpose:** Validate database schema completeness
**Audience:** Architects, database developers
**Last Updated:** 2026-01-27

**Contents:**
- Data model foundation (multi-tenant, multi-entity, multi-currency)
- Integration & data pipeline
- Security & compliance hooks
- Observability requirements
- Workflows & controls
- Productization & billing hooks

**Note:** This tracks SCHEMA DESIGN, not implementation. For implementation status, see /STATUS.md.

---

## 🎨 Design System

### [design-system/colors.md](./design-system/colors.md)
**Purpose:** Color palette and usage
**Audience:** Designers, frontend developers

**Contents:**
- Primary: Orange shades
- Secondary: Violet shades
- Neutral: Slate shades
- Semantic colors (success, warning, error, info)
- Dark mode variants

### [design-system/fonts.md](./design-system/fonts.md)
**Purpose:** Typography system
**Audience:** Designers, frontend developers

**Contents:**
- **Newsreader** - Serif for headings
- **Manrope** - Sans-serif for body text
- **JetBrains Mono** - Monospace for data/code
- Google Fonts import code
- Usage examples

### [design-system/tokens.css](./design-system/tokens.css)
**Purpose:** CSS custom properties
**Audience:** Frontend developers

**Contents:**
- CSS variables for colors, typography, spacing
- Light and dark mode values
- Consistent design tokens

---

## 🧩 Feature Specifications

All feature specs follow consistent structure:
- Overview
- User flows
- UI components
- Design notes
- Implementation notes

### [features/01-accounts-overview.md](./features/01-accounts-overview.md)
**Phase:** 1 (After Foundation)
**Description:** Financial dashboard with multi-currency support
**Components:** Net worth card, cash position, account list, entity filter

### [features/02-bank-reconciliation.md](./features/02-bank-reconciliation.md)
**Phase:** 2
**Description:** Import and match bank transactions
**Components:** CSV import, transaction matching, reconciliation status

### [features/03-transactions-bookkeeping.md](./features/03-transactions-bookkeeping.md)
**Phase:** 3
**Description:** GL accounts and journal entries (double-entry)
**Components:** Chart of accounts, transaction posting, journal entry list

### [features/04-invoicing-bills.md](./features/04-invoicing-bills.md)
**Phase:** 4
**Description:** Accounts receivable and payable
**Components:** Invoice creation, bill tracking, payment allocation, aging reports

### [features/05-analytics.md](./features/05-analytics.md)
**Phase:** 5
**Description:** Financial reports (P&L, Balance Sheet, Cash Flow)
**Components:** Report views, date range filters, PDF export

### [features/06-planning.md](./features/06-planning.md)
**Phase:** 6 (Optional for MVP)
**Description:** Budgets and goals
**Components:** Budget creation, goal tracking, budget vs actual

### [features/07-ai-financial-advisor.md](./features/07-ai-financial-advisor.md)
**Phase:** 7 (Optional for MVP)
**Description:** AI-powered insights and auto-categorization
**Components:** Insights feed, rule management, categorization suggestions

---

## 📚 Implementation Guides

### [guides/passkey-auth.md](./guides/passkey-auth.md)
**Purpose:** Implement WebAuthn passkey authentication
**Audience:** Developers implementing auth
**Last Updated:** 2026-01-27

**Contents:**
- What are passkeys (WebAuthn)
- How Clerk implements passkeys
- Setup instructions
- Best practices
- Recovery flows
- Cross-device sync (iCloud Keychain, Google Password Manager)

---

## 📦 Archive

### [archive/original-engineering-roadmap.md](./archive/original-engineering-roadmap.md)
**Purpose:** Historical reference - original 32-week plan
**Status:** Archived, superseded by /ROADMAP.md
**Date:** 2026-01-27

**Why archived:**
- Week-based timeline too rigid
- Many assumptions changed during early implementation
- Replaced by phase-based ROADMAP.md (more flexible)
- Useful detail extracted to architecture/decisions.md and architecture/processes.md

---

## 🔄 Document Update Frequency

| Document | Update Frequency | Owner |
|----------|------------------|-------|
| **/STATUS.md** | Weekly (Fridays) | Engineering team |
| **/ROADMAP.md** | Weekly or when priorities change | Engineering team |
| **/TASKS.md** | Daily | Engineering team |
| **product/overview.md** | Rarely (vision changes) | Product |
| **architecture/decisions.md** | Rarely (tech changes) | Engineering lead |
| **architecture/processes.md** | Rarely (process changes) | Engineering lead |
| **architecture/operations.md** | Rarely (ops changes) | DevOps/Engineering |
| **features/*.md** | Sometimes (requirements change) | Product + Engineering |
| **design-system/*.md** | Rarely (design changes) | Design + Frontend |

---

## 🔗 External References

- **GitHub Repository:** (link when public)
- **Prisma Schema:** `/packages/db/prisma/schema.prisma`
- **Live Status Dashboard:** (link when deployed)
- **Production Monitoring:** (Sentry, Vercel Analytics links when active)

---

## 💡 Documentation Principles

1. **Single Source of Truth** - Each topic has ONE authoritative document
2. **Separation of Concerns** - Specs vs tracking, architecture vs implementation
3. **Update Frequency** - Active work (root) updated frequently, reference docs (docs/) rarely
4. **Discoverability** - Clear hierarchy, consistent naming, cross-references
5. **For Humans and AI** - Clear structure, purpose statements, examples

---

## 📧 Questions?

- **Implementation status:** Check /STATUS.md
- **What to work on:** Check /TASKS.md
- **Tech decisions:** Check architecture/decisions.md
- **Feature requirements:** Check features/*.md
- **How to maintain docs:** Check /TRACKING-GUIDE.md

---

**Last Updated:** 2026-01-27
**Maintainer:** Engineering Team
**Review Schedule:** Update when structure changes
