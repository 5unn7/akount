#!/bin/bash

# Pre-commit hook: Check for pattern violations in staged files
# Blocks commits with CRITICAL violations (console.log, missing tenant filters)
# Warns for HIGH violations (: any, inline utils)
# Allows MEDIUM/LOW violations

echo "🔍 Checking for pattern violations..."

# Run violation detector on staged files
node .claude/scripts/detect-violations.js --staged

EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
  echo ""
  echo "💡 To bypass this check (NOT recommended):"
  echo "   git commit --no-verify"
  echo ""
  exit 1
fi

# Exit code 0 = no violations or only non-critical
exit 0
