#!/bin/bash
# Lists all active worktrees and their status
# Usage: ./worktree-status.sh

echo "📋 Active Worktrees"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get list of worktrees
WORKTREES=$(git worktree list --porcelain)

if [ -z "$WORKTREES" ]; then
  echo "No worktrees found (only main repository)."
  exit 0
fi

# Parse worktree list
WORKTREE_COUNT=0
MAIN_WORKTREE=true

while IFS= read -r line; do
  if [[ $line == worktree* ]]; then
    # Extract path
    WORKTREE_PATH=$(echo "$line" | cut -d' ' -f2-)

    # Skip main worktree
    if [ "$MAIN_WORKTREE" == "true" ]; then
      MAIN_WORKTREE=false
      continue
    fi

    ((WORKTREE_COUNT++))
  elif [[ $line == branch* ]]; then
    # Extract branch name
    BRANCH=$(echo "$line" | cut -d' ' -f2- | sed 's|refs/heads/||')

    # Parse agent name and task ID from branch (format: agent-name/TASK-ID)
    if [[ $BRANCH == *"/"* ]]; then
      AGENT_NAME=$(echo "$BRANCH" | cut -d'/' -f1)
      TASK_ID=$(echo "$BRANCH" | cut -d'/' -f2)
    else
      AGENT_NAME="unknown"
      TASK_ID=$BRANCH
    fi

    # Get commit count
    COMMITS=$(git rev-list main.."$BRANCH" --count 2>/dev/null || echo "0")

    # Get last commit message
    LAST_COMMIT=$(git log -1 --pretty=format:"%s" "$BRANCH" 2>/dev/null || echo "No commits")

    # Display worktree info
    echo "🔹 Worktree #$WORKTREE_COUNT"
    echo "   Agent: $AGENT_NAME"
    echo "   Task: $TASK_ID"
    echo "   Branch: $BRANCH"
    echo "   Path: $WORKTREE_PATH"
    echo "   Commits: $COMMITS"
    echo "   Last commit: $LAST_COMMIT"
    echo ""
  fi
done <<< "$WORKTREES"

# Summary
if [ $WORKTREE_COUNT -eq 0 ]; then
  echo "No active agent worktrees."
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Total active worktrees: $WORKTREE_COUNT"
  echo ""
  echo "Cleanup a worktree:"
  echo "  ./worktree-cleanup.sh <agent-name> <task-id>"
fi
