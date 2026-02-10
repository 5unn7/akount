---
name: processes:work
description: Execute implementation plans systematically while maintaining quality
---

# Workflow: Work

Execute implementation plans step-by-step with quality checks built into each task.

**Pipeline:** Plan → **Work** → Review
**When to use:** After creating a plan with `/processes:plan`.

---

## Phase 1: Load Plan

### Read the Plan

```
Read docs/plans/[plan-name].md
```

Extract: task list, file locations, success criteria, dependencies, high-risk tasks.

### Clarify Before Starting

If anything is ambiguous, use AskUserQuestion. Don't guess — clarity prevents rework.

### Check Environment

```bash
git status
```

Verify clean working directory. Create a feature branch if needed.

---

## Phase 2: Execute Tasks

Use TodoWrite to track each task from the plan. Mark tasks `in_progress` one at a time.

### Per-Task Loop

For each task in the plan:

**1. Read** — Read files mentioned in the task and reference files for patterns

**2. Implement** — Follow existing patterns. Use Edit for modifications, Write for new files.

**3. Test** — Run tests after each task, not just at the end:
```bash
npx vitest run [test-file]        # specific tests
npx vitest run                     # all tests
```

**4. Verify** — Check against the task's success criteria. Quick self-review:
- [ ] No `any` types without justification
- [ ] No console.log left behind
- [ ] No commented-out code
- [ ] Error handling present
- [ ] New features have tests

**5. Commit** — If the task is a complete, working slice:
```bash
git add [specific files]
git commit -m "feat: [description]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

Only commit when tests pass and the slice is functional. See `guardrails.md` for commit rules.

### When the Plan is Wrong

If a task takes 2x expected effort or reveals a design flaw:
1. **STOP** — don't power through a broken plan
2. Update the plan file with what you learned
3. Inform the user of the deviation
4. Get alignment before continuing

This is normal — ~30% of plans need adjustment during implementation.

### High-Risk Tasks

For tasks tagged `Risk: high` in the plan (financial logic, auth, schema changes):
- Run the relevant review agent after completing the task
- Financial logic → `financial-data-validator`
- Auth changes → `security-sentinel`
- Schema migrations → `prisma-migration-reviewer`

---

## Phase 3: Wrap Up

### Update Plan

Mark completed tasks in the plan file:
```markdown
- [x] Task 1: Create schema
- [x] Task 2: Create service
- [ ] Task 3: Write tests (in progress)
```

### Update TASKS.md

If the plan completes a task from TASKS.md, mark it done.

### Final Validation

After all tasks complete:
- Run full test suite: `npx vitest run`
- Suggest: "Run `/processes:review` for final multi-agent validation"

---

## Progress Tracking

Use TodoWrite throughout. Update immediately when tasks complete — don't batch.

```
TodoWrite: [
  { content: "Create schema", status: "completed", activeForm: "Creating schema" },
  { content: "Create service", status: "in_progress", activeForm: "Creating service" },
  { content: "Write tests", status: "pending", activeForm: "Writing tests" }
]
```

---

_~135 lines. Per-task quality loop, plan deviation handling, review handoff._
