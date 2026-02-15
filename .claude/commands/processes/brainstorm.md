---
name: processes:brainstorm
description: Collaboratively explore feature ideas and requirements before implementation planning
argument-hint: "[feature idea or problem to explore]"
---

# Workflow: Brainstorm

Explore **WHAT** to build through collaborative dialogue. Never code — just explore and document.

**Pipeline:** Brainstorm → Plan → Work → Review
**Time-box:** 15 minutes max. If you're not converging, capture what you have and move to `/processes:plan`.

**When to use:** Requirements are unclear, multiple valid approaches exist, or you need to explore edge cases before committing to a direction.

---

## Phase 1: Understand the Problem

### Explore Codebase First

Before asking questions, check what already exists:

- Search for similar features in `apps/` and `docs/`
- Review related data models in schema
- Check `docs/brainstorms/` and `docs/plans/` for prior exploration

### Ask Questions (2 Rounds)

**Round 1 — Problem & Users** (use AskUserQuestion, batch these):

- What problem are we solving?
- Who uses this? (which user roles?)
- What's the desired outcome?

**Round 2 — Constraints & Scope** (based on Round 1 answers):

- Must-have capabilities vs nice-to-have?
- How does this interact with existing domains?
- Known constraints? (performance, compliance, multi-currency)

---

## Phase 2: Explore Approaches

Present **2-3 approaches** (max). For each:

- Description (2-3 sentences)
- Pros and cons (bullet points)
- Why it does/doesn't fit Akount's architecture

**YAGNI check:** Before presenting a third option, verify it's not over-engineering.

---

## Phase 2.5: Systems Impact Check

Before selecting an approach, assess cross-domain effects.

### Domain Impact

Consult the Domain Adjacency Map (`.claude/rules/product-thinking.md`):

- Which domains does this feature touch DIRECTLY?
- Which ADJACENT domains might be affected?
- Does this create new data flows between domains?

### Review Lens (Lightweight)

For each approach being considered, flag potential concerns:

- **Security:** New auth flows? Exposed data? Tenant boundary changes?
- **Financial integrity:** Creates/modifies monetary data or journal entries?
- **Architecture:** Fits Route > Schema > Service > Prisma pattern?

Note concerns in the brainstorm doc — they become requirements for the plan.

---

## Phase 3: Capture Decisions

Save to `docs/brainstorms/YYYY-MM-DD-<topic>-brainstorm.md`:

```markdown
# [Feature Name] Brainstorm

**Date:** YYYY-MM-DD
**Status:** Brainstormed

## Problem
[What problem are we solving and for whom?]

## Chosen Approach
[Selected approach with brief rationale]

### Key Features
- Feature 1
- Feature 2

### Constraints
- [List relevant constraints]

### Edge Cases
- [Edge case 1]

## Domain Impact
- **Primary:** [domains directly affected]
- **Adjacent:** [domains that may need changes]

## Review Concerns (from Phase 2.5)
- **[Agent]:** [Concern to address during implementation]

## Alternatives Considered
- **[Alt 1]:** [Why not chosen — one line]
- **[Alt 2]:** [Why not chosen — one line]

## Open Questions
- [ ] [Unresolved question 1]

## Next Steps
- [ ] Create implementation plan: `/processes:plan [feature]`
```

---

## Phase 4: Handoff

The brainstorm file at `docs/brainstorms/YYYY-MM-DD-*.md` is the input for `/processes:plan`. Offer the user:

1. **Proceed to planning** — `/processes:plan [feature]`
2. **Refine further** — continue exploring a specific aspect
3. **Pause** — save for later

Use AskUserQuestion to let user choose.

---

_~115 lines. Exploration only — never code._
