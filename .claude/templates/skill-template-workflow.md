---
name: processes:YOUR-WORKFLOW
description: Multi-step workflow for [purpose]
model: claude-sonnet-4-5-20250929  # Workflows typically need highest quality
aliases:
  - "workflow-alias"
keywords:
  - "trigger-word"
argument-hint: "[optional-argument]"  # Remove if not needed
---

# Workflow: Your Workflow Name

Multi-step process for [purpose].

**Current Date:** {DATE}  # This will be populated automatically

---

## When to Use This Workflow

Use this workflow when:
- Use case 1
- Use case 2
- Use case 3

**Don't use this workflow when:**
- Anti-pattern 1
- Anti-pattern 2

---

## Prerequisites

Before starting:
- [ ] Prerequisite 1
- [ ] Prerequisite 2
- [ ] Prerequisite 3

---

## Phase 1: [Phase Name]

### Goal
What this phase accomplishes.

### Steps
1. Step 1 - Details
2. Step 2 - Details
3. Step 3 - Details

### Tools Used
- Tool 1 (e.g., Glob for finding files)
- Tool 2 (e.g., Read for examining code)

### Output
What gets produced by this phase.

**Example:**
```
[Example output]
```

---

## Phase 2: [Phase Name]

### Goal
What this phase accomplishes.

### Steps
1. Step 1
2. Step 2
3. Step 3

### Tools Used
- Tool 1
- Tool 2

### Output
What gets produced.

---

## Phase 3: [Phase Name]

### Goal
What this phase accomplishes.

### Steps
1. Step 1
2. Step 2
3. Step 3

### Tools Used
- Tool 1
- Tool 2

### Output
What gets produced.

---

## Next Steps

After completing this workflow:
1. **Option 1** → `/next-skill`
2. **Option 2** → Manual action needed
3. **Option 3** → Continue with implementation

---

## Integration with Other Workflows

**Before this workflow:**
- `/prep-workflow` - Preparation step

**After this workflow:**
- `/followup-workflow` - Next step in process

**Related workflows:**
- `/alternative-workflow` - Different approach for similar goal

---

## Important Guidelines

### Do:
- ✓ Guideline 1 - Why it's important
- ✓ Guideline 2 - Why it's important
- ✓ Guideline 3 - Why it's important

### Don't:
- ✗ Anti-pattern 1 - Why to avoid
- ✗ Anti-pattern 2 - Why to avoid
- ✗ Anti-pattern 3 - Why to avoid

---

## Quality Checks

At each phase, verify:
- [ ] Check 1
- [ ] Check 2
- [ ] Check 3

---

## Example: [Concrete Example]

**Scenario:** Real-world scenario description

**Step-by-step walkthrough:**

1. **Phase 1:** What happened
   - Input: ...
   - Output: ...

2. **Phase 2:** What happened
   - Input: ...
   - Output: ...

3. **Phase 3:** What happened
   - Input: ...
   - Output: ...

**Result:** Final outcome

---

## Troubleshooting

### Issue: [Common Problem]
**Symptom:** Description
**Solution:** How to fix

### Issue: [Common Problem]
**Symptom:** Description
**Solution:** How to fix

---

## Related Resources

- `.claude/agents/[agent-name].md` - Related agent
- `docs/path/to/doc.md` - Related documentation
- External resource (if applicable)

---

**Remember:** [Key takeaway for this workflow]

**Pro tip:** [Helpful hint for advanced usage]
