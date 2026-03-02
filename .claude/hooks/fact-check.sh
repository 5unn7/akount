#!/bin/bash
# Fact-Checking Hook
# Triggers: During session (passive validation)
# Purpose: Validate AI assertions against facts.json to prevent confident hallucinations

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

FACTS_FILE=".claude/facts.json"

if [ ! -f "$FACTS_FILE" ]; then
    echo "⚠️  facts.json not found - fact checking disabled"
    exit 0
fi

# This hook is designed to be called FROM other hooks or tools
# It reads stdin for fact assertions and validates them

# Example usage (from another script):
# echo "backend_tests_count=1009" | bash .claude/hooks/fact-check.sh

# Read fact assertion from stdin (key=value format)
while IFS='=' read -r key value; do
    # Skip empty lines
    [ -z "$key" ] && continue

    # Extract fact from JSON using jq
    EXPECTED=$(jq -r ".$key // \"NOT_FOUND\"" "$FACTS_FILE" 2>/dev/null)

    if [ "$EXPECTED" == "NOT_FOUND" ]; then
        echo "⚠️  Fact key '$key' not found in facts.json"
        continue
    fi

    # Compare (handle both string and number)
    if [ "$EXPECTED" != "$value" ]; then
        echo "❌ HALLUCINATION DETECTED"
        echo "   Assertion: $key = $value"
        echo "   Actual (facts.json): $key = $EXPECTED"
        echo "   → Update facts.json if actual changed, or correct the assertion"
    else
        echo "✅ Fact verified: $key = $value"
    fi
done

exit 0
