# Feedback Loops & Code Indexing V2

**Created:** 2026-02-27
**Status:** Draft
**Prerequisite:** `docs/plans/2026-02-27-code-indexing-upgrade.md` (Sprints 1-5 complete)
**Architecture Ref:** `docs/plans/2026-02-27-code-indexing-upgrade-ARCH.md`

---

## Overview

Close the 4 critical feedback loops that prevent Claude Code from learning, observing, and improving across sessions. Additionally, upgrade the existing code indexing system (V1 complete) with caller graphs, test coverage maps, legend deduplication, and WEB-COMPONENTS splitting to reduce token waste and eliminate trace-impact Greps.

**Why this matters:** The current architecture is stateless — every session starts from zero runtime knowledge, loses session learnings, has no record of WHY decisions were made, and gets no signals from production. These 4 loops transform Claude from a "smart tool" into an "improving system."

## Success Criteria

- [ ] Runtime signals (slow queries, errors, request latency) written to `.claude/runtime/` and readable at session start
- [ ] End-session auto-captures patterns from git diff + error logs without manual input
- [ ] Decision journal entries link to affected files and appear in code index lookups
- [ ] Production error signals available in `.claude/production/` at session start
- [ ] Code index legend deduplicated (save ~1,500 tokens per multi-domain load)
- [ ] WEB-COMPONENTS split into 2-3 sub-indexes (each <8K tokens vs current 16.9K)
- [ ] Caller graph ("who calls this export?") eliminates reverse-dependency Greps
- [ ] Test coverage map shows which files have tests and test counts
- [ ] Changed-since-last-session diff available at session start

---

## Part A: Feedback Loops (Priority 1)

### Sprint A1: Runtime Bridge (Code → Runtime → Claude)

**Goal:** Lightweight dev-server companion that captures runtime state to files Claude can read.

#### Task A1.1: Request Timing Middleware
**File:** `apps/api/src/middleware/request-timing.ts` (NEW)
**What:** Fastify `onRequest`/`onResponse` hooks that measure request latency, log slow requests (>500ms), and write summaries to `.claude/runtime/request-log.json`.

**Implementation:**
```typescript
// onRequest: stamp request.startTime = process.hrtime.bigint()
// onResponse: calculate duration, if > threshold, append to runtime log
// Rotate: keep last 100 entries, truncate on startup
```

**Key details:**
- Threshold: 500ms for slow request warning, 2000ms for critical
- Output file: `.claude/runtime/request-log.json` (gitignored)
- Format: `{ timestamp, method, url, statusCode, durationMs, slow: boolean }`
- Only active when `NODE_ENV === 'development'` (zero production overhead)
- Register in `apps/api/src/index.ts` after auth middleware

**Depends on:** none
**Risk:** low
**Success:** Slow API requests appear in `.claude/runtime/request-log.json` during local dev

---

#### Task A1.2: Prisma Query Observer
**File:** `apps/api/src/lib/prisma-observer.ts` (NEW)
**What:** Hook into Prisma `$on('query')` events to detect slow queries (>100ms) and N+1 patterns. Write to `.claude/runtime/query-log.json`.

**Implementation:**
```typescript
// prisma.$on('query', (e) => { if (e.duration > 100) appendToLog(e) })
// Track query counts per request (detect N+1: same query >5 times in one request)
// Rotate: keep last 50 slow queries
```

**Key details:**
- Requires Prisma Client extension or `$on('query')` event (check Prisma version supports it)
- Output: `{ timestamp, query, params, duration, model, operation }`
- N+1 detection: track query fingerprints per request, flag if same fingerprint >5x
- Only active when `PRISMA_QUERY_LOG=true` env var set (opt-in, not default)

**Depends on:** none
**Risk:** medium (Prisma event API compatibility)
**Review:** `performance-oracle`
**Success:** Slow queries and N+1 patterns logged to `.claude/runtime/query-log.json`

---

#### Task A1.3: Runtime Error Collector
**File:** `apps/api/src/middleware/error-collector.ts` (NEW)
**What:** Enhance existing `errorHandler.ts` to also write unhandled/500 errors to `.claude/runtime/error-log.json` with stack traces and request context.

**Implementation:**
```typescript
// Wrap existing errorHandler to ALSO append to file
// Include: timestamp, error.message, error.stack, request.url, request.method, tenantId
// Dedup: same error.message within 5 min = increment count, don't duplicate
// Rotate: keep last 50 errors
```

**Key details:**
- Does NOT replace existing error handler — wraps it
- Deduplication prevents log flooding from repeated errors
- Stack traces truncated to 10 lines for readability
- Only in development mode

**Depends on:** none
**Risk:** low
**Success:** API errors during dev appear in `.claude/runtime/error-log.json`

---

#### Task A1.4: Runtime Summary Script
**File:** `.claude/scripts/runtime-summary.js` (NEW)
**What:** Script that reads all runtime log files and produces a human-readable summary for `/processes:begin` to display at session start.

**Output format:**
```markdown
## Runtime Signals (since last session)
- **Slow requests:** 3 endpoints >500ms (GET /api/accounting/reports/trial-balance: 1,234ms)
- **Slow queries:** 2 queries >100ms (JournalLine.findMany with 50K rows)
- **N+1 detected:** Transaction.findMany called 12x in GET /api/banking/transactions
- **Errors:** 1 unhandled (TypeError in categorization.service.ts:142)
```

**Depends on:** Tasks A1.1, A1.2, A1.3
**Success:** `/processes:begin` shows runtime signals from last dev session

---

### Sprint A2: Auto-Capture Learning (Session → Learning → Next Session)

**Goal:** Automated pattern/learning capture at end of session, replacing manual "Patterns Discovered" entry.

#### Task A2.1: Git Diff Pattern Extractor
**File:** `.claude/scripts/extract-session-patterns.js` (NEW)
**What:** Script that analyzes git diff from the session to auto-detect patterns worth capturing.

**Detection rules:**
1. **New utility created** — detects new exports in `lib/utils/`, `domains/*/utils/`
2. **New shared component** — detects new files in `packages/ui/src/`
3. **Bug fix pattern** — detects changes to error handling, null checks, type guards
4. **Cross-domain change** — detects commits touching 2+ domain folders
5. **Schema change** — detects `schema.prisma` modifications
6. **New test patterns** — detects new test files or significant test additions

**Output:** `.claude/session-patterns.json` (consumed by end-session)
```json
{
  "patterns": [
    {
      "type": "cross-domain",
      "description": "Invoice void requires reversing JE in accounting domain",
      "files": ["invoicing/services/invoice.service.ts", "accounting/services/journal-entry.service.ts"],
      "confidence": "high"
    }
  ],
  "newExports": ["voidInvoice", "createReversingEntry"],
  "schemaChanges": ["Added InvoiceStatus.VOIDED enum value"]
}
```

**Depends on:** none
**Success:** Script produces accurate pattern extraction from git diff

---

#### Task A2.2: Enhance End-Session with Auto-Capture
**File:** `.claude/commands/processes/end-session.md` (UPDATE)
**What:** Add a new Step 1c that runs `extract-session-patterns.js` and auto-populates the "Patterns Discovered" and "Bugs Fixed" sections of the session file.

**Changes:**
- Add Step 1c after Step 1b (archive + refresh)
- Run `node .claude/scripts/extract-session-patterns.js`
- Read output and pre-fill session summary sections
- Agent reviews auto-filled content (can edit/remove false positives)
- Merge auto-captured patterns with manually noted ones

**Template addition:**
```markdown
### Step 1c: Auto-Extract Patterns (15 seconds)
```bash
node .claude/scripts/extract-session-patterns.js
```
Review output and merge into session summary below.
```

**Depends on:** Task A2.1
**Success:** End-session auto-populates patterns without manual entry

---

#### Task A2.3: Auto-Route to MEMORY Topic Files
**File:** `.claude/scripts/route-to-memory.js` (NEW)
**What:** After session capture, automatically route patterns to the correct MEMORY topic file based on type.

**Routing rules:**
| Pattern Type | Target File | Section |
|-------------|-------------|---------|
| Bug fix | `debugging-log.md` | New entry with date |
| API pattern | `api-patterns.md` | Append to relevant section |
| Frontend gotcha | `codebase-quirks.md` | Append |
| Cross-domain interaction | `api-patterns.md` | Cross-domain section |
| Performance finding | `debugging-log.md` | Performance section |

**Key details:**
- Append-only (never overwrites existing content)
- Dedup: check if similar pattern already exists (fuzzy match on description)
- Format: `- **[DATE]** [description] — [files affected]`

**Depends on:** Task A2.1
**Success:** New patterns auto-appear in correct MEMORY topic file

---

### Sprint A3: Decision Journal (Decision → Code → Future Agent)

**Goal:** Structured decision capture linked to affected files, so future agents understand WHY code looks the way it does.

#### Task A3.1: Decision Journal Format & Storage
**File:** `.claude/decisions/` (NEW directory)
**What:** Define the decision journal format and create the storage structure.

**Decision format:** `.claude/decisions/YYYY-MM-DD-short-description.md`
```markdown
# Decision: [Title]

**Date:** YYYY-MM-DD
**Context:** [What prompted this decision]
**Decision:** [What was decided]
**Alternatives Considered:**
- [Alternative 1] — rejected because [reason]
- [Alternative 2] — rejected because [reason]
**Consequences:**
- [Positive consequence]
- [Trade-off accepted]
**Files Affected:**
- `path/to/file.ts` — [how this file was impacted]
**Tags:** [architecture, financial, security, performance, ux]
```

**Index file:** `.claude/decisions/INDEX.md` (auto-generated summary of all decisions)

**Depends on:** none
**Success:** Decision directory exists with format template and index

---

#### Task A3.2: Decision Capture Integration
**File:** `.claude/commands/processes/work.md` (UPDATE)
**File:** `.claude/commands/processes/plan.md` (UPDATE)
**What:** Add decision capture prompts at key decision points in workflows.

**When to capture (automatic triggers):**
1. Agent chooses between 2+ implementation approaches
2. Agent explicitly rejects a pattern (e.g., "I chose X over Y because...")
3. Schema design decisions (new models, field types, relations)
4. Architecture decisions (new service vs extending existing)

**Integration:**
- `/processes:plan` Phase 2 → capture "Alternatives Considered" in plan
- `/processes:work` → if agent makes a non-trivial choice, prompt to capture decision
- Captured decisions auto-linked to affected files

**Depends on:** Task A3.1
**Success:** Decisions captured during plan/work workflows

---

#### Task A3.3: Decision Index Generator
**File:** `.claude/scripts/regenerate-decision-index.js` (NEW)
**What:** Script that scans `.claude/decisions/` and generates INDEX.md with searchable entries.

**Index format:**
```markdown
## Decision Index (auto-generated)

| Date | Decision | Tags | Files |
|------|----------|------|-------|
| 2026-02-21 | Integer cents for money | financial | schema.prisma, currency.ts |
| 2026-02-23 | Conservation of value for transfers | financial, architecture | transfer.service.ts |
```

**Also:** Add `decisions` field to code index entries (Task B3 integration):
```json
{
  "transfer.service": {
    "decisions": ["2026-02-23-conservation-of-value"]
  }
}
```

**Depends on:** Task A3.1
**Success:** Decision index auto-generated, searchable by tag/file

---

### Sprint A4: Production Signals (Production → Signals → Development)

**Goal:** Production error/signal pipeline to `.claude/` so session start shows what's broken in production.

#### Task A4.1: Production Signal Schema
**File:** `.claude/production/signals.json` (NEW)
**File:** `.claude/production/README.md` (NEW)
**What:** Define the schema for production signals and create manual/automated ingestion points.

**Signal schema:**
```json
{
  "signals": [
    {
      "id": "sig-001",
      "timestamp": "2026-02-27T15:00:00Z",
      "type": "error",
      "severity": "high",
      "source": "sentry",
      "message": "TypeError: Cannot read property 'amount' of undefined",
      "file": "apps/api/src/domains/invoicing/services/invoice.service.ts",
      "line": 142,
      "frequency": 23,
      "firstSeen": "2026-02-27T14:00:00Z",
      "lastSeen": "2026-02-27T15:00:00Z",
      "resolved": false
    }
  ],
  "lastSync": "2026-02-27T15:30:00Z"
}
```

**Signal types:** `error`, `performance`, `security`, `deprecation`, `usage`
**Sources:** `sentry`, `vercel`, `manual`, `monitoring`

**Depends on:** none
**Success:** Schema defined, README documents how to populate signals

---

#### Task A4.2: Production Signal Reader for Begin
**File:** `.claude/scripts/read-production-signals.js` (NEW)
**File:** `.claude/commands/processes/begin.md` (UPDATE)
**What:** Script that reads production signals and formats them for session start display.

**Output format:**
```markdown
## Production Signals
- **[HIGH]** TypeError in invoice.service.ts:142 — 23 occurrences (last 2h)
- **[MEDIUM]** Slow query: JournalLine.findMany averaging 800ms (Vercel logs)
- **[LOW]** Deprecation: xlsx package EOL, migrate to exceljs (already done ✅)
```

**Integration with begin.md:**
- Add production signals section after git status check
- Only show unresolved signals
- Link to affected files (clickable paths)

**Depends on:** Task A4.1
**Success:** `/processes:begin` shows unresolved production signals

---

#### Task A4.3: Manual Signal Ingestion Script
**File:** `.claude/scripts/add-production-signal.js` (NEW)
**What:** CLI tool for manually adding production signals (for teams without Sentry integration).

**Usage:**
```bash
node .claude/scripts/add-production-signal.js \
  --type error \
  --severity high \
  --message "TypeError in invoice.service.ts:142" \
  --file "apps/api/src/domains/invoicing/services/invoice.service.ts" \
  --line 142
```

**Also supports:** `--resolve sig-001` to mark a signal as resolved.

**Depends on:** Task A4.1
**Success:** Manual signal addition and resolution works

---

## Part B: Code Indexing V2 (Priority 2)

### Sprint B1: Legend Deduplication & Token Optimization

#### Task B1.1: Extract Shared Legend
**File:** `.claude/scripts/regenerate-code-index.js` (UPDATE)
**File:** `.claude/code-index-legend.md` (NEW)
**What:** Move the decode legend (currently repeated in all 8 CODEBASE-*.md files, ~36 lines each = 288 lines total, ~1,500 tokens wasted per multi-domain load) to a single shared file.

**Changes:**
1. Create `.claude/code-index-legend.md` with the legend once
2. Remove legend from all 8 CODEBASE-*.md files
3. Update `regenerate-code-index.js` to not emit legend per file
4. Update `load-code-index.js` to load legend once on first call
5. Add legend reference comment in each CODEBASE file: `<!-- Legend: .claude/code-index-legend.md -->`

**Token savings:** ~1,500 tokens per multi-domain load (288 lines × ~5.2 tokens/line)

**Depends on:** none
**Success:** Legend exists in one place, all indexes reference it, multi-domain loads save ~1,500 tokens

---

### Sprint B2: Split WEB-COMPONENTS

#### Task B2.1: Split WEB-COMPONENTS Index
**File:** `.claude/scripts/regenerate-code-index.js` (UPDATE)
**File:** `CODEBASE-WEB-BUSINESS.md` (NEW)
**File:** `CODEBASE-WEB-SHARED.md` (NEW)
**File:** `CODEBASE-WEB-FORMS.md` (NEW)
**What:** Split the WEB-COMPONENTS index (180 files, 16.9K tokens — nearly half the total token budget) into 3 focused sub-indexes.

**Split strategy:**
| Sub-index | Pattern | Est. Files | Est. Tokens |
|-----------|---------|-----------|-------------|
| WEB-BUSINESS | `components/business/`, domain-specific components | ~60 | ~5,600 |
| WEB-SHARED | `components/ui/`, `components/shared/`, layout components | ~70 | ~6,500 |
| WEB-FORMS | `components/forms/`, form-related components, validation | ~50 | ~4,700 |

**Changes:**
1. Add 3 new domain definitions to `regenerate-code-index.js`
2. Remove `web-components` domain definition
3. Update `load-code-index.js` DOMAIN_INDEX_MAP
4. Update adjacency matrix: `web-pages` → `[web-shared]`, `web-business` → `[web-shared, web-forms]`
5. Update KEYWORD_MAP for new sub-domains
6. Regenerate all 3 new indexes

**Depends on:** none
**Success:** No single web component index exceeds 7K tokens, total coverage unchanged

---

### Sprint B3: Caller Graph

#### Task B3.1: Add Caller Graph to Index Generator
**File:** `.claude/scripts/regenerate-code-index.js` (UPDATE)
**What:** Add a `callers` field to each file entry showing which files import/call its exports. This eliminates "trace impact" Greps that currently cost 2-3 tool calls per lookup.

**New field per file entry:**
```json
{
  "account.service": {
    "e": ["AccountService", "createAccount"],
    "callers": {
      "AccountService": ["account.routes.ts", "transfer.service.ts"],
      "createAccount": ["account.routes.ts"]
    }
  }
}
```

**Implementation:**
1. First pass: collect all exports per file (already done)
2. Second pass: for each file's imports, resolve which exports they reference
3. Build reverse map: export → list of importing files
4. Add `callers` (abbreviated as `c`) to file entries

**Token impact:** ~30% increase per domain (~3K extra tokens per domain, still within budget for 2-domain loads)

**Depends on:** none
**Risk:** medium (import resolution can be tricky with re-exports and barrel files)
**Review:** `architecture-strategist`
**Success:** `callers` field accurate for all exports, eliminates reverse-dependency Greps

---

### Sprint B4: Test Coverage Map

#### Task B4.1: Add Test Coverage to Index
**File:** `.claude/scripts/regenerate-code-index.js` (UPDATE)
**What:** Cross-reference service/route files with their test files. Add `tests` field to file entries.

**New field:**
```json
{
  "account.service": {
    "tests": {
      "file": "account.service.test.ts",
      "exists": true,
      "testCount": 24
    }
  }
}
```

**Detection strategy:**
1. For each indexed file `X.ts`, look for `X.test.ts` or `__tests__/X.test.ts`
2. If test file exists, count `it(` and `test(` occurrences for test count
3. If no test file, mark `exists: false` (signals coverage gap)

**Token impact:** ~10% increase per domain (~1K tokens), minimal

**Depends on:** none
**Success:** Every service/route file shows whether it has tests and how many

---

### Sprint B5: Changed-Since-Last-Session Diff

#### Task B5.1: Session Diff Tracker
**File:** `.claude/scripts/session-diff.js` (NEW)
**File:** `.claude/runtime/last-session-commit.txt` (NEW)
**What:** Track what files changed between sessions so `/processes:begin` can show "what's new."

**Implementation:**
1. At session end: write current HEAD commit hash to `.claude/runtime/last-session-commit.txt`
2. At session start: `git diff --name-only <last-commit>..HEAD` to get changed files
3. Cross-reference with code index to show which domains were affected
4. Format for session start display

**Output:**
```markdown
## Changes Since Last Session
- **12 files changed** across banking (4), accounting (3), web-pages (5)
- Notable: transfer.service.ts (142 lines changed), new file: void.service.ts
- Tests: 3 new test files added
```

**Integration:** Add to `/processes:begin` output after git status

**Depends on:** none
**Success:** Session start shows meaningful diff from last session

---

### Sprint B6: Semantic Domain Relationships

#### Task B6.1: Enhance Domain Adjacency with Semantics
**File:** `.claude/domain-adjacency.json` (UPDATE)
**What:** Upgrade adjacency from flat list to semantic relationships that describe HOW domains relate, not just THAT they're adjacent.

**Current format:**
```json
{ "banking": ["accounting"] }
```

**New format:**
```json
{
  "banking": {
    "accounting": {
      "relationship": "creates",
      "description": "Transfers create journal entries in accounting",
      "touchpoints": ["transfer.service.ts → journal-entry.service.ts"],
      "dataFlow": "banking creates JEs in accounting"
    }
  },
  "invoicing": {
    "accounting": {
      "relationship": "posts",
      "description": "Invoice posting creates AR journal entries",
      "touchpoints": ["invoice.service.ts → journal-entry.service.ts"],
      "dataFlow": "invoicing posts to GL via accounting"
    },
    "clients": {
      "relationship": "references",
      "description": "Invoices reference client data",
      "touchpoints": ["invoice.service.ts → client.service.ts"],
      "dataFlow": "invoicing reads from clients"
    }
  }
}
```

**Depends on:** none
**Success:** Domain adjacency includes relationship type, description, and touchpoints

---

## Part C: Quick Wins (Can be done anytime)

### Task C1: Interactive Tool Wrappers
**File:** `.claude/scripts/prisma-migrate.sh` (NEW)
**What:** Wrapper scripts for interactive CLI tools that agents can't run. Detects when a migration is needed and outputs the exact command for the user to run (already documented in `.claude/rules/prisma-workflow.md`, this formalizes it as a reusable script).

**Depends on:** none
**Effort:** 30 min

---

### Task C2: Export Verification Cache
**File:** `.claude/cache/exports.json` (NEW, gitignored)
**What:** Cache of all exports across the codebase, rebuilt by `regenerate-code-index.js`. Used by `verify-import.js` for instant lookups instead of Grep fallback.

**Depends on:** none
**Effort:** 1 hour

---

## Reference Files

- `.claude/scripts/regenerate-code-index.js` — current index generator (462 lines)
- `.claude/scripts/load-code-index.js` — current multi-domain loader (334 lines)
- `.claude/commands/processes/end-session.md` — current session capture workflow
- `.claude/commands/processes/begin.md` — session start workflow
- `apps/api/src/middleware/errorHandler.ts` — existing error handler
- `apps/api/src/lib/audit.ts` — existing audit logging (SHA-256 chain)
- `apps/api/src/lib/logger.ts` — existing pino logger
- `apps/api/src/index.ts` — Fastify server setup

## Edge Cases

- **Runtime logs during test runs:** Only collect when `NODE_ENV === 'development'`, not during `vitest`
- **Large git diffs:** Session diff should truncate at 50 files, summarize remainder
- **Concurrent sessions:** Runtime logs use append-only with dedup, safe for parallel
- **Missing runtime directory:** Scripts create `.claude/runtime/` if it doesn't exist
- **WEB-COMPONENTS split boundary:** Some components may be ambiguous — use `components/business/` path as primary classifier
- **Caller graph with barrel files:** `index.ts` re-exports are resolved to the original source file

## Review Agent Coverage

| Task | Relevant Agents |
|------|----------------|
| A1.2 (Prisma Observer) | `performance-oracle` |
| A1.3 (Error Collector) | `security-sentinel` |
| B3.1 (Caller Graph) | `architecture-strategist` |
| B2.1 (Split WEB-COMPONENTS) | `architecture-strategist` |

## Domain Impact

- **Primary domains:** Infrastructure (`.claude/`), API middleware
- **Adjacent domains:** All 8 code index domains (regeneration needed)
- **No user-facing changes** — all improvements are developer tooling

## Testing Strategy

- **Runtime bridge:** Manual testing — start dev server, trigger slow requests, verify log files
- **Auto-capture:** Run end-session on a session with known commits, verify pattern extraction
- **Decision journal:** Create test decision, verify index generation and code index linkage
- **Production signals:** Add test signal, verify begin output
- **Index improvements:** Regenerate indexes, verify token counts and field accuracy
- **Caller graph:** Compare `callers` field against manual Grep verification for 5 exports

## Progress

### Part A: Feedback Loops
- [ ] A1.1: Request Timing Middleware
- [ ] A1.2: Prisma Query Observer
- [ ] A1.3: Runtime Error Collector
- [ ] A1.4: Runtime Summary Script
- [ ] A2.1: Git Diff Pattern Extractor
- [ ] A2.2: Enhance End-Session with Auto-Capture
- [ ] A2.3: Auto-Route to MEMORY Topic Files
- [ ] A3.1: Decision Journal Format & Storage
- [ ] A3.2: Decision Capture Integration
- [ ] A3.3: Decision Index Generator
- [ ] A4.1: Production Signal Schema
- [ ] A4.2: Production Signal Reader for Begin
- [ ] A4.3: Manual Signal Ingestion Script

### Part B: Code Indexing V2
- [ ] B1.1: Extract Shared Legend
- [ ] B2.1: Split WEB-COMPONENTS Index
- [ ] B3.1: Add Caller Graph to Index Generator
- [ ] B4.1: Add Test Coverage to Index
- [ ] B5.1: Session Diff Tracker
- [ ] B6.1: Enhance Domain Adjacency with Semantics

### Part C: Quick Wins
- [ ] C1: Interactive Tool Wrappers
- [ ] C2: Export Verification Cache

---

## Execution Order (Recommended)

**Phase 1 (Week 1):** A1.1-A1.4 (Runtime Bridge) + B1.1 (Legend Dedup) + C1, C2 (Quick Wins)
**Phase 2 (Week 2):** A2.1-A2.3 (Auto-Capture) + B2.1 (Split WEB-COMPONENTS)
**Phase 3 (Week 3):** A3.1-A3.3 (Decision Journal) + B3.1 (Caller Graph) + B4.1 (Test Coverage)
**Phase 4 (Week 4):** A4.1-A4.3 (Production Signals) + B5.1 (Session Diff) + B6.1 (Semantic Adjacency)

**Total:** 22 tasks across 4 weeks. 13 new files, 6 updated files, 3 new directories.

---

_Plan created: 2026-02-27. Execution: /processes:work_
