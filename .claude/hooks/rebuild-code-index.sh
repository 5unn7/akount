#!/bin/bash

# Post-commit hook: Rebuild code indexes for changed domains
# Triggered automatically after commits touching .ts/.tsx files

# Get changed files from last commit
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep '\.tsx\?$' || true)

if [ -z "$CHANGED_FILES" ]; then
  # No TypeScript files changed, skip
  exit 0
fi

# Determine affected domains
DOMAINS=""

for file in $CHANGED_FILES; do
  case "$file" in
    *"/banking/"*) DOMAINS="$DOMAINS banking" ;;
    *"/invoicing/"*) DOMAINS="$DOMAINS invoicing" ;;
    *"/accounting/"*) DOMAINS="$DOMAINS accounting" ;;
    *"/planning/"*) DOMAINS="$DOMAINS planning" ;;
    *"/ai/"*) DOMAINS="$DOMAINS ai" ;;
    *"/app/(dashboard)/"*) DOMAINS="$DOMAINS web-pages" ;;
    *"/components/"* | *"/lib/"*) DOMAINS="$DOMAINS web-components" ;;
    *"packages/"*) DOMAINS="$DOMAINS packages" ;;
  esac
done

# Remove duplicates
DOMAINS=$(echo "$DOMAINS" | tr ' ' '\n' | sort -u | tr '\n' ' ' | xargs)

if [ -z "$DOMAINS" ]; then
  # No recognized domains, skip
  exit 0
fi

echo "🔄 Rebuilding code indexes for domains: $DOMAINS"

# Rebuild affected domains
node .claude/scripts/regenerate-code-index.js --domains "$DOMAINS"

if [ $? -eq 0 ]; then
  echo "✅ Code index rebuild complete"
else
  echo "❌ Code index rebuild failed"
  echo "   Run manually: node .claude/scripts/regenerate-code-index.js --force"
fi

exit 0
