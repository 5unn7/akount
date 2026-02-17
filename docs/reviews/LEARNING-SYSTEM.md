# Review Learning System — Continuous Improvement

> **Purpose:** Ensure every code review improves the system's ability to prevent future mistakes.

---

## The Learning Loop

```
┌─────────────────────────────────────────────────────────┐
│                    Code Review                          │
│  (/processes:review with 6 specialized agents)         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Review Summary (SUMMARY.md)                 │
│  - Executive metrics (P0/P1/P2 counts)                  │
│  - YAML frontmatter (machine-readable)                  │
│  - Anti-patterns, recurring issues, strengths           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Learning Extraction (EOD/Audit)                │
│  - Parse frontmatter                                    │
│  - Check if patterns already in MEMORY                  │
│  - Identify new anti-patterns                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Knowledge Update                            │
│  - MEMORY topic files (debugging-log, codebase-quirks)  │
│  - Guardrails (anti-patterns, Pre-Flight checklist)     │
│  - Patterns library (architecture strengths)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Prevention (Next Review)                    │
│  - Agents reference updated guardrails                  │
│  - Pre-Flight checklist catches issues earlier          │
│  - Architecture strengths guide implementation          │
└─────────────────────────────────────────────────────────┘
```

---

## Three Levels of Learning

### Level 1: Tactical (Immediate)
**What:** Fix the bugs found in this review
**Where:** PR fixes, commits
**Lifespan:** This feature only

### Level 2: Strategic (Memory)
**What:** Document patterns to avoid repeating mistakes
**Where:** MEMORY topic files (`debugging-log.md`, `codebase-quirks.md`)
**Lifespan:** This project

### Level 3: Systemic (Guardrails)
**What:** Enforce prevention of entire classes of bugs
**Where:** `.claude/rules/guardrails.md`, Pre-Flight checklist
**Lifespan:** All future work

---

## Machine-Readable Review Format

Every `SUMMARY.md` includes YAML frontmatter:

```yaml
---
review_id: phase5-reports
date: 2026-02-17
verdict: changes_required
agents: [financial, architecture, security, performance, fastify, nextjs]
p0_count: 5
p1_count: 13
p2_count: 26

# NEW ANTI-PATTERNS (add to guardrails)
anti_patterns:
  - id: csv-injection-incomplete
    pattern: "CSV sanitization without quotes"
    files: [report-export.service.ts]
    fix: "Wrap in double quotes"
    severity: P0

# RECURRING ISSUES (appeared 2+ times)
recurring_issues:
  - issue: "Hardcoded currency values"
    occurrences: 2
    domains: [reports]

# ARCHITECTURE WINS (reuse elsewhere)
architecture_strengths:
  - pattern: "Bounded cache with TTL"
    effectiveness: high
    reuse: true

# CROSS-DOMAIN LESSONS
cross_domain_impacts:
  - change: "Cache invalidation"
    affected: [posting.service.ts, journal-entry.service.ts]
    lesson: "ALL GL-mutating services must invalidate cache"

# HIGH CONFIDENCE (3+ agents agree)
high_confidence:
  - issue: "format param bypasses Zod"
    agents: [financial, architecture, security, fastify]
    priority: P1
---
```

**Schema:** `docs/reviews/.meta/summary.schema.json`

---

## Integration with Workflows

### `/processes:eod` (End of Day)

**Current:** Aggregates session captures
**Enhanced:** Also extracts review learnings

```markdown
## Review Learnings (2026-02-17)

**Reviews completed:** phase5-reports (5 P0, 13 P1)

**New anti-patterns discovered (not in MEMORY):**
- CSV sanitization without quotes → Added to guardrails.md
- Mixed server/client modules → Added to codebase-quirks.md

**MEMORY updates:**
- debugging-log.md: Added CSV export section (3 patterns)
- codebase-quirks.md: Added Next.js bundler note

**Guardrail updates:**
- Added 2 CSV export anti-patterns
- Added Pre-Flight item: "Validate CSV sanitization"
```

**How it works:**
1. EOD scans `docs/reviews/` for today's date
2. Reads `SUMMARY.md` frontmatter
3. Checks if `anti_patterns` are in MEMORY
4. Generates update suggestions
5. Prompts user to confirm updates

---

### `/processes:audit` (Weekly Health Check)

**Current:** Analyzes code quality, test coverage
**Enhanced:** Trend analysis across week's reviews

```markdown
## Review Trend Analysis (Week of 2026-02-17)

**3 reviews completed:**
- phase5-reports (5 P0, 13 P1, 26 P2)
- dashboard-redesign (0 P0, 2 P1, 5 P2)
- onboarding-refactor (1 P0, 3 P1, 8 P2)

**Recurring issues (appeared in 2+ reviews):**
- Hardcoded currency values (phase5, dashboard)
  → **Action:** Add to Pre-Flight checklist
- Missing loading/error states (phase5, onboarding)
  → **Action:** Strengthen hook enforcement

**Guardrail violations:**
- Mixed server/client modules (phase5-reports)
  → Despite existing guardrail, still occurred
  → **Action:** Create automated hook check

**Architecture patterns to promote:**
- Bounded cache pattern (phase5) → Document in patterns/
- Streaming export (phase5) → Make standard for large datasets
```

**How it works:**
1. Audit scans all reviews from past 7 days
2. Aggregates `recurring_issues` and `anti_patterns`
3. Identifies patterns that repeat across reviews
4. Flags guardrail violations (pattern in MEMORY but still occurred)
5. Suggests systemic improvements

---

### `/processes:reset` (Context Reload)

**Current:** Reloads context when AI is off-track
**Enhanced:** Checks if mistake matches recent review findings

```markdown
**Reloading context...**

**Checking recent reviews for related patterns...**
✅ Found in phase5-reports (2026-02-17):
   - Anti-pattern: "CSV sanitization without quotes"
   - Files: report-export.service.ts:26-39
   - Fix: Wrap in `"'${escaped}"`

**Reloading relevant knowledge:**
✅ `.claude/rules/guardrails.md` — CSV export section
✅ `memory/debugging-log.md` — CSV export issues

Context reloaded with review learnings applied.
```

**How it works:**
1. Reset identifies current mistake/issue
2. Searches `docs/reviews/` frontmatter for matching `anti_patterns`
3. If match found, loads relevant guardrail/MEMORY section
4. Outputs: "This pattern was flagged in {review}"

---

### `/processes:begin` (Session Start)

**Current:** Shows git status, pending tasks
**Enhanced:** Warns about recent review findings in current domain

```markdown
## Session Context (2026-02-18)

**Domain:** Accounting (reports)

**Recent review findings (phase5-reports, 2026-02-17):**
⚠️  5 P0 blockers found in reports domain
⚠️  Top issue: CSV sanitization without quotes
⚠️  Check docs/reviews/phase5-reports/SUMMARY.md

**New guardrails since last session:**
- CSV export: wrap escaped values in quotes
- Cache invalidation: ALL GL-mutating services must invalidate
```

---

## Knowledge Base Structure

```
docs/reviews/
├── README.md                    # Index of all reviews
├── phase5-reports/              # One dir per review
│   ├── SUMMARY.md               # ⭐ Machine-readable frontmatter
│   ├── DETAILED.md              # Full findings
│   └── agents/                  # Individual agent reports
├── .meta/
│   ├── summary.schema.json      # Validation schema
│   └── LEARNING-INTEGRATION.md  # This architecture doc
└── .template/
    └── SUMMARY.md               # Template with frontmatter

memory/
├── MEMORY.md                    # High-level index
├── debugging-log.md             # Bugs, solutions, anti-patterns
├── codebase-quirks.md           # Project-specific gotchas
└── api-patterns.md              # Established patterns

.claude/rules/
├── guardrails.md                # Anti-patterns, Pre-Flight checklist
├── workflows.md                 # Skill integration points
└── ...

.claude/scripts/
└── extract-review-learnings.md  # Workflow guide for extraction
```

---

## Example: Phase 5 Learning Extraction

### 1. Review Completed (2026-02-17)
- 6 agents ran: financial, architecture, security, performance, fastify, nextjs
- Found: 5 P0, 13 P1, 26 P2
- Created: `docs/reviews/phase5-reports/SUMMARY.md` with frontmatter

### 2. EOD Scans Review
```bash
# Read frontmatter
Read docs/reviews/phase5-reports/SUMMARY.md (lines 1-100)

# Check if patterns in MEMORY
Grep "CSV.*sanitization" memory/ --output_mode=files_with_matches
→ NOT FOUND

# Extract anti-patterns
3 new anti-patterns discovered:
- csv-injection-incomplete (P0)
- server-client-mixed-module (P0)
- missing-entityScoped-flag (P0)
```

### 3. MEMORY Updated
```markdown
# memory/debugging-log.md

## CSV Export Issues (Added 2026-02-17)

### CSV Injection — Incomplete Sanitization
**Issue:** Formula-prefixed values sanitized but not quoted
**Fix:** `"'${escaped}"` not `'${value}`
**Location:** report-export.service.ts:26-39
**Found in:** phase5-reports review
```

### 4. Guardrails Updated
```markdown
# .claude/rules/guardrails.md

## Explicit Anti-Patterns (NEVER DO)

### CSV Export (Added 2026-02-17)
- ❌ **NEVER sanitize CSV without quotes**
  - WRONG: `'${value}`
  - RIGHT: `"'${escaped}"`
```

### 5. Next Review
- Agent references updated guardrail
- Pre-Flight checklist catches CSV issues earlier
- Pattern doesn't repeat

---

## Metrics for Success

**Leading Indicators:**
- New anti-patterns added to guardrails per week
- % of review findings already in MEMORY (should decrease over time)
- Time to extract learnings from review (target: <10 min)

**Lagging Indicators:**
- Repeat issues across reviews (should decrease)
- P0 count trends (should decrease as guardrails strengthen)
- % of issues caught by Pre-Flight vs agents (should shift to Pre-Flight)

---

## Implementation Status

- [x] Machine-readable frontmatter schema
- [x] Phase 5 review annotated with frontmatter
- [x] Template with frontmatter
- [x] Learning extraction workflow guide
- [x] Integration points documented (EOD, Audit, Reset, Begin)
- [ ] EOD automated frontmatter parsing
- [ ] Audit trend analysis across reviews
- [ ] Reset pattern matching
- [ ] Begin domain-specific warnings
- [ ] Hook to validate frontmatter on commit

---

*Every review makes the next review better. Every mistake is learned from exactly once.*
