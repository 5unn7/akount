# AI Workflow CLI Scripts

> **Purpose:** Command-line tools for AI context management and session workflows

## Quick Start

```bash
# Start a new session
./scripts/ai/begin.sh [focus-area]

# End a session
./scripts/ai/end.sh

# Check for context updates needed
./scripts/ai/update-context.sh
```

## Scripts

### `begin.sh`

Initializes an AI coding session with full context loading.

```bash
# General session
./scripts/ai/begin.sh

# Focus on specific area
./scripts/ai/begin.sh api
./scripts/ai/begin.sh frontend
./scripts/ai/begin.sh database
./scripts/ai/begin.sh accounting

# Quick mode (minimal output)
./scripts/ai/begin.sh --quick
```

**What it does:**
1. Loads visual context (architecture diagrams, glossary, repo map)
2. Checks previous session state
3. Shows git status
4. Creates new session state file
5. Displays active guards (rules that will be enforced)

---

### `end.sh`

Closes an AI coding session with cleanup and documentation checks.

```bash
./scripts/ai/end.sh
```

**What it does:**
1. Shows session summary (files touched, edits made)
2. Checks git status for uncommitted changes
3. Identifies context documentation that needs updating
4. Checks for temporary files to clean up
5. Archives session logs
6. Clears session state

---

### `update-context.sh`

Analyzes code changes and identifies documentation updates needed.

```bash
# Check mode (default) - just show what needs updating
./scripts/ai/update-context.sh

# Interactive mode - opens files for editing
./scripts/ai/update-context.sh --update

# Check last 20 commits instead of default 10
./scripts/ai/update-context.sh --check 20
```

**What it checks:**
- Schema changes → Update `docs/domain-glossary.md`
- Route changes → Update `docs/repo-map.md`
- Architecture changes → Update `docs/architecture.mmd`
- New domains → Ensure documented

---

## Supporting Library

### `lib/common.sh`

Shared utilities used by all scripts. Source it in custom scripts:

```bash
source "$(dirname "$0")/lib/common.sh"
```

**Provides:**
- Color output functions (`print_success`, `print_warning`, `print_error`)
- Git utilities (`get_current_branch`, `get_uncommitted_count`)
- Session state management (`create_session_state`, `session_exists`)
- Context flag management (`has_context_flags`, `archive_context_flags`)
- Path utilities (`get_relative_path`, `file_exists`)

---

## Session State Files

These files are created/managed by the scripts:

| File | Purpose |
|------|---------|
| `.claude/session-state.json` | Current session state (start time, focus, files modified) |
| `.claude/session-changes.log` | Log of all files touched during session |
| `.claude/context-update-flags.txt` | Flags for documentation that needs updating |

---

## Integration with Claude Code Skills

These CLI scripts complement the Claude Code skills:

| CLI Script | Claude Skill | Relationship |
|------------|--------------|--------------|
| `begin.sh` | `/processes:begin` | Script provides quick setup; skill provides full dashboard |
| `end.sh` | `/processes:eod` | Script provides quick cleanup; skill provides full workflow |
| `update-context.sh` | (Phase 8 of EOD) | Script can be run independently |

---

## Focus Areas

| Focus | Description | Key Directories |
|-------|-------------|-----------------|
| `api` | Backend API development | `apps/api/src/domains/` |
| `frontend` | Web UI development | `apps/web/src/app/`, `packages/ui/` |
| `database` | Schema and migrations | `packages/database/prisma/` |
| `accounting` | Financial/GL features | `apps/api/src/domains/accounting/` |
| `general` | Default, no specific focus | All directories |

---

## Best Practices

### Daily Workflow

```bash
# Morning: Start session with context
./scripts/ai/begin.sh frontend

# Work with Claude Code...
# Use /processes:reset if rules violated

# Evening: End session properly
./scripts/ai/end.sh
```

### Before Committing

```bash
# Check if docs need updating
./scripts/ai/update-context.sh

# If updates needed, run interactive mode
./scripts/ai/update-context.sh --update
```

### On Windows (Git Bash)

All scripts work in Git Bash on Windows:

```bash
# Run from project root
bash scripts/ai/begin.sh api
```

---

## Troubleshooting

### "Permission denied"

Make scripts executable:
```bash
chmod +x scripts/ai/*.sh scripts/ai/lib/*.sh
```

### "jq: command not found"

Install jq for JSON processing:
- macOS: `brew install jq`
- Ubuntu: `apt install jq`
- Windows: `choco install jq` or download from https://stedolan.github.io/jq/

Scripts work without jq but with reduced functionality.

### Session state not persisting

Ensure `.claude/` directory exists and is writable:
```bash
mkdir -p .claude
```
