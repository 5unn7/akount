#!/bin/bash
#
# Test Factory Enforcement Hook
#
# Validates that new test files follow schema-driven factory pattern.
# Prevents inline mocks and ensures factory usage.
#
# Auto-runs on: commit (via git hooks if configured)
# Manual run: .claude/hooks/test-factory-enforce.sh
#

set -e

# Get staged test files
STAGED_TESTS=$(git diff --cached --name-only --diff-filter=AM | grep -E "\.test\.ts$|\.test\.tsx$" || true)

if [ -z "$STAGED_TESTS" ]; then
  exit 0
fi

echo "🧪 Validating test file architecture..."

VIOLATIONS=0
WARNINGS=0

for file in $STAGED_TESTS; do
  # Skip if file doesn't exist (deleted)
  if [ ! -f "$file" ]; then
    continue
  fi

  FILE_STATUS="✅"

  # ═══════════════════════════════════════════════════════════════
  # Check 1: New test files MUST import factories
  # ═══════════════════════════════════════════════════════════════

  # Check if this is a new file (not just modified)
  IS_NEW=$(git diff --cached --name-status | grep "^A.*$file" || true)

  if [ -n "$IS_NEW" ]; then
    # New test file - enforce factory imports
    if ! grep -q "Factory\|mockInput\|mock.*Input\|test-utils" "$file"; then
      echo "❌ $file"
      echo "   Missing factory imports. New test files MUST import:"
      echo "   - Prisma factories: import { ModelFactory } from '../__generated__/fabbrica'"
      echo "   - Input factories: import { mockInput } from '../../test-utils/input-factories'"
      echo ""
      echo "   Template: apps/api/src/test-utils/templates/service.test.template.ts"
      FILE_STATUS="❌"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi

  # ═══════════════════════════════════════════════════════════════
  # Check 2: No inline mock objects (heuristic)
  # ═══════════════════════════════════════════════════════════════

  # Check for inline object patterns in added lines
  INLINE_MOCKS=$(git diff --cached "$file" | grep "^+" | grep -E "const.*=.*\{.*id:.*name:.*type:" || true)

  if [ -n "$INLINE_MOCKS" ]; then
    if [ "$FILE_STATUS" = "✅" ]; then
      echo "⚠️  $file"
      FILE_STATUS="⚠️"
    fi
    echo "   Possible inline mock detected:"
    echo "$INLINE_MOCKS" | head -3 | sed 's/^/     /'
    echo "   Use Factory.build() instead of inline objects"
    WARNINGS=$((WARNINGS + 1))
  fi

  # ═══════════════════════════════════════════════════════════════
  # Check 3: No deprecated factory imports
  # ═══════════════════════════════════════════════════════════════

  DEPRECATED=$(git diff --cached "$file" | grep "^+.*import.*mock.*from.*test-utils/mock-factories" || true)

  if [ -n "$DEPRECATED" ]; then
    if [ "$FILE_STATUS" = "✅" ]; then
      echo "⚠️  $file"
      FILE_STATUS="⚠️"
    fi
    echo "   Deprecated factory import:"
    echo "$DEPRECATED" | sed 's/^/     /'
    echo "   Use: import { ModelFactory } from '../__generated__/fabbrica'"
    WARNINGS=$((WARNINGS + 1))
  fi

  # ═══════════════════════════════════════════════════════════════
  # Check 4: No 'as any' casts in new code
  # ═══════════════════════════════════════════════════════════════

  AS_ANY=$(git diff --cached "$file" | grep "^+.*as any" || true)

  if [ -n "$AS_ANY" ]; then
    if [ "$FILE_STATUS" = "✅" ]; then
      echo "⚠️  $file"
      FILE_STATUS="⚠️"
    fi
    echo "   Avoid 'as any' casts - use proper factory types"
    WARNINGS=$((WARNINGS + 1))
  fi

  if [ "$FILE_STATUS" = "✅" ]; then
    echo "✅ $file"
  fi
done

echo ""

if [ $VIOLATIONS -gt 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ $VIOLATIONS critical violation(s) found"
  echo ""
  echo "Fix violations or run:"
  echo "  git commit --no-verify  (bypasses hook, not recommended)"
  echo ""
  echo "Resources:"
  echo "  - Rule: .claude/rules/test-architecture.md"
  echo "  - Template: apps/api/src/test-utils/templates/service.test.template.ts"
  echo "  - Guide: apps/api/src/test-utils/README.md"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

if [ $WARNINGS -gt 0 ]; then
  echo "⚠️  $WARNINGS warning(s) - review suggested"
  echo "   Commit allowed, but consider using factories for better maintainability"
fi

echo "✅ Test architecture validation passed"
exit 0
