# Akount Documentation

**Last Updated:** 2026-02-02
**Purpose:** Central index for all architecture, product, and technical documentation.

---

## Quick Start Paths

### For New Developers
1. **[/README.md](/README.md)** - Project overview and quick start
2. **[product/overview.md](./product/overview.md)** - What we're building
3. **[architecture/decisions.md](./architecture/decisions.md)** - Tech stack and why
4. **[/STATUS.md](/STATUS.md)** - Current implementation state

### For AI Agents
**IMPORTANT:** Read **/CLAUDE.md** first - it's automatically loaded and provides comprehensive context.

---

## Documentation Structure

```
docs/
├── README.md                    # This file (index)
│
├── product/                     # Product specifications
│   ├── overview.md              # Product vision, target users, value prop
│   └── data-model/README.md     # Database schema (40+ Prisma models)
│
├── architecture/                # Technical decisions
│   ├── decisions.md             # Tech stack and rationale
│   ├── evolution.md             # Phase-by-phase architecture evolution
│   ├── ARCHITECTURE-HOOKS.md    # Future-proof hooks inventory
│   ├── SCHEMA-IMPROVEMENTS.md   # Schema enhancements backlog
│   ├── schema-design.md         # Database design patterns
│   ├── processes.md             # Development workflows
│   └── operations.md            # Operational procedures
│
├── features/                    # Feature specifications (7 phases)
│   ├── 01-accounts-overview.md  # Phase 1: Dashboard
│   ├── 02-bank-reconciliation.md # Phase 2: Bank feeds
│   ├── 03-transactions-bookkeeping.md # Phase 3: GL
│   ├── 04-invoicing-bills.md    # Phase 4: AR/AP
│   ├── 05-analytics.md          # Phase 5: Reports
│   ├── 06-planning.md           # Phase 6: Budgets
│   └── 07-ai-financial-advisor.md # Phase 7: AI
│
├── standards/                   # Coding standards (CRITICAL)
│   ├── README.md                # Standards overview
│   ├── multi-tenancy.md         # Tenant isolation patterns
│   ├── financial-data.md        # Double-entry, money handling
│   ├── api-design.md            # Fastify conventions
│   └── security.md              # OWASP, input validation
│
├── design-system/               # UI/UX specifications
│   ├── README.md                # Design system overview
│   ├── tailwind-colors.md       # Color palette
│   ├── fonts.md                 # Typography
│   ├── theme-system.md          # Light/dark mode
│   ├── tokens.css               # CSS custom properties
│   ├── ADDING-TOKENS.md         # Token creation guide
│   └── COMPONENTS-REFERENCE.md  # Component usage
│
├── setup/                       # Setup guides
│   ├── DATABASE-SETUP.md        # PostgreSQL + Prisma
│   ├── BACKUP-SECURITY.md       # Backup and security
│   ├── onboarding-setup.md      # Onboarding wizard
│   ├── TEST_CREDENTIALS.md      # Test credentials
│   └── NEXT-STEPS.md            # Post-installation
│
├── guides/                      # Development guides
│   ├── passkey-auth.md          # WebAuthn implementation
│   ├── QUICK_START_AGENTS.md    # Agent getting started
│   ├── CUSTOM_AGENTS_TEMPLATES.md # Agent creation
│   └── TRACKING-GUIDE.md        # STATUS/TASKS maintenance
│
├── brainstorms/                 # Workflow outputs (/processes:brainstorm)
│   └── [timestamped files]      # Feature exploration docs
│
├── plans/                       # Workflow outputs (/processes:plan)
│   └── [timestamped files]      # Implementation plans
│
├── solutions/                   # Workflow outputs (/processes:compound)
│   ├── README.md                # Solutions guide
│   └── architecture/            # Documented solutions
│
└── archive/                     # Historical documents
    └── original-engineering-roadmap.md
```

---

## Core Documentation

### Product
| Document | Purpose | Audience |
|----------|---------|----------|
| **product/overview.md** | Product vision, multi-jurisdiction AI financial advisor for solopreneurs | Everyone |
| **product/data-model/README.md** | 40+ Prisma models, schema documentation | Developers |

### Architecture
| Document | Purpose | Audience |
|----------|---------|----------|
| **architecture/decisions.md** | Tech stack (Next.js 16, Fastify, PostgreSQL) | Developers |
| **architecture/evolution.md** | Phase-by-phase architecture roadmap | Architects |
| **architecture/SCHEMA-IMPROVEMENTS.md** | Schema enhancements (enums, indexes, multi-jurisdiction) | Database devs |
| **architecture/ARCHITECTURE-HOOKS.md** | Future feature hooks inventory | Architects |

### Standards (CRITICAL - Must Read)
| Document | Purpose | Audience |
|----------|---------|----------|
| **standards/multi-tenancy.md** | Tenant isolation - ALL queries must filter by tenantId | All developers |
| **standards/financial-data.md** | Integer cents, double-entry, audit trails | All developers |
| **standards/security.md** | OWASP, input validation, sensitive data | All developers |
| **standards/api-design.md** | Fastify patterns, Zod validation | Backend devs |

---

## Workflow Directories

These directories are created by Claude workflow commands:

| Directory | Created By | Purpose |
|-----------|------------|---------|
| `brainstorms/` | `/processes:brainstorm` | Feature exploration and requirements |
| `plans/` | `/processes:plan` | Implementation plans |
| `solutions/` | `/processes:compound` | Documented problem solutions |

**Do not manually delete** - these capture valuable decision-making history.

---

## Document Update Frequency

| Document | Frequency | Owner |
|----------|-----------|-------|
| **/STATUS.md** | Weekly | Engineering |
| **/ROADMAP.md** | Weekly | Engineering |
| **product/overview.md** | Rarely | Product |
| **architecture/*.md** | Rarely | Architecture |
| **standards/*.md** | Rarely | Engineering |
| **features/*.md** | Sometimes | Product |

---

## Questions?

- **Implementation status?** → Check `/STATUS.md`
- **What to work on?** → Check `/TASKS.md`
- **Tech decisions?** → Check `architecture/decisions.md`
- **Feature requirements?** → Check `features/*.md`
- **Coding standards?** → Check `standards/*.md`

---

**Maintainer:** Engineering Team
**Last Reorganized:** 2026-02-02 (77 → 53 files)
