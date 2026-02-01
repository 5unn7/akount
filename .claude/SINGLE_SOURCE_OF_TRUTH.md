# Single Source of Truth Guide

**Last Updated:** 2026-02-01
**Purpose:** Clarify which files are authoritative for each type of configuration to prevent confusion and maintain consistency.

---

## Overview

This document establishes clear authority hierarchy for configuration files in the `.claude/` directory. When updating metadata, follow the documented order to ensure consistency.

---

## Agent Metadata

**Authoritative Source:** `.claude/agents/REGISTRY.json`

**What's in the registry:**
- Agent name, description, file path
- Model tier assignment (1, 2, or 3)
- Pattern keywords for discovery
- Category and type classification
- Status (active/deprecated)
- Creation date

**Derived Sources (manual sync required):**
- Individual agent files (`.claude/agents/review/*.md`, `.claude/agents/research/*.md`)
- Agent category README files (`.claude/agents/review/README.md`)
- Skills index (`.claude/SKILLS-INDEX.md` - references agents)
- CLAUDE.md (brief references to agent categories)

**Update Process:**
1. **Update REGISTRY.json first** (authoritative source)
2. **Update individual agent file** (implementation and detailed documentation)
3. **Update category README.md** (if agent summary changes)
4. **Update SKILLS-INDEX.md** (if agent is referenced in skills)
5. **Run validation hook** to check sync: `.claude/hooks/validate-config.sh`

**Example workflow:**
```bash
# 1. Update registry metadata
vim .claude/agents/REGISTRY.json

# 2. Update agent implementation
vim .claude/agents/review/financial-data-validator.md

# 3. Update category README
vim .claude/agents/review/README.md

# 4. Validate sync
bash .claude/hooks/validate-config.sh
```

---

## Skill Metadata

**Authoritative Source:** Individual skill files (frontmatter)

**What's in skill files:**
- Name, description, model
- Aliases and keywords
- Skill implementation (prompts, instructions)
- Usage examples

**Derived Sources:**
- `.claude/agents/REGISTRY.json` (aggregates from skills for centralized view)
- `.claude/SKILLS-INDEX.md` (index listing all skills with descriptions)
- Process README files (`.claude/commands/processes/README.md`)

**Update Process:**
1. **Update skill file frontmatter** (authoritative for that skill)
2. **Update REGISTRY.json skill entry** (for centralized tracking)
3. **Update SKILLS-INDEX.md** (if skill name or description changes)
4. **Update process README** (if skill is part of a workflow)

**Example workflow:**
```bash
# 1. Update skill frontmatter
vim .claude/commands/quality/brand-voice-check.md

# 2. Update registry
vim .claude/agents/REGISTRY.json

# 3. Update skills index
vim .claude/SKILLS-INDEX.md

# 4. Validate
bash .claude/hooks/validate-config.sh
```

---

## Configuration Settings

**Authoritative Source:** `.claude/settings.local.json`

**What's configured:**
- Permissions (allow/ask/deny patterns)
- Default model selection
- Hook enablement
- MCP server configuration
- Project-specific settings

**Documentation:**
- `.claude/PERMISSIONS-REFERENCE.md` (explains permission structure and patterns)
- `.claude/CONFIGURATION-GUIDE.md` (setup guide and troubleshooting)
- `.claude/MCP-SERVERS.md` (MCP server details)

**Update Process:**
1. **Update settings.local.json** (authoritative configuration)
2. **Document in PERMISSIONS-REFERENCE.md** (if permission changes)
3. **Update CONFIGURATION-GUIDE.md** (if new hook or feature)
4. **Test configuration** (ensure hooks fire, permissions work)

---

## Hooks

**Authoritative Source:** Individual hook files in `.claude/hooks/`

**What's in hook files:**
- Hook implementation (bash scripts)
- Validation logic
- Error messages

**Registration:**
- `.claude/settings.local.json` (registers hooks for PreToolUse/PostToolUse)

**Documentation:**
- `.claude/CONFIGURATION-GUIDE.md` (hook explanations, testing, troubleshooting)

**Update Process:**
1. **Update hook script** (authoritative implementation)
2. **Register in settings.local.json** (if new hook)
3. **Document in CONFIGURATION-GUIDE.md** (explain purpose and testing)
4. **Test hook independently** (run script with sample input)

**Example workflow:**
```bash
# 1. Update hook
vim .claude/hooks/validate-config.sh

# 2. Make executable
chmod +x .claude/hooks/validate-config.sh

# 3. Test independently
bash .claude/hooks/validate-config.sh

# 4. Register in settings (if new)
vim .claude/settings.local.json
```

---

## Deprecation

**Authoritative Source:** `.claude/DEPRECATION_POLICY.md`

**Process:**
1. Mark deprecated in REGISTRY.json (`"status": "deprecated"`)
2. Add deprecation notice to individual agent/skill file (frontmatter)
3. Update CHANGELOG.md (document deprecation)
4. Wait grace period (30 days default)
5. Remove files after grace period

**Documentation:**
- `.claude/DEPRECATION_POLICY.md` (policy and timeline)
- `CHANGELOG.md` (deprecation announcements)

---

## Tier Assignments

**Authoritative Source:** `.claude/agents/REGISTRY.json` + `.claude/agents/TIERING-GUIDE.md`

**What's defined:**
- Model assignments (Haiku, Sonnet 3.7, Sonnet 4.5)
- Cost optimization strategy
- Tier evaluation criteria

**Documentation:**
- `.claude/agents/TIERING-GUIDE.md` (explains tier criteria and cost analysis)
- `.claude/agents/REGISTRY.json` (actual tier assignments)

**Update Process:**
1. **Evaluate agent complexity** (use TIERING-GUIDE.md criteria)
2. **Update REGISTRY.json** (change tier and model)
3. **Document rationale** (add note in REGISTRY.json)
4. **Monitor performance** (evaluate quality after change)

---

## Design System

**Authoritative Source:** Individual design system files in `docs/design-system/`

**What's defined:**
- Color palette (`tailwind-colors.md`)
- Typography system (`fonts.md`)
- CSS tokens (`tokens.css`)

**Usage:**
- Skills reference design system (e.g., `quality:design-system-enforce`)
- CLAUDE.md links to design system docs

**Update Process:**
1. **Update design system file** (authoritative definition)
2. **Regenerate tokens.css** (if colors/fonts change)
3. **Update quality skill** (if validation rules change)
4. **Validate with skill** (`/quality:design-system-enforce`)

---

## File Hierarchy Summary

**Tier 1 - Configuration Authority:**
- `.claude/settings.local.json` - Project settings
- `.claude/hooks/*.sh` - Hook implementations

**Tier 2 - Metadata Authority:**
- `.claude/agents/REGISTRY.json` - Agent/skill metadata
- Individual skill files (`.claude/commands/**/*.md`) - Skill definitions
- Individual agent files (`.claude/agents/**/*.md`) - Agent implementations

**Tier 3 - Documentation:**
- `.claude/CONFIGURATION-GUIDE.md` - Configuration reference
- `.claude/PERMISSIONS-REFERENCE.md` - Permission patterns
- `.claude/SKILLS-INDEX.md` - Skill listing
- `.claude/agents/review/README.md` - Agent category documentation
- `CLAUDE.md` - Project context (entry point)

**Tier 4 - Policy:**
- `.claude/DEPRECATION_POLICY.md` - Deprecation process
- `.claude/agents/TIERING-GUIDE.md` - Tier assignment criteria

---

## Conflict Resolution

**When sources disagree, follow this precedence:**

1. **Configuration:** `settings.local.json` always wins
2. **Agent metadata:** REGISTRY.json is authoritative
3. **Skill metadata:** Individual skill file is authoritative
4. **Documentation:** If docs contradict implementation, implementation is correct (update docs)

**When in doubt:**
- Run validation hook: `bash .claude/hooks/validate-config.sh`
- Check git history: `git log --oneline -- .claude/`
- Refer to this document

---

## Validation

**Automated checks:**
```bash
# Validate REGISTRY.json sync with actual files
bash .claude/hooks/validate-config.sh

# Check JSON syntax
jq empty .claude/agents/REGISTRY.json
jq empty .claude/settings.local.json
jq empty .mcp.json

# Verify hooks are executable
ls -la .claude/hooks/*.sh

# Test hook independently
echo '{"tool_input": {"file_path": ".env"}}' | bash .claude/hooks/protect-files.sh
```

**Manual checks:**
- REGISTRY.json includes all agent files in `.claude/agents/`
- All skills in REGISTRY.json exist in `.claude/commands/`
- All agents referenced in SKILLS-INDEX.md exist in REGISTRY.json
- Permission patterns in PERMISSIONS-REFERENCE.md match settings.local.json

---

## When to Update This Document

**Update SINGLE_SOURCE_OF_TRUTH.md when:**
- Adding new configuration file types
- Changing authority hierarchy
- Adding new validation steps
- Discovering new sources of truth
- Refactoring configuration structure

**Version this document:**
- Commit changes to git
- Update "Last Updated" timestamp
- Document rationale in commit message

---

## Related Documentation

- `.claude/CONFIGURATION-GUIDE.md` - Complete configuration reference
- `.claude/PERMISSIONS-REFERENCE.md` - Permission system documentation
- `.claude/DEPRECATION_POLICY.md` - Deprecation process
- `.claude/agents/TIERING-GUIDE.md` - Agent tier criteria
- `CLAUDE.md` - Project context (main entry point)

---

**End of Single Source of Truth Guide**
