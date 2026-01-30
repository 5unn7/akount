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
