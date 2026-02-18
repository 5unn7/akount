# Task Population Protocol

---
paths:
  - "**"
---

> Auto-loaded globally — ensures all skills write to TASKS.md with approval

## When a Skill Produces Actionable Items

After completing its core work, every skill MUST:

1. **Identify tasks** — Extract actionable items from its output
2. **Classify by domain** — Dev, Design System, Marketing & Content, Operations
3. **Assign priority** — Critical, High, Medium, Low
4. **Note dependencies** — `[needs: TASK-ID]` if this task requires another first
5. **Justify** — Every task must have a `Source` (which skill created it) and a 1-line `Reason` explaining WHY it should exist
6. **Present for approval** — Show the user a formatted table of proposed tasks with source/reason
7. **User approves** — User can approve all, approve some, reject some, or edit before accepting
8. **Write approved tasks** — ONLY append user-approved tasks to TASKS.md

## Approval Gate (MANDATORY)

**No task enters TASKS.md without explicit user approval.** The flow is:

```
Skill identifies tasks → Presents table with Source + Reason → User reviews →
  - "Approve all" → All tasks written to TASKS.md
  - "Approve selected" → Only checked tasks written
  - "Edit" → User modifies priority/effort/description, then approve
  - "Reject" → Tasks discarded, reason noted
```

**Presentation format for approval (use AskUserQuestion):**

| # | ID | Task | Domain | Priority | Source | Reason | Deps |
|---|-----|------|--------|----------|--------|--------|------|
| 1 | SEC-9 | Add rate limiting | Dev | High | review:security-sentinel | OWASP A7, no rate limiting on any endpoint | |
| 2 | DS-3 | Token sync pipeline | Design | High | brainstorm:design-tokens | Figma tokens drift from code | [needs: DS-1] |
| 3 | DEV-3 | Fix onboarding middleware | Dev | Critical | diagnose:middleware-bug | Middleware disabled, blocks resume | |

## Source Field (REQUIRED)

Every task in TASKS.md must have a `Source` that traces WHERE it came from:

| Source Format | Meaning |
|--------------|---------|
| `review:agent-name` | Created by a code review finding |
| `plan:plan-name` | Created as a step in an implementation plan |
| `brainstorm:topic` | Created from a brainstorm action item |
| `diagnose:bug-name` | Created from a bug diagnosis |
| `audit:audit-date` | Created from a health audit finding |
| `braindump:topic` | Created from multi-agent feedback |
| `manual` | Added directly by user or agent (ad-hoc) |

## Dependency Notation

Tasks can declare prerequisites using `[needs: ID]` and blockers using `[blocks: ID]`:

| ID | Task | Status | Deps | Source |
|----|------|--------|------|--------|
| DS-3 | Build token sync pipeline | blocked | [needs: DS-1] | brainstorm:tokens |
| SEC-9 | Add rate limiting | ready | [blocks: INFRA-2] | review:security |

When a task with `[needs: X]` is claimed, check if X is `done`. If not, warn the agent.

## ID Prefixes by Domain

| Domain | Prefixes |
|--------|----------|
| Dev | SEC, PERF, FIN, DRY, UX, TEST, DEV, ARCH |
| Design System | DS |
| Marketing & Content | MKT, CNT |
| Operations | INFRA, OPS |

## Next ID Resolution

Read TASKS.md, find the highest existing number for the prefix, increment by 1.

## Validation Rules

Before presenting tasks for approval, validate:

- Task is **actionable** (not vague — "improve performance" is bad, "add index on transactions.accountId" is good)
- Task **doesn't duplicate** an existing TASKS.md item (Grep for similar descriptions)
- Task has a **concrete reason** (not "would be nice" — must solve a real problem)
- **Priority is justified** (Critical = blocks users, High = blocks launch, Medium = should do, Low = nice to have)

## Skills That MUST Follow This Protocol

- `/processes:review` — Phase 4.5: Auto-create tasks from findings
- `/processes:plan` — Phase 2.5: Register plan tasks with dependency chains
- `/processes:brainstorm` — Phase 3.5: Capture action items
- `/processes:diagnose` — Phase 5.5: Register fix tasks
- `/processes:audit` — Auto-create tasks from audit findings
- `/braindump` — Step 4.5: Capture agreed improvements
