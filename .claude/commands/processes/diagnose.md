---
name: processes:diagnose
description: Structured bug investigation -- diagnose before prescribing fixes
argument-hint: "[bug description, error message, or symptom]"
aliases:
  - diagnose
  - debug
  - investigate
keywords:
  - bug
  - error
  - broken
  - investigate
  - diagnose
  - debug
---

# Workflow: Diagnose

Structured investigation for bugs and unexpected behavior. NEVER jump to a fix.

**Pipeline:** Diagnose > (optional) Plan > Work > Review
**Time-box:** Investigation phase: 10 minutes max. If root cause unclear after 10 min, document findings and ask user.
**When to use:** Something is broken, behaving unexpectedly, or producing wrong results.

---

## Phase 1: Reproduce & Observe (2 minutes)

### Confirm the Symptom

Ask (or determine from context):
- What is the EXPECTED behavior?
- What is the ACTUAL behavior?
- When did it start? (check recent commits: `git log --oneline -10`)
- Is it consistent or intermittent?

### Check Prior Knowledge

```
Grep "[error message or keyword]" memory/
```

Search MEMORY topic files (debugging-log.md, codebase-quirks.md, api-patterns.md) for prior encounters.

If found, verify the prior solution applies. If it does, apply it and skip to Phase 6.

---

## Phase 2: Trace the Code Path (3 minutes)

### Identify Entry Point

Where does the failing request/interaction START?

- API error > find the route in `apps/api/src/domains/`
- UI error > find the page/component in `apps/web/src/`
- Data error > find the service that writes the data

### Trace Forward

Read each file in the chain:

```
[Route/Page] > [Schema/Validation] > [Service] > [Prisma query] > [Database]
```

For each file, note:
- What data flows IN?
- What transformations happen?
- What data flows OUT?
- Where could the symptom originate?

### Check Adjacent Domains

Consult the Domain Adjacency Map (in `product-thinking.md`):
- Does this code path cross domain boundaries?
- Could the bug originate in an adjacent domain?

---

## Phase 3: Identify Root Cause (2 minutes)

### Narrow Down

By now you should have 1-3 hypotheses. For each:

- **Hypothesis:** [what you think is wrong]
- **Evidence for:** [what supports this]
- **Evidence against:** [what contradicts this]
- **How to verify:** [specific check]

### Verify

Run the specific check for your top hypothesis:

```bash
# Example: Run specific test to isolate behavior
npx vitest run [relevant-test-file]
# Example: Check git blame for when logic changed
git log --oneline -10 -- [suspect-file]
```

---

## Phase 4: Assess Fix Options (2 minutes)

### Propose 1-2 Fixes

For each option:
- **What:** Description of the change
- **Where:** File(s) to modify
- **Risk:** What could break?
- **Scope:** Minimal (1 file) vs broader (multi-file)?

### Apply Review Lens

Before choosing a fix:
- [ ] Does this maintain tenant isolation?
- [ ] Does this preserve financial integrity (integer cents, double-entry)?
- [ ] Does this fix the ROOT CAUSE, not just the symptom?
- [ ] Are there tests covering this code path? Will they need updates?

### Run Relevant Review Agent (for High-Risk Fixes)

- Financial data affected > `financial-data-validator`
- Auth/permissions affected > `security-sentinel`
- Schema changes needed > `prisma-migration-reviewer`

---

## Phase 5: Present Findings

Before implementing, present to user:

```markdown
## Diagnosis

**Symptom:** [what was observed]
**Root Cause:** [why it happens]
**Affected Code:** [file:line references]
**Adjacent Impact:** [other domains/features affected, or "none"]

## Recommended Fix

**Approach:** [description]
**Files to Change:** [list]
**Risk:** [low/medium/high]
**Tests to Update:** [list or "none"]

## Prior Art
[Link to MEMORY entry if exists, or "none found"]
```

Then ask: "Proceed with this fix?" or "Need more investigation?"

---

## Phase 5.5: Register Fix Tasks in TASKS.md

**Protocol:** See `.claude/rules/task-population.md` for full approval gate rules.

After identifying the root cause and proposed fix:

1. If the fix is multi-step, break into individual tasks
2. If the fix reveals deeper issues, create follow-up tasks
3. Mark the immediate fix as Critical/High
4. **Present proposed tasks to user for approval** with Source (`diagnose:<bug-name>`) + Reason
5. Write ONLY approved tasks with `[needs: ID]` if fix depends on other work
6. Output: "Added fix tasks: [IDs]"

---

## Phase 6: Fix & Document

After user approves:

1. Implement the fix (follow `product-thinking.md` review lens)
2. Run tests: `npx vitest run [relevant tests]`
3. **Capture the learning** if non-trivial:
   - Note in session for `/processes:end-session` capture
   - EOD will route it to the appropriate MEMORY topic file

---

_~135 lines. Reproduce > Trace > Root Cause > Assess > Present > Fix > Document._