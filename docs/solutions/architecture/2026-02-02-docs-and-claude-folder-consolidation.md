---
title: "Documentation and .claude Folder Consolidation"
category: "architecture"
date: 2026-02-02
severity: medium
module: "docs/, .claude/"
tags:
  - documentation
  - configuration
  - maintenance
  - agents
---

# Documentation and .claude Folder Consolidation

## Problem

The project had accumulated significant documentation bloat and configuration drift:

1. **Documentation Bloat (77 files):**
   - Redundant files (summary.md duplicated evolution.md)
   - Stale session archives (15 files in docs/archive/sessions/)
   - LunchMoney competitive analysis artifacts no longer needed
   - Overlapping feature specs (enhancements in separate files)

2. **Agent Configuration Issues (10 broken paths):**
   - References to deleted `docs/architecture/summary.md`
   - References to non-existent `agent-os/standards/` directory (from template)
   - 6 agents with invalid context_files

3. **Command Reference Issues:**
   - `begin.md` referenced non-existent docs (api-patterns.md, multi-tenant.md)
   - `eod-quick-ref.md` referenced deleted `docs/archive/sessions/`
   - `settings.local.json` contained paths from different project

## Root Cause

1. **Organic growth** - Documentation added without cleanup of superseded files
2. **Template artifacts** - Agent files copied from external template with `agent-os/` paths
3. **Refactoring without updating references** - Files deleted but references not updated
4. **Workflow artifacts accumulating** - Session reports not cleaned up

## Solution

### 1. Documentation Consolidation (77 → 53 files)

**Deleted:**
- 15 session archive files (historical, not reference docs)
- 3 redundant architecture files (summary.md, LunchMoney tracking)
- 2 analysis/research work artifacts

**Merged:**
- `01-accounts-overview-enhancements.md` → into `01-accounts-overview.md`
- 3 onboarding setup files → single `onboarding-setup.md`

**Preserved (workflow directories):**
- `docs/brainstorms/` - Created by `/processes:brainstorm`
- `docs/plans/` - Created by `/processes:plan`
- `docs/solutions/` - Created by `/processes:compound`

### 2. Agent Context Files Fixed (6 agents)

```yaml
# Before (broken)
context_files:
  - docs/architecture/summary.md  # DELETED
  - agent-os/standards/frontend/component-pattern.md  # NEVER EXISTED

# After (valid)
context_files:
  - docs/architecture/evolution.md  # Correct file
  - docs/architecture/decisions.md  # Actual project file
```

**Agents updated:**
- architecture-strategist
- repo-research-analyst
- kieran-typescript-reviewer
- nextjs-app-router-reviewer
- turborepo-monorepo-reviewer
- pattern-recognition-specialist

### 3. Command References Fixed (3 files)

```markdown
# begin.md - Before
- [Fastify API Patterns](docs/api-patterns.md)  # MISSING

# begin.md - After
- [API Design Standards](docs/standards/api-design.md)  # EXISTS
```

### 4. Settings Cleaned

```json
// Removed unused external paths
"Bash(~/agent-os/scripts/project-install.sh *)",
"Bash(/home/sunny/agent-os/scripts/project-install.sh *)",
```

## Prevention

### 1. When Deleting Files
- Search for references before deleting: `grep -r "filename" .claude/ docs/`
- Update all referencing files
- Run validation: `bash .claude/hooks/validate-config.sh`

### 2. When Adding Agents
- Only use context_files that exist in THIS project
- Verify paths: `ls -la [path]` before adding
- Never copy from templates without adapting paths

### 3. When Consolidating Docs
- Preserve workflow directories (brainstorms, plans, solutions)
- Update docs/README.md index
- Check CLAUDE.md references

### 4. Regular Maintenance
- Monthly: Audit agent context_files for validity
- Weekly: Clean session artifacts during EOD workflow
- Per-session: Don't let temporary files accumulate

## Verification Commands

```bash
# Check for broken doc references in agents
grep -r "docs/" .claude/agents/ | grep -v "exists"

# Verify all context_files exist
for f in $(grep -h "- docs/" .claude/agents/**/*.md | sed 's/.*- //'); do
  [ -f "$f" ] || echo "MISSING: $f"
done

# Count docs
find docs -name "*.md" | wc -l
```

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Doc files | 77 | 53 (31% reduction) |
| Broken agent refs | 10 | 0 |
| Broken command refs | 6 | 0 |
| Settings issues | 2 | 0 |

## Related

- [docs/README.md](../../README.md) - Updated documentation index
- [.claude/agents/REGISTRY.json](../../../.claude/agents/REGISTRY.json) - Agent registry
- [docs/architecture/evolution.md](../../architecture/evolution.md) - Replaced summary.md
