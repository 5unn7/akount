---
name: processes:brainstorm
description: Collaboratively explore feature ideas and requirements before implementation planning
argument-hint: "[feature idea or problem to explore]"
---

# Workflow: Brainstorm

Brainstorming helps answer **WHAT** to build through collaborative dialogue before jumping into implementation planning.

**Current Date:** 2026-01-30

## When to Use This Workflow

- You have a feature idea but unclear requirements
- Need to explore different approaches
- Want to validate assumptions before planning
- Need to understand edge cases and constraints

## Quick Assessment

Before starting, check if you already have clear requirements:

**If you can answer these, skip to /workflows:plan instead:**
- What problem does this solve?
- Who are the users?
- What are the core features?
- What are the constraints?

**If unsure, proceed with brainstorming.**

---

## Phase 1: Understand the Concept

### Repository Context

First, let me understand the existing codebase:

1. **Check existing patterns**: Look at similar features in the codebase
2. **Review related code**: Find related components, services, or data models
3. **Check documentation**: Look in `docs/` for related context

### Guided Questions

Ask questions **one at a time** using AskUserQuestion tool to understand:

**Start Broad:**
1. What problem are we trying to solve?
2. Who will use this feature? (Solo entrepreneurs, accountants, specific user roles?)
3. What's the desired outcome?

**Then Narrow:**
4. What are the must-have capabilities?
5. Are there any constraints? (Performance, multi-currency, multi-tenant, etc.)
6. What edge cases should we consider?
7. How does this interact with existing features (invoicing, accounting, banking)?

### Tech Stack Context

**Akount Stack:**
- **Frontend**: Next.js 16 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL + Prisma
- **Auth**: Clerk
- **Multi-tenant**: All data isolated by tenantId
- **Multi-entity**: Support for multiple legal entities per tenant
- **Financial**: Integer cents for all amounts (no floats)

---

## Phase 2: Explore Approaches

Based on the discussion, present **2-3 concrete approaches** with:

### Option 1: [Recommended Approach]

**Description:** Brief overview of the approach

**Pros:**
- Advantage 1
- Advantage 2

**Cons:**
- Limitation 1
- Limitation 2

**Fits Akount Because:**
- Aligns with multi-tenant architecture
- Works with existing patterns
- Scales appropriately

### Option 2: [Alternative]

**Description:** Brief overview

**Pros/Cons:** Similar structure

### Option 3: [If Applicable]

**YAGNI Check:** Before presenting, verify this isn't over-engineering.

---

## Phase 3: Capture Decisions

Create a brainstorm document in `docs/brainstorms/` with this structure:

### File Path
```
docs/brainstorms/YYYY-MM-DD-<topic-name>-brainstorm.md
```

### Document Structure

```markdown
# [Feature Name] Brainstorm

**Date:** YYYY-MM-DD
**Status:** Brainstormed
**Related:** [Links to related docs, issues, PRs]

## Problem Statement

[What problem are we solving?]

## User Needs

[Who needs this and why?]

## Proposed Approach

[Chosen approach with rationale]

### Key Features
- Feature 1
- Feature 2
- Feature 3

### Constraints
- Multi-tenant isolation required
- Multi-currency support needed
- Performance: <200ms API responses
- Financial accuracy: Integer cents arithmetic

### Edge Cases
- Edge case 1
- Edge case 2

## Alternatives Considered

### [Alternative 1]
**Why Not:** [Reason for not choosing]

### [Alternative 2]
**Why Not:** [Reason for not choosing]

## Open Questions

- [ ] Question 1
- [ ] Question 2

## Next Steps

- [ ] Create detailed plan (/workflows:plan)
- [ ] Review with stakeholders
- [ ] Prototype if needed
```

---

## Phase 4: Next Steps

After capturing decisions, offer these options:

1. **Proceed to Planning** - Run `/workflows:plan [feature name]`
2. **Refine Further** - Continue brainstorming specific aspects
3. **Pause** - Save brainstorm for later review

Use AskUserQuestion to let user choose.

---

## Important Guidelines

### Do:
- ✓ Keep each section focused (200-300 words)
- ✓ Ask questions one at a time
- ✓ Consider multi-tenant and multi-entity implications
- ✓ Think about financial data integrity
- ✓ Reference existing Akount patterns

### Don't:
- ✗ **NEVER CODE!** Just explore and document
- ✗ Jump into implementation details
- ✗ Present more than 3 options
- ✗ Skip the YAGNI check
- ✗ Forget about tenant isolation

---

## Example: Invoice Template Feature

**Problem:** Users manually create similar invoices repeatedly.

**User Need:** Solo entrepreneurs want to save time on recurring invoices.

**Approach:** Invoice template system that stores reusable invoice structures.

**Key Features:**
- Save invoice as template
- Load template when creating new invoice
- Support for line items, tax rates, payment terms
- Per-entity templates (tenant + entity isolation)

**Constraints:**
- Templates must be tenant-isolated
- Support multi-currency
- Template data stored as JSON in database

**Next Step:** Create detailed plan → `/workflows:plan invoice-templates`

---

**Remember:** This workflow is about exploration, not execution. Stay focused on **WHAT** to build, not **HOW** to build it.
