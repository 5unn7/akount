# Solutions & Learnings

**Purpose:** Document solved problems to compound team knowledge over time.

**Philosophy:** "Each unit of engineering work should make subsequent units easier—not harder."

---

## Quick Start

```bash
# After solving a problem
/workflows:compound "Fixed N+1 query in invoice list"

# Search for solutions
grep -r "N+1 query" docs/solutions/
grep -r "Prisma" docs/solutions/database/

# Browse by category
ls docs/solutions/performance/
ls docs/solutions/security/
```

---

## Directory Structure

```
docs/solutions/
├── architecture/       # System design, patterns, structure decisions
├── api/               # REST endpoints, GraphQL, API design
├── frontend/          # React, Next.js, UI components, styling
├── database/          # Prisma, migrations, queries, indexes
├── security/          # Auth, vulnerabilities, permissions, isolation
├── performance/       # Optimization, caching, query tuning
├── bugs/              # Bug fixes, edge cases, gotchas
├── deployment/        # CI/CD, environments, releases
└── infrastructure/    # Railway, services, monitoring, logging
```

---

## Document Format

Each solution follows this structure:

```markdown
---
title: "Problem Title"
category: "database"
tags: [prisma, migration, enum]
date: 2026-01-30
resolved: true
severity: medium
module: "packages/db"
related:
  - docs/solutions/database/other-issue.md
---

# Problem Title

## Problem

### Symptoms
What we observed

### Impact
Who/what was affected

## Root Cause

Why it happened

## Solution

### Fix Applied
```typescript
// Working code
```

### Why It Works

Explanation

## Prevention

### How to Detect Early

Warning signs

### How to Prevent

Patterns to follow

## Related

- Links to similar issues
- Documentation references

```

---

## Categories Explained

### architecture/
System-level design decisions:
- Multi-tenant architecture patterns
- Service boundaries
- Data flow design
- Component organization
- Monorepo structure

**Example:** "Extracted shared authentication logic into packages/auth"

---

### api/
Backend API implementation:
- Route design
- Validation patterns
- Error handling
- Response formats
- Authentication flows
- Rate limiting

**Example:** "Added Zod validation to all Fastify routes"

---

### frontend/
UI and client-side code:
- React component patterns
- Next.js App Router issues
- State management
- Server/Client component boundaries
- Styling and design system
- User interactions

**Example:** "Fixed hydration mismatch in dashboard layout"

---

### database/
Data storage and queries:
- Prisma schema changes
- Migration safety
- Query optimization
- Index strategy
- Data integrity
- Connection pooling

**Example:** "Resolved Prisma enum migration causing downtime"

---

### security/
Security vulnerabilities and fixes:
- Authentication bypasses
- Authorization failures
- Input validation
- XSS/CSRF/SQL injection
- Tenant isolation
- Data exposure

**Example:** "Fixed tenant isolation breach in invoice API"

---

### performance/
Speed and efficiency improvements:
- Query optimization (N+1 fixes)
- Caching strategies
- Bundle size reduction
- Database indexes
- API response times
- Memory leaks

**Example:** "Optimized dashboard load from 2.5s to 180ms"

---

### bugs/
Bug fixes and edge cases:
- Unexpected behavior
- Edge case handling
- Race conditions
- Null pointer errors
- Calculation errors
- Display issues

**Example:** "Fixed invoice rounding error in multi-currency"

---

### deployment/
Release and environment issues:
- CI/CD pipeline problems
- Environment configuration
- Build failures
- Migration execution
- Feature flags
- Rollback procedures

**Example:** "Railway deployment failed due to missing env var"

---

### infrastructure/
Platform and tooling:
- Service configuration
- Monitoring setup
- Logging patterns
- Third-party integrations
- Database hosting
- CDN configuration

**Example:** "Configured Prisma connection pooling for Railway"

---

## YAML Frontmatter Fields

### Required Fields

**title:** Clear, descriptive problem title
```yaml
title: "N+1 Query Causing Slow Invoice List Load"
```

**category:** One of the 9 categories

```yaml
category: "performance"
```

**tags:** Keywords for searchability

```yaml
tags:
  - prisma
  - n+1
  - performance
  - optimization
```

**date:** When problem was solved (YYYY-MM-DD)

```yaml
date: 2026-01-30
```

**resolved:** Boolean (true if fixed)

```yaml
resolved: true
```

### Optional Fields

**severity:** Impact level

```yaml
severity: low | medium | high | critical
```

**module:** Affected package/app

```yaml
module: "apps/api"
```

**related:** Links to related solutions

```yaml
related:
  - docs/solutions/performance/caching-strategy.md
  - docs/solutions/database/query-optimization.md
```

**github_issue:** Related GitHub issue

```yaml
github_issue: 123
```

**author:** Who solved it

```yaml
author: "@alice"
```

---

## Searching Solutions

### By Keyword

```bash
grep -r "N+1 query" docs/solutions/
grep -r "Clerk authentication" docs/solutions/
grep -r "migration" docs/solutions/
```

### By Category

```bash
ls docs/solutions/database/
ls docs/solutions/performance/
find docs/solutions/security -name "*.md"
```

### By Tag

```bash
grep -l "tags:.*prisma" docs/solutions/**/*.md
grep -l "tags:.*auth" docs/solutions/**/*.md
```

### By Severity

```bash
grep -l "severity: critical" docs/solutions/**/*.md
grep -l "severity: high" docs/solutions/**/*.md
```

### By Date Range

```bash
find docs/solutions -name "2026-01-*.md"
find docs/solutions -name "2026-*.md"
```

---

## Example Solution

**File:** `docs/solutions/performance/2026-01-30-n-plus-one-invoice-query.md`

```markdown
---
title: "N+1 Query Causing Slow Invoice List Load"
category: "performance"
tags:
  - prisma
  - n+1
  - performance
  - optimization
  - invoice
date: 2026-01-30
resolved: true
severity: medium
module: "apps/api"
related:
  - docs/solutions/database/2026-01-15-query-optimization.md
github_issue: 234
author: "@alice"
---

# N+1 Query Causing Slow Invoice List Load

## Problem

### Symptoms
- Dashboard invoice list takes 2.5 seconds to load
- With 100 invoices, makes 101 database queries
- Prisma query logs show sequential queries
- Users report slow page loads

### Impact
- All users loading invoice list affected
- Poor user experience on main dashboard
- Increased database load
- Higher Railway costs

## Root Cause

Loading invoices then separately loading client for each invoice:

```typescript
// ❌ BAD: N+1 queries
const invoices = await prisma.invoice.findMany({
  where: { tenantId }
})

for (const invoice of invoices) {
  invoice.client = await prisma.client.findUnique({
    where: { id: invoice.clientId }
  })
}
```

**Why:** Sequential queries in loop

- Query 1: Load all invoices (1 query)
- Queries 2-101: Load client for each invoice (100 queries)
- **Total: 101 queries**

## Solution

### Fix Applied

Use Prisma `include` to eager load relationships:

```typescript
// ✅ GOOD: Single query with include
const invoices = await prisma.invoice.findMany({
  where: { tenantId },
  include: {
    client: {
      select: {
        id: true,
        name: true,
        email: true
      }
    },
    lines: {
      select: {
        description: true,
        amount: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
})
```

**Result:**

- Queries: 101 → 1
- Load time: 2.5s → 180ms
- **14x faster** ⚡

### Why It Works

Prisma's `include` creates a SQL JOIN that loads related data in a single query:

```sql
SELECT invoice.*, client.*, line.*
FROM invoice
LEFT JOIN client ON invoice.clientId = client.id
LEFT JOIN line ON invoice.id = line.invoiceId
WHERE invoice.tenantId = $1
ORDER BY invoice.createdAt DESC
```

## Prevention

### How to Detect Early

**1. Enable Prisma Query Logging (Development):**

```typescript
// packages/db/index.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
})
```

**2. Add Test for Query Count:**

```typescript
test('loads invoices in single query', async () => {
  const queries = []

  prisma.$on('query', (e) => {
    queries.push(e)
  })

  await loadInvoices(tenantId)

  expect(queries).toHaveLength(1) // Not 101!
})
```

**3. Watch for Loops with Prisma Calls:**

```bash
# Grep for this anti-pattern
grep -r "for.*await.*prisma" apps/
```

### How to Prevent

**1. Always Use `include` for Relations:**

```typescript
// When you need related data, use include
findMany({ include: { relation: true } })
```

**2. Use `select` to Limit Fields:**

```typescript
// Only fetch needed fields
include: {
  client: {
    select: { id: true, name: true }
  }
}
```

**3. Review Agent Checks:**

- `performance-oracle` catches N+1 queries
- Run `/workflows:review` before merging

**4. Code Review Checklist:**

- [ ] No queries in loops
- [ ] Related data uses `include`
- [ ] Only needed fields selected
- [ ] Query count tested

## Related

- [Query Optimization Guide](../database/2026-01-15-query-optimization.md)
- [Prisma Include Best Practices](../database/2026-01-20-prisma-include.md)
- [Performance Testing Setup](../performance/2026-01-18-performance-tests.md)

## Timeline

- **Discovered:** 2026-01-30 10:00 AM (User complaint)
- **Root Cause Found:** 2026-01-30 11:30 AM (Prisma logs)
- **Fixed:** 2026-01-30 2:00 PM (Added include)
- **Tested:** 2026-01-30 2:15 PM (Verified 1 query)
- **Deployed:** 2026-01-30 3:00 PM (Production)
- **Documented:** 2026-01-30 3:30 PM (This doc)

## Metrics

**Before:**

- Load time: 2.5 seconds
- Queries: 101
- Database CPU: 45%

**After:**

- Load time: 180ms
- Queries: 1
- Database CPU: 12%

**Improvement:** 14x faster, 99% fewer queries

```

---

## Metrics & ROI

### Time Savings

**First Occurrence:**
- Investigation: 30 minutes
- Fix: 15 minutes
- Testing: 10 minutes
- Documentation: 5 minutes
- **Total: 60 minutes**

**With Documentation (Future Occurrences):**
- Lookup solution: 2 minutes
- Apply fix: 5 minutes
- Test: 3 minutes
- **Total: 10 minutes**

**Savings per Reuse:** 50 minutes (83% faster)

### Team Benefits

**After 10 Documented Solutions:**
- Future similar issues: 500 minutes saved
- Onboarding new devs: 4 hours faster
- Code review efficiency: 30% improvement
- Production incidents: 60% reduction

---

## Contributing

### After Solving a Problem

```bash
# Document it immediately
/workflows:compound "Problem description"

# Or manually create file
touch docs/solutions/[category]/$(date +%Y-%m-%d)-problem-name.md

# Fill in template
# Add YAML frontmatter
# Commit with descriptive message
```

### Updating Existing Solutions

```bash
# If new information discovered
# Update the solution file
# Add to "Related" section
# Note the update in commit message
```

### Deprecating Solutions

If solution no longer applies:

```yaml
---
title: "Old Problem (DEPRECATED)"
resolved: true
deprecated: true
deprecated_date: 2026-02-15
deprecated_reason: "Fixed in Prisma 6.0"
superseded_by: docs/solutions/database/new-approach.md
---
```

---

## Best Practices

### When to Document

✅ **Do document:**

- Non-obvious solutions
- Problems that took >30 min to solve
- Issues likely to recur
- Architectural decisions
- Performance optimizations
- Security fixes
- Production incidents

❌ **Don't document:**

- Trivial typos
- Documentation updates (unless pattern discovered)
- Obvious bugs (unless interesting edge case)
- Work in progress

### Writing Quality

**Good Documentation:**

- ✅ Specific and actionable
- ✅ Includes code examples
- ✅ Explains "why" not just "what"
- ✅ Notes prevention strategies
- ✅ Links to related issues
- ✅ Easy to search/find

**Bad Documentation:**

- ❌ Vague ("fixed performance issue")
- ❌ No code examples
- ❌ Missing context
- ❌ No prevention guidance
- ❌ Hard to categorize

---

## Tools & Automation

### Automatic Documentation

```bash
# Set up git hook to prompt for documentation
# After each commit to main
.git/hooks/post-commit
```

### Search Helper

```bash
# Add alias to .bashrc or .zshrc
alias solutions="grep -r \"\$1\" docs/solutions/"

# Usage
solutions "N+1 query"
solutions "authentication"
```

### Weekly Review

```bash
# Review recently added solutions
find docs/solutions -name "*.md" -mtime -7
```

---

## Maintenance

### Monthly Review

- Check for outdated solutions
- Update deprecated patterns
- Consolidate similar solutions
- Add cross-references

### Quarterly Metrics

- Count solutions by category
- Track time savings
- Identify common patterns
- Celebrate team learning

---

**Start documenting your solutions:**

```bash
/workflows:compound
```

🚀 **Compound your team's knowledge!**
