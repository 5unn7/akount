# Skill Templates

Use these templates to create consistent, high-quality skills.

**Last Updated:** 2026-02-01

---

## Available Templates

### skill-template-simple.md
**Use for:** Quick utility skills, single-purpose operations, quality checks
**Examples:** `changelog`, `deepen-plan`, quality checks
**Complexity:** Low to medium
**Model:** Haiku or Sonnet 3.7

**Structure:**
- Frontmatter with name, description, model, aliases, keywords
- Purpose statement
- Usage examples
- Step-by-step process
- Output format
- Notes and limitations

### skill-template-workflow.md
**Use for:** Multi-phase processes, structured workflows
**Examples:** `processes:brainstorm`, `processes:plan`, `processes:work`
**Complexity:** High
**Model:** Sonnet 4.5 (inherit)

**Structure:**
- Frontmatter with name, description, model, aliases, keywords
- When to use / prerequisites
- Multiple phases with goals, steps, tools, outputs
- Integration with other workflows
- Guidelines (do/don't)
- Quality checks
- Concrete example
- Troubleshooting

---

## Quick Start

### For Utility or Quality Skills

```bash
# Copy template
cp .claude/templates/skill-template-simple.md .claude/commands/my-skill.md

# Edit frontmatter and content
# Test with: /my-skill
# Register in SKILLS-INDEX.md
```

### For Workflow Skills

```bash
# Copy template
cp .claude/templates/skill-template-workflow.md .claude/commands/processes/my-workflow.md

# Edit frontmatter and content
# Test with: /processes:my-workflow
# Register in SKILLS-INDEX.md
```

---

## Template Customization

### Frontmatter Fields

**Required:**
- `name` - Skill identifier (e.g., `my-skill` or `processes:my-workflow`)
- `description` - One-sentence description
- `model` - AI model to use

**Optional:**
- `aliases` - Alternative names for discovery
- `keywords` - Trigger words for matching
- `argument-hint` - Hint for required arguments

### Model Selection

**Haiku** (`claude-haiku-4-20250101`):
- Fast pattern matching
- Simple operations
- Low stakes

**Sonnet 3.7** (`claude-sonnet-3-7-20250219`):
- Standard validation
- Moderate complexity
- Good cost/quality balance

**Sonnet 4.5** (`inherit` or `claude-sonnet-4-5-20250929`):
- Critical operations
- Complex reasoning
- Financial/security/architecture

---

## Sections to Include

### Simple Skills

**Minimum:**
1. Purpose
2. Usage
3. What It Does
4. Examples

**Optional (add if useful):**
5. Process (detailed steps)
6. Output Format
7. Notes/Limitations
8. Related Skills/Resources

### Workflow Skills

**Minimum:**
1. When to Use
2. Prerequisites
3. Phases (3-5 phases with goal/steps/output)
4. Next Steps
5. Guidelines (do/don't)

**Optional (add if useful):**
6. Integration with other workflows
7. Quality checks
8. Concrete example
9. Troubleshooting
10. Related resources

---

## Examples

### Good Simple Skill: changelog

```yaml
---
name: changelog
description: Create engaging changelogs from recent merges
aliases:
  - generate-changelog
  - release-notes
keywords:
  - changelog
  - release
  - history
---
```

**Why it's good:**
- Clear, specific name
- Descriptive aliases
- Relevant keywords
- Appropriate model (inherit)

### Good Workflow Skill: processes:plan

```yaml
---
name: processes:plan
description: Transform feature descriptions into well-structured implementation plans
aliases:
  - plan
  - design
keywords:
  - plan
  - implementation
---
```

**Why it's good:**
- Follows naming convention (processes:)
- Clear purpose
- Simple aliases
- High-quality model (inherit for workflows)

---

## Testing Your Skill

### Before Merging

1. **Syntax Check:**
   ```bash
   # Skill should load without errors
   /your-skill-name
   ```

2. **Alias Check:**
   ```bash
   # Aliases should work
   /alias1
   /alias2
   ```

3. **Functionality Check:**
   - Does it accomplish the stated purpose?
   - Are examples accurate?
   - Are edge cases handled?

4. **Documentation Check:**
   - Is the purpose clear?
   - Are usage examples helpful?
   - Are limitations documented?

### Validation Checklist

- [ ] Frontmatter complete and valid
- [ ] Name follows conventions
- [ ] Description is one clear sentence
- [ ] Model is appropriate for task
- [ ] Aliases are intuitive
- [ ] Keywords relevant
- [ ] Purpose section clear
- [ ] Usage examples provided
- [ ] Process steps documented
- [ ] Edge cases noted
- [ ] Tested independently
- [ ] Added to SKILLS-INDEX.md

---

## Common Mistakes

### ❌ Vague Names
**Bad:** `do-stuff`, `helper`, `utility`
**Good:** `generate-changelog`, `analyze-test-coverage`

### ❌ Missing Aliases
**Bad:** No aliases provided
**Good:** 2-3 intuitive short names

### ❌ Wrong Model
**Bad:** Sonnet 4.5 for simple pattern matching
**Good:** Haiku for simple, Sonnet 3.7 for standard, Sonnet 4.5 for critical

### ❌ No Examples
**Bad:** Only abstract description
**Good:** 2-3 concrete usage examples

### ❌ Unclear Purpose
**Bad:** "This skill helps with things"
**Good:** "Analyze test coverage and identify gaps"

---

## Getting Help

**Documentation:**
- `.claude/guides/SKILL_CREATION_GUIDE.md` - Complete guide
- `.claude/SKILLS-INDEX.md` - All existing skills
- Existing skills in `.claude/commands/` - Reference patterns

**Questions:**
- Ask Claude: "Should I create a skill for this?"
- Review existing skills for similar patterns
- Check if skill already exists

---

**Remember:**
- Start with simple template, add complexity as needed
- Test before merging
- Update SKILLS-INDEX.md
- Document limitations
- Use appropriate model tier

**Pro tip:** Copy an existing skill similar to yours and adapt it!
