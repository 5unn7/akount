#!/bin/bash

# Local Database Backup Script
# Backs up PostgreSQL database for development

set -e  # Exit on error

BACKUP_DIR="$HOME/akount-db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/akount_$TIMESTAMP.sql"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup..."
echo "Timestamp: $TIMESTAMP"

# Load DATABASE_URL from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep DATABASE_URL | xargs)
else
  echo "❌ Error: .env file not found"
  echo "Expected location: $PROJECT_ROOT/.env"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env"
  exit 1
fi

echo "📊 Database: ${DATABASE_URL%%\?*}"  # Show URL without query params

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
  echo "❌ Error: pg_dump not found"
  echo "Install PostgreSQL client tools:"
  echo "  - macOS: brew install postgresql"
  echo "  - Ubuntu: sudo apt-get install postgresql-client"
  echo "  - Windows: Install PostgreSQL from https://www.postgresql.org/download/windows/"
  exit 1
fi

# Backup database
echo "💾 Creating backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Compress
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo "✅ Database backed up successfully!"
echo "📁 Location: $BACKUP_FILE.gz"
echo "📊 Size: $BACKUP_SIZE"

# Keep only last 7 days of local backups
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 | wc -l)
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
if [ "$OLD_BACKUPS" -gt 0 ]; then
  echo "🗑️  Deleted $OLD_BACKUPS old backup(s)"
fi

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5 || echo "No backups found"

echo ""
echo "🔓 To restore:"
echo "   createdb akount_restore"
echo "   gunzip -c $BACKUP_FILE.gz | psql akount_restore"

# Optional: Upload to cloud storage
# Uncomment and configure for cloud backups
# if command -v aws &> /dev/null; then
#   echo ""
#   echo "☁️  Uploading to cloud storage..."
#   aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/db-backups/
#   echo "✅ Uploaded to S3"
# fi
