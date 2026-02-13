---
name: braindump
description: Get multi-agent feedback on suggestions, ideas, code, or architectural decisions
argument-hint: "[your suggestion, idea, or code]"
aliases:
  - get-feedback
  - agent-feedback
keywords:
  - feedback
  - suggestion
  - idea
  - review
  - validation
---

# Braindump: Quick Multi-Agent Validation

Validate an idea, approach, or code snippet against specialist agents **before** committing to implementation.

**Use when:** You know what you want to build but want to check if the approach is sound.
**Don't use when:** Requirements are unclear (use `/processes:brainstorm` instead).

---

## How It Works

### Step 1: Parse Input

Classify what's being asked about: implementation, architecture, feature feasibility, performance, or security.

### Step 2: Select Agents

Pick **2-3 agents** most relevant to the input. Use your understanding of the topic — don't pattern-match on keywords. Max 3 agents per braindump to control cost.

Available agents (see `.claude/rules/workflows.md` for full list):

- `financial-data-validator` — money, double-entry, audit trails
- `security-sentinel` — OWASP, tenant isolation, input validation
- `performance-oracle` — N+1 queries, caching, scalability
- `architecture-strategist` — system design, domain boundaries
- `fastify-api-reviewer` — API routes, Zod schemas, middleware
- `nextjs-app-router-reviewer` — server/client boundaries
- `prisma-migration-reviewer` — schema safety, migrations
- `kieran-typescript-reviewer` — type safety, modern patterns
- `code-simplicity-reviewer` — YAGNI, over-engineering

### Step 3: Run Agents in Parallel

Launch selected agents using the Task tool. Each agent reviews the input independently.

### Step 4: Synthesize Findings

Consolidate into this format:

**What's Good** — strengths and alignment with best practices

**What Needs Attention** — issues tagged by severity:

- P1 Critical — blocks approval (security, data integrity)
- P2 Important — should address before proceeding
- P3 Nice-to-Have — optional improvements

**Alternatives** — better approaches, existing patterns to reuse, tradeoffs

**Verdict:**

- **Green Light** — proceed with confidence
- **Yellow Light** — good idea, address the flagged concerns first
- **Red Light** — significant concerns, explore alternatives
- **Better Way Exists** — approach works but here's a proven pattern

---

## Usage

```
/braindump "Adding invoice PDF export. Plan: generate server-side with pdfkit, stream to browser, cache in S3 for 24h. Is S3 caching the right approach?"
```

Be specific. Include context, constraints, and what tradeoffs you're considering. Vague inputs get vague feedback.

---

_~90 lines. Fast feedback, not final judgment. Use before investing time in implementation._
