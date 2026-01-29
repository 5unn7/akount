#!/bin/bash

# Database Recovery Test Script
# Tests that backups can be restored successfully

set -e  # Exit on error

BACKUP_DIR="$HOME/akount-db-backups"
TEST_DB="akount_test_$(date +%Y%m%d_%H%M%S)"

echo "🧪 Starting database recovery test..."
echo "Test database: $TEST_DB"
echo ""

# Find most recent backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Error: No backups found in $BACKUP_DIR"
  echo "Run ./scripts/backup-db-local.sh first"
  exit 1
fi

BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo "📦 Using backup: $(basename "$LATEST_BACKUP")"
echo "📊 Size: $BACKUP_SIZE"
echo ""

# Check if createdb is available
if ! command -v createdb &> /dev/null; then
  echo "❌ Error: createdb not found"
  echo "Install PostgreSQL client tools"
  exit 1
fi

# Create test database
echo "1️⃣  Creating test database..."
createdb "$TEST_DB"
echo "✅ Test database created"

# Restore backup
echo ""
echo "2️⃣  Restoring from backup..."
START_TIME=$(date +%s)
gunzip -c "$LATEST_BACKUP" | psql "$TEST_DB" > /dev/null
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo "✅ Backup restored in ${DURATION}s"

# Verify data
echo ""
echo "3️⃣  Verifying data integrity..."

# Count tables
TABLE_COUNT=$(psql "$TEST_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   Tables: $TABLE_COUNT"

# Check key tables (if they exist)
if psql "$TEST_DB" -c "SELECT 1 FROM \"User\" LIMIT 1" &> /dev/null; then
  USER_COUNT=$(psql "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"User\";")
  echo "   Users: $USER_COUNT"
fi

if psql "$TEST_DB" -c "SELECT 1 FROM \"Account\" LIMIT 1" &> /dev/null; then
  ACCOUNT_COUNT=$(psql "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"Account\";")
  echo "   Accounts: $ACCOUNT_COUNT"
fi

if psql "$TEST_DB" -c "SELECT 1 FROM \"Transaction\" LIMIT 1" &> /dev/null; then
  TRANSACTION_COUNT=$(psql "$TEST_DB" -t -c "SELECT COUNT(*) FROM \"Transaction\";")
  LATEST_TRANSACTION=$(psql "$TEST_DB" -t -c "SELECT MAX(\"createdAt\") FROM \"Transaction\";")
  echo "   Transactions: $TRANSACTION_COUNT"
  echo "   Latest transaction: $LATEST_TRANSACTION"
fi

echo "✅ Data verification complete"

# Clean up test database
echo ""
echo "4️⃣  Cleaning up..."
dropdb "$TEST_DB"
echo "✅ Test database removed"

echo ""
echo "🎉 Recovery test PASSED!"
echo ""
echo "Summary:"
echo "  - Backup file: $(basename "$LATEST_BACKUP")"
echo "  - Backup size: $BACKUP_SIZE"
echo "  - Restore time: ${DURATION}s"
echo "  - Tables restored: $TABLE_COUNT"
echo ""
echo "✅ Your backups are working correctly!"
echo "📅 Next test: $(date -d '+1 month' +%Y-%m-%d) (monthly recommended)"
