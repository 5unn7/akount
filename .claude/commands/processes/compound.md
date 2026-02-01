---
name: processes:compound
description: Document solved problems to build organizational knowledge
argument-hint: "[optional context or problem description]"
---

# Workflow: Compound

Capture recently solved problems as structured documentation to compound team knowledge over time.

**Philosophy:** "Each unit of engineering work should make subsequent units easier—not harder."

**Current Date:** 2026-01-30

---

## Purpose

Transform solved problems into reusable knowledge:
- First occurrence: 30 minutes investigation + solution
- Documented: 2 minutes lookup + apply pattern
- **10x time savings** for future similar issues

---

## When to Use

Use this command immediately after:
- ✅ Fixing a tricky bug
- ✅ Solving a complex problem
- ✅ Discovering a non-obvious pattern
- ✅ Making an architectural decision
- ✅ Finding a workaround
- ✅ Learning something valuable

**Trigger phrases:**
- "That worked!"
- "It's fixed"
- "Problem solved"
- "Found the issue"
- "This pattern works well"

---

## Workflow

### Phase 1: Capture Context

Extract problem details:
- **What broke?** - Symptoms and error messages
- **Why it broke?** - Root cause analysis
- **How we fixed it?** - Solution with code examples
- **When to apply?** - Future detection criteria
- **What to avoid?** - Anti-patterns discovered

**Information Sources:**
- Recent git commits (last 5)
- Open files in editor
- Recent commands from history
- Error logs and stack traces
- PR descriptions

---

### Phase 2: Parallel Analysis (7 Agents)

Launch specialized subagents simultaneously:

#### 1. Context Analyzer
- Extract problem metadata
- Identify affected systems
- Determine severity and impact
- Validate documentation requirements

#### 2. Solution Extractor
- Identify root cause
- Document working fix
- Extract code examples
- Note configuration changes

#### 3. Related Docs Finder
- Search existing solutions
- Find related GitHub issues
- Identify cross-references
- Check for duplicates

#### 4. Prevention Strategist
- Develop safeguards
- Suggest test cases
- Identify monitoring needs
- Propose automation

#### 5. Category Classifier
- Determine category folder
- Generate filename
- Add relevant tags
- Set metadata fields

#### 6. Documentation Writer
- Assemble markdown structure
- Format code examples
- Add YAML frontmatter
- Validate completeness

#### 7. Specialized Domain Experts (Auto-invoked)
- **performance-oracle** - If performance issue
- **security-sentinel** - If security related
- **prisma-migration-reviewer** - If database issue
- **financial-data-validator** - If financial logic
- **fastify-api-reviewer** - If API issue
- **clerk-auth-reviewer** - If auth issue

---

### Phase 3: Documentation Structure

Create file in `docs/solutions/[category]/[filename].md`:

```markdown
---
title: "[Problem Title]"
category: "[Category]"
tags: [tag1, tag2, tag3]
date: 2026-01-30
resolved: true
severity: [low|medium|high|critical]
module: "[Affected Module]"
related: []
---

# [Problem Title]

## Problem

### Symptoms
What we observed:
- Error messages
- Unexpected behavior
- Performance issues

### Impact
- Who was affected
- Systems impacted
- Business impact

## Root Cause

What actually caused the issue:
- Why it happened
- Contributing factors
- Why it wasn't caught earlier

## Solution

### Fix Applied
```typescript
// Working code example
```

### Why It Works
Explanation of the solution.

### Configuration Changes
```bash
# Any config updates needed
```

## Prevention

### How to Detect Early
- Warning signs to watch for
- Monitoring to add
- Tests to write

### How to Prevent
- Code patterns to follow
- Safeguards to implement
- Reviews to conduct

## Related

- [Link to similar issue]
- [Related documentation]
- [GitHub issues]

## Timeline

- **Discovered:** 2026-01-30 10:00 AM
- **Root Cause Found:** 2026-01-30 11:30 AM
- **Fixed:** 2026-01-30 2:00 PM
- **Documented:** 2026-01-30 2:30 PM
```

---

### Phase 4: Category Classification

**Auto-detect category:**

1. **architecture/** - System design, patterns, structure
2. **api/** - REST endpoints, GraphQL, API design
3. **frontend/** - React, Next.js, UI components
4. **database/** - Prisma, migrations, queries
5. **security/** - Auth, vulnerabilities, permissions
6. **performance/** - Optimization, caching, queries
7. **bugs/** - Bug fixes, edge cases, gotchas
8. **deployment/** - CI/CD, environment, configs
9. **infrastructure/** - Railway, services, monitoring

**Filename format:** `YYYY-MM-DD-short-description.md`

**Example:** `docs/solutions/database/2026-01-30-prisma-enum-migration.md`

---

### Phase 5: Metadata Extraction

**YAML Frontmatter:**
```yaml
---
title: "Prisma Enum Migration Causes Downtime"
category: "database"
tags:
  - prisma
  - migration
  - enum
  - postgresql
severity: high
module: "packages/db"
date: 2026-01-30
resolved: true
related:
  - docs/solutions/database/2026-01-15-migration-rollback.md
---
```

---

### Phase 6: Write & Commit

1. **Create documentation file**
2. **Add to git**
3. **Commit with message:**
   ```
   docs: Document [problem title]

   Category: [category]
   Severity: [severity]

   Captured solution for future reference.
   ```
4. **Update solutions index** (optional)

---

## Example Output

```
📚 Knowledge Compounded!

Created: docs/solutions/database/2026-01-30-n-plus-one-invoice-query.md

Problem: N+1 Query Causing Slow Invoice List Load
Category: database / performance
Severity: medium
Tags: prisma, n+1, performance, optimization

Solution Summary:
Changed from sequential queries to single query with include.
Performance improved from 2.5s to 180ms (14x faster).

Prevention:
- Add test for query count
- Enable Prisma query logging in dev
- Review all findMany with relationships

Next time this occurs: Reference this doc (2 min vs 30 min investigation)

Would you like to:
1. View the full documentation
2. Create a GitHub issue
3. Add to team wiki
4. Share with team
```

---

## Integration with Workflow Cycle

**Complete Cycle:**
```
Brainstorm → Plan → Work → Review → Compound → Repeat
     ↓         ↓      ↓       ↓         ↓
  Ideation  Design  Build   QA    Document
```

**Compound completes the cycle:**
- Brainstorm: Explore possibilities
- Plan: Design implementation
- Work: Execute systematically
- Review: Catch issues
- **Compound: Capture learnings** ← YOU ARE HERE
- Repeat: Apply knowledge to next task

---

## Usage Examples

### Example 1: After Bug Fix
```bash
# Just fixed a bug
git commit -m "fix: Resolve invoice calculation rounding error"

# Immediately document it
/workflows:compound "Fixed rounding error in invoice calculations"
```

### Example 2: After Architecture Decision
```bash
# Made an important decision
/workflows:compound "Decided to use separate API instances per tenant"
```

### Example 3: After Performance Optimization
```bash
# Improved performance
/workflows:compound "Optimized N+1 query in dashboard load"
```

### Example 4: After Discovery
```bash
# Found non-obvious pattern
/workflows:compound "Discovered Clerk JWT tokens need explicit tenant validation"
```

---

## Best Practices

### Do:
- ✅ Document immediately (context fresh)
- ✅ Include code examples
- ✅ Add prevention strategies
- ✅ Link related issues
- ✅ Be specific and actionable

### Don't:
- ❌ Wait days to document
- ❌ Be vague or general
- ❌ Skip root cause analysis
- ❌ Forget prevention steps
- ❌ Document trivial issues

---

## Searchability

**Future developers can find solutions by:**

1. **Grep by keywords:**
   ```bash
   grep -r "N+1 query" docs/solutions/
   grep -r "Prisma migration" docs/solutions/
   ```

2. **Browse by category:**
   ```bash
   ls docs/solutions/database/
   ls docs/solutions/performance/
   ```

3. **Filter by tags:**
   ```bash
   grep -l "tags:.*prisma" docs/solutions/**/*.md
   ```

4. **Search frontmatter:**
   ```bash
   grep -l "severity: high" docs/solutions/**/*.md
   ```

---

## Team Benefits

### For Individuals
- ⚡ Solve problems 10x faster
- 🧠 Build personal knowledge base
- 📈 Track learning progress

### For Team
- 🤝 Share solutions instantly
- 📚 Build institutional knowledge
- 🚀 Onboard faster
- 🔄 Reduce repeated debugging

### For Organization
- 💰 Save engineering hours
- 📊 Track common issues
- 🎯 Identify patterns
- 🛡️ Prevent regressions

---

## Metrics

**Time Savings:**
- First occurrence: 30 min investigation + fix
- With documentation: 2 min lookup + apply
- **Savings per reuse: 28 minutes**

**ROI:**
- Time to document: 5 minutes
- Break-even: 1 reuse
- After 3 reuses: 84 minutes saved
- After 10 reuses: 280 minutes saved (4.6 hours)

---

## Akount-Specific Categories

### Financial Issues
- Invoice calculation errors
- Multi-currency conversion
- Decimal precision
- Double-entry bookkeeping

### Multi-Tenant Issues
- Tenant isolation breaches
- Cross-tenant data leaks
- Performance with many tenants
- Tenant onboarding

### Authentication Issues
- Clerk JWT verification
- Token refresh
- Session management
- Multi-device support

### API Issues
- Fastify route patterns
- Zod validation errors
- Error handling
- Rate limiting

---

## Next Steps After Documenting

1. **Share with team** (Slack, standup, wiki)
2. **Create tests** to prevent regression
3. **Add monitoring** to detect early
4. **Update runbooks** if operational
5. **Review similar code** for same issue

---

**Remember:** Every problem solved and documented makes the next engineer's job easier. That's compound engineering!

🚀 **Start compounding knowledge today!**
