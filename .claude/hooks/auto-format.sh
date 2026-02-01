#!/bin/bash
# Auto-Format Hook for Claude Code
# Automatically formats files after Edit or Write operations
#
# This hook formats:
# - TypeScript/JavaScript files (.ts, .tsx, .js, .jsx) → Prettier
# - Prisma schema files (.prisma) → Prisma format
# - JSON files (.json) → Prettier
# - CSS files (.css) → Prettier
#
# Exit codes:
# 0 = Always return success (formatting is non-blocking)

# Read the tool input from stdin
INPUT=$(cat)

# Extract the file_path from the JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# If no file path found, skip formatting
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if file exists (might be deleted)
if [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Auto-format based on file extension
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx)
    echo "  → Auto-formatting TypeScript/JavaScript: $FILE_PATH" >&2
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;

  *.prisma)
    echo "  → Auto-formatting Prisma schema: $FILE_PATH" >&2
    npx prisma format --schema "$FILE_PATH" 2>/dev/null || true
    ;;

  *.json)
    echo "  → Auto-formatting JSON: $FILE_PATH" >&2
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;

  *.css|*.scss|*.less)
    echo "  → Auto-formatting CSS: $FILE_PATH" >&2
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;

  *.md)
    echo "  → Auto-formatting Markdown: $FILE_PATH" >&2
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;

  *.html|*.htm)
    echo "  → Auto-formatting HTML: $FILE_PATH" >&2
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;

  *)
    # Unknown file type, skip formatting
    exit 0
    ;;
esac

# Always return success (formatting errors should not block operations)
exit 0
