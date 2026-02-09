# Context Optimization v2: Scalable Claude Code Context Architecture

> **Created:** 2026-02-08
> **Revised:** 2026-02-08 (v2 — incorporates research + plan review feedback)
> **Status:** Planned
> **Goal:** Zero-read sessions for 90% of tasks; Claude knows the app without reading files

---

## Problem Statement

Every Claude Code session currently requires 3-5 explicit `Read` calls to load `architecture.mmd` (467 lines), `repo-map.md` (362 lines), and `domain-glossary.md` (398 lines) — ~1,200 lines just to get oriented. These files have stale paths (`packages/database/` should be `packages/db/`) and use Mermaid syntax that LLMs parse poorly.

Worse: if you say "build me the invoice list page," Claude doesn't know the color system, component library, design tokens, or Prisma schema without multiple file reads first.

**Target state:** Claude should be able to answer "where is the account service?", "what models exist?", "what colors/styles do we use?", and "build this feature" without reading a single file — because the context is already loaded.

---

## Key Decisions (Q&A)

### Should this plan live in its own folder?

**No.** Keep it in `docs/plans/`. It's a plan — the outputs go to their respective locations (CLAUDE.md, .claude/rules/, memory/, etc.). No need for folder proliferation.

### Would Claude still follow agents and skills when working in a subdirectory?

**Yes.** Skills (`.claude/commands/`) and hooks (`.claude/hooks/`) are loaded from the **project root**, always available regardless of which subdirectory Claude is working in. The root `CLAUDE.md` is also **always loaded**. Subdirectory CLAUDE.md files ADD context — they don't replace.

So when Claude works in `apps/api/`:
- Root `CLAUDE.md` (invariants, agents, skills, rules) — always loaded
- `apps/api/CLAUDE.md` (API-specific patterns) — loaded on-demand when accessing files there
- All skills, hooks, and agents — still available

### Would Claude know what db, colors, styles, themes, tech to use for a feature?

**Currently: No** for design/styling, **partially** for tech/db. The plan fixes this by:
- Embedding tech stack + Prisma model overview in root CLAUDE.md (always loaded)
- Adding design system context in `apps/web/CLAUDE.md` (loaded when doing frontend work)
- Adding path-scoped rules in `.claude/rules/` for domain-specific knowledge
- Using `@import` syntax to pull in key references without duplicating content

### Is the "append method" (front-loading context) better than reading files?

**Yes — confirmed by research and official Anthropic guidance.** Here's the tradeoff:

| Method | Token Cost | Reliability | Quality |
|--------|-----------|-------------|---------|
| **Append** (in CLAUDE.md, loaded every message) | Higher per-message input tokens | Highest — always in context, never forgotten | Best — Claude never operates without context |
| **Read on demand** (Claude reads files when needed) | Lower per-message, but adds tool-call overhead | Medium — Claude must know WHEN to look, and may skip | Inconsistent — varies by session |

**The math:** A 150-line CLAUDE.md costs ~2,000 tokens per message. A single Read tool call costs ~500 tokens (request) + ~2,000 tokens (response) + Claude's output explaining what it read. After 2 tool calls, append has already paid for itself. Over a 20-message session, append saves significant total tokens AND gives better results.

**The rule:** Put HIGH-FREQUENCY, ALWAYS-NEEDED info in auto-loaded files. Put SOMETIMES-NEEDED detail in on-demand files. Never put RARELY-NEEDED info in auto-loaded files.

### Are there better processes than the current ones?

**Yes — several patterns the current setup doesn't use:**

| Pattern | What It Does | Impact |
|---------|-------------|--------|
| `.claude/rules/` directory | Modular, path-scoped rules (auto-loaded) | Replaces monolithic CLAUDE.md sections |
| `@import` syntax | CLAUDE.md can import other files inline | Avoids manual "read this file" instructions |
| `SessionStart` hook | Injects dynamic context at session start | Replaces /processes:begin Phase 0 entirely |
| `PreCompact` hook | Preserves critical context during auto-compaction | Prevents Claude from "forgetting" invariants in long sessions |
| Path-scoped frontmatter | Rules that only load when touching specific files | Zero cost for irrelevant contexts |
| Hierarchical CLAUDE.md | Per-directory context files | Domain-specific context without polluting global |

---

## Architecture: The Context Stack

```
Layer 1: ALWAYS LOADED (every message)
├── CLAUDE.md (~140 lines) — invariants, tech stack, structure, pointers
├── MEMORY.md (~120 lines) — work state, learned patterns, gotchas
└── .claude/rules/*.md — modular rules, some path-scoped

Layer 2: ON-DEMAND by directory (loaded when Claude accesses files there)
├── apps/api/CLAUDE.md — API patterns, middleware, route conventions
├── apps/web/CLAUDE.md — Next.js patterns, design system, component library
└── packages/db/CLAUDE.md — Schema conventions, migration rules, model map

Layer 3: EXPLICIT READ (only when deep-diving)
├── docs/context-map.md — full model glossary, enum reference, journal patterns
└── docs/design-system/ — detailed UI specs (unchanged)

Layer 4: HUMAN ONLY (never loaded by Claude)
├── docs/architecture.mmd — Mermaid diagrams for VS Code rendering
├── docs/repo-map.md — kept for human reference, deprecated for Claude
└── docs/domain-glossary.md — kept for human reference, replaced by context-map
```

**Token budget per layer:**
- Layer 1: ~5,000 tokens/message (fixed cost, high value)
- Layer 2: ~800 tokens when active (only pays when relevant)
- Layer 3: ~2,500 tokens when read (rare, deep sessions only)
- Layer 4: 0 tokens (human-only)

---

## Deliverables (14 files)

### 1. Slim Root CLAUDE.md (~140 lines, currently 240)

**File:** `CLAUDE.md`

**Cut ~130 lines:**
- "Visual Context" table (replaced by embedded context)
- Session Management / CLI Scripts (discoverable)
- Guardrails section (moved to `.claude/rules/guardrails.md`)
- Available Skills / Review Agents (moved to `.claude/rules/workflows.md`)
- Decision Protocol, Getting Help, Implementation Standards (generic/duplicate)
- Code example snippets (replaced with `@import` pointers)

**Add ~30 lines of compact embedded context:**
- Section A: Architecture snapshot (~8 lines) — request flow as one paragraph
- Section B: Domain structure (~10 lines) — 8 domains with actual folder names
- Section C: Core model hierarchy (~8 lines) — Tenant > Entity > models, NOT all 38
- Section D: Design system reference (~4 lines) — tech, tokens, component library

**Keep (tightened):**
- Project Overview (5 lines)
- 5 Key Invariants (5 lines, no code snippets — use pointers)
- File Locations table (10 lines)
- Critical Rules as pointers: `@docs/standards/multi-tenancy.md`, `@docs/standards/financial-data.md`

**Target:** ~140 lines / ~2,000 tokens per message

### 2. Create `.claude/rules/` Directory (NEW — 5 files)

Path-scoped rules that auto-load only when relevant.

**2a. `.claude/rules/financial-rules.md` (~30 lines)**
```yaml
---
paths:
  - "apps/api/src/domains/**"
  - "packages/db/**"
  - "packages/types/**"
---
```
- Integer cents (never floats)
- Multi-currency 4-field pattern
- Double-entry invariants
- Soft delete rules
- tenantId in every query

**2b. `.claude/rules/api-conventions.md` (~25 lines)**
```yaml
---
paths:
  - "apps/api/**"
---
```
- Route file → schema → service → register pattern
- Zod validation required
- TenantContext in every service function
- Error response format

**2c. `.claude/rules/frontend-conventions.md` (~25 lines)**
```yaml
---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---
```
- Server vs Client component rules
- Design system: shadcn-glass-ui, Tailwind v4, design tokens
- Color/theme system references
- Component file naming conventions

**2d. `.claude/rules/guardrails.md` (~15 lines)**
No path scope — always loaded.
- Hook enforcement rules (what hooks block and why)
- File location rules
- Commit conventions

**2e. `.claude/rules/workflows.md` (~20 lines)**
No path scope — always loaded.
- Skill trigger table (compact: "for X, use /skill-name")
- Agent trigger table (compact: "for X, use agent-name")
- When to use /processes:begin, /processes:work, /processes:review

### 3. Create Hierarchical CLAUDE.md Files (NEW — 3 files)

**3a. `apps/api/CLAUDE.md` (~60 lines)**
- Middleware chain: auth > tenant > validation > service
- Domain folder structure with ACTUAL names (banking, not money-movement)
- Built endpoints vs stubs (from actual route registration)
- Service patterns with tenantId
- Test patterns (vitest)
- Key files: app.ts, middleware/auth.ts, middleware/tenant.ts

**3b. `apps/web/CLAUDE.md` (~60 lines)**
- Next.js 16 App Router patterns
- Server Component (page.tsx) vs Client Component ('use client')
- Design system: shadcn/ui base + shadcn-glass-ui overlay
- Tailwind v4 (CSS-based config, NOT tailwind.config.ts)
- Color tokens: reference to `packages/design-tokens/`
- Glass UI components available: ButtonGlass, InputGlass, GlassCard, etc.
- Page structure: `(dashboard)/domain/resource/page.tsx`
- Layout: sidebar navigation, glass cards, dark mode support

**3c. `packages/db/CLAUDE.md` (~50 lines)**
- All 38 Prisma models as compact table (Model | Scope | Key Fields)
- Schema conventions (cuid, createdAt, updatedAt, deletedAt)
- Entity-scoped vs tenant-scoped models
- Migration workflow (edit schema > generate > review > apply)
- Key enums (InvoiceStatus, TransactionStatus, AccountType, Role)
- Status lifecycles as single lines

### 4. Create `docs/context-map.md` (~180 lines, NEW)

Single consolidated deep-reference. One Read call replaces reading 3 files. **Tables only, no Mermaid.**

| Section | ~Lines | Content |
|---------|--------|---------|
| Full model glossary | 50 | Every model: definition, scope, key fields, invariants |
| Enum reference | 30 | All 26 Prisma enums with values |
| Permission matrix | 10 | 6-role RBAC compact table |
| Multi-currency rules | 10 | 4-field pattern with example |
| Journal entry patterns | 20 | GL entries per action (Invoice.SENT, Invoice.PAID, etc.) |
| How-to patterns | 30 | Add endpoint / add page / add migration — compressed |
| Service dependency graph | 15 | Table replacing Mermaid flowchart |
| Design system quick ref | 15 | Color palette, typography, spacing tokens |

### 5. Expand MEMORY.md (~120 lines, currently 18)

**File:** `~/.claude/projects/.../memory/MEMORY.md`

182 lines unused of 200 limit. Restructure into operational knowledge:

| Section | ~Lines | Purpose |
|---------|--------|---------|
| Project State | 10 | Phase status, recent commits, current focus |
| What Changes Together | 15 | File change chains (schema > types > migration > generate) |
| Common Mistakes | 10 | Path mismatches, bash quoting, naming inconsistencies |
| File Answer Map | 15 | "For question X, the answer is in file Y" |
| Environment | 10 | Ports, services, deployment targets |
| Recent Decisions | 10 | Deferred items, chosen approaches |
| Figma Context | 10 | Design system build state (condensed from current) |
| Design System State | 15 | Glass UI components built, token collections, color system |
| Learned Patterns | 15 | Patterns discovered across sessions |
| References | 10 | Pointers to memory/ topic files and docs/context-map.md |

### 6. Create Memory Topic Files (NEW — 3 files)

**6a. `memory/codebase-quirks.md`** — Detailed path mismatches, naming inconsistencies, bash gotchas
**6b. `memory/api-patterns.md`** — Learned API patterns, common service shapes, test patterns
**6c. `memory/debugging-log.md`** — Problems hit and resolutions (grows over time)

### 7. Add Hooks (2 new hooks)

**7a. SessionStart hook** — Inject dynamic context at session start
```json
{
  "matcher": "startup",
  "hooks": [{
    "type": "command",
    "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-context.sh"
  }]
}
```
Script outputs: git branch, recent changes, uncommitted files, active TODO count. Returns as `additionalContext`. Replaces Phase 0 of /processes:begin.

**7b. PreCompact hook** — Preserve critical context during auto-compaction
```json
{
  "matcher": "compact",
  "hooks": [{
    "type": "command",
    "command": "echo '{\"additionalContext\": \"PRESERVE: tenantId required in all queries. Money as integer cents. SUM(debits)===SUM(credits). Soft delete only. Modified files list and test commands.\"}'"
  }]
}
```

### 8. Streamline `/processes:begin` (~80 lines, currently 856)

**File:** `.claude/commands/processes/begin.md`

- Remove Phase 0 entirely (context is auto-loaded + SessionStart hook)
- Reduce to: git status check + TASKS.md scan + recommendations
- Quick mode becomes the default (30 seconds)
- Deep mode triggers `Read docs/context-map.md`
- Remove 500+ lines of example output formatting

### 9. Delete Replaced Reference Docs (3 files)

These files were created specifically for Claude. Their content has been absorbed into the new context architecture. Delete them to avoid confusion and stale maintenance burden.

- **Delete** `docs/architecture.mmd` (467 lines) — replaced by CLAUDE.md architecture snapshot + docs/context-map.md service dependency table
- **Delete** `docs/repo-map.md` (362 lines) — replaced by hierarchical CLAUDE.md files + .claude/rules/ + File Locations table
- **Delete** `docs/domain-glossary.md` (398 lines) — replaced by packages/db/CLAUDE.md model table + docs/context-map.md full glossary

**Total removed:** 1,227 lines of Claude-targeted docs that are now distributed across the context stack.

### 10. Skills & Agents Cleanup

Audit found ~4,200 lines of waste across skills. Three phases:

**10a. Delete (3 files, save ~1,225 lines):**
- **Delete** `.claude/commands/processes/WORKFLOW-VISUAL-GUIDE.md` (388 lines) — pure ASCII art, duplicates README.md
- **Delete** `.claude/commands/resolve_pr_parallel.md` (637 lines) — describes non-existent functionality
- **Delete** `.claude/agents/review/pattern-recognition-specialist.md` (~200 lines) — duplicates built-in Task agent pattern detection

**10b. Slim (7 files, save ~2,000 lines):**

| File | Current | Target | Cut |
|------|---------|--------|-----|
| processes/begin.md | 856 | 150 | Example outputs (lines 240-836), Phase 0 (moved to hook) |
| processes/eod.md | 530 | 250 | Excessive examples, keep eod-quick-ref as primary |
| processes/work.md | 501 | 300 | Commit message examples, verbose checklists |
| processes/plan.md | 425 | 250 | Template bloat |
| processes/reset.md | 316 | 150 | Violation examples (redundant with .claude/rules/) |
| changelog.md | 561 | 250 | Example outputs |
| quality/a11y-review.md | 436 | 250 | Example violations |

**10c. Merge (2 files into 1, save ~1,000 lines):**
- **Merge** `plan_review.md` (669 lines) + `deepen-plan.md` (685 lines) → single `processes/review.md` with `--type=plan` and `--type=code` modes
- Current `processes/review.md` (461 lines) absorbs unique content from both
- Result: ~600 lines total instead of 1,815 across 3 files

---

## Implementation Order

### Phase A: Context Architecture (Steps 1-9)

| Step | Action | Depends On |
|------|--------|-----------|
| 1 | Read `packages/db/prisma/schema.prisma` — extract accurate model/enum data | — |
| 2 | Create `.claude/rules/` (5 files) | Step 1 for financial rules |
| 3 | Create `apps/api/CLAUDE.md`, `apps/web/CLAUDE.md`, `packages/db/CLAUDE.md` | Step 1 |
| 4 | Create `docs/context-map.md` | Step 1 |
| 5 | Rewrite root `CLAUDE.md` — slim to ~140 lines | Steps 2-4 (content moved there) |
| 6 | Expand `MEMORY.md` + create topic files | — |
| 7 | Create session-context.sh + PreCompact hook | — |
| 8 | Rewrite `/processes:begin` to ~150 lines | Steps 5, 7 |
| 9 | Delete architecture.mmd, repo-map.md, domain-glossary.md | Steps 3-4 (content absorbed) |

Steps 6, 7 are independent — can run in parallel with Steps 2-5.

### Phase B: Skills & Agents Cleanup (Steps 10-12)

| Step | Action | Depends On |
|------|--------|-----------|
| 10 | Delete WORKFLOW-VISUAL-GUIDE.md, resolve_pr_parallel.md, pattern-recognition-specialist.md | — |
| 11 | Slim 7 skills (begin, eod, work, plan, reset, changelog, a11y-review) | Step 8 for begin.md |
| 12 | Merge plan_review.md + deepen-plan.md into processes/review.md | — |

Phase B can start after Phase A is verified working.

---

## Files Summary

### Phase A: Context Architecture

| # | File | Action | Lines |
|---|------|--------|-------|
| 1 | `CLAUDE.md` | **Rewrite**: slim to invariants + pointers | ~140 |
| 2 | `.claude/rules/financial-rules.md` | **New**: path-scoped financial rules | ~30 |
| 3 | `.claude/rules/api-conventions.md` | **New**: path-scoped API rules | ~25 |
| 4 | `.claude/rules/frontend-conventions.md` | **New**: path-scoped frontend rules | ~25 |
| 5 | `.claude/rules/guardrails.md` | **New**: global guardrail rules | ~15 |
| 6 | `.claude/rules/workflows.md` | **New**: skill/agent trigger table | ~20 |
| 7 | `apps/api/CLAUDE.md` | **New**: API-specific context | ~60 |
| 8 | `apps/web/CLAUDE.md` | **New**: Frontend-specific context | ~60 |
| 9 | `packages/db/CLAUDE.md` | **New**: Database-specific context | ~50 |
| 10 | `docs/context-map.md` | **New**: consolidated deep reference | ~180 |
| 11 | `MEMORY.md` (auto memory) | **Expand**: operational knowledge | ~120 |
| 12 | `memory/codebase-quirks.md` | **New**: detailed quirks reference | ~40 |
| 13 | `memory/api-patterns.md` | **New**: learned patterns | ~30 |
| 14 | `memory/debugging-log.md` | **New**: problem resolutions | ~20 |
| 15 | `.claude/hooks/session-context.sh` | **New**: SessionStart context injection | ~30 |
| 16 | `.claude/settings.local.json` | **Edit**: add SessionStart + PreCompact hooks | ~10 |
| 17 | `.claude/commands/processes/begin.md` | **Rewrite**: slim to ~150 lines | ~150 |
| 18 | `docs/architecture.mmd` | **Delete**: absorbed into context stack | -467 |
| 19 | `docs/repo-map.md` | **Delete**: absorbed into context stack | -362 |
| 20 | `docs/domain-glossary.md` | **Delete**: absorbed into context stack | -398 |

### Phase B: Skills & Agents Cleanup

| # | File | Action | Lines Saved |
|---|------|--------|------------|
| 21 | `.claude/commands/processes/WORKFLOW-VISUAL-GUIDE.md` | **Delete** | -388 |
| 22 | `.claude/commands/resolve_pr_parallel.md` | **Delete** | -637 |
| 23 | `.claude/agents/review/pattern-recognition-specialist.md` | **Delete** | -200 |
| 24 | `.claude/commands/processes/begin.md` | **Slim** (done in Phase A) | -706 |
| 25 | `.claude/commands/processes/eod.md` | **Slim**: 530 → 250 | -280 |
| 26 | `.claude/commands/processes/work.md` | **Slim**: 501 → 300 | -201 |
| 27 | `.claude/commands/processes/plan.md` | **Slim**: 425 → 250 | -175 |
| 28 | `.claude/commands/processes/reset.md` | **Slim**: 316 → 150 | -166 |
| 29 | `.claude/commands/changelog.md` | **Slim**: 561 → 250 | -311 |
| 30 | `.claude/commands/quality/a11y-review.md` | **Slim**: 436 → 250 | -186 |
| 31 | `.claude/commands/plan_review.md` | **Merge** into processes/review.md | -669 |
| 32 | `.claude/commands/deepen-plan.md` | **Merge** into processes/review.md | -685 |
| 33 | `.claude/commands/processes/review.md` | **Expand**: absorb plan review + deepen | +200 |

---

## Impact

### Context Architecture (Phase A)

| Metric | Before | After |
|--------|--------|-------|
| Reads per session start | 3-5 (~1,200 lines) | 0 for 90% of sessions |
| Auto-loaded global context | 240 lines (generic) | ~140 lines (precise) |
| Auto-loaded rules | 0 | ~115 lines (path-scoped, loaded only when relevant) |
| Directory-specific context | 0 | ~170 lines (only pays when working in that dir) |
| Deep-dive reads | 3 files (1,227 lines) | 1 file (180 lines) |
| "Build me a feature" readiness | Needs 5+ reads first | Ready from auto-loaded context |
| Design system knowledge | Not in context | In apps/web/CLAUDE.md + rules |
| Context surviving compaction | Lost during long sessions | Preserved via PreCompact hook |
| Token cost per message | ~3,500 tokens (mostly wasted) | ~2,000 tokens (all actionable) |
| Dead reference docs | 1,227 lines maintained | Deleted (absorbed into stack) |

### Skills & Agents Cleanup (Phase B)

| Metric | Before | After |
|--------|--------|-------|
| Total skill lines | ~9,500 across 20 files | ~5,300 across 16 files (44% reduction) |
| Total agent lines | ~4,000 across 15 files | ~3,800 across 14 files |
| /processes:begin | 856 lines, 3-5 min | ~150 lines, 30 sec |
| Review workflows | 3 overlapping files (1,815 lines) | 1 unified file (~600 lines) |
| Dead/speculative files | 3 files (1,225 lines) | Deleted |

### Total Line Count Change

| Category | Before | After | Delta |
|----------|--------|-------|-------|
| Reference docs (deleted) | 1,227 | 0 | **-1,227** |
| Root CLAUDE.md | 240 | 140 | **-100** |
| .claude/rules/ | 0 | 115 | **+115** |
| Hierarchical CLAUDE.md | 0 | 170 | **+170** |
| docs/context-map.md | 0 | 180 | **+180** |
| MEMORY.md + topic files | 18 | 210 | **+192** |
| Skills (commands) | 9,500 | 5,300 | **-4,200** |
| Agents | 4,000 | 3,800 | **-200** |
| Hooks | 0 | 60 | **+60** |
| **TOTAL** | **14,985** | **9,975** | **-5,010 (33% reduction)** |

Net: 5,010 fewer lines, dramatically better organized, zero dead files.

---

## Verification Tests

After implementation, test in a fresh Claude Code session:

| Test | Expected Behavior | Passes If |
|------|-------------------|-----------|
| "Where is the account service?" | Answers from embedded context | No Read/Glob tool calls |
| "What Prisma models exist?" | Answers from packages/db/CLAUDE.md | No Read of schema.prisma |
| "Build an invoice list page" | Knows Next.js 16, shadcn-glass-ui, Tailwind v4, design tokens | No design system file reads |
| "Add an API endpoint for vendors" | Knows route/schema/service pattern, tenantId requirement | Follows api/CLAUDE.md patterns |
| "What colors does our app use?" | References design tokens, glass UI palette | Answers from frontend context |
| `/processes:begin` | Runs in <30 seconds | No architecture.mmd read |
| Long session (50+ messages) | Financial invariants still respected | PreCompact hook preserves rules |
| Edit `apps/api/src/domains/banking/` | API conventions loaded automatically | Path-scoped rules activate |
| Edit `apps/web/src/app/(dashboard)/` | Frontend conventions loaded automatically | Design system context available |

---

## Freshness Mechanism

The biggest risk with embedded context is staleness. Mitigations:

1. **Date stamps**: Each CLAUDE.md section header includes `(verified: YYYY-MM-DD)`
2. **Session-context hook**: Compares `schema.prisma` mtime vs `packages/db/CLAUDE.md` mtime, warns if stale
3. **MEMORY.md tracking**: Claude records when context files were last verified
4. **Convention**: After any schema change, update `packages/db/CLAUDE.md` in the same commit

---

## Why This Is Better Than v1

| v1 Plan | v2 Plan | Why v2 Wins |
|---------|---------|-------------|
| Expand CLAUDE.md to 320 lines | Slim CLAUDE.md to 140 lines | 320 lines loaded EVERY message is expensive; distribute instead |
| Embed 38 models in CLAUDE.md | Put models in packages/db/CLAUDE.md | Only loaded when doing DB work, not for frontend tasks |
| No path-scoped rules | .claude/rules/ with path frontmatter | Zero cost for irrelevant context |
| No design system context | apps/web/CLAUDE.md has design system | Claude knows colors/styles for "build this feature" |
| Keep guardrails in CLAUDE.md | Move to .claude/rules/guardrails.md | Cleaner separation of concerns |
| No compaction protection | PreCompact hook | Long sessions don't lose invariants |
| 856-line /processes:begin | 80-line /processes:begin | SessionStart hook handles context; begin just checks status |
| No freshness tracking | Date stamps + mtime comparison | Prevents stale context drift |

---

## Process Improvements Summary

| Current Process | Problem | Replacement |
|----------------|---------|-------------|
| `/processes:begin` Phase 0 reads 3 files | 1,200 lines read every session | SessionStart hook + embedded context |
| Monolithic CLAUDE.md | Pays full token cost even for irrelevant context | Hierarchical CLAUDE.md + path-scoped rules |
| No design system context | Claude reads 5+ files before building UI | `apps/web/CLAUDE.md` with design references |
| No compaction protection | Claude forgets rules in long sessions | PreCompact hook preserves invariants |
| Mermaid diagrams for Claude | LLM can't render; wastes tokens parsing syntax | Tables and paragraphs in context-map.md |
| MEMORY.md barely used (18/200 lines) | Wastes 91% of free auto-loaded budget | Operational knowledge: patterns, gotchas, file maps |
| Skills/agents listed in CLAUDE.md | Takes space listing what's discoverable | Compact trigger table in .claude/rules/workflows.md |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Subdirectory CLAUDE.md not loading reliably | Medium (GitHub issue #2571) | Test first; fallback: promote critical content to root CLAUDE.md |
| Path-scoped rules not triggering | Low | Test with each path pattern; fallback: remove path scope |
| Context goes stale after schema changes | High | Freshness mechanism (date stamps + mtime hook) |
| MEMORY.md exceeds 200-line limit | Medium | Use topic files for overflow; keep index in MEMORY.md |
| SessionStart hook too slow | Low | Keep script minimal (<1 second); git status + file mtime only |
| Slimmed skills lose important instructions | Low | Slim by cutting examples/formatting, NOT instructions |
| Merged review skill becomes too complex | Medium | Use clear --type flag; test each mode independently |
| Deleting reference docs loses info | None | All content absorbed into context stack first; verify before delete |

---

## Skills & Agents Audit Details

### Skills Assessed: What's Good

| Skill | Verdict | Why |
|-------|---------|-----|
| processes/brainstorm.md (226 lines) | **Keep as-is** | Concise, clear, well-focused |
| processes/eod-quick-ref.md (205 lines) | **Keep as-is** | Excellent quick reference format |
| processes/compound.md (128 lines) | **Keep as-is** | Perfect conciseness |
| braindump.md (435 lines) | **Keep as-is** | Useful multi-agent feedback |
| quality/design-system-enforce.md (298 lines) | **Keep as-is** | Good Akount-specific checks |
| quality/brand-voice-check.md (185 lines) | **Keep as-is** | Reasonable scope |
| quality/test-coverage-analyze.md (341 lines) | **Keep as-is** | Good coverage analysis |

### Skills Assessed: Problems Found

| Skill | Problem | Fix |
|-------|---------|-----|
| processes/begin.md (856 lines) | 500+ lines of example dashboard ASCII art | Cut to ~150 lines |
| processes/WORKFLOW-VISUAL-GUIDE.md (388 lines) | Pure ASCII art, duplicates README | Delete entirely |
| resolve_pr_parallel.md (637 lines) | Describes tool that doesn't exist | Delete entirely |
| plan_review.md (669 lines) | 80% overlaps processes/review.md | Merge |
| deepen-plan.md (685 lines) | Overlaps plan_review.md | Merge |
| changelog.md (561 lines) | 300+ lines of example output | Cut examples |
| processes/eod.md (530 lines) | eod-quick-ref.md covers same thing better | Slim heavily |

### Agents Assessed: All 14 Review Agents

| Agent | Lines | Value | Verdict |
|-------|-------|-------|---------|
| financial-data-validator | ~350 | **High** — Akount-specific double-entry rules | Keep |
| architecture-strategist | ~300 | **High** — multi-tenant patterns | Keep |
| security-sentinel | ~350 | **High** — tenant isolation + OWASP | Keep |
| clerk-auth-reviewer | ~250 | **High** — Clerk v6+ patterns | Keep |
| fastify-api-reviewer | ~300 | **High** — Akount API standards | Keep |
| prisma-migration-reviewer | ~300 | **High** — financial schema safety | Keep |
| kieran-typescript-reviewer | ~300 | **Medium-High** — stricter than built-in | Keep |
| nextjs-app-router-reviewer | ~300 | **Medium-High** — Akount Next.js patterns | Keep |
| design-system-enforcer | ~250 | **Medium** — Akount design system | Keep |
| rbac-validator | ~200 | **Medium** — 6-role RBAC validation | Keep |
| code-simplicity-reviewer | ~200 | **Medium** — YAGNI checks | Keep (uses haiku) |
| performance-oracle | ~250 | **Medium** — Akount query patterns | Keep |
| turborepo-monorepo-reviewer | ~200 | **Low-Medium** — monorepo structure | Keep (lightweight) |
| pattern-recognition-specialist | ~200 | **Low** — duplicates built-in | **Delete** |

**Agent summary:** 13 of 14 agents are well-focused and provide Akount-specific value. One redundant agent to delete.

---

## Phase C: Final Refinements (6 items)

### C1. Use `@import` in the new CLAUDE.md

The slimmed CLAUDE.md should reference standard docs inline rather than duplicating their content:

```markdown
## Financial Standards
@docs/standards/financial-data.md
@docs/standards/multi-tenancy.md
```

`@import` pulls the file content into CLAUDE.md at load time. If those docs change, CLAUDE.md automatically gets the update — zero staleness risk for imported sections. This replaces the current pattern of code snippets in CLAUDE.md that duplicate what's already in the standards docs.

**Apply to:** Step 5 (rewrite CLAUDE.md). Import standards docs instead of embedding code examples.

### C2. Compaction preservation guidance in CLAUDE.md

The PreCompact hook (Step 7) is the primary defense. But hooks can fail silently. Add 3 lines directly to CLAUDE.md as backup:

```markdown
## Compaction Preservation
When compacting context, ALWAYS preserve: tenantId requirement, integer cents rule,
modified files list, current task context, and test commands used this session.
```

3 lines per message is cheap insurance. If the hook fires, this is redundant (harmless). If the hook doesn't fire, this saves the session.

**Apply to:** Step 5 (rewrite CLAUDE.md). Add as final section.

### C3. Recently-changed files in SessionStart hook

The `session-context.sh` hook (Step 7) currently outputs git branch + uncommitted files. Add recently modified files:

```bash
# What's been touched recently (helps "continue where we left off")
echo "## Recent Changes"
git log --oneline -5 --name-only --diff-filter=M 2>/dev/null
```

When you say "continue from yesterday" or "fix the thing we were working on," Claude already knows which files were involved. No searching, no guessing.

**Apply to:** Step 7 (session-context.sh).

### C4. Clean up `.claude/settings.local.json`

Current settings have ~30 one-off bash permissions accumulated from past sessions:

```json
"Bash(npx shadcn@latest add select -y)",
"Bash(move akount.tokens.json 00-foundationstokensakount.tokens.json)",
"Bash(powershell \"Get-Process node...\")",
"Bash(del \"W:\\\\Marakana Corp\\\\...page.tsx\")",
```

These will never fire again. They add noise and make it harder to audit what's actually allowed.

**Action:** Remove all one-off specific commands. Keep only pattern-based rules (`Bash(npm run *)`, `Bash(git status *)`, etc.). Target: reduce allow list from ~65 entries to ~30 clean patterns.

### C5. Session hygiene note in MEMORY.md

Add to the expanded MEMORY.md:

```markdown
## Session Hygiene
- Use /clear between unrelated tasks — fresh context beats accumulated clutter
- Use /fast (haiku) for simple searches and file reads to save cost
- After 2 failed attempts at the same approach, stop and try alternatives
```

This is a self-reminder Claude will read every session. The `/clear` habit alone prevents more context issues than any other single practice.

**Apply to:** Step 6 (expand MEMORY.md).

### C6. Model Selection Strategy

Claude Code uses Opus 4.6 by default — the most capable but most expensive model. Many tasks don't need it.

**Add to `.claude/rules/workflows.md`:**

```markdown
## Model Selection (Cost Optimization)

Use /fast (Haiku) for:
- File searches and exploration (Glob, Grep, Read)
- Simple single-file edits (typos, renames, small fixes)
- Running tests and checking output
- Git operations (status, log, diff)
- Answering factual questions about the codebase

Stay on Opus for:
- Multi-file feature implementation
- Architecture decisions and planning
- Complex debugging across multiple files
- Financial logic (double-entry, multi-currency)
- Code review with multiple agents
- Writing new services/routes/pages from scratch

Switch back from /fast with /fast again (toggles off).
```

**Cost impact estimate:**
- ~40% of typical session messages are exploration/search/simple edits
- Haiku is ~12x cheaper than Opus per token
- If 40% of messages use Haiku: **~30% reduction in total API cost**

**Add to MEMORY.md as well (2 lines):**
```markdown
## Cost
Use /fast for searches, simple edits, git ops, test runs. Opus for multi-file features, architecture, financial logic.
```

This ensures Claude suggests /fast when appropriate, and the user builds the habit.

---

## Updated Files Summary (Phase C additions)

| # | File | Change | Impact |
|---|------|--------|--------|
| 5 | `CLAUDE.md` | Add `@import` for standards + compaction guidance (3 lines) | Zero staleness for imported rules |
| 6 | `MEMORY.md` | Add session hygiene + cost notes (5 lines) | Better habits every session |
| 7 | `.claude/hooks/session-context.sh` | Add recent git changes output | "Continue from yesterday" works instantly |
| 16 | `.claude/settings.local.json` | Remove ~35 one-off bash permissions | Cleaner permission model |
| 6 | `.claude/rules/workflows.md` | Add model selection strategy section | ~30% API cost reduction |

---

_Plan v2.2 — final version with all refinements_
_Total scope: 33 files touched, ~5,000 lines net reduction, zero dead files, ~30% API cost savings_
