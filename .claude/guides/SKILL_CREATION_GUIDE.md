# Skill Creation Guide

**Last Updated:** 2026-02-01
**Purpose:** Guide for creating new Claude Code skills when patterns become repeatable

---

## When to Create a New Skill

**Create a skill if ANY of these are true:**
- ✅ You're repeating the same sequence 3+ times
- ✅ Multiple team members do the same task
- ✅ Takes >5 steps to accomplish repeatedly
- ✅ Could save significant time through automation
- ✅ Pattern would benefit other projects

**Don't create a skill if:**
- ❌ One-time task
- ❌ Too specific to one codebase
- ❌ Already covered by existing skill
- ❌ Takes longer to maintain than execute manually

---

## Decision Tree

```
Is this repeatable? → NO → Don't create skill
      ↓ YES
Takes >5 steps? → NO → Don't create skill
      ↓ YES
Used by 2+ people? → NO → Maybe later
      ↓ YES
CREATE SKILL ✓
```

---

## Types of Skills

### 1. Utility Skills (root `.claude/commands/`)
- **Purpose:** One-off operations
- **Examples:** `changelog`, `deepen-plan`
- **Template:** Use `skill-template-simple.md`
- **Complexity:** Low to medium
- **Model:** Inherit or Sonnet 3.7

### 2. Workflow Skills (`.claude/commands/processes/`)
- **Purpose:** Multi-step processes
- **Examples:** `brainstorm`, `plan`, `work`
- **Template:** Use `skill-template-workflow.md`
- **Complexity:** High
- **Model:** Sonnet 4.5 (inherit)

### 3. Quality Skills (`.claude/commands/quality/`)
- **Purpose:** Validation/checking
- **Examples:** `brand-voice-check`, `design-system-enforce`
- **Template:** Use `skill-template-simple.md`
- **Complexity:** Low to medium
- **Model:** Haiku or Sonnet 3.7

---

## Step-by-Step Creation

### Step 1: Choose Template

```bash
# For utility or quality skills:
cp .claude/templates/skill-template-simple.md .claude/commands/my-skill.md

# For workflow skills:
cp .claude/templates/skill-template-workflow.md .claude/commands/processes/my-workflow.md

# For quality skills:
cp .claude/templates/skill-template-simple.md .claude/commands/quality/my-check.md
```

### Step 2: Fill in Frontmatter

```yaml
---
name: my-skill  # OR processes:my-workflow OR quality:my-check
description: Clear one-sentence description of what it does
model: claude-sonnet-3-7-20250219  # Or haiku for simple, sonnet 4.5 for critical
aliases:
  - "short-name"
  - "alternative-name"
keywords:
  - "trigger-word-1"
  - "trigger-word-2"
argument-hint: "[optional-arg]"  # If skill takes arguments
---
```

**Model selection:**
- `claude-haiku-4-20250101` - Fast, simple pattern matching
- `claude-sonnet-3-7-20250219` - Standard validation, moderate complexity
- `claude-sonnet-4-5-20250929` or `inherit` - Critical financial/security/architecture

### Step 3: Write Skill Content

**Structure:**
```markdown
# Skill Name

Brief description (1-2 sentences)

## Purpose

What problem does this solve?

## Usage

```bash
/my-skill [args]
```

## What It Does

Step-by-step description

## Examples

Real-world use cases

## Notes

Edge cases, limitations
```

**Key sections:**
1. **Purpose** - Why this skill exists
2. **Usage** - How to invoke it
3. **What It Does** - Step-by-step process
4. **Examples** - Concrete use cases
5. **Notes** - Important considerations

### Step 4: Test Skill

```bash
# Start new Claude Code conversation
/my-skill

# Expected: Skill loads and executes
# If error: Check frontmatter syntax, file location
```

**Testing checklist:**
- [ ] Skill loads without errors
- [ ] Frontmatter parsed correctly
- [ ] Aliases work
- [ ] Arguments handled properly
- [ ] Output is useful

### Step 5: Register Skill

**Update:** `.claude/SKILLS-INDEX.md`

```markdown
## [Category] Skills (X skills)

X. **my-skill** - Brief description
```

**Update:** `.claude/agents/REGISTRY.json` (if exists)

```json
{
  "skills": {
    "my-skill": {
      "file": "commands/my-skill.md",
      "type": "utility",
      "category": "documentation",
      "model": "claude-sonnet-3-7-20250219",
      "patterns": ["keyword1", "keyword2"],
      "status": "active",
      "createdDate": "2026-02-01"
    }
  }
}
```

### Step 6: Document in CLAUDE.md (if important)

Add to "Smart Skill Discovery" section if it's a commonly-used skill.

```markdown
**[Category]:**
- [Use case]? → `/my-skill` or `short-alias`
```

---

## Validation Checklist

Before merging:
- [ ] Frontmatter complete (name, description, model, aliases, keywords)
- [ ] Skill tested independently
- [ ] Added to SKILLS-INDEX.md
- [ ] No duplicate names
- [ ] Clear usage examples
- [ ] Edge cases documented
- [ ] Aliases make sense
- [ ] Keywords accurate

---

## Naming Conventions

**Utilities:** `verb-noun`
- Examples: `generate-changelog`, `analyze-coverage`

**Workflows:** `processes:verb`
- Examples: `processes:brainstorm`, `processes:review`

**Quality:** `quality:noun-verb`
- Examples: `quality:brand-check`, `quality:design-enforce`

**General rules:**
- Use kebab-case: `my-skill-name`
- Be specific: `analyze-test-coverage` not `check`
- Use verbs: `generate`, `analyze`, `enforce`, `review`

---

## Common Pitfalls

### 1. Too Specific
**Problem:** Skill works only for one file/component
**Solution:** Generalize to work for similar patterns

### 2. Too Generic
**Problem:** Skill tries to do everything
**Solution:** Split into multiple focused skills

### 3. No Examples
**Problem:** Users don't understand how to use it
**Solution:** Add 2-3 concrete examples

### 4. Missing Aliases
**Problem:** Skill hard to discover
**Solution:** Add intuitive short names

### 5. Wrong Model
**Problem:** Using expensive model for simple task
**Solution:** Use Haiku for pattern matching, Sonnet 3.7 for standard, Sonnet 4.5 for critical

### 6. Poor Documentation
**Problem:** Unclear purpose or usage
**Solution:** Write clear "Why" and "How" sections

### 7. No Edge Cases
**Problem:** Skill fails on unexpected input
**Solution:** Document limitations and edge cases

---

## Examples

### Good Skill: changelog

**Why it's good:**
- ✅ Repeatable (release notes every sprint)
- ✅ Clear purpose (generate changelogs)
- ✅ Good aliases (generate-changelog, release-notes)
- ✅ Appropriate model (inherit - not critical)
- ✅ Clear examples and usage

### Good Skill: quality:test-coverage-analyze

**Why it's good:**
- ✅ Specific category (quality/)
- ✅ Clear purpose (find test gaps)
- ✅ Multiple aliases (test-gaps, coverage-check)
- ✅ Right model (Sonnet 3.7 - moderate complexity)
- ✅ Comprehensive output format

### Bad Skill Example: do-everything

**Why it's bad:**
- ❌ Too generic (what does it do?)
- ❌ No clear use case
- ❌ No examples
- ❌ Tries to handle all scenarios

---

## Model Selection Guide

### Use Haiku (`claude-haiku-4-20250101`)

**When:**
- Simple pattern matching
- Fast, frequent operations
- No complex reasoning needed
- Low stakes (suggestions, not decisions)

**Examples:**
- `design-system-enforce` - Pattern matching colors/fonts
- `pattern-recognition-specialist` - Simple pattern detection

### Use Sonnet 3.7 (`claude-sonnet-3-7-20250219`)

**When:**
- Moderate complexity
- Standard validation
- Non-critical analysis
- Good balance of cost/quality

**Examples:**
- `quality:brand-voice-check` - Tone analysis
- `quality:test-coverage-analyze` - Test gap detection
- `quality:a11y-review` - Accessibility checks

### Use Sonnet 4.5 (`inherit` or `claude-sonnet-4-5-20250929`)

**When:**
- Financial calculations
- Security decisions
- Architecture analysis
- Complex reasoning required
- Zero tolerance for errors

**Examples:**
- `processes:plan` - Implementation planning
- `processes:work` - Guided development
- `processes:review` - Comprehensive review

---

## Maintenance Guidelines

### Regular Reviews

**Every 3 months:**
- [ ] Review usage patterns
- [ ] Update documentation
- [ ] Check for obsolete skills
- [ ] Gather user feedback

### When to Update

**Update a skill when:**
- Usage patterns change
- Better approach discovered
- User feedback received
- Related skills added

### When to Deprecate

**Deprecate a skill when:**
- Not used in 3+ months
- Replaced by better skill
- Functionality merged elsewhere
- Maintenance burden too high

See: `.claude/DEPRECATION_POLICY.md`

---

## Integration with Agents

**Skills can invoke agents:**

```markdown
## Review Process

Use the following agents:
- `financial-data-validator` for money calculations
- `security-sentinel` for auth checks
- `architecture-strategist` for design decisions
```

**Agents vs Skills:**
- **Agents** - Autonomous, run independently, used by Task tool
- **Skills** - User-invoked, structured workflows, use agents internally

---

## Advanced Patterns

### Skills with Arguments

```yaml
---
name: my-skill
argument-hint: "[required-arg] [optional-arg]"
---

## Usage

```bash
/my-skill "value" --flag
```

**Arguments:**
- `required-arg` - Description
- `optional-arg` - Description (default: value)
```

### Skills with Conditional Branches

```markdown
## Process

### If [condition]:
1. Do A
2. Do B

### Otherwise:
1. Do X
2. Do Y
```

### Skills with External Tools

```markdown
## Tools Used

- `gh` - GitHub CLI for PR operations
- `git` - Git commands for history
- Web search for external docs
```

---

## Resources

**Templates:**
- `.claude/templates/skill-template-simple.md`
- `.claude/templates/skill-template-workflow.md`

**Examples:**
- `.claude/commands/` - All existing skills
- `.claude/commands/processes/` - Workflow examples
- `.claude/commands/quality/` - Quality check examples

**Documentation:**
- `.claude/SKILLS-INDEX.md` - Complete skill index
- `.claude/agents/TIERING-GUIDE.md` - Model selection
- `.claude/DEPRECATION_POLICY.md` - Deprecation process

---

## Getting Help

**Questions:**
- Check existing skills for patterns
- Review this guide
- Ask in conversation: "Should I create a skill for this?"

**Claude will suggest skills when:**
- Detecting repeated patterns (3+ times)
- User says "I wish there was a command for..."
- Task is repeatable and >5 steps

---

**Remember:** Good skills save time and ensure consistency. Don't over-create. Start simple, iterate based on usage.
