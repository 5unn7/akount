---
name: deepen-plan
description: Enhance plans with parallel research agents and best practices
argument-hint: "[plan file path]"
aliases:
  - enhance-plan
  - research-plan
  - improve-plan
keywords:
  - plan
  - research
  - enhance
  - best-practices
  - architecture
---

# Deepen Plan

Enhance existing implementation plans with comprehensive research, best practices, and production-ready details.

**Current Year:** 2026

---

## Purpose

Transform basic plans into production-ready blueprints by:
- 🔍 Researching best practices
- 📚 Applying team learnings
- 🛡️ Running comprehensive reviews
- ⚡ Adding performance insights
- 🔒 Identifying security concerns
- 📖 Providing code examples

**Before:** Basic plan outline
**After:** Comprehensive implementation guide with research backing

---

## Usage

```bash
# Deepen current plan file
/deepen-plan plan.md

# Deepen specific plan
/deepen-plan docs/plans/feature-x.md

# Deepen with specific focus
/deepen-plan plan.md --focus=security,performance

# Create separate deepened file
/deepen-plan plan.md --output=plan-deepened.md
```

---

## Workflow

### Phase 1: Plan Parsing

Read and extract structure:

**Identify:**
- Problem statements
- Proposed solutions
- Technical architecture
- Implementation phases
- Code examples
- Technologies used
- Domain areas

**Extract Sections:**
- Overview/summary
- Requirements
- Architecture
- Implementation steps
- Testing strategy
- Deployment plan

---

### Phase 2: Dynamic Skill Discovery

Search and match relevant skills:

**Sources:**
1. Project local: `.claude/skills/`
2. User global: `~/.claude/skills/`
3. Plugin skills: All compound-engineering skills

**Process:**
```bash
# Find all skills
find .claude/skills -name "SKILL.md"
find ~/.claude/skills -name "SKILL.md"

# Read each skill's documentation
# Match skills to plan sections
# Spawn parallel sub-agents for matches
```

**Example Matches:**
- Plan mentions "API" → Use fastify-related skills
- Plan mentions "auth" → Use clerk-auth skills
- Plan mentions "database" → Use prisma skills

---

### Phase 3: Apply Team Learnings

Leverage institutional knowledge:

**Search:**
```bash
# Find relevant learnings
find docs/solutions -name "*.md"

# Read YAML frontmatter
grep -A 10 "^---$" docs/solutions/**/*.md
```

**Filter by:**
- Category (API, database, security, etc.)
- Tags (matching plan technologies)
- Module (matching plan scope)
- Severity (prioritize critical learnings)

**Example:**
```yaml
# Plan mentions Prisma migrations
# → Load docs/solutions/database/prisma-enum-migration.md
# → Apply lessons learned
# → Prevent past mistakes
```

---

### Phase 4: Per-Section Research

For each major section, run parallel research:

#### Framework Documentation
```typescript
// Use Context7 MCP for official docs
mcp__context7__query-docs({
  libraryId: "/vercel/next.js",
  query: "App Router data fetching patterns"
})
```

#### Best Practices
```typescript
// Use research agents
Task(best-practices-researcher, "Find Next.js 16 patterns")
Task(framework-docs-researcher, "Research Fastify plugins")
```

#### Current Best Practices (2026)
```typescript
// WebSearch for latest
WebSearch("Next.js 16 server actions best practices 2026")
WebSearch("Fastify Zod validation patterns 2026")
```

**Focus Areas:**
- Performance optimization
- Security considerations
- Edge cases handling
- Error scenarios
- Testing strategies

---

### Phase 5: Comprehensive Agent Review

Run **ALL** available review agents in parallel:

**Discover Agents:**
```bash
# Find all agent files
find .claude/agents -name "*.md"

# Include all sources
- Project agents: .claude/agents/
- Global agents: ~/.claude/agents/
- Plugin agents: compound-engineering/agents/
```

**Launch ALL Agents:**
```typescript
// Run 20-40+ agents simultaneously
[
  Task(security-sentinel, "Review security concerns"),
  Task(performance-oracle, "Analyze performance"),
  Task(architecture-strategist, "Validate architecture"),
  Task(kieran-typescript-reviewer, "Check TypeScript"),
  Task(fastify-api-reviewer, "Review API patterns"),
  Task(clerk-auth-reviewer, "Validate auth"),
  Task(prisma-migration-reviewer, "Check database"),
  Task(financial-data-validator, "Review financial logic"),
  Task(nextjs-app-router-reviewer, "Check Next.js"),
  Task(turborepo-monorepo-reviewer, "Validate structure"),
  Task(pattern-recognition-specialist, "Find patterns"),
  Task(data-migration-expert, "Review migrations"),
  Task(deployment-verification-agent, "Check deployment"),
  Task(code-simplicity-reviewer, "Simplify plan"),
  // ... 20+ more agents
]
```

**Skip Only:**
- Workflow orchestrators (plan, work, review)
- Commands (changelog, compound, etc.)

---

### Phase 6: Synthesis & Deduplication

Collect findings from all sources:

**Inputs:**
- Skill outputs
- Learning recommendations
- Research discoveries
- Agent feedback
- Framework docs
- Best practices

**Process:**
- Remove duplicates
- Prioritize by importance
- Group by section
- Add context and examples

---

### Phase 7: Plan Enhancement

Insert "Research Insights" sections:

**Format:**
```markdown
## [Original Section Title]

[Original content preserved]

### 📚 Research Insights

#### Best Practices
- **Pattern:** Use server actions for mutations
  - **Source:** Next.js 16 docs, best-practices-researcher
  - **Why:** Reduces client bundle, improves security
  - **Example:**
    ```typescript
    // Server action in app/actions/create-invoice.ts
    'use server'
    export async function createInvoice(data: InvoiceData) {
      // Validation and creation
    }
    ```

#### Performance Considerations
- **Concern:** N+1 queries in invoice list
  - **Source:** performance-oracle, team learnings
  - **Impact:** 2.5s load time with 100 invoices
  - **Solution:**
    ```typescript
    // Use include to eager load
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        lines: true
      }
    })
    ```
  - **Metrics:** Reduces from 101 queries to 1, load time 180ms

#### Security Notes
- **Risk:** Tenant isolation breach
  - **Source:** security-sentinel, learnings database
  - **Prevention:**
    ```typescript
    // Always filter by tenantId
    const data = await prisma.model.findMany({
      where: { tenantId }
    })
    ```

#### Edge Cases
- **Case:** Invoice with 0 lines
  - **Source:** bug-reproduction-validator
  - **Handling:** Validate minimum 1 line before save
  - **Test:**
    ```typescript
    test('rejects invoice with no lines', async () => {
      await expect(
        createInvoice({ lines: [] })
      ).rejects.toThrow('At least one line required')
    })
    ```

#### Related Learnings
- [Prisma enum migration](docs/solutions/database/2026-01-15-prisma-enum.md)
- [N+1 query fix](docs/solutions/performance/2026-01-20-n-plus-one.md)
```

---

### Phase 8: Enhancement Summary

Add summary at top of plan:

```markdown
# Enhanced Plan Summary

**Original Plan:** [Original file name]
**Enhanced Date:** 2026-01-30
**Sections Enhanced:** 8
**Research Agents Used:** 25
**Learnings Applied:** 12
**Best Practices Added:** 34

## Key Enhancements

### Performance
- Added query optimization patterns (14x faster load times)
- Identified caching opportunities
- Suggested pagination strategies

### Security
- Highlighted tenant isolation requirements
- Added authentication best practices
- Flagged input validation needs

### Architecture
- Validated design decisions
- Suggested pattern improvements
- Identified potential issues

### Implementation
- Added 20+ code examples
- Included error handling patterns
- Provided test strategies

### Deployment
- Added migration safety checks
- Included rollback procedures
- Suggested monitoring

---

## Enhancement Breakdown

| Category | Insights Added | Sources |
|----------|----------------|---------|
| Performance | 8 | 3 agents, 2 learnings |
| Security | 6 | 2 agents, 1 learning |
| Architecture | 5 | 2 agents |
| Implementation | 12 | 5 agents, 3 learnings |
| Testing | 7 | 2 agents, 1 skill |

---

[Original plan content with research insights embedded]
```

---

### Phase 9: File Update

**Options:**

1. **In-place update:**
   - Overwrites original file
   - Preserves all content
   - Adds research sections

2. **Separate file:**
   - Creates `plan-deepened.md`
   - Keeps original untouched
   - Side-by-side comparison

**Commit Message:**
```bash
git add plan.md
git commit -m "docs: Deepen implementation plan with research

Added research insights from 25 agents
Applied 12 team learnings
Included 34 best practices

Enhanced sections:
- Architecture design
- Performance optimization
- Security considerations
- Implementation details
- Testing strategy
"
```

---

## Post-Enhancement Options

After deepening, offer choices:

```markdown
✅ Plan Enhanced!

Your plan is now production-ready with:
- 25 agent reviews
- 12 team learnings applied
- 34 best practices added
- 20+ code examples

What would you like to do next?

1. 📊 View diff of changes
2. 🔍 Run /plan_review for feedback
3. 🚀 Begin /workflows:work implementation
4. 🎯 Deepen specific sections further
5. ↩️  Revert to original plan
6. 📤 Export to different format
7. 💾 Save as template

Enter number or command:
```

---

## Example Enhancement

**Before:**
```markdown
## Step 3: Create Invoice API Route

Create GET /api/invoices endpoint to list invoices.

Implementation:
- Use Fastify
- Add auth
- Query database
- Return JSON
```

**After:**
```markdown
## Step 3: Create Invoice API Route

Create GET /api/invoices endpoint to list invoices.

Implementation:
- Use Fastify
- Add auth
- Query database
- Return JSON

### 📚 Research Insights

#### API Best Practices (fastify-api-reviewer, best-practices-researcher)

**Zod Validation Schema:**
```typescript
import { z } from 'zod'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

const InvoiceQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['draft', 'sent', 'paid']).optional()
})

const InvoiceResponseSchema = z.object({
  invoices: z.array(z.object({
    id: z.string().uuid(),
    number: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string()
  })),
  total: z.number(),
  limit: z.number(),
  offset: z.number()
})

const server = fastify.withTypeProvider<ZodTypeProvider>()

server.get(
  '/invoices',
  {
    onRequest: [authMiddleware],
    schema: {
      querystring: InvoiceQuerySchema,
      response: {
        200: InvoiceResponseSchema
      }
    }
  },
  async (request, reply) => {
    // Implementation
  }
)
```

#### Performance Optimization (performance-oracle, team learning)

**N+1 Query Prevention:**
```typescript
// ❌ BAD: N+1 queries (1 + N queries)
const invoices = await prisma.invoice.findMany()
for (const inv of invoices) {
  inv.client = await prisma.client.findUnique({ where: { id: inv.clientId } })
}

// ✅ GOOD: Single query with include
const invoices = await prisma.invoice.findMany({
  where: { tenantId },
  include: {
    client: { select: { id: true, name: true } },
    lines: { select: { description: true, amount: true } }
  },
  take: limit,
  skip: offset
})
```

**Metrics:** Reduces query count from 101 to 1, load time from 2.5s to 180ms (14x faster)

#### Security (security-sentinel, clerk-auth-reviewer)

**Tenant Isolation:**
```typescript
// Get user's tenant
const tenantId = await getUserTenant(request.userId)

// ALWAYS filter by tenantId
const invoices = await prisma.invoice.findMany({
  where: { tenantId }  // CRITICAL for multi-tenant security
})
```

**Related Learning:** [Tenant isolation breach](docs/solutions/security/2026-01-25-tenant-isolation.md)

#### Error Handling (best-practices-researcher)

```typescript
try {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId }
  })
  return { invoices, total, limit, offset }
} catch (error) {
  request.log.error({ error }, 'Failed to fetch invoices')
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Failed to fetch invoices'
  })
}
```

#### Testing Strategy (testing best practices)

```typescript
describe('GET /api/invoices', () => {
  it('returns paginated invoices', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/invoices?limit=10&offset=0',
      headers: { authorization: `Bearer ${token}` }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().invoices).toHaveLength(10)
  })

  it('enforces tenant isolation', async () => {
    // Test cross-tenant access blocked
  })

  it('validates query parameters', async () => {
    // Test Zod validation
  })
})
```

#### Deployment Considerations (deployment-verification-agent)

**Pre-deploy Checklist:**
- [ ] Zod schemas defined
- [ ] Auth middleware applied
- [ ] Tenant filtering in queries
- [ ] Error handling in place
- [ ] Tests passing
- [ ] Performance tested (100+ records)

**Monitoring:**
```typescript
// Add metrics
request.log.info({
  route: '/invoices',
  tenantId,
  queryTime: endTime - startTime,
  resultCount: invoices.length
})
```
```

---

## Best Practices

### Do:
- ✅ Run all available agents
- ✅ Apply team learnings
- ✅ Add concrete code examples
- ✅ Include performance metrics
- ✅ Note security considerations
- ✅ Preserve original content
- ✅ Link to related docs

### Don't:
- ❌ Skip agent reviews
- ❌ Ignore past learnings
- ❌ Be vague or generic
- ❌ Remove original plan
- ❌ Over-optimize prematurely
- ❌ Forget edge cases

---

## Akount-Specific Focus

When deepening Akount plans, emphasize:

### Financial Logic
- Decimal precision
- Multi-currency handling
- Double-entry bookkeeping
- Audit trails

### Multi-Tenant
- Tenant isolation
- Performance per tenant
- Data segregation
- Cross-tenant prevention

### Authentication
- Clerk patterns
- JWT verification
- Session handling
- Tenant mapping

### API Standards
- Zod validation
- Error handling
- Performance
- Type safety

---

## Time Investment vs Value

**Investment:**
- Running agents: 5-10 minutes (automated)
- Review findings: 10-15 minutes
- Total: 15-25 minutes

**Value:**
- Prevent production issues
- Apply best practices
- Learn from past mistakes
- Ship confidently
- Reduce debugging time
- **ROI: 10x**

---

**Deepen your next plan:**
```bash
/deepen-plan plan.md
```

🚀 Transform outlines into production-ready blueprints!
