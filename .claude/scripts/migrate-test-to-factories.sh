#!/bin/bash
#
# Test Factory Migration Script
#
# Automates migration of test files from inline mocks to schema-driven factories.
# Handles both route tests (Zod input factories) and service tests (Prisma model factories).
#
# Usage:
#   ./migrate-test-to-factories.sh <test-file-path>
#   ./migrate-test-to-factories.sh --batch  (migrate all non-compliant files)
#   ./migrate-test-to-factories.sh --audit   (list files needing migration)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ═══════════════════════════════════════════════════════════════
# Functions
# ═══════════════════════════════════════════════════════════════

# Check if file uses factories
has_factories() {
  local file="$1"
  grep -q "Factory\|mockInput\|from.*test-utils" "$file"
}

# Check if file has inline mocks (heuristic)
has_inline_mocks() {
  local file="$1"
  # Count object literals with >5 properties
  local count=$(grep -c "const.*=.*{$" "$file" 2>/dev/null || echo "0")
  [ "$count" -gt 2 ]
}

# Detect test file type
detect_test_type() {
  local file="$1"
  if echo "$file" | grep -q "routes.test.ts"; then
    echo "route"
  elif echo "$file" | grep -q "service.test.ts"; then
    echo "service"
  else
    echo "unknown"
  fi
}

# Audit mode - list all files needing migration
audit_mode() {
  echo "🔍 Auditing test files for factory adoption..."
  echo ""

  local total=0
  local using_factories=0
  local needs_migration=0

  while IFS= read -r file; do
    total=$((total + 1))

    if has_factories "$file"; then
      using_factories=$((using_factories + 1))
    elif has_inline_mocks "$file"; then
      needs_migration=$((needs_migration + 1))
      echo "📋 $file"
    fi
  done < <(find "$PROJECT_ROOT/apps/api/src" -name "*.test.ts" -type f)

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Factory Adoption Metrics"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Total test files: $total"
  echo "  Using factories:  $using_factories ($(( using_factories * 100 / total ))%)"
  echo "  Needs migration:  $needs_migration ($(( needs_migration * 100 / total ))%)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Migrate single file
migrate_file() {
  local file="$1"
  local test_type=$(detect_test_type "$file")

  echo "🔄 Migrating: $file"
  echo "   Type: $test_type"

  # Check if already using factories
  if has_factories "$file"; then
    echo "   ✅ Already using factories - skipping"
    return 0
  fi

  # Backup original
  cp "$file" "$file.backup"

  # ───────────────────────────────────────────────────────────
  # Step 1: Add factory imports
  # ───────────────────────────────────────────────────────────

  if [ "$test_type" = "route" ]; then
    # Route test - add input factories
    if ! grep -q "mockInput" "$file"; then
      # Add import after existing imports
      sed -i "/import.*from 'vitest'/a\\
import { mockTaxRateInput, mockGLAccountInput, mockInvoiceInput, mockBillInput } from '../../../test-utils/input-factories';" "$file"
      echo "   ✅ Added input factory imports"
    fi

  elif [ "$test_type" = "service" ]; then
    # Service test - add Prisma factories and mockPrisma
    if ! grep -q "mockPrisma" "$file"; then
      # Replace manual vi.mock with centralized pattern
      echo "   ⚠️  Service test migration requires manual review"
      echo "      Template: apps/api/src/test-utils/templates/service.test.template.ts"
      echo "      Pattern:"
      echo "        1. Import: import { mockPrisma, rewirePrismaMock, mockModel } from '../../../test-utils'"
      echo "        2. vi.mock('@akount/db', async (importOriginal) => ({ ...(await importOriginal()), prisma: mockPrisma }))"
      echo "        3. beforeEach: rewirePrismaMock()"
      rm "$file.backup"
      return 1
    fi
  fi

  # ───────────────────────────────────────────────────────────
  # Step 2: Replace common inline mocks
  # ───────────────────────────────────────────────────────────

  # Replace inline MOCK_TAX_RATE constants
  if grep -q "const MOCK_TAX_RATE = {" "$file"; then
    echo "   🔧 Replacing inline MOCK_TAX_RATE..."
    # This requires manual review - script notes for human
    echo "      Manual step: Replace MOCK_TAX_RATE with mockTaxRate() or mockTaxRateInput()"
  fi

  # ───────────────────────────────────────────────────────────
  # Step 3: Verify migration
  # ───────────────────────────────────────────────────────────

  echo "   ⚠️  Migration incomplete - requires manual review"
  echo "      Backup saved: $file.backup"
  echo "      Next: Review changes, run tests, delete .backup if successful"

  return 0
}

# Batch mode - migrate all files
batch_mode() {
  echo "🚀 Batch migration mode"
  echo "   Finding files without factory usage..."
  echo ""

  local migrated=0
  local failed=0
  local skipped=0

  while IFS= read -r file; do
    if has_factories "$file"; then
      skipped=$((skipped + 1))
      continue
    fi

    if migrate_file "$file"; then
      migrated=$((migrated + 1))
    else
      failed=$((failed + 1))
    fi
  done < <(find "$PROJECT_ROOT/apps/api/src" -name "*.test.ts" -type f)

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Batch Migration Results"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Migrated: $migrated"
  echo "  Skipped:  $skipped (already using factories)"
  echo "  Failed:   $failed (needs manual review)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

case "${1:-}" in
  --audit)
    audit_mode
    ;;
  --batch)
    batch_mode
    ;;
  "")
    echo "Usage:"
    echo "  $0 <test-file>     Migrate single file"
    echo "  $0 --audit         List files needing migration"
    echo "  $0 --batch         Migrate all files (with review prompts)"
    exit 1
    ;;
  *)
    migrate_file "$1"
    ;;
esac
