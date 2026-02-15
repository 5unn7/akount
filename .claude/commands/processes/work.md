---
name: processes:work
description: Execute implementation plans systematically while maintaining quality
---

# Workflow: Work

Execute implementation plans step-by-step with quality checks built into each task.

**Pipeline:** Plan → **Work** → Review
**Prerequisite rule:** `.claude/rules/product-thinking.md` (investigation protocol applies to every task)
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

**1. Investigate** — Understand before changing (from `product-thinking.md`):

- Read the files you plan to change AND their callers (`Grep "[function]" apps/`)
- Search MEMORY topic files for prior art on similar work
- If fixing a bug: trace the code path before proposing changes
- Ask: WHY does the current code exist this way?

**2. Review Lens** — Quick pre-implementation check:

- [ ] Tenant isolation maintained?
- [ ] Financial integrity preserved (integer cents, double-entry)?
- [ ] No `: any` types planned?
- [ ] Follows existing patterns in adjacent files?

If the task has a tagged review agent (from the plan), keep that agent's concerns in mind.

**3. Implement** — Follow existing patterns. Use Edit for modifications, Write for new files.

**4. Test** — Run tests after each task, not just at the end:

```bash
npx vitest run [test-file]        # specific tests
npx vitest run                     # all tests
```

**5. Verify** — Check against the task's success criteria. Quick self-review:

- [ ] No `any` types, no `console.log`, no commented-out code
- [ ] Error handling present, new features have tests
- [ ] Design tokens used (not hardcoded hex values)

**6. Learn** — "Did I learn something non-trivial?"

If yes: note it for end-session capture (Bugs Fixed / Patterns Discovered sections).
Triggers: took >15 min to diagnose, fix was in unexpected file, discovered domain interaction, same bug type recurred.

**7. Commit** — If the task is a complete, working slice:

```bash
git add [specific files]
git commit -m "feat: [description]"
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

### Capture Session Knowledge

Suggest running `/processes:end-session` to capture:

- What was built/fixed during this work session
- Any patterns discovered or gotchas encountered
- Unfinished work context for next instance

This feeds into `/processes:eod` for daily artifact updates.

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

_~155 lines. 7-step per-task loop (investigate → review lens → implement → test → verify → learn → commit), plan deviation handling, session capture, review handoff._
