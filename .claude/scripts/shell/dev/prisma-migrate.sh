#!/bin/bash
# Interactive Tool Wrapper: Prisma Migrate
#
# Agents cannot run interactive Prisma CLI commands.
# This wrapper detects schema changes and outputs the exact command for users to run.
#
# Usage:
#   .claude/scripts/prisma-migrate.sh          # Check if migration needed
#   .claude/scripts/prisma-migrate.sh --verify # Verify migration was applied

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT/packages/db"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if schema has uncommitted changes
check_schema_changes() {
  if git diff --quiet packages/db/prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} No schema changes detected"
    return 1
  else
    echo -e "${YELLOW}⚠${NC}  Schema changes detected"
    return 0
  fi
}

# Suggest migration name based on changes
suggest_migration_name() {
  local changes=$(git diff packages/db/prisma/schema.prisma)

  # Detect pattern
  if echo "$changes" | grep -q "^+model"; then
    local model_name=$(echo "$changes" | grep "^+model" | head -1 | awk '{print $2}')
    echo "add_${model_name,,}_model"
  elif echo "$changes" | grep -q "^+.*@id"; then
    echo "add_primary_keys"
  elif echo "$changes" | grep -q "^+.*@@index"; then
    echo "add_indexes"
  elif echo "$changes" | grep -q "^+.*@relation"; then
    echo "add_relations"
  elif echo "$changes" | grep -q "deletedAt"; then
    echo "add_soft_delete"
  elif echo "$changes" | grep -q "^+.*:.*"; then
    echo "add_fields"
  else
    echo "update_schema"
  fi
}

# Verify migration was applied
verify_migration() {
  local latest_migration=$(ls -t prisma/migrations/ | head -1)

  if [ -z "$latest_migration" ]; then
    echo -e "${RED}✗${NC} No migrations found"
    return 1
  fi

  # Check if migration.sql exists
  if [ ! -f "prisma/migrations/$latest_migration/migration.sql" ]; then
    echo -e "${RED}✗${NC} Migration SQL not found: $latest_migration"
    return 1
  fi

  # Check schema matches (no drift)
  if git diff --quiet packages/db/prisma/schema.prisma; then
    echo -e "${GREEN}✓${NC} Migration applied: $latest_migration"
    echo -e "${GREEN}✓${NC} Schema matches migrations (no drift)"
    return 0
  else
    echo -e "${YELLOW}⚠${NC}  Migration exists but schema still has uncommitted changes"
    echo -e "${YELLOW}⚠${NC}  You may need to run another migration"
    return 1
  fi
}

# Main
if [ "$1" == "--verify" ]; then
  verify_migration
  exit $?
fi

# Check for changes
if ! check_schema_changes; then
  echo "No migration needed."
  exit 0
fi

# Schema changed, output instructions
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}MIGRATION REQUIRED${NC} (Agent cannot run interactive commands)"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Detected schema changes in:"
echo "  packages/db/prisma/schema.prisma"
echo ""
echo "Suggested migration name:"
SUGGESTED_NAME=$(suggest_migration_name)
echo -e "  ${GREEN}$SUGGESTED_NAME${NC}"
echo ""
echo "Please run:"
echo ""
echo -e "  ${GREEN}cd packages/db${NC}"
echo -e "  ${GREEN}npx prisma migrate dev --name $SUGGESTED_NAME${NC}"
echo ""
echo "After migration completes, verify with:"
echo ""
echo -e "  ${GREEN}.claude/scripts/prisma-migrate.sh --verify${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit 1  # Exit code 1 signals "migration needed"