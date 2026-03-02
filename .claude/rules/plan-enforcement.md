# Plan Enforcement

> **Auto-loaded globally** — enforces plan-driven development

## Automatic Task Checking (NEW - Runs Without Commands)

**Trigger:** User message indicates implementation work (fix, add, create, implement, build, etc.)

**Behavior:**

1. **Extract task index** from TASKS.md HTML comment (fast path, ~2K tokens)
2. **Semantic search** for matching task:
   - Parse user message for keywords
   - Match against task titles and descriptions
   - Consider domain context (recent file changes, git history)
3. **If task FOUND:**
   - Note task ID for status updates
   - Proceed with implementation (guardrails.md Steps 1-14)
4. **If task NOT FOUND:**
   - Display task creation prompt with 3 options (see guardrails.md Step 0)
   - Wait for user decision before proceeding
   - Auto-fill domain, priority, effort (NO user questions)
   - Create task if user chooses option 1

**When to skip:**
- Exploratory work ("explain", "show me", "analyze")
- Explicit command calls (`/processes:claim`, `/processes:plan`)
- Questions without code changes

**Fallback:**
- If index missing or malformed, fall back to full TASKS.md read (15K tokens)
- If semantic search fails, show task creation prompt (safer to ask than assume)

---

## Before Starting ANY New Work Unit

Before writing code or making changes for a new task:

1. **Read TASKS.md** to verify the task exists
2. **Match your intended work** against active tasks:
   - Exact task ID match (e.g., `BE-3.1`, `FE-3.2`, `OB-10`)
   - Semantic match against task descriptions
   - Domain match (banking, invoicing, accounting, etc.)
3. **If task NOT found in TASKS.md:**
   - **STOP immediately** — do NOT proceed with code changes
   - Display clearly:

     ```
     UNPLANNED WORK DETECTED: [description of intended work]

     This task is not listed in TASKS.md. Options:
       1. Add it to TASKS.md now (quick ad-hoc addition)
       2. Run /processes:plan to create a proper implementation plan
       3. Confirm this is intentional ad-hoc work (bug fix, refactor, etc.)
     ```

   - Use `AskUserQuestion` to get user's decision before proceeding
4. **If task IS found:** Note the task ID for later status updates, proceed with work

## Status File Update Triggers

Update files at natural work boundaries — NOT after every edit.

### TASKS.md — Update when

- A TodoWrite task is marked `completed` that maps to a TASKS.md item
- A new sub-task is discovered during implementation
- A task is found to be blocked or needs rework

**How to update:**

```
Before: - [ ] **BE-3.1:** Chart of Accounts API (CRUD, hierarchy, default COA seeding)
After:  - [x] **BE-3.1:** Chart of Accounts API (commit abc1234)
```

- Check off completed items: `[ ]` → `[x]`
- Add commit hash in parentheses
- Update the Phase Progress table percentages
- Add newly discovered tasks to appropriate section

### STATUS.md — Update when

- A milestone is reached (all backend tasks for a phase done, etc.)
- Phase transitions (starting new phase, completing a phase)
- Metrics change significantly (new endpoints, tests, pages built)
- At end of session (via `/processes:eod`)

**How to update:**

- Current Phase section: update task status table
- Metrics table: update test counts, endpoint counts, page counts
- Move completed items from "In Progress" to "Completed Phases"
- Update the `Last Updated` date

### ROADMAP.md — Update when

- A phase status changes (e.g., "Not started" → "IN PROGRESS (30%)" or → "COMPLETE")
- Effort estimates are revised based on actual work
- New cross-cutting concerns are discovered

**How to update:**

- Progress Summary table: update Status column and Tests column
- Phase section: update percentage, mark completed items
- Timeline Summary: update status column

### docs/plans/*.md — Update when

- A task within the active plan is completed
- Update the plan's Progress/Checklist section

## Anti-Patterns (DO NOT)

- Do NOT update status files after every single Edit/Write — wait for task completion
- Do NOT skip status updates when completing tasks — the hooks will warn you
- Do NOT start Phase N+1 tasks while Phase N has incomplete items without explicit user approval
- Do NOT modify ROADMAP.md to add new phases without user approval
- Do NOT batch status updates — update immediately when a task completes
