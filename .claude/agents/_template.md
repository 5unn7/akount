# Agent Builder Guide

> **This file is NOT an agent.** It's instructions for building agents.
> When creating a new agent, follow these steps to produce a high-quality agent prompt.

---

## What This Template Is

This is a **meta-guide** — instructions for the person or AI building a new domain agent.
The output of following this guide is a new `.md` file in `.claude/agents/` that serves as
an execution agent for a specific domain.

**What this is NOT:**
- Not a copy-paste template (don't duplicate content from rules files)
- Not a content dump (don't paste OWASP checklists or financial rules here)
- Not the agent itself (the agent is what you produce by following these steps)

---

## Step 1: Understand the Domain

Before writing a single line of the agent prompt, research the domain:

### 1a. Read ALL Codebase Rules (MANDATORY)

The agent you're building will operate within this codebase. Read every rules file so the
agent prompt you write is **consistent** with how this project works:

```
Read CLAUDE.md                              — Architecture, invariants, tech stack
Read MEMORY.md                              — Current state, known issues, patterns learned
Read .claude/rules/guardrails.md            — 9 key invariants, pre-flight checklist, anti-patterns
Read .claude/rules/financial-rules.md       — Integer cents, multi-currency, double-entry, tenant isolation
Read .claude/rules/api-conventions.md       — Route→Schema→Service, TenantContext, structured logging
Read .claude/rules/frontend-conventions.md  — Server/Client separation, component reuse, loading states
Read .claude/rules/design-aesthetic.md      — Color tokens, glass morphism, typography
Read .claude/rules/test-conventions.md      — Financial assertions, mock data standards
Read .claude/rules/workflows.md             — Available skills, review agents, model selection
Read .claude/rules/plan-enforcement.md      — Task validation, status updates
Read .claude/rules/product-thinking.md      — Investigation protocol, change classification
Read .claude/rules/task-population.md       — Atomic ID reservation, approval gate
Read .claude/rules/refactoring-protocol.md  — Multi-file refactoring safety
```

**Why:** These files define how THIS codebase works. The agent prompt you write must use
the same terminology, patterns, and conventions. Without reading these, you'll write generic
instructions that conflict with established patterns.

### 1b. Research Current Industry Best Practices (MANDATORY)

**Use the `best-practices-researcher` agent** to find current (2026) standards for the
domain you're building an agent for. Do NOT hardcode old standards (OWASP 2021, etc.).

```
Task(best-practices-researcher):
  "Research current (2026) best practices for [DOMAIN].
   Include: industry standards, security requirements, compliance frameworks,
   common vulnerabilities, recommended patterns.
   Focus on: [specific technologies used in this project]"
```

**Examples by domain:**

| Domain | Research Query |
|--------|--------------|
| Banking | "2026 best practices for banking transaction systems: ACID, idempotency, PSD3, reconciliation, Prisma/PostgreSQL" |
| Security | "2026 OWASP Top 10, API security best practices, JWT/Clerk auth patterns, Node.js/Fastify security" |
| UI/Frontend | "2026 Next.js App Router best practices, React Server Components, WCAG 2.2, performance optimization" |
| Compliance | "2026 financial compliance: GAAP, SOX, IFRS 17, audit trail requirements, multi-currency accounting" |

**Why:** Standards evolve. OWASP 2021 is 5 years old. PSD2 became PSD3. WCAG 2.1 became
2.2. The `best-practices-researcher` agent finds what's current so the agent you build
doesn't enforce stale standards.

### 1c. Explore the Existing Codebase (MANDATORY)

Understand what already exists in this domain so the agent doesn't reinvent wheels:

```
Grep "service" apps/api/src/domains/<domain>/     — Find existing services
Grep "route" apps/api/src/domains/<domain>/        — Find existing routes
Glob "apps/web/src/app/(dashboard)/<domain>/**"    — Find existing pages
Read packages/db/prisma/schema.prisma              — Find domain models
Read apps/api/src/domains/<domain>/routes/index.ts  — See registered endpoints
```

**Document in the agent prompt:**
- Which Prisma models belong to this domain
- Which API endpoints already exist
- Which frontend pages are built vs stubbed
- Which patterns are already established (copy existing, don't invent new)

---

## Step 2: Write the Agent Prompt

Use this structure. Every section is explained with WHY it matters and WHAT to include.

### Section: Metadata

```markdown
# <Domain> Agent

**Agent Name:** `<domain>-agent`
**Category:** [Domain Execution | Technical Specialist | Security/Compliance]
**Model:** [Haiku | Sonnet | Opus] — Justify the choice
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
```

**Model selection guidance:**
- **Opus** — Complex financial logic, ACID transactions, multi-domain coordination
- **Sonnet** — Security analysis, compliance validation, long-context reasoning
- **Haiku** — Straightforward UI work, simple CRUD, file searches

### Section: Purpose

Define scope clearly. An agent that tries to do everything does nothing well.

```markdown
## Purpose

**This agent is responsible for:**
- [3-5 specific responsibilities — be precise, not vague]

**This agent does NOT:**
- [2-3 explicit exclusions — prevents scope creep]

**Handoff to other agents:**
- When [condition], delegate to `<agent>` for [work]
```

**Tips:**
- Each responsibility should be testable ("Did the agent do X?")
- Exclusions prevent the agent from drifting into other domains
- Handoffs keep agents focused and composable

### Section: Context Loading

Tell the agent WHAT to read, not WHAT those files contain. The agent reads them at runtime.

```markdown
## Context Loading

**Always read first (before any code changes):**
- `CLAUDE.md` — Project architecture and invariants
- `MEMORY.md` — Current state and learned patterns
- All `.claude/rules/*.md` — Codebase conventions (the agent reads these directly)

**Domain-specific context:**
- `apps/api/src/domains/<domain>/` — Existing services, routes, schemas
- `packages/db/prisma/schema.prisma` — Domain models
- `.claude/context/<domain>.md` — Domain-specific patterns (if exists)

**Per-task context:**
- `TASKS.md` — Task description and acceptance criteria
- `.claude/task-enrichments.json` — File hints and verification commands
```

**Key principle:** Don't copy rules content INTO the agent prompt. Tell the agent to READ
the rules files. This way, when rules update, agents automatically get the latest version.

### Section: Industry Standards

Include the RESEARCHED best practices from Step 1b. These are domain-specific — don't
include banking standards in a UI agent or vice versa.

```markdown
## Industry Standards

[Paste the relevant findings from best-practices-researcher here]
[These should be CURRENT (2026) standards, not outdated ones]
[Include checklists the agent should verify for every change]
```

**What to include:**
- Security standards relevant to THIS domain (not all of OWASP for a UI agent)
- Compliance requirements relevant to THIS domain
- Performance benchmarks relevant to THIS domain
- Accessibility standards relevant to THIS domain

**What NOT to include:**
- Standards from other domains (banking standards in a UI agent)
- Outdated standards (always research current year)
- Standards already covered by rules files (don't duplicate)

### Section: Execution Workflow

Define the step-by-step process the agent follows. Reference rules files instead of
duplicating their content.

```markdown
## Execution Workflow

### Pre-Flight (before ANY code change)
- Follow pre-flight checklist from `guardrails.md`
- [Add domain-specific pre-flight checks here]

### Build
- Follow [API pattern from api-conventions.md | Frontend pattern from frontend-conventions.md]
- [Add domain-specific build patterns with REAL code examples from this codebase]

### Verify
- Run security gate (call security-agent or check against security rules)
- Run compliance gate (if touching financial data)
- Call relevant review agents: [list which ones apply to this domain]

### Test
- Follow test conventions from `test-conventions.md`
- [Add domain-specific test requirements]

### Commit
- Follow commit conventions from `guardrails.md`
```

**Tips for code examples:**
- Use REAL examples from this codebase (Grep for them), not generic ones
- Show the RIGHT way and the WRONG way side by side
- Reference the file where the pattern lives so the agent can read more context

### Section: Domain-Specific Patterns

This is where the agent becomes unique. Include patterns, anti-patterns, and examples
that are specific to THIS domain and NOT already covered by the rules files.

```markdown
## Domain Patterns

### [Pattern Name]
[Real code example from this codebase]
[Why this pattern exists]
[What goes wrong if you don't follow it]

### Common Pitfalls (Domain-Specific Only)
- ❌ [Anti-pattern specific to this domain — NOT already in guardrails.md]
- ❌ [Another domain-specific anti-pattern]
```

**What to include:** Patterns unique to this domain that rules files don't cover
**What NOT to include:** Anti-patterns already in `guardrails.md` (don't duplicate)

### Section: Domain Models & File Locations

```markdown
## Domain Knowledge

**Models:** [List Prisma models this agent works with]
**Existing endpoints:** [List what's built vs what's needed]
**File locations:** [Where this agent creates/edits files]
**Dependencies:** [Other agents this one coordinates with]
```

### Section: Testing & Lessons

```markdown
## Testing Protocol
[Domain-specific test requirements beyond test-conventions.md]

## Lessons Learned
[Updated as the agent executes tasks — captures domain-specific gotchas]
```

---

## Step 3: Validate the Agent Prompt

Before saving the agent, check:

- [ ] **No duplicated rules content** — Agent reads rules files at runtime, doesn't paste them
- [ ] **Industry standards are current** — Researched via `best-practices-researcher`, not hardcoded from memory
- [ ] **Code examples are REAL** — Grep'd from actual codebase, not invented
- [ ] **Scope is focused** — Agent has clear boundaries and handoffs
- [ ] **Anti-patterns are additive** — Only domain-specific ones, not repeating guardrails.md
- [ ] **Model choice is justified** — Not defaulting to Opus when Haiku suffices
- [ ] **Testing is specific** — Domain-specific requirements beyond generic test-conventions.md

---

## Step 4: Save and Register

1. Save as `.claude/agents/<domain>-agent.md`
2. Test by running a task through the agent
3. Update `Lessons Learned` section after first execution
4. Update `.claude/rules/workflows.md` if this agent should be listed

---

## Quick Reference: Agent Structure

```
# <Domain> Agent
## Metadata (name, model, dates)
## Purpose (responsibilities, exclusions, handoffs)
## Context Loading (what to READ — not content itself)
## Industry Standards (CURRENT — from best-practices-researcher)
## Execution Workflow (steps, referencing rules files)
## Domain Patterns (unique to this domain, with real code examples)
## Domain Knowledge (models, endpoints, file locations)
## Common Pitfalls (domain-specific ONLY — don't repeat guardrails.md)
## Testing Protocol (domain-specific requirements)
## Lessons Learned (updated per execution)
```

---

## Anti-Patterns for Agent Building

- ❌ **Don't copy-paste rules files into agent prompts** — Rules update; agents should read them fresh
- ❌ **Don't hardcode industry standards from memory** — Research current year via `best-practices-researcher`
- ❌ **Don't include every anti-pattern from guardrails.md** — The agent reads guardrails.md itself
- ❌ **Don't write generic examples** — Grep the codebase for REAL patterns
- ❌ **Don't make agents too broad** — Focused agents > Swiss-army-knife agents
- ❌ **Don't include other domains' standards** — Banking rules don't go in a UI agent
- ❌ **Don't duplicate between agents** — Shared rules belong in `.claude/rules/`, not in each agent

---

_Agent Builder Guide v3. Meta-instructions for building domain agents. Last updated: 2026-02-23_
