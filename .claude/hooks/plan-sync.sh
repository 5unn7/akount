#!/bin/bash
# Plan Sync Hook — PostToolUse backstop
# Fires after Edit/Write on code files to detect plan drift
#
# Checks:
# 1. Warns after 8+ code edits without status file update
# 2. Warns if code changes are in a domain with no active TASKS.md task
#
# Exit: Always 0 (PostToolUse cannot block — tool already executed)

# Read JSON input from stdin
INPUT=$(cat)

# Extract file path
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Configuration
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATE_FILE="$PROJECT_ROOT/.claude/plan-sync-state.json"
TASKS_FILE="$PROJECT_ROOT/TASKS.md"
CODE_EDIT_THRESHOLD=8

# --- Normalize path separators (Windows compat) ---
FILE_PATH=$(echo "$FILE_PATH" | sed 's|\\|/|g')

# --- Skip status files (reset counter instead) ---
BASENAME=$(basename "$FILE_PATH")
case "$BASENAME" in
    TASKS.md|STATUS.md|ROADMAP.md)
        if [ -f "$STATE_FILE" ] && command -v jq &>/dev/null; then
            TEMP=$(mktemp)
            jq '.codeEditsSinceStatusUpdate = 0' \
                "$STATE_FILE" > "$TEMP" 2>/dev/null && mv "$TEMP" "$STATE_FILE"
        fi
        exit 0
        ;;
esac

# --- Skip non-code files ---
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.css|*.prisma)
        # Code files — continue checking
        ;;
    *)
        # Config, docs, shell scripts, etc. — skip
        exit 0
        ;;
esac

# --- Initialize state file if missing ---
if [ ! -f "$STATE_FILE" ]; then
    mkdir -p "$(dirname "$STATE_FILE")"
    cat > "$STATE_FILE" << 'INITEOF'
{
  "codeEditsSinceStatusUpdate": 0,
  "domainsModified": []
}
INITEOF
fi

# Bail if jq not available (can't do JSON ops)
if ! command -v jq &>/dev/null; then
    exit 0
fi

# --- Detect domain from file path ---
DOMAIN="unknown"
if echo "$FILE_PATH" | grep -qE 'domains/([^/]+)/'; then
    DOMAIN=$(echo "$FILE_PATH" | grep -oE 'domains/([^/]+)/' | head -1 | sed 's|domains/||;s|/||')
elif echo "$FILE_PATH" | grep -qE '\(dashboard\)/([^/]+)/'; then
    DOMAIN=$(echo "$FILE_PATH" | grep -oE '\(dashboard\)/([^/]+)/' | head -1 | sed 's|(dashboard)/||;s|/||')
elif echo "$FILE_PATH" | grep -qE 'packages/'; then
    DOMAIN="shared"
fi

# --- Increment code edit counter ---
TEMP=$(mktemp)
CURRENT_COUNT=$(jq -r '.codeEditsSinceStatusUpdate // 0' "$STATE_FILE" 2>/dev/null)
NEW_COUNT=$((CURRENT_COUNT + 1))

jq --arg domain "$DOMAIN" --argjson count "$NEW_COUNT" '
    .codeEditsSinceStatusUpdate = $count |
    .domainsModified = ((.domainsModified // []) + [$domain] | unique)
' "$STATE_FILE" > "$TEMP" 2>/dev/null && mv "$TEMP" "$STATE_FILE"

# --- Check 1: Too many code edits without status update ---
if [ "$NEW_COUNT" -ge "$CODE_EDIT_THRESHOLD" ]; then
    echo "PLAN SYNC: $NEW_COUNT code edits since last status file update." >&2
    echo "Consider updating TASKS.md, STATUS.md, or ROADMAP.md to reflect progress." >&2
fi

# --- Check 2: Domain mismatch with active tasks ---
if [ -f "$TASKS_FILE" ] && [ "$DOMAIN" != "unknown" ] && [ "$DOMAIN" != "shared" ]; then
    # Extract active task lines (unchecked items under Active Work)
    ACTIVE_SECTION=$(sed -n '/## Active Work/,/## Next Up\|## Completed/p' "$TASKS_FILE" 2>/dev/null || true)
    ACTIVE_TASKS=$(echo "$ACTIVE_SECTION" | grep -E '^\s*-\s+\[ \]' 2>/dev/null || true)

    # Map domain names to broad search terms
    case "$DOMAIN" in
        banking)     SEARCH_TERMS="banking|track|transaction|import|reconcil|csv|account" ;;
        invoicing)   SEARCH_TERMS="invoic|bill|ar|receivable" ;;
        accounting)  SEARCH_TERMS="accounting|journal|ledger|gl|chart|post|double.entry" ;;
        clients)     SEARCH_TERMS="client|customer" ;;
        vendors)     SEARCH_TERMS="vendor|supplier|payable" ;;
        overview)    SEARCH_TERMS="dashboard|overview|metric|widget" ;;
        system)      SEARCH_TERMS="system|onboard|settings|user|auth" ;;
        ai)          SEARCH_TERMS="ai|categori|insight|automat|advisor" ;;
        planning)    SEARCH_TERMS="plan|budget|forecast" ;;
        *)           SEARCH_TERMS="$DOMAIN" ;;
    esac

    DOMAIN_FOUND=false

    # Check unchecked tasks
    if [ -n "$ACTIVE_TASKS" ] && echo "$ACTIVE_TASKS" | grep -qiE "$SEARCH_TERMS"; then
        DOMAIN_FOUND=true
    fi

    # Also check broader Active Work section (headers, descriptions)
    if [ "$DOMAIN_FOUND" = false ] && [ -n "$ACTIVE_SECTION" ] && echo "$ACTIVE_SECTION" | grep -qiE "$SEARCH_TERMS"; then
        DOMAIN_FOUND=true
    fi

    # Also check Next Up section (might be starting next phase)
    if [ "$DOMAIN_FOUND" = false ]; then
        NEXT_SECTION=$(sed -n '/## Next Up/,/## Completed/p' "$TASKS_FILE" 2>/dev/null || true)
        if [ -n "$NEXT_SECTION" ] && echo "$NEXT_SECTION" | grep -qiE "$SEARCH_TERMS"; then
            DOMAIN_FOUND=true
        fi
    fi

    if [ "$DOMAIN_FOUND" = false ]; then
        echo "PLAN SYNC WARNING: Editing '$DOMAIN' domain, but no matching active task found in TASKS.md." >&2
        echo "This may be unplanned work. Verify this is intentional or add a task first." >&2
    fi
fi

exit 0
