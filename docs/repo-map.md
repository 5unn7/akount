# Akount Repository Map

> **Last Updated:** 2026-02-07
> **Purpose:** "If you want to change X, look here" - Quick navigation for developers and AI

---

## Quick Navigation Table

| I want to... | Look here |
|--------------|-----------|
| Add an API endpoint | `apps/api/src/domains/<domain>/routes/` |
| Add a page | `apps/web/src/app/(dashboard)/<domain>/` |
| Add a UI component | `packages/ui/src/components/` |
| Add a shared type | `packages/types/src/` |
| Change the database schema | `packages/database/prisma/schema.prisma` |
| Add design tokens | `packages/design-tokens/src/` |
| Add a skill/command | `.claude/commands/<category>/` |
| Add a hook | `.claude/hooks/` |
| Add documentation | `docs/<appropriate-folder>/` |
| Add a standard | `docs/standards/` |
| Add a feature spec | `docs/design-system/03-screens/` |

---

## Directory Structure

```
akount/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── domains/        # Domain-organized routes & services
│   │   │   │   ├── overview/
│   │   │   │   ├── money-movement/
│   │   │   │   ├── business/
│   │   │   │   ├── accounting/
│   │   │   │   ├── planning/
│   │   │   │   ├── ai-advisor/
│   │   │   │   ├── services/
│   │   │   │   └── system/
│   │   │   ├── middleware/     # Auth, tenant, validation
│   │   │   ├── plugins/        # Fastify plugins
│   │   │   └── utils/          # Shared utilities
│   │   └── tests/              # API tests
│   │
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/  # Authenticated pages
│       │   │   │   ├── overview/
│       │   │   │   ├── money-movement/
│       │   │   │   ├── business/
│       │   │   │   ├── accounting/
│       │   │   │   ├── planning/
│       │   │   │   ├── ai-advisor/
│       │   │   │   ├── services/
│       │   │   │   └── system/
│       │   │   ├── (auth)/       # Login, signup, etc.
│       │   │   └── (marketing)/  # Public pages
│       │   ├── components/       # App-specific components
│       │   ├── hooks/            # React hooks
│       │   ├── lib/              # Utilities, API client
│       │   └── styles/           # Global styles
│       └── tests/                # Frontend tests
│
├── packages/
│   ├── ui/                     # Shared UI component library
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── hooks/          # Shared hooks
│   │   │   └── utils/          # UI utilities
│   │   └── tests/
│   │
│   ├── database/               # Prisma + database utilities
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # Migration files
│   │   │   └── seed.ts         # Seed data
│   │   └── src/                # Generated client + helpers
│   │
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │       ├── api/            # API request/response types
│   │       ├── domain/         # Domain models
│   │       └── shared/         # Common utilities
│   │
│   └── design-tokens/          # Design system tokens
│       └── src/
│           ├── colors.ts
│           ├── typography.ts
│           ├── spacing.ts
│           └── index.ts
│
├── docs/                       # Documentation
│   ├── architecture/           # ADRs, system design
│   ├── design-system/          # UI/UX specifications
│   ├── standards/              # Coding standards
│   ├── guides/                 # How-to guides
│   ├── brainstorms/            # Feature exploration
│   ├── plans/                  # Implementation plans
│   └── archive/                # Historical docs
│       └── sessions/           # Session artifacts
│
├── scripts/                    # Automation scripts
│   ├── ai/                     # AI workflow CLI
│   └── setup/                  # Setup scripts
│
├── .claude/                    # Claude Code configuration
│   ├── commands/               # Skill definitions
│   │   ├── processes/          # Workflow skills
│   │   └── quality/            # Quality skills
│   ├── hooks/                  # Hook scripts
│   ├── agents/                 # Agent configurations
│   └── settings.local.json     # Local settings
│
└── [Root files]
    ├── CLAUDE.md               # Agent context
    ├── STATUS.md               # Current progress
    ├── TASKS.md                # Task tracking
    ├── ROADMAP.md              # Phase planning
    └── package.json            # Monorepo root
```

---

## Domain Deep Dives

### API Domains (`apps/api/src/domains/`)

Each domain follows this structure:

```
<domain>/
├── routes/
│   ├── index.ts          # Route registration
│   └── <resource>.ts     # Resource routes (GET, POST, etc.)
├── services/
│   └── <resource>.service.ts
├── schemas/
│   └── <resource>.schema.ts  # Zod schemas
└── types/
    └── <resource>.types.ts
```

**Domain Mapping:**

| Domain | Resources | Responsibilities |
|--------|-----------|------------------|
| `overview` | Dashboard, Summary | Aggregated views, KPIs |
| `money-movement` | Invoices, Bills, Banking, Payments | Financial transactions |
| `business` | Clients, Vendors, Products | Business relationships |
| `accounting` | GL Accounts, Journal, Reports | Core accounting |
| `planning` | Budgets, Forecasts | Financial planning |
| `ai-advisor` | Chat, Insights | AI-powered features |
| `services` | Apps, Integrations | Third-party connections |
| `system` | Settings, Users, Tenant | System administration |

---

### Web Pages (`apps/web/src/app/(dashboard)/`)

Each domain follows App Router conventions:

```
<domain>/
├── page.tsx              # Domain landing/list page
├── layout.tsx            # Domain layout (optional)
├── loading.tsx           # Loading state
├── error.tsx             # Error boundary
├── [id]/
│   ├── page.tsx          # Detail view
│   └── edit/
│       └── page.tsx      # Edit form
└── new/
    └── page.tsx          # Create form
```

**Server vs Client Components:**
- `page.tsx` - Server Component (data fetching)
- `*-form.tsx` - Client Component (`'use client'`)
- `*-table.tsx` - Client Component (interactivity)

---

### UI Components (`packages/ui/src/components/`)

```
components/
├── primitives/           # Base components (Button, Input, Card)
├── composed/             # Composite components (DataTable, Form)
├── layout/               # Layout components (Header, Sidebar, Shell)
├── feedback/             # Feedback components (Toast, Alert, Modal)
└── domain/               # Domain-specific (InvoiceCard, ClientPicker)
```

**Component Convention:**
```typescript
// filename: ComponentName.tsx
export function ComponentName({ prop1, prop2 }: ComponentNameProps) { ... }
export type ComponentNameProps = { ... }
```

---

### Database Schema (`packages/database/prisma/`)

**Key Models by Domain:**

| Model | Domain | Key Fields |
|-------|--------|------------|
| `Tenant` | system | id, name, plan |
| `User` | system | id, clerkId, email |
| `TenantMembership` | system | tenantId, userId, role |
| `Entity` | system | id, tenantId, name, baseCurrency |
| `GLAccount` | accounting | id, entityId, code, type, name |
| `JournalEntry` | accounting | id, entityId, date, lines[] |
| `JournalLine` | accounting | id, journalEntryId, glAccountId, debit, credit |
| `Invoice` | money-movement | id, entityId, clientId, amount, status |
| `Bill` | money-movement | id, entityId, vendorId, amount, status |
| `BankAccount` | money-movement | id, entityId, glAccountId |
| `BankTransaction` | money-movement | id, bankAccountId, amount, status |
| `Client` | business | id, tenantId, name, email |
| `Vendor` | business | id, tenantId, name, email |
| `Product` | business | id, tenantId, name, price |

**Schema Conventions:**
- Every model has `id` (cuid), `createdAt`, `updatedAt`
- Financial models have `deletedAt` (soft delete)
- Tenant-scoped models have `tenantId`
- Entity-scoped models have `entityId`
- Money fields are `Int` (cents)

---

## Common Patterns

### Adding a New API Endpoint

1. **Create schema** (`apps/api/src/domains/<domain>/schemas/<resource>.schema.ts`):
   ```typescript
   import { z } from 'zod'

   export const CreateResourceSchema = z.object({
     name: z.string().min(1),
     amount: z.number().int(), // cents
   })
   ```

2. **Create service** (`apps/api/src/domains/<domain>/services/<resource>.service.ts`):
   ```typescript
   export async function createResource(
     data: CreateResourceInput,
     ctx: TenantContext
   ) {
     return prisma.resource.create({
       data: {
         ...data,
         tenantId: ctx.tenantId, // REQUIRED
       },
     })
   }
   ```

3. **Create route** (`apps/api/src/domains/<domain>/routes/<resource>.ts`):
   ```typescript
   export async function resourceRoutes(fastify: FastifyInstance) {
     fastify.post('/', {
       schema: { body: CreateResourceSchema },
       handler: async (request, reply) => {
         const result = await createResource(request.body, request.tenant)
         return reply.status(201).send(result)
       },
     })
   }
   ```

4. **Register route** (`apps/api/src/domains/<domain>/routes/index.ts`)

---

### Adding a New Page

1. **Create page** (`apps/web/src/app/(dashboard)/<domain>/<resource>/page.tsx`):
   ```typescript
   // Server Component - fetch data here
   export default async function ResourcePage() {
     const data = await getResources()
     return <ResourceList data={data} />
   }
   ```

2. **Create client component** (`apps/web/src/app/(dashboard)/<domain>/<resource>/resource-list.tsx`):
   ```typescript
   'use client'

   export function ResourceList({ data }: { data: Resource[] }) {
     // Interactive logic here
   }
   ```

---

### Adding a Database Migration

1. **Edit schema** (`packages/database/prisma/schema.prisma`)

2. **Generate migration**:
   ```bash
   npm run db:migrate -- --name descriptive_name
   ```

3. **Review migration** (`packages/database/prisma/migrations/`)

4. **Apply migration**:
   ```bash
   npm run db:migrate:deploy
   ```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo pipeline configuration |
| `package.json` (root) | Monorepo scripts and dependencies |
| `tsconfig.json` (root) | Base TypeScript configuration |
| `.env.example` | Environment variable template |
| `.github/workflows/` | CI/CD pipelines |
| `CLAUDE.md` | AI agent context |
| `.claude/settings.local.json` | Local Claude Code settings |

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `invoice-service.ts` |
| Components | PascalCase | `InvoiceCard.tsx` |
| Functions | camelCase | `createInvoice()` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Types | PascalCase | `InvoiceStatus` |
| Database tables | PascalCase (Prisma) | `JournalEntry` |
| API routes | kebab-case | `/api/money-movement/invoices` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL` |

---

## Cross-References

| Topic | Location |
|-------|----------|
| Architecture diagrams | `docs/architecture.mmd` |
| Domain definitions | `docs/domain-glossary.md` |
| Financial standards | `docs/standards/financial-data.md` |
| Multi-tenancy rules | `docs/standards/multi-tenancy.md` |
| API design standards | `docs/standards/api-design.md` |
| UI specifications | `docs/design-system/` |
| RBAC permissions | `docs/design-system/05-governance/permissions-matrix.md` |
