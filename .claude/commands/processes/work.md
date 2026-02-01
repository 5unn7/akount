---
name: processes:work
description: Execute implementation plans systematically while maintaining quality
argument-hint: "[plan file path or feature name]"
aliases:
  - work
  - implement
  - execute
  - build
keywords:
  - implementation
  - execution
  - build
  - code
  - development
---

# Workflow: Work

Execute implementation plans efficiently while maintaining quality and finishing features completely.

**Current Date:** 2026-01-30

## When to Use

- You have a complete implementation plan
- Ready to write code and tests
- Need structured guidance through implementation
- Want to maintain quality while moving fast

## Four-Phase Workflow

---

### Phase 1: Quick Start

#### Read the Plan Completely

Before writing any code:

1. **Load the plan** from `docs/plans/YYYY-MM-DD-<feature>-plan.md`
2. **Read every section** - don't skip ahead
3. **Understand acceptance criteria** - know what "done" looks like
4. **Identify dependencies** - what must exist before you start?

#### Ask Clarifying Questions

**Before coding**, use AskUserQuestion for anything unclear:
- Ambiguous requirements
- Missing acceptance criteria
- Uncertain technical decisions
- Unclear edge case handling

**Don't assume!** It's faster to ask now than refactor later.

#### Setup Git Environment

Choose your workflow:

**Option 1: New Branch (Recommended)**
```bash
git checkout -b feature/invoice-templates
```

**Option 2: Existing Branch**
```bash
git checkout existing-feature-branch
```

**Option 3: Git Worktree (for parallel work)**
```bash
git worktree add ../akount-invoice-templates feature/invoice-templates
cd ../akount-invoice-templates
```

---

### Phase 2: Execute

#### Task Loop

Work through implementation phases from the plan:

**For each task:**

1. **Mark in Progress** ✏️
   - Update plan: `- [x]` → task in progress

2. **Implement**
   - Follow existing code patterns in codebase
   - Keep Server Components server by default
   - Use integer cents for all monetary amounts
   - Enforce tenant isolation in all queries
   - Write self-documenting code (clear names, simple logic)

3. **Test as You Go**
   - Don't wait until the end to test!
   - Test each function/component as you write it
   - Verify tenant isolation works
   - Check edge cases

4. **Commit Incrementally**
   - Commit when you complete a logical unit
   - Use clear commit messages
   - Include Co-Authored-By line

**Example Commit Message:**
```
Add invoice template creation endpoint

- POST /api/templates/invoices route handler
- Input validation with Zod schema
- Tenant isolation enforced
- Unit tests for validation logic

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### When to Commit

**DO commit when:**
- ✓ Feature slice complete (e.g., API route + tests working)
- ✓ Database migration is ready and tested
- ✓ Component fully functional with its styles
- ✓ Bug fix verified and tested
- ✓ Refactoring complete and not breaking

**DON'T commit when:**
- ✗ Tests are failing
- ✗ Code doesn't compile
- ✗ Only half of a feature (incomplete state)
- ✗ Console has errors
- ✗ Leaving for the day (finish or stash)

#### Follow Existing Patterns

**Database Queries:**
```typescript
// Always include tenant isolation
const invoices = await prisma.invoice.findMany({
  where: {
    entity: { tenantId: userTenant.id },
  },
});
```

**API Routes:**
```typescript
// Standard pattern for protected routes
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's tenant
  const userTenant = await getUserTenant(userId);

  // Query with tenant isolation
  const data = await prisma.model.findMany({
    where: { entity: { tenantId: userTenant.id } },
  });

  return NextResponse.json(data);
}
```

**Server Components:**
```typescript
// Fetch data server-side
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}
```

**Client Components:**
```typescript
// Only use 'use client' when necessary
'use client';
import { useState } from 'react';

export function InteractiveComponent({ data }) {
  const [selected, setSelected] = useState(null);
  // Only UI state here, not data fetching
}
```

#### Avoid Common Pitfalls

**Analysis Paralysis:**
- Don't overthink - follow the plan
- Don't abstract prematurely - wait for 3+ uses
- Don't add features not in plan

**80% Done Syndrome:**
- Finish one phase before starting another
- Don't skip tests "for now"
- Complete error handling, not just happy path
- Add loading states and error boundaries

---

### Phase 3: Quality Check

#### Run Tests

Before considering work "done":

```bash
# Run all tests
npm test

# Run linter
npm run lint

# Check TypeScript
npx tsc --noEmit
```

**All must pass!** Fix any failures before proceeding.

#### Code Review (For Complex Changes)

For non-trivial features, run relevant review agents:

```
Use code-simplicity-reviewer to check for unnecessary complexity
```

```
Use performance-oracle to identify bottlenecks
```

```
Use security-sentinel to audit security
```

**For simple changes:** Skip this step to avoid analysis paralysis.

#### Self-Review Checklist

Before submitting:

**Functionality:**
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] Error states have good UX
- [ ] Loading states present

**Code Quality:**
- [ ] TypeScript types explicit
- [ ] No `any` types
- [ ] Clear variable/function names
- [ ] No premature abstractions

**Testing:**
- [ ] Tests written and passing
- [ ] Manual testing complete
- [ ] Tested in different scenarios

**Security:**
- [ ] Input validated
- [ ] Tenant isolation enforced
- [ ] No sensitive data in logs
- [ ] Authentication checked

**Performance:**
- [ ] No N+1 queries
- [ ] Pagination if needed
- [ ] Client bundle size reasonable

**Financial (If Applicable):**
- [ ] Integer cents used
- [ ] Double-entry balanced
- [ ] Multi-currency handled
- [ ] Audit trail present

---

### Phase 4: Ship It

#### Final Commit

Create final commit with all changes:

```bash
git add .
git commit -m "$(cat <<'EOF'
Implement invoice template system

Complete implementation of:
- Database schema (InvoiceTemplate model)
- API endpoints (CRUD operations)
- UI components (template list, form, detail)
- Tests (unit + integration)
- Documentation updates

Acceptance Criteria:
✓ Users can save invoices as templates
✓ Templates include line items and tax rates
✓ Templates are tenant-isolated
✓ Templates can be loaded when creating invoices

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

#### Push Branch

```bash
git push -u origin feature/invoice-templates
```

#### Create Pull Request

Use GitHub CLI:

```bash
gh pr create --title "Implement invoice template system" --body "$(cat <<'EOF'
## Summary
Adds invoice template functionality to allow users to save and reuse invoice structures.

## Changes
- Added `InvoiceTemplate` Prisma model with tenant isolation
- Created CRUD API endpoints with input validation
- Built template management UI (list, create, edit, delete)
- Added ability to load templates when creating invoices
- Tests: 15 unit tests, 8 integration tests

## Testing
- [x] Manual testing complete
- [x] All unit tests pass
- [x] All integration tests pass
- [x] Tenant isolation verified
- [x] Multi-entity support tested

## Screenshots
[If UI changes, add screenshots here]

## Checklist
- [x] Code follows project conventions
- [x] Tests written and passing
- [x] Documentation updated
- [x] No console errors
- [x] TypeScript compiles without errors
- [x] Security considerations addressed
- [x] Performance considerations addressed

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

#### Notify User

Let the user know work is complete:

```
✅ Implementation Complete!

Feature: Invoice Templates
Branch: feature/invoice-templates
PR: #123
Status: Ready for Review

Summary:
- ✓ Database schema added
- ✓ API endpoints implemented
- ✓ UI components created
- ✓ Tests passing (23/23)
- ✓ Documentation updated

Next Steps:
1. Review the PR
2. Test in staging
3. Merge when approved
```

---

## Important Guidelines

### Do:
- ✓ Read the entire plan before coding
- ✓ Ask clarifying questions upfront
- ✓ Commit incrementally (logical units)
- ✓ Test continuously, not just at the end
- ✓ Follow existing code patterns
- ✓ Run quality checks before submitting

### Don't:
- ✗ Skip reading the plan
- ✗ Add features not in the plan
- ✗ Leave tests for the end
- ✗ Commit failing code
- ✗ Abstract prematurely
- ✗ Skip the self-review checklist

---

## Handling Issues

### Blocked by Dependencies

If you discover missing dependencies:

1. **Document the blocker** in the plan
2. **Ask user** if you should:
   - Implement the dependency first
   - Switch to a different task
   - Update the plan to remove dependency

### Plan Needs Adjustment

If the plan doesn't work as written:

1. **Don't just improvise!**
2. **Document the issue**
3. **Propose alternative approach**
4. **Get user approval** before proceeding

### Tests Failing

If tests fail:

1. **Don't commit anyway!**
2. **Debug the issue**
3. **Fix the code or test**
4. **Verify fix works**
5. **Then commit**

---

## Progress Tracking

### Update the Plan Document

As you work, update the plan file:

```markdown
## Implementation Phases

### Phase 1: Database & Backend ✅ COMPLETE

**Tasks:**
- [x] Create Prisma schema updates ✅
- [x] Write and test migration ✅
- [x] Create API route handlers ✅
- [x] Add input validation ✅
- [x] Write unit tests ✅

### Phase 2: UI Components 🔄 IN PROGRESS

**Tasks:**
- [x] Create page layouts ✅
- [x] Build form components ✅
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Implement optimistic updates
```

**Living Document:** The plan shows real-time progress.

---

## Example: Working Through a Plan

### Starting State

Plan says:
```
Phase 1: Create API endpoint
- [ ] POST /api/templates/invoices
- [ ] Input validation
- [ ] Tests
```

### Execution

1. **Read requirement**: Need API endpoint to create invoice templates
2. **Ask if unclear**: "Should templates be per-entity or per-tenant?"
3. **Implement**: Create `app/api/templates/invoices/route.ts`
4. **Test**: Write tests, verify tenant isolation
5. **Commit**: `git commit -m "Add invoice template creation endpoint"`
6. **Update plan**: Mark task complete `[x]`

### Result

```
Phase 1: Create API endpoint ✅
- [x] POST /api/templates/invoices ✅
- [x] Input validation ✅
- [x] Tests ✅
```

---

**Remember:** The goal is to finish features completely, not just write code. Follow the plan, test continuously, commit incrementally, and ship with confidence.
