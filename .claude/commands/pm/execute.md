---
name: pm:execute
description: Execute a task using a specialized domain agent in an isolated worktree
argument-hint: "[task-id] or [agent-name task-id]"
---

# Workflow: Execute Task with Agent

Spawn a specialized execution agent to complete a task in an isolated Git worktree. The agent works independently, then results are validated through security/compliance gates before merging.

**Pipeline:** Claim > **Execute** > Review
**Prerequisites:** Task must exist in TASKS.md. Agent definition must exist in `.claude/agents/`.
**When to use:** For tasks that map to a single domain agent. For multi-task parallel execution, use `/pm:execute-parallel`.

---

## Phase 0: Parse Arguments

**If no arguments provided:**
```
Usage: /pm:execute <task-id>
       /pm:execute <agent-name> <task-id>

Examples:
  /pm:execute DEV-15           # Auto-detect agent from task context
  /pm:execute banking-agent DEV-15  # Explicit agent assignment

Available agents:
  banking-agent     — Banking (accounts, transactions, transfers, reconciliation)
  ui-agent          — Frontend/UI (design system, components, pages)
  security-agent    — Security enforcement (tenant isolation, auth, OWASP)
  compliance-agent  — Financial compliance (audit trails, double-entry, retention)
```

**Parse the argument string:**
- Split on whitespace
- If 1 token: `TASK_ID = token[0]`, `AGENT_NAME = auto-detect` (see Phase 2)
- If 2 tokens: `AGENT_NAME = token[0]`, `TASK_ID = token[1]`
- Validate TASK_ID matches pattern: `[A-Z]+-\d+` (e.g., DEV-15, SEC-8, UX-19)

---

## Phase 1: Task Lookup

### Fast-path: Read TASKS.md Index

```bash
# Extract JSON index from HTML comment (same pattern as processes:claim)
grep -Pzo '(?s)<!-- TASK-INDEX:START.*?TASK-INDEX:END -->' TASKS.md
```

Parse the JSON index to find the task. Extract:
- `title` — Task title
- `status` — Must be `ready` or `in_progress` (reject `done`, `blocked`)
- `priority` — For reporting
- `effort` — For timeout estimation
- `domain` — For agent selection

**If index missing or task not found:** Fall back to full TASKS.md read with `Grep "$TASK_ID" TASKS.md`.

### Load Enrichments

```
Read .claude/task-enrichments.json
```

Find the entry for `TASK_ID`. Extract:
- `files` — Array of file paths this task will touch
- `verification` — Commands to verify task completion
- `acceptanceCriteria` — Array of criteria that must be met
- `tags` — Domain tags (e.g., `["banking", "transfers"]`)

**If no enrichment exists:** Warn user that task has no file hints (higher hallucination risk). Continue anyway.

---

## Phase 2: Agent Selection

**Priority order for selecting the right agent:**

### 1. Explicit Argument (highest priority)
If user provided `AGENT_NAME`, verify it exists:
```
Glob .claude/agents/$AGENT_NAME.md
```
If found, use it. If not found, error with available agent list.

### 2. Enrichment Tags
If enrichment has `tags` array, map to agent:

| Tag | Agent |
|-----|-------|
| `banking`, `accounts`, `transactions`, `transfers`, `reconciliation` | `banking-agent` |
| `ui`, `frontend`, `design-system`, `components`, `pages`, `accessibility` | `ui-agent` |
| `security`, `auth`, `tenant-isolation`, `owasp`, `rbac` | `security-agent` |
| `compliance`, `audit`, `sox`, `gaap`, `retention` | `compliance-agent` |

### 3. Task ID Prefix Heuristic
| Prefix | Default Agent | Notes |
|--------|--------------|-------|
| `SEC-` | `security-agent` | |
| `UX-`, `DS-` | `ui-agent` | |
| `DRY-` | `ui-agent` | Component extraction is usually UI work |
| `FIN-` | `compliance-agent` | Financial integrity tasks |
| `PERF-` | `ui-agent` or `banking-agent` | Check files to disambiguate |
| `DEV-` | Check enrichment `files` | If `apps/api/src/domains/banking/` → banking-agent, etc. |
| `ARCH-` | `compliance-agent` | Architecture tasks often touch audit/compliance |
| `TEST-` | Agent matching the domain under test | |

### 4. File Path Heuristic (for DEV-* and ambiguous tasks)
If enrichment `files` exist, check paths:
- `apps/api/src/domains/banking/` or `apps/web/src/app/(dashboard)/banking/` → `banking-agent`
- `apps/web/src/`, `packages/ui/` → `ui-agent`
- `apps/api/src/middleware/`, `*auth*`, `*security*` → `security-agent`
- `apps/api/src/domains/accounting/`, `*journal*`, `*audit*` → `compliance-agent`

### 5. Ask User (last resort)
If no match found, use AskUserQuestion:
```
Which agent should handle $TASK_ID ($TITLE)?

1. banking-agent — Banking domain
2. ui-agent — Frontend/UI
3. security-agent — Security enforcement
4. compliance-agent — Financial compliance
```

**Display selection result:**
```
Task: $TASK_ID — $TITLE
Agent: $AGENT_NAME
Files: [list from enrichments]
```

---

## Phase 3: Worktree Setup

Create an isolated worktree for the agent to work in:

```bash
bash .claude/scripts/worktree-create.sh $AGENT_NAME $TASK_ID
```

**If worktree already exists** (script exits with error):
Use AskUserQuestion:
```
Worktree already exists for $AGENT_NAME/$TASK_ID.

1. Clean up and recreate (discard previous work)
2. Resume in existing worktree
3. Cancel
```

If option 1: Run cleanup first, then create again:
```bash
bash .claude/scripts/worktree-cleanup.sh $AGENT_NAME $TASK_ID
bash .claude/scripts/worktree-create.sh $AGENT_NAME $TASK_ID
```

Capture the worktree path (printed by the script as the last line).

---

## Phase 4: Compose Agent Prompt

Build the agent's complete execution prompt by reading and assembling context.

### 4a. Read Agent Definition
```
Read .claude/agents/$AGENT_NAME.md
```
This contains: Purpose, Industry Standards, Execution Workflow, Domain Patterns, Common Pitfalls.

### 4b. Assemble Core Invariants
Do NOT read the full CLAUDE.md (too large for a subagent). Instead, inline the 9 key invariants:

```
## Core Invariants (Zero Exceptions)
1. Tenant Isolation: Every query MUST filter by tenantId
2. Money Precision: All amounts are integer cents (1050 = $10.50). Never floats.
3. Double-Entry: SUM(debitAmount) === SUM(creditAmount) always
4. Soft Delete: Financial records use deletedAt. Never hard delete.
5. Source Preservation: Journal entries store sourceType, sourceId, sourceDocument
6. Page Loading States: Every page.tsx needs loading.tsx + error.tsx
7. Server/Client Separation: Never mix 'use client' with server-only imports
8. Sequential JE numbering: Use generateEntryNumber() utility, never inline
9. Structured logging: Use request.log / server.log (pino), never console.log
```

### 4c. Build Task Context
```markdown
## Your Task: $TASK_ID

**Title:** $TITLE
**Priority:** $PRIORITY
**Status:** $STATUS → in_progress

**Acceptance Criteria:**
$ACCEPTANCE_CRITERIA (from enrichments, one per line with checkboxes)

**Files to Modify:**
$FILES (from enrichments, one per line)

**Verification Commands:**
$VERIFICATION (from enrichments)
```

### 4d. Compose Final Prompt

Assemble the full prompt as a single string:

```markdown
# You are $AGENT_NAME

You are a specialized execution agent working on task $TASK_ID in an isolated Git worktree.

## Your Agent Definition
$AGENT_DEFINITION_CONTENT

## Core Invariants
$INVARIANTS_BLOCK

## Task Assignment
$TASK_CONTEXT_BLOCK

## Working Directory
You are working in: $WORKTREE_PATH
Your branch: $AGENT_NAME/$TASK_ID
Base branch: main

## Execution Instructions

1. **Read before editing.** Always Read files before modifying them. Search for existing patterns with Grep.
2. **Follow your agent definition.** Use the patterns, anti-patterns, and workflow described in your definition.
3. **Stay in scope.** Only modify files listed in "Files to Modify". If you discover you need to touch other files, note them but don't modify without explicit need.
4. **Test your work.** Run the verification commands listed above.
5. **Commit when done.** Stage specific files and commit with message:
   `feat($DOMAIN): $TITLE [$TASK_ID]`
6. **Report completion.** End your response with a summary:
   - Files changed (with line counts)
   - Tests run and results
   - Any issues or warnings
   - Whether acceptance criteria are met
```

---

## Phase 5: Spawn Agent

Launch the agent using the Task tool:

```
Task tool:
  description: "Execute $TASK_ID with $AGENT_NAME"
  subagent_type: general-purpose
  prompt: $COMPOSED_PROMPT
  run_in_background: false
```

**Wait for agent to complete.** The Task tool returns the agent's final response.

Read the agent's response. Check for:
- Completion indicators (files changed, tests passed)
- Error indicators (compilation failures, test failures)
- Warnings (partial completion, out-of-scope changes needed)

**If agent reports failure:** Skip to Phase 7 (report failure, keep worktree for debugging).

---

## Phase 6: Gate Validation

### 6a. Security Gate (ALL tasks)

Spawn security-sentinel to review the agent's changes:

```bash
# Get the diff to review
cd $WORKTREE_PATH && git diff main..HEAD
```

```
Task tool:
  description: "Security gate for $TASK_ID"
  subagent_type: security-sentinel
  prompt: |
    Review these code changes for security compliance.

    Task: $TASK_ID — $TITLE
    Agent: $AGENT_NAME

    Changed files:
    $CHANGED_FILES_LIST

    [Include relevant diffs or file contents]

    Check for:
    - Tenant isolation (every query filters by tenantId)
    - Input validation (Zod schemas on all endpoints)
    - No hardcoded secrets
    - CORS not set to origin: true
    - No PII in logs
    - FK references validate ownership (IDOR prevention)

    Respond with:
    - PASS: No security issues found (list any minor warnings)
    - BLOCK: Critical security issue (describe issue and required fix)
```

### 6b. Compliance Gate (financial tasks only)

Run ONLY if task involves financial logic. Detect by checking:
- Task prefix: `FIN-*`, `ARCH-*`
- Tags: `banking`, `accounting`, `invoicing`, `compliance`, `audit`
- Files: paths containing `accounting/`, `banking/`, `invoicing/`, `journal`, `payment`, `invoice`, `bill`

If financial:

```
Task tool:
  description: "Compliance gate for $TASK_ID"
  subagent_type: financial-data-validator
  prompt: |
    Review these code changes for financial compliance.

    Task: $TASK_ID — $TITLE

    [Include relevant diffs or file contents]

    Check for:
    - Integer cents for all monetary amounts (no floats)
    - Double-entry balance (SUM debits === SUM credits)
    - Soft delete on financial records (never hard delete)
    - Source document preservation on journal entries
    - Audit log entries for all financial mutations
    - Exchange rates immutable after posting

    Respond with:
    - PASS: Financial compliance verified (list any warnings)
    - BLOCK: Compliance violation (describe issue and required fix)
```

### Gate Results

**If both gates PASS:**
```
Gates passed:
  Security: PASS
  Compliance: PASS (or N/A if not financial)
Proceeding to merge...
```

**If any gate BLOCKS:**
```
GATE BLOCKED — $TASK_ID cannot be merged.

Security gate: $RESULT
Compliance gate: $RESULT

Issues to fix:
$GATE_ISSUES

The worktree is preserved at: $WORKTREE_PATH
Fix the issues and re-run: /pm:execute $AGENT_NAME $TASK_ID
```
Stop here. Do NOT merge. Keep worktree for the user to fix.

---

## Phase 7: Merge & Report

### 7a. Merge Worktree
```bash
bash .claude/scripts/worktree-cleanup.sh $AGENT_NAME $TASK_ID
```

### 7b. Run Tests

Determine which test suites to run based on changed files:

- If `apps/api/` changed: `cd apps/api && npx vitest run --reporter=verbose`
- If `apps/web/` changed: `cd apps/web && npx tsc --noEmit`
- If `packages/db/` changed: `cd apps/api && npx vitest run --reporter=verbose`

**If tests fail:**
```
Tests failed after merge. Reverting...
```
Warn the user (do NOT auto-revert without confirmation — this is a destructive action). Use AskUserQuestion:
```
Tests failed after merging $TASK_ID. Options:
1. Revert merge (git reset --hard HEAD~1)
2. Keep merge, fix tests manually
3. Keep merge, investigate failures
```

### 7c. Update TASKS.md

If merge and tests succeeded:
- Find the task line in TASKS.md
- Change `[ ]` to `[x]`
- Add commit hash

### 7d. Report

```
Execution Complete
━━━━━━━━━━━━━━━━━
Task: $TASK_ID — $TITLE
Agent: $AGENT_NAME
Status: SUCCESS

Files changed: $FILE_COUNT
Tests: $TEST_RESULT
Security gate: PASS
Compliance gate: $COMPLIANCE_RESULT

Commit: $COMMIT_HASH
```

---

## Error Handling

### Agent Timeout
If the Task tool takes unusually long (>15 minutes for a single task), the user can interrupt. The worktree preserves partial work.

### Agent Failure
If the agent reports it cannot complete the task:
```
Agent $AGENT_NAME could not complete $TASK_ID.
Reason: $AGENT_ERROR

Worktree preserved at: $WORKTREE_PATH
You can investigate with: cd $WORKTREE_PATH && git log
```

### Worktree Script Failure
If worktree-create.sh or worktree-cleanup.sh fails:
```bash
# Check git worktree state
git worktree list
```
Report the error and suggest manual cleanup.
