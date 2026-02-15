#!/bin/bash
# Common utilities for AI workflow scripts
# Source this file in other scripts: source "$(dirname "$0")/lib/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

# Determine script and project directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Claude configuration directories
CLAUDE_DIR="$PROJECT_ROOT/.claude"
SESSION_STATE_FILE="$CLAUDE_DIR/session-state.json"
SESSION_LOG_FILE="$CLAUDE_DIR/session-changes.log"
CONTEXT_FLAGS_FILE="$CLAUDE_DIR/context-update-flags.txt"

# Documentation directories
DOCS_DIR="$PROJECT_ROOT/docs"
ARCHIVE_DIR="$DOCS_DIR/archive/sessions"

# Ensure directories exist
mkdir -p "$CLAUDE_DIR"
mkdir -p "$ARCHIVE_DIR"

# =============================================================================
# OUTPUT FORMATTING
# =============================================================================

# Colors (if terminal supports them)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    NC=''
fi

# Print functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ $1${NC}"
}

# =============================================================================
# TIMESTAMP UTILITIES
# =============================================================================

get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date +"%Y-%m-%dT%H:%M:%SZ"
}

get_date() {
    date +"%Y-%m-%d"
}

get_time() {
    date +"%H:%M:%S"
}

# =============================================================================
# GIT UTILITIES
# =============================================================================

get_current_branch() {
    git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo "main"
}

get_uncommitted_count() {
    git -C "$PROJECT_ROOT" status --short 2>/dev/null | wc -l | tr -d ' '
}

get_recent_commits() {
    local count="${1:-5}"
    git -C "$PROJECT_ROOT" log --oneline -"$count" 2>/dev/null
}

is_git_clean() {
    [ -z "$(git -C "$PROJECT_ROOT" status --porcelain 2>/dev/null)" ]
}

# =============================================================================
# SESSION STATE UTILITIES
# =============================================================================

session_exists() {
    [ -f "$SESSION_STATE_FILE" ]
}

get_session_value() {
    local key="$1"
    if session_exists && command -v jq &> /dev/null; then
        jq -r ".$key // empty" "$SESSION_STATE_FILE" 2>/dev/null
    fi
}

set_session_value() {
    local key="$1"
    local value="$2"
    if session_exists && command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg key "$key" --arg value "$value" '.[$key] = $value' "$SESSION_STATE_FILE" > "$temp_file"
        mv "$temp_file" "$SESSION_STATE_FILE"
    fi
}

create_session_state() {
    local focus_area="${1:-general}"
    cat > "$SESSION_STATE_FILE" << EOF
{
  "sessionStart": "$(get_timestamp)",
  "lastActivity": "$(get_timestamp)",
  "branch": "$(get_current_branch)",
  "focusArea": "$focus_area",
  "initialStatus": {
    "uncommittedFiles": $(get_uncommitted_count),
    "currentBranch": "$(get_current_branch)"
  },
  "filesModified": [],
  "domainsAffected": [],
  "categories": {},
  "stats": {
    "totalEdits": 0,
    "totalWrites": 0
  },
  "activeGuards": [
    "tenantId-filter",
    "integer-cents",
    "soft-delete",
    "file-location"
  ]
}
EOF
    print_success "Session state created"
}

clear_session_state() {
    rm -f "$SESSION_STATE_FILE"
    rm -f "$SESSION_LOG_FILE"
    print_success "Session state cleared"
}

# =============================================================================
# CONTEXT UTILITIES
# =============================================================================

has_context_flags() {
    [ -f "$CONTEXT_FLAGS_FILE" ] && [ -s "$CONTEXT_FLAGS_FILE" ]
}

get_context_flags() {
    if has_context_flags; then
        cat "$CONTEXT_FLAGS_FILE"
    fi
}

add_context_flag() {
    local flag="$1"
    echo "$flag" >> "$CONTEXT_FLAGS_FILE"
}

archive_context_flags() {
    if has_context_flags; then
        local archive_file="$ARCHIVE_DIR/context-flags-$(get_date).txt"
        mv "$CONTEXT_FLAGS_FILE" "$archive_file"
        print_success "Context flags archived to $archive_file"
    fi
}

clear_context_flags() {
    rm -f "$CONTEXT_FLAGS_FILE"
}

# =============================================================================
# FILE UTILITIES
# =============================================================================

file_exists() {
    [ -f "$1" ]
}

dir_exists() {
    [ -d "$1" ]
}

ensure_dir() {
    mkdir -p "$1"
}

get_relative_path() {
    local full_path="$1"
    echo "${full_path#$PROJECT_ROOT/}"
}

# =============================================================================
# INVARIANT LOADING
# =============================================================================

load_invariants() {
    print_section "Loading Domain Invariants"

    if file_exists "$DOCS_DIR/domain-glossary.md"; then
        echo ""
        echo "Key Invariants:"
        echo "───────────────"
        grep -A 3 "^\*\*Invariants:\*\*" "$DOCS_DIR/domain-glossary.md" 2>/dev/null | head -20
    else
        print_warning "domain-glossary.md not found"
    fi
}

load_architecture_summary() {
    print_section "Loading Architecture Summary"

    if file_exists "$DOCS_DIR/architecture.mmd"; then
        echo ""
        echo "System Architecture loaded from docs/architecture.mmd"
        echo "Diagrams: System Overview, Request Flow, Transaction State, Invoice Lifecycle, Permissions"
    else
        print_warning "architecture.mmd not found"
    fi
}

# =============================================================================
# VALIDATION UTILITIES
# =============================================================================

check_required_files() {
    local missing=0

    print_section "Checking Required Files"

    for file in "CLAUDE.md" "docs/domain-glossary.md" "docs/repo-map.md" "docs/architecture.mmd"; do
        if file_exists "$PROJECT_ROOT/$file"; then
            print_success "$file"
        else
            print_error "$file - MISSING"
            missing=$((missing + 1))
        fi
    done

    return $missing
}

# =============================================================================
# EXPORT CHECK
# =============================================================================

# Verify this was sourced, not executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script should be sourced, not executed directly."
    echo "Usage: source $(basename "$0")"
    exit 1
fi
