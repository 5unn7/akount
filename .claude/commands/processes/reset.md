---
name: processes:reset
description: Reset context and realign with project rules when AI diverges
argument-hint: "[optional: specific rule or area to focus on]"
---

# Workflow: Context Reset

**Purpose:** Guardrail protocol to realign AI behavior when it diverges from project rules.

**Trigger Phrases:**
- "Reset context"
- "You're off track"
- "Check the rules"
- "Reload context"
- `/processes:reset`

---

## When to Use

Run this workflow when:
- AI creates files in wrong locations
- AI uses floats for money instead of integer cents
- AI forgets to include tenantId in queries
- AI proposes destructive actions without warning
- AI ignores established patterns
- AI seems confused about project structure
- Session has gone too long without context refresh

---

## Protocol Steps

### Step 1: Acknowledge Divergence

**Action:** Explicitly state what went wrong.

```markdown
## Context Reset Triggered

**Divergence Identified:**
- [What rule was violated]
- [Where the violation occurred]
- [Impact of the violation]

**Acknowledgment:**
I acknowledge that I [specific violation]. This violates [specific rule/standard].
```

---

### Step 2: Reload Critical Context

**Action:** Re-read and internalize core rules.

#### 2.1 Read CLAUDE.md
```bash
# Reload project context
cat CLAUDE.md
```

**Extract and state:**
- Critical rules (ZERO EXCEPTIONS)
- File location rules
- Decision protocol

#### 2.2 Read Domain Glossary Invariants
```bash
# Reload domain invariants
cat docs/domain-glossary.md | grep -A 5 "Invariants:"
```

**Key invariants to reaffirm:**
- Tenant isolation: Every query MUST filter by tenantId
- Money precision: All amounts stored as integer cents
- Double-entry: SUM(debits) === SUM(credits)
- Soft delete: Never hard delete financial records
- Source preservation: Store original documents

#### 2.3 Read Relevant Standards
```bash
# For financial violations
cat docs/standards/financial-data.md

# For tenancy violations
cat docs/standards/multi-tenancy.md

# For security violations
cat docs/standards/security.md

# For API violations
cat docs/standards/api-design.md
```

---

### Step 3: State Correction

**Action:** Explicitly commit to correct behavior.

```markdown
## Correction Statement

**I will now follow these rules:**

1. **[Rule 1]:** [How I will apply it]
2. **[Rule 2]:** [How I will apply it]
3. **[Rule 3]:** [How I will apply it]

**Specific corrections for this session:**
- [What I will do differently]
- [What I will not do again]
```

---

### Step 4: Resume with Guard

**Action:** Continue work with explicit rule checking.

Before EVERY action, verify:

```markdown
## Pre-Action Checklist

- [ ] Does this follow file location rules?
- [ ] Does this use integer cents for money?
- [ ] Does this include tenantId in queries?
- [ ] Is this a non-destructive action?
- [ ] Does this match established patterns?
- [ ] Should I ask the user before proceeding?
```

---

## Quick Reset Commands

### Full Reset
```bash
/processes:reset
```
Runs complete protocol (Steps 1-4).

### Financial Rules Reset
```bash
/processes:reset financial
```
Focus on:
- Integer cents (never float)
- Double-entry bookkeeping
- Soft delete only
- Source document preservation

### Tenancy Rules Reset
```bash
/processes:reset tenancy
```
Focus on:
- Always filter by tenantId
- Tenant context in every service
- No cross-tenant data leaks

### File Location Reset
```bash
/processes:reset files
```
Focus on:
- Brainstorms → `docs/brainstorms/`
- Plans → `docs/plans/`
- Sessions → `docs/archive/sessions/`
- Allowed root files only

### Security Reset
```bash
/processes:reset security
```
Focus on:
- Never read/write .env files
- Warn before destructive actions
- Input validation
- OWASP considerations

---

## Reset Checklist

After reset, verify:

- [ ] CLAUDE.md rules understood
- [ ] Domain invariants memorized
- [ ] Relevant standards reviewed
- [ ] Correction statement made
- [ ] Ready to proceed with guards

---

## Common Violations & Corrections

### Violation: Float for Money
```typescript
// WRONG
amount: 10.50

// CORRECT
amount: 1050 // Integer cents
```

### Violation: Missing tenantId
```typescript
// WRONG
await prisma.invoice.findMany()

// CORRECT
await prisma.invoice.findMany({
  where: { tenantId: ctx.tenantId }
})
```

### Violation: Wrong File Location
```
// WRONG
/brainstorm-feature-x.md (root)

// CORRECT
/docs/brainstorms/2026-02-07-feature-x-brainstorm.md
```

### Violation: Hard Delete
```typescript
// WRONG
await prisma.invoice.delete({ where: { id } })

// CORRECT
await prisma.invoice.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

### Violation: Unbalanced Journal Entry
```typescript
// WRONG
lines: [
  { debitAmount: 1000, creditAmount: 0 }
  // Missing credit side!
]

// CORRECT
lines: [
  { debitAmount: 1000, creditAmount: 0 },
  { debitAmount: 0, creditAmount: 1000 }
]
// SUM(debits) === SUM(credits) ✓
```

---

## Self-Assessment Questions

Ask yourself after reset:

1. Can I state the 4 critical rules from memory?
2. Do I know where different file types belong?
3. Can I explain why we use integer cents?
4. Do I understand tenant isolation requirements?
5. What should I ask the user about before proceeding?

---

## Example Reset Output

```markdown
# Context Reset - 2026-02-07

## Divergence Identified
- **Rule Violated:** Money as Integer Cents
- **Location:** Suggested `amount: 10.50` in invoice creation
- **Impact:** Would cause precision errors in financial calculations

## Acknowledgment
I acknowledge that I suggested using a float value (10.50) for a monetary amount. This violates the "Money as Integer Cents" standard documented in docs/standards/financial-data.md.

## Context Reloaded
- ✅ Read CLAUDE.md critical rules
- ✅ Read docs/domain-glossary.md invariants
- ✅ Read docs/standards/financial-data.md

## Correction Statement
I will now follow these rules:
1. **Money Precision:** Always use integer cents (1050, not 10.50)
2. **Formatting:** Use formatMoney() for display, never store formatted strings
3. **Calculations:** Perform all math in cents, convert only for display

## Resuming with Guards
- Before any money-related code, verify integer cents
- Format only at the UI boundary
- Test: 1050 + 525 = 1575 (not 10.50 + 5.25)

Ready to continue with corrected approach.
```

---

## Related Resources

- `CLAUDE.md` - Project context and rules
- `docs/domain-glossary.md` - Term definitions and invariants
- `docs/standards/` - Implementation standards
- `docs/architecture.mmd` - System architecture
- `docs/repo-map.md` - Code locations

---

**Remember: Reset is not failure. It's a guardrail that keeps the project safe.**
