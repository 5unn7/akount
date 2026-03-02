#!/bin/bash
# Context Freshness Validation Hook
# Triggers: AfterGitCommit
# Purpose: Flag stale context files when critical files change

set -e

# Get the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# Track staleness in a file
STALE_FILE=".claude/.stale-context"

# Initialize staleness file if it doesn't exist
if [ ! -f "$STALE_FILE" ]; then
    echo "{}" > "$STALE_FILE"
fi

# Get list of files in last commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    exit 0
fi

# Check for schema changes
if echo "$CHANGED_FILES" | grep -q "packages/db/prisma/schema.prisma"; then
    echo "⚠️  Schema changed - context may be stale"
    echo "   Files to update: CLAUDE.md, packages/db/CLAUDE.md, docs/context-map.md"

    # Mark context as stale
    jq '.schema_stale = true | .last_schema_change = now | .stale_files = ["CLAUDE.md", "packages/db/CLAUDE.md", "docs/context-map.md"]' "$STALE_FILE" > "${STALE_FILE}.tmp"
    mv "${STALE_FILE}.tmp" "$STALE_FILE"
fi

# Check for new routes
if echo "$CHANGED_FILES" | grep -q "apps/api/src/domains/.*/routes/.*\.ts$"; then
    echo "⚠️  New API routes detected - endpoint inventory may be stale"
    echo "   File to update: apps/api/CLAUDE.md"

    # Mark API context as stale
    jq '.api_routes_stale = true | .last_route_change = now | .stale_files = (.stale_files // []) + ["apps/api/CLAUDE.md"] | .stale_files |= unique' "$STALE_FILE" > "${STALE_FILE}.tmp"
    mv "${STALE_FILE}.tmp" "$STALE_FILE"
fi

# Check for new pages
if echo "$CHANGED_FILES" | grep -q "apps/web/src/app/.*page\.tsx$"; then
    echo "⚠️  New pages detected - page inventory may be stale"
    echo "   File to update: apps/web/CLAUDE.md"

    # Mark web context as stale
    jq '.web_pages_stale = true | .last_page_change = now | .stale_files = (.stale_files // []) + ["apps/web/CLAUDE.md"] | .stale_files |= unique' "$STALE_FILE" > "${STALE_FILE}.tmp"
    mv "${STALE_FILE}.tmp" "$STALE_FILE"
fi

# Check for new Prisma models (model count changed)
CURRENT_MODEL_COUNT=$(grep -c "^model " packages/db/prisma/schema.prisma 2>/dev/null || echo "0")
LAST_MODEL_COUNT=$(jq -r '.model_count // 0' "$STALE_FILE")

if [ "$CURRENT_MODEL_COUNT" != "$LAST_MODEL_COUNT" ] && [ "$LAST_MODEL_COUNT" != "0" ]; then
    echo "⚠️  Prisma model count changed: $LAST_MODEL_COUNT → $CURRENT_MODEL_COUNT"
    echo "   Files to update: packages/db/CLAUDE.md, docs/context-map.md"

    jq --arg count "$CURRENT_MODEL_COUNT" '.model_count_stale = true | .model_count = ($count | tonumber) | .stale_files = (.stale_files // []) + ["packages/db/CLAUDE.md", "docs/context-map.md"] | .stale_files |= unique' "$STALE_FILE" > "${STALE_FILE}.tmp"
    mv "${STALE_FILE}.tmp" "$STALE_FILE"
else
    # Update model count
    jq --arg count "$CURRENT_MODEL_COUNT" '.model_count = ($count | tonumber)' "$STALE_FILE" > "${STALE_FILE}.tmp"
    mv "${STALE_FILE}.tmp" "$STALE_FILE"
fi

# Check if context is stale
HAS_STALE=$(jq -r '.schema_stale or .api_routes_stale or .web_pages_stale or .model_count_stale' "$STALE_FILE")

if [ "$HAS_STALE" == "true" ]; then
    echo ""
    echo "📋 Context freshness check: STALE context detected"
    echo "   Run '/processes:audit' to update context files"
    echo "   Or manually update files listed above"
    echo ""
fi

exit 0
