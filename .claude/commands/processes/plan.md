---
name: processes:plan
description: Transform feature descriptions into well-structured implementation plans
argument-hint: "[feature description, bug report, or improvement idea]"
---

# Workflow: Plan

Transform feature ideas into structured, actionable implementation plans following Akount conventions.

**Current Date:** 2026-01-30

## Prerequisites

- Clear feature description or brainstorm document
- Understanding of the problem being solved

## Planning Process

### Phase 1: Idea Refinement

#### Check for Existing Context

1. **Check brainstorms**: Look in `docs/brainstorms/` for related discussions
2. **Review similar features**: Find comparable implementations in codebase
3. **Check existing plans**: Look in `docs/plans/` for related work

#### Clarify Requirements

Use AskUserQuestion to gather:
- **User perspective**: Who will use this feature?
- **Success criteria**: How do we know it's working?
- **Technical constraints**: Any specific requirements?
- **Timeline expectations**: Rough complexity estimate

---

### Phase 2: Repository Research

Run these in **parallel** using Task tool:

1. **Explore codebase** - Use Explore agent to find:
   - Similar features and patterns
   - Related components and services
   - Database models that might be affected
   - Authentication/authorization patterns

2. **Check documentation** - Review:
   - `docs/product/overview.md` - Product context
   - `docs/features/` - Related feature specs
   - `packages/db/prisma/schema.prisma` - Data models
   - Existing conventions and patterns

---

### Phase 3: External Research (If Needed)

Determine if external research is needed:

**Run external research if:**
- Security-sensitive features (payments, auth, PII)
- Using new technologies or patterns
- Complex financial calculations
- Multi-currency or tax handling

**Use WebSearch for:**
- Best practices for the feature type
- Security considerations
- TypeScript/Next.js patterns
- Prisma schema patterns
- Financial calculation standards

---

### Phase 4: Consolidate Research

Document findings:

**Local Context:**
- Relevant files: `[file paths]`
- Existing patterns: `[pattern descriptions]`
- Data models: `[Prisma models involved]`

**External Resources:**
- Best practices: `[URLs]`
- Security considerations: `[URLs]`
- Framework docs: `[URLs]`

**Related Work:**
- Related issues/PRs: `[links]`
- Similar features: `[references]`

---

### Phase 5: Plan Structure

Create plan document with this structure:

#### File Path
```
docs/plans/YYYY-MM-DD-<type>-<feature-name>-plan.md
```

**Type Examples:**
- `feature` - New functionality
- `bugfix` - Fixing existing functionality
- `refactor` - Improving code structure
- `enhancement` - Improving existing feature

#### Plan Template

```markdown
# [Feature Name] Implementation Plan

**Date:** YYYY-MM-DD
**Type:** [feature/bugfix/refactor/enhancement]
**Status:** Planning
**Related:** [Links to brainstorms, issues, PRs]

## Summary

[2-3 sentence overview of what we're building and why]

## User Story

As a [user type], I want to [action] so that [benefit].

## Success Criteria

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- [ ] Acceptance criterion 3

## Technical Approach

### Architecture

**Components Affected:**
- Frontend: `[app/path/to/page.tsx]`
- API: `[app/api/path/route.ts]`
- Database: `[Prisma models]`
- Services: `[lib/services/]`

**Key Decisions:**
1. **Server vs Client**: [Justify Server Component vs Client Component choices]
2. **Data Flow**: [How data moves through the system]
3. **Authentication**: [How auth/authorization is enforced]

### Data Model Changes

**Prisma Schema Updates:**
```prisma
// New models or fields
model NewModel {
  id       String @id @default(cuid())
  tenantId String // Always include for tenant isolation
  // ... other fields
}
```

**Migration Checklist:**
- [ ] Tenant isolation enforced (tenantId foreign key)
- [ ] Indexes on frequently queried fields
- [ ] Integer cents for monetary amounts (no Float)
- [ ] Audit fields (createdAt, updatedAt, createdBy)
- [ ] No CASCADE deletes on financial data

### API Endpoints

**New Routes:**
- `POST /api/[resource]` - Create
- `GET /api/[resource]` - List (with pagination)
- `GET /api/[resource]/[id]` - Get single
- `PATCH /api/[resource]/[id]` - Update
- `DELETE /api/[resource]/[id]` - Delete

**Authentication:**
- All routes require `auth()` check
- Tenant isolation enforced in queries
- RBAC permissions checked where applicable

### UI Components

**Pages:**
- `app/(dashboard)/[feature]/page.tsx` - List/overview (Server Component)
- `app/(dashboard)/[feature]/[id]/page.tsx` - Detail view (Server Component)
- `app/(dashboard)/[feature]/new/page.tsx` - Create form (Server Component wrapper)

**Components:**
- `components/[feature]/[component].tsx` - Shared components
- Mark client components with 'use client' only when necessary

**Design System:**
- Use existing components from `components/ui/`
- Follow color palette: Orange (primary), Violet (secondary), Slate (neutral)
- Typography: Newsreader (headings), Manrope (body), JetBrains Mono (mono)

## Implementation Phases

### Phase 1: Database & Backend (Day 1-2)

**Tasks:**
- [ ] Create Prisma schema updates
- [ ] Write and test migration
- [ ] Create API route handlers
- [ ] Add input validation (Zod schemas)
- [ ] Write unit tests for business logic

**Review Points:**
- Run `prisma-migration-reviewer` on schema changes
- Run `financial-data-validator` if financial logic involved
- Run `security-sentinel` on API endpoints

### Phase 2: UI Components (Day 2-3)

**Tasks:**
- [ ] Create page layouts (Server Components)
- [ ] Build form components (Client Components where needed)
- [ ] Add loading states (loading.tsx, Suspense)
- [ ] Add error boundaries (error.tsx)
- [ ] Implement optimistic updates if applicable

**Review Points:**
- Run `nextjs-app-router-reviewer` on all pages
- Run `design-system-consistency-checker` on UI components

### Phase 3: Integration & Testing (Day 3-4)

**Tasks:**
- [ ] Integration testing (full user flows)
- [ ] Test multi-tenant isolation
- [ ] Test edge cases
- [ ] Performance testing (N+1 queries, pagination)
- [ ] Security testing (IDOR, input validation)

**Review Points:**
- Run `performance-oracle` on database queries
- Run `security-sentinel` on complete feature
- Run `architecture-strategist` on overall design

### Phase 4: Polish & Documentation (Day 4-5)

**Tasks:**
- [ ] Add metadata for SEO (generateMetadata)
- [ ] Update user documentation
- [ ] Create demo data/screenshots
- [ ] Final code review
- [ ] Deploy to staging

## Security Considerations

- [ ] Input validation on all user inputs (Zod schemas)
- [ ] Tenant isolation enforced in all queries
- [ ] RBAC permissions checked for sensitive operations
- [ ] No sensitive data in logs or error messages
- [ ] Rate limiting on API endpoints (if needed)
- [ ] SQL injection prevented (Prisma parameterizes automatically)

## Performance Considerations

- [ ] Database indexes on filtered/joined columns
- [ ] Pagination for large result sets (cursor-based)
- [ ] Parallel data fetching with Promise.all()
- [ ] Memoization for expensive client-side computations
- [ ] Code splitting for large components (dynamic imports)
- [ ] Server-side caching where appropriate (React cache, revalidate)

## Financial Integrity (If Applicable)

- [ ] All amounts stored as Integer cents
- [ ] Multi-currency handling (currency field paired with amount)
- [ ] Double-entry bookkeeping (debits = credits)
- [ ] Audit trail (JournalEntry with sourceDocument)
- [ ] No CASCADE deletes on financial data
- [ ] Fiscal period controls respected

## Testing Strategy

**Unit Tests:**
- Business logic functions
- Utility functions
- Validation schemas

**Integration Tests:**
- API endpoints
- Database queries
- Multi-tenant isolation

**E2E Tests (Optional):**
- Critical user flows
- Payment processing
- Data export/import

## Rollout Plan

**Staging:**
1. Deploy to staging environment
2. Manual testing of all flows
3. Stakeholder review

**Production:**
1. Feature flag (if applicable)
2. Gradual rollout (10% → 50% → 100%)
3. Monitor error rates and performance
4. Rollback plan ready

## Open Questions

- [ ] Question 1
- [ ] Question 2

## Dependencies

- Blocked by: [Other work that must complete first]
- Blocks: [Work that depends on this]

## Resources

- Brainstorm: `[link]`
- Design mockups: `[link]`
- Related issues: `[links]`
- External docs: `[links]`

---

## Estimation

**Complexity:** [Low / Medium / High]
**Effort:** [1-2 days / 3-5 days / 1-2 weeks]
**Risk:** [Low / Medium / High]

**Risk Factors:**
- Data migration complexity
- Integration with external services
- Security sensitivity
- Financial accuracy requirements
```

---

### Phase 6: Review & Finalize

Before saving, verify:

- [ ] All sections complete
- [ ] Tenant isolation considered
- [ ] Financial integrity checked (if applicable)
- [ ] Security reviewed
- [ ] Performance considered
- [ ] Clear acceptance criteria
- [ ] Phased implementation plan

---

### Phase 7: Next Steps

After creating the plan, offer these options:

1. **Start Implementation** - Run `/workflows:work [plan-file]`
2. **Deep Review** - Run multiple reviewer agents for validation
3. **Simplify** - Reduce scope if too complex
4. **Iterate** - Refine specific sections
5. **Create GitHub Issue** - If using issue tracking

Use AskUserQuestion to let user choose.

---

## Important Guidelines

### Do:
- ✓ Be specific and actionable
- ✓ Include code examples in templates
- ✓ Consider multi-tenant implications
- ✓ Think about security from the start
- ✓ Plan for testing and rollout

### Don't:
- ✗ **NEVER CODE!** Just write the plan
- ✗ Skip security or performance sections
- ✗ Forget tenant isolation
- ✗ Ignore financial integrity (if applicable)
- ✗ Plan more than 2 weeks of work without breaking down

---

## Implementation Detail Levels

Choose based on feature complexity:

**MINIMAL** (Simple bug fixes, small improvements):
- Brief description
- Files affected
- Basic acceptance criteria
- Quick testing checklist

**STANDARD** (Most features):
- Full template above
- 2-4 implementation phases
- Security and performance sections
- Clear testing strategy

**DETAILED** (Complex features, high risk):
- Everything in STANDARD
- Detailed data model changes with ERD
- API request/response examples
- Multiple rollout scenarios
- Extensive testing plan
- Risk mitigation strategies

---

**Remember:** A good plan answers "what" and "how" clearly enough that implementation is straightforward. Invest time in planning to save time in execution.
