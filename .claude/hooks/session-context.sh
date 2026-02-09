#!/bin/bash
#
# SessionStart Hook: Inject dynamic project context at session startup
# Replaces Phase 0 of /processes:begin
#

set -e

# Get project root (resolve from hook location)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$HOOK_DIR/../.." && pwd)"
cd "$PROJECT_DIR"

# Build context output
context_json=$(cat <<EOF
{
  "additionalContext": "## Session Context (Auto-injected)

### Git Status
Branch: $(git branch --show-current 2>/dev/null || echo "unknown")
Status: $(git status --short | head -5 | sed 's/^/  /')

### Recent Changes (Last 3 commits)
$(git log --oneline -3 2>/dev/null | sed 's/^/  /')

### Uncommitted Files
$(git diff --name-only 2>/dev/null | head -10 | sed 's/^/  /')

### Active Tasks (if TASKS.md exists)
$(if [ -f "TASKS.md" ]; then grep -E '^\s*-\s+\[ \]' TASKS.md | head -5 | sed 's/^/  /' || echo "  No pending tasks"; else echo "  TASKS.md not found"; fi)

---
**Context loaded from:** .claude/hooks/session-context.sh"
}
EOF
)

# Output JSON for Claude
echo "$context_json"
