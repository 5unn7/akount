#!/bin/bash
# Validation hook: Check REGISTRY.json sync with actual files
# Purpose: Ensure configuration files are in sync and no orphaned files exist
# Usage: bash .claude/hooks/validate-config.sh

set -e

REGISTRY=".claude/agents/REGISTRY.json"
ERRORS=0
WARNINGS=0

echo "🔍 Validating .claude/ configuration..."
echo ""

# Check REGISTRY.json exists
if [ ! -f "$REGISTRY" ]; then
    echo "❌ ERROR: REGISTRY.json not found at $REGISTRY"
    exit 1
fi

# Validate JSON syntax
if ! command -v jq &> /dev/null; then
    echo "⚠️  WARNING: jq not found, skipping JSON validation"
    echo "   Install jq for better validation: https://stedolan.github.io/jq/"
    WARNINGS=$((WARNINGS + 1))
else
    if ! jq empty "$REGISTRY" 2>/dev/null; then
        echo "❌ ERROR: REGISTRY.json is not valid JSON"
        exit 1
    fi
    echo "✓ REGISTRY.json is valid JSON"
fi

# Check agents in registry exist as files
echo ""
echo "Checking agents..."

if command -v jq &> /dev/null; then
    # Use jq to iterate and output agent|file pairs (using pipe as delimiter)
    AGENT_FILES=$(jq -r '.agents | to_entries[] | "\(.key)|\(.value.file)"' "$REGISTRY" 2>/dev/null || echo "")

    if [ -z "$AGENT_FILES" ]; then
        echo "⚠️  WARNING: No agents found in registry or jq failed"
        WARNINGS=$((WARNINGS + 1))
    else
        while IFS='|' read -r agent file; do
            # Skip empty lines
            [ -z "$agent" ] && continue

            # Strip carriage returns (Windows compatibility)
            agent=$(echo "$agent" | tr -d '\r')
            file=$(echo "$file" | tr -d '\r')

            # SECURITY: Validate file path to prevent command injection
            # Reject paths with special characters, path traversal, or absolute paths
            if [[ "$file" =~ [^a-zA-Z0-9/_.-] ]] || [[ "$file" == *".."* ]] || [[ "$file" == /* ]]; then
                echo "  ❌ ERROR: Invalid or suspicious file path for agent '$agent': $file"
                ERRORS=$((ERRORS + 1))
                continue
            fi

            FULL_PATH=".claude/agents/$file"

            # Verify path is within expected directory using realpath
            if command -v realpath &> /dev/null; then
                REAL_PATH=$(realpath -m "$FULL_PATH" 2>/dev/null || echo "")
                ALLOWED_DIR=$(realpath -m ".claude/agents" 2>/dev/null || echo "")

                if [ -n "$REAL_PATH" ] && [ -n "$ALLOWED_DIR" ]; then
                    if [[ "$REAL_PATH" != "$ALLOWED_DIR"* ]]; then
                        echo "  ❌ ERROR: Path traversal detected for agent '$agent': $file"
                        ERRORS=$((ERRORS + 1))
                        continue
                    fi
                fi
            fi

            if [ ! -f "$FULL_PATH" ]; then
                echo "  ❌ ERROR: Agent '$agent' references missing file: $file"
                ERRORS=$((ERRORS + 1))
            else
                echo "  ✓ $agent"
            fi
        done <<< "$AGENT_FILES"
    fi
else
    echo "  ⚠️  Skipping agent validation (jq not available)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check skills in registry exist as files
echo ""
echo "Checking skills..."

if command -v jq &> /dev/null; then
    # Use jq to iterate and output skill|file pairs (using pipe as delimiter)
    SKILL_FILES=$(jq -r '.skills | to_entries[] | "\(.key)|\(.value.file)"' "$REGISTRY" 2>/dev/null || echo "")

    if [ -z "$SKILL_FILES" ]; then
        echo "⚠️  WARNING: No skills found in registry or jq failed"
        WARNINGS=$((WARNINGS + 1))
    else
        while IFS='|' read -r skill file; do
            # Skip empty lines
            [ -z "$skill" ] && continue

            # Strip carriage returns (Windows compatibility)
            skill=$(echo "$skill" | tr -d '\r')
            file=$(echo "$file" | tr -d '\r')

            # SECURITY: Validate file path to prevent command injection
            # Reject paths with special characters, path traversal, or absolute paths
            if [[ "$file" =~ [^a-zA-Z0-9/_.:\ -] ]] || [[ "$file" == *".."* ]] || [[ "$file" == /* ]]; then
                echo "  ❌ ERROR: Invalid or suspicious file path for skill '$skill': $file"
                ERRORS=$((ERRORS + 1))
                continue
            fi

            FULL_PATH=".claude/$file"

            # Verify path is within expected directory using realpath
            if command -v realpath &> /dev/null; then
                REAL_PATH=$(realpath -m "$FULL_PATH" 2>/dev/null || echo "")
                ALLOWED_DIR=$(realpath -m ".claude" 2>/dev/null || echo "")

                if [ -n "$REAL_PATH" ] && [ -n "$ALLOWED_DIR" ]; then
                    if [[ "$REAL_PATH" != "$ALLOWED_DIR"* ]]; then
                        echo "  ❌ ERROR: Path traversal detected for skill '$skill': $file"
                        ERRORS=$((ERRORS + 1))
                        continue
                    fi
                fi
            fi

            if [ ! -f "$FULL_PATH" ]; then
                echo "  ❌ ERROR: Skill '$skill' references missing file: $file"
                ERRORS=$((ERRORS + 1))
            else
                echo "  ✓ $skill"
            fi
        done <<< "$SKILL_FILES"
    fi
else
    echo "  ⚠️  Skipping skill validation (jq not available)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for orphaned agent files (files not in registry)
echo ""
echo "Checking for orphaned agent files..."

ORPHANED=0
if [ -d ".claude/agents/review" ]; then
    for file in .claude/agents/review/*.md; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .md)

            # Skip README files
            if [ "$basename" = "README" ]; then
                continue
            fi

            if command -v jq &> /dev/null; then
                if ! jq -e ".agents | to_entries[] | select(.value.file | endswith(\"$basename.md\"))" "$REGISTRY" > /dev/null 2>&1; then
                    echo "  ⚠️  WARNING: Agent file not in registry: $file"
                    ORPHANED=$((ORPHANED + 1))
                fi
            fi
        fi
    done
fi

if [ -d ".claude/agents/research" ]; then
    for file in .claude/agents/research/*.md; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .md)

            # Skip README files
            if [ "$basename" = "README" ]; then
                continue
            fi

            if command -v jq &> /dev/null; then
                if ! jq -e ".agents | to_entries[] | select(.value.file | endswith(\"$basename.md\"))" "$REGISTRY" > /dev/null 2>&1; then
                    echo "  ⚠️  WARNING: Agent file not in registry: $file"
                    ORPHANED=$((ORPHANED + 1))
                fi
            fi
        fi
    done
fi

if [ $ORPHANED -eq 0 ]; then
    echo "  ✓ No orphaned agent files found"
else
    WARNINGS=$((WARNINGS + ORPHANED))
fi

# Check for orphaned skill files
echo ""
echo "Checking for orphaned skill files..."

ORPHANED_SKILLS=0
if [ -d ".claude/commands" ]; then
    for file in .claude/commands/**/*.md .claude/commands/*.md; do
        if [ -f "$file" ]; then
            basename=$(basename "$file" .md)

            # Skip README files
            if [ "$basename" = "README" ]; then
                continue
            fi

            if command -v jq &> /dev/null; then
                # Get relative path from .claude/
                relative_path="${file#.claude/}"

                if ! jq -e ".skills | to_entries[] | select(.value.file == \"$relative_path\")" "$REGISTRY" > /dev/null 2>&1; then
                    echo "  ⚠️  WARNING: Skill file not in registry: $file"
                    ORPHANED_SKILLS=$((ORPHANED_SKILLS + 1))
                fi
            fi
        fi
    done
fi

if [ $ORPHANED_SKILLS -eq 0 ]; then
    echo "  ✓ No orphaned skill files found"
else
    WARNINGS=$((WARNINGS + ORPHANED_SKILLS))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -gt 0 ]; then
    echo "❌ Validation FAILED with $ERRORS error(s) and $WARNINGS warning(s)"
    echo ""
    echo "Errors must be fixed before proceeding."
    echo "Warnings are informational and don't block validation."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Validation PASSED with $WARNINGS warning(s)"
    echo ""
    echo "Warnings are informational and don't block validation."
    echo "Consider addressing warnings for better consistency."
    exit 0
else
    echo "✅ Configuration valid - No errors or warnings"
    exit 0
fi
