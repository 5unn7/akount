#!/bin/bash
# Creates a Git worktree for isolated agent execution
# Usage: ./worktree-create.sh <agent-name> <task-id>
# Example: ./worktree-create.sh banking-agent DEV-15

set -e  # Exit on error

# Validate arguments
if [ $# -ne 2 ]; then
  echo "❌ Usage: ./worktree-create.sh <agent-name> <task-id>"
  echo "   Example: ./worktree-create.sh banking-agent DEV-15"
  exit 1
fi

AGENT_NAME=$1
TASK_ID=$2

# Sanitize inputs (remove special chars for safety)
AGENT_NAME_SAFE=$(echo "$AGENT_NAME" | tr -cd '[:alnum:]-')
TASK_ID_SAFE=$(echo "$TASK_ID" | tr -cd '[:alnum:]-')

# Create branch name: agent-name/task-id (e.g., banking-agent/DEV-15)
BRANCH_NAME="${AGENT_NAME_SAFE}/${TASK_ID_SAFE}"

# Worktree directory: .worktrees/agent-name-task-id/
WORKTREE_DIR=".worktrees/${AGENT_NAME_SAFE}-${TASK_ID_SAFE}"

# Check if worktree already exists
if [ -d "$WORKTREE_DIR" ]; then
  echo "⚠️  Worktree already exists at $WORKTREE_DIR"
  echo "   Remove with: ./worktree-cleanup.sh $AGENT_NAME $TASK_ID"
  exit 1
fi

# Get current branch as base
BASE_BRANCH=$(git branch --show-current)

echo "📂 Creating worktree for $AGENT_NAME on task $TASK_ID..."
echo "   Base branch: $BASE_BRANCH"
echo "   New branch: $BRANCH_NAME"
echo "   Worktree path: $WORKTREE_DIR"

# Create worktree with new branch
git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$BASE_BRANCH"

# Verify worktree created
if [ -d "$WORKTREE_DIR" ]; then
  echo "✅ Worktree created successfully!"
  echo ""
  echo "Next steps for agent:"
  echo "  1. cd $WORKTREE_DIR"
  echo "  2. Make changes (agent executes task)"
  echo "  3. Commit changes: git add . && git commit -m 'feat: <task>'"
  echo "  4. Return to main: cd ../.."
  echo "  5. Merge & cleanup: ./worktree-cleanup.sh $AGENT_NAME $TASK_ID"
  echo ""
  echo "📍 Worktree path: $(realpath "$WORKTREE_DIR")"
else
  echo "❌ Failed to create worktree"
  exit 1
fi
