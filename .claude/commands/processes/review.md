---
name: workflows:review
description: Perform comprehensive code reviews using multi-agent analysis
argument-hint: "[PR number, GitHub URL, file path, or current branch]"
---

# Workflow: Review

Perform exhaustive code reviews using multiple specialized agents to catch issues across type safety, architecture, performance, security, and domain-specific concerns.

**Current Date:** 2026-01-30

## Prerequisites

- Git repository
- Clean working directory (or use git worktree)
- GitHub CLI authenticated (for PR reviews)
- Proper permissions

## Review Process

### Phase 1: Determine Review Target

Identify what to review:

**Options:**
1. **PR Number** - `#123` or `123`
2. **GitHub URL** - Full PR URL
3. **File Paths** - Specific files to review
4. **Current Branch** - Review uncommitted or committed changes

**Actions:**
- Check git branch status
- Fetch PR metadata (if PR review)
- Identify changed files
- Prepare analysis environment

---

### Phase 2: Parallel Agent Analysis

Run specialized reviewer agents in **parallel** based on code changes:

#### Always Run (Core Reviewers)

1. **kieran-typescript-reviewer**
   - Type safety validation
   - Modern TypeScript patterns
   - Code quality standards

2. **architecture-strategist**
   - System design alignment
   - Multi-tenant isolation
   - Domain boundaries
   - Component organization

3. **code-simplicity-reviewer**
   - YAGNI violations
   - Premature abstractions
   - Complexity reduction opportunities

4. **performance-oracle**
   - N+1 query detection
   - Algorithmic complexity
   - React rendering optimization
   - Database query efficiency

5. **security-sentinel**
   - OWASP Top 10 compliance
   - Authentication/authorization
   - Input validation
   - Tenant isolation security

#### Conditional Reviewers

Run these based on file changes:

6. **fastify-api-reviewer** (if API routes changed) **NEW - Week 2**
   - Zod validation schemas
   - Authentication middleware
   - Tenant isolation
   - Database query patterns
   - Error handling
   - Financial data safety

7. **clerk-auth-reviewer** (if auth code changed) **NEW - Week 2**
   - JWT verification
   - Protected route checks
   - Session handling
   - Tenant mapping
   - Security best practices

8. **turborepo-monorepo-reviewer** (if package.json or turbo.json changed) **NEW - Week 2**
   - Workspace protocol usage
   - Circular dependencies
   - Import structure
   - Pipeline configuration
   - Build order

9. **prisma-migration-reviewer** (if schema.prisma changed)
   - Migration safety
   - Data integrity
   - Financial data protection

10. **financial-data-validator** (if financial logic affected)
    - Double-entry bookkeeping
    - Integer cents arithmetic
    - Multi-currency handling
    - Audit trails

11. **nextjs-app-router-reviewer** (if App Router files changed)
    - Server/Client boundaries
    - Async patterns
    - Metadata configuration
    - Performance optimization

12. **pattern-recognition-specialist** (optional for large changes)
    - Design patterns
    - Code duplication
    - Naming conventions
    - Anti-patterns

13. **data-migration-expert** (if migration scripts included)
    - Data transformation safety
    - Rollback procedures
    - Production data verification

14. **deployment-verification-agent** (if risky deployment)
    - Pre/post deploy checklists
    - Verification queries
    - Rollback plan

**Execute agents using Task tool:**

```typescript
// Example: Run multiple agents in parallel
[
  Task(kieran-typescript-reviewer, "Review TypeScript code in PR"),
  Task(security-sentinel, "Perform security audit"),
  Task(performance-oracle, "Check for performance issues"),
  // ... other agents
]
```

---

### Phase 3: Deep Analysis

After agent reviews, perform additional analysis:

#### Stakeholder Perspectives

Consider impact from different viewpoints:

1. **Developer Maintainability**
   - Is code easy to understand?
   - Are patterns consistent with codebase?
   - Is testing straightforward?

2. **Operations & Reliability**
   - Are error scenarios handled?
   - Is logging appropriate?
   - Are database migrations safe?

3. **End User Experience**
   - Does this improve UX?
   - Are loading states handled?
   - Is error messaging clear?

4. **Security & Compliance**
   - Are there security risks?
   - Is PII handled correctly?
   - Is audit trail maintained?

5. **Business Impact**
   - Does this deliver business value?
   - Are financial calculations accurate?
   - Is multi-tenant isolation maintained?

#### Scenario Exploration

Test edge cases mentally:

- **Happy Path**: Normal usage works correctly?
- **Invalid Inputs**: Proper validation and error messages?
- **Boundary Conditions**: Edge cases handled (empty arrays, null values)?
- **Concurrency**: Race conditions possible?
- **Scale**: Performance at 100K+ records?
- **Network Issues**: Graceful degradation?
- **Security Attacks**: Injection, XSS, IDOR vulnerabilities?

---

### Phase 4: Findings Synthesis

Consolidate all agent reports and analysis:

#### Categorize by Severity

**🔴 P1 - CRITICAL (Blocking)**
- Security vulnerabilities
- Data corruption risks
- Breaking changes without migration path
- Financial calculation errors
- Tenant isolation breaches

**🟡 P2 - IMPORTANT (Should Fix)**
- Performance bottlenecks
- Type safety issues
- Missing error handling
- Unclear code patterns
- Missing tests for critical paths

**🔵 P3 - NICE TO HAVE (Optional)**
- Code simplification opportunities
- Documentation improvements
- Minor performance optimizations
- Consistency improvements

#### Create Findings Document

```markdown
# Code Review: [Feature Name]

**Date:** 2026-01-30
**Reviewer:** Claude with Multi-Agent Analysis
**Branch/PR:** [branch name or PR number]

## Summary

- **Total Findings:** [count]
- **Critical (🔴):** [count]
- **Important (🟡):** [count]
- **Nice-to-Have (🔵):** [count]

## Critical Findings (🔴)

### 1. [Finding Title]

**Category:** [Security / Data Integrity / Performance / Architecture]

**Location:** `[file:line]`

**Issue:**
[Description of the problem]

**Evidence:**
```typescript
// Problematic code
```

**Impact:**
[What could go wrong]

**Recommendation:**
```typescript
// Suggested fix
```

**Priority:** MUST FIX before merge

---

## Important Findings (🟡)

[Similar structure for each finding]

---

## Nice-to-Have Improvements (🔵)

[Similar structure for each finding]

---

## Agent Review Summary

**Agents Used:**
- kieran-typescript-reviewer: ✓
- security-sentinel: ✓
- performance-oracle: ✓
- architecture-strategist: ✓
- [... other agents]

**Key Highlights:**
- Type Safety: [EXCELLENT / GOOD / NEEDS IMPROVEMENT]
- Security: [SECURE / AT RISK / VULNERABLE]
- Performance: [EXCELLENT / GOOD / NEEDS IMPROVEMENT]
- Architecture: [EXCELLENT / GOOD / NEEDS IMPROVEMENT]

---

## Blocking Merge Criteria

⚠️ **DO NOT MERGE** until all 🔴 P1 findings are addressed.

✅ **Safe to merge** after P1 fixes verified.

---

## Next Steps

1. Address all 🔴 P1 critical findings
2. Fix 🟡 P2 important issues (recommended)
3. Consider 🔵 P3 improvements (optional)
4. Re-run affected agents on changes
5. Update tests if logic changed
6. Request human review if uncertain
```

---

### Phase 5: Output Review Results

Present findings to user:

1. **Summary Statistics**
   - Total findings by severity
   - Agent coverage report
   - Time saved by automated review

2. **Critical Actions Required**
   - List all P1 findings requiring fixes

3. **Recommendations**
   - Suggested P2 fixes
   - Optional P3 improvements

4. **Review Files**
   - Link to detailed findings document
   - Agent-specific reports (if saved)

---

### Phase 6: Optional Testing

Based on changes, offer to run tests:

**Web Application Changes:**
- Suggest running affected page tests
- Check for console errors
- Verify responsive design

**API Changes:**
- Suggest testing endpoints
- Verify authentication
- Check error responses

**Database Changes:**
- Run migration in test environment
- Verify data integrity
- Check query performance

---

## Review Checklist

Before approving, verify:

### Type Safety
- [ ] No `any` types without justification
- [ ] Function parameters and returns typed
- [ ] Modern TypeScript patterns used

### Architecture
- [ ] Tenant isolation enforced
- [ ] Domain boundaries respected
- [ ] Server-first architecture maintained
- [ ] No circular dependencies

### Security
- [ ] Authentication required
- [ ] Input validated
- [ ] No sensitive data exposure
- [ ] IDOR vulnerabilities prevented

### Performance
- [ ] No N+1 queries
- [ ] Proper indexes on queries
- [ ] Pagination for large datasets
- [ ] Client bundles reasonably sized

### Financial Integrity (If Applicable)
- [ ] Integer cents arithmetic
- [ ] Double-entry balancing
- [ ] Multi-currency handled correctly
- [ ] Audit trail maintained

### Code Quality
- [ ] No premature abstractions
- [ ] Clear naming (5-second rule)
- [ ] Testable code
- [ ] Error handling appropriate

---

## Important Guidelines

### Do:
- ✓ Run all relevant agents in parallel
- ✓ Categorize findings by severity
- ✓ Provide specific code examples
- ✓ Block on critical security/data issues
- ✓ Consider scalability and maintainability

### Don't:
- ✗ Skip agent reviews to save time
- ✗ Ignore performance or security concerns
- ✗ Approve with unaddressed P1 findings
- ✗ Provide vague feedback without examples
- ✗ Over-optimize prematurely (avoid P3 bikeshedding)

---

## Example Review Output

```
📊 Code Review Complete

Changed Files: 8
Lines Changed: +342, -89

🔴 Critical Issues: 2
  - Tenant isolation missing in GET /api/invoices
  - Float used for monetary amount (should be integer cents)

🟡 Important Issues: 5
  - N+1 query in invoice list page
  - Missing 'use client' directive on interactive component
  - No input validation on invoice amount
  - Type 'any' used in payment handler
  - Missing error.tsx boundary

🔵 Nice-to-Have: 3
  - Could extract repeated date formatting logic
  - Consider memoizing expensive calculation
  - Add JSDoc comments to complex functions

Agents Run: 8
Review Time: ~15 minutes (vs ~2 hours manual)

⚠️ BLOCKING: Must fix 2 critical issues before merge

Next: Address critical findings and re-run security-sentinel
```

---

**Remember:** Comprehensive reviews catch issues early. Better to spend 15 minutes reviewing than 2 hours debugging in production.
