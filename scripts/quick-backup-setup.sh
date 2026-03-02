#!/bin/bash

# Quick Backup Setup (Non-Interactive)
# For manual Git backup setup, run setup-git-backup.sh

set -e

echo "🔒 Quick Backup Setup"
echo "===================="
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

# 1. Check Git remotes
echo "📡 Current Git remotes:"
git remote -v
echo ""

# 2. Backup configuration files (if they exist)
BACKUP_DIR="$HOME/akount-backups/$(date +%Y-%m-%d)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "📦 Backing up configuration files..."

# Create backup of existing config files
FILES_TO_BACKUP=()
[ -f ".env" ] && FILES_TO_BACKUP+=(".env")
[ -f ".claude/settings.local.json" ] && FILES_TO_BACKUP+=(".claude/settings.local.json")
[ -f "package.json" ] && FILES_TO_BACKUP+=("package.json")

if [ ${#FILES_TO_BACKUP[@]} -gt 0 ]; then
  tar czf "$BACKUP_DIR/config-backup_$TIMESTAMP.tar.gz" "${FILES_TO_BACKUP[@]}"
  echo "✅ Backed up ${#FILES_TO_BACKUP[@]} config file(s)"
  echo "📁 Location: $BACKUP_DIR/config-backup_$TIMESTAMP.tar.gz"
else
  echo "⚠️  No config files found to backup"
fi

# 3. Create backup documentation
cat > "$BACKUP_DIR/README.txt" << EOF
Backup Created: $(date)
Project: akount

Files backed up:
$(for file in "${FILES_TO_BACKUP[@]}"; do echo "  - $file"; done)

To restore:
  cd /path/to/project
  tar xzf config-backup_$TIMESTAMP.tar.gz

Note: For production, use encrypted backups (backup-config.sh)
EOF

echo ""
echo "✅ Quick backup complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. For Git backup: Run ./scripts/setup-git-backup.sh (interactive)"
echo "  2. For encrypted backups: Run ./scripts/backup-config.sh"
echo "  3. For database backups: Set up DB first, then run backup-db-local.sh"
echo ""
echo "📚 See BACKUP-QUICKSTART.md for full guide"
