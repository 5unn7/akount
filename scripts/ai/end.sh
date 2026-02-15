#!/bin/bash
# AI Session End Script
# Automates end-of-session cleanup and documentation
#
# Usage:
#   ./scripts/ai/end.sh
#
# This script:
# 1. Shows session summary
# 2. Checks for context documentation updates needed
# 3. Archives session artifacts
# 4. Clears session state

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# =============================================================================
# MAIN
# =============================================================================

print_header "📋 AI Session End - $(get_date)"

# -----------------------------------------------------------------------------
# Step 1: Session Summary
# -----------------------------------------------------------------------------
print_section "Session Summary"

if session_exists; then
    session_start=$(get_session_value "sessionStart")
    focus_area=$(get_session_value "focusArea")
    total_edits=$(get_session_value "stats.totalEdits" 2>/dev/null || echo "0")
    total_writes=$(get_session_value "stats.totalWrites" 2>/dev/null || echo "0")

    echo "Session Start: $session_start"
    echo "Focus Area: $focus_area"
    echo "Total Edits: $total_edits"
    echo "Total Writes: $total_writes"

    # Show files modified
    if file_exists "$SESSION_LOG_FILE"; then
        file_count=$(wc -l < "$SESSION_LOG_FILE" | tr -d ' ')
        echo "Files Touched: $file_count"
        echo ""
        echo "Recent Changes:"
        tail -10 "$SESSION_LOG_FILE" | while read -r line; do
            echo "  $line"
        done
    fi
else
    print_warning "No active session found"
fi

# -----------------------------------------------------------------------------
# Step 2: Git Status
# -----------------------------------------------------------------------------
print_section "Git Status"

uncommitted=$(get_uncommitted_count)
branch=$(get_current_branch)

echo "Branch: $branch"
echo "Uncommitted files: $uncommitted"

if [ "$uncommitted" -gt 0 ]; then
    echo ""
    print_warning "You have uncommitted changes!"
    echo ""
    git -C "$PROJECT_ROOT" status --short | head -15
    echo ""
    echo "Consider committing before ending session."
fi

# -----------------------------------------------------------------------------
# Step 3: Context Update Check
# -----------------------------------------------------------------------------
print_section "Context Documentation Check"

update_needed=false

# Check for schema changes
schema_changes=$(git -C "$PROJECT_ROOT" diff HEAD~5 --name-only 2>/dev/null | grep -c "schema.prisma" || echo "0")
if [ "$schema_changes" -gt 0 ]; then
    print_warning "Schema changes detected - Review domain-glossary.md"
    update_needed=true
fi

# Check for route changes
route_changes=$(git -C "$PROJECT_ROOT" diff HEAD~5 --name-only 2>/dev/null | grep -c "routes.*\.ts" || echo "0")
if [ "$route_changes" -gt 0 ]; then
    print_warning "Route changes detected - Review repo-map.md"
    update_needed=true
fi

# Check for architecture changes
arch_changes=$(git -C "$PROJECT_ROOT" diff HEAD~5 --name-only 2>/dev/null | grep -cE "(middleware|plugins)" || echo "0")
if [ "$arch_changes" -gt 0 ]; then
    print_warning "Architecture changes detected - Review architecture.mmd"
    update_needed=true
fi

# Show pending context flags
if has_context_flags; then
    echo ""
    print_warning "Pending context update flags:"
    get_context_flags | sort | uniq | while read -r flag; do
        echo "  • $flag"
    done
    update_needed=true
fi

if [ "$update_needed" = false ]; then
    print_success "No context documentation updates needed"
fi

# -----------------------------------------------------------------------------
# Step 4: Temporary File Cleanup Check
# -----------------------------------------------------------------------------
print_section "Cleanup Check"

# Check for temporary files in root
temp_files=$(find "$PROJECT_ROOT" -maxdepth 1 -name "*_errors.txt" -o -name "*_tsc_errors.txt" 2>/dev/null | wc -l | tr -d ' ')
if [ "$temp_files" -gt 0 ]; then
    print_warning "Found $temp_files temporary error files in root"
    echo "  Consider: rm -f *_errors.txt *_tsc_errors.txt"
fi

# Check for .agent directory
if dir_exists "$PROJECT_ROOT/.agent"; then
    print_warning "Found .agent/ directory (temporary agent work)"
    echo "  Consider: rm -rf .agent/"
fi

# Check for misplaced session files
misplaced=$(find "$PROJECT_ROOT" -maxdepth 1 -name "WEEK_*.md" -o -name "CODE_REVIEW_*.md" 2>/dev/null | wc -l | tr -d ' ')
if [ "$misplaced" -gt 0 ]; then
    print_warning "Found $misplaced session files in root"
    echo "  Move to: docs/archive/sessions/"
fi

# -----------------------------------------------------------------------------
# Step 5: Archive Session
# -----------------------------------------------------------------------------
print_section "Archiving Session"

# Archive session log if exists
if file_exists "$SESSION_LOG_FILE"; then
    archive_file="$ARCHIVE_DIR/session-log-$(get_date).txt"
    cp "$SESSION_LOG_FILE" "$archive_file"
    print_success "Session log archived to $(get_relative_path "$archive_file")"
fi

# Archive context flags
if has_context_flags; then
    archive_context_flags
fi

# -----------------------------------------------------------------------------
# Step 6: Clear Session State
# -----------------------------------------------------------------------------
print_section "Clearing Session State"

clear_session_state
print_success "Session state cleared"

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_header "✅ Session Ended"

echo ""
echo "Next Steps:"
echo "  1. Commit any remaining changes"
echo "  2. Update documentation if flagged"
echo "  3. Push to remote if ready"
echo ""
echo "Start next session with:"
echo "  ./scripts/ai/begin.sh [focus-area]"
echo "  or /processes:begin"
echo ""
print_success "Session complete!"
