# Review Agents

This directory contains specialized review agents for code quality, security, and data integrity.

## Available Agents

### financial-data-validator

**Purpose**: Reviews financial calculations, accounting logic, journal entries, and invoice/payment flows to ensure accuracy and compliance with accounting rules.

**When to use**:
- Any code that creates or modifies JournalEntry, Invoice, Payment, Bill
- Financial calculations (totals, taxes, payments)
- Multi-currency conversions
- Fiscal period operations
- Status transitions for financial documents
- Double-entry bookkeeping logic

**How to invoke**:
```
Use the financial-data-validator agent to review this financial logic
```

**What it checks**:
- ✓ Double-entry bookkeeping (debits = credits)
- ✓ Integer cents arithmetic (no floats)
- ✓ Multi-currency consistency and FX handling
- ✓ Audit trail completeness
- ✓ Transaction atomicity
- ✓ Valid status transitions
- ✓ Fiscal period controls
- ✓ GL account posting correctness

**Example scenarios**:
1. Creating journal entries from invoice payments
2. Multi-currency invoice calculations with FX conversion
3. Payment allocation to multiple invoices
4. Fiscal period closing logic
5. Tax calculation and rounding

**Critical rules enforced**:
- 🔴 All amounts must be Integer cents (no Float/Double)
- 🔴 Journal entries must balance (debits = credits)
- 🔴 Posted entries cannot be modified
- 🔴 Closed fiscal periods cannot accept new transactions
- 🟡 All financial operations must be wrapped in database transactions
- 🟡 Currency must be consistent within a transaction

---

### nextjs-app-router-reviewer

**Purpose**: Reviews Next.js 16+ App Router code for proper Server/Client boundaries, async patterns, authentication, and best practices.

**When to use**:
- Any code in the app/ directory (pages, layouts, route handlers)
- Server Component vs Client Component decisions
- Async data fetching patterns
- Clerk authentication integration
- Middleware configuration
- Metadata and SEO setup
- Performance optimizations (Suspense, streaming)

**How to invoke**:
```
Use the nextjs-app-router-reviewer agent to review this Next.js code
```

**What it checks**:
- ✓ Correct 'use client' usage (minimal boundaries)
- ✓ Async Server Components for data fetching
- ✓ No client-side fetch waterfalls
- ✓ Proper Clerk v6+ authentication patterns
- ✓ Route structure and organization
- ✓ Metadata configuration (static and dynamic)
- ✓ Loading states and Suspense
- ✓ TypeScript types for App Router patterns

**Example scenarios**:
1. Adding a new page with data fetching
2. Creating interactive forms with state
3. Setting up authentication middleware
4. Implementing dynamic metadata
5. Optimizing page performance with streaming

**Critical rules enforced**:
- 🔴 Use 'use client' only when necessary (hooks, events, browser APIs)
- 🔴 Fetch data server-side in Server Components (not useEffect)
- 🔴 Use `await auth()` for Clerk v6+ (not deprecated patterns)
- 🟡 Parallelize data fetches with Promise.all()
- 🟡 Use route groups for shared layouts
- 🟡 Provide loading.tsx for slow pages

---

### kieran-typescript-reviewer

**Purpose**: Reviews TypeScript code for strict type safety, modern patterns, and exceptional code quality standards.

**When to use**:
- TypeScript implementations or modifications
- Type safety concerns
- Code quality reviews
- Ensuring modern TS 5+ patterns

**How to invoke**:
```
Use the kieran-typescript-reviewer agent to review this TypeScript code
```

**What it checks**:
- ✓ No `any` types without justification
- ✓ Explicit types for function parameters and returns
- ✓ Modern TypeScript 5+ features (satisfies, template literals, etc.)
- ✓ 5-second clarity rule for naming
- ✓ Import organization
- ✓ Async/await consistency
- ✓ Discriminated unions over optional properties
- ✓ Functional patterns over imperative loops
- ✓ Testability

**Critical rules enforced**:
- 🔴 NEVER use `any` without justified comment
- 🔴 All function parameters must have explicit types
- 🟡 Prefer duplication over premature abstraction
- 🟡 Wait for 3+ uses before abstracting

---

### architecture-strategist

**Purpose**: Reviews code changes from an architectural perspective to ensure alignment with system design and best practices.

**When to use**:
- Refactoring services or major components
- Adding new features or services
- Multi-tenant data isolation concerns
- Domain boundary questions
- Server/Client architecture decisions

**How to invoke**:
```
Use the architecture-strategist agent to review these architectural changes
```

**What it checks**:
- ✓ Tenant isolation enforced
- ✓ Domain boundaries respected (Invoicing, Accounting, Banking, etc.)
- ✓ Server-first architecture maintained
- ✓ Database patterns (indexes, relations, audit fields)
- ✓ Monorepo organization (proper package dependencies)
- ✓ Integration patterns (abstraction layers)
- ✓ Performance at scale (N+1 queries, pagination)

**Critical rules enforced**:
- 🔴 All queries must filter by tenantId
- 🔴 Server Components preferred over Client Components
- 🔴 No circular dependencies between packages
- 🟡 Domain logic in appropriate layers
- 🟡 External services accessed through abstractions

---

### code-simplicity-reviewer

**Purpose**: Final review pass focused on minimalism, YAGNI, and eliminating unnecessary complexity.

**When to use**:
- After feature implementation is complete
- Before finalizing pull requests
- When code feels overly complex
- To identify over-engineering

**How to invoke**:
```
Use the code-simplicity-reviewer to check for unnecessary complexity
```

**What it checks**:
- ✓ Premature abstractions (factories, builders with 1 use)
- ✓ Unnecessary configuration (things that never change)
- ✓ Over-engineered error handling
- ✓ Defensive code for impossible scenarios
- ✓ Overly generic functions
- ✓ YAGNI violations (built for future needs that don't exist)

**Critical philosophy**:
- 🔴 Every line of code is a liability
- 🔴 Duplication is cheaper than wrong abstraction
- 🟡 Wait for 3+ uses before abstracting
- 🟡 Delete "just in case" code

---

### performance-oracle

**Purpose**: Identifies and resolves performance bottlenecks for scalability and speed.

**When to use**:
- After implementing features
- Performance concerns arise
- Database query optimization
- React rendering performance
- Large dataset handling

**How to invoke**:
```
Use the performance-oracle agent to identify performance issues
```

**What it checks**:
- ✓ Algorithmic complexity (no worse than O(n log n))
- ✓ N+1 database queries
- ✓ Missing indexes
- ✓ Pagination for large datasets
- ✓ React unnecessary re-renders
- ✓ Bundle size increases
- ✓ Caching opportunities
- ✓ Memory leaks
- ✓ Parallel vs sequential operations

**Performance targets**:
- API routes: <200ms
- Page loads: <1s TTFB
- Database queries: <50ms simple, <200ms complex
- Bundle impact: <5KB per feature

---

### security-sentinel

**Purpose**: Performs security audits with an adversarial mindset to identify vulnerabilities before attackers do.

**When to use**:
- New API endpoints
- Authentication/authorization changes
- User input handling
- Sensitive data operations
- Security reviews

**How to invoke**:
```
Use the security-sentinel agent to perform a security audit
```

**What it checks**:
- ✓ Tenant isolation (IDOR vulnerabilities)
- ✓ RBAC permissions
- ✓ Input validation (SQL injection, XSS, command injection)
- ✓ Authentication enforcement
- ✓ Sensitive data exposure (logs, responses, hardcoded secrets)
- ✓ Security headers (CORS, CSP, X-Frame-Options)
- ✓ SSRF protection
- ✓ Audit logging

**OWASP Top 10 Coverage**:
- 🔴 Broken Access Control
- 🔴 Injection Attacks
- 🔴 Sensitive Data Exposure
- 🔴 XSS
- 🟡 Security Misconfiguration
- 🟡 Vulnerable Dependencies

---

### prisma-migration-reviewer

**Purpose**: Reviews Prisma schema changes and database migrations for safety, data integrity, and financial data protection.

**When to use**:
- Any PR that modifies `schema.prisma`
- Database migrations in `prisma/migrations/`
- Schema changes that affect financial tables
- Enum modifications
- Foreign key or relation changes

**How to invoke**:
```
Use the prisma-migration-reviewer agent to review this schema change
```

**What it checks**:
- ✓ Required field additions have defaults
- ✓ Enum changes are safe (append-only)
- ✓ No CASCADE deletes on financial tables
- ✓ Monetary fields use Decimal (not Float)
- ✓ Migration SQL is safe and reversible
- ✓ No data loss risk
- ✓ Multi-currency constraints maintained
- ✓ Audit trails preserved

**Example scenarios**:
1. Adding a new required field to Invoice table
2. Modifying InvoiceStatus enum
3. Adding CASCADE delete to payment relations
4. Changing data types (Float → Decimal)
5. Renaming columns in financial tables

**Critical rules enforced**:
- 🔴 NEVER allow CASCADE deletes on Invoice, Payment, JournalEntry, Bill
- 🔴 NEVER allow Float/Double for monetary amounts
- 🔴 NEVER allow deletion of historical transaction data
- 🟡 Required fields must have defaults or backfill strategy
- 🟡 Enum changes must be append-only

---

### pattern-recognition-specialist

**Purpose**: Analyzes code for design patterns, anti-patterns, naming conventions, and code duplication.

**When to use**:
- Identifying design patterns in the codebase
- Finding anti-patterns and code smells
- Checking naming convention consistency
- Detecting code duplication
- Understanding architectural patterns
- Finding refactoring opportunities

**How to invoke**:
```
Use the pattern-recognition-specialist agent to analyze API routes for patterns
```

**What it checks**:
- ✓ Design patterns (Singleton, Factory, Observer, Strategy, etc.)
- ✓ Anti-patterns (God objects, code smells, TODOs, tight coupling)
- ✓ Naming conventions (camelCase, PascalCase, UPPER_SNAKE_CASE)
- ✓ Code duplication (repeated logic, copy-paste)
- ✓ Architectural boundaries
- ✓ File length and complexity

**Example scenarios**:
1. Finding repeated authentication logic across routes
2. Identifying inconsistent naming patterns
3. Detecting God objects that should be split
4. Finding opportunities for shared utilities

**Critical rules enforced**:
- 🔴 No God objects (classes/files doing too much)
- 🔴 Consistent naming across codebase
- 🟡 Extract utilities when code is duplicated 3+ times
- 🟡 Respect architectural boundaries

---

### data-migration-expert

**Purpose**: Validates database migrations to prevent data corruption, swapped values, and ensure rollback safety.

**When to use**:
- Database schema migrations
- Data backfills or transformations
- Production data updates
- Column renames or type changes
- ID remapping operations

**How to invoke**:
```
Use the data-migration-expert agent to review this migration
```

**What it checks**:
- ✓ Production data verification (actual values, not fixtures)
- ✓ Migration code safety (batching, reversibility, error handling)
- ✓ Mapping logic completeness (handles all values)
- ✓ Observability setup (monitoring queries)
- ✓ Rollback strategy
- ✓ Code references and dependencies

**Example scenarios**:
1. Migrating invoice status enum values
2. Remapping account IDs during consolidation
3. Backfilling missing transaction categories
4. Converting date formats or timezones

**Critical rules enforced**:
- 🔴 NEVER trust assumptions - verify with production SQL
- 🔴 ALL possible values must be mapped (use CASE with ELSE)
- 🔴 Migrations must be batched for large datasets
- 🟡 Feature flags for rollback capability
- 🟡 Dual-write during column renames

---

### deployment-verification-agent

**Purpose**: Generates executable Go/No-Go checklists for risky data deployments.

**When to use**:
- Database migration involves data transformation
- Changes affect critical data processing
- Backfill or data migration ready to run
- Risk of data loss or corruption
- Financial or sensitive data changes

**How to invoke**:
```
Use the deployment-verification-agent to create a checklist for this migration
```

**What it produces**:
- 🔴 Pre-Deploy Audits (baseline queries)
- 🟡 Deploy Steps (commands to execute)
- 🟢 Post-Deploy Verification (integrity checks)
- 🔵 24-Hour Monitoring (metrics to watch)
- 🔄 Rollback Plan (recovery procedure)

**Example scenarios**:
1. Adding new required column to invoices
2. Deleting old inactive accounts
3. Migrating payment processing logic
4. Updating transaction status workflow

**Critical rules enforced**:
- 🔴 Pre-deploy baseline MUST be documented
- 🔴 All verification queries MUST have expected results
- 🔴 Rollback procedure MUST be documented
- 🟡 Database snapshot created before migration
- 🟡 Time-bounded decision window (when to rollback)

---

---

### fastify-api-reviewer

**Purpose**: Reviews Fastify API code for proper route structure, Zod validation, authentication, and database patterns.

**When to use**:
- Any code in apps/api/src/routes/
- Fastify middleware changes
- API endpoint implementations
- Backend error handling
- Database query optimization in APIs

**How to invoke**:
```
Use the fastify-api-reviewer agent to review this API route
```

**What it checks**:
- ✓ Zod schema validation on all routes
- ✓ Authentication middleware usage
- ✓ Tenant isolation in queries
- ✓ Error handling and status codes
- ✓ N+1 query prevention
- ✓ Type safety with ZodTypeProvider
- ✓ Financial data handling

**Critical rules enforced**:
- 🔴 All routes must have Zod validation
- 🔴 Protected routes must use authMiddleware
- 🔴 All queries must filter by tenantId
- 🟡 Use transactions for multi-step operations
- 🟡 Pagination for list endpoints

---

### clerk-auth-reviewer

**Purpose**: Reviews authentication and authorization code involving Clerk for security and correctness.

**When to use**:
- Authentication middleware changes
- Protected routes and layouts
- JWT verification in API
- Clerk SDK usage
- User session handling
- Multi-tenant auth flows

**How to invoke**:
```
Use the clerk-auth-reviewer agent to review this authentication code
```

**What it checks**:
- ✓ Server-side auth checks (not client-only)
- ✓ Modern Clerk v6 patterns (@clerk/backend)
- ✓ JWT token verification
- ✓ Tenant mapping and isolation
- ✓ Session management
- ✓ Security best practices

**Critical rules enforced**:
- 🔴 NEVER trust client-sent userId
- 🔴 Always verify tokens server-side
- 🔴 Use auth() in Next.js layouts/pages
- 🟡 Handle token expiry gracefully
- 🟡 No tokens in logs or query strings

---

### turborepo-monorepo-reviewer

**Purpose**: Reviews monorepo structure, package dependencies, and workspace configuration for Turborepo.

**When to use**:
- package.json changes
- turbo.json pipeline updates
- New workspace packages
- Import structure changes
- Build configuration
- Dependency management

**How to invoke**:
```
Use the turborepo-monorepo-reviewer agent to review this workspace change
```

**What it checks**:
- ✓ Workspace protocol usage (workspace:*)
- ✓ No circular dependencies
- ✓ Proper package imports (@akount/*)
- ✓ Turbo pipeline configuration
- ✓ Build order and caching
- ✓ Type safety across packages

**Critical rules enforced**:
- 🔴 Must use workspace:* protocol
- 🔴 No relative imports across workspaces
- 🔴 No circular dependencies
- 🟡 All scripts in turbo.json pipeline
- 🟡 Consistent dependency versions

---

### design-system-enforcer

**Purpose**: Validates UI code against Akount Design System specifications for colors, typography, components, and layout patterns.

**When to use**:
- UI component implementations
- Styling and color changes
- Typography usage
- Financial data display components
- Navigation patterns
- Layout structure

**How to invoke**:
```
Use the design-system-enforcer agent to validate UI compliance
```

**What it checks**:
- ✓ Semantic color tokens (text-finance-income, not text-green-500)
- ✓ Typography fonts (font-heading, font-body, font-mono)
- ✓ MoneyAmount component for financial display
- ✓ Design token CSS variables
- ✓ Layout patterns (8-domain structure)
- ✓ Component imports from @akount/ui

**Critical rules enforced**:
- 🔴 No hardcoded colors (use semantic tokens)
- 🔴 Financial amounts MUST use MoneyAmount component
- 🔴 Headings use font-heading, body uses font-body
- 🟡 Money/numbers use font-mono
- 🟡 Follow design-system spacing patterns

---

### rbac-validator

**Purpose**: Validates RBAC implementation against the design-system permissions matrix for the 6 canonical roles.

**When to use**:
- Route protection logic
- Authorization middleware
- Sidebar/navigation filtering
- Permission checks in UI
- API access control
- Role-based feature visibility

**How to invoke**:
```
Use the rbac-validator agent to verify RBAC compliance
```

**What it checks**:
- ✓ 6 canonical roles (OWNER, ADMIN, ACCOUNTANT, BOOKKEEPER, INVESTOR, ADVISOR)
- ✓ Permission levels (HIDDEN, VIEW, ACT, APPROVE, ADMIN)
- ✓ Per-domain permission matrix compliance
- ✓ Route protection with withPermission()
- ✓ UI element hiding for HIDDEN permissions
- ✓ Audit logging for RBAC denials

**Critical rules enforced**:
- 🔴 BOOKKEEPER cannot access accounting domain
- 🔴 INVESTOR cannot access banking domain
- 🔴 HIDDEN = completely invisible (not just disabled)
- 🔴 403 returned for unauthorized (not 404)
- 🟡 All protected routes have permission checks
- 🟡 RBAC denials are logged

---

## Agent Categories

### Financial & Data Integrity
- financial-data-validator (accounting rules)
- prisma-migration-reviewer (schema safety)
- data-migration-expert (migration validation)
- deployment-verification-agent (deployment checklists)

### Architecture & Code Quality
- architecture-strategist (system design)
- kieran-typescript-reviewer (type safety)
- code-simplicity-reviewer (minimalism)
- pattern-recognition-specialist (patterns & anti-patterns)
- turborepo-monorepo-reviewer (monorepo structure)

### Design System & UI
- design-system-enforcer (UI compliance) **NEW - Restructure Phase 7**

### Performance & Security
- performance-oracle (optimization)
- security-sentinel (vulnerability assessment)

### Framework-Specific
- nextjs-app-router-reviewer (Next.js patterns)
- fastify-api-reviewer (Fastify API patterns)

### Authentication & Authorization
- clerk-auth-reviewer (Clerk authentication)
- rbac-validator (RBAC permissions matrix) **NEW - Restructure Phase 7**

---

## Recommended Review Order

For comprehensive code review, use agents in this order:

### For API Changes (Backend)
1. **Security First**: security-sentinel
2. **Authentication**: clerk-auth-reviewer (if auth changes)
3. **API Patterns**: fastify-api-reviewer
4. **Data Safety**: prisma-migration-reviewer (if schema changes)
5. **Financial Logic**: financial-data-validator (if financial code)
6. **Architecture**: architecture-strategist
7. **Type Safety**: kieran-typescript-reviewer
8. **Performance**: performance-oracle
9. **Code Quality**: pattern-recognition-specialist
10. **Final Simplicity Pass**: code-simplicity-reviewer

### For Frontend Changes
1. **Security First**: security-sentinel
2. **Authentication**: clerk-auth-reviewer (if auth changes)
3. **Next.js Patterns**: nextjs-app-router-reviewer
4. **Type Safety**: kieran-typescript-reviewer
5. **Performance**: performance-oracle
6. **Code Quality**: pattern-recognition-specialist
7. **Final Simplicity Pass**: code-simplicity-reviewer

### For Structural Changes
1. **Monorepo Structure**: turborepo-monorepo-reviewer
2. **Architecture**: architecture-strategist
3. **Code Quality**: pattern-recognition-specialist

### For Database Changes
1. **Schema Safety**: prisma-migration-reviewer
2. **Migration Validation**: data-migration-expert
3. **Deployment Checklist**: deployment-verification-agent
4. **Financial Data**: financial-data-validator (if financial tables)

---

## How to Add New Review Agents

1. Create a new `.md` file in this directory
2. Include YAML frontmatter:
   ```yaml
   ---
   name: agent-name
   description: "Agent purpose with examples..."
   model: inherit
   ---
   ```
3. Write the agent's system prompt with checklists and guidelines
4. Update this README with usage instructions

---

## Installation History

**Original Agents** (Custom for Akount):
- financial-data-validator
- nextjs-app-router-reviewer
- prisma-migration-reviewer
- kieran-typescript-reviewer
- architecture-strategist
- code-simplicity-reviewer
- performance-oracle
- security-sentinel

**Week 1 Compound Engineering Agents** (2026-01-30):
- pattern-recognition-specialist
- data-migration-expert
- deployment-verification-agent

**Week 2 Custom Agents** (2026-01-30):
- fastify-api-reviewer (Akount-specific API patterns)
- clerk-auth-reviewer (Clerk authentication security)
- turborepo-monorepo-reviewer (Monorepo structure validation)

**Restructure Phase 7 Agents** (2026-02-05):
- design-system-enforcer (UI design system compliance)
- rbac-validator (RBAC permissions matrix validation)
