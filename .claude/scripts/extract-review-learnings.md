# Extract Review Learnings (Workflow Guide)

> **Purpose:** Extract anti-patterns and learnings from code reviews to update MEMORY and guardrails.
> **When to run:** After completing `/processes:review` or during `/processes:eod`

---

## Quick Process

### 1. Read Review Frontmatter

```bash
# Example: Read phase5-reports review
Read docs/reviews/phase5-reports/SUMMARY.md (first 100 lines)
```

Look for the YAML frontmatter between `---` markers.

### 2. Extract Anti-Patterns

From the frontmatter, identify:

```yaml
anti_patterns:
  - id: csv-injection-incomplete
    pattern: "CSV formula-prefix sanitization without quotes"
    files: [report-export.service.ts]
    fix: "Wrap escaped values in double quotes"
    severity: P0
```

### 3. Check if Already in MEMORY

```bash
# Search MEMORY for each anti-pattern
Grep "CSV.*sanitization" memory/ --output_mode=files_with_matches
Grep "server.*client.*mixed" memory/ --output_mode=files_with_matches
```

### 4. Update MEMORY Topic Files

**If pattern NOT in MEMORY**, add to appropriate topic file:

**For bugs/anti-patterns:**
- `memory/debugging-log.md` — Add under relevant section

**For codebase quirks:**
- `memory/codebase-quirks.md` — Add under relevant section

**For API patterns:**
- `memory/api-patterns.md` — Add best practices

**Example update to debugging-log.md:**

```markdown
## CSV Export Issues

### CSV Injection — Incomplete Sanitization (2026-02-17)
**Issue:** Formula-prefixed values get single-quote prefix but are NOT wrapped in quotes.
**Symptom:** CSV column structure breaks (e.g., `"-Revenue, Net"` becomes two columns)
**Fix:** Wrap escaped values in double quotes: `"'${escaped}"`
**Location:** `report-export.service.ts:26-39`
**Pattern:** Always use `"'${escaped}"` not just `'${value}`
**Found in:** Phase 5 Reports review
```

### 5. Update Guardrails (For P0 Issues)

**If severity is P0**, add to `.claude/rules/guardrails.md`:

```markdown
## Explicit Anti-Patterns (NEVER DO)

### CSV Export (Added 2026-02-17)
- ❌ **NEVER sanitize CSV without quotes**
  - WRONG: `value.startsWith('=') ? \`'${value}\` : value`
  - RIGHT: `value.startsWith('=') ? \`"'${escaped}"\` : escaped`
- ❌ **NEVER mix server/client in same module**
  - WRONG: Single file with `@clerk/nextjs/server` AND `window`
  - RIGHT: Split into `server.ts`, `client.ts`, `types.ts`
```

### 6. Update Pre-Flight Checklist (For High-Confidence Issues)

**If issue appears in `high_confidence` (3+ agents)**, add to Pre-Flight Checklist:

```markdown
## Pre-Flight Checklist (MANDATORY)

**Before writing ANY code, Claude MUST:**

...existing items...

12. ✅ **For CSV export: validate sanitization with quotes** (added 2026-02-17)
13. ✅ **For cache usage: ensure ALL mutating services invalidate** (added 2026-02-17)
```

### 7. Note Architecture Strengths

**From `architecture_strengths` frontmatter**, consider creating reusable patterns:

```yaml
architecture_strengths:
  - pattern: "Bounded cache (500 entries, 60s TTL)"
    effectiveness: high
    reuse: true
    location: "report-cache.ts"
```

**Action:** Document in `docs/patterns/` or reference in API conventions:

```markdown
## Caching Patterns

**Bounded cache pattern** (from phase5-reports review):
- Max 500 entries, 60s TTL
- Tenant-scoped keys
- `unref()` timer to prevent process hanging
- See: `report-cache.ts` for reference implementation
```

---

## EOD Integration

When running `/processes:eod`, include:

```markdown
## Review Learnings Integration

**Reviews completed today:**
- phase5-reports (5 P0, 13 P1, 26 P2)

**New anti-patterns discovered:**
- CSV sanitization without quotes (P0) → Added to guardrails.md
- Mixed server/client modules (P0) → Added to guardrails.md
- Window function missing opening balance (P0) → Added to debugging-log.md

**MEMORY updates:**
- debugging-log.md: Added CSV export section
- codebase-quirks.md: Added Next.js bundler server/client split note

**Guardrail updates:**
- Added CSV export anti-patterns
- Added Pre-Flight item: "Validate CSV sanitization with quotes"
```

---

## Audit Integration

When running `/processes:audit`, scan all reviews from past week:

```bash
# Find all reviews from past 7 days
find docs/reviews -name "SUMMARY.md" -mtime -7
```

**Check for:**
1. **Recurring issues** across multiple reviews
2. **Anti-patterns that repeat** despite being in MEMORY (indicates guardrail failure)
3. **Architecture strengths** that should become templates

**Example audit output:**

```markdown
## Review Trend Analysis (Week of 2026-02-17)

**Recurring issues (appeared in 2+ reviews):**
- Hardcoded currency values (phase5-reports, dashboard-redesign)
  → **Action:** Add to Pre-Flight checklist
- Missing loading/error states (onboarding-refactor, phase5-reports)
  → **Action:** Strengthen hook enforcement

**Guardrail violations:**
- Mixed server/client modules (phase5-reports)
  → **Action:** Create hook to detect `@clerk/nextjs/server` + `window` in same file

**Architecture patterns to promote:**
- Bounded cache pattern (phase5-reports) — reuse in other domains
- Streaming export pattern (phase5-reports) — document as standard
```

---

## Reset Integration

When running `/processes:reset`, check recent reviews:

```markdown
**Checking recent reviews for related patterns...**

Found in phase5-reports review (2026-02-17):
- Anti-pattern: "CSV sanitization without quotes"
- Files: report-export.service.ts:26-39
- Fix: Wrap escaped values in `"'${escaped}"`

**Reloading relevant guardrails...**
✅ `.claude/rules/guardrails.md` — CSV export section
✅ `memory/debugging-log.md` — CSV export issues
```

---

## Checklist for Review Learning Extraction

After completing `/processes:review`:

- [ ] Read SUMMARY.md frontmatter
- [ ] For each `anti_patterns` entry:
  - [ ] Check if in MEMORY (Grep)
  - [ ] If new, add to appropriate topic file
  - [ ] If P0, add to guardrails.md
- [ ] For `high_confidence` issues:
  - [ ] Add to Pre-Flight checklist
- [ ] For `architecture_strengths`:
  - [ ] Consider creating reusable pattern doc
- [ ] For `recurring_issues`:
  - [ ] Check if pattern already documented
  - [ ] If not, add to MEMORY
- [ ] Update MEMORY.md summary if significant patterns found

---

*This creates a continuous learning loop: Reviews → Patterns → Memory → Prevention*