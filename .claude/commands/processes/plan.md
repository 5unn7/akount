---
name: processes:plan
description: Transform feature descriptions into well-structured implementation plans
---

# Workflow: Plan

Transform feature requests into actionable implementation plans.

**When to Use:** Before starting any non-trivial feature (3+ steps, multiple files, unclear requirements).

---

## Three-Phase Workflow

**1. Research** (3-5m) - Understand requirements, explore codebase
**2. Design** (5-10m) - Break down into tasks, identify files
**3. Document** (2-3m) - Write plan in docs/plans/

**Total:** ~10-15 minutes

---

## Phase 1: Research (3-5 minutes)

### Clarify Requirements

**Ask user if unclear:**
- What's the expected behavior?
- Are there edge cases to handle?
- Should this match existing patterns?
- Any performance/security concerns?

Use AskUserQuestion for ambiguous requirements.

### Search Existing Code

```bash
# Find similar features
Grep "similar-feature" apps/ --output_mode=files_with_matches

# Check existing patterns
Read [similar-file]
```

**Understand:**
- How similar features are implemented
- File structure patterns
- Naming conventions
- Testing patterns

### Check Dependencies

```bash
# Read schema if database changes needed
Read packages/db/prisma/schema.prisma

# Check API routes if backend needed
Glob "apps/api/src/domains/**/routes/*.ts"

# Check components if frontend needed
Glob "apps/web/src/app/**/*.tsx"
```

---

## Phase 2: Design (5-10 minutes)

### Break Down Into Tasks

**Good task breakdown:**
- Each task is 15-45 minutes of work
- Tasks are sequential (dependencies clear)
- Each task has a deliverable (file, test, etc.)
- Success criteria are testable

**Example:**
```markdown
## Tasks

1. **Create Zod schema** (15m)
   - File: `apps/api/src/domains/banking/schemas/transaction.schema.ts`
   - Define CreateTransactionSchema with validation
   - Success: Schema exports and validates sample data

2. **Create service function** (30m)
   - File: `apps/api/src/domains/banking/services/transaction.service.ts`
   - Implement createTransaction with tenant isolation
   - Success: Function creates transaction in database

3. **Create API route** (20m)
   - File: `apps/api/src/domains/banking/routes/transaction.ts`
   - POST /api/banking/transactions endpoint
   - Success: Route returns 201 with transaction data

4. **Write tests** (30m)
   - File: `apps/api/__tests__/banking/transaction.test.ts`
   - Test service + route with tenant isolation
   - Success: Tests pass with 80%+ coverage
```

### Identify Critical Files

**For each task, list:**
- Files to create (Write tool)
- Files to modify (Edit tool)
- Files to reference (Read tool)

**Example:**
```markdown
## Files

### Create
- `apps/api/src/domains/banking/routes/transaction.ts`
- `apps/api/src/domains/banking/services/transaction.service.ts`
- `apps/api/src/domains/banking/schemas/transaction.schema.ts`
- `apps/api/__tests__/banking/transaction.test.ts`

### Modify
- `apps/api/src/domains/banking/routes/index.ts` (register new route)

### Reference
- `packages/db/prisma/schema.prisma` (Transaction model)
- Similar route for pattern matching
```

### Consider Edge Cases

**Common edge cases:**
- What if tenant doesn't exist?
- What if required data is missing?
- What about concurrent requests?
- How to handle errors?

**Document in plan:**
```markdown
## Edge Cases

- **Missing tenant:** Return 403 Forbidden
- **Invalid data:** Return 400 with Zod errors
- **Duplicate transaction:** Check unique constraint
- **Database error:** Return 500 with logged error
```

---

## Phase 3: Document (2-3 minutes)

### Write Plan File

**Template:**
```markdown
# [Feature Name] Implementation Plan

**Created:** YYYY-MM-DD
**Status:** Draft / In Progress / Complete

---

## Overview

[2-3 sentences describing what this feature does and why]

## Success Criteria

- [ ] [Criterion 1 - measurable]
- [ ] [Criterion 2 - measurable]
- [ ] [Criterion 3 - measurable]

## Tasks

### Task 1: [Name] (Est: [time])
**File:** [path]
**Description:** [what to do]
**Success:** [how to verify]

### Task 2: [Name] (Est: [time])
**File:** [path]
**Description:** [what to do]
**Success:** [how to verify]

[... more tasks]

## Files

### Create
- [new-file-1]
- [new-file-2]

### Modify
- [existing-file-1]

### Reference
- [reference-file-1]

## Edge Cases

- **[Case 1]:** [How to handle]
- **[Case 2]:** [How to handle]

## Testing Strategy

[How to test this feature]

## Rollback Plan

[How to undo if needed]

---

## Progress

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

### Save Plan

```bash
# Save to docs/plans/
Write docs/plans/YYYY-MM-DD-feature-name.md
```

**Naming convention:**
- Date prefix: `YYYY-MM-DD-`
- Kebab-case: `feature-name.md`
- Descriptive: Captures main feature

---

## Plan Quality Checklist

Before starting implementation:

**Clarity:**
- [ ] Requirements are clear (no ambiguity)
- [ ] Tasks are sequential and specific
- [ ] Success criteria are measurable

**Completeness:**
- [ ] All files identified (create, modify, reference)
- [ ] Edge cases considered
- [ ] Testing strategy defined

**Feasibility:**
- [ ] Each task is 15-45 minutes
- [ ] Total time estimate reasonable
- [ ] No blockers identified

**Standards:**
- [ ] Follows project patterns
- [ ] Includes tenant isolation checks
- [ ] Includes test requirements

---

## Output Format

```markdown
# 📋 Implementation Plan Created

## Feature
[Feature name]

## Plan Location
`docs/plans/YYYY-MM-DD-feature-name.md`

## Task Count
[N] tasks estimated at [X] hours total

## Critical Files
- [count] files to create
- [count] files to modify

## Next Step
Run `/processes:work` to execute this plan systematically.

---

**Plan ready for implementation!**
```

---

_Lines: ~250 (slimmed from 424). Focuses on research, design, documentation workflow._
