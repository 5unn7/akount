#!/bin/bash
#
# PostToolUse Hook: Per-edit TypeScript type checking
# Runs tsc --noEmit scoped to the edited package after .ts/.tsx edits
#
# Non-blocking (exit 0 always) — shows errors as warnings
# Package-scoped for speed (~3-5s vs ~15-30s full monorepo)
#

# Read the tool input from stdin
INPUT=$(cat)

# Extract file path from JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check .ts and .tsx files
case "$FILE_PATH" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac

# Skip test files — they often have intentional type looseness
case "$FILE_PATH" in
  *__tests__*|*.test.ts|*.test.tsx|*.spec.ts|*.spec.tsx) exit 0 ;;
esac

# Determine project root
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$HOOK_DIR/../.." && pwd)"

# Determine which package was edited
PACKAGE_DIR=""
case "$FILE_PATH" in
  *apps/api/*|*apps\\api\\*)
    PACKAGE_DIR="$PROJECT_DIR/apps/api" ;;
  *apps/web/*|*apps\\web\\*)
    PACKAGE_DIR="$PROJECT_DIR/apps/web" ;;
  *packages/db/*|*packages\\db\\*)
    PACKAGE_DIR="$PROJECT_DIR/packages/db" ;;
  *packages/types/*|*packages\\types\\*)
    PACKAGE_DIR="$PROJECT_DIR/packages/types" ;;
  *packages/ui/*|*packages\\ui\\*)
    PACKAGE_DIR="$PROJECT_DIR/packages/ui" ;;
  *packages/design-tokens/*|*packages\\design-tokens\\*)
    PACKAGE_DIR="$PROJECT_DIR/packages/design-tokens" ;;
  *)
    # Unknown package, skip
    exit 0 ;;
esac

# Skip if no tsconfig in the package
if [ ! -f "$PACKAGE_DIR/tsconfig.json" ]; then
  exit 0
fi

# Run tsc scoped to the package (non-blocking, show first 15 lines)
echo "  -> Type-checking $(basename "$PACKAGE_DIR")..." >&2
TSC_OUTPUT=$(cd "$PACKAGE_DIR" && npx tsc --noEmit --pretty 2>&1 | head -15) || true

if [ -n "$TSC_OUTPUT" ]; then
  echo "  TS  Type errors in $(basename "$PACKAGE_DIR"):" >&2
  echo "$TSC_OUTPUT" | sed 's/^/  | /' >&2
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || true)
  if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "  -> $ERROR_COUNT type error(s) found. Fix before committing." >&2
  fi
fi

# Always non-blocking
exit 0
