#!/bin/bash
# Merges a worktree branch back to main and cleans up
# Usage: ./worktree-cleanup.sh <agent-name> <task-id> [--keep-branch]
# Example: ./worktree-cleanup.sh banking-agent DEV-15

set -e  # Exit on error

# Validate arguments
if [ $# -lt 2 ]; then
  echo "❌ Usage: ./worktree-cleanup.sh <agent-name> <task-id> [--keep-branch]"
  echo "   Example: ./worktree-cleanup.sh banking-agent DEV-15"
  echo "   Options:"
  echo "     --keep-branch    Keep the branch after merging (don't delete)"
  exit 1
fi

AGENT_NAME=$1
TASK_ID=$2
KEEP_BRANCH=false

# Check for --keep-branch flag
if [ $# -eq 3 ] && [ "$3" == "--keep-branch" ]; then
  KEEP_BRANCH=true
fi

# Sanitize inputs
AGENT_NAME_SAFE=$(echo "$AGENT_NAME" | tr -cd '[:alnum:]-')
TASK_ID_SAFE=$(echo "$TASK_ID" | tr -cd '[:alnum:]-')

BRANCH_NAME="${AGENT_NAME_SAFE}/${TASK_ID_SAFE}"
WORKTREE_DIR=".worktrees/${AGENT_NAME_SAFE}-${TASK_ID_SAFE}"

# Check if worktree exists
if [ ! -d "$WORKTREE_DIR" ]; then
  echo "❌ Worktree not found at $WORKTREE_DIR"
  echo "   Create with: ./worktree-create.sh $AGENT_NAME $TASK_ID"
  exit 1
fi

echo "🔄 Cleaning up worktree for $AGENT_NAME / $TASK_ID..."
echo "   Branch: $BRANCH_NAME"
echo "   Worktree: $WORKTREE_DIR"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Switch to main if we're in the worktree branch
if [ "$CURRENT_BRANCH" == "$BRANCH_NAME" ]; then
  echo "⚠️  You're currently on the worktree branch. Switching to main..."
  git checkout main
fi

# Check if branch has commits
COMMITS=$(git rev-list main.."$BRANCH_NAME" --count 2>/dev/null || echo "0")

if [ "$COMMITS" == "0" ]; then
  echo "⚠️  No commits found in $BRANCH_NAME. Skipping merge."
else
  echo "📥 Merging $COMMITS commit(s) from $BRANCH_NAME to main..."

  # Check for merge conflicts
  if git merge --no-ff "$BRANCH_NAME" -m "Merge $BRANCH_NAME: $TASK_ID complete" --no-edit; then
    echo "✅ Merge successful!"
  else
    echo "❌ Merge conflict detected!"
    echo "   Please resolve conflicts manually and run:"
    echo "   git merge --continue"
    echo ""
    echo "   Then cleanup with:"
    echo "   git worktree remove $WORKTREE_DIR"
    if [ "$KEEP_BRANCH" == "false" ]; then
      echo "   git branch -d $BRANCH_NAME"
    fi
    exit 1
  fi
fi

# Remove worktree
echo "🗑️  Removing worktree..."
git worktree remove "$WORKTREE_DIR"

# Delete branch unless --keep-branch flag
if [ "$KEEP_BRANCH" == "false" ]; then
  echo "🗑️  Deleting branch $BRANCH_NAME..."
  git branch -d "$BRANCH_NAME"
else
  echo "📌 Keeping branch $BRANCH_NAME (--keep-branch flag)"
fi

echo "✅ Cleanup complete!"
echo ""
if [ "$COMMITS" != "0" ]; then
  echo "📊 Summary:"
  echo "   - Merged $COMMITS commit(s) to main"
  echo "   - Removed worktree at $WORKTREE_DIR"
  if [ "$KEEP_BRANCH" == "false" ]; then
    echo "   - Deleted branch $BRANCH_NAME"
  fi
fi
