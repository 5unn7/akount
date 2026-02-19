# AI Self-Reflection System

> **Purpose:** Prevent AI loops, catch repeated mistakes, and create self-improving feedback loops
> **Created:** 2026-02-19
> **Integrated into:** `/processes:end-session` and `/processes:eod`

---

## Problem Statement

**Before:** AI agents would sometimes:
- Get stuck in loops (retry same failing approach 3-4 times)
- Repeat the same mistake across multiple sessions
- Violate invariants without realizing it
- Waste context reading entire files repeatedly
- Not check MEMORY for prior learnings

**Why it happened:**
- No mechanism for AI to reflect on its own behavior
- No cross-session pattern detection
- Feedback only came from users (reactive, not proactive)

---

## Solution: Multi-Layer Self-Reflection

### Layer 1: End-Session Self-Check (/processes:end-session)

**When:** Before closing each Claude Code instance

**What AI checks:**

1. **Pre-flight checklist compliance**
   - Did I check task availability before coding?
   - Did I read files before editing?
   - Did I search for patterns via Grep?
   - Did I use offset/limit for large files?
   - Did I verify patterns existed (not hallucinate)?
   - Did I check MEMORY topic files?

2. **Invariant violation detection**
   - All queries included tenantId filter
   - All money fields used integer cents
   - All financial records soft-deleted
   - All page.tsx files have loading/error states
   - No mixing server imports with 'use client'
   - Used design tokens (no hardcoded colors)
   - Used structured logging (no console.log)
   - No `: any` types

3. **Loop detection**
   - Did I retry the same failing approach multiple times?
   - Did I make the same error repeatedly?
   - Did I ignore earlier feedback?

4. **Self-improvement**
   - What would I do differently next time?
   - Specific improvements based on mistakes

5. **Context efficiency grading**
   - File reads: Efficient / Mixed / Wasteful
   - Pattern verification: Always / Mostly / Often assumed
   - Memory usage: Checked first / Sometimes / Never
   - Overall grade: A / B / C / D

**Output:** Session file with self-reflection data (`docs/archive/sessions/YYYY-MM-DD-HHMM-session.md`)

---

### Layer 2: Daily Aggregation (/processes:eod)

**When:** Once at end of day (after all sessions)

**What it does:**

1. **Aggregate metrics** across all session files from today:
   - Count invariant violations by type
   - Count loops/repeated mistakes
   - Identify common "what would I do differently" themes
   - Calculate average context efficiency grade

2. **Pattern detection:**
   - If 3+ sessions forgot tenantId → Flag in MEMORY.md
   - If 3+ sessions didn't use offset/limit → Update debugging-log.md
   - If same mistake across multiple sessions → Update guardrails.md

3. **Auto-remediation:**
   - Update MEMORY topic files with detected patterns
   - Strengthen guardrails.md rules for repeated violations
   - Add reminders to MEMORY.md for common mistakes

4. **Visibility:**
   - Adds "Session Quality Insights" section to STATUS.md
   - Shows daily metrics: violations, compliance %, efficiency grade
   - Lists common patterns and actions taken

**Output:** Updated STATUS.md with quality insights

---

## Benefits

### 1. Loop Prevention
**Before:** AI retries failing approach 3-4 times before user intervenes
**After:** AI detects loop in self-reflection, notes it, avoids next time

**Example:**
```markdown
### Loops or Repeated Mistakes Detected?
- Read account.service.ts 3 times without offset/limit (1350 wasted lines)
- Pattern: Each time I needed to check a function, re-read entire file

### What Would I Do Differently Next Time?
- Use offset/limit from the start — check file length first
```

### 2. Cross-Session Learning
**Before:** Same mistake repeated across multiple sessions (no memory)
**After:** EOD aggregates patterns, updates MEMORY topic files

**Example:**
```markdown
## Session Quality Insights (Today)
Common Patterns:
- 4 sessions forgot tenantId filter → Updated MEMORY.md with reminder
- 3 sessions used hardcoded colors → Added to guardrails.md
```

### 3. Invariant Enforcement
**Before:** AI violates invariants, only caught in code review or production
**After:** AI self-checks against 9 key invariants at end of every session

**Example:**
```markdown
### Did I Violate Any Invariants?
- [ ] All queries included tenantId filter — VIOLATION: forgot in listAccounts()
- [x] All money fields used integer cents ✅
- [x] All page.tsx files have loading.tsx ✅
```

### 4. Context Efficiency
**Before:** AI wastes tokens reading entire files repeatedly
**After:** AI grades itself on efficiency, notes wasteful patterns

**Example:**
```markdown
### Context Efficiency Score (Self-Grade)
- File reads: Wasteful (read 450-line file 3 times)
- Overall grade: C (needs improvement)

### What Would I Do Differently?
- Use offset/limit from the start to avoid redundant reads
```

---

## Workflow Integration

### End-Session Flow (per instance)

```
1. Update TASKS.md "Active Now" table (30s)
2. Auto-gather from git (30s)
3. Build session summary (1 min) ← includes self-reflection
4. Commit session file (30s)

Total: ~2 minutes (was ~2 min before, self-reflection adds ~0s due to parallel thinking)
```

### EOD Flow (once per day)

```
1. Gather metrics (30s)
2. Aggregate session self-reflections (30s) ← NEW
3. Regenerate STATUS.md with quality insights (30s)
4. Commit (30s)

Total: ~2 minutes (was ~90s before, +30s for aggregation)
```

---

## Example Session File

See `docs/archive/sessions/EXAMPLE-session-with-reflection.md` for a complete example.

**Key sections:**
- "Self-Reflection (AI Agent Quality Check)" with 5 subsections
- Pre-flight checklist with checkboxes
- Invariant violations with ✅/❌ indicators
- Loop detection with specific examples
- Context efficiency grade with rationale

---

## Metrics to Track (Daily)

Added to STATUS.md via EOD:

| Metric | Status Logic |
|--------|-------------|
| Invariant violations | ✅ 0 / ⚠️ 1-2 / ❌ 3+ |
| Pre-flight compliance | ✅ 90%+ / ⚠️ 70-89% / ❌ <70% |
| Context efficiency avg | ✅ A-B / ⚠️ C / ❌ D |
| Loops detected | ✅ 0 / ⚠️ 1-2 / ❌ 3+ |

---

## Expected Outcomes

**Week 1:**
- AI starts catching its own loops
- Invariant violations drop from ~2/day to <1/day
- Context efficiency improves (more offset/limit usage)

**Week 2:**
- Common patterns identified and added to MEMORY
- Cross-session learning kicks in (same mistake not repeated)
- STATUS.md shows improvement in quality metrics

**Week 4:**
- Self-reflection becomes habitual
- Quality metrics stabilize at high levels
- MEMORY topic files become comprehensive reference

---

## Future Enhancements (Not Implemented Yet)

1. **Severity scoring** — Grade violations by impact (P0/P1/P2)
2. **Trend analysis** — Track quality metrics over time, show graphs
3. **Agent comparison** — Compare different AI instances' quality scores
4. **Auto-guardrails** — After 5 violations of same type, auto-add to guardrails.md
5. **Pre-session reminders** — Show "you did X wrong yesterday" at session start

---

_~200 lines. Self-aware AI. Feedback loops. Continuous improvement._
