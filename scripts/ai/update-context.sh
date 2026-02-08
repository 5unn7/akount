#!/bin/bash
# AI Context Update Script
# Detects changes that require documentation updates
#
# Usage:
#   ./scripts/ai/update-context.sh [--check | --update]
#
# Options:
#   --check   Only check what needs updating (default)
#   --update  Interactive mode to help update documentation
#
# This script:
# 1. Analyzes recent git changes
# 2. Identifies documentation that needs updates
# 3. Provides guidance on what to update

set -e

# Load common utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

# Parse arguments
MODE="check"
if [[ "$1" == "--update" ]]; then
    MODE="update"
fi

COMMITS_TO_CHECK="${2:-10}"

# =============================================================================
# ANALYSIS FUNCTIONS
# =============================================================================

analyze_schema_changes() {
    local changes=$(git -C "$PROJECT_ROOT" diff HEAD~"$COMMITS_TO_CHECK" --name-only 2>/dev/null | grep "schema.prisma" || true)

    if [ -n "$changes" ]; then
        echo "SCHEMA"
        # Get specific changes
        git -C "$PROJECT_ROOT" diff HEAD~"$COMMITS_TO_CHECK" -- "**/schema.prisma" 2>/dev/null | grep -E "^[+-]\s*(model|@@)" | head -20 || true
    fi
}

analyze_route_changes() {
    local changes=$(git -C "$PROJECT_ROOT" diff HEAD~"$COMMITS_TO_CHECK" --name-only 2>/dev/null | grep -E "routes.*\.ts$" || true)

    if [ -n "$changes" ]; then
        echo "ROUTES"
        echo "$changes"
    fi
}

analyze_architecture_changes() {
    local changes=$(git -C "$PROJECT_ROOT" diff HEAD~"$COMMITS_TO_CHECK" --name-only 2>/dev/null | grep -E "(middleware|plugins|config).*\.ts$" || true)

    if [ -n "$changes" ]; then
        echo "ARCHITECTURE"
        echo "$changes"
    fi
}

analyze_new_domains() {
    # Check for new domain directories
    local domains=$(git -C "$PROJECT_ROOT" diff HEAD~"$COMMITS_TO_CHECK" --name-only 2>/dev/null | grep -oE "domains/[^/]+" | sort | uniq || true)

    if [ -n "$domains" ]; then
        echo "DOMAINS"
        echo "$domains"
    fi
}

# =============================================================================
# MAIN
# =============================================================================

print_header "📚 Context Documentation Update Check"

echo "Analyzing last $COMMITS_TO_CHECK commits..."
echo ""

# Track what needs updating
needs_glossary=false
needs_repomap=false
needs_architecture=false

# -----------------------------------------------------------------------------
# Schema Analysis
# -----------------------------------------------------------------------------
print_section "Schema Changes"

schema_output=$(analyze_schema_changes)
if [ -n "$schema_output" ]; then
    print_warning "Schema changes detected"
    echo "$schema_output" | tail -n +2  # Skip "SCHEMA" header
    echo ""
    echo "Action: Update docs/domain-glossary.md"
    echo "  • Add new models to glossary"
    echo "  • Update field descriptions"
    echo "  • Document new invariants"
    needs_glossary=true
else
    print_success "No schema changes"
fi

# -----------------------------------------------------------------------------
# Route Analysis
# -----------------------------------------------------------------------------
print_section "Route Changes"

route_output=$(analyze_route_changes)
if [ -n "$route_output" ]; then
    print_warning "Route changes detected"
    echo "$route_output" | tail -n +2  # Skip "ROUTES" header
    echo ""
    echo "Action: Update docs/repo-map.md"
    echo "  • Update quick navigation table"
    echo "  • Document new endpoints"
    echo "  • Update domain structure if needed"
    needs_repomap=true
else
    print_success "No route changes"
fi

# -----------------------------------------------------------------------------
# Architecture Analysis
# -----------------------------------------------------------------------------
print_section "Architecture Changes"

arch_output=$(analyze_architecture_changes)
if [ -n "$arch_output" ]; then
    print_warning "Architecture changes detected"
    echo "$arch_output" | tail -n +2  # Skip "ARCHITECTURE" header
    echo ""
    echo "Action: Update docs/architecture.mmd"
    echo "  • Update System Overview diagram"
    echo "  • Update Request Flow if middleware changed"
    echo "  • Document new patterns"
    needs_architecture=true
else
    print_success "No architecture changes"
fi

# -----------------------------------------------------------------------------
# Domain Analysis
# -----------------------------------------------------------------------------
print_section "Domain Changes"

domain_output=$(analyze_new_domains)
if [ -n "$domain_output" ]; then
    print_warning "Domain changes detected"
    echo "$domain_output" | tail -n +2  # Skip "DOMAINS" header
    echo ""
    echo "Action: Verify domain documentation"
    echo "  • Check domain is in repo-map.md"
    echo "  • Ensure routes are documented"
    echo "  • Add to architecture diagram if new"
    needs_repomap=true
else
    print_success "No domain changes"
fi

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_header "📋 Update Summary"

if [ "$needs_glossary" = false ] && [ "$needs_repomap" = false ] && [ "$needs_architecture" = false ]; then
    print_success "All context documentation is up to date!"
else
    echo "Documentation updates needed:"
    echo ""

    if [ "$needs_glossary" = true ]; then
        echo "  📖 docs/domain-glossary.md"
        echo "     • Add/update model definitions"
        echo "     • Document invariants"
        echo ""
    fi

    if [ "$needs_repomap" = true ]; then
        echo "  🗺️  docs/repo-map.md"
        echo "     • Update navigation table"
        echo "     • Document new file locations"
        echo ""
    fi

    if [ "$needs_architecture" = true ]; then
        echo "  📐 docs/architecture.mmd"
        echo "     • Update relevant diagrams"
        echo "     • Document new patterns"
        echo ""
    fi
fi

# -----------------------------------------------------------------------------
# Interactive Update Mode
# -----------------------------------------------------------------------------
if [ "$MODE" = "update" ]; then
    print_header "🔄 Interactive Update Mode"

    if [ "$needs_glossary" = true ]; then
        echo ""
        echo "Opening domain-glossary.md for review..."
        echo "Press Enter to continue or Ctrl+C to skip"
        read -r

        if command -v code &> /dev/null; then
            code "$DOCS_DIR/domain-glossary.md"
        else
            cat "$DOCS_DIR/domain-glossary.md" | head -50
            echo "..."
            echo "(Full file: docs/domain-glossary.md)"
        fi
    fi

    if [ "$needs_repomap" = true ]; then
        echo ""
        echo "Opening repo-map.md for review..."
        echo "Press Enter to continue or Ctrl+C to skip"
        read -r

        if command -v code &> /dev/null; then
            code "$DOCS_DIR/repo-map.md"
        else
            cat "$DOCS_DIR/repo-map.md" | head -50
            echo "..."
            echo "(Full file: docs/repo-map.md)"
        fi
    fi

    if [ "$needs_architecture" = true ]; then
        echo ""
        echo "Opening architecture.mmd for review..."
        echo "Press Enter to continue or Ctrl+C to skip"
        read -r

        if command -v code &> /dev/null; then
            code "$DOCS_DIR/architecture.mmd"
        else
            cat "$DOCS_DIR/architecture.mmd" | head -50
            echo "..."
            echo "(Full file: docs/architecture.mmd)"
        fi
    fi

    print_success "Interactive update complete"
fi

# -----------------------------------------------------------------------------
# Exit
# -----------------------------------------------------------------------------
echo ""
echo "Run with --update for interactive mode"
echo "Example: ./scripts/ai/update-context.sh --update"
