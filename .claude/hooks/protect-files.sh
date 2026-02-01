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

# Check if file path matches any protected pattern
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "🚨 BLOCKED: Cannot edit protected file: $FILE_PATH" >&2
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
