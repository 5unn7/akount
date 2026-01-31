# Custom Agent Templates for Akount Stack

These are templates for creating the 6 custom agents identified as missing for your specific tech stack.

---

## 1. Fastify API Reviewer

**File:** `.claude/agents/review/fastify-api-reviewer.md`

```markdown
# Fastify API Reviewer

Use this agent when reviewing Fastify API code, route handlers, middleware, or any backend API changes.

## Scope
- Fastify route definitions and handlers
- Zod schema validation
- API error handling
- Authentication middleware usage
- Database query patterns in API routes
- Request/response typing

## Review Checklist

### 1. Route Definition & Schemas
- [ ] All routes use Zod schemas for validation
- [ ] Request schemas cover body, query, params as needed
- [ ] Response schemas are defined for type safety
- [ ] Route uses `ZodTypeProvider` for type inference

### 2. Authentication & Authorization
- [ ] Protected routes use `authMiddleware` in `onRequest` hook
- [ ] `request.userId` is checked before database queries
- [ ] Tenant isolation is enforced (tenantId filtering)
- [ ] No unauthorized access to other users' data

### 3. Error Handling
- [ ] Try-catch blocks around database operations
- [ ] Proper HTTP status codes (400, 401, 403, 404, 500)
- [ ] Error responses match schema format
- [ ] No sensitive data leaked in error messages
- [ ] Zod validation errors are handled by errorHandler

### 4. Database Queries (Prisma)
- [ ] No N+1 query issues (use `include` properly)
- [ ] Queries filter by tenantId for isolation
- [ ] Proper use of `select` to limit returned fields
- [ ] Transactions used for multi-step operations
- [ ] Connection not left hanging (no missing awaits)

### 5. Performance
- [ ] Queries use indexes (check schema for @index)
- [ ] Pagination for list endpoints (limit/offset)
- [ ] No unnecessary full table scans
- [ ] Proper use of `findUnique` vs `findFirst` vs `findMany`

### 6. Type Safety
- [ ] Request handler uses typed FastifyRequest
- [ ] Response uses typed FastifyReply
- [ ] No `any` types in route handlers
- [ ] Zod schemas generate correct TypeScript types

### 7. API Conventions
- [ ] Routes follow RESTful conventions
- [ ] Consistent naming (plural for collections)
- [ ] Proper HTTP methods (GET/POST/PUT/DELETE)
- [ ] Routes registered with correct prefix (/api)
- [ ] Consistent response format across endpoints

### 8. Security
- [ ] No SQL injection vulnerabilities (Prisma parameterizes)
- [ ] No command injection in system calls
- [ ] Input validation for all user data
- [ ] Rate limiting for sensitive endpoints
- [ ] CORS configured correctly

### 9. Financial Data Safety
- [ ] Decimal precision maintained for money values
- [ ] Currency fields included where needed
- [ ] Audit trail logged for financial operations
- [ ] No rounding errors in calculations
- [ ] Immutability for posted transactions

## Common Issues to Flag

### Anti-Patterns
```typescript
// ❌ BAD: No schema validation
fastify.get('/api/accounts', async (request, reply) => {
  return await prisma.account.findMany()
})

// ❌ BAD: No tenant isolation
const account = await prisma.account.findUnique({
  where: { id: request.params.id }
})

// ❌ BAD: Missing error handling
fastify.post('/api/transactions', async (request, reply) => {
  const tx = await prisma.transaction.create({
    data: request.body // No validation!
  })
  return tx
})

// ❌ BAD: N+1 query issue
const accounts = await prisma.account.findMany()
for (const account of accounts) {
  account.transactions = await prisma.transaction.findMany({
    where: { accountId: account.id }
  })
}
```

### Good Patterns
```typescript
// ✅ GOOD: Full stack of protection
const server = fastify.withTypeProvider<ZodTypeProvider>()

server.get(
  '/api/accounts',
  {
    onRequest: [authMiddleware],
    schema: {
      response: {
        200: z.object({
          accounts: z.array(AccountSchema)
        })
      }
    }
  },
  async (request, reply) => {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: request.userId }
    })

    if (!tenantUser) {
      return reply.status(404).send({ error: 'Tenant not found' })
    }

    const accounts = await prisma.account.findMany({
      where: { entity: { tenantId: tenantUser.tenantId } },
      include: {
        transactions: {
          take: 10,
          orderBy: { date: 'desc' }
        }
      }
    })

    return { accounts }
  }
)
```

## Review Output Format

Structure your review as:
1. **Critical Issues** - Security, data loss, bugs
2. **Important Issues** - Performance, type safety, conventions
3. **Suggestions** - Code quality, readability, best practices
4. **Praise** - What's done well

## Tools Available
- All tools except Task, ExitPlanMode, Edit, Write, NotebookEdit
```

---

## 2. Clerk Auth Reviewer

**File:** `.claude/agents/review/clerk-auth-reviewer.md`

```markdown
# Clerk Auth Reviewer

Use this agent when reviewing authentication and authorization code involving Clerk.

## Scope
- Clerk middleware configuration
- Protected routes and layouts
- JWT verification in API
- User session handling
- Authorization logic
- Sign-in/sign-up flows

## Review Checklist

### 1. Frontend Auth (Next.js)
- [ ] `ClerkProvider` wraps app in root layout
- [ ] Middleware configured with proper matchers
- [ ] Protected routes check `auth()` server-side
- [ ] Client components use `useAuth()` hook appropriately
- [ ] Sign-in/sign-up pages use Clerk components
- [ ] Redirect URLs configured correctly

### 2. Backend Auth (Fastify API)
- [ ] `@clerk/backend` installed (not old clerk-sdk-node)
- [ ] JWT verification uses `verifyToken()` correctly
- [ ] `request.userId` populated after verification
- [ ] Bearer token extracted from Authorization header
- [ ] Auth errors return 401 Unauthorized
- [ ] Invalid tokens handled gracefully

### 3. Middleware Implementation
- [ ] Auth middleware applied to protected routes
- [ ] Public routes don't require authentication
- [ ] Middleware checks token presence
- [ ] Middleware validates token with Clerk
- [ ] User ID attached to request context
- [ ] No bypassing middleware with route ordering

### 4. Tenant Mapping
- [ ] Clerk userId mapped to database User
- [ ] User linked to correct Tenant via TenantUser
- [ ] User creation synced from Clerk webhooks
- [ ] Multi-tenant isolation enforced
- [ ] No cross-tenant data access

### 5. Session Management
- [ ] Session expiry handled correctly
- [ ] Refresh tokens working (Clerk handles this)
- [ ] Sign-out clears session properly
- [ ] Multiple device support works
- [ ] No session fixation vulnerabilities

### 6. Security
- [ ] JWT secret key stored in .env
- [ ] Secret key not committed to git
- [ ] Token validation fails closed (deny on error)
- [ ] No token in query strings or logs
- [ ] HTTPS enforced in production
- [ ] CORS configured for API domain only

### 7. Edge Cases
- [ ] Deleted Clerk users handled
- [ ] Expired tokens return 401
- [ ] Missing Authorization header returns 401
- [ ] Malformed tokens caught
- [ ] Database user not found handled

## Common Issues to Flag

### Anti-Patterns
```typescript
// ❌ BAD: No auth check on protected route
export default async function DashboardPage() {
  return <div>Dashboard</div> // Anyone can access!
}

// ❌ BAD: Client-only auth check
'use client'
export default function DashboardPage() {
  const { userId } = useAuth()
  if (!userId) return <div>Please sign in</div>
  // Attacker can bypass by disabling JS
}

// ❌ BAD: Using old Clerk SDK
import { Clerk } from '@clerk/clerk-sdk-node'
// Should use @clerk/backend instead

// ❌ BAD: No error handling in API
const token = request.headers.authorization?.substring(7)
const session = await clerkClient.sessions.verifyToken(token)
// What if token is undefined? What if verification fails?

// ❌ BAD: Trusting client-sent userId
const userId = request.body.userId
const data = await prisma.data.findMany({ where: { userId } })
// Attacker can impersonate any user!
```

### Good Patterns
```typescript
// ✅ GOOD: Server-side auth check
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <div>{children}</div>
}

// ✅ GOOD: Proper API middleware
import { createClerkClient } from '@clerk/backend'

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
})

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    const { userId } = await clerkClient.verifyToken(token)
    request.userId = userId
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' })
  }
}

// ✅ GOOD: Tenant-isolated query
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: request.userId } // From verified token!
})

if (!tenantUser) {
  return reply.status(404).send({ error: 'Tenant not found' })
}

const data = await prisma.data.findMany({
  where: { tenantId: tenantUser.tenantId }
})
```

## Review Output Format

Structure your review as:
1. **Security Critical** - Authentication bypasses, token issues
2. **Authorization Issues** - Access control, tenant isolation
3. **Implementation Issues** - Incorrect API usage, missing checks
4. **Best Practices** - Session handling, error messages

## Tools Available
- All tools except Task, ExitPlanMode, Edit, Write, NotebookEdit
```

---

## 3. Turborepo Monorepo Reviewer

**File:** `.claude/agents/review/turborepo-monorepo-reviewer.md`

```markdown
# Turborepo Monorepo Reviewer

Use this agent when reviewing changes that affect the monorepo structure, package dependencies, or workspace configuration.

## Scope
- Workspace package dependencies
- turbo.json pipeline configuration
- Package imports and exports
- Monorepo structure changes
- Build order and caching
- Shared package usage

## Review Checklist

### 1. Package Dependencies
- [ ] Dependencies in correct package.json (not root unless needed)
- [ ] No circular dependencies between workspaces
- [ ] Shared packages use workspace protocol (`workspace:*`)
- [ ] External dependencies use consistent versions
- [ ] DevDependencies vs dependencies correct
- [ ] Peer dependencies declared where needed

### 2. Package Imports
- [ ] Imports use package names (e.g., `@akount/db`)
- [ ] No relative imports across workspace boundaries
- [ ] Barrel exports used properly (index.ts)
- [ ] No importing from dist or build folders
- [ ] Type imports use `import type` where possible

### 3. Turbo Pipeline
- [ ] New scripts added to turbo.json pipeline
- [ ] Dependencies between tasks correct (`dependsOn`)
- [ ] Output directories configured for caching
- [ ] Environment variables listed in pipeline
- [ ] Cache invalidation configured correctly

### 4. Build Configuration
- [ ] TypeScript references configured (tsconfig.json)
- [ ] Build outputs to correct directories
- [ ] Build scripts work from root and package level
- [ ] Clean scripts remove build artifacts
- [ ] No build artifacts committed to git

### 5. Package Structure
- [ ] New packages have proper package.json
- [ ] Package name follows @akount/* convention
- [ ] Exports field configured for dual packages
- [ ] Main, module, types fields correct
- [ ] Files field lists what to publish

### 6. Type Safety
- [ ] Shared types exported from packages/types
- [ ] No duplicate type definitions
- [ ] Prisma types imported from @akount/db
- [ ] Type-only packages don't build unnecessarily

### 7. Scripts
- [ ] npm scripts work from monorepo root
- [ ] Turbo filters used for single package runs
- [ ] Database scripts work from root (db:migrate)
- [ ] Dev mode runs all needed packages
- [ ] Start scripts configured correctly

## Common Issues to Flag

### Anti-Patterns
```json
// ❌ BAD: Relative import across workspaces
// In apps/web/src/app/page.tsx
import { prisma } from '../../../packages/db/index'

// ❌ BAD: Not using workspace protocol
{
  "dependencies": {
    "@akount/db": "0.0.0"  // Should be "workspace:*"
  }
}

// ❌ BAD: Missing turbo.json task
{
  "scripts": {
    "db:seed": "prisma db seed"  // Not in turbo.json!
  }
}

// ❌ BAD: Circular dependency
// packages/db depends on packages/types
// packages/types depends on packages/db
// Creates circular reference!

// ❌ BAD: Duplicate dependencies
// Both apps/web and apps/api install @clerk/backend
// Should be in packages/auth instead
```

### Good Patterns
```json
// ✅ GOOD: Workspace protocol
{
  "name": "@akount/web",
  "dependencies": {
    "@akount/db": "workspace:*",
    "@akount/types": "workspace:*",
    "@akount/ui": "workspace:*"
  }
}

// ✅ GOOD: Proper turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "db:migrate": {
      "cache": false,
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}

// ✅ GOOD: Package imports
// In apps/web/src/app/page.tsx
import { prisma } from '@akount/db'
import type { Account } from '@akount/types'

// ✅ GOOD: Shared package structure
packages/
  db/
    package.json
    index.ts         // Exports prisma client
    prisma/
      schema.prisma
  types/
    package.json
    index.ts         // Exports all types
    account.ts
    transaction.ts
```

## Review Output Format

Structure your review as:
1. **Breaking Issues** - Circular deps, broken builds
2. **Structural Issues** - Wrong imports, missing pipeline config
3. **Optimization** - Caching, unnecessary rebuilds
4. **Maintenance** - Consistency, conventions

## Tools Available
- All tools except Task, ExitPlanMode, Edit, Write, NotebookEdit
```

---

## 4. Tailwind CSS Reviewer (Optional but Recommended)

**File:** `.claude/agents/review/tailwind-css-reviewer.md`

```markdown
# Tailwind CSS Reviewer

Use this agent when reviewing UI components, styling changes, or design system implementation.

## Scope
- Tailwind utility class usage
- Design system consistency (colors, spacing, typography)
- Responsive design patterns
- Dark mode implementation
- Component styling
- CSS custom properties

## Review Checklist

### 1. Design System Compliance
- [ ] Colors use design tokens (orange, violet, slate)
- [ ] Spacing follows Tailwind scale (not arbitrary values)
- [ ] Typography uses configured fonts (Newsreader, Manrope, JetBrains Mono)
- [ ] Consistent with existing components
- [ ] No hardcoded color values (#hex or rgb())

### 2. Responsive Design
- [ ] Mobile-first approach (base styles, then sm:, md:, etc.)
- [ ] Breakpoints used consistently
- [ ] Layout works on all screen sizes
- [ ] Touch targets large enough (min 44x44px)
- [ ] Text readable on small screens

### 3. Dark Mode
- [ ] Dark mode variants included where needed
- [ ] Uses dark: prefix for dark mode styles
- [ ] Contrast ratios meet accessibility standards
- [ ] No hardcoded colors that break in dark mode

### 4. Utility Class Organization
- [ ] Classes in logical order (layout → spacing → typography → colors)
- [ ] Conditional classes use clsx or cn utility
- [ ] No excessive class strings (consider extracting)
- [ ] Consistent naming for custom classes

### 5. Performance
- [ ] No unused Tailwind classes
- [ ] Purge/content config includes all files
- [ ] No importing entire Tailwind CSS file
- [ ] Custom CSS minimal and justified

### 6. Accessibility
- [ ] Focus states visible (focus:ring, focus:outline)
- [ ] Color not sole indicator (icons, labels too)
- [ ] Proper semantic HTML with Tailwind
- [ ] Screen reader text included where needed

### 7. Component Patterns
- [ ] Consistent button styles across app
- [ ] Form inputs follow same pattern
- [ ] Card components use same structure
- [ ] Loading states styled consistently

## Common Issues to Flag

### Anti-Patterns
```tsx
// ❌ BAD: Hardcoded colors
<div className="bg-[#ff6b35]">
  {/* Should use bg-orange-500 or design token */}
</div>

// ❌ BAD: Desktop-first responsive
<div className="w-full md:w-1/2 sm:w-full">
  {/* Wrong order! Should be base → md: */}
</div>

// ❌ BAD: Inconsistent spacing
<div className="mt-3 mb-5 ml-2 mr-4">
  {/* Use consistent spacing values */}
</div>

// ❌ BAD: Missing dark mode
<div className="bg-white text-black">
  {/* Will be unreadable in dark mode! */}
</div>

// ❌ BAD: Too many utilities
<button className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
  {/* Extract to Button component! */}
</button>
```

### Good Patterns
```tsx
// ✅ GOOD: Design tokens
<div className="bg-orange-500 dark:bg-orange-600">
  {/* Uses design system colors */}
</div>

// ✅ GOOD: Mobile-first
<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Correct responsive progression */}
</div>

// ✅ GOOD: Consistent spacing
<div className="space-y-4">
  {/* Consistent vertical rhythm */}
</div>

// ✅ GOOD: Extracted component with cn utility
import { cn } from '@/lib/utils'

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2",
        "bg-orange-600 hover:bg-orange-700",
        "text-sm font-medium text-white",
        "focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
}
```

## Akount Design System

### Colors
- **Primary:** Orange (orange-500, orange-600, etc.)
- **Secondary:** Violet (violet-500, violet-600, etc.)
- **Neutral:** Slate (slate-50 through slate-900)

### Typography
- **Serif:** Newsreader (headings, numbers)
- **Sans:** Manrope (body text, UI)
- **Mono:** JetBrains Mono (code, data)

### Spacing Scale
- Use Tailwind's default scale (0.25rem increments)
- Common: space-y-4, gap-6, p-4, m-8

## Review Output Format

Structure your review as:
1. **Design System Violations** - Wrong colors, fonts, spacing
2. **Responsive Issues** - Mobile layout problems
3. **Dark Mode Issues** - Unreadable in dark mode
4. **Accessibility Issues** - Focus states, contrast
5. **Code Quality** - Extract components, organize classes

## Tools Available
- All tools except Task, ExitPlanMode, Edit, Write, NotebookEdit
```

---

## 5. React Server Components Reviewer (Enhancement)

**File:** `.claude/agents/review/react-server-components-reviewer.md`

```markdown
# React Server Components Reviewer

Use this agent when reviewing Next.js App Router components, especially Server/Client component boundaries.

## Scope
- Server Component patterns
- Client Component ('use client') usage
- Async component patterns
- Data fetching in server components
- Props serialization
- Component composition

## Review Checklist

### 1. Server vs Client Components
- [ ] Server components are async where appropriate
- [ ] 'use client' only used when necessary
- [ ] Event handlers trigger 'use client'
- [ ] Hooks (useState, useEffect) trigger 'use client'
- [ ] Server components don't import client-only code
- [ ] Client components don't use server-only code

### 2. Data Fetching
- [ ] Server components fetch data directly
- [ ] No useEffect for initial data fetching
- [ ] Parallel data fetching used where possible
- [ ] Loading states with loading.tsx or Suspense
- [ ] Error boundaries with error.tsx
- [ ] No fetch in client components (use server actions)

### 3. Props & Serialization
- [ ] Props are JSON-serializable (no functions, dates, etc.)
- [ ] Functions passed as Server Actions
- [ ] Dates converted to strings or numbers
- [ ] Complex objects simplified before passing
- [ ] No passing entire Prisma objects

### 4. Composition Patterns
- [ ] Client components wrapped by server components
- [ ] Shared layouts are server components
- [ ] Interactivity isolated to small client components
- [ ] Server components pass data to client components
- [ ] Children pattern used for composition

### 5. Performance
- [ ] Heavy computations in server components
- [ ] Bundle size minimized (less 'use client')
- [ ] Streaming with Suspense where appropriate
- [ ] Static rendering for static pages
- [ ] Dynamic rendering only where needed

### 6. Caching & Revalidation
- [ ] fetch() uses appropriate cache options
- [ ] revalidatePath/revalidateTag used correctly
- [ ] Dynamic routes opt-in to dynamic rendering
- [ ] Static pages generate at build time

## Common Issues to Flag

### Anti-Patterns
```tsx
// ❌ BAD: Unnecessary 'use client'
'use client'
export default function StaticPage() {
  return <div>This could be a server component!</div>
}

// ❌ BAD: Data fetching in client component
'use client'
export default function AccountsList() {
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    fetch('/api/accounts').then(/* ... */)
  }, [])

  return <div>{/* render accounts */}</div>
}

// ❌ BAD: Passing non-serializable props
// Server component
const account = await prisma.account.findUnique({
  where: { id }
})
return <ClientComponent account={account} /> // Prisma object!

// ❌ BAD: Not using async in server component
export default function AccountPage({ params }) {
  const account = prisma.account.findUnique() // Missing await!
  return <div>{account.name}</div>
}
```

### Good Patterns
```tsx
// ✅ GOOD: Server component with async
export default async function AccountsPage() {
  const accounts = await prisma.account.findMany()

  return (
    <div>
      {accounts.map(account => (
        <AccountCard key={account.id} account={account} />
      ))}
    </div>
  )
}

// ✅ GOOD: Client component for interactivity only
'use client'
export function AccountCard({ account }: { account: { id: string, name: string } }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div onClick={() => setExpanded(!expanded)}>
      <h3>{account.name}</h3>
      {expanded && <div>Details...</div>}
    </div>
  )
}

// ✅ GOOD: Parallel data fetching
async function getAccount(id: string) {
  return prisma.account.findUnique({ where: { id } })
}

async function getTransactions(accountId: string) {
  return prisma.transaction.findMany({ where: { accountId } })
}

export default async function AccountPage({ params }: { params: { id: string } }) {
  // Fetch in parallel
  const [account, transactions] = await Promise.all([
    getAccount(params.id),
    getTransactions(params.id)
  ])

  return <div>{/* render */}</div>
}

// ✅ GOOD: Suspense boundaries
export default function AccountsPage() {
  return (
    <div>
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsList />
      </Suspense>
    </div>
  )
}
```

## Review Output Format

Structure your review as:
1. **Component Boundary Issues** - Wrong 'use client' usage
2. **Data Fetching Issues** - Client-side fetching, no loading states
3. **Performance Issues** - Over-client-ing, missing streaming
4. **Serialization Issues** - Non-JSON props
5. **Best Practices** - Composition, caching

## Tools Available
- All tools except Task, ExitPlanMode, Edit, Write, NotebookEdit
```

---

## 6. Compound Knowledge Agent (Documentation)

**File:** `.claude/agents/workflow/compound-knowledge.md`

```markdown
# Compound Knowledge Agent

Use this agent after completing a feature or solving a problem to document learnings for future reuse.

## Purpose

Capture solved problems, patterns, and decisions so the team can:
- Reuse solutions instead of rediscovering them
- Maintain consistency across the codebase
- Onboard new developers faster
- Build institutional knowledge

## When to Use

- After implementing a new feature
- After solving a tricky bug
- After making an architectural decision
- After discovering a better pattern
- After code review reveals learnings

## Documentation Template

For each learning, create a document in `docs/learnings/` with:

### 1. Context
- What problem were we solving?
- What was the initial approach?
- Why was it problematic?

### 2. Solution
- What pattern/approach worked?
- Why does it work?
- Code examples

### 3. Guidelines
- When to use this pattern
- When NOT to use this pattern
- Edge cases to watch for

### 4. Related Patterns
- Links to similar learnings
- Relevant docs or blog posts

## Example Learning Doc

```markdown
# Multi-Tenant Data Isolation in API Routes

**Date:** 2026-01-30
**Problem:** API endpoints were not enforcing tenant isolation
**Tags:** #security #api #multi-tenant

## Context

When building GET /api/entities, we initially queried entities directly by ID:

```typescript
const entity = await prisma.entity.findUnique({
  where: { id: request.params.id }
})
```

This allowed users to access entities from other tenants by guessing IDs.

## Solution

Always filter by tenantId after resolving the user's tenant:

```typescript
// 1. Get user's tenant
const tenantUser = await prisma.tenantUser.findFirst({
  where: { userId: request.userId }
})

if (!tenantUser) {
  return reply.status(404).send({ error: 'Tenant not found' })
}

// 2. Filter by tenantId
const entity = await prisma.entity.findFirst({
  where: {
    id: request.params.id,
    tenantId: tenantUser.tenantId  // Enforce isolation!
  }
})
```

## Guidelines

**Always:**
- Resolve user's tenant first
- Filter all queries by tenantId
- Return 404 if resource not found (don't leak existence)

**Never:**
- Trust client-provided tenantId
- Skip tenant check for "admin" users
- Use findUnique without tenant filter

## Pattern

Create a reusable helper:

```typescript
// src/lib/tenant.ts
export async function getUserTenant(userId: string) {
  const tenantUser = await prisma.tenantUser.findFirst({
    where: { userId }
  })

  if (!tenantUser) {
    throw new Error('Tenant not found')
  }

  return tenantUser.tenantId
}

// In routes
const tenantId = await getUserTenant(request.userId)
const entities = await prisma.entity.findMany({
  where: { tenantId }
})
```

## Related

- [Authentication Patterns](./authentication-patterns.md)
- [Security Checklist](./security-checklist.md)
```

## Documentation Categories

Organize learnings by category:
- `/docs/learnings/architecture/` - System design decisions
- `/docs/learnings/api/` - API patterns
- `/docs/learnings/frontend/` - UI/UX patterns
- `/docs/learnings/database/` - Data modeling
- `/docs/learnings/security/` - Security patterns
- `/docs/learnings/performance/` - Optimization techniques
- `/docs/learnings/bugs/` - Bug fixes and gotchas

## Tools Available
- Read, Write, Glob, Grep - For creating and organizing docs
- Bash - For git operations to commit learnings

## Output

After running this agent, you should have:
1. New markdown file in appropriate category
2. Updated index of learnings
3. Git commit with the new documentation
4. Future Claude sessions can reference this learning
```

---

## Installation Instructions

### 1. Create Agent Files

Copy each template above to the specified file path in your `.claude/` directory:

```bash
# Create review agents directory if it doesn't exist
mkdir -p .claude/agents/review
mkdir -p .claude/agents/workflow

# Create each agent file
touch .claude/agents/review/fastify-api-reviewer.md
touch .claude/agents/review/clerk-auth-reviewer.md
touch .claude/agents/review/turborepo-monorepo-reviewer.md
touch .claude/agents/review/tailwind-css-reviewer.md
touch .claude/agents/review/react-server-components-reviewer.md
touch .claude/agents/workflow/compound-knowledge.md
```

### 2. Update .claude/agents/review/README.md

Add your new agents to the review agent index:

```markdown
## Available Review Agents

### API & Backend
- **fastify-api-reviewer**: Fastify API routes, Zod validation, error handling
- **clerk-auth-reviewer**: Authentication and authorization with Clerk
- **prisma-migration-reviewer**: Database migrations and schema changes
- **financial-data-validator**: Financial data integrity and calculations

### Frontend
- **nextjs-app-router-reviewer**: Next.js 16 App Router patterns
- **react-server-components-reviewer**: Server/Client component boundaries
- **tailwind-css-reviewer**: Design system compliance and styling

### Architecture
- **architecture-strategist**: System design and architectural decisions
- **turborepo-monorepo-reviewer**: Monorepo structure and dependencies
- **performance-oracle**: Performance analysis and optimization
- **security-sentinel**: Security audits and vulnerability assessment

### Code Quality
- **kieran-typescript-reviewer**: Strict TypeScript conventions
- **code-simplicity-reviewer**: Minimalism and YAGNI principles
- **pattern-recognition-specialist**: Code patterns and anti-patterns
```

### 3. Test Your Agents

```bash
# Test by running a review
claude-code "Review the API route in apps/api/src/routes/entities.ts using the fastify-api-reviewer"
```

### 4. Add to Workflow

Update your `.claude/commands/workflows/review.md` to include new agents:

```markdown
## Review Agents

The following specialized agents will review your changes:

1. **fastify-api-reviewer** - API routes and handlers
2. **clerk-auth-reviewer** - Auth and authorization
3. **nextjs-app-router-reviewer** - Frontend components
4. **react-server-components-reviewer** - Server/Client boundaries
5. **tailwind-css-reviewer** - Design system compliance
6. **prisma-migration-reviewer** - Database changes
7. **financial-data-validator** - Financial calculations
8. **turborepo-monorepo-reviewer** - Monorepo structure
9. **architecture-strategist** - Architectural decisions
10. **security-sentinel** - Security vulnerabilities
11. **performance-oracle** - Performance issues
12. **kieran-typescript-reviewer** - TypeScript best practices
13. **code-simplicity-reviewer** - Final simplicity pass
```

---

## Next Steps

1. Create all 6 agent files
2. Customize templates for your specific patterns
3. Test each agent individually
4. Integrate into `/workflows:review`
5. Create first compound knowledge doc
6. Iterate and improve agents based on usage

