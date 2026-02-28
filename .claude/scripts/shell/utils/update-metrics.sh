#!/bin/bash
# Auto-extract metrics for STATUS.md
# Usage: ./.claude/scripts/update-metrics.sh
# Output format: KEY=VALUE for easy parsing

set -e  # Exit on error

echo "# Extracting project metrics..." >&2

# Navigate to project root (script can be called from anywhere)
cd "$(dirname "$0")/../.."

# Backend test count
echo "Running backend tests..." >&2
cd apps/api
npm test -- --reporter=json --run > /tmp/api-test-results.json 2>/dev/null || echo "0" > /tmp/api-test-results.json
BACKEND_TESTS=$(jq -r '.numPassedTests // 0' /tmp/api-test-results.json 2>/dev/null || echo "0")
cd ../..

# Frontend test count
echo "Running frontend tests..." >&2
cd apps/web
npm test -- --reporter=json --run > /tmp/web-test-results.json 2>/dev/null || echo "0" > /tmp/web-test-results.json
FRONTEND_TESTS=$(jq -r '.numPassedTests // 0' /tmp/web-test-results.json 2>/dev/null || echo "0")
cd ../..

# TypeScript errors
echo "Checking TypeScript errors..." >&2
TSC_ERRORS=$(npm run typecheck 2>&1 | grep -c "error TS" || echo "0")

# NPM vulnerabilities
echo "Auditing npm vulnerabilities..." >&2
NPM_AUDIT=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":0,"high":0}}}')
NPM_VULNS=$(echo "$NPM_AUDIT" | jq -r '.metadata.vulnerabilities.total // 0')
NPM_HIGH=$(echo "$NPM_AUDIT" | jq -r '.metadata.vulnerabilities.high // 0')

# Loading state coverage
echo "Checking loading state coverage..." >&2
PAGES=$(find apps/web/src/app/\(dashboard\) -name "page.tsx" 2>/dev/null | wc -l)
LOADING=$(find apps/web/src/app/\(dashboard\) -name "loading.tsx" 2>/dev/null | wc -l)

# Output results
echo ""
echo "BACKEND_TESTS=$BACKEND_TESTS"
echo "FRONTEND_TESTS=$FRONTEND_TESTS"
echo "TSC_ERRORS=$TSC_ERRORS"
echo "NPM_VULNS=$NPM_VULNS"
echo "NPM_HIGH=$NPM_HIGH"
echo "LOADING_COVERAGE=$LOADING/$PAGES"

# Summary to stderr
echo "" >&2
echo "✅ Metrics extraction complete:" >&2
echo "   Backend tests: $BACKEND_TESTS" >&2
echo "   Frontend tests: $FRONTEND_TESTS" >&2
echo "   TypeScript errors: $TSC_ERRORS" >&2
echo "   NPM vulnerabilities: $NPM_VULNS ($NPM_HIGH high)" >&2
echo "   Loading states: $LOADING/$PAGES" >&2
