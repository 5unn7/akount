#!/bin/bash
# Task Complete Sync Hook — TaskCompleted gate
# Fires when a task is marked as completed (TaskUpdate/TodoWrite)
#
# Strategy:
# - For tasks matching plan IDs (BE-X.Y, FE-X.Y, OB-Y): exit 2 to BLOCK
#   completion until status files are updated
# - For minor tasks: exit 0 with gentle reminder
#
# Exit codes:
# 0 = allow task completion
# 2 = block task completion (status files must be updated first)

# Read JSON input from stdin
INPUT=$(cat)

TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject // empty' 2>/dev/null)
TASK_DESC=$(echo "$INPUT" | jq -r '.task_description // empty' 2>/dev/null)

# Combine for matching
TASK_TEXT="$TASK_SUBJECT $TASK_DESC"

PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
STATE_FILE="$PROJECT_ROOT/.claude/plan-sync-state.json"

# --- Check if this looks like a significant plan task ---
IS_PLAN_TASK=false

# Match task ID patterns from TASKS.md (BE-X.Y, FE-X.Y, OB-Y)
if echo "$TASK_TEXT" | grep -qiE '(BE-[0-9]+\.[0-9]+|FE-[0-9]+\.[0-9]+|OB-[0-9]+)'; then
    IS_PLAN_TASK=true
fi

# Match phase/milestone keywords
if echo "$TASK_TEXT" | grep -qiE '(phase [0-9]|sprint [0-9]|milestone|complete.*phase|finish.*phase)'; then
    IS_PLAN_TASK=true
fi

# Match common significant task keywords
if echo "$TASK_TEXT" | grep -qiE '(implement|build|create.*api|create.*service|create.*page|wire.*frontend|add.*endpoint)'; then
    IS_PLAN_TASK=true
fi

# --- Check pending code edits ---
PENDING_EDITS=0
if [ -f "$STATE_FILE" ] && command -v jq &>/dev/null; then
    PENDING_EDITS=$(jq -r '.codeEditsSinceStatusUpdate // 0' "$STATE_FILE" 2>/dev/null)
fi

# --- Decision logic ---
if [ "$IS_PLAN_TASK" = true ] && [ "$PENDING_EDITS" -gt 3 ]; then
    # Block completion for significant tasks with pending edits
    echo "" >&2
    echo "PLAN ENFORCEMENT: Task appears to be a plan-level task." >&2
    echo "  Task: $TASK_SUBJECT" >&2
    echo "  Pending code edits: $PENDING_EDITS" >&2
    echo "" >&2
    echo "Before marking this task complete, update:" >&2
    echo "  1. TASKS.md — Check off the completed task(s), add commit hash" >&2
    echo "  2. STATUS.md — Update metrics and current phase status" >&2
    echo "  3. ROADMAP.md — Update progress percentage (if phase progress changed)" >&2
    echo "  4. docs/plans/*.md — Update the active plan's Progress section" >&2
    echo "" >&2
    echo "After updating status files, mark the task complete again." >&2
    exit 2
fi

# For non-plan tasks or tasks with few edits, allow with optional reminder
if [ "$PENDING_EDITS" -gt 5 ]; then
    echo "REMINDER: $PENDING_EDITS code edits since last status update. Consider updating TASKS.md, STATUS.md, and ROADMAP.md." >&2
fi

# --- Auto-regenerate TASKS.md index if TASKS.md was modified ---
if [ -n "$CLAUDE_PROJECT_DIR" ]; then
    TASKS_FILE="$CLAUDE_PROJECT_DIR/TASKS.md"

    # Check if TASKS.md changed in the last commit or is staged
    TASKS_CHANGED=false

    # Check if file is modified but not committed
    if git diff --name-only 2>/dev/null | grep -q "^TASKS.md$"; then
        TASKS_CHANGED=true
    fi

    # Check if file is staged
    if git diff --cached --name-only 2>/dev/null | grep -q "^TASKS.md$"; then
        TASKS_CHANGED=true
    fi

    # Regenerate index if TASKS.md changed
    if [ "$TASKS_CHANGED" = true ] && [ -f "$TASKS_FILE" ]; then
        echo "📊 TASKS.md modified — regenerating task index..." >&2

        # Run regeneration script
        if node "$CLAUDE_PROJECT_DIR/.claude/scripts/regenerate-task-index.js" 2>&1; then
            echo "✅ Task index updated successfully" >&2

            # Stage the updated TASKS.md if it was already staged
            if git diff --cached --name-only 2>/dev/null | grep -q "^TASKS.md$"; then
                git add "$TASKS_FILE" 2>/dev/null && echo "   Staged updated TASKS.md" >&2
            fi

            # Stage tasks.json if it was generated/updated
            TASKS_JSON="$CLAUDE_PROJECT_DIR/tasks.json"
            if [ -f "$TASKS_JSON" ] && git diff --name-only 2>/dev/null | grep -q "^tasks.json$"; then
                git add "$TASKS_JSON" 2>/dev/null && echo "   Staged updated tasks.json" >&2
            fi
        else
            echo "⚠️ Index regeneration failed (non-blocking)" >&2
        fi
    fi
fi

exit 0
