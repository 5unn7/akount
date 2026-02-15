---
name: processes:audit
description: Weekly health audit — context freshness, code quality, production readiness
argument-hint: "[optional: focus area like 'context', 'security', 'performance']"
aliases:
  - audit
  - weekly-audit
  - health-check
keywords:
  - audit
  - health
  - review
  - weekly
  - readiness
---

# Workflow: Weekly Audit

Brutally honest weekly health check. Treats the codebase like it needs to serve a million users tomorrow. No flattery, no hand-waving, no "looks good overall."

**Persona:** A battle-scarred CTO who has shipped fintech products to millions of users and has zero patience for "we'll fix it later." Everything gets graded. Everything gets a verdict.

**When to run:** Weekly (Sunday/Monday), or after major feature completions.

---

## Principles

1. **Conservative:** Only recommend changes that are clearly needed. No refactoring for refactoring's sake.
2. **Specific:** Every finding has a file path, line number, and concrete fix. No vague "improve error handling."
3. **Prioritized:** P0 (ship-blocking) through P3 (nice-to-have). Defend every rating.
4. **Honest:** If something is bad, say it's bad. If the architecture won't scale, say so. If a decision was wrong, say so.
5. **Actionable:** Every section ends with numbered action items, estimated effort, and suggested owner (human vs AI).

---

## Phase 1: Context Freshness Audit (2 minutes)

Check if the AI context system is accurate. Stale context = wrong assumptions = wrong code.

### 1A. Read all context files

Read these files in parallel:

- `CLAUDE.md` (root)
- `apps/api/CLAUDE.md`
- `apps/web/CLAUDE.md`
- `packages/db/CLAUDE.md`
- All `.claude/rules/*.md`
- `MEMORY.md` (auto memory directory)
- `docs/context-map.md`

### 1B. Cross-reference against reality

Run these checks:

```bash
# Actual API route files
find apps/api/src/domains -name "*.ts" -path "*/routes/*" | sort

# Actual services
find apps/api/src/domains -name "*.service.ts" | sort

# Actual frontend pages
find apps/web/src/app -name "page.tsx" | sort

# Actual test files and count
find apps/api -name "*.test.ts" | wc -l
grep -r "it(" apps/api --include="*.test.ts" -l | xargs grep -c "it(" | awk -F: '{sum+=$2} END {print sum}'

# Prisma model count
grep "^model " packages/db/prisma/schema.prisma | wc -l

# Schema enums
grep "^enum " packages/db/prisma/schema.prisma | wc -l
```

### 1C. Staleness report

For each context file, report:

| File | Last Updated | Accuracy | Verdict |
|------|-------------|----------|---------|
| CLAUDE.md | date | X/10 | FRESH / STALE / WRONG |
| apps/api/CLAUDE.md | date | X/10 | ... |
| ... | ... | ... | ... |

**Accuracy criteria:**
- Endpoint counts match reality?
- Test counts match reality?
- Domain status (built/stub) accurate?
- File paths still valid?
- Referenced files exist?

### 1D. Line budget check

Calculate total always-loaded context (lines) and compare to last audit:

```
Always-loaded: root CLAUDE.md + global rules
API context: always-loaded + API rules + apps/api/CLAUDE.md
Frontend context: always-loaded + frontend rules + apps/web/CLAUDE.md
```

Flag if always-loaded exceeds 500 lines. Flag if any work context exceeds 1,200 lines.

### 1E. Redundancy scan

Check for content that appears in multiple always-loaded files. Flag duplicates.

**Output:** Context Freshness Score (0-100) with specific stale items listed.

---

## Phase 2: Codebase Health (3 minutes)

### 2A. Test coverage analysis

Run test suite and analyze:

```bash
# Run tests
cd apps/api && npx vitest run --reporter=verbose 2>&1

# Count tests by domain
for domain in banking accounting overview system ai planning; do
  echo "$domain: $(grep -r 'it(' apps/api/src/domains/$domain --include='*.test.ts' -c 2>/dev/null | awk -F: '{sum+=$2} END {print sum+0}')"
done
```

**Grade criteria:**
- < 50% of endpoints have tests → F
- 50-70% → D
- 70-85% → C
- 85-95% → B
- 95%+ → A

Check specifically:
- [ ] Every service function has unit tests
- [ ] Every route has integration tests
- [ ] Financial invariant assertions present (integer cents, soft delete, tenant isolation, balanced entries, source preservation)
- [ ] Edge cases tested (empty results, invalid IDs, missing tenant)
- [ ] Error paths tested (400, 401, 403, 404, 500)

### 2B. TypeScript strictness

```bash
# Check for 'any' types
grep -rn ": any" apps/api/src apps/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test." | wc -l

# Check for @ts-ignore / @ts-expect-error
grep -rn "@ts-ignore\|@ts-expect-error" apps/api/src apps/web/src --include="*.ts" --include="*.tsx" | wc -l

# Check for non-null assertions
grep -rn "!\." apps/api/src --include="*.ts" | grep -v node_modules | grep -v ".test." | head -20
```

**Grade:** Count of type safety violations. Zero is the target.

### 2C. Dead code and file bloat

```bash
# Large files (>400 lines)
find apps/api/src apps/web/src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20

# Unused exports (heuristic: exported but never imported elsewhere)
# Check for files that may have grown too large
```

Flag files over 400 lines for potential splitting.

### 2D. Dependency health

```bash
# Check for outdated packages
npm outdated 2>/dev/null | head -20

# Check for security vulnerabilities
npm audit 2>/dev/null | tail -5
```

**Output:** Codebase Health Score (0-100) with specific findings.

---

## Phase 3: Security Posture (2 minutes)

Launch `security-sentinel` agent with full codebase scope. Additionally check:

### 3A. Tenant isolation coverage

```bash
# Find all Prisma queries that might be missing tenantId
grep -rn "prisma\." apps/api/src/domains --include="*.ts" | grep -v ".test." | grep -v "tenantId\|ctx\." | head -30

# Find findFirst/findMany without tenant filter
grep -rn "findFirst\|findMany\|findUnique" apps/api/src/domains --include="*.ts" | grep -v ".test." | grep -v "tenantId" | head -20
```

Every hit is a potential P0 security issue. Zero tolerance.

### 3B. Authentication gaps

```bash
# Routes without auth middleware
grep -rn "fastify\.\(get\|post\|patch\|put\|delete\)" apps/api/src/domains --include="*.ts" | grep -v ".test." | head -30
```

Cross-reference with middleware chain registration. Flag any unprotected routes.

### 3C. Input validation gaps

```bash
# Routes without Zod schema validation
grep -rn "fastify\.\(post\|patch\|put\)" apps/api/src/domains --include="*.ts" | grep -v ".test." | grep -v "schema" | head -20
```

### 3D. Secrets and sensitive data

```bash
# Check for hardcoded secrets
grep -rn "password\|secret\|api_key\|apiKey\|token" apps/api/src apps/web/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".test." | grep -v "// \|type \|interface " | head -20

# Check .gitignore covers .env
grep ".env" .gitignore
```

**Output:** Security Score (0-100). Any P0 finding = score capped at 30.

---

## Phase 4: Financial Integrity (2 minutes)

Launch `financial-data-validator` agent. Additionally check:

### 4A. Float contamination scan

```bash
# Any Float types in Prisma schema for money fields
grep -n "Float" packages/db/prisma/schema.prisma | grep -i "amount\|balance\|total\|price\|cost\|rate"

# Any floating point money in TypeScript
grep -rn "amount.*: number\|balance.*: number\|total.*: number" apps/api/src --include="*.ts" | grep -v ".test." | grep -v "Int\|cents\|integer" | head -10
```

Zero tolerance. Any float money = P0.

### 4B. Soft delete enforcement

```bash
# Hard deletes in code
grep -rn "\.delete(" apps/api/src/domains --include="*.ts" | grep -v ".test." | grep -v "softDelete\|deletedAt" | head -10

# Financial models missing deletedAt
grep -A5 "^model Invoice\|^model Bill\|^model Payment\|^model JournalEntry\|^model Account\|^model Transaction" packages/db/prisma/schema.prisma | grep -v "deletedAt"
```

### 4C. Journal entry balance validation

Check that every journal entry creation validates debits === credits before committing.

### 4D. Source preservation

Check that journal entry creation from documents captures sourceType, sourceId, sourceDocument.

**Output:** Financial Integrity Score (0-100). Any violation = score capped at 0.

---

## Phase 5: Architecture & Scale Readiness (2 minutes)

Launch `architecture-strategist` agent. Think from million-user perspective:

### 5A. N+1 query detection

```bash
# Look for loops that contain Prisma queries
grep -B5 -A5 "for.*of\|\.forEach\|\.map" apps/api/src/domains --include="*.ts" -r | grep -A3 "prisma\." | head -30
```

### 5B. Missing indexes

Cross-reference common query patterns with Prisma schema indexes. Flag queries that filter by fields without indexes.

### 5C. Error handling coverage

```bash
# try/catch coverage in services
grep -rn "async function" apps/api/src/domains --include="*.service.ts" | wc -l
grep -rn "try {" apps/api/src/domains --include="*.service.ts" | wc -l
```

Not every function needs try/catch (let it bubble), but external calls (DB, APIs) should handle failures.

### 5D. Rate limiting and abuse prevention

Check for rate limiting on public-facing endpoints. Check for pagination on list endpoints (no unbounded queries).

### 5E. Logging and observability

```bash
# Structured logging presence
grep -rn "logger\.\|console\.log\|console\.error" apps/api/src --include="*.ts" | grep -v ".test." | grep -v node_modules | head -20
```

Production apps need structured logging, not console.log. Flag any console.log in production code.

**Output:** Architecture Score (0-100) with specific scale risks.

---

## Phase 6: Production Readiness Checklist (1 minute)

Hard yes/no for each:

| Category | Check | Status |
|----------|-------|--------|
| **Auth** | Clerk JWT verified on all protected routes | YES/NO |
| **Auth** | RBAC enforcement matches design (roles) | YES/NO |
| **Data** | All money is integer cents | YES/NO |
| **Data** | All journal entries validate balance | YES/NO |
| **Data** | All queries filter by tenantId | YES/NO |
| **Data** | All financial deletes are soft | YES/NO |
| **API** | All inputs validated with Zod | YES/NO |
| **API** | All list endpoints paginated | YES/NO |
| **API** | Rate limiting configured | YES/NO |
| **API** | Error responses are consistent format | YES/NO |
| **Frontend** | Loading states for all async pages | YES/NO |
| **Frontend** | Error boundaries for all routes | YES/NO |
| **Frontend** | Forms validate before submit | YES/NO |
| **Infra** | Environment variables documented | YES/NO |
| **Infra** | Database migrations reversible | YES/NO |
| **Infra** | Health check endpoint exists | YES/NO |
| **Infra** | Structured logging (not console.log) | YES/NO |
| **Testing** | >80% endpoint coverage | YES/NO |
| **Testing** | Financial invariants tested | YES/NO |
| **Testing** | Tenant isolation tested | YES/NO |

**Production Readiness:** X/20 checks passing.

---

## Phase 7: Brutal Verdict

### Overall Scores

```
CONTEXT FRESHNESS:      XX/100
CODEBASE HEALTH:        XX/100
SECURITY POSTURE:       XX/100
FINANCIAL INTEGRITY:    XX/100
ARCHITECTURE:           XX/100
PRODUCTION READINESS:   XX/20 checks

OVERALL GRADE:          [A/B/C/D/F]
MILLION-USER READY:     [YES / NOT YET / NO]
```

### Grading Scale

- **A (90+):** Ship it. Minor polish only.
- **B (75-89):** Solid. Fix the P1s, ship within a week.
- **C (60-74):** Functional but gaps. 2-4 weeks of hardening needed.
- **D (40-59):** Significant issues. Not safe for real users yet.
- **F (<40):** Fundamental problems. Stop building features, fix foundations.

### The Hard Truth

Write 3-5 sentences of unfiltered assessment. What's the single biggest risk? What's the single most impressive thing? What would you fix if you could only fix one thing?

### Top 5 Action Items

Ordered by impact. Each item has:

1. **[P-level] Description** — estimated effort, suggested owner (human/AI), specific files
2. ...
3. ...
4. ...
5. ...

### What's Working Well

List 3-5 things that are genuinely good. Not fluff — specific patterns, decisions, or implementations that would survive a real code review.

---

## Phase 8: Update Context Files

If Phase 1 found staleness, offer to update the stale files:

- Update endpoint counts, test counts, domain status in CLAUDE.md files
- Update MEMORY.md with audit results
- Update "Last verified" dates
- Remove dead references

**Ask user before making changes.** Present the diff of what would change.

---

## Output Format

Present the full report in a single structured document. Use the scores, tables, and verdicts above. End with the action items.

Save a copy to `docs/archive/audits/YYYY-MM-DD-weekly-audit.md` for historical tracking.

---

_v1.0 — Brutally honest weekly health check. ~350 lines._
