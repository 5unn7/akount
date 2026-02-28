# Scripts Directory

**Organized:** 2026-02-28
**Total scripts:** 45 (after Linear deletion)

---

## Node.js Scripts

### Index Builders (`node/index-builders/`) — 6 scripts

Build and maintain code indexes for fast discovery:

- **`regenerate-code-index.js`** — Generate CODEBASE-*.md domain indexes (exports, imports, patterns, violations)
- **`load-code-index.js`** — Multi-domain loader (path/keyword/adjacency-based)
- **`check-index-freshness.js`** — Detect stale indexes (>1 hour old)
- **`regenerate-decision-index.js`** — Index architectural decisions from `.claude/decisions/`
- **`regenerate-task-index.js`** — Generate TASKS.md embedded index + tasks.json
- **`build-export-cache.js`** — Cache package exports for faster import verification

### Task Utilities (`node/task-utils/`) — 9 scripts

Atomic task ID reservation, enrichment, and lifecycle management:

- **`reserve-task-ids.js`** — Atomic task ID reservation (prevents collisions across agents)
- **`init-task-counters.js`** — Initialize ID counters from TASKS.md
- **`archive-done-tasks.js`** — Move completed tasks to TASKS-ARCHIVE.md
- **`count-tasks.js`** — Count tasks by domain/status/priority
- **`reorganize-tasks.js`** — Reorganize TASKS.md tables
- **`enrich-task.js`** — Auto-populate task metadata (files, verification, acceptance)
- **`score-task-risk.js`** — Hallucination risk scoring (0-100)
- **`task-claim.js`** — Multi-agent coordination (claim/release tasks)
- **`split-task-enrichments.js`** — Split enrichments into domain files (one-time migration)

### Analysis Tools (`node/analysis/`) — 5 scripts

Code quality analysis and pattern extraction:

- **`detect-violations.js`** — Scan for rule violations (hardcoded colors, console.log, `: any`)
- **`verify-import.js`** — Verify imports exist before claiming in code
- **`extract-review-learnings.js`** — Extract patterns from review findings
- **`extract-session-patterns.js`** — Mine session transcripts for reusable patterns
- **`session-diff.js`** — Diff two session captures

### Metrics & Cost Tracking (`node/metrics/`) — 3 scripts

Session cost tracking and dashboard:

- **`track-session-cost.js`** — Log tool calls and token usage
- **`runtime-summary.js`** — Summarize session metrics
- **`cost-dashboard.sh`** — Display cost summary (used by `/processes:begin`)

### Miscellaneous (`node/misc/`) — 5 scripts

Integration utilities:

- **`route-to-memory.js`** — Route learnings to appropriate MEMORY topic file
- **`add-production-signal.js`** — Log production signals (errors, performance)
- **`read-production-signals.js`** — Read and analyze production signals
- **`export-tasks-csv.ts`** — Export TASKS.md to CSV
- **`tasks-to-github-issues.ts`** — Sync tasks to GitHub Issues

---

## Shell Scripts

### Git Tools (`shell/git/`) — 3 scripts

Worktree management for parallel agent execution:

- **`worktree-create.sh`** — Create isolated worktree for task
- **`worktree-cleanup.sh`** — Remove worktrees after task completion
- **`worktree-status.sh`** — Show active worktrees

### Dev Tools (`shell/dev/`) — 3 scripts

Development environment utilities:

- **`prisma-migrate.sh`** — Wrapper for Prisma migrations (agent-safe)
- **`test-env.js`** — Verify test environment setup
- **`diagnose-env.js`** — Debug environment issues

### Utilities (`shell/utils/`) — 3 scripts

General shell utilities:

- **`check-context-freshness.js`** — Warn if context files are stale
- **`log-tool-call.sh`** — Log tool calls for debugging
- **`update-metrics.sh`** — Update STATUS.md metrics

---

## Helper Modules

### `lib/` — Shared modules

- **`load-enrichments.js`** — Load task enrichments from domain-based structure

---

## Archived Scripts

### `archived/spike-code-index/` — 6 files

Prototype code index variants (use `regenerate-code-index.js` instead):

- spike-code-index.js, spike-code-index-readable.js, spike-code-index-compressed.js
- *.json outputs

---

## Quick Reference

| Need | Run |
|------|-----|
| Reserve task IDs | `node node/task-utils/reserve-task-ids.js SEC 3` |
| Rebuild code index | `node node/index-builders/regenerate-code-index.js --domains "banking"` |
| Check index freshness | `node node/index-builders/check-index-freshness.js` |
| Enrich task | `node node/task-utils/enrich-task.js DEV-121` |
| Score task risk | `node node/task-utils/score-task-risk.js SEC-9` |
| Archive done tasks | `node node/task-utils/archive-done-tasks.js` |
| Create worktree | `./shell/git/worktree-create.sh feature-branch` |
| Cost dashboard | `./node/metrics/cost-dashboard.sh` |

---

**Reorganized:** 2026-02-28 (Phase 2.2 complete)
