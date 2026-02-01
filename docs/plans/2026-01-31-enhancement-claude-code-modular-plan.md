# Claude Code Modular Enhancement - Implementation Plan

**Date:** 2026-01-31
**Type:** Enhancement
**Status:** Planning
**Priority:** HIGH
**Related:** `docs/brainstorms/2026-01-31-claude-code-enhancement-brainstorm.md`, `.claude/IMPLEMENTATION-SUMMARY.md`

---

## Summary

Refactor Claude Code configuration to industry best practices using `.claude/rules/` directory with path-scoped domain rules, slim CLAUDE.md from 393 to 50-100 lines, and add 3 essential MCP servers (Prisma, GitHub, Sentry). This enhancement scales to 100+ engineers, eliminates context pollution, and provides 20-30% productivity boost.

**Key Changes:**
- Create 7 domain-specific rule files with conditional loading
- Reduce CLAUDE.md by 75% (393 → 100 lines)
- Add 3 free MCP servers for immediate productivity boost
- Add child CLAUDE.md files for subdirectory context

**Timeline:** 6 hours over 1-2 weeks (non-blocking, can do alongside feature work)

---

## User Story

As a **developer on the Akount team**, I want **modular, domain-specific Claude Code configuration** so that **critical rules load only when relevant, context stays clean, and the system scales to 100+ engineers without merge conflicts**.

---

## Success Criteria

### Immediate (Implementation Complete)
- [ ] `.claude/rules/` directory exists with 7 domain-specific rule files
- [ ] CLAUDE.md reduced from 393 to 50-100 lines (target: 100)
- [ ] 3 MCP servers added and operational (Prisma, GitHub, Sentry)
- [ ] Child CLAUDE.md files created for apps/web, apps/api, packages/db
- [ ] All existing hooks, agents, and skills still work
- [ ] No functionality regressions

### Short-Term (Week 1-2)
- [ ] Path scoping works correctly (rules load conditionally)
- [ ] Context window usage reduced by 50% (20k → 10k tokens)
- [ ] CLAUDE.md load time reduced by 50% (theoretical)
- [ ] Team can edit files without merge conflicts on rules

### Medium-Term (Month 1)
- [ ] Productivity boost: 20-30% (measured by task completion time)
- [ ] Zero merge conflicts on CLAUDE.md or rules files
- [ ] Team satisfaction: >8/10 on structure clarity
- [ ] All developers understand new structure

---

## Technical Approach

### Architecture

**Components Affected:**
- **Configuration:** `.claude/settings.local.json`, `.mcp.json`
- **Context Files:** `CLAUDE.md` (slimmed), `.claude/rules/*.md` (new)
- **Child Context:** `apps/web/CLAUDE.md`, `apps/api/CLAUDE.md`, `packages/db/CLAUDE.md` (new)
- **Documentation:** `.claude/CONFIGURATION-GUIDE.md`, `.claude/MCP-INTEGRATION-GUIDE.md` (new)

**Key Decisions:**

1. **`.claude/rules/` vs CLAUDE.md**
   - **Decision:** Use `.claude/rules/` for domain-specific rules
   - **Rationale:** Path-scoped loading eliminates priority saturation, scales to 100+ engineers
   - **Source:** Claude Code v2.0.64+ feature, Anthropic best practices

2. **Target CLAUDE.md Size: 100 Lines**
   - **Decision:** Target 100 lines (was 393), industry standard is 50-100
   - **Rationale:** Reduce context pollution, improve performance, maintain readability
   - **Extracted:** Domain rules → `.claude/rules/`, detailed docs → keep as links

3. **MCP Server Selection: Prisma + GitHub + Sentry**
   - **Decision:** Start with 3 free, high-impact MCPs
   - **Rationale:** 20-30% productivity boost, zero cost, direct value for our stack
   - **Deferred:** Custom Canadian Accounting MCP (validate value first)

4. **Child CLAUDE.md Files**
   - **Decision:** Add minimal context files in subdirectories
   - **Rationale:** Automatic context switching, hierarchical loading, clear boundaries
   - **Scope:** apps/web, apps/api, packages/db only (not every subdirectory)

---

### Domain Rules Architecture

**7 Rule Files with Path Scoping:**

```
.claude/rules/
├── multi-tenancy.md          # CRITICAL: tenantId enforcement
├── financial-data.md          # CRITICAL: integer cents, double-entry
├── frontend/
│   └── nextjs.md              # Next.js 16 App Router patterns
├── backend/
│   └── fastify.md             # Fastify API patterns
├── database/
│   └── prisma.md              # Prisma schema conventions
├── security.md                # Input validation, PII handling
└── testing.md                 # Test conventions
```

**Path Scoping Examples:**

| Rule File | Activates When Editing |
|-----------|------------------------|
| `multi-tenancy.md` | `apps/api/**/*.ts`, `packages/db/**/*` |
| `financial-data.md` | `**/financial/**/*`, `**/accounting/**/*`, `schema.prisma` |
| `frontend/nextjs.md` | `apps/web/**/*.{ts,tsx}` |
| `backend/fastify.md` | `apps/api/**/*.ts` |
| `database/prisma.md` | `packages/db/**/*` |
| `security.md` | `apps/**/*.ts`, `packages/**/*.ts` |
| `testing.md` | `**/*.test.ts`, `**/*.spec.ts` |

---

### MCP Server Configuration

**3 Free, High-Impact MCPs:**

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "description": "Framework documentation (100+ frameworks)"
    },
    "prisma": {
      "type": "stdio",
      "command": "npx",
      "args": ["prisma", "mcp"],
      "description": "AI-assisted Prisma migrations, schema validation, query optimization"
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      },
      "description": "PR reviews, CI/CD monitoring, issue tracking"
    },
    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "$SENTRY_TOKEN",
        "SENTRY_ORG": "$SENTRY_ORG",
        "SENTRY_PROJECT": "$SENTRY_PROJECT"
      },
      "description": "Production error tracking, AI-assisted debugging"
    }
  }
}
```

**Note:** GitHub and Sentry MCP servers require environment variables. Will document setup in MCP-INTEGRATION-GUIDE.md.

---

## Implementation Phases

### Phase 1: Create `.claude/rules/` Directory (2 hours)

**Goal:** Extract domain-specific rules from CLAUDE.md into modular, path-scoped files

#### Task 1.1: Create Critical Rules Files

**File 1: `.claude/rules/multi-tenancy.md`** (CRITICAL - ZERO EXCEPTIONS)

```markdown
---
paths:
  - "apps/api/**/*.ts"
  - "packages/db/**/*"
  - "!**/*.test.ts"
---

# Multi-Tenancy Rules (ZERO EXCEPTIONS)

**ALWAYS filter by tenantId - NO EXCEPTIONS**

```typescript
// CORRECT: Include tenantId in WHERE clause
const entities = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})

const invoice = await prisma.invoice.findFirst({
  where: {
    id: invoiceId,
    tenantId: user.tenantId // REQUIRED
  }
})

// WRONG: Missing tenantId (SECURITY VULNERABILITY)
const entities = await prisma.entity.findMany({
  where: { id: entityId } // BAD - no tenantId filter
})
```

**Enforcement:**
- ALL database queries MUST include `tenantId` filter
- Middleware enforces tenant isolation
- Pre-commit hook warns about missing `tenantId`

**See:** `docs/standards/multi-tenancy.md` for complete patterns
```

**File 2: `.claude/rules/financial-data.md`** (CRITICAL - ACCOUNTING INTEGRITY)

```markdown
---
paths:
  - "**/financial/**/*"
  - "**/accounting/**/*"
  - "packages/db/prisma/schema.prisma"
  - "apps/api/src/routes/**/invoices/**"
  - "apps/api/src/routes/**/payments/**"
  - "apps/api/src/routes/**/bills/**"
---

# Financial Data Rules (ACCOUNTING INTEGRITY)

## 1. Money Precision (ZERO TOLERANCE)

**ALWAYS use Integer cents - NEVER Float**

```typescript
// CORRECT: Integer cents
const amount = 1050  // $10.50
const total = amount1 + amount2  // Safe arithmetic

// WRONG: Float (precision errors destroy accounting)
const amount = 10.50  // BAD - will cause rounding errors
const total = 10.49 + 0.01  // BAD - may not equal 10.50
```

## 2. Double-Entry Bookkeeping

**ALWAYS maintain: SUM(debits) = SUM(credits)**

```typescript
const journalEntry = await prisma.journalEntry.create({
  data: {
    lines: {
      create: [
        { glAccountId: '...', debitAmount: 1000, creditAmount: 0 },
        { glAccountId: '...', debitAmount: 0, creditAmount: 1000 },
      ]
    }
  }
})
// Validation: debits (1000) = credits (1000) ✓
```

## 3. Audit Trails

- **NEVER delete** financial data (use soft delete: `deletedAt`)
- **ALWAYS preserve** source documents (`sourceDocument` JSON field)
- **ALWAYS track** who/when/what/why (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`)

**See:** `docs/standards/financial-data.md` for complete patterns
```

#### Task 1.2: Create Framework-Specific Rules Files

**File 3: `.claude/rules/frontend/nextjs.md`**

```markdown
---
paths:
  - "apps/web/**/*.{ts,tsx}"
  - "apps/web/src/app/**/*"
  - "apps/web/src/components/**/*"
---

# Next.js 16 App Router Rules

## Server-First Architecture

**Default to Server Components, use 'use client' only when necessary**

```typescript
// ✓ Server Component (default) - fetch data, no interactivity
export default async function InvoicesPage() {
  const invoices = await getInvoices()
  return <InvoiceList invoices={invoices} />
}

// ✓ Client Component - interactivity needed
'use client'
export function InvoiceForm() {
  const [amount, setAmount] = useState(0)
  return <input onChange={(e) => setAmount(e.target.value)} />
}
```

## When to Use 'use client'

**Only use for:**
- `useState`, `useEffect`, `useContext` hooks
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`window`, `document`, `localStorage`)
- Third-party libraries requiring client-side

**Don't use for:**
- Data fetching (use Server Components with `async`)
- Static rendering
- Displaying data without interactivity

**See:** `docs/standards/nextjs-patterns.md`
```

**File 4: `.claude/rules/backend/fastify.md`**

```markdown
---
paths:
  - "apps/api/**/*.ts"
  - "!apps/api/**/*.test.ts"
---

# Fastify API Rules

## Route Patterns

```typescript
// ✓ Correct: Zod validation + Clerk auth + tenant isolation
app.post('/api/invoices', async (request, reply) => {
  const user = await auth(request)
  const body = createInvoiceSchema.parse(request.body)

  const invoice = await prisma.invoice.create({
    data: {
      ...body,
      tenantId: user.tenantId, // REQUIRED
    }
  })

  return reply.code(201).send(invoice)
})
```

## Required Patterns

- **Input Validation:** Zod schemas for all request bodies
- **Authentication:** Clerk JWT verification
- **Tenant Isolation:** Include `tenantId` in all queries
- **Error Handling:** Standardized error responses
- **Rate Limiting:** Apply to sensitive endpoints

**See:** `docs/standards/api-design.md`
```

**File 5: `.claude/rules/database/prisma.md`**

```markdown
---
paths:
  - "packages/db/**/*"
  - "packages/db/prisma/schema.prisma"
---

# Prisma Schema Rules

## Required Patterns

**Every model MUST have:**
```prisma
model Invoice {
  id        String   @id @default(cuid())
  tenantId  String   // REQUIRED for multi-tenancy
  deletedAt DateTime? // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String?

  tenant Tenant @relation(fields: [tenantId], references: [id])
  @@index([tenantId])
}
```

## Money Fields

**ALWAYS use Int for amounts (cents), NEVER Decimal or Float**

```prisma
model Invoice {
  totalAmount Int  // ✓ Correct: 1050 = $10.50
  // totalAmount Decimal  // ✗ Wrong: precision issues
}
```

## Migrations

- **NO CASCADE deletes** on financial data
- **Add indexes** for frequently queried fields
- **Test rollback** before deploying

**See:** `docs/architecture/schema-design.md`
```

**File 6: `.claude/rules/security.md`**

```markdown
---
paths:
  - "apps/**/*.ts"
  - "packages/**/*.ts"
---

# Security Rules (ZERO TOLERANCE)

## Input Validation

**ALWAYS validate user input with Zod schemas**

```typescript
import { z } from 'zod'

const createInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  amount: z.number().int().positive(),
  dueDate: z.string().datetime(),
})

// ✓ Validate before using
const body = createInvoiceSchema.parse(request.body)
```

## Sensitive Data

- **NEVER log** tokens, passwords, or PII
- **NEVER commit** secrets to git (use .env)
- **ALWAYS use** HTTPS/TLS in production
- **ALWAYS sanitize** before database queries (Prisma does this)

## Authentication

- **All API routes** require `auth()` check
- **Tenant isolation** enforced in queries
- **RBAC permissions** checked for sensitive operations

**See:** `docs/standards/security.md`
```

**File 7: `.claude/rules/testing.md`**

```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/tests/**/*"
---

# Testing Conventions

## Test Frameworks

- **Jest** for unit tests
- **Playwright** for E2E tests
- **Testing Library** for component tests

## Financial Tests

**ALWAYS test:**
- Money precision (no rounding errors)
- Double-entry balancing (debits = credits)
- Multi-currency conversions
- Edge cases (zero amounts, negative amounts, max values)

## Tenant Isolation Tests

**ALWAYS test:**
- Cross-tenant data leakage
- tenantId filters in all queries
- Middleware enforcement

**See:** `docs/guides/testing-guide.md`
```

#### Task 1.3: Verify Rule Files

- [ ] All 7 rule files created
- [ ] Frontmatter with `paths:` correct
- [ ] Code examples preserved from CLAUDE.md
- [ ] Links to detailed documentation included
- [ ] No duplication between rule files

---

### Phase 2: Slim CLAUDE.md (1 hour)

**Goal:** Reduce CLAUDE.md from 393 to 100 lines

#### Task 2.1: Create New Slimmed CLAUDE.md

**Target Structure (100 lines):**

```markdown
# Akount Project - Agent Context

> Auto-loaded by Claude Code at session start
> Links to detailed docs - keep this concise

**Last Updated:** 2026-01-31
**Project:** Multi-tenant Accounting Platform for Canadian Freelancers
**Phase:** Phase 0 Complete - Bank Statement Import Added

---

## Critical Constraints

**Multi-Tenancy (ZERO EXCEPTIONS):**
```typescript
// ALWAYS filter by tenantId
const entities = await prisma.entity.findMany({
  where: { tenantId: user.tenantId } // REQUIRED
})
```

**Money Precision (ZERO TOLERANCE):**
```typescript
// CORRECT: Integer cents
const amount = 1050 // $10.50

// WRONG: Float
const amount = 10.50 // BAD
```

**Domain Rules:** See `.claude/rules/` for path-scoped, domain-specific rules

---

## Monorepo Structure

```
apps/web     - Next.js 16 frontend (port 3000)
apps/api     - Fastify backend (port 4000)
packages/db  - Prisma schema & migrations
```

---

## Key Documentation

**Architecture:** `docs/architecture/` (decisions, schema, processes)
**Standards:** `docs/standards/` (multi-tenancy, financial, security, API)
**Features:** `docs/features/` (7 phase specifications)
**Progress:** `STATUS.md`, `ROADMAP.md`, `TASKS.md`

---

## Configuration

**Claude Code:** `.claude/CONFIGURATION-GUIDE.md` (hooks, permissions, MCPs)
**Agents:** `.claude/agents/review/README.md` (15 specialized agents)
**Workflows:** `.claude/commands/processes/README.md` (brainstorm, plan, work, review)

---

## Quick Start

**New to codebase?**
1. Read `STATUS.md` - what's implemented?
2. Read `ROADMAP.md` - what phase?
3. Read feature spec in `docs/features/`
4. Use `/processes:begin` for session dashboard

**Starting work?**
1. Check `TASKS.md` for current work
2. Use `/processes:plan` for new features
3. Use `/processes:work` for implementation
4. Use `/processes:review` before merging

---

**End of Agent Context**
**Updated:** 2026-01-31 (Modular enhancement)
```

#### Task 2.2: Backup and Replace CLAUDE.md

- [ ] Backup current CLAUDE.md: `cp CLAUDE.md CLAUDE.md.backup.2026-01-31`
- [ ] Replace with new slimmed version
- [ ] Verify line count: `wc -l CLAUDE.md` (target: ~100)
- [ ] Test loading in Claude Code session

---

### Phase 3: Add Essential MCPs (1 hour)

**Goal:** Configure 3 free, high-impact MCP servers

#### Task 3.1: Update `.mcp.json`

**Current `.mcp.json`:**
```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "description": "Framework documentation lookup"
    }
  }
}
```

**New `.mcp.json`:**
```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "description": "Framework documentation (100+ frameworks)"
    },
    "prisma": {
      "type": "stdio",
      "command": "npx",
      "args": ["prisma", "mcp"],
      "description": "AI-assisted Prisma migrations, schema validation, query optimization (requires Prisma CLI v6.6.0+)"
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "$GITHUB_TOKEN"
      },
      "description": "PR reviews, CI/CD monitoring, issue tracking (requires GITHUB_TOKEN env var)"
    },
    "sentry": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "$SENTRY_TOKEN",
        "SENTRY_ORG": "$SENTRY_ORG",
        "SENTRY_PROJECT": "$SENTRY_PROJECT"
      },
      "description": "Production error tracking, AI-assisted debugging (requires Sentry account, free tier available)"
    }
  }
}
```

#### Task 3.2: Create MCP Integration Guide

**File:** `.claude/MCP-INTEGRATION-GUIDE.md`

```markdown
# MCP Server Integration Guide

## Active MCP Servers

### 1. Context7 (Documentation)
**Status:** ✅ Active
**Setup:** None required (public HTTP endpoint)
**Usage:** Automatic (Claude queries when asking about frameworks)

### 2. Prisma MCP Server
**Status:** ✅ Active (requires Prisma CLI v6.6.0+)
**Setup:**
```bash
npm install -D prisma@latest  # Ensure v6.6.0+
```

**Usage:**
- Ask Claude about schema changes
- Request migration suggestions
- Query optimization advice

**Example:** "Suggest an index for the Invoice model to improve query performance"

### 3. GitHub MCP Server
**Status:** ⚠️ Requires Setup

**Setup:**
1. Create GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Generate new token (classic)
   - Scopes: `repo`, `read:org`, `workflow`

2. Add to environment:
   ```bash
   # Add to .env.local (not committed)
   GITHUB_TOKEN=ghp_your_token_here
   ```

3. Test:
   ```bash
   npx -y @modelcontextprotocol/server-github --help
   ```

**Usage:**
- "Show me the latest PR comments"
- "Check CI/CD status for PR #123"
- "Create a GitHub issue for this bug"

### 4. Sentry MCP Server
**Status:** ⚠️ Requires Setup

**Setup:**
1. Get Sentry Auth Token:
   - Go to https://sentry.io/settings/account/api/auth-tokens/
   - Create new token with `project:read`, `event:read` scopes

2. Add to environment:
   ```bash
   # Add to .env.local (not committed)
   SENTRY_AUTH_TOKEN=your_token_here
   SENTRY_ORG=your-org
   SENTRY_PROJECT=your-project
   ```

3. Test:
   ```bash
   npx -y @sentry/mcp-server --help
   ```

**Usage:**
- "Show me the latest production errors"
- "Analyze error trend for Invoice module"
- "Debug this stack trace from Sentry"

---

## Troubleshooting

### MCP Server Not Responding

**Symptoms:** "MCP server unavailable" error

**Solutions:**
1. Check environment variables are set
2. Verify network connectivity
3. Test command manually: `npx [command]`
4. Check Claude Code logs for details

### GitHub MCP Token Issues

**Error:** "Authentication failed"

**Solutions:**
1. Verify token has correct scopes (`repo`, `read:org`, `workflow`)
2. Check token hasn't expired
3. Ensure token is in environment: `echo $GITHUB_TOKEN`

### Sentry MCP Connection Issues

**Error:** "Sentry project not found"

**Solutions:**
1. Verify org and project names match Sentry exactly
2. Check token has `project:read` scope
3. Test Sentry API: `curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" https://sentry.io/api/0/`

---

## Performance Impact

**Expected query latency:**
- Context7: <1s (HTTP, cached)
- Prisma MCP: <2s (local process)
- GitHub MCP: 1-3s (GitHub API)
- Sentry MCP: 1-3s (Sentry API)

**Recommendation:** Use MCPs for research/planning, not in hot paths
```

#### Task 3.3: Test MCP Servers

- [ ] Context7: Ask "How do I create a Server Component in Next.js?"
- [ ] Prisma: Ask "Suggest an index for Invoice lookups by tenantId"
- [ ] GitHub: Ask "Show me open PRs in this repository"
- [ ] Sentry: Ask "Show me errors from the last 24 hours"

---

### Phase 4: Add Child CLAUDE.md Files (1 hour)

**Goal:** Create context-specific files for subdirectories

#### Task 4.1: Create Frontend Context

**File:** `apps/web/CLAUDE.md`

```markdown
# Frontend Application (Next.js 16)

**Port:** 3000
**Tech:** Next.js 16, React 18, TypeScript, Tailwind CSS, Clerk

---

## Context

This is the customer-facing web application for Akount.

**See root `CLAUDE.md` for project overview.**
**Frontend rules auto-load from `.claude/rules/frontend/nextjs.md`**

---

## Key Directories

- `src/app/` - Next.js 16 App Router pages
- `src/components/` - React components
- `src/lib/` - Utility functions and helpers
- `src/styles/` - Global styles and Tailwind config

---

## Running Locally

```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript validation
```

---

## Common Tasks

**Add new page:**
1. Create in `src/app/(dashboard)/[feature]/page.tsx`
2. Start as Server Component (async)
3. Use Client Component only if interactivity needed

**Add new component:**
1. Create in `src/components/[feature]/[Component].tsx`
2. Export from `src/components/[feature]/index.ts`
3. Follow design system (use components from `ui/`)

**See:** Root `CLAUDE.md` → Quick Start for workflows
```

#### Task 4.2: Create Backend Context

**File:** `apps/api/CLAUDE.md`

```markdown
# Backend API (Fastify)

**Port:** 4000
**Tech:** Fastify, TypeScript, Clerk JWT, Zod validation

---

## Context

This is the backend API server for Akount (optional - most APIs are in Next.js API routes).

**See root `CLAUDE.md` for project overview.**
**Backend rules auto-load from `.claude/rules/backend/fastify.md`**

---

## Key Directories

- `src/routes/` - API route handlers
- `src/lib/` - Business logic and services
- `src/middleware/` - Auth, validation, error handling
- `src/types/` - TypeScript type definitions

---

## Running Locally

```bash
npm run dev       # Start dev server (port 4000)
npm run build     # Production build
npm run test      # Run tests
```

---

## Common Tasks

**Add new API route:**
1. Create in `src/routes/[resource].ts`
2. Add Zod schema for validation
3. Add Clerk auth middleware
4. Enforce tenant isolation in queries

**See:** Root `CLAUDE.md` → Quick Start for workflows
```

#### Task 4.3: Create Database Context

**File:** `packages/db/CLAUDE.md`

```markdown
# Database Package (Prisma)

**Schema:** `prisma/schema.prisma`
**Migrations:** `prisma/migrations/`

---

## Context

This package contains the Prisma schema and database utilities.

**See root `CLAUDE.md` for project overview.**
**Database rules auto-load from `.claude/rules/database/prisma.md`**

---

## Key Files

- `prisma/schema.prisma` - Database schema (40+ models)
- `prisma/migrations/` - Migration history
- `prisma/seed.ts` - Seed data script
- `src/index.ts` - Prisma client export

---

## Common Commands

```bash
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Create & apply migration
npx prisma studio       # Open Prisma Studio (GUI)
npx prisma validate     # Validate schema
npx prisma format       # Format schema
```

---

## Schema Conventions

**Every model MUST have:**
- `id` (String, cuid)
- `tenantId` (String) - multi-tenancy
- `deletedAt` (DateTime?) - soft delete
- `createdAt`, `updatedAt` - audit trail
- `@@index([tenantId])` - performance

**Money fields:**
- Use `Int` for amounts (cents)
- Never `Decimal` or `Float`

**See:** Root `CLAUDE.md` → Quick Start for workflows
```

---

### Phase 5: Test & Validate (1 hour)

**Goal:** Verify all changes work correctly and no regressions

#### Task 5.1: Unit Tests

**Test 1: Path Scoping Works**
```bash
# Test: Edit frontend file → frontend rules load
# Edit: apps/web/src/app/dashboard/page.tsx
# Expected: .claude/rules/frontend/nextjs.md loads
# Verification: Ask Claude "What rules apply to this file?"

# Test: Edit backend file → backend + multi-tenancy rules load
# Edit: apps/api/src/routes/invoices.ts
# Expected: .claude/rules/backend/fastify.md + multi-tenancy.md load
# Verification: Ask Claude "What rules apply to this file?"

# Test: Edit schema → database + financial rules load
# Edit: packages/db/prisma/schema.prisma
# Expected: .claude/rules/database/prisma.md + financial-data.md load
# Verification: Ask Claude "What rules apply to this file?"
```

**Test 2: CLAUDE.md Reduced**
```bash
# Verify line count
wc -l CLAUDE.md
# Expected: ~100 lines (was 393)

# Verify critical examples preserved
grep "tenantId" CLAUDE.md
grep "Integer cents" CLAUDE.md
# Expected: Code examples still present
```

**Test 3: MCPs Operational**
```bash
# Test Context7
# Ask: "How do I create a Server Component in Next.js?"
# Expected: Detailed response with Next.js 16 patterns

# Test Prisma MCP
# Ask: "Suggest indexes for Invoice model"
# Expected: Index recommendations based on schema

# Test GitHub MCP (if token configured)
# Ask: "Show me open PRs"
# Expected: List of PRs from repository

# Test Sentry MCP (if token configured)
# Ask: "Show recent errors"
# Expected: Error list from Sentry
```

**Test 4: Child CLAUDE.md Files**
```bash
# Navigate to apps/web
cd apps/web
# Ask: "What is this directory?"
# Expected: Response mentions "Frontend Application (Next.js 16)"

# Navigate to apps/api
cd apps/api
# Ask: "What is this directory?"
# Expected: Response mentions "Backend API (Fastify)"
```

#### Task 5.2: Integration Tests

**Test 5: Existing Hooks Still Work**
```bash
# Test file protection hook
# Try to edit .env
# Expected: Blocked by protect-files.sh

# Test pre-commit validation
# Try to commit with TypeScript errors
# Expected: Blocked by pre-commit-validation.sh

# Test auto-format
# Edit TypeScript file with bad formatting
# Expected: Auto-formatted by auto-format.sh
```

**Test 6: Agents Still Work**
```bash
# Test financial data validator
# Ask: "Review this code for financial data issues"
# Expected: Agent runs successfully

# Test architecture strategist
# Ask: "Review this architecture change"
# Expected: Agent runs successfully
```

**Test 7: Workflows Still Work**
```bash
# Test brainstorm workflow
/processes:brainstorm test feature
# Expected: Workflow executes successfully

# Test plan workflow
/processes:plan test feature
# Expected: Workflow executes successfully
```

#### Task 5.3: Performance Tests

**Test 8: Context Window Usage**
```bash
# Before: CLAUDE.md (393 lines) loaded every session
# After: CLAUDE.md (100 lines) + selective rules

# Measure (approximate):
# Before: ~20k tokens baseline
# After: ~10k tokens baseline
# Expected: 50% reduction
```

**Test 9: CLAUDE.md Load Time**
```bash
# Before: 393 lines
# After: 100 lines
# Expected: 50% faster load (theoretical)
```

#### Task 5.4: Rollback Verification

- [ ] Backup files exist (CLAUDE.md.backup.2026-01-31)
- [ ] Can restore quickly if issues found
- [ ] Git commit created for easy revert

---

## Security Considerations

### No Security Changes
- All existing security controls preserved (hooks, permissions, deny list)
- No new attack surface introduced
- MCP servers run locally (stdio) or HTTPS (Context7)

### Environment Variables
- GitHub token and Sentry token stored in `.env.local` (not committed)
- Add to `.gitignore` if not already present
- Document token permissions in MCP-INTEGRATION-GUIDE.md

### Path Scoping Security
- Rules only load for matching paths (no privilege escalation)
- Critical rules (multi-tenancy, financial) still enforce ZERO EXCEPTIONS
- No weakening of existing constraints

---

## Performance Considerations

### Context Window Optimization
- **Before:** 393-line CLAUDE.md loaded every session (~20k tokens)
- **After:** 100-line CLAUDE.md + selective rules (~10k baseline)
- **Impact:** 50% reduction in baseline context usage

### Rule Loading Overhead
- Path-scoped rules load conditionally (<100ms per file)
- Only 1-3 rule files typically load per file edit
- Net performance gain (less context pollution)

### MCP Query Latency
- Context7: <1s (HTTP, cached)
- Prisma MCP: <2s (local process, fast)
- GitHub/Sentry MCPs: 1-3s (external APIs)
- **Mitigation:** Use MCPs for research/planning, not hot paths

---

## Testing Strategy

### Manual Testing (Phase 5)
- Path scoping verification (7 tests)
- MCP server functionality (4 tests)
- Hook compatibility (3 tests)
- Agent compatibility (2 tests)
- Workflow compatibility (2 tests)
- **Total:** 18 manual tests (~1 hour)

### Automated Testing
- Pre-commit validation hook (already automated)
- Auto-format hook (already automated)
- No new automated tests needed

### User Acceptance Testing
- Developer on team tests new structure (1 week)
- Collect feedback on clarity and usability
- Iterate based on feedback

---

## Rollout Plan

### Week 1: Implementation & Internal Testing

**Day 1:**
- Implement Phase 1 (rules directory) - 2 hours
- Implement Phase 2 (slim CLAUDE.md) - 1 hour
- **Total:** 3 hours

**Day 2:**
- Implement Phase 3 (MCPs) - 1 hour
- Implement Phase 4 (child CLAUDE.md) - 1 hour
- **Total:** 2 hours

**Day 3:**
- Implement Phase 5 (testing) - 1 hour
- Create git commit
- **Total:** 1 hour

**Total Implementation:** 6 hours over 3 days

### Week 2: Team Rollout

**Day 1:**
- Share MCP-INTEGRATION-GUIDE.md with team
- Help team set up GitHub and Sentry tokens
- Monitor for issues

**Day 2-5:**
- Team uses new structure
- Collect feedback
- Address any issues
- Document learnings

### Rollback Plan

**If critical issues found:**
1. Restore CLAUDE.md backup: `cp CLAUDE.md.backup.2026-01-31 CLAUDE.md`
2. Remove `.claude/rules/` directory: `rm -rf .claude/rules/`
3. Revert `.mcp.json` to previous version
4. Remove child CLAUDE.md files
5. Git revert commit
6. **Time to rollback:** <5 minutes

---

## Open Questions

### For Team Discussion
- [ ] Should we set up GitHub MCP tokens immediately or defer? (Recommended: Defer to Week 2)
- [ ] Should we set up Sentry MCP tokens immediately or defer? (Recommended: Defer to Week 2)
- [ ] Do we need more rule files for specific domains? (Can add iteratively)
- [ ] Should we create video tutorial for new structure? (Nice-to-have, defer to Phase 2)

### For Future Consideration
- [ ] Build custom Canadian Tax Rules MCP? (Validate standard MCPs first - Month 2-3)
- [ ] Build custom GAAP Compliance MCP? (Same timeline)
- [ ] Build custom Flinks Banking MCP? (Same timeline)
- [ ] Open-source custom MCPs? (Yes, if we build them)

---

## Dependencies

**Blocked By:** None (can start immediately)

**Blocks:** None (infrastructure improvement, doesn't block feature work)

**Prerequisites:**
- Prisma CLI v6.6.0+ (for Prisma MCP) - Check: `npx prisma --version`
- Node.js 18+ (for MCP servers) - Already required
- Git Bash (for Windows) - Already required for hooks

---

## Resources

### Documentation Created
- `.claude/rules/multi-tenancy.md`
- `.claude/rules/financial-data.md`
- `.claude/rules/frontend/nextjs.md`
- `.claude/rules/backend/fastify.md`
- `.claude/rules/database/prisma.md`
- `.claude/rules/security.md`
- `.claude/rules/testing.md`
- `.claude/MCP-INTEGRATION-GUIDE.md`
- `apps/web/CLAUDE.md`
- `apps/api/CLAUDE.md`
- `packages/db/CLAUDE.md`

### Documentation Updated
- `CLAUDE.md` (393 → 100 lines)
- `.mcp.json` (add 3 MCPs)
- `.claude/CONFIGURATION-GUIDE.md` (document rules directory)
- `.claude/MCP-SERVERS.md` (update MCP list)

### Related
- **Brainstorm:** `docs/brainstorms/2026-01-31-claude-code-enhancement-brainstorm.md`
- **Previous Work:** `.claude/IMPLEMENTATION-SUMMARY.md`
- **Research:** `docs/research/mcp-servers-evaluation-2026.md`

---

## Estimation

**Complexity:** MEDIUM (configuration changes, no code changes)

**Effort:** 6 hours over 1-2 weeks (spread across days to allow testing time)

**Breakdown:**
- Phase 1: Create rules directory (2 hours)
- Phase 2: Slim CLAUDE.md (1 hour)
- Phase 3: Add MCPs (1 hour)
- Phase 4: Add child CLAUDE.md (1 hour)
- Phase 5: Test & validate (1 hour)

**Risk:** LOW (non-breaking changes, easy rollback, incremental approach)

**Risk Factors:**
- Path scoping might not work as expected (Mitigation: Test thoroughly in Phase 5)
- MCP servers might fail to connect (Mitigation: Graceful degradation to Context7)
- Team unfamiliar with new structure (Mitigation: Documentation + pair programming)
- Performance impact unknown (Mitigation: Monitor and adjust)

---

## Success Metrics

### Immediate (Implementation Complete)
- ✅ `.claude/rules/` directory with 7 files
- ✅ CLAUDE.md reduced to 100 lines
- ✅ 3 MCPs operational
- ✅ All tests passing

### Short-Term (Week 1-2)
- 📊 Context window: 50% reduction (20k → 10k tokens)
- 📊 Path scoping: Works correctly (rules load conditionally)
- 📊 Zero merge conflicts on CLAUDE.md

### Medium-Term (Month 1)
- 📊 Productivity: 20-30% boost (measured by task time)
- 📊 Team satisfaction: >8/10 on clarity
- 📊 MCP usage: 50+ queries/week

### Long-Term (Month 2-3)
- 📊 Scales to 10+ developers (no issues)
- 📊 Custom MCP decision: Validated with data
- 📊 Open-source opportunity: Identified

---

**Plan Status:** ✅ Ready for implementation
**Estimated Start:** Upon approval
**Estimated Completion:** 6 hours over 1-2 weeks (non-blocking)

---

**End of Implementation Plan**
