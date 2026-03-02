#!/bin/bash
# AI Session Begin Script
# Automates context loading for Claude Code sessions
#
# Usage:
#   ./scripts/ai/begin.sh [focus-area]
#
# Focus areas: api, frontend, database, accounting, general
#
# This script:
# 1. Loads visual context (architecture, glossary, repo-map)
# 2. Checks previous session state
# 3. Creates new session state
# 4. Displays context summary

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
FOCUS_AREA="${1:-general}"
QUICK_MODE=false

if [[ "$1" == "--quick" ]] || [[ "$2" == "--quick" ]]; then
    QUICK_MODE=true
fi

# =============================================================================
# MAIN
# =============================================================================

print_header "🚀 AI Session Begin - $(get_date)"

# -----------------------------------------------------------------------------
# Step 1: Check Previous Session
# -----------------------------------------------------------------------------
print_section "Checking Previous Session"

if session_exists; then
    prev_start=$(get_session_value "sessionStart")
    prev_focus=$(get_session_value "focusArea")
    prev_files=$(get_session_value "filesModified" | jq -r 'length' 2>/dev/null || echo "0")

    print_info "Previous session found"
    echo "  Started: $prev_start"
    echo "  Focus: $prev_focus"
    echo "  Files modified: $prev_files"

    # Check for pending context flags
    if has_context_flags; then
        echo ""
        print_warning "Pending context updates from previous session:"
        get_context_flags | while read -r flag; do
            echo "  • $flag"
        done
    fi
else
    print_info "No previous session found"
fi

# -----------------------------------------------------------------------------
# Step 2: Load Visual Context
# -----------------------------------------------------------------------------
if [ "$QUICK_MODE" = false ]; then
    print_section "Loading Visual Context"

    # Architecture
    if file_exists "$DOCS_DIR/architecture.mmd"; then
        print_success "Architecture diagrams loaded"
        echo "  • System Overview"
        echo "  • Request Flow"
        echo "  • Transaction State Machine"
        echo "  • Invoice Lifecycle"
        echo "  • Permission Model (RBAC)"
    else
        print_warning "architecture.mmd not found - create with /processes:begin"
    fi

    # Domain Glossary
    if file_exists "$DOCS_DIR/domain-glossary.md"; then
        print_success "Domain glossary loaded"
        # Show key invariants
        echo ""
        echo "Key Invariants:"
        echo "  • Every query MUST filter by tenantId"
        echo "  • Money stored as integer cents (1050 = \$10.50)"
        echo "  • SUM(debits) === SUM(credits) always"
        echo "  • Soft delete only (deletedAt), never hard delete"
        echo "  • Preserve sourceDocument for journal entries"
    else
        print_warning "domain-glossary.md not found - create with /processes:begin"
    fi

    # Repo Map
    if file_exists "$DOCS_DIR/repo-map.md"; then
        print_success "Repository map loaded"
        echo ""
        echo "Quick Reference:"
        echo "  • API endpoint → apps/api/src/domains/<domain>/routes/"
        echo "  • Page → apps/web/src/app/(dashboard)/<domain>/"
        echo "  • Component → packages/ui/src/components/"
        echo "  • Schema → packages/database/prisma/schema.prisma"
    else
        print_warning "repo-map.md not found - create with /processes:begin"
    fi
fi

# -----------------------------------------------------------------------------
# Step 3: Git Status
# -----------------------------------------------------------------------------
print_section "Git Status"

branch=$(get_current_branch)
uncommitted=$(get_uncommitted_count)

echo "Branch: $branch"
echo "Uncommitted files: $uncommitted"

if [ "$uncommitted" -gt 0 ]; then
    echo ""
    echo "Uncommitted changes:"
    git -C "$PROJECT_ROOT" status --short | head -10
    if [ "$uncommitted" -gt 10 ]; then
        echo "  ... and $((uncommitted - 10)) more"
    fi
fi

# -----------------------------------------------------------------------------
# Step 4: Focus Area Context
# -----------------------------------------------------------------------------
print_section "Focus Area: $FOCUS_AREA"

case "$FOCUS_AREA" in
    api)
        echo "API Development Focus:"
        echo "  • Routes: apps/api/src/domains/"
        echo "  • Middleware: apps/api/src/middleware/"
        echo "  • Services: apps/api/src/domains/*/services/"
        echo "  • Schemas: apps/api/src/domains/*/schemas/"
        ;;
    frontend)
        echo "Frontend Development Focus:"
        echo "  • Pages: apps/web/src/app/(dashboard)/"
        echo "  • Components: packages/ui/src/components/"
        echo "  • Hooks: apps/web/src/hooks/"
        echo "  • Styles: packages/design-tokens/"
        ;;
    database)
        echo "Database Development Focus:"
        echo "  • Schema: packages/database/prisma/schema.prisma"
        echo "  • Migrations: packages/database/prisma/migrations/"
        echo "  • Seed: packages/database/prisma/seed.ts"
        echo "  • Standards: docs/standards/financial-data.md"
        ;;
    accounting)
        echo "Accounting Development Focus:"
        echo "  • Domain: apps/api/src/domains/accounting/"
        echo "  • Models: JournalEntry, JournalLine, GLAccount"
        echo "  • Standards: docs/standards/financial-data.md"
        echo "  • Glossary: docs/domain-glossary.md"
        ;;
    *)
        echo "General Development:"
        echo "  • CLAUDE.md for project context"
        echo "  • docs/standards/ for coding standards"
        echo "  • docs/repo-map.md for file locations"
        ;;
esac

# -----------------------------------------------------------------------------
# Step 5: Create Session State
# -----------------------------------------------------------------------------
print_section "Creating Session State"

create_session_state "$FOCUS_AREA"

# -----------------------------------------------------------------------------
# Step 6: Active Guards Summary
# -----------------------------------------------------------------------------
print_section "Active Guards"

echo "The following rules are enforced:"
echo "  ✓ tenantId filter - All queries must include tenantId"
echo "  ✓ Integer cents - Money values as integers (1050 = \$10.50)"
echo "  ✓ Soft delete - Use deletedAt, never hard delete"
echo "  ✓ File locations - Files must be in correct directories"

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_header "🚦 Session Ready"

echo ""
echo "Focus: $FOCUS_AREA"
echo "Branch: $branch"
echo "Time: $(get_time)"
echo ""
echo "Quick Commands:"
echo "  /processes:begin    - Full session dashboard"
echo "  /processes:reset    - Reset if rules violated"
echo "  /processes:eod      - End of day workflow"
echo ""
print_success "Ready to code!"
