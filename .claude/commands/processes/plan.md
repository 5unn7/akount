---
name: processes:plan
description: Transform feature descriptions into well-structured implementation plans
---

# Workflow: Plan

Transform feature requests into actionable implementation plans.

**Pipeline:** Brainstorm → **Plan** → Work → Review
**When to use:** Before starting any non-trivial feature (3+ steps, multiple files, unclear approach).

---

## Phase 1: Research

### Check for Prior Work

Before anything else:

- Read `docs/brainstorms/YYYY-MM-DD-*` if a brainstorm exists for this feature — don't redo that work
- Search `docs/plans/` for related plans
- Search codebase for similar implementations

### Clarify Requirements

If requirements are ambiguous, use AskUserQuestion:

- What's the expected behavior?
- Edge cases to handle?
- Performance or security concerns?

### Explore Codebase

```
Grep "similar-feature" apps/
Read [similar implementation file]
Read packages/db/prisma/schema.prisma  # if DB changes needed
```

Understand existing patterns, file structure, naming conventions, and testing approach.

---

## Phase 2: Design

### Break Down Into Tasks

Each task should be **one commit-able unit** — a coherent slice that works independently.

For each task, specify:

- **File:** path to create or modify
- **What:** description of the work
- **Depends on:** which prior task(s) must complete first (or "none")
- **Risk:** `high` if it touches financial logic, auth, or schema migrations; omit otherwise
- **Success:** how to verify it works

**Example:**

```markdown
### Task 1: Create Zod schema
**File:** `apps/api/src/domains/banking/schemas/reconciliation.schema.ts`
**What:** Define CreateReconciliationSchema with validation rules
**Depends on:** none
**Success:** Schema exports and validates sample data

### Task 2: Create service
**File:** `apps/api/src/domains/banking/services/reconciliation.service.ts`
**What:** Implement CRUD with tenant isolation
**Depends on:** Task 1
**Risk:** high (financial data)
**Success:** Service creates/reads records filtered by tenantId
```

### Tag Review Agents Per Task

For tasks touching sensitive areas, note which review agent is relevant:

- Financial calculations or money fields > `financial-data-validator`
- Auth, permissions, tenant boundaries > `security-sentinel`
- Schema changes, new models > `prisma-migration-reviewer`
- API route patterns > `fastify-api-reviewer`
- Frontend/App Router > `nextjs-app-router-reviewer`

Add to task format: **Review:** `[agent-name]` (only for relevant tasks, not every task)

**Example:**

```markdown
### Task 2: Create payment service
**File:** `apps/api/src/domains/vendors/services/payment.service.ts`
**What:** Implement payment creation with double-entry journal entries
**Depends on:** Task 1
**Risk:** high (financial data + cross-domain)
**Review:** `financial-data-validator`, `security-sentinel`
**Success:** Payment creates balanced journal entry, filtered by tenantId
```

### Consider Edge Cases

Document how to handle: missing tenant, invalid data, duplicates, database errors, concurrent requests.

### Systems Impact Assessment

Before finalizing the plan:

1. **Domain boundaries:** Does this modify data owned by another domain?
2. **Shared contracts:** Does this change API response shapes other consumers depend on?
3. **Migration impact:** Does this require data migration? If so, add a migration task.

Reference the Domain Adjacency Map in `.claude/rules/product-thinking.md`.

### Identify Reference Files

List files to read for pattern-matching (don't duplicate the file paths already in tasks):

```markdown
## Reference Files
- `packages/db/prisma/schema.prisma` — data model
- `apps/api/src/domains/banking/services/account.service.ts` — similar service pattern
```

---

## Phase 2.5: Register Plan Tasks in TASKS.md

**Protocol:** See `.claude/rules/task-population.md` for full approval gate rules.

After breaking the plan into implementation steps:

1. Extract all numbered tasks/sprints from the plan
2. Map each to the correct TASKS.md domain section
3. Identify dependency chains (Sprint 2 needs Sprint 1, etc.)
4. **Present proposed tasks to user for approval** with Source (`plan:<feature-name>`) + Reason
5. Write ONLY approved tasks with `[needs: PREV-ID]` linking sequential steps
6. Output: "Registered N tasks: [IDs]. Dependency chain: A → B → C"

---

## Phase 3: Document

Save to `docs/plans/YYYY-MM-DD-feature-name.md`:

```markdown
# [Feature Name] Implementation Plan

**Created:** YYYY-MM-DD
**Status:** Draft
**Brainstorm:** [link to brainstorm doc if exists]

## Overview
[2-3 sentences: what this does and why]

## Success Criteria
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]

## Tasks

### Task 1: [Name]
**File:** [path]
**What:** [description]
**Depends on:** [task number or "none"]
**Risk:** [high — only if applicable]
**Success:** [how to verify]

[... more tasks]

## Reference Files
- [file for pattern-matching]

## Edge Cases
- **[Case]:** [How to handle]

## Review Agent Coverage
| Task | Relevant Agents |
|------|----------------|
| Task N | `agent-name` |

## Domain Impact
- **Primary domains:** [list]
- **Adjacent domains:** [list]

## Testing Strategy
[What to test and how]

## Progress
- [ ] Task 1
- [ ] Task 2
```

---

## Handoff

After writing the plan, present a summary:

- Feature name
- Plan location (`docs/plans/YYYY-MM-DD-*.md`)
- Task count
- High-risk tasks (if any)
- save the plan in docs/plans/YYYY-MM-DD-short-description.md

Then ask user: "Run `/processes:work` to execute this plan." or modify

---

_~140 lines. Research → Design → Document._
