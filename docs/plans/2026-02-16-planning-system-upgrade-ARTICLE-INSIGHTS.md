# Article Insights: AI-Agent Code Review Loops

**Source:** Ryan Carson (@ryancarson) — "The goal: Codex right and review 100% of the code"
**Date:** 2026-02-14
**Relevance:** Directly maps to our planning system upgrade and review process

---

## Core Insight

**Goal:** Create a deterministic, auditable loop where:
1. Coding agent writes code
2. Repo enforces risk-aware checks before merge
3. Code review agent validates the PR
4. Evidence (tests + browser + review) is machine-verifiable
5. Findings turn into repeatable harness cases

---

## Key Patterns to Adopt

### 1. Machine-Readable Risk Contract

**Article Pattern:**

```json
{
  "version": "1",
  "riskTierRules": {
    "high": [
      "app/api/legal-chat/**",
      "lib/tools/**",
      "db/schema.ts"
    ],
    "low": ["**"]
  },
  "mergePolicy": {
    "high": {
      "requiredChecks": [
        "risk-policy-gate",
        "harness-smoke",
        "Browser Evidence",
        "CI Pipeline"
      ]
    },
    "low": {
      "requiredChecks": ["risk-policy-gate", "CI Pipeline"]
    }
  }
}
```

**How We Apply This:**

Create `.claude/risk-policy.json`:

```json
{
  "version": "1",
  "riskTierRules": {
    "critical": [
      "packages/db/prisma/schema.prisma",
      "apps/api/src/middleware/tenant.ts",
      "apps/api/src/middleware/auth.ts",
      "apps/api/src/domains/system/services/onboarding.service.ts"
    ],
    "high": [
      "apps/api/src/domains/accounting/**",
      "apps/api/src/domains/banking/**",
      "apps/api/src/lib/tenant-scoped-query.ts",
      "packages/db/**/*.ts"
    ],
    "medium": [
      "apps/web/src/app/**",
      "apps/api/src/domains/**"
    ],
    "low": [
      "docs/**",
      ".claude/**",
      "**/*.md"
    ]
  },
  "reviewPolicy": {
    "critical": {
      "requiredAgents": [
        "security-sentinel",
        "prisma-migration-reviewer",
        "financial-data-validator",
        "architecture-strategist"
      ],
      "requireAllPass": true,
      "maxP0Findings": 0
    },
    "high": {
      "requiredAgents": [
        "security-sentinel",
        "financial-data-validator"
      ],
      "maxP0Findings": 0
    },
    "medium": {
      "requiredAgents": ["security-sentinel"],
      "maxP0Findings": 1
    },
    "low": {
      "requiredAgents": [],
      "maxP0Findings": null
    }
  }
}
```

**Implementation in `/processes:review`:**

```markdown
### Step 1.5: Compute Risk Tier (NEW)

Before running agents, determine risk tier from changed files:

1. **Read risk policy:** `.claude/risk-policy.json`
2. **Analyze plan files:** Extract paths from task descriptions
3. **Compute tier:** Match paths against riskTierRules (highest match wins)
4. **Select agents:** Use reviewPolicy for computed tier
5. **Set thresholds:** Max P0/P1 findings from policy

**Output:**

```
🎯 Risk Assessment:
- Tier: HIGH
- Changed areas: apps/api/src/domains/accounting/services/report.service.ts
- Required agents: security-sentinel, financial-data-validator
- Max P0 findings: 0
- Max P1 findings: 3
```

**If tier is CRITICAL:** Require ALL P0 + P1 findings addressed before merge.
```

---

### 2. Preflight Gate Before Expensive CI

**Article Pattern:**

```typescript
// Run risk-policy-gate FIRST
const requiredChecks = computeRequiredChecks(changedFiles, riskTier);
await assertDocsDriftRules(changedFiles);
await assertRequiredChecksSuccessful(requiredChecks);

// Only THEN start test/build/security fanout
if (needsCodeReviewAgent(changedFiles, riskTier)) {
  await waitForCodeReviewCompletion({ headSha, timeoutMinutes: 20 });
  await assertNoActionableFindingsForHead(headSha);
}
```

**How We Apply This:**

Update pre-commit hook to run lightweight policy checks BEFORE running agents:

```bash
#!/bin/bash
# .claude/hooks/pre-commit-preflight.sh

echo "🛡️  Running preflight policy gate..."

# 1. Validate risk tier (fast - JSON read)
node .claude/scripts/validate-risk-tier.js "$@" || exit 1

# 2. Check file locations (fast - glob pattern match)
.claude/hooks/hard-rules.sh || exit 1

# 3. Type check (medium - ~10s)
npm run typecheck || exit 1

# 4. Unit tests for changed files (medium - ~30s)
npm run test:changed || exit 1

echo "✅ Preflight gate passed. Proceeding to agent review..."

# NOW safe to run expensive agents (2-8 minutes)
```

**Time savings:** Catch policy violations in <1 minute instead of after 5-minute agent review.

---

### 3. Current-Head SHA Discipline

**Article Pattern:**

> "Treat review state as valid only when it matches the current PR head commit"

- Wait for review check run on `headSha`
- Ignore stale summary comments tied to older SHAs
- Fail if latest review run is non-success or times out
- Require reruns after each synchronize/push

**How We Apply This:**

Add SHA tracking to review synthesis:

```.reviews/SYNTHESIS.md
---
head_sha: abc123def456
review_timestamp: 2026-02-16T16:30:00Z
plan_version: docs/plans/2026-02-16-phase5-AMENDED.md
agents_run: security-sentinel, financial-data-validator, performance-oracle
status: APPROVED | CHANGES_REQUIRED
---

## Executive Summary
[... synthesis content ...]

## SHA Verification

**Current HEAD:** `abc123def456`
**Review valid for:** This SHA only
**Stale if:** Plan file modified OR HEAD advances

**Rerun required if:**
- Plan file changed
- New commits added to PR
- Risk tier increases (e.g., new schema changes)
```

**Workflow update:**

```markdown
## Step 6: SHA Staleness Check (NEW)

Before using cached review results, verify:

1. **Read `.reviews/SYNTHESIS.md` front-matter**
2. **Get current HEAD:** `git rev-parse HEAD`
3. **Compare:**
   - If HEAD matches synthesis SHA → use cached results
   - If HEAD differs → rerun ALL agents
4. **Check plan staleness:**
   - If plan file modified since review → rerun ALL agents

**Output:** "✅ Review fresh (HEAD abc123)" OR "⚠️ Review stale, rerunning..."
```

---

### 4. Automated Remediation Loop

**Article Pattern:**

> "If review findings are actionable, trigger a coding agent to:
> 1. Read review context
> 2. Patch code
> 3. Run focused local validation
> 4. Push fix commit to the same PR branch"

**How We Apply This:**

Create `/processes:auto-fix` skill:

```markdown
# Auto-Fix Workflow

## When to Use

After `/processes:review` completes with P1 findings that are:
- Deterministic (clear fix pattern)
- Low-risk (no architectural changes)
- Testable (can verify fix works)

**Examples of auto-fixable findings:**
- Missing `deletedAt: null` filter
- Hardcoded colors (replace with tokens)
- Missing type imports (`import type { X }`)
- Soft delete test missing

**DO NOT auto-fix:**
- P0 findings (require human review)
- Architectural issues
- Security vulnerabilities
- Breaking changes

## Process

### Step 1: Filter Fixable Findings

From synthesis, extract P1 findings marked `[AUTO-FIXABLE]`:

```typescript
interface FixableFinding {
  id: string // "P-P1-3"
  title: string // "Missing soft delete filter"
  file: string // "apps/api/src/domains/category/services/category.service.ts"
  pattern: string // "Add deletedAt: null to query"
  testRequired: boolean // true
}
```

### Step 2: Apply Fixes

For each finding:
1. Read affected file
2. Apply fix pattern
3. Run focused test: `npm test -- category.service.test.ts`
4. If test passes → stage change
5. If test fails → mark as MANUAL_REVIEW_REQUIRED

### Step 3: Commit & Rerun

```bash
git add [fixed-files]
git commit -m "fix(auto): Address P1 findings [P-P1-3, P-P1-5, P-P1-8]

Auto-fixed by /processes:auto-fix:
- Added deletedAt filters (3 files)
- Replaced hardcoded colors with tokens (2 files)

Remaining P1 findings require manual review:
- P-P1-1: Architectural decision
- P-P1-2: Security concern

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Rerun review on new HEAD
/processes:review @docs/plans/[plan].md
```

### Step 4: Report

```markdown
## Auto-Fix Summary

**Findings addressed:** 5/8 P1 findings
**Files modified:** 7
**Tests passing:** ✅ All focused tests pass
**Manual review required:** 3 P1 findings

**Next steps:**
1. Review auto-fix commit
2. Address remaining manual findings
3. Rerun `/processes:review` (already triggered)
```
```

**Add to `.claude/skills/processes-auto-fix.md`** (new file)

---

### 5. Browser Evidence as First-Class Proof

**Article Pattern:**

> "For UI or user-flow changes, require evidence manifests and assertions in CI"

```bash
npm run harness:ui:capture-browser-evidence
npm run harness:ui:verify-browser-evidence
```

**How We Apply This:**

Create E2E test evidence requirements for high-risk UI changes:

```markdown
## UI Change Evidence Requirements

**When required:** Plans touching high-risk UI paths:
- Authentication flows (`/sign-in`, `/sign-up`, `/onboarding`)
- Financial data entry (`/invoices`, `/payments`, `/journal-entries`)
- Data export/import (`/banking/import`, `/system/data-export`)

**Evidence required:**

1. **Critical flow recordings:**
   ```bash
   npm run test:e2e:record -- --spec onboarding.spec.ts
   ```

2. **Screenshot diffs:**
   ```bash
   npm run test:visual -- --update-snapshots
   ```

3. **Accessibility audit:**
   ```bash
   npm run test:a11y -- apps/web/src/app/\(dashboard\)/onboarding
   ```

4. **Evidence manifest:**
   ```json
   {
     "flow": "onboarding",
     "steps": [
       {
         "step": "initialize",
         "screenshot": "evidence/onboarding-step1.png",
         "a11y_score": 95,
         "passed": true
       },
       {
         "step": "complete",
         "screenshot": "evidence/onboarding-step4.png",
         "a11y_score": 92,
         "passed": true
       }
     ],
     "head_sha": "abc123",
     "timestamp": "2026-02-16T16:30:00Z"
   }
   ```

**Validation:**

```bash
# Verify evidence is fresh and valid
npm run harness:ui:verify-evidence -- --flow onboarding --sha abc123
```

**Merge policy:** If evidence invalid or stale → block merge.
```

**Add to planning template:**

```markdown
## UI Evidence Requirements (if applicable)

For plans modifying critical UI flows:

- [ ] E2E test coverage added for new flows
- [ ] Screenshot evidence captured (before/after)
- [ ] Accessibility score ≥90 for all pages
- [ ] Evidence manifest generated and validated
```

---

### 6. Harness-Gap Loop (Incident Memory)

**Article Pattern:**

```
production regression → harness gap issue → case added → SLA tracked
```

> "This keeps fixes from becoming one-off patches and grows long-term coverage."

**How We Apply This:**

Create incident → test case loop:

**Step 1:** Production incident filed in `.github/issues/`

```markdown
# Bug: Invoice payment causes double journal entry

**Severity:** P0
**Impact:** Financial data corruption
**Reproduction:**
1. Create invoice ($100)
2. Post invoice
3. Apply payment ($100)
4. Result: Two journal entries created for payment (should be one)

**Root cause:** [TBD after investigation]
```

**Step 2:** Investigation links to missing test case:

```markdown
## Root Cause

`PaymentService.applyPayment()` calls `DocumentPostingService.postPayment()` which internally calls `createJournalEntry()`. But the route handler ALSO calls `createJournalEntry()` directly. Double creation.

## Harness Gap

**Missing test case:** "Should not create duplicate journal entries when applying payment"

**Location:** `apps/api/src/domains/banking/__tests__/payment.service.test.ts`
```

**Step 3:** Fix + test case added in same PR:

```typescript
// NEW TEST (harness gap filled)
it('should not create duplicate journal entries when applying payment', async () => {
  // Regression test for incident #42
  const invoice = await createInvoice({ amount: 10000 })
  await postInvoice(invoice.id)

  const payment = await paymentService.applyPayment({
    invoiceId: invoice.id,
    amount: 10000,
    accountId: BANK_ACCOUNT_ID
  })

  // Assert: Exactly ONE journal entry for payment
  const entries = await prisma.journalEntry.findMany({
    where: {
      sourceType: 'PAYMENT',
      sourceId: payment.id
    }
  })

  expect(entries).toHaveLength(1) // Not 2
})
```

**Step 4:** Track harness coverage:

```bash
# Weekly report: Incidents → harness cases
npm run harness:coverage-report

# Output:
# - Incidents this month: 3
# - Test cases added: 3
# - Coverage: 100%
# - Gaps remaining: 0
```

**Add to MEMORY.md:**

```markdown
## Harness-Gap Loop

**When production incident occurs:**
1. File issue in `.github/issues/`
2. Investigate root cause
3. Identify missing test case (harness gap)
4. Fix bug + add regression test in same PR
5. Link test to incident # in comments
6. Track coverage weekly

**Goal:** Every incident becomes a permanent test case (never repeat).
```

---

### 7. Deterministic Ordering

**Article Lesson:**

> "Preflight gate must complete before CI fanout"
> "Current-head SHA matching is non-negotiable"
> "Review rerun requests need one canonical writer"

**How We Apply This:**

Document execution order in `/processes:review`:

```markdown
## Execution Order (STRICT)

**Phase 1: Preflight (Fast - <1 min)**
1. Validate file locations (hard-rules.sh)
2. Compute risk tier (risk-policy.json)
3. Type check (npm run typecheck)
4. Validate plan structure (has required sections)

**Phase 2: Agent Review (Slow - 4-8 min)**
5. Run required agents (based on risk tier)
6. Wait for ALL agents to complete
7. Synthesize findings (cross-agent patterns)

**Phase 3: Policy Gate (Fast - <1 min)**
8. Check finding counts vs. risk tier thresholds
9. Verify current-head SHA matches
10. Generate pass/fail verdict

**Phase 4: Remediation (Optional - 2-5 min)**
11. If P1 auto-fixable findings exist → run /processes:auto-fix
12. Push fixes to same branch
13. Restart from Phase 1 (new HEAD)

**Phase 5: Approval (Human)**
14. Present synthesis to user
15. User approves OR requests changes
16. If approved → safe to implement

**NEVER skip phases or reorder.** Each phase validates assumptions for the next.
```

---

### 8. Bot-Only Thread Resolution

**Article Pattern:**

> "After a clean current-head rerun, auto-resolve unresolved threads where all comments are from the review bot. Never auto-resolve human-participated threads."

**How We Apply This:**

After auto-fix completes and rerun passes:

```markdown
## Step 5: Clean Up Stale Findings

After rerun completes with clean result:

1. **Identify resolved findings:**
   - Compare old synthesis (HEAD~1) vs new synthesis (HEAD)
   - Findings present in old but not in new = RESOLVED

2. **Mark as resolved:**
   ```bash
   # Update .reviews/RESOLVED.md
   echo "- [x] P-P1-3: Missing deletedAt filter (auto-fixed in commit abc123)" >> .reviews/RESOLVED.md
   ```

3. **Human-touched findings:**
   - If finding has comments from user → keep in synthesis with "[USER COMMENTED]" marker
   - Do NOT auto-resolve human-touched findings

4. **Final synthesis:**
   - Only show unresolved findings
   - Link to RESOLVED.md for fixed items
```

**Example:**

```markdown
## Resolved Findings (Auto-Fixed)

See `.reviews/RESOLVED.md` for full history.

**This review:**
- P-P1-3: Missing deletedAt filter → Fixed in commit abc123
- P-P1-5: Hardcoded color → Fixed in commit abc123
- P-P1-8: Missing type import → Fixed in commit abc123

**Still open:**
- P-P1-1: Architectural decision (requires user input)
- P-P1-2: Security concern (requires manual review)
```

---

## Summary: Mapping Article Patterns to Our System

| Article Pattern | Our Implementation | Priority | Effort |
|----------------|-------------------|----------|--------|
| 1. Risk-tier contract | `.claude/risk-policy.json` + compute tier in review workflow | P0 | 2h |
| 2. Preflight gate | Pre-commit hook runs policy checks before agents | P0 | 1h |
| 3. Current-HEAD SHA | Add SHA tracking to synthesis front-matter | P1 | 1h |
| 4. Auto-remediation | `/processes:auto-fix` skill for deterministic P1 fixes | P1 | 4h |
| 5. Browser evidence | E2E test manifest + validation for critical UI | P2 | 3h |
| 6. Harness-gap loop | Incident → test case workflow + coverage tracking | P1 | 2h |
| 7. Deterministic order | Document strict phase sequence in workflows | P2 | 1h |
| 8. Bot-only resolution | Auto-resolve fixed findings, preserve human-touched | P2 | 1h |

**Total effort:** 15 hours (across 8 patterns)
**Expected impact:**
- 40% fewer false-positive findings (risk-tier filtering)
- 50% faster review loops (auto-remediation)
- 100% incident coverage (harness-gap loop)

---

## Recommended Priorities for Integration

### Phase 1: Critical Foundations (P0 - 3 hours)
1. **Risk-tier contract** — Define policy, compute tier before review
2. **Preflight gate** — Fast checks before expensive agents

### Phase 2: High-Value Optimizations (P1 - 7 hours)
3. **SHA discipline** — Track review validity by HEAD
4. **Auto-remediation** — Fix deterministic P1 findings
5. **Harness-gap loop** — Convert incidents to test cases

### Phase 3: Quality-of-Life (P2 - 5 hours)
6. **Browser evidence** — E2E manifests for critical UI
7. **Deterministic ordering** — Document strict sequence
8. **Bot resolution** — Clean up fixed findings

---

## Integration with Existing Planning System Upgrade

**Merge into main plan as:**

- **Sprint 0.5:** Risk-tier contract + preflight gate (3h) — BEFORE Sprint 1
- **Sprint 6:** Auto-remediation + SHA tracking (5h) — AFTER Sprint 5
- **Future enhancement:** Harness-gap loop + browser evidence (optional, 5h)

**Total planning system upgrade:**
- Original: 7 hours (5 sprints)
- + Additions: 15 hours (20 items from sessions/frameworks)
- + Article patterns: 8 hours (critical + high-value only)
- **Grand total: 30 hours** (fully comprehensive)

---

_Created: 2026-02-16_
_Source: Ryan Carson article + our planning system analysis_