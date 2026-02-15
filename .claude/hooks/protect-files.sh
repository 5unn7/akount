#!/bin/bash
# File Protection Hook for Claude Code
# Prevents editing of sensitive files to protect security and data integrity
#
# This hook blocks Edit and Write operations on:
# - Environment files (.env, .env.*)
# - Secrets and credentials
# - Critical configuration files (schema.prisma, .mcp.json, settings.local.json)
# - Package lock files
# - Git directory

# Read the tool input from stdin
INPUT=$(cat)

# Extract the file_path from the JSON input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# If no file path found, allow the operation
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# SECURITY: Validate and normalize file path to prevent path traversal attacks
# Reject paths with suspicious characters
if [[ "$FILE_PATH" =~ [\;\`\$\(\)] ]]; then
    echo "🚨 BLOCKED: Suspicious characters in file path: $FILE_PATH" >&2
    exit 2
fi

# Normalize path to prevent traversal attacks (../../etc/passwd)
if command -v realpath &> /dev/null; then
    NORMALIZED_PATH=$(realpath -m "$FILE_PATH" 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "🚨 BLOCKED: Invalid file path: $FILE_PATH" >&2
        exit 2
    fi

    # Verify path is within project directory
    PROJECT_ROOT=$(realpath -m "." 2>/dev/null)
    if [ -n "$PROJECT_ROOT" ] && [ -n "$NORMALIZED_PATH" ]; then
        if [[ "$NORMALIZED_PATH" != "$PROJECT_ROOT"* ]]; then
            echo "🚨 BLOCKED: File outside project directory: $FILE_PATH" >&2
            echo "   Normalized path: $NORMALIZED_PATH" >&2
            exit 2
        fi
    fi

    # Use normalized path for pattern matching (relative to project root)
    RELATIVE_PATH="${NORMALIZED_PATH#$PROJECT_ROOT/}"
else
    # If realpath not available, use FILE_PATH but warn
    RELATIVE_PATH="$FILE_PATH"
fi

# Protected file patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.development"
  ".env.production"
  ".env.test"
  "secrets/"
  "credentials.json"
  "package-lock.json"
  "pnpm-lock.yaml"
  "yarn.lock"
  ".git/"
  "schema.prisma"
  ".mcp.json"
  "settings.local.json"
  ".npmrc"
  ".yarnrc"
  "private-key"
  "id_rsa"
  ".pem"
  ".key"
)

# Check if file path matches any protected pattern (using normalized path)
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$RELATIVE_PATH" == *"$pattern"* ]]; then
    echo "🚨 BLOCKED: Cannot edit protected file: $FILE_PATH" >&2
    echo "   Normalized path: $RELATIVE_PATH" >&2
    echo "   Protected pattern: '$pattern'" >&2
    echo "   Reason: This file contains sensitive data or critical configuration" >&2
    echo "" >&2
    echo "   If you need to modify this file:" >&2
    echo "   - Edit it manually outside of Claude Code" >&2
    echo "   - Or temporarily disable this hook in settings.local.json" >&2
    exit 2
  fi
done

# Allow the operation
exit 0
