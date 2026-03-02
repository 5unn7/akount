# Product Thinking

> **Auto-loaded globally** — changes base behavior for ALL work

## Core Principle: Diagnose Before Prescribe

Before changing ANY code, understand WHY the current code exists and WHAT your change affects.

**This applies even when no workflow skill is active.** Direct coding, quick fixes, and ad-hoc tasks all follow this protocol.

---

## Change Type Classification

Classify your work BEFORE starting. Different types require different investigation depths.

| Type | Depth | What to Do |
|------|-------|------------|
| **Bug fix** | DEEP | Trace root cause before touching code |
| **Feature** | MEDIUM | Check domain impacts, existing patterns |
| **Refactor** | MEDIUM | Verify all callers, check test coverage |
| **Config/docs** | LIGHT | Verify accuracy, check related files |

---

## Investigation Protocol (MANDATORY for Bug Fix and Feature)

### Step 0: Task Availability (AUTOMATIC - runs first)

Before reading any files or investigating code, check if this work is tracked in TASKS.md.

**See guardrails.md Step 0 for full checking logic and task creation prompt.**

**Quick reference:**
- Implementation work → check TASKS.md index
- Task found → note ID, proceed
- Task not found → show 3-option prompt (create / plan / skip)
- Exploratory work → skip check

### Step 1: Understand What Exists (before ANY edit)

**MANDATORY: Load Code Index First**

Before any Grep or Read exploration, load the domain index for the area you're working in:

```
Read CODEBASE-BANKING.md       # For banking domain work
Read CODEBASE-ACCOUNTING.md    # For accounting domain work
Read CODEBASE-INVOICING.md     # For invoicing domain work
# etc. — see guardrails.md Step 2 for full domain→file mapping
```

**What the index gives you (instantly, no searching):**
- `f["filename"].e` — Exports (what can be imported from this file)
- `f["filename"].i` — Imports (what this file depends on)
- `f["filename"].pt` — Pattern codes: T=tenant isolation, S=soft-delete, L=pino logging, P=prisma, C=client-component
- `f["filename"].v` — Violations detected (inline formatCurrency, hardcoded colors, console.log, `: any`)
- `f["filename"].t` — Test coverage (exists? file path? test count?)
- `f["filename"].c` — Callers (which files import this file's exports)
- `p` (top-level) — Pattern summary across all files in the domain

**Use this to answer BEFORE touching source files:**
- Does this function/export exist? → Check `e` arrays
- Who calls it? → Check `c` (callers) map
- Does it follow our patterns? → Check `pt` codes
- Are there existing violations? → Check `v` arrays
- Is it tested? → Check `t` object

**Fallback: Manual Discovery (ONLY if index file doesn't exist or is stale)**

```
Read [the file you plan to change]
Grep "[function/component name]" apps/   -- find all callers
Grep "[related concept]" memory/         -- check if encountered before
```

**Ask yourself:**
- WHY was this code written this way?
- What ELSE depends on this code?
- Has this problem been encountered before? (check MEMORY topic files)

### Step 2: Trace the Impact

For the change you plan to make, identify:

1. **Direct dependents** — what imports/calls this code?
2. **Domain crossover** — does this touch another domain's data or contracts?
3. **Test coverage** — do tests exist for this code path?

**Domain Adjacency Map** (changes in one often affect the other):

| Domain | Adjacent Domains |
|--------|-----------------|
| Banking | Accounting (JE creation), Invoicing (payment matching) |
| Invoicing | Accounting (AR journal entries), Clients (client data) |
| Vendors | Accounting (AP journal entries), Banking (payment flows) |
| Accounting | Banking, Invoicing, Vendors (all create journal entries) |
| Planning | Accounting (budget vs actual), Banking (cash flow) |
| AI | Banking (categorization), Accounting (rule suggestions) |

If your change touches a domain boundary, explicitly check the adjacent domain.

### Step 3: Lightweight Review Lens

Before writing code, mentally check — will this pass review?

- [ ] **Security** — tenant isolation maintained? Auth checked? Input validated?
- [ ] **Financial integrity** — integer cents? Double-entry balanced? Soft delete?
- [ ] **Type safety** — no `any` types? Zod schema validates input?
- [ ] **Architecture** — follows Route > Schema > Service > Prisma? SRP respected?

If you answer "no" or "unsure" to any, address it in your approach before coding.

---

## Pattern Recognition (CHECK EVERY TIME)

Before implementing a fix or feature:

1. **Search MEMORY topic files:** `Grep "[error or concept]" memory/`
   - `debugging-log.md` — prior bugs and fixes
   - `codebase-quirks.md` — known gotchas
   - `api-patterns.md` — established patterns
2. **Search similar code:** `Grep "[pattern]" apps/`
3. **Check MEMORY.md:** Recent learnings, known issues table

If you find a prior solution or pattern, FOLLOW it. Do not reinvent.

---

## Learning Capture (AFTER completing work)

After fixing a bug or implementing a non-trivial feature, ask:

> "Did I learn something that would save time next occurrence?"

**If YES** (any of these are true, capture it):
- Took >15 min to diagnose
- The fix was in a different file than initially expected
- Discovered a non-obvious interaction between domains
- The same type of bug has occurred before

**How:** Note it for `/processes:end-session` capture (Bugs Fixed / Patterns Discovered sections). EOD will route it to the correct MEMORY topic file.

**If NO** (trivial fix, well-documented pattern): Skip. Do not document obvious things.

---

## Anti-Patterns This Rule Prevents

| Bad Behavior | Do This Instead |
|-------------|-----------------|
| Jump to rewriting code | Read it first, understand WHY it exists |
| Delete "old" patterns | Search for callers, understand the pattern's purpose |
| Fix symptom not cause | Trace the full code path to root cause |
| Treat task in isolation | Check domain adjacency map for cross-impacts |
| Forget what was learned | Capture in end-session for EOD routing |
| Ignore review concerns until `/review` | Apply review lens BEFORE writing code |
| Create new utilities without searching | Grep for existing implementations first |

---

_~130 lines. Loaded globally. Diagnose > Prescribe. Impact > Isolation. Learn > Forget._