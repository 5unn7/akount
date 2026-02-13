---
name: processes:reset
description: Reset context and realign with project rules when AI diverges
---

# Workflow: Reset

Reset Claude's context and realign with project rules when behavior drifts.

**When to Use:** AI forgets rules, uses floats for money, skips tenant filters, creates files in wrong locations.

---

## Immediate Actions

**If Claude is:**

- Using floats for money → Mention "integer cents"
- Missing tenantId → Mention "tenant isolation"
- Creating files in wrong places → Mention "file location rules"
- Ignoring design system → Mention "shadcn-glass-ui"

**Trigger phrase:** "Reset context" or "Check the rules"

---

## What This Does

1. **Re-loads core context** from CLAUDE.md
2. **Re-loads rules** from `.claude/rules/*.md`
3. **Re-loads memory** from MEMORY.md
4. **Reminds of invariants:** tenantId, integer cents, soft delete, double-entry

---

## Quick Reset Checklist

When Claude diverges, remind it:

**Financial Rules:**

- [ ] Money is integer cents (1050 = $10.50), never floats
- [ ] tenantId required in ALL queries
- [ ] SUM(debits) === SUM(credits) always
- [ ] Soft delete only (deletedAt), never hard delete

**File Locations:**

- [ ] Plans → `docs/plans/`
- [ ] Brainstorms → `docs/brainstorms/`
- [ ] Session reports → `docs/archive/sessions/`
- [ ] No root-level markdown files (except README, CLAUDE.md, STATUS.md, TASKS.md, ROADMAP.md)

**Design System:**

- [ ] shadcn/ui + shadcn-glass-ui@2.11.2
- [ ] Tailwind v4 (CSS config, no tailwind.config.ts)
- [ ] Button radius: 8px
- [ ] Server Components by default, 'use client' when needed

**API Patterns:**

- [ ] Route → Schema (Zod) → Service → Prisma
- [ ] TenantContext in every service function
- [ ] Middleware chain: Auth → Tenant → Validation → Handler

---

## Common Drift Patterns

### Pattern 1: Using Floats for Money

**Wrong:** `amount: 10.50`
**Correct:** `amount: 1050` (integer cents)

**Reset command:** "Use integer cents for all money amounts. 1050 = $10.50."

### Pattern 2: Missing tenantId

**Wrong:** `prisma.invoice.findMany()`
**Correct:** `prisma.invoice.findMany({ where: { entity: { tenantId: ctx.tenantId } } })`

**Reset command:** "Every query MUST filter by tenantId. Tenant isolation is critical."

### Pattern 3: Wrong File Locations

**Wrong:** Creating `feature-plan.md` in root
**Correct:** Creating `docs/plans/YYYY-MM-DD-feature-plan.md`

**Reset command:** "Plans go in docs/plans/, brainstorms in docs/brainstorms/. Check file location rules."

### Pattern 4: Hard Delete

**Wrong:** `prisma.invoice.delete({ where: { id } })`
**Correct:** `prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } })`

**Reset command:** "Use soft delete only. Set deletedAt, never hard delete financial records."

---

## Full Context Reload

If simple reminders don't work:

```markdown
Read the following to realign:

1. **Core rules:** CLAUDE.md
2. **Financial rules:** .claude/rules/financial-rules.md
3. **API conventions:** .claude/rules/api-conventions.md
4. **Frontend conventions:** .claude/rules/frontend-conventions.md
5. **Current state:** MEMORY.md

**5 Key Invariants:**
1. Tenant isolation (tenantId in all queries)
2. Integer cents for money (never floats)
3. Double-entry bookkeeping (debits = credits)
4. Soft delete (deletedAt field)
5. Source preservation (sourceDocument JSON)
```

---

## After Reset

**Verify alignment:**

- [ ] Claude acknowledges the rules
- [ ] Next response follows invariants
- [ ] File locations correct
- [ ] Code patterns match standards

**If still off-track:**

- Try `/processes:begin` for full session context
- Check if user's custom instructions conflict
- Consider starting new session

---

## Prevention

**To avoid drift:**

- Keep sessions under 100 messages
- Use `/processes:begin` at session start
- Commit often (don't let work pile up uncommitted)
- Reference rules explicitly when needed

---

_Lines: ~150 (slimmed from 315). Quick reset when AI diverges._
