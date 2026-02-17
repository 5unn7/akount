# Review Learning Integration

> **Purpose:** Ensure review findings feed back into guardrails, memory, and workflows to prevent repeat mistakes.

---

## Learning Feedback Loop

```
Review Findings
    ↓
Extract Patterns
    ↓
Update System Knowledge
    ↓
Prevent Future Issues
```

---

## 1. Structured Review Metadata (Machine-Readable)

Each `SUMMARY.md` should include a **frontmatter section** for automated processing:

```yaml
---
review_id: phase5-reports
date: 2026-02-17
branch: feature/phase5-reports
verdict: changes_required
agents: [financial, architecture, security, performance, fastify, nextjs]
p0_count: 5
p1_count: 13
p2_count: 26
fix_effort_hours: 10

# Learning categories (for automated extraction)
anti_patterns:
  - id: csv-injection-incomplete
    pattern: "CSV sanitization without quotes"
    files: [report-export.service.ts]
    fix: "Wrap escaped values in double quotes"

  - id: server-client-mixed-module
    pattern: "Single file mixing server/client code"
    files: [reports.ts]
    fix: "Split into server.ts, client.ts, types.ts"

  - id: missing-tenant-isolation
    pattern: "Entity-scoped models without tenantId filter"
    files: [data-export.service.ts]
    fix: "Add entityScoped: true to table configs"

recurring_issues:
  - issue: "Hardcoded currency values"
    occurrences: 3
    domains: [reports, invoicing]

  - issue: "Missing Zod validation for query params"
    occurrences: 7
    domains: [reports]

architecture_strengths:
  - pattern: "tenantScopedQuery wrapper"
    effectiveness: high
    reuse: true

  - pattern: "Bounded cache with TTL"
    effectiveness: high
    reuse: true

cross_domain_impacts:
  - change: "Report cache invalidation"
    affected: [posting.service.ts, journal-entry.service.ts]
    lesson: "Cache invalidation must be in ALL services that mutate GL data"
---
```

---

## 2. Automated Knowledge Update Workflows

### A. Update MEMORY Topic Files

**Trigger:** After review synthesis completes
**Script:** `.claude/scripts/extract-review-learnings.sh`

```bash
#!/bin/bash
# Extract anti-patterns from review and update MEMORY

REVIEW_DIR="$1"  # e.g., docs/reviews/phase5-reports

# Parse SUMMARY.md frontmatter
yq eval '.anti_patterns[] | "- " + .pattern + " → " + .fix' "$REVIEW_DIR/SUMMARY.md"

# Append to MEMORY/debugging-log.md
echo "### $(date +%Y-%m-%d) - Review: $REVIEW_DIR" >> memory/debugging-log.md
yq eval '.anti_patterns[]' "$REVIEW_DIR/SUMMARY.md" >> memory/debugging-log.md
```

**Result:** `memory/debugging-log.md` auto-updates with new anti-patterns

---

### B. Update Guardrails

**When:** P0/P1 issues reveal missing guardrail checks
**Target:** `.claude/rules/guardrails.md`

**Example from Phase 5 review:**

```markdown
## Explicit Anti-Patterns (NEVER DO)

### TypeScript
...

### Design System
...

### CSV Export (ADDED 2026-02-17 from phase5-reports review)
- ❌ **NEVER sanitize CSV without quotes** — wrap in `"'${escaped}"`
  - WRONG: `value.startsWith('=') ? `'${value}` : value`
  - RIGHT: `value.startsWith('=') ? `"'${escaped}"` : escaped`
- ❌ **NEVER mix server/client in same module**
  - WRONG: Single `reports.ts` with both `@clerk/nextjs/server` and `window`
  - RIGHT: Split into `reports.ts` (server), `reports-client.ts`, `reports-types.ts`
```

---

### C. Update Pre-Flight Checklist

**When:** High-confidence issues (3+ agents agree)
**Target:** `.claude/rules/guardrails.md` → Pre-Flight Checklist

**Example:**

```markdown
## Pre-Flight Checklist (MANDATORY)

**Before writing ANY code, Claude MUST:**

1. ✅ **Classify the change**
...
12. ✅ **For CSV export: quote formula-prefixed values** (added 2026-02-17)
13. ✅ **For multi-entity reports: validate currency match** (added 2026-02-17)
14. ✅ **For cache usage: ensure ALL mutating services invalidate** (added 2026-02-17)
```

---

## 3. Integration with Workflows

### A. `/processes:eod` Integration

**Current:** EOD aggregates session captures
**Enhancement:** Also scan `docs/reviews/` for today's reviews

**Workflow:**
```
1. EOD scans docs/reviews/ for date=today
2. Extracts frontmatter from SUMMARY.md
3. Checks if anti_patterns are already in MEMORY
4. If new, prompts: "New anti-patterns found. Update MEMORY/guardrails?"
5. Auto-generates update suggestions
```

**EOD Output:**
```markdown
## Review Findings (Phase 5)

**Anti-patterns discovered (not in MEMORY):**
- CSV sanitization without quotes (report-export.service.ts)
- Mixed server/client module (reports.ts)

**Suggested MEMORY updates:**
- Add to debugging-log.md under "CSV Export Patterns"
- Add to codebase-quirks.md under "Next.js Bundler Issues"

**Suggested Guardrail updates:**
- Add CSV export rules to guardrails.md
- Add to Pre-Flight checklist: "Validate CSV sanitization"
```

---

### B. `/processes:audit` Integration

**Current:** Weekly health audit
**Enhancement:** Scan all reviews from past week, identify trends

**Audit checks:**
```
1. Recurring issues across multiple reviews
2. Anti-patterns that repeat despite being in MEMORY
3. Guardrails that were violated (need stronger enforcement?)
4. Architecture strengths that should become templates
```

**Audit Output:**
```markdown
## Review Trend Analysis (Week of 2026-02-17)

**Recurring issues (appeared in 2+ reviews):**
- Hardcoded currency values (phase5-reports, dashboard-redesign)
- Missing loading/error states (onboarding-refactor, phase5-reports)

**Guardrail violations:**
- Mixed server/client modules (phase5-reports) — guardrail exists but was missed

**Action items:**
- [ ] Strengthen CSV export guardrail (add hook check?)
- [ ] Create hook to detect mixed server/client modules
- [ ] Add MEMORY entry for currency hardcoding pattern
```

---

### C. `/processes:reset` Integration

**Current:** Reloads context when AI is off-track
**Enhancement:** Check if current mistake matches recent review findings

**Workflow:**
```
1. User triggers /processes:reset
2. Reset checks: "What was the last action/mistake?"
3. Searches docs/reviews/ frontmatter for matching anti_pattern
4. If match found: "This was flagged in {review}. See {file}:{line}"
5. Loads relevant guardrail/MEMORY section
```

**Example:**
```
User: "Reset context, you're using floats for money again"

Reset workflow:
1. Searches reviews for anti_pattern matching "float"
2. Finds: "Missing tenant isolation in data-export" doesn't match
3. Searches MEMORY/debugging-log.md
4. Finds: "❌ Using floats for money — ALWAYS integer cents"
5. Reloads financial-rules.md
6. Outputs: "Reloaded. Integer cents rule re-confirmed from MEMORY."
```

---

## 4. Review Summary Parser (JSON Schema)

Create a canonical schema for review summaries:

**File:** `docs/reviews/.meta/summary.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Review Summary Schema",
  "type": "object",
  "required": ["review_id", "date", "verdict", "findings"],
  "properties": {
    "review_id": { "type": "string", "description": "Unique review identifier" },
    "date": { "type": "string", "format": "date" },
    "branch": { "type": "string" },
    "verdict": { "enum": ["approved", "changes_required", "blocked"] },
    "agents": { "type": "array", "items": { "type": "string" } },
    "p0_count": { "type": "integer" },
    "p1_count": { "type": "integer" },
    "p2_count": { "type": "integer" },
    "fix_effort_hours": { "type": "number" },

    "anti_patterns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "pattern": { "type": "string" },
          "files": { "type": "array", "items": { "type": "string" } },
          "fix": { "type": "string" },
          "severity": { "enum": ["P0", "P1", "P2"] }
        }
      }
    },

    "recurring_issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "issue": { "type": "string" },
          "occurrences": { "type": "integer" },
          "domains": { "type": "array", "items": { "type": "string" } }
        }
      }
    },

    "architecture_strengths": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "pattern": { "type": "string" },
          "effectiveness": { "enum": ["high", "medium", "low"] },
          "reuse": { "type": "boolean" }
        }
      }
    },

    "cross_domain_impacts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "change": { "type": "string" },
          "affected": { "type": "array", "items": { "type": "string" } },
          "lesson": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 5. Workflow Automation Scripts

### A. Extract Review Learnings

**File:** `.claude/scripts/extract-review-learnings.sh`

```bash
#!/bin/bash
# Extract learnings from review summary and suggest updates

REVIEW_DIR="$1"
SUMMARY="$REVIEW_DIR/SUMMARY.md"

if [ ! -f "$SUMMARY" ]; then
  echo "Error: SUMMARY.md not found in $REVIEW_DIR"
  exit 1
fi

echo "📚 Extracting learnings from $REVIEW_DIR..."

# Extract anti-patterns (assumes YAML frontmatter)
echo "## Anti-Patterns Found:"
yq eval '.anti_patterns[] | "- " + .pattern + " (Fix: " + .fix + ")"' "$SUMMARY" 2>/dev/null || echo "No frontmatter found"

# Check if anti-patterns are in MEMORY
echo ""
echo "## Checking MEMORY..."
for pattern in $(yq eval '.anti_patterns[].pattern' "$SUMMARY" 2>/dev/null); do
  if grep -q "$pattern" memory/*.md 2>/dev/null; then
    echo "✅ Already in MEMORY: $pattern"
  else
    echo "⚠️  NEW pattern (not in MEMORY): $pattern"
  fi
done

# Suggest MEMORY updates
echo ""
echo "## Suggested MEMORY Updates:"
echo "Add to memory/debugging-log.md:"
yq eval '.anti_patterns[] | "### " + .pattern + "\n**Fix:** " + .fix + "\n**Found in:** " + (.files | join(", "))' "$SUMMARY" 2>/dev/null
```

### B. Validate Review Frontmatter

**File:** `.claude/scripts/validate-review-summary.sh`

```bash
#!/bin/bash
# Validate SUMMARY.md frontmatter against schema

SUMMARY="$1"
SCHEMA="docs/reviews/.meta/summary.schema.json"

# Extract frontmatter (between --- markers)
awk '/^---$/,/^---$/' "$SUMMARY" | sed '1d;$d' > /tmp/frontmatter.yaml

# Convert to JSON and validate
yq eval -o=json /tmp/frontmatter.yaml | \
  ajv validate -s "$SCHEMA" -d -

if [ $? -eq 0 ]; then
  echo "✅ Review summary frontmatter is valid"
else
  echo "❌ Review summary frontmatter validation failed"
  exit 1
fi
```

---

## 6. Integration Points Summary

| Workflow | Integration | Benefit |
|----------|-------------|---------|
| **EOD** | Scan today's reviews, extract anti-patterns | Auto-update MEMORY with new learnings |
| **Audit** | Trend analysis across week's reviews | Identify recurring issues, strengthen guardrails |
| **Reset** | Match current mistake to review findings | Faster recovery, contextual reload |
| **Review** | Write frontmatter when creating SUMMARY.md | Enable all automation above |
| **Begin** | Check recent reviews for relevant warnings | Proactive prevention |

---

## 7. Phase 5 Example (Annotated SUMMARY.md)

```yaml
---
review_id: phase5-reports
date: 2026-02-17
branch: feature/phase5-reports
verdict: changes_required
agents: [financial, architecture, security, performance, fastify, nextjs]
p0_count: 5
p1_count: 13
p2_count: 26
fix_effort_hours: 10

anti_patterns:
  - id: csv-injection-incomplete
    pattern: "CSV formula-prefix sanitization without quotes"
    files: [apps/api/src/domains/accounting/services/report-export.service.ts]
    fix: "Wrap escaped values in double quotes: \"'${escaped}\""
    severity: P0
    line: 26-39

  - id: server-client-mixed-module
    pattern: "Single file mixing server-only and client-only code"
    files: [apps/web/src/lib/api/reports.ts]
    fix: "Split into reports.ts (server), reports-client.ts (client), reports-types.ts (shared)"
    severity: P0
    line: 13,52

  - id: missing-entityScoped-flag
    pattern: "Entity-scoped models in data export without entityScoped flag"
    files: [apps/api/src/domains/system/services/data-export.service.ts]
    fix: "Add entityScoped: true to clients/vendors table configs"
    severity: P0
    line: 59-73

recurring_issues:
  - issue: "Hardcoded currency values in components"
    occurrences: 2
    domains: [reports]
    files: [pl-report-view.tsx, bs-report-view.tsx]

  - issue: "Query params bypass Zod validation"
    occurrences: 7
    domains: [reports]
    pattern: "Routes use 'as XxxQuery & { format?: string }' cast"

architecture_strengths:
  - pattern: "tenantScopedQuery wrapper with runtime SQL assertion"
    effectiveness: high
    reuse: true
    location: "apps/api/src/lib/tenant-scoped-query.ts"

  - pattern: "Bounded cache with 500 entries, 60s TTL, tenant-scoped keys"
    effectiveness: high
    reuse: true
    location: "apps/api/src/domains/accounting/services/report-cache.ts"

cross_domain_impacts:
  - change: "Report cache invalidation"
    affected:
      - apps/api/src/domains/accounting/services/posting.service.ts
      - apps/api/src/domains/accounting/services/journal-entry.service.ts
    lesson: "Any service that mutates GL data MUST call reportCache.invalidate()"

  - change: "Multi-entity currency validation"
    affected: [all report endpoints]
    lesson: "Multi-entity reports require upfront currency validation"
---

# Phase 5 Reports — Review Summary

...rest of SUMMARY.md...
```

---

## 8. Implementation Checklist

- [ ] Add frontmatter to `docs/reviews/.template/SUMMARY.md`
- [ ] Create `summary.schema.json` for validation
- [ ] Write `extract-review-learnings.sh` script
- [ ] Write `validate-review-summary.sh` script
- [ ] Update `/processes:eod` to scan reviews
- [ ] Update `/processes:audit` to analyze review trends
- [ ] Update `/processes:reset` to check review findings
- [ ] Update `/processes:review` to auto-generate frontmatter
- [ ] Add phase5-reports frontmatter (retroactive)
- [ ] Document in CLAUDE.md

---

*This creates a continuous learning loop: Reviews → Patterns → Memory → Prevention*
