#!/bin/bash
# Update facts.json
# Called by: /processes:eod or manually when facts change
# Purpose: Keep facts.json synchronized with actual project state

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

FACTS_FILE=".claude/facts.json"

echo "Updating facts.json with current project state..."

# Count Prisma models
MODEL_COUNT=$(grep -c "^model " packages/db/prisma/schema.prisma 2>/dev/null | tr -d ' \n' || echo "0")

# Count backend tests (count test files - more reliable than vitest list)
TEST_COUNT=$(find apps/api/src -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l | tr -d ' \n')

# Count API endpoints (grep for fastify.get/post/put/delete in route files only)
ENDPOINT_COUNT=$(find apps/api/src/domains -type f -name "*.ts" | grep routes | grep -v test | xargs grep -h "fastify\.\(get\|post\|put\|delete\|patch\)" 2>/dev/null | wc -l | tr -d ' \n' || echo "0")

# Count frontend pages (page.tsx files - all feature pages)
PAGE_COUNT=$(find apps/web/src/app -name "page.tsx" 2>/dev/null | wc -l | tr -d ' \n' || echo "0")

# Get current phase from STATUS.md
CURRENT_PHASE=$(grep "^## Current Phase:" STATUS.md | sed 's/.*Phase \([0-9]\+\).*/\1/' || echo "6")

# Update facts.json
jq --arg models "$MODEL_COUNT" \
   --arg tests "$TEST_COUNT" \
   --arg endpoints "$ENDPOINT_COUNT" \
   --arg pages "$PAGE_COUNT" \
   --arg phase "$CURRENT_PHASE" \
   --arg date "$(date +%Y-%m-%d)" \
   '
   .database.models_count = ($models | tonumber) |
   .database.models_count_as_of = $date |
   .test_coverage.backend_tests_count = ($tests | tonumber) |
   .test_coverage.backend_tests_as_of = $date |
   .api.endpoints_count = ($endpoints | tonumber) |
   .api.endpoints_as_of = $date |
   .frontend.pages_count = ($pages | tonumber) |
   .frontend.pages_as_of = $date |
   .phases.current = ($phase | tonumber) |
   .last_updated = $date
   ' "$FACTS_FILE" > "${FACTS_FILE}.tmp"

mv "${FACTS_FILE}.tmp" "$FACTS_FILE"

echo "✅ facts.json updated:"
echo "   Models: $MODEL_COUNT"
echo "   Tests: $TEST_COUNT"
echo "   Endpoints: $ENDPOINT_COUNT"
echo "   Pages: $PAGE_COUNT"
echo "   Current Phase: $CURRENT_PHASE"

exit 0
