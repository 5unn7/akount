# Plan: Task Metadata System for AI-Safe Execution & External Consumption

## Context

TASKS.md has grown to 85 tasks from 7+ sources (review agents, plans, audits, manual, roadmap). Two problems:

1. **Hallucination risk** — Tasks written days ago describe code that may have changed. Claude agents picking up stale tasks will invent code for problems that no longer exist. Analysis shows ~30% of tasks are high-risk for this.

2. **External consumption** — Tasks need to be consumed by an external app. The current JSON index is embedded in an HTML comment inside TASKS.md — not suitable for external tools. Tasks also arrive from multiple sources and external apps need to contribute tasks too.

3. **Parallel agent safety** — Multiple Claude Code instances may pick up tasks concurrently. Without a claiming mechanism, two agents could work on the same task simultaneously, producing conflicting changes.

**Consumers:** Generic file-based interface (any app), a custom app being built, and parallel Claude agents needing task claiming.

**Goal:** Enhance the task system with (a) staleness detection, (b) hallucination risk scoring, (c) a standalone `tasks.json` for external apps, (d) an inbox/outbox pattern for bidirectional sync, and (e) a file-based task claiming/locking mechanism for parallel agents.

---

## What Changes

### 1. Standalone `tasks.json` (new file, auto-generated)

Generated alongside the existing HTML comment index. Root-level file consumed by external apps.

```
tasks.json              ← machine-readable, standalone
TASKS.md                ← human-readable, stays as-is
.claude/task-enrichments.json  ← manual overrides (optional sidecar)
.claude/task-inbox.json        ← external apps push tasks here
.claude/task-outbox.json       ← completion notifications for external apps
tasks.schema.json              ← JSON Schema for validation
```

### 2. Enhanced Task Schema (v2)

**Required fields** (auto-populated from TASKS.md + git blame):

| Field | Source | Example |
|-------|--------|---------|
| `id` | Parsed | `"SEC-8"` |
| `title` | Parsed | `"Complete security audit..."` |
| `effort` / `effortMinutes` | Parsed + computed | `"4h"` / `240` |
| `priority` | Parsed | `"high"` |
| `status` | Parsed | `"ready"` |
| `deps` | Parsed | `["TEST-1"]` |
| `domain` | Computed from prefix | `"security"` |
| `source` | Parsed (currently dropped!) | `"roadmap"` |
| `created` | Git blame | `"2026-02-17"` |
| `line` | Parsed | `26` |

**Computed fields** (auto-calculated, no manual input):

| Field | Algorithm |
|-------|-----------|
| `staleness.isStale` | `(today - max(created, lastVerified)) > staleAfterDays` |
| `staleness.daysSinceVerified` | Days since last verification |
| `staleness.staleAfterDays` | Default by effort: quick=14d, short=10d, medium=7d, long=5d |
| `hallucinationRisk` | `"low"` / `"medium"` / `"high"` — scored from factors below |
| `riskScore` | 0-10 integer |
| `riskFactors` | Array of reason strings |

**Optional enrichment fields** (from review cross-ref or manual sidecar):

| Field | Source | Purpose |
|-------|--------|---------|
| `files` | Review SUMMARY.md frontmatter or manual | Exact files affected |
| `verification` | Manual | How to confirm task still valid |
| `acceptanceCriteria` | Review `fix` field or manual | When is it done? |
| `lastVerified` | Agent sets after checking | Resets staleness clock |
| `sourceRef` | Auto from review path | Link to review SUMMARY.md |
| `externalId` | External app | ID in external system |
| `tags` | Auto-detected + manual | `["dashboard", "security"]` |
| `notes` | Manual | Free-form context |

### 3. Hallucination Risk Scoring

| Factor | Weight | Condition |
|--------|--------|-----------|
| `age_stale` | +3 | Past staleness threshold |
| `no_files` | +2 | No `files` array populated |
| `vague_title` | +2 | < 8 words AND no file path/function name in title |
| `large_effort` | +1 | Effort >= 3h |
| `no_acceptance_criteria` | +1 | Empty `acceptanceCriteria` |
| `source_unspecific` | +1 | Source is `manual` or `roadmap` (less precise than review agents) |

**Classification:** 0-2 = `low`, 3-5 = `medium`, 6+ = `high`

**Agent instructions baked into tasks.json:**
- `low` → Execute normally
- `medium` → "Verify the issue still exists before coding"
- `high` → "Read affected files, re-scope, possibly re-review before starting"

### 4. External Sync (inbox/outbox pattern)

**Inbound** — External app writes to `.claude/task-inbox.json`:
```json
{
  "tasks": [{
    "title": "Migrate auth to Passkeys",
    "effort": "4h",
    "priority": "medium",
    "domain": "security",
    "source": "external:project-board",
    "externalId": "PB-142",
    "files": ["apps/api/src/middleware/auth.ts"]
  }]
}
```

Processing: `/processes:begin` or manual script run reads inbox → deduplicates against TASKS.md → presents for user approval → assigns ID → appends to TASKS.md → clears inbox → regenerates `tasks.json`.

**Outbound** — When a task with `externalId` is completed, the script writes to `.claude/task-outbox.json`:
```json
{
  "updates": [{
    "taskId": "SEC-20",
    "externalId": "PB-142",
    "action": "completed",
    "completedAt": "2026-02-19",
    "completedCommit": "abc1234"
  }]
}
```

External app polls outbox, processes updates, clears file.

### 5. Task Claiming for Parallel Agents

**File:** `.claude/task-claims.json` (gitignored — local to each machine)

When a Claude agent starts work on a task, it writes a claim:

```json
{
  "claims": {
    "DS-3": {
      "agentId": "session-abc123",
      "claimedAt": "2026-02-19T17:30:00Z",
      "expiresAt": "2026-02-19T19:30:00Z",
      "pid": 12345
    }
  }
}
```

**Rules:**
- Claims expire after `2 * effortMinutes` (e.g., 2h task → 4h expiry). Prevents zombie locks.
- Before claiming, agent checks if task is already claimed AND the claiming process is still alive (check PID). Dead PID = stale claim = safe to take over.
- `tasks.json` includes a `claimed` boolean per task so external apps see what's in-flight.
- The existing "Active Now" table in TASKS.md continues to show human-readable claims.
- `/processes:begin` clears expired claims automatically.

**Why file-based:** No database or server needed. Works on any OS. Multiple Claude instances on the same machine share the file. Cross-machine claiming would need a shared filesystem or external store (future enhancement).

### 6. TASKS.md Format — No Column Changes

The markdown table keeps 7 columns (ID, Task, Effort, Priority, Status, Deps, Source). Only the summary header changes:

```markdown
> **85 tasks** · 🔴 0 critical · 🟠 23 high · ... · ✅ 27 done · ⚠️ 8 stale · 🎯 5 high-risk
```

All rich metadata lives in `tasks.json` and the optional sidecar files. TASKS.md stays clean and human-readable.

---

## Implementation Steps

### Step 1: Enhance `regenerate-task-index.js` (~200 new lines)

**File:** `.claude/scripts/regenerate-task-index.js`

Changes:
- **Fix source parsing** — Line 200 currently drops `source` when building task objects. Add it back.
- **Parse Done table** — Extract `completedAt` and `completedCommit` from the Done section rows
- **Git blame integration** — Run `git blame --line-porcelain TASKS.md`, parse `author-time` per line, cache in `.claude/.task-blame-cache.json` (only re-run when TASKS.md mtime changes)
- **Staleness computation** — Calculate `isStale`, `daysSinceVerified`, `staleAfterDays` per task
- **Risk scoring** — Implement the weighted algorithm above, compute `hallucinationRisk`, `riskScore`, `riskFactors`
- **Vagueness detection** — Check title word count, presence of file paths (`.ts`, `.tsx`, `/`), function names
- **Effort normalization** — Parse effort strings to `effortMinutes` integer (e.g., `"2h"` → `120`, `"30m"` → `30`, `"2-4h"` → `180`)
- **Review cross-reference** — For tasks with `source: "review:X"`, look up `docs/reviews/X/SUMMARY.md`, parse YAML frontmatter, extract `files` and `acceptanceCriteria` from matching `anti_patterns`
- **Sidecar merge** — Read `.claude/task-enrichments.json` if it exists, merge fields into matching tasks (manual overrides win)
- **Dual output** — Continue writing HTML comment index (v1 backward compat) AND write standalone `tasks.json` (v2)
- **Summary stats** — Add `staleCount` and `riskDistribution` to summary object

### Step 2: Create `tasks.schema.json` (~150 lines)

**File:** `tasks.schema.json` (project root)

Standard JSON Schema describing the v2 `tasks.json` format. External apps use this for validation. Defines required vs optional fields, enums, and the nested `staleness` object.

### Step 3: Create `.claude/task-enrichments.json` seed (~40 lines)

**File:** `.claude/task-enrichments.json`

Seed with enrichments for the ~5-8 highest-risk tasks identified after Step 1 runs. Example:

```json
{
  "SEC-8": {
    "files": ["apps/api/src/middleware/auth.ts", "apps/api/src/middleware/tenant.ts"],
    "verification": "Run: npx vitest run apps/api/src/__tests__/ && Grep console.log apps/api/src/",
    "acceptanceCriteria": ["OWASP Top 10 categories documented", "No P0 findings remain"],
    "staleAfterDays": 21
  }
}
```

### Step 4: Create task claiming mechanism (~80 lines)

**New file:** `.claude/scripts/task-claim.js`

A small Node.js script with functions: `claim(taskId, agentId)`, `release(taskId)`, `isAvailable(taskId)`, `cleanExpired()`. Reads/writes `.claude/task-claims.json`. Uses `effortMinutes` from `tasks.json` to compute expiry. Checks PID liveness on Windows (`tasklist /FI "PID eq X"`).

**Integration:** The regeneration script reads claims and adds `"claimed": true/false` + `"claimedBy"` to each task in `tasks.json`. The `/processes:claim` skill calls `claim()` before starting work.

Add `.claude/task-claims.json` to `.gitignore` (machine-local, not shared via git).

### Step 5: Create inbox/outbox infrastructure (~50 lines)

**Files:** `.claude/task-inbox.json`, `.claude/task-outbox.json` (empty initial), inbox processing logic added to the regeneration script as a `--process-inbox` flag.

### Step 6: Update hook for dual output (~5 lines)

**File:** `.claude/hooks/task-complete-sync.sh`

After the existing index regeneration call (line 95), the script already runs `regenerate-task-index.js` which will now output both formats. No hook logic change needed — just ensure `tasks.json` gets staged alongside TASKS.md if both are modified.

### Step 7: Update task-population.md (~15 lines)

**File:** `.claude/rules/task-population.md`

Add guidance: "When creating tasks from reviews, include `files` from the review's `anti_patterns[].files`. When creating manual tasks, include at least one affected file path in the task description or enrichments sidecar."

### Step 8: Update TASKS.md summary line (~1 line)

**File:** `TASKS.md` line 6

Add stale/risk counts to the existing summary header after first generation run.

---

## Key Design Decisions

1. **File-based sync, not API** — inbox/outbox JSON files are the simplest cross-platform interface. No server needed. External apps read/write files.

2. **TASKS.md stays clean** — No new columns. All enrichment lives in `tasks.json` and the sidecar file. This preserves readability for humans and Claude agents.

3. **Git blame for creation dates** — Avoids manual entry of 85 dates. Cached to avoid repeated blame runs on Windows (slow).

4. **Progressive metadata** — A task works with just the 7 markdown columns. Enrichment fields are optional and additive. You don't need to fill in 20 fields to create a simple task.

5. **Only 2 review SUMMARY.md files exist** — `dashboard-overview` and `phase5-reports`. The `smooth-floating-mountain` review (source of ~34 tasks) was processed in-session but not persisted as a SUMMARY.md. Cross-referencing will enrich ~18 tasks automatically; the rest need manual enrichment or the risk score handles the gap.

---

## Migration Path

| Phase | Work | Tasks Enriched | Manual Effort |
|-------|------|---------------|---------------|
| **Auto** | Run enhanced script (git blame + staleness + risk + review cross-ref) | All 85 get `created`, `staleness`, `riskScore`. ~18 get `files` from reviews. | Zero |
| **Targeted** | Create enrichments for 5-8 highest-risk tasks | 5-8 tasks get `files`, `verification`, `acceptanceCriteria` | ~30 min |
| **Ongoing** | New review-sourced tasks auto-enriched. Manual tasks encouraged to include files. | All new tasks | Minimal |

---

## Verification

1. Run `node .claude/scripts/regenerate-task-index.js` — should produce both TASKS.md index and `tasks.json`
2. Validate `tasks.json` against `tasks.schema.json` with `npx ajv validate -s tasks.schema.json -d tasks.json`
3. Verify every task has a `created` date (from git blame)
4. Verify staleness: tasks >7 days old with medium effort should show `isStale: true`
5. Verify risk scores: `SEC-8` (vague, large, no files) should be `high`; `DS-3` (specific, small, clear) should be `low`
6. Verify review cross-ref: tasks from `review:dashboard-overview` should have `files` populated from the SUMMARY.md frontmatter
7. Test inbox: create a `.claude/task-inbox.json` with a sample task, run `--process-inbox`, verify it appears in TASKS.md after approval

---

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| `.claude/scripts/regenerate-task-index.js` | **Enhance** | +200 |
| `.claude/scripts/task-claim.js` | **Create** | ~80 |
| `tasks.json` | **Create** (generated) | ~800 |
| `tasks.schema.json` | **Create** | ~150 |
| `.claude/task-enrichments.json` | **Create** | ~40 |
| `.claude/task-inbox.json` | **Create** (empty) | ~5 |
| `.claude/task-outbox.json` | **Create** (empty) | ~5 |
| `.claude/hooks/task-complete-sync.sh` | **Minor edit** | +5 |
| `.claude/rules/task-population.md` | **Minor edit** | +15 |
| `TASKS.md` | **Summary line update** | 1 line |
| `.gitignore` | **Add** `.claude/task-claims.json` | +1 |
