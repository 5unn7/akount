#!/bin/bash
# Context Usage Warning Hook
# Triggers: After tool use (passive monitoring)
# Purpose: Warn when session is getting long (context exhaustion risk)

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Track tool use count
TOOL_COUNT_FILE=".claude/.tool-count"

# Initialize if doesn't exist
if [ ! -f "$TOOL_COUNT_FILE" ]; then
    echo "0" > "$TOOL_COUNT_FILE"
fi

# Increment count
CURRENT_COUNT=$(cat "$TOOL_COUNT_FILE")
NEW_COUNT=$((CURRENT_COUNT + 1))
echo "$NEW_COUNT" > "$TOOL_COUNT_FILE"

# Warn at 50 tool calls (likely >60% context usage)
if [ "$NEW_COUNT" -eq 50 ]; then
    cat <<EOF

⚠️  Long session detected ($NEW_COUNT tool calls)

Context may be nearing limits. Consider:
- Commit working progress and start new session
- Review Compaction Preservation rules in CLAUDE.md
- Use offset/limit for large file reads

EOF
fi

# Warn at 100 tool calls (likely >80% context usage)
if [ "$NEW_COUNT" -eq 100 ]; then
    cat <<EOF

🔴 Very long session ($NEW_COUNT tool calls)

Context exhaustion likely. STRONGLY recommend:
- Commit work now
- Run /processes:end-session to capture state
- Start fresh session

EOF
fi

exit 0
