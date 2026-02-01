# Skill & Agent Deprecation Policy

**Last Updated:** 2026-02-01
**Purpose:** Clear process for deprecating and removing skills/agents

---

## When to Deprecate

**Deprecate a skill/agent if:**
- ❌ Not used in 3+ months
- ❌ Replaced by better skill/agent
- ❌ Functionality merged into another skill
- ❌ Maintenance burden too high
- ❌ No longer aligns with project goals

**Don't deprecate if:**
- ✅ Still used occasionally (even if infrequent)
- ✅ Part of documented workflows
- ✅ No better alternative exists
- ✅ Maintenance cost is acceptable

---

## Deprecation Process

### Phase 1: Mark as Deprecated

**Update frontmatter:**

```yaml
---
name: old-skill
description: [Original description]
status: deprecated  # ADD THIS
deprecatedDate: "2026-02-01"  # ADD THIS
replacement: "new-skill-name"  # ADD THIS (if applicable)
removalDate: "2026-05-01"  # ADD THIS (3 months later)
---
```

**Update skill content:**

Add deprecation notice at the top:

```markdown
---
[frontmatter]
---

> ⚠️ **DEPRECATED:** This skill is deprecated as of 2026-02-01.
> Use `/new-skill-name` instead.
> This skill will be removed on 2026-05-01.

# Old Skill Name

[Rest of content remains for now]
```

### Phase 2: Update Documentation

**Update SKILLS-INDEX.md:**

```markdown
### ~~old-skill~~ (DEPRECATED)
**Status:** Deprecated 2026-02-01, will be removed 2026-05-01
**Replacement:** Use `/new-skill-name` instead
**Reason:** [Brief explanation]
```

**Update CLAUDE.md (if referenced):**

Remove from "Smart Skill Discovery" section or replace with new skill.

**Update REGISTRY.json (if exists):**

```json
{
  "old-skill": {
    "status": "deprecated",
    "deprecatedDate": "2026-02-01",
    "replacement": "new-skill",
    "removalDate": "2026-05-01",
    "reason": "Replaced by better implementation"
  }
}
```

### Phase 3: Announce (if widely used)

**Add to CHANGELOG.md:**

```markdown
## [Unreleased]

### Deprecated
- **old-skill**: Deprecated in favor of `/new-skill`. Will be removed 2026-05-01.
  - Migration guide: [link if applicable]
```

**Notify team (if applicable):**
- Slack/Discord announcement
- Email if critical workflow affected
- Update project wiki/docs

### Phase 4: Grace Period (3 months)

**During grace period:**
- Skill still works but shows deprecation warning
- Users can migrate to replacement
- Monitor usage (should decrease)

**Monitor:**
- Track usage of deprecated skill
- Provide help for users transitioning
- Address any migration issues

### Phase 5: Remove After Grace Period

**After 3 months:**

1. **Delete skill file:**
   ```bash
   rm .claude/commands/old-skill.md
   # OR
   rm .claude/commands/processes/old-workflow.md
   ```

2. **Remove from REGISTRY.json:**
   ```json
   // Remove entire entry for old-skill
   ```

3. **Update SKILLS-INDEX.md:**
   ```markdown
   ## Removed Skills

   ### old-skill
   **Removed:** 2026-05-01
   **Replacement:** `/new-skill-name`
   **Reason:** [Brief explanation]
   ```

4. **Update CHANGELOG.md:**
   ```markdown
   ## [Version] - 2026-05-01

   ### Removed
   - **old-skill**: Removed as planned. Use `/new-skill-name` instead.
   ```

5. **Remove from CLAUDE.md:**
   - Remove any references
   - Update examples to use new skill

---

## Example: Complete Deprecation

### Scenario: `/old-review` replaced by `/processes:review`

**Timeline:**
- **2026-02-01:** Deprecation announced
- **2026-02-01 - 2026-05-01:** Grace period (3 months)
- **2026-05-01:** Removal

**Phase 1: Mark Deprecated (2026-02-01)**

```yaml
---
name: old-review
status: deprecated
deprecatedDate: "2026-02-01"
replacement: "processes:review"
removalDate: "2026-05-01"
---

> ⚠️ **DEPRECATED:** This skill is deprecated as of 2026-02-01.
> Use `/processes:review` instead for comprehensive multi-agent reviews.
> This skill will be removed on 2026-05-01.
```

**Phase 2: Update Docs (2026-02-01)**

SKILLS-INDEX.md:
```markdown
### ~~old-review~~ (DEPRECATED)
**Status:** Deprecated 2026-02-01, will be removed 2026-05-01
**Replacement:** Use `/processes:review` instead
**Reason:** New multi-agent review system is more comprehensive
```

CHANGELOG.md:
```markdown
## [Unreleased]

### Deprecated
- **old-review**: Deprecated in favor of `/processes:review`. Will be removed 2026-05-01.
  - Migration: Simply use `/processes:review` instead
```

**Phase 3: Announce (2026-02-01)**

Team notification:
```
📢 Deprecation Notice

old-review skill is deprecated as of today.

Please use /processes:review instead for all code reviews.

The old skill will be removed on May 1, 2026.

Migration guide: [link]
```

**Phase 4: Grace Period (Feb-May 2026)**

- Skill still works
- Usage tracked: decreased from 20/week to 2/week
- Migration issues addressed
- Most users transitioned

**Phase 5: Remove (2026-05-01)**

1. Delete file:
   ```bash
   rm .claude/commands/old-review.md
   ```

2. Update SKILLS-INDEX.md:
   ```markdown
   ## Removed Skills

   ### old-review
   **Removed:** 2026-05-01
   **Replacement:** `/processes:review`
   **Reason:** Replaced by comprehensive multi-agent review system
   ```

3. Update CHANGELOG.md:
   ```markdown
   ## [1.2.0] - 2026-05-01

   ### Removed
   - **old-review**: Removed as planned. Use `/processes:review` instead.
   ```

---

## Special Cases

### Immediate Removal (Emergency)

**Use ONLY for:**
- Security vulnerabilities
- Data corruption risk
- Critical bugs without fix

**Process:**
1. Disable immediately (rename file or move to archived/)
2. Notify team urgently
3. Document incident
4. Provide immediate alternative

**Example:**
```bash
# Emergency disable
mv .claude/commands/broken-skill.md .claude/commands/DISABLED-broken-skill.md

# Document
echo "DISABLED 2026-02-01: Security issue, use /safe-alternative" >> .claude/DEPRECATION_LOG.md
```

### Agent Deprecation

**Same process applies to agents:**

```yaml
---
name: old-agent
status: deprecated
deprecatedDate: "2026-02-01"
replacement: "new-agent"
removalDate: "2026-05-01"
---
```

**Update agent README:**
```markdown
## Deprecated Agents

### old-agent
**Status:** Deprecated 2026-02-01
**Replacement:** Use `new-agent` instead
```

### No Replacement Available

If deprecated without replacement:

```yaml
---
status: deprecated
deprecatedDate: "2026-02-01"
replacement: null  # No replacement
removalDate: "2026-05-01"
reason: "Functionality no longer needed"
---
```

Deprecation notice:
```markdown
> ⚠️ **DEPRECATED:** This skill is deprecated as of 2026-02-01.
> This functionality is no longer needed for the project.
> This skill will be removed on 2026-05-01.
```

---

## Migration Guides

### When Deprecating, Provide Migration Guide

**Include:**
1. **What changed:** Brief explanation
2. **How to migrate:** Step-by-step
3. **Side-by-side comparison:** Old vs new
4. **Common issues:** Known migration problems

**Example migration guide:**

```markdown
## Migration Guide: old-review → processes:review

### What Changed
The review process now uses multiple specialized agents for comprehensive analysis.

### How to Migrate

**Before (old-review):**
```bash
/old-review PR-123
```

**After (processes:review):**
```bash
/processes:review PR-123
```

### Key Differences
- Multi-agent analysis (security, performance, architecture)
- More comprehensive output
- Longer execution time (parallel agents)

### Common Issues
**Issue:** "Too much output"
**Solution:** Review focuses on different agent analyses. Skip sections not relevant to your changes.

**Issue:** "Takes longer"
**Solution:** Agents run in parallel. Time is worth the comprehensive analysis.
```

---

## Deprecation Log

**Location:** `.claude/DEPRECATION_LOG.md` (optional)

**Format:**
```markdown
# Deprecation Log

## 2026-02-01: old-skill
- **Status:** Deprecated
- **Replacement:** new-skill
- **Reason:** Better implementation available
- **Removal:** 2026-05-01

## 2026-01-15: legacy-agent
- **Status:** Deprecated
- **Replacement:** modern-agent
- **Reason:** Superseded by modern architecture
- **Removal:** 2026-04-15
```

---

## Metrics to Track

### Before Deprecation
- Current usage frequency
- Users relying on skill
- Dependencies in workflows

### During Grace Period
- Usage trend (should decrease)
- Migration issues reported
- Support requests

### After Removal
- Verify no broken references
- Confirm alternative working
- Document lessons learned

---

## Rollback Plan

**If removal causes issues:**

1. **Immediate:**
   ```bash
   # Restore from git
   git restore .claude/commands/old-skill.md
   ```

2. **Communicate:**
   - Notify team of rollback
   - Explain why removal failed
   - Provide new timeline

3. **Assess:**
   - What went wrong?
   - What was missed?
   - How to prevent next time?

4. **Plan Better:**
   - Longer grace period?
   - Better migration guide?
   - More announcement?

---

## Checklist: Deprecating a Skill

- [ ] Confirm skill meets deprecation criteria
- [ ] Identify replacement (if applicable)
- [ ] Set removal date (3 months from now)
- [ ] Update skill frontmatter (status, dates, replacement)
- [ ] Add deprecation notice to skill content
- [ ] Update SKILLS-INDEX.md
- [ ] Update REGISTRY.json (if exists)
- [ ] Remove from CLAUDE.md (if referenced)
- [ ] Add to CHANGELOG.md
- [ ] Announce to team (if widely used)
- [ ] Create migration guide (if complex)
- [ ] Monitor usage during grace period
- [ ] Schedule removal reminder
- [ ] After 3 months: Delete skill file
- [ ] After 3 months: Update all documentation
- [ ] After 3 months: Verify no broken references

---

## Best Practices

### Do:
- ✅ Provide clear replacement
- ✅ Give adequate grace period (3 months minimum)
- ✅ Document migration path
- ✅ Monitor usage during deprecation
- ✅ Help users transition

### Don't:
- ❌ Remove without warning
- ❌ Deprecate without replacement (unless truly unneeded)
- ❌ Ignore usage during grace period
- ❌ Skip documentation updates
- ❌ Forget to announce

---

## Questions?

**Before deprecating, ask:**
1. Is this really unused? (Check metrics)
2. Does a better alternative exist?
3. Will removal break workflows?
4. Is 3 months enough for migration?
5. Have I documented the migration path?

**If unsure:**
- Discuss with team
- Survey users
- Start with marking as "maintenance mode" instead
- Extend grace period if needed

---

**Remember:** Deprecation is about smooth transitions, not abrupt removals. Give users time, support, and alternatives.
