#!/bin/bash
# Session Tracking Hook for Claude Code
# PostToolUse hook for Edit/Write operations
#
# Tracks:
# 1. Files modified during session
# 2. Session state for continuity
# 3. Decision points and changes
#
# This hook does NOT block - it only tracks.
# Exit code is always 0.

# Get tool input from environment
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
FILE_PATH=""

# Extract file path from JSON input
if command -v jq &> /dev/null && [ -n "$TOOL_INPUT" ]; then
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null)
fi

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Get project root and session state directory
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
SESSION_DIR="$PROJECT_ROOT/.claude"
SESSION_STATE_FILE="$SESSION_DIR/session-state.json"
SESSION_LOG_FILE="$SESSION_DIR/session-changes.log"

# Ensure session directory exists
mkdir -p "$SESSION_DIR"

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Get current timestamp in ISO format
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ"
}

# Get relative path from project root
get_relative_path() {
    local full_path="$1"
    # Remove project root prefix
    echo "${full_path#$PROJECT_ROOT/}"
}

# Categorize file by type
categorize_file() {
    local filepath="$1"

    case "$filepath" in
        *schema.prisma*) echo "schema" ;;
        *migration*) echo "migration" ;;
        */routes/*) echo "api-route" ;;
        */services/*) echo "service" ;;
        */components/*) echo "component" ;;
        *page.tsx*|*layout.tsx*) echo "page" ;;
        *.test.*|*.spec.*) echo "test" ;;
        docs/*) echo "documentation" ;;
        .claude/*) echo "claude-config" ;;
        *.md) echo "markdown" ;;
        *.ts|*.tsx) echo "typescript" ;;
        *.json) echo "config" ;;
        *) echo "other" ;;
    esac
}

# Detect domain from file path
detect_domain() {
    local filepath="$1"

    if [[ "$filepath" =~ domains/([^/]+)/ ]]; then
        echo "${BASH_REMATCH[1]}"
    elif [[ "$filepath" =~ \(dashboard\)/([^/]+)/ ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "general"
    fi
}

# =============================================================================
# SESSION STATE MANAGEMENT
# =============================================================================

# Initialize or update session state
update_session_state() {
    local filepath="$1"
    local timestamp=$(get_timestamp)
    local rel_path=$(get_relative_path "$filepath")
    local category=$(categorize_file "$filepath")
    local domain=$(detect_domain "$filepath")

    # Initialize session state if it doesn't exist
    if [ ! -f "$SESSION_STATE_FILE" ]; then
        cat > "$SESSION_STATE_FILE" << EOF
{
  "sessionStart": "$timestamp",
  "lastActivity": "$timestamp",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "filesModified": [],
  "domainsAffected": [],
  "categories": {},
  "stats": {
    "totalEdits": 0,
    "totalWrites": 0
  }
}
EOF
    fi

    # Update session state with jq if available
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)

        jq --arg timestamp "$timestamp" \
           --arg filepath "$rel_path" \
           --arg category "$category" \
           --arg domain "$domain" \
           --arg tool "$TOOL_NAME" \
           '
           .lastActivity = $timestamp |
           .filesModified = ((.filesModified // []) + [$filepath] | unique) |
           .domainsAffected = ((.domainsAffected // []) + [$domain] | unique) |
           .categories[$category] = ((.categories[$category] // 0) + 1) |
           if $tool == "Edit" then
               .stats.totalEdits = ((.stats.totalEdits // 0) + 1)
           elif $tool == "Write" then
               .stats.totalWrites = ((.stats.totalWrites // 0) + 1)
           else
               .
           end
           ' "$SESSION_STATE_FILE" > "$temp_file" 2>/dev/null

        if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
            mv "$temp_file" "$SESSION_STATE_FILE"
        else
            rm -f "$temp_file"
        fi
    fi
}

# =============================================================================
# CHANGE LOGGING
# =============================================================================

# Log the change
log_change() {
    local filepath="$1"
    local timestamp=$(get_timestamp)
    local rel_path=$(get_relative_path "$filepath")
    local category=$(categorize_file "$filepath")
    local domain=$(detect_domain "$filepath")

    # Append to session log
    echo "[$timestamp] $TOOL_NAME: $rel_path ($category, $domain)" >> "$SESSION_LOG_FILE"
}

# =============================================================================
# CONTEXT UPDATE FLAGS
# =============================================================================

# Check if change requires context documentation update
check_context_update_needed() {
    local filepath="$1"
    local rel_path=$(get_relative_path "$filepath")
    local flags_file="$SESSION_DIR/context-update-flags.txt"

    # Flag schema changes
    if [[ "$filepath" =~ schema\.prisma$ ]]; then
        echo "SCHEMA_CHANGED: $rel_path - Review domain-glossary.md" >> "$flags_file"
    fi

    # Flag route changes
    if [[ "$filepath" =~ routes.*\.ts$ ]] || [[ "$filepath" =~ apps/api/src/domains/ ]]; then
        echo "API_CHANGED: $rel_path - Review repo-map.md" >> "$flags_file"
    fi

    # Flag architecture changes
    if [[ "$filepath" =~ (middleware|plugins|config).*\.ts$ ]]; then
        echo "ARCHITECTURE_CHANGED: $rel_path - Review architecture.mmd" >> "$flags_file"
    fi

    # Flag new domains
    if [[ "$filepath" =~ domains/([^/]+)/ ]]; then
        local domain="${BASH_REMATCH[1]}"
        if ! grep -q "domain: $domain" "$flags_file" 2>/dev/null; then
            echo "DOMAIN_ACTIVE: $domain - Ensure documented in repo-map.md" >> "$flags_file"
        fi
    fi
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Update session state
update_session_state "$FILE_PATH"

# Log the change
log_change "$FILE_PATH"

# Check for context update needs
check_context_update_needed "$FILE_PATH"

# Always exit successfully (this is a tracking hook, not a blocking hook)
exit 0
