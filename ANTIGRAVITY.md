# Akount Project - Antigravity Context

> **Purpose:** This file provides essential context about documentation, architecture, standards, and constraints for Antigravity.
> It mirrors the project standards defined in `CLAUDE.md` to ensure consistency between agents.

**Project:** Akount - Multi-tenant Accounting Platform for Canadian Freelancers
**Current Phase:** Phase 0 Complete (100%) - Bank Statement Import Feature Added

---

## 🏗️ Architecture & Technical Decisions

### Core Architecture Documents
- **`docs/architecture/decisions.md`** - Tech stack choices and rationale
- **`docs/architecture/summary.md`** - Architecture evolution approach
- **`docs/architecture/schema-design.md`** - Database design patterns and Prisma conventions
- **`docs/architecture/processes.md`** - Development workflows and deployment processes

### Critical Architectural Principles

**1. Multi-Tenancy (ZERO EXCEPTIONS)**
- ALL queries MUST include `tenantId` filter. NO EXCEPTIONS.
- Middleware enforces tenant isolation.

**2. Server-First Architecture**
- Maximize React Server Components.
- Only use `'use client'` when absolutely necessary.

**3. Integer Cents for Money (NEVER Float)**
- All monetary values stored as `Int` (cents).
- Division ONLY for display.

**4. Monorepo Structure**
- `apps/web`: Next.js 16 frontend (port 3000)
- `apps/api`: Fastify backend (port 4000)
- `packages/db`: Prisma schema & migrations
- `packages/types`: Shared TypeScript types
- `packages/ui`: Shared UI components

---

## 📐 Standards & Conventions

### Akount Standards (Domain Patterns)
Location: `docs/standards/`
- **`multi-tenancy.md`** - Tenant isolation enforcement (CRITICAL)
- **`financial-data.md`** - Double-entry bookkeeping, money handling (CRITICAL)
- **`api-design.md`** - Fastify route patterns, error handling
- **`security.md`** - OWASP Top 10 for Akount, input validation (CRITICAL)

### Design System
Location: `docs/design-system/`
- **`tailwind-colors.md`** - Color palette
- **`fonts.md`** - Typography system
- **`tokens.css`** - CSS custom properties

---

## 📍 Available Workflows (Skills)

Antigravity uses workflows in `.agent/workflows/` to mirror Claude's processes.

### Session Start
- `/begin` - Session startup dashboard (Mirrors `/processes:begin`)

### Development Lifecycle
- `/brainstorm` - Feature exploration (Mirrors `/processes:brainstorm`)
- `/plan` - Implementation planning (Mirrors `/processes:plan`)
- `/work` - Systematic development (Mirrors `/processes:work`)
- `/review` - Multi-agent code review (Mirrors `/processes:review`)
- `/compound` - Knowledge capture (Mirrors `/processes:compound`)

### Quality & Standards
- `/standards-check` - Verify code against critical rules
- `/brand-check` - Ensure consistent brand voice in user-facing content

---

## 🚨 Critical Constraints & Rules

### Security (ZERO TOLERANCE)
- **Tenant Isolation**: NEVER allow cross-tenant data access. ALWAYS include `tenantId` in where clauses.
- **Input Validation**: ALWAYS validate user input with Zod schemas.

### Financial Data (ACCOUNTING INTEGRITY)
- **Money Precision**: ALWAYS use integer cents.
- **Double-Entry**: ALWAYS maintain SUM(debits) = SUM(credits).
- **Audit Trails**: NEVER hard delete financial data (use `deletedAt`).

---

## 🔍 Decision-Making Protocol

**ALWAYS STOP AND ASK when:**
- Requirements are ambiguous.
- Multiple approaches exist with tradeoffs.
- User preference matters.
- Destructive action proposed.

---
**End of Antigravity Context**
