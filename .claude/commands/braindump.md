---
name: braindump
description: Get multi-agent feedback on suggestions, ideas, code, or architectural decisions
argument-hint: "[your suggestion, idea, or code]"
aliases:
  - get-feedback
  - agent-feedback
  - multi-agent-review
  - idea-feedback
keywords:
  - feedback
  - suggestion
  - idea
  - review
  - agents
  - analysis
  - validation
---

# Braindump: Get Multi-Agent Feedback

Have an idea, suggestion, or code snippet? Get instant feedback from all relevant specialized agents in your codebase—instantly see what's good, what needs work, and what alternatives exist.

**What it does:**
1. Takes your suggestion/code/idea as input
2. Intelligently routes to relevant agents based on patterns
3. Runs agents in parallel for instant feedback
4. Synthesizes findings into actionable recommendations
5. Tells you: what's solid, what's risky, and better approaches

**Current Date:** 2026-02-04

---

## Purpose

**When to use Braindump:**
- You have an idea and want expert feedback before committing time
- You wrote some code and want multi-perspective validation
- Proposing an architectural decision and want to test it
- Suggesting a feature and want feasibility assessment
- Uncertain about an approach and want specialist input

**Why it exists:**
- Get 18 specialized agent perspectives simultaneously
- Surface potential issues early (before implementation)
- Validate assumptions against domain knowledge
- Discover better alternatives you hadn't considered
- Save time by avoiding bad approaches upfront

---

## Usage

```bash
/braindump "Your suggestion, code, or idea here"
```

**Examples:**

```bash
# Architecture idea
/braindump "Should we cache invoice totals in the Invoice table or always calculate them?"

# Code snippet for feedback
/braindump "I want to add this GET endpoint that returns all transactions for the user"

# Feature suggestion
/braindump "Add dark mode support with a toggle in user settings"

# Implementation approach
/braindump "To fix the N+1 query on invoices, should we use eager loading or cached aggregations?"
```

---

## How It Works

### Phase 1: Parse Your Input

Identify what you're asking about:
- **Code snippet?** (implementation)
- **Architecture decision?** (system design)
- **Feature idea?** (product)
- **Approach question?** (strategy)
- **Performance concern?** (optimization)

### Phase 2: Intelligent Agent Routing

Automatically select agents based on patterns in your input:

| Pattern | Agents Invoked |
|---------|---|
| `financial`, `invoice`, `payment`, `money`, `calculate` | **financial-data-validator** - Money precision, double-entry, audit trails |
| `api`, `endpoint`, `route`, `fastify` | **fastify-api-reviewer** - API design, validation, auth |
| `auth`, `clerk`, `session`, `jwt` | **clerk-auth-reviewer** - Auth patterns, security |
| `database`, `schema`, `prisma`, `migration` | **prisma-migration-reviewer** - Schema safety, migrations |
| `next.js`, `react`, `server component`, `app router` | **nextjs-app-router-reviewer** - Server/Client boundaries, async patterns |
| `security`, `vulnerability`, `xss`, `injection`, `access` | **security-sentinel** - OWASP, input validation, IDOR |
| `performance`, `slow`, `n+1`, `optimization` | **performance-oracle** - Database queries, caching, complexity |
| `typescript`, `type`, `strict`, `any` | **kieran-typescript-reviewer** - Type safety, modern patterns |
| `architecture`, `design`, `pattern`, `boundary` | **architecture-strategist** - System design, multi-tenant, domain boundaries |
| `monorepo`, `workspace`, `turbo`, `dependencies` | **turborepo-monorepo-reviewer** - Workspace structure, build pipeline |
| **Always included** | **code-simplicity-reviewer** - YAGNI, over-engineering, complexity |

**Multiple patterns?** Multiple agents run in parallel.

### Phase 3: Parallel Agent Analysis

Each selected agent reviews your input independently:
- Financial logic validated for accuracy and compliance
- Security checked for vulnerabilities
- Performance analyzed for bottlenecks
- Architecture assessed for design alignment
- Code patterns evaluated for quality
- Complexity reviewed for simplification opportunities

**All agents run simultaneously** for instant feedback.

### Phase 4: Findings Synthesis

Consolidate all agent reports into a structured analysis:

#### ✅ What's Good
- Aspects that align with best practices
- Patterns that follow established conventions
- Strengths in the approach

#### ⚠️ What Needs Attention
- Potential issues or risks
- Better patterns available in codebase
- Architectural misalignments
- Performance or security concerns

#### 💡 Alternatives & Suggestions
- Better approaches than what you proposed
- Similar patterns already in codebase you could reuse
- Tradeoffs between different options
- "We already do this, but better" explanations

#### ✨ Verdict
- **Green Light** - Solid approach, proceed with confidence
- **Yellow Light** - Good idea with some important considerations
- **Red Light** - Significant concerns, explore alternatives first
- **Better Way Exists** - Current approach OK, but here's a proven pattern

---

## Example Outputs

### Example 1: API Endpoint Proposal

**Your Input:**
```
/braindump "I want to create a GET /api/invoices endpoint that returns all invoices with their line items and payments"
```

**Agents Invoked:**
- security-sentinel (API endpoints, tenant isolation)
- fastify-api-reviewer (API design, validation)
- performance-oracle (N+1 queries, pagination)
- architecture-strategist (tenant isolation, domain boundaries)
- kieran-typescript-reviewer (type safety)

**Synthesis Output:**
```
✅ WHAT'S GOOD
- Solid RESTful endpoint structure
- Type safety considerations are good
- Recognizing need to include relationships

⚠️  WHAT NEEDS ATTENTION
- 🔴 CRITICAL: Missing tenantId filter (security-sentinel)
- 🔴 CRITICAL: N+1 query risk with line items + payments (performance-oracle)
- 🟡 IMPORTANT: No pagination for large datasets (performance-oracle)
- 🟡 IMPORTANT: Missing Zod schema validation (fastify-api-reviewer)

💡 ALTERNATIVES & SUGGESTIONS
- Use eager loading: `include: { lines: true, payments: true }`
- Add pagination: `skip` and `take` parameters
- Similar pattern exists in GET /api/bills - check that implementation
- Consider if you really need all nested data, or break into separate endpoints

✨ VERDICT: 🟡 YELLOW LIGHT
Good instinct on the endpoint, but fix critical N+1 query and tenant isolation issues first.
See GET /api/bills for reference implementation.
```

### Example 2: Dark Mode Feature

**Your Input:**
```
/braindump "Add dark mode support with toggle in user settings"
```

**Agents Invoked:**
- architecture-strategist (system design, adding new feature)
- nextjs-app-router-reviewer (client-side state management)
- code-simplicity-reviewer (complexity analysis)

**Synthesis Output:**
```
✅ WHAT'S GOOD
- User-facing feature that adds value
- Settings UI already exists as integration point
- Straightforward scope (just theme toggle)

⚠️ WHAT NEEDS ATTENTION
- 🟡 IMPORTANT: Design system doesn't currently have dark mode tokens (architecture-strategist)
- 🟡 IMPORTANT: Would need Tailwind dark: selector configuration (architecture-strategist)
- 🔵 NICE-TO-HAVE: Consider system preference vs user override (UX question)

💡 ALTERNATIVES & SUGGESTIONS
- Check design-system docs for planned dark mode work
- Could be phased: Phase 1 = preference, Phase 2 = full dark mode tokens
- System preference detection is lower effort than full dark mode
- Better approach: Add to design system roadmap first, then implement

✨ VERDICT: 🟡 YELLOW LIGHT
Good feature request, but blocked by design system work. Might not be next priority.
Talk to design team about dark mode roadmap before implementing.
```

### Example 3: Code Suggestion

**Your Input:**
```
/braindump
"Should I create an InvoiceService class to centralize invoice logic instead of
spreading it across route handlers?"
```

**Agents Invoked:**
- architecture-strategist (service layers, domain boundaries)
- code-simplicity-reviewer (abstractions, YAGNI)
- kieran-typescript-reviewer (class patterns)

**Synthesis Output:**
```
✅ WHAT'S GOOD
- Recognizing opportunity to centralize logic
- Thinking about code organization

⚠️ WHAT NEEDS ATTENTION
- 🟡 IMPORTANT: "Wait for 3+ uses before abstracting" (code-simplicity-reviewer)
- 🟡 IMPORTANT: Check if invoice logic is already scattered or just in 1-2 places (architecture-strategist)
- 🟡 IMPORTANT: Verify this is actual duplication, not hypothetical (code-simplicity-reviewer)

💡 ALTERNATIVES & SUGGESTIONS
- Count invoice-related logic: if in 2 places, keep in routes
- If in 3+ places, create service
- Better pattern: Start with utilities folder, extract to service if it grows
- Check existing codebase: does Entity have a similar pattern?

✨ VERDICT: 🟡 YELLOW LIGHT (ASK FIRST)
Good thinking about organization, but we wait for 3+ uses before abstracting.
Count how many places actually use invoice logic before deciding.
```

---

## What to Expect

### Speed
- **Input:** 10 seconds
- **Agent Analysis:** ~30 seconds (parallel)
- **Synthesis:** ~10 seconds
- **Total:** ~1 minute for comprehensive multi-agent feedback

### Output Format

Every braindump analysis includes:

1. **Quick Verdict** (Green/Yellow/Red/Better Way)
2. **What's Good** (3-5 positive aspects)
3. **What Needs Attention** (issues by severity)
4. **Alternatives & Suggestions** (better approaches)
5. **Next Steps** (specific actions)
6. **Agent Summary** (which agents reviewed and key points)

### Severity Levels

- 🔴 **P1 Critical** - Blocks approval, security/data integrity risk
- 🟡 **P2 Important** - Should address before proceeding
- 🔵 **P3 Nice-to-Have** - Optional improvements

---

## Best Practices

### DO:
- ✓ Be specific about what you're asking
- ✓ Include code snippets for implementation questions
- ✓ Mention context (is this for new feature or refactoring?)
- ✓ Ask about trade-offs you're considering
- ✓ Use for validation before starting work

### DON'T:
- ✗ Be vague ("Is this good?" without context)
- ✗ Ask about unrelated topics
- ✗ Treat verdict as absolute (agents have opinions, not gospel)
- ✗ Ignore critical (🔴) findings without good reason
- ✗ Skip validation on risky decisions (security, financial)

---

## Common Questions

**Q: Will braindump replace human code review?**
A: No. Braindump is pre-review feedback to catch issues early. Human review is still essential.

**Q: Why do some agents not fire?**
A: Braindump intelligently routes agents based on patterns in your input. If no patterns match, that agent doesn't run. This saves cost and time.

**Q: What if I disagree with the verdict?**
A: Question it! Agent analysis is input for your decision-making, not a veto. You might have context they don't.

**Q: Can I ignore 🔴 P1 findings?**
A: Only if you have very good reason. P1 issues block merges and should be addressed.

**Q: How is this different from `/processes:review`?**
A: `processes:review` analyzes completed PRs. Braindump validates ideas *before* you code them.

---

## Examples by Domain

### Financial/Accounting Questions
```
/braindump "How should we handle partial payment allocation when an invoice has multiple line items?"
→ Runs: financial-data-validator, security-sentinel, architecture-strategist
```

### API Design Questions
```
/braindump "Should payment endpoints be at /api/payments or /api/invoices/:id/payments?"
→ Runs: fastify-api-reviewer, architecture-strategist, security-sentinel
```

### Performance Questions
```
/braindump "Dashboard loads 50 transactions. Should I paginate or load all?"
→ Runs: performance-oracle, nextjs-app-router-reviewer, code-simplicity-reviewer
```

### Architectural Questions
```
/braindump "Add new 'Expense' entity. How does it fit in current schema?"
→ Runs: architecture-strategist, prisma-migration-reviewer, security-sentinel
```

---

## Agent Reference

**18 Specialized Agents Available:**

**Financial & Data:**
- financial-data-validator (money, accounting, invoices, payments)
- prisma-migration-reviewer (schema, migrations, data safety)

**Security & Authentication:**
- security-sentinel (OWASP, input validation, tenant isolation)
- clerk-auth-reviewer (auth patterns, JWT, sessions)

**Performance & Architecture:**
- performance-oracle (N+1 queries, optimization, caching)
- architecture-strategist (system design, domain boundaries, multi-tenant)

**Framework-Specific:**
- fastify-api-reviewer (API routes, validation, middleware)
- nextjs-app-router-reviewer (Server/Client components, async patterns)
- turborepo-monorepo-reviewer (workspace structure, dependencies)

**Code Quality:**
- kieran-typescript-reviewer (type safety, modern patterns)
- code-simplicity-reviewer (YAGNI, over-engineering)
- pattern-recognition-specialist (design patterns, duplication)

**Data & Deployment:**
- data-migration-expert (data transformations, rollbacks)
- deployment-verification-agent (deployment checklists, verification)

See `.claude/agents/review/README.md` for detailed agent information.

---

## When to Use Other Skills

- **Full code review of PR?** → Use `/processes:review`
- **Planning implementation?** → Use `/processes:plan`
- **Need architectural deep-dive?** → Use `/deepen-plan`
- **Documenting solution?** → Use `/processes:compound`

---

## Tips

**Get better feedback by:**
1. Being specific about context
2. Providing code snippets (not just descriptions)
3. Mentioning constraints or requirements
4. Asking about trade-offs explicitly
5. Following up on recommendations

**Example of good braindump input:**
```
/braindump
"Adding invoice PDF export feature. Current approach:
1. Generate PDF server-side using pdfkit
2. Stream to browser
3. Cache PDFs in S3 for 24 hours

Concerns: Is S3 caching the right approach? Better alternatives?"
```

**Example of vague input:**
```
/braindump "Is this good?"  ← Won't get great feedback
```

---

## Notes

- Braindump is **fast feedback**, not final judgment
- Use for validation before big commitments
- Run on ideas, not just final code
- Combine with human judgment for best results
- Multiple runs OK (iterate on feedback)

---

**Remember:** The best feedback is early feedback. Use braindump to validate ideas before investing time in implementation.
