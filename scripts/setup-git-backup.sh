#!/bin/bash

# Git Backup Setup Script
# Sets up dual remote repositories for redundancy

set -e  # Exit on error

echo "🔄 Git Backup Remote Setup"
echo "=========================="
echo ""
echo "This script will set up a backup Git remote to prevent data loss."
echo "You'll need a GitLab/Bitbucket account (or another Git provider)."
echo ""

# Check if git remote 'backup' already exists
if git remote | grep -q "^backup$"; then
  echo "⚠️  Backup remote already exists:"
  git remote get-url backup
  echo ""
  read -p "Do you want to replace it? (y/n): " REPLACE
  if [ "$REPLACE" != "y" ]; then
    echo "Aborted."
    exit 0
  fi
  git remote remove backup
fi

# Get backup repository URL
echo "Choose a backup Git provider:"
echo "  1. GitLab (https://gitlab.com)"
echo "  2. Bitbucket (https://bitbucket.org)"
echo "  3. Azure DevOps (https://dev.azure.com)"
echo "  4. Custom URL"
echo ""
read -p "Enter choice (1-4): " CHOICE

case $CHOICE in
  1)
    read -p "Enter your GitLab username: " USERNAME
    read -p "Enter repository name (default: akount-backup): " REPO_NAME
    REPO_NAME=${REPO_NAME:-akount-backup}
    BACKUP_URL="git@gitlab.com:$USERNAME/$REPO_NAME.git"
    echo ""
    echo "⚠️  Make sure you've created the repository at:"
    echo "   https://gitlab.com/$USERNAME/$REPO_NAME"
    ;;
  2)
    read -p "Enter your Bitbucket username: " USERNAME
    read -p "Enter repository name (default: akount-backup): " REPO_NAME
    REPO_NAME=${REPO_NAME:-akount-backup}
    BACKUP_URL="git@bitbucket.org:$USERNAME/$REPO_NAME.git"
    echo ""
    echo "⚠️  Make sure you've created the repository at:"
    echo "   https://bitbucket.org/$USERNAME/$REPO_NAME"
    ;;
  3)
    read -p "Enter your organization: " ORG
    read -p "Enter project name: " PROJECT
    read -p "Enter repository name (default: akount-backup): " REPO_NAME
    REPO_NAME=${REPO_NAME:-akount-backup}
    BACKUP_URL="git@ssh.dev.azure.com:v3/$ORG/$PROJECT/$REPO_NAME"
    ;;
  4)
    read -p "Enter custom Git URL: " BACKUP_URL
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

# Add backup remote
echo ""
echo "📡 Adding backup remote..."
git remote add backup "$BACKUP_URL"
echo "✅ Backup remote added"

# Push to backup
echo ""
echo "📤 Pushing to backup remote..."
git push backup main

echo ""
echo "✅ Backup remote configured successfully!"
echo ""
echo "📋 Your remotes:"
git remote -v
echo ""
echo "💡 To push to both remotes at once:"
echo "   git push origin main && git push backup main"
echo ""
echo "   Or create an alias:"
echo "   git config alias.pushall '!git push origin --all && git push backup --all'"
echo "   git pushall"
echo ""
echo "🔒 Recommendation: Keep the backup repository PRIVATE"
