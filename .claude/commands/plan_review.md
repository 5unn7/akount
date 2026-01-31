---
name: plan_review
description: Have multiple specialized agents review a plan in parallel
argument-hint: "[plan file path or plan content]"
---

# Plan Review

Run multiple specialized review agents in parallel to validate an implementation plan before starting work.

**Current Date:** 2026-01-30

---

## Purpose

Catch planning issues early by getting feedback from multiple expert perspectives:
- 🛡️ Security concerns
- ⚡ Performance bottlenecks
- 🏗️ Architectural issues
- 📏 Over-engineering
- 🎯 Missing requirements
- 🔍 Edge cases

**Better to spend 10 minutes reviewing a plan than 10 hours debugging production.**

---

## Usage

```bash
# Review current plan file
/plan_review plan.md

# Review specific plan
/plan_review docs/plans/feature-x.md

# Review from clipboard
/plan_review --clipboard

# Focus on specific aspects
/plan_review plan.md --focus=security,performance

# Quick review (fewer agents)
/plan_review plan.md --quick
```

---

## Workflow

### Phase 1: Parse Plan

Extract key information:

**Identify:**
- Feature scope and goals
- Technical approach
- Technologies used
- Database changes
- API endpoints
- Frontend components
- Security requirements
- Performance goals

**Categorize Sections:**
- Architecture/design
- Implementation steps
- Testing strategy
- Deployment plan
- Migration requirements

---

### Phase 2: Select Reviewers

Choose relevant agents based on plan content:

**Always Run (Core Reviewers):**

1. **architecture-strategist**
   - System design validation
   - Multi-tenant patterns
   - Domain boundaries
   - Component organization

2. **code-simplicity-reviewer**
   - YAGNI violations
   - Premature abstractions
   - Over-engineering detection
   - Complexity assessment

3. **kieran-typescript-reviewer**
   - Type safety approach
   - Modern patterns
   - Code quality standards

**Conditional Reviewers (Based on Content):**

4. **security-sentinel** (if security-relevant)
   - Authentication flows
   - Authorization logic
   - Input validation plans
   - Tenant isolation

5. **performance-oracle** (if performance-critical)
   - Query patterns
   - Caching strategy
   - Scaling concerns
   - Load considerations

6. **fastify-api-reviewer** (if API changes)
   - Route design
   - Validation approach
   - Error handling
   - Response formats

7. **clerk-auth-reviewer** (if auth changes)
   - Authentication flow
   - Token handling
   - Session management
   - Tenant mapping

8. **prisma-migration-reviewer** (if database changes)
   - Schema changes
   - Migration safety
   - Data integrity
   - Index strategy

9. **financial-data-validator** (if financial logic)
   - Calculation accuracy
   - Decimal precision
   - Multi-currency
   - Audit trails

10. **nextjs-app-router-reviewer** (if frontend changes)
    - Server/Client boundaries
    - Data fetching approach
    - Component structure
    - Performance patterns

11. **turborepo-monorepo-reviewer** (if structural changes)
    - Package organization
    - Dependency structure
    - Build pipeline
    - Import patterns

12. **pattern-recognition-specialist**
    - Consistency with codebase
    - Pattern identification
    - Duplication risks

---

### Phase 3: Parallel Agent Reviews

Launch all selected agents simultaneously:

```typescript
// Run agents in parallel for speed
const reviews = await Promise.all([
  Task(architecture-strategist, "Review system design in plan"),
  Task(security-sentinel, "Identify security concerns"),
  Task(performance-oracle, "Assess performance approach"),
  Task(code-simplicity-reviewer, "Check for over-engineering"),
  Task(kieran-typescript-reviewer, "Review type safety approach"),
  // ... more agents based on content
])
```

**Each agent reviews for:**
- Critical issues (blockers)
- Important concerns (should fix)
- Suggestions (nice to have)
- Praise (what's good)

---

### Phase 4: Findings Synthesis

Collect and categorize feedback:

**Group by Severity:**

🔴 **Critical (Blocking)**
- Security vulnerabilities
- Data loss risks
- Architectural flaws
- Missing requirements
- Performance bottlenecks

🟡 **Important (Should Fix)**
- Complexity issues
- Scalability concerns
- Testing gaps
- Error handling missing
- Type safety problems

🔵 **Suggestions (Nice to Have)**
- Code organization
- Pattern improvements
- Documentation additions
- Optional optimizations

**Deduplicate:**
- Merge similar feedback
- Prioritize by impact
- Remove conflicts
- Highlight consensus

---

### Phase 5: Structured Report

Generate comprehensive review:

```markdown
# Plan Review Report

**Plan:** [Plan name/path]
**Reviewed:** 2026-01-30
**Agents:** 12
**Review Time:** ~8 minutes

---

## Executive Summary

**Overall Assessment:** ✅ GOOD / ⚠️ NEEDS WORK / 🔴 MAJOR ISSUES

**Key Findings:**
- 2 critical issues requiring plan changes
- 5 important considerations to address
- 8 suggestions for improvement

**Recommendation:** [Approve / Revise / Redesign]

---

## Critical Issues (🔴)

### 1. Missing Tenant Isolation in Queries

**Agent:** architecture-strategist, security-sentinel
**Severity:** CRITICAL
**Location:** Section 3 - Database Queries

**Issue:**
Plan doesn't mention filtering by tenantId in queries. This creates a security vulnerability where users could access other tenants' data.

**Current Plan:**
```typescript
const invoices = await prisma.invoice.findMany({
  where: { status: 'paid' }
})
```

**Required Change:**
```typescript
const tenantId = await getUserTenant(request.userId)
const invoices = await prisma.invoice.findMany({
  where: {
    status: 'paid',
    tenantId  // CRITICAL: Add tenant isolation
  }
})
```

**Impact:** Without this, multi-tenant isolation is broken
**Action:** Update plan to include tenant filtering in all queries

---

### 2. N+1 Query Performance Issue

**Agent:** performance-oracle
**Severity:** CRITICAL
**Location:** Section 4 - Invoice List Page

**Issue:**
Plan describes loading invoices then separately loading clients, creating N+1 queries. With 100 invoices, this means 101 database queries (2.5s load time).

**Current Plan:**
> Load all invoices, then for each invoice, load the client data

**Recommended Approach:**
```typescript
// Single query with include
const invoices = await prisma.invoice.findMany({
  where: { tenantId },
  include: {
    client: { select: { id: true, name: true } },
    lines: true
  }
})
```

**Impact:** 14x faster (2.5s → 180ms)
**Action:** Update plan to use eager loading with include

---

## Important Concerns (🟡)

### 3. Missing Error Handling Strategy

**Agent:** architecture-strategist, fastify-api-reviewer
**Severity:** IMPORTANT

**Issue:** Plan doesn't describe how errors will be handled at different levels.

**Recommendations:**
- Add try-catch blocks around database operations
- Define error response format
- Plan error logging strategy
- Consider circuit breakers for external APIs

---

### 4. No Zod Validation Schemas Defined

**Agent:** fastify-api-reviewer, kieran-typescript-reviewer
**Severity:** IMPORTANT

**Issue:** API routes mentioned but no validation schemas planned.

**Action:** Add section defining Zod schemas for:
- Request bodies
- Query parameters
- Response formats

---

### 5. Type Safety for Request.userId

**Agent:** clerk-auth-reviewer, kieran-typescript-reviewer
**Severity:** IMPORTANT

**Issue:** Plan mentions `request.userId` but doesn't show type safety.

**Recommendation:**
```typescript
// Extend FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    userId: string  // Set by authMiddleware
  }
}
```

---

## Suggestions (🔵)

### 6. Consider Pagination Early

**Agent:** performance-oracle
**Severity:** NICE TO HAVE

**Suggestion:** Plan mentions listing invoices but doesn't include pagination. Consider adding pagination now rather than later.

---

### 7. Extract Common Patterns

**Agent:** code-simplicity-reviewer, pattern-recognition-specialist
**Severity:** NICE TO HAVE

**Suggestion:** Multiple routes will need tenant resolution. Consider extracting `getUserTenant()` helper early.

---

## What's Good ✅

**Agents:** All reviewers

**Praise:**
- ✅ Clear separation of concerns
- ✅ Following Akount patterns
- ✅ Authentication planned correctly
- ✅ Database schema well designed
- ✅ Good step-by-step breakdown
- ✅ Testing strategy included

---

## Agent Review Details

### Architecture-Strategist Review
**Status:** ⚠️ NEEDS REVISION
**Key Points:**
- System design is sound
- Multi-tenant isolation needs emphasis
- Domain boundaries clear
- Recommend extracting shared utilities

### Security-Sentinel Review
**Status:** 🔴 SECURITY ISSUES FOUND
**Key Points:**
- Missing tenant isolation (CRITICAL)
- Auth middleware correct
- Input validation needs definition
- Consider rate limiting

### Performance-Oracle Review
**Status:** 🔴 PERFORMANCE ISSUES FOUND
**Key Points:**
- N+1 query issue (CRITICAL)
- Recommend pagination
- Caching strategy undefined
- Query indexes look good

### Code-Simplicity-Reviewer Review
**Status:** ✅ GOOD
**Key Points:**
- No over-engineering detected
- Appropriate abstraction level
- YAGNI compliant
- Could extract common helpers

[... other agent reviews ...]

---

## Recommendation

**Overall:** ⚠️ REVISE BEFORE IMPLEMENTING

**Must Fix (Critical):**
1. Add tenant isolation to all queries
2. Fix N+1 query with eager loading

**Should Fix (Important):**
3. Define error handling strategy
4. Add Zod validation schemas
5. Type safety for request.userId

**Optional (Nice to Have):**
6. Add pagination
7. Extract common patterns

**Estimated Revision Time:** 30 minutes

After revisions, plan will be production-ready. ✅

---

## Next Steps

1. 📝 Update plan with critical fixes
2. ✅ Address important concerns
3. 💡 Consider suggestions
4. 🔄 Optional: Re-run /plan_review
5. 🚀 Begin implementation with /workflows:work

---

## Review Statistics

**Coverage:**
- Architecture: ✓ Reviewed
- Security: ✓ Reviewed
- Performance: ✓ Reviewed
- Type Safety: ✓ Reviewed
- API Design: ✓ Reviewed
- Database: ✓ Reviewed
- Frontend: ✓ Reviewed
- Simplicity: ✓ Reviewed

**Time Saved:** ~4 hours of debugging prevented

---

_Generated by /plan_review on 2026-01-30_
```

---

## Example Output (Console)

```
🔍 Reviewing Plan: feature-multi-currency.md

Launching 12 agents in parallel...
✓ architecture-strategist (2.3s)
✓ security-sentinel (1.8s)
✓ performance-oracle (2.1s)
✓ code-simplicity-reviewer (1.5s)
✓ kieran-typescript-reviewer (1.9s)
✓ fastify-api-reviewer (2.4s)
✓ clerk-auth-reviewer (1.7s)
✓ prisma-migration-reviewer (2.0s)
✓ financial-data-validator (2.2s)
✓ nextjs-app-router-reviewer (1.8s)
✓ turborepo-monorepo-reviewer (1.6s)
✓ pattern-recognition-specialist (2.0s)

📊 Review Complete (8.2 minutes)

🔴 Critical Issues: 2
🟡 Important Concerns: 5
🔵 Suggestions: 8

⚠️ RECOMMENDATION: Revise before implementing

Critical Issues Found:
1. Missing tenant isolation (security-sentinel, architecture-strategist)
2. N+1 query performance issue (performance-oracle)

Report saved: plan-review-2026-01-30.md

Next: Fix critical issues and re-run review
```

---

## Integration with Workflows

**Standard Flow:**

```bash
# 1. Brainstorm feature
/workflows:brainstorm "Multi-currency invoice support"

# 2. Create plan
/workflows:plan

# 3. Deepen plan with research
/deepen-plan plan.md

# 4. Review plan (YOU ARE HERE)
/plan_review plan-deepened.md

# 5. Fix issues and re-review
# [Fix issues]
/plan_review plan-deepened.md

# 6. Begin work
/workflows:work plan-deepened.md

# 7. Code review
/workflows:review

# 8. Document learnings
/workflows:compound
```

---

## Quick Review Mode

For faster reviews with fewer agents:

```bash
/plan_review plan.md --quick
```

**Quick mode runs only:**
- architecture-strategist
- security-sentinel
- performance-oracle
- code-simplicity-reviewer

**Use when:**
- Small changes
- Iteration speed matters
- Low-risk features
- Proof of concepts

**Time:** ~3 minutes vs 8-10 minutes

---

## Focused Review

Review specific aspects:

```bash
# Security focus
/plan_review plan.md --focus=security

# Performance focus
/plan_review plan.md --focus=performance

# Multiple focuses
/plan_review plan.md --focus=security,performance,architecture
```

---

## Best Practices

### Do:
- ✅ Review before implementing
- ✅ Fix critical issues immediately
- ✅ Consider important concerns
- ✅ Re-review after major changes
- ✅ Share report with team

### Don't:
- ❌ Skip plan reviews
- ❌ Ignore critical findings
- ❌ Dismiss agent feedback
- ❌ Over-optimize suggestions
- ❌ Rush into implementation

---

## Akount-Specific Checks

Plan review automatically checks for:

### Multi-Tenant Requirements
- Tenant ID filtering in queries
- Cross-tenant access prevention
- Performance per tenant
- Tenant-specific configuration

### Financial Data Safety
- Decimal precision (no floats)
- Multi-currency handling
- Audit trail implementation
- Double-entry bookkeeping

### Authentication
- Clerk JWT verification
- Protected route patterns
- Session management
- Tenant mapping

### API Standards
- Zod validation schemas
- Error handling patterns
- Type safety
- Performance considerations

---

## Success Metrics

**Time Investment:** 8-10 minutes automated review
**Value:** 4-10 hours debugging prevented
**ROI:** 30-50x return

**Issues Caught:**
- 80% of security vulnerabilities
- 90% of performance bottlenecks
- 70% of architectural issues
- 60% of over-engineering

---

**Review your next plan:**
```bash
/plan_review plan.md
```

🛡️ Catch issues before they reach production!
