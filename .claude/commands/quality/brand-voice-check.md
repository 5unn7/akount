---
name: quality:brand-voice-check
description: Ensure consistent Akount brand voice in user-facing content
model: claude-sonnet-3-7-20250219
aliases:
  - brand-check
  - tone-check
  - voice-check
keywords:
  - brand
  - tone
  - voice
  - copy
  - writing
  - content
---

# Brand Voice Check

Validates user-facing content matches Akount brand voice.

## Brand Guidelines

**Tone:**
- Professional yet approachable
- Clear and concise
- Empowering (not patronizing)
- Canadian (colour, centre, etc.)

**Voice:**
- Active voice preferred
- Second person ("you") for user instructions
- First person plural ("we") for product features
- Avoid jargon

**Terminology:**
- "Accounting" not "bookkeeping"
- "Freelancer" not "contractor"
- "Dashboard" not "homepage"
- "Transaction" not "entry"

## What to Check

1. **Spelling:** Canadian English (colour, labour, centre)
2. **Tone:** Professional + approachable
3. **Clarity:** Scannable, not dense
4. **Consistency:** Matches existing docs
5. **Accessibility:** Plain language, clear CTAs

## Usage

```bash
/quality:brand-voice-check
```

Agent reviews recent changes to:
- User-facing components
- Documentation
- Error messages
- Help text
- Marketing copy

Reports inconsistencies with specific line numbers.

## Review Process

### Step 1: Identify User-Facing Content

Find all content users will see:
```bash
# Find UI components
Glob "apps/web/**/*.tsx"

# Find documentation
Glob "docs/**/*.md"

# Check for changes
git diff main --name-only
```

### Step 2: Check Against Guidelines

For each piece of content:
- [ ] Canadian spelling used consistently
- [ ] Tone is professional + approachable
- [ ] Clear and scannable
- [ ] Proper terminology
- [ ] No jargon or technical terms without explanation

### Step 3: Report Issues

**Format:**
```
❌ apps/web/components/InvoiceCard.tsx:45
Found: "bookkeeping"
Should be: "accounting"
Reason: Use "accounting" per brand guidelines

✓ apps/web/components/Dashboard.tsx
Tone and voice consistent with brand guidelines
```

## Canadian English Reference

**Correct:**
- colour (not color)
- centre (not center)
- labour (not labor)
- licence (noun), license (verb)
- analyse, organise, optimise
- cheque (not check)
- grey (not gray)

## Tone Examples

**✅ Good (Professional + Approachable):**
- "Let's organize your finances"
- "You're all caught up!"
- "Choose the account you'd like to reconcile"
- "We'll help you track every transaction"

**❌ Bad (Too formal or patronizing):**
- "Please proceed to initiate financial reconciliation"
- "Great job! You're doing amazing!"
- "Select the appropriate financial instrument"
- "Don't worry, we've got this!"

## Terminology Guide

| ✅ Use | ❌ Avoid | Reason |
|--------|----------|---------|
| Accounting | Bookkeeping | More professional |
| Freelancer | Contractor | Target audience term |
| Dashboard | Homepage | Specific purpose |
| Transaction | Entry | Clearer for users |
| Account | Ledger | Simpler term |
| Reconcile | Match | Industry term, but explain first use |
| Invoice | Bill (when issuing) | Standard terminology |
| Bill | Invoice (when receiving) | Standard terminology |

## Edge Cases

**Technical Terms:**
- OK in developer docs
- Require explanation in user docs
- Use tooltips in UI

**Acronyms:**
- Spell out first use: "General Ledger (GL)"
- OK after first use: "GL account"

**Currency:**
- Always show symbol: $10.00 (not 10 dollars)
- Canadian default: CAD
- Support multi-currency display

## Output Format

### Summary
- **Files Checked:** X files
- **Issues Found:** Y issues
- **Severity:** [Low / Medium / High]

### Issues

For each issue:
```
❌ File: path/to/file.tsx:line
Context: "existing text"
Issue: Brief description
Fix: "suggested text"
Priority: [Low / Medium / High]
```

### Approval

- ✅ **APPROVED** - All content follows brand guidelines
- ⚠️ **SUGGESTIONS** - Minor improvements recommended
- ❌ **REQUIRES CHANGES** - Brand voice violations found

## Related Resources

- `docs/design-system/` - Design system documentation
- `CLAUDE.md` - Project standards
- Canadian Press style guide (external reference)
