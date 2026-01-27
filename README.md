# Akount - Multi-Entity Accounting Platform

**Status:** 🚧 Early Development (Phase 0 - Foundation)
**Progress:** 5% (Infrastructure only)
**Last Updated:** 2026-01-27

---

## 📊 Quick Status

| Item | Status |
|------|--------|
| **Monorepo Structure** | ✅ Complete |
| **Database Schema** | ✅ Defined (not migrated) |
| **Frontend Shell** | ✅ Basic layout |
| **Backend API** | ⚠️ Hello-world only |
| **Authentication** | ❌ Not configured |
| **Database Connection** | ❌ Not operational |
| **Features** | ❌ None implemented |

**Current Phase:** Foundation Setup
**Next Milestone:** Get auth + database working

---

## 🎯 Project Tracking (START HERE)

**For accurate, up-to-date project status:**

1. **STATUS.md** - Current progress, what's done, what's next
2. **ROADMAP.md** - Phase-by-phase development plan (Phases 0-8)
3. **TASKS.md** - This week's actionable tasks with time estimates

**These 3 files are the single source of truth for implementation progress.**

---

## 📁 Project Structure

```
akount/
├── apps/
│   ├── web/              # Next.js 16 frontend (17 files)
│   └── api/              # Fastify backend (1 file)
├── packages/
│   ├── db/               # Prisma schema (611 lines, 40+ models)
│   ├── types/            # Shared TypeScript types (placeholder)
│   ├── ui/               # Shared UI components (empty)
│   └── config/           # Shared config (empty)
├── planning/             # Product specs, design system, reference code
├── STATUS.md            # ⭐ Current implementation status
├── ROADMAP.md           # ⭐ Development roadmap
├── TASKS.md             # ⭐ Current week tasks
├── package.json          # Monorepo root
└── turbo.json            # Turborepo config
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 15+ (or Railway/Supabase account)
- Clerk account (for authentication)

### Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Set Up Authentication** (see TASKS.md Task 0.1.1)
   - Create Clerk account at clerk.com
   - Add API keys to .env

4. **Set Up Database** (see TASKS.md Task 0.2.1)
   - Create PostgreSQL database
   - Add DATABASE_URL to .env
   - Run migrations: `cd packages/db && npx prisma migrate dev`

5. **Start Development**
   ```bash
   npm run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001

### First Time Setup Guide
👉 **See TASKS.md for step-by-step setup instructions**

---

## 📖 Documentation

### Implementation Tracking
- **STATUS.md** - What's implemented vs planned
- **ROADMAP.md** - 8-phase development plan
- **TASKS.md** - Current week's tasks

### Product Specifications
- **planning/product-overview.md** - Product vision and features
- **planning/sections/** - Feature section specs
- **planning/data-model/** - Database entity documentation

### Architecture & Design
- **planning/akount-engineering-roadmap.md** - 32-week implementation plan
- **planning/akount_foundation_checklist.md** - Schema design checklist
- **planning/design-system/** - Design tokens, colors, typography
- **planning/passkey-authentication.md** - WebAuthn implementation guide

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **UI Components:** Shadcn/ui + Radix
- **State:** Zustand
- **Charts:** Recharts
- **Tables:** TanStack Table

### Backend
- **Framework:** Fastify
- **Language:** TypeScript 5
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5
- **Validation:** Zod

### Infrastructure
- **Monorepo:** Turborepo
- **Auth:** Clerk (passkeys/WebAuthn)
- **Database Host:** Railway (recommended)
- **Deployment:** Vercel (web) + Railway (API)

---

## 📋 Current Phase: Foundation

**Goal:** Get authentication, database, and API foundation working

**Tasks This Week:**
1. ✅ Set up Clerk authentication
2. ✅ Connect PostgreSQL database
3. ✅ Run initial migrations
4. ✅ Build first API endpoint
5. ✅ Display real data in UI

👉 **See TASKS.md for detailed breakdown**

---

## 🎯 Roadmap Overview

| Phase | Goal | Duration | Status |
|-------|------|----------|--------|
| **Phase 0** | Foundation (auth, DB, API) | 1-2 weeks | 🚧 In Progress (5%) |
| **Phase 1** | Accounts Overview | 1-2 weeks | ⏸️ Not Started |
| **Phase 2** | Bank Reconciliation | 2-3 weeks | ⏸️ Not Started |
| **Phase 3** | Transactions & Bookkeeping | 2-3 weeks | ⏸️ Not Started |
| **Phase 4** | Invoicing & Bills | 2-3 weeks | ⏸️ Not Started |
| **Phase 5** | Financial Analytics | 2-3 weeks | ⏸️ Not Started |
| **Phase 6** | Budgets & Goals | 1-2 weeks | 🔘 Optional |
| **Phase 7** | AI Financial Advisor | 2-3 weeks | 🔘 Optional |
| **Phase 8** | Polish & Launch Prep | 2-3 weeks | ⏸️ Not Started |

**MVP Target:** Phases 0-5 + 8 (4-6 months)

👉 **See ROADMAP.md for full details**

---

## 🧪 Development Commands

```bash
# Install dependencies
npm install

# Start all apps in development
npm run dev

# Build all apps
npm run build

# Run linting
npm run lint

# Database commands
npm run db:push      # Push schema without migrations
npm run db:studio    # Open Prisma Studio GUI

# Clean build artifacts
npm run clean
```

---

## 🗄️ Database

**Schema:** 40+ models (611 lines)
**Status:** Defined but not migrated
**Location:** `packages/db/prisma/schema.prisma`

**Key Models:**
- Tenant, User, Entity (multi-tenant, multi-entity)
- Account, Transaction (financial accounts)
- Invoice, Bill, Payment (AR/AP)
- GLAccount, JournalEntry (double-entry bookkeeping)
- Budget, Goal, Insight (planning)
- ImportBatch, BankFeedTransaction (data import)
- AuditLog, DomainEvent (compliance)

**To view schema:**
```bash
cd packages/db
npx prisma studio
```

---

## 🔐 Authentication

**Provider:** Clerk
**Method:** Passkeys (WebAuthn) + Email Magic Links
**Status:** Not configured

**Setup:**
1. Create account at https://clerk.com
2. Get API keys
3. Add to .env
4. Follow TASKS.md Task 0.1.1-0.1.9

---

## 💰 Cost Estimate

| Phase | Monthly Cost |
|-------|-------------|
| **Development** | $0-10 (free tiers) |
| **MVP (10 users)** | $50-100 |
| **Growth (100 users)** | $150-300 |
| **Scale (1000 users)** | $300-500 |

**Current:** Using free tiers only

---

## 🤝 Contributing

This is currently in early development. Contributions welcome once foundation is complete.

**Before contributing:**
1. Read STATUS.md to understand current state
2. Check ROADMAP.md for planned features
3. See TASKS.md for current priorities

---

## 📜 License

Proprietary - All rights reserved

---

## 📞 Support

**Documentation:** Check STATUS.md, ROADMAP.md, and TASKS.md first
**Issues:** Track in GitHub Issues
**Questions:** Contact team

---

**Last Updated:** 2026-01-27
**Version:** 0.0.1 (Pre-Alpha)
**Status:** Foundation phase in progress
