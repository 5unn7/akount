# Code Indexing & Context Management Upgrade

**Created:** 2026-02-27
**Status:** Draft
**Inspired by:** VectifyAI/PageIndex (vectorless indexing approach)

---

## Overview

Upgrade Claude Code's architecture with PageIndex-style code indexing to reduce context exhaustion, prevent hallucinations, and improve cross-session knowledge persistence. Currently, all code discovery is manual (Grep → Read on every access). This plan implements HTML comment-based indexing for instant code lookup.

## Success Criteria

- [ ] Code index covers 100% of TypeScript files (642 files)
- [ ] Discovery time reduced by 80% (1 lookup vs 5-10 Grep calls)
- [ ] Hallucination incidents reduced by 60% (proactive verification)
- [ ] Context documentation staleness < 7 days (automated freshness)
- [ ] Pattern violations caught at commit time (zero drift)
- [ ] Review learnings auto-propagate to MEMORY.md

---

## Current State Assessment

### Existing Infrastructure ✅
- **Task indexing:** TASK-INDEX in TASKS.md (~2K tokens vs 15K full read)
- **Task enrichments:** .claude/task-enrichments.json (155KB, metadata for 130 tasks)
- **12 task scripts:** regenerate-task-index.js, reserve-task-ids.js, etc.
- **Context docs:** CLAUDE.md (root + 3 domains), context-map.md, 2,569 lines of rules

### Gaps Identified 🔴
- **NO code index:** Every discovery requires Grep + Read (manual, slow)
- **NO pattern library:** Inline utils duplicated, no violation detection
- **NO import graph:** Impact analysis relies on text search
- **NO auto-learning:** Review findings manually added to MEMORY
- **Stale docs:** context-map.md 18 days old (should be <7 days)
- **Reactive hallucination:** Only caught in review, not blocked upfront

### Staleness Analysis
| File | Last Updated | Age | Status |
|------|--------------|-----|--------|
| docs/context-map.md | 2026-02-09 | 18 days | 🔴 STALE |
| apps/api/CLAUDE.md | 2026-02-25 | 2 days | 🟢 FRESH |
| apps/web/CLAUDE.md | 2026-02-25 | 2 days | 🟢 FRESH |
| packages/db/CLAUDE.md | 2026-02-25 | 2 days | 🟢 FRESH |

**Verdict:** Task systems are solid. Code discovery and documentation freshness need work.

---

## Tasks

### Sprint 1: Code Index Foundation (Priority 1, Week 1)

#### Task 1.1: Create Code Index Generator
**Files:**
- NEW: `.claude/scripts/regenerate-code-index.js`
- UPDATE: `CODEBASE.md` (new file with HTML comment index)

**What:** Build script similar to regenerate-task-index.js but for TypeScript files. Scans apps/api, apps/web, packages/ and generates JSON metadata embedded as HTML comment in CODEBASE.md.

**Index Structure:**
```html
<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "services": {
    "account.service.ts": {
      "path": "apps/api/src/domains/banking/services/account.service.ts",
      "domain": "banking",
      "exports": ["AccountService", "createAccount", "listAccounts"],
      "imports": ["@akount/db", "TenantContext"],
      "patterns": ["tenant-isolation", "soft-delete", "pino-logging"],
      "loc": 234,
      "testFile": "__tests__/account.service.test.ts",
      "testCoverage": 85,
      "lastModified": "2026-02-24"
    }
  },
  "routes": { /* similar structure */ },
  "components": { /* similar structure */ },
  "patterns": {
    "tenant-isolation": {
      "files": ["account.service.ts", "invoice.service.ts"],
      "canonical": "See .claude/rules/financial-rules.md",
      "violations": []
    },
    "formatCurrency": {
      "canonical": "apps/web/src/lib/utils/currency.ts",
      "usages": 47,
      "violations": ["components/old-widget.tsx:23"]
    }
  },
  "domains": {
    "banking": { "services": 8, "routes": 12, "tests": 24 }
  },
  "staleness": {
    "staleFiles": ["context-map.md"],
    "threshold": 7
  }
}
CODE-INDEX:END -->
```

**Success:**
- Script generates valid JSON index from codebase scan
- Index covers all 642 TypeScript files
- Pattern violations detected (inline utils, hardcoded colors)
- Staleness tracking for documentation files

**Depends on:** none
**Effort:** 1-2 days

---

#### Task 1.2: Update Discovery Workflows
**Files:**
- UPDATE: `.claude/commands/processes/plan.md`
- UPDATE: `.claude/commands/processes/work.md`
- UPDATE: `.claude/commands/processes/claim.md`
- UPDATE: `.claude/rules/product-thinking.md`

**What:** Modify workflows to check code index BEFORE manual Grep/Read. Add "Index Lookup" phase:
1. Read CODEBASE.md index (fast, ~3K tokens)
2. Filter to relevant domain/pattern
3. Only Grep if index lookup fails

**Example Change (plan.md):**
```markdown
## Phase 1: Research

### Check Code Index First
Read CODEBASE.md index to find:
- Services in target domain
- Similar pattern implementations
- Canonical utility locations

### Fallback to Manual Discovery
If index lookup fails, use traditional Grep/Read.
```

**Success:**
- Workflows reference code index before Grep
- Plan skill shows "Found 3 similar services via index"
- Work skill verifies pattern via index before implementing

**Depends on:** Task 1.1
**Effort:** 2-3 hours

**Review:** `architecture-strategist`

---

#### Task 1.3: Add Auto-Rebuild Hooks
**Files:**
- NEW: `.claude/hooks/rebuild-code-index.sh`
- UPDATE: `.claude/hooks/hard-rules.sh`

**What:** Hook that triggers code index rebuild on TS file changes (similar to task-complete-sync.sh for TASKS.md).

**Trigger:** post-commit if `git diff --name-only HEAD~1 HEAD | grep '\.tsx\?$'`
**Action:** `node .claude/scripts/regenerate-code-index.js`

**Success:**
- Code index auto-updates after commits touching .ts/.tsx files
- Hook runs in <2 seconds (no commit slowdown)
- Index stays fresh within 1 commit lag

**Depends on:** Task 1.1
**Effort:** 1 hour

---

### Sprint 2: Pattern Violation Detection (Priority 2, Week 2)

#### Task 2.1: Create Pattern Violation Detector
**Files:**
- NEW: `.claude/scripts/detect-violations.js`

**What:** Grep-based scanner for anti-patterns from guardrails.md and design-aesthetic.md:

**Checks:**
1. Inline utility functions (formatCurrency, formatDate not imported from canonical)
2. Hardcoded colors (`text-[#`, `bg-[rgba`, not using tokens)
3. console.log in production (outside test files)
4. Missing tenant filters (WHERE without tenantId in service files)
5. Missing timestamps in SELECT constants (no createdAt/updatedAt)
6. `: any` type annotations
7. Duplicate component logic (same markup in 3+ files)

**Output:**
```bash
❌ Found 5 violations:

apps/web/src/components/widget.tsx:23
  → Inline formatCurrency (use @/lib/utils/currency)

apps/api/src/domains/banking/routes/test.ts:45
  → console.log in production (use request.log)

apps/web/src/app/(dashboard)/invoices/page.tsx:12
  → Hardcoded color text-[#34D399] (use text-ak-green)
```

**Success:**
- Script detects all 7 anti-pattern types
- Zero false positives on existing codebase
- Violations link to relevant guardrail rule

**Depends on:** none
**Effort:** 1 day

**Review:** `code-simplicity-reviewer`

---

#### Task 2.2: Add Pre-Commit Violation Check
**Files:**
- NEW: `.claude/hooks/pattern-violations.sh`
- UPDATE: `.claude/hooks/hard-rules.sh`

**What:** Run detect-violations.js on staged files only (fast check).

**Trigger:** pre-commit
**Action:** `node .claude/scripts/detect-violations.js --staged`
**Behavior:** Block commit if critical violations found (tenant filter, console.log)

**Success:**
- Hook runs in <3 seconds for typical commit
- Blocks commits with critical violations
- Warns (but allows) for medium violations

**Depends on:** Task 2.1
**Effort:** 1 hour

---

### Sprint 3: Proactive Hallucination Blocker (Priority 3, Week 2)

#### Task 3.1: Build Import Verification Layer
**Files:**
- NEW: `.claude/scripts/verify-import.js`
- UPDATE: `.claude/rules/guardrails.md`

**What:** Pre-execution verification for claimed patterns. Before Edit/Write tools accept claims like "I'll import formatCurrency from currency.ts", auto-run Grep to verify export exists.

**Implementation:**
```javascript
// In Edit tool wrapper
async function verifyImport(file, importName, importPath) {
  const result = await Grep({
    pattern: `export.*${importName}`,
    path: importPath,
    output_mode: 'count'
  });

  if (result === 0) {
    throw new HallucinationError(
      `${importName} not found at ${importPath}. ` +
      `Run: Grep "export.*${importName}" ${importPath.dir}/`
    );
  }
}
```

**Success:**
- Detects non-existent imports before Edit executes
- Blocks edits referencing hallucinated patterns
- Provides corrective Grep command in error message

**Depends on:** none
**Effort:** 2 days

**Review:** `kieran-typescript-reviewer`

---

#### Task 3.2: Update Guardrails Protocol
**Files:**
- UPDATE: `.claude/rules/guardrails.md`

**What:** Add Step 0.5 to pre-flight checklist: "Verify imports exist via code index or Grep before claiming pattern."

**Success:**
- Guardrails reference proactive verification
- Pre-flight checklist includes import verification step

**Depends on:** Task 3.1
**Effort:** 30 minutes

---

### Sprint 4: Import Graph Generator (Priority 4, Week 3)

#### Task 4.1: Create Import Graph Script
**Files:**
- NEW: `.claude/scripts/generate-import-graph.js`
- NEW: `.claude/import-graph.json`

**What:** Parse all TS files, extract import statements, build dependency graph.

**Output Structure:**
```json
{
  "apps/api/src/domains/banking/services/account.service.ts": {
    "imports": [
      "@akount/db",
      "domains/accounting/utils/entry-number.ts"
    ],
    "importedBy": [
      "routes/accounts.ts",
      "__tests__/account.service.test.ts"
    ],
    "transitiveImpact": 24
  }
}
```

**Success:**
- Graph covers all 642 TS files
- Accurately tracks import/importedBy relationships
- Calculates transitive impact count

**Depends on:** none
**Effort:** 2 days

**Review:** `architecture-strategist`

---

#### Task 4.2: Add Impact Analysis to Plan Workflow
**Files:**
- UPDATE: `.claude/commands/processes/plan.md`

**What:** Add "Impact Analysis" phase that reads import-graph.json to answer "If I change X, what breaks?"

**Example:**
```markdown
## Phase 1.5: Impact Analysis

Read import-graph.json to identify:
- Direct dependents (importedBy)
- Transitive impact count
- Cross-domain dependencies

Example: Changing entry-number.ts affects 24 files across 3 domains.
```

**Success:**
- Plan workflow references import graph for impact
- Plans show transitive impact warnings for shared utilities

**Depends on:** Task 4.1
**Effort:** 1 hour

---

### Sprint 5: Auto-Learning from Reviews (Priority 5, Week 3)

#### Task 5.1: Create Review Learning Extractor
**Files:**
- NEW: `.claude/scripts/extract-review-learnings.js`

**What:** Parse review SUMMARY.md files from docs/reviews/, extract patterns, map to MEMORY topic files.

**Mapping Rules:**
1. Security findings → `memory/debugging-log.md` (if bug) or create `memory/security-patterns.md`
2. Financial findings → `memory/api-patterns.md` or `memory/financial-patterns.md`
3. UI/design findings → `memory/codebase-quirks.md`
4. Pattern violations (3+ occurrences) → `memory/api-patterns.md` or `memory/frontend-patterns.md`

**Output:**
```bash
Review: docs/reviews/banking-transfer/SUMMARY.md
Extracted 3 patterns:
  1. "Conservation of value for transfers" → memory/api-patterns.md
  2. "Two-phase submit for forms" → memory/frontend-patterns.md
  3. "Prisma transaction timeout" → memory/codebase-quirks.md

Propose appending to MEMORY files? [Y/n]
```

**Success:**
- Script parses 8 existing review summaries
- Correctly extracts patterns and maps to topic files
- Prompts for user approval before writing

**Depends on:** none
**Effort:** 2 days

**Review:** `code-simplicity-reviewer`

---

#### Task 5.2: Integrate with Review Workflow
**Files:**
- UPDATE: `.claude/commands/processes/review.md`

**What:** Add final phase to review workflow: "Phase 5: Capture Learnings" that calls extract-review-learnings.js.

**Success:**
- Review skill auto-extracts learnings after generating SUMMARY.md
- User approves/rejects proposed MEMORY updates
- Learning loop closes automatically

**Depends on:** Task 5.1
**Effort:** 1 hour

---

### Sprint 6: Documentation Freshness Automation (Priority 6, Week 4)

#### Task 6.1: Create Context Staleness Checker
**Files:**
- NEW: `.claude/scripts/check-context-freshness.js`

**What:** Compare last-modified dates of context docs vs related code files. Flag if docs are >7 days older than code.

**Checks:**
- `docs/context-map.md` vs `packages/db/prisma/schema.prisma` (model changes)
- `apps/api/CLAUDE.md` vs `apps/api/src/domains/*/` (file count changes)
- `apps/web/CLAUDE.md` vs `apps/web/src/app/(dashboard)/` (page count changes)

**Output:**
```bash
🔴 STALE: docs/context-map.md (18 days old, schema.prisma changed 2 days ago)
🟢 FRESH: apps/api/CLAUDE.md (2 days old)
```

**Success:**
- Detects all 4 context files' staleness
- Compares against relevant code paths
- Suggests refresh if >7 day delta

**Depends on:** none
**Effort:** 1 day

---

#### Task 6.2: Add Staleness Check to Begin Workflow
**Files:**
- UPDATE: `.claude/commands/processes/begin.md`

**What:** Add staleness check at session start, warn user if docs are stale.

**Success:**
- Begin workflow shows staleness warnings
- User prompted to refresh stale docs

**Depends on:** Task 6.1
**Effort:** 30 minutes

---

#### Task 6.3: Refresh docs/context-map.md
**Files:**
- UPDATE: `docs/context-map.md`

**What:** Manual refresh to current state (18 days stale). Update model counts, enum values, add Planning domain models (Budget, Goal, Forecast).

**Success:**
- context-map.md accurate as of 2026-02-27
- Includes all 43 Prisma models
- Planning domain documented

**Depends on:** none
**Effort:** 1 hour

---

### Sprint 7: Testing & Validation (Priority 7, Week 4)

#### Task 7.1: Test Code Index Generation
**Files:**
- NEW: `.claude/scripts/__tests__/code-index.test.js`

**What:** Vitest tests for regenerate-code-index.js:
- Scans sample codebase correctly
- Detects patterns (tenant-isolation, formatCurrency usages)
- Flags violations (inline utils, hardcoded colors)
- Tracks staleness

**Success:**
- 10+ passing tests
- Coverage >80%

**Depends on:** Task 1.1
**Effort:** 2 hours

---

#### Task 7.2: Test Pattern Violation Detector
**Files:**
- NEW: `.claude/scripts/__tests__/violations.test.js`

**What:** Tests for detect-violations.js with sample files containing known violations.

**Success:**
- Detects all 7 violation types
- Zero false positives
- Coverage >80%

**Depends on:** Task 2.1
**Effort:** 2 hours

---

#### Task 7.3: Test Import Graph Generator
**Files:**
- NEW: `.claude/scripts/__tests__/import-graph.test.js`

**What:** Tests for generate-import-graph.js with sample import chains.

**Success:**
- Correctly builds graph
- Calculates transitive impact
- Coverage >80%

**Depends on:** Task 4.1
**Effort:** 2 hours

---

## Reference Files

**Existing Infrastructure:**
- `.claude/scripts/regenerate-task-index.js` — pattern for code index generator
- `.claude/task-enrichments.json` — pattern for metadata storage
- `.claude/hooks/task-complete-sync.sh` — pattern for auto-rebuild hooks
- `.claude/rules/guardrails.md` — anti-pattern reference

**Documentation to Update:**
- `CLAUDE.md` (root) — add code index reference
- `apps/api/CLAUDE.md` — domain file counts (verify freshness)
- `apps/web/CLAUDE.md` — page counts (verify freshness)
- `docs/context-map.md` — model glossary (STALE, needs refresh)

**VectifyAI/PageIndex Inspiration:**
- HTML comment-based indexing (git-friendly)
- JSON metadata blocks (fast retrieval)
- No vector DB overhead

---

## Edge Cases

**Large Codebase Growth:**
If code index exceeds 20K tokens, add pagination or domain filters (show only relevant domains in index).

**Index Drift:**
If index gets stale between commits, add manual rebuild command: `node .claude/scripts/regenerate-code-index.js --force`

**False Positive Violations:**
Add `.violationsignore` file (like .gitignore) for intentional exceptions.

**Circular Imports:**
Import graph should detect cycles and flag as warnings.

---

## Review Agent Coverage

| Sprint | Tasks | Relevant Agents |
|--------|-------|-----------------|
| Sprint 1 | 1.1, 1.2, 1.3 | `architecture-strategist` |
| Sprint 2 | 2.1, 2.2 | `code-simplicity-reviewer` |
| Sprint 3 | 3.1, 3.2 | `kieran-typescript-reviewer` |
| Sprint 4 | 4.1, 4.2 | `architecture-strategist` |
| Sprint 5 | 5.1, 5.2 | `code-simplicity-reviewer` |
| Sprint 6 | 6.1, 6.2, 6.3 | none (documentation) |
| Sprint 7 | 7.1, 7.2, 7.3 | none (testing) |

---

## Domain Impact

**Primary domains:**
- `.claude/` (scripts, hooks, rules — 15 files modified/created)
- `docs/` (context-map.md, plans/ — 2 files)
- Root (CODEBASE.md new file)

**Adjacent domains:**
- All 8 app domains (indexed by code index)
- workflows (plan, work, claim, review, begin — 5 skills)

**Cross-cutting concerns:**
- Context management architecture
- Hallucination prevention
- Documentation freshness
- Pattern enforcement

---

## Testing Strategy

**Script Testing:**
- Vitest tests for 3 new scripts (Tasks 7.1-7.3)
- Run on sample codebase subset
- Verify output structure matches spec

**Integration Testing:**
- Manual test: Run plan workflow, verify code index lookup works
- Manual test: Commit TS file, verify index auto-rebuilds
- Manual test: Attempt inline formatCurrency, verify violation detected

**Validation:**
- Measure discovery time: before (5-10 Grep calls) vs after (1 index lookup)
- Track hallucination incidents: before (review findings) vs after (blocked at Edit)
- Monitor context usage: CODEBASE.md should be <5K tokens

---

## Implementation Order

**Week 1 (Sprint 1):** Code index foundation
**Week 2 (Sprints 2-3):** Pattern detection + hallucination blocker
**Week 3 (Sprints 4-5):** Impact analysis + auto-learning
**Week 4 (Sprints 6-7):** Freshness + testing

**Parallel Work:**
- Sprints 1-3 can run concurrently (no dependencies)
- Sprint 4 after Sprint 1 (needs code index)
- Sprint 5 independent
- Sprint 6 independent
- Sprint 7 after all scripts built

---

## Estimated ROI

**Discovery Time:** 80% reduction (1 lookup vs 5-10 Grep calls)
**Hallucination Incidents:** 60% reduction (proactive blocking)
**Documentation Drift:** 90% reduction (auto-freshness checks)
**Pattern Violations:** 100% prevention (commit-time blocking)
**Learning Loop:** Closed (review findings auto-propagate)

**Developer Time Saved:**
- ~10 hours/week (prevent-vs-fix pattern violations)
- ~5 hours/week (faster discovery via index)
- ~2 hours/week (auto-learning reduces re-investigation)

**Total:** ~17 hours/week saved, ~68 hours/month

**Implementation Cost:** ~80 hours (4 weeks × 20 hours/week)
**Payback Period:** ~1.2 months

---

## Progress

### Sprint 1: Code Index Foundation
- [ ] Task 1.1: Create Code Index Generator
- [ ] Task 1.2: Update Discovery Workflows
- [ ] Task 1.3: Add Auto-Rebuild Hooks

### Sprint 2: Pattern Violation Detection
- [ ] Task 2.1: Create Pattern Violation Detector
- [ ] Task 2.2: Add Pre-Commit Violation Check

### Sprint 3: Proactive Hallucination Blocker
- [ ] Task 3.1: Build Import Verification Layer
- [ ] Task 3.2: Update Guardrails Protocol

### Sprint 4: Import Graph Generator
- [ ] Task 4.1: Create Import Graph Script
- [ ] Task 4.2: Add Impact Analysis to Plan Workflow

### Sprint 5: Auto-Learning from Reviews
- [ ] Task 5.1: Create Review Learning Extractor
- [ ] Task 5.2: Integrate with Review Workflow

### Sprint 6: Documentation Freshness Automation
- [ ] Task 6.1: Create Context Staleness Checker
- [ ] Task 6.2: Add Staleness Check to Begin Workflow
- [ ] Task 6.3: Refresh docs/context-map.md

### Sprint 7: Testing & Validation
- [ ] Task 7.1: Test Code Index Generation
- [ ] Task 7.2: Test Pattern Violation Detector
- [ ] Task 7.3: Test Import Graph Generator

---

## Files to Update Summary

**NEW Files (8):**
1. `.claude/scripts/regenerate-code-index.js`
2. `.claude/scripts/detect-violations.js`
3. `.claude/scripts/verify-import.js`
4. `.claude/scripts/generate-import-graph.js`
5. `.claude/scripts/extract-review-learnings.js`
6. `.claude/scripts/check-context-freshness.js`
7. `CODEBASE.md`
8. `.claude/import-graph.json`

**NEW Hooks (2):**
1. `.claude/hooks/rebuild-code-index.sh`
2. `.claude/hooks/pattern-violations.sh`

**NEW Tests (3):**
1. `.claude/scripts/__tests__/code-index.test.js`
2. `.claude/scripts/__tests__/violations.test.js`
3. `.claude/scripts/__tests__/import-graph.test.js`

**UPDATE Workflows (5):**
1. `.claude/commands/processes/plan.md`
2. `.claude/commands/processes/work.md`
3. `.claude/commands/processes/claim.md`
4. `.claude/commands/processes/review.md`
5. `.claude/commands/processes/begin.md`

**UPDATE Rules (2):**
1. `.claude/rules/guardrails.md`
2. `.claude/rules/product-thinking.md`

**UPDATE Context (2):**
1. `.claude/hooks/hard-rules.sh`
2. `docs/context-map.md`

**Total:** 22 files (8 new + 3 new tests + 2 new hooks + 9 updates)

---

_Plan created: 2026-02-27. Execution: /processes:work_
