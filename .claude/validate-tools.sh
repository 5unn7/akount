#!/bin/bash

# Validation script for Claude Code agents and commands
# Tests file structure, YAML frontmatter, and basic formatting

echo "======================================"
echo "Claude Code Tools Validation Script"
echo "======================================"
echo ""

ERRORS=0
WARNINGS=0

# Function to check YAML frontmatter
check_yaml_frontmatter() {
    local file=$1
    local expected_name=$2

    if ! head -1 "$file" | grep -q "^---$"; then
        echo "❌ ERROR: $file - Missing YAML frontmatter start"
        ((ERRORS++))
        return 1
    fi

    if ! head -10 "$file" | grep -q "^name:"; then
        echo "❌ ERROR: $file - Missing 'name' field"
        ((ERRORS++))
        return 1
    fi

    if ! head -10 "$file" | grep -q "^description:"; then
        echo "❌ ERROR: $file - Missing 'description' field"
        ((ERRORS++))
        return 1
    fi

    # Extract name from file
    local file_name=$(head -10 "$file" | grep "^name:" | sed 's/name: //' | tr -d '"')

    if [[ "$file_name" != "$expected_name" ]]; then
        echo "⚠️  WARNING: $file - Name mismatch (expected: $expected_name, got: $file_name)"
        ((WARNINGS++))
    fi

    echo "✅ $file - Valid YAML frontmatter"
    return 0
}

# Check agents
echo "Checking Review Agents..."
echo "-------------------------"

for agent in architecture-strategist code-simplicity-reviewer financial-data-validator \
             kieran-typescript-reviewer nextjs-app-router-reviewer performance-oracle \
             prisma-migration-reviewer security-sentinel; do

    file=".claude/agents/review/${agent}.md"

    if [[ ! -f "$file" ]]; then
        echo "❌ ERROR: Missing agent file: $file"
        ((ERRORS++))
        continue
    fi

    check_yaml_frontmatter "$file" "$agent"
done

echo ""
echo "Checking Workflow Commands..."
echo "-----------------------------"

# Check workflow commands
for command in brainstorm plan review work; do
    file=".claude/commands/workflows/${command}.md"
    expected_name="workflows:${command}"

    if [[ ! -f "$file" ]]; then
        echo "❌ ERROR: Missing command file: $file"
        ((ERRORS++))
        continue
    fi

    check_yaml_frontmatter "$file" "$expected_name"
done

echo ""
echo "Checking Configuration Files..."
echo "-------------------------------"

# Check MCP configuration
if [[ -f ".mcp.json" ]]; then
    if jq empty .mcp.json 2>/dev/null; then
        echo "✅ .mcp.json - Valid JSON"
    else
        echo "❌ ERROR: .mcp.json - Invalid JSON"
        ((ERRORS++))
    fi
else
    echo "❌ ERROR: Missing .mcp.json file"
    ((ERRORS++))
fi

# Check settings
if [[ -f ".claude/settings.local.json" ]]; then
    if jq empty .claude/settings.local.json 2>/dev/null; then
        echo "✅ .claude/settings.local.json - Valid JSON"

        # Check if MCP servers are enabled
        if jq -e '.enableAllProjectMcpServers == true' .claude/settings.local.json >/dev/null; then
            echo "✅ MCP servers enabled in settings"
        else
            echo "⚠️  WARNING: MCP servers not enabled in settings"
            ((WARNINGS++))
        fi
    else
        echo "❌ ERROR: .claude/settings.local.json - Invalid JSON"
        ((ERRORS++))
    fi
else
    echo "❌ ERROR: Missing .claude/settings.local.json file"
    ((ERRORS++))
fi

echo ""
echo "Checking Documentation..."
echo "-------------------------"

docs=(
    ".claude/agents/review/README.md"
    ".claude/agents/review/TESTING.md"
    ".claude/commands/workflows/README.md"
)

for doc in "${docs[@]}"; do
    if [[ -f "$doc" ]]; then
        echo "✅ $doc - Exists"
    else
        echo "⚠️  WARNING: Missing documentation: $doc"
        ((WARNINGS++))
    fi
done

echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [[ $ERRORS -eq 0 ]]; then
    echo "✅ All critical checks passed!"
    if [[ $WARNINGS -eq 0 ]]; then
        echo "✅ No warnings!"
    else
        echo "⚠️  Some warnings found (non-critical)"
    fi
    exit 0
else
    echo "❌ Validation failed with $ERRORS error(s)"
    exit 1
fi
