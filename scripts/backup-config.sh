#!/bin/bash

# Configuration Backup Script
# Backs up .env files and sensitive configuration (encrypted)

set -e  # Exit on error

BACKUP_DIR="$HOME/akount-backups/$(date +%Y-%m-%d)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$BACKUP_DIR"

echo "📦 Starting configuration backup..."
echo "Project: $PROJECT_ROOT"
echo "Backup location: $BACKUP_DIR"

# Backup .env files
echo "🔒 Backing up environment files..."
cd "$PROJECT_ROOT"
tar czf "$BACKUP_DIR/env-files_$TIMESTAMP.tar.gz" \
  .env \
  apps/web/.env.local \
  apps/api/.env \
  2>/dev/null || echo "⚠️  Some .env files not found (this is normal if not created yet)"

# Backup other config files
echo "📄 Backing up configuration files..."
tar czf "$BACKUP_DIR/config-files_$TIMESTAMP.tar.gz" \
  .claude/settings.local.json \
  package.json \
  turbo.json \
  tsconfig.json \
  2>/dev/null || true

# Encrypt with password
echo "🔐 Encrypting backups..."
read -sp "Enter backup encryption password: " BACKUP_PASSWORD
echo

# Encrypt env files
if [ -f "$BACKUP_DIR/env-files_$TIMESTAMP.tar.gz" ]; then
  openssl enc -aes-256-cbc -salt \
    -in "$BACKUP_DIR/env-files_$TIMESTAMP.tar.gz" \
    -out "$BACKUP_DIR/env-files_$TIMESTAMP.tar.gz.enc" \
    -k "$BACKUP_PASSWORD"
  rm "$BACKUP_DIR/env-files_$TIMESTAMP.tar.gz"
  echo "✅ Environment files encrypted"
fi

# Encrypt config files
if [ -f "$BACKUP_DIR/config-files_$TIMESTAMP.tar.gz" ]; then
  openssl enc -aes-256-cbc -salt \
    -in "$BACKUP_DIR/config-files_$TIMESTAMP.tar.gz" \
    -out "$BACKUP_DIR/config-files_$TIMESTAMP.tar.gz.enc" \
    -k "$BACKUP_PASSWORD"
  rm "$BACKUP_DIR/config-files_$TIMESTAMP.tar.gz"
  echo "✅ Configuration files encrypted"
fi

# Clean up old backups (keep 30 days)
echo "🧹 Cleaning up old backups (keeping last 30 days)..."
find "$HOME/akount-backups" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true

echo ""
echo "✅ Configuration backup completed!"
echo "📁 Location: $BACKUP_DIR"
echo "📅 Retention: 30 days"
echo ""
echo "🔓 To restore:"
echo "   openssl enc -aes-256-cbc -d -in env-files_$TIMESTAMP.tar.gz.enc -out env-files.tar.gz -k \"PASSWORD\""
echo "   tar xzf env-files.tar.gz"
