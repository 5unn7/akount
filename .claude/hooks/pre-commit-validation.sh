#!/bin/bash
# Pre-Commit Validation Hook for Claude Code
# Validates code quality before allowing commits
#
# This hook checks:
# 1. TypeScript compilation (no type errors)
# 2. Prisma schema validation
# 3. Multi-tenancy enforcement (warns about missing tenantId)
#
# Exit codes:
# 0 = All validations passed
# 1 = Validation failed (block commit)

echo "🔍 Running pre-commit validation..."

# Track if any validation failed
VALIDATION_FAILED=0

# 1. TypeScript compilation check
echo "  → Checking TypeScript compilation..."
if ! npx tsc --noEmit 2>/dev/null; then
  echo "❌ TypeScript compilation errors found" >&2
  echo "   Run 'npx tsc --noEmit' to see detailed errors" >&2
  VALIDATION_FAILED=1
else
  echo "  ✅ TypeScript compilation passed"
fi

# 2. Prisma schema validation
if [ -f "packages/db/prisma/schema.prisma" ]; then
  echo "  → Validating Prisma schema..."
  if ! npx prisma validate --schema packages/db/prisma/schema.prisma 2>/dev/null; then
    echo "❌ Prisma schema validation failed" >&2
    echo "   Run 'npx prisma validate' to see detailed errors" >&2
    VALIDATION_FAILED=1
  else
    echo "  ✅ Prisma schema validation passed"
  fi
fi

# 3. Investigation protocol (verify proper investigation before code changes)
echo "  → Checking investigation protocol..."
if ! .claude/hooks/investigation-check.sh; then
  VALIDATION_FAILED=1
fi

# 4. Design token validation (block hardcoded colors)
echo "  → Checking design tokens..."
if ! .claude/hooks/design-token-check.sh; then
  VALIDATION_FAILED=1
fi

# 5. Multi-tenancy check (basic grep for tenantId in Prisma queries)
echo "  → Checking multi-tenancy enforcement..."
MISSING_TENANT_ID=0

# Get list of staged TypeScript files that contain prisma queries
# Use process substitution + while-read to safely handle filenames with spaces
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Check if file has prisma queries
    if grep -q 'prisma\.\w\+\.find\|prisma\.\w\+\.update\|prisma\.\w\+\.delete\|prisma\.\w\+\.create' "$file"; then
      # Check if file has tenantId filter
      if ! grep -q 'tenantId' "$file"; then
        echo "  ⚠️  Warning: $file contains Prisma queries without tenantId filter" >&2
        MISSING_TENANT_ID=1
      fi
    fi
  fi
done < <(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ $MISSING_TENANT_ID -eq 1 ]; then
  echo "" >&2
  echo "  ⚠️  MULTI-TENANCY WARNING:" >&2
  echo "  Some files contain Prisma queries without tenantId filters." >&2
  echo "  This may cause data leakage between tenants." >&2
  echo "  Please review and add tenantId filters where appropriate." >&2
  echo "" >&2
  # Don't block commit, just warn
else
  echo "  ✅ Multi-tenancy check passed"
fi

# 6. Optional: Linting (commented out - can be slow)
# echo "  → Running ESLint..."
# if ! npx eslint . --ext .ts,.tsx 2>/dev/null; then
#   echo "❌ ESLint errors found" >&2
#   VALIDATION_FAILED=1
# else
#   echo "  ✅ ESLint passed"
# fi

# 7. Optional: Tests (commented out - can be very slow)
# echo "  → Running tests..."
# if ! npm test 2>/dev/null; then
#   echo "❌ Tests failed" >&2
#   VALIDATION_FAILED=1
# else
#   echo "  ✅ Tests passed"
# fi

# Final result
if [ $VALIDATION_FAILED -eq 1 ]; then
  echo "" >&2
  echo "❌ Pre-commit validation failed" >&2
  echo "   Please fix the errors above before committing" >&2
  exit 1
else
  echo "" >&2
  echo "✅ Pre-commit validation passed - Ready to commit" >&2
  exit 0
fi
