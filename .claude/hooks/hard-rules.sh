#!/bin/bash
# Hard Rules Enforcement Hook for Claude Code
# Enforces mandatory implementation standards as "block if" rules
#
# This hook blocks operations that violate critical Akount standards:
# 1. Float money values in code
# 2. Missing tenantId in Prisma queries
# 3. Files in wrong locations
# 4. Hard delete of financial records
# 5. Too many files modified without approved plan
#
# Exit codes:
# 0 = Rule compliant
# 2 = Rule violation (block operation)

# Get tool input from environment
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
FILE_PATH=""

# Extract file path from tool input (JSON format)
if command -v jq &> /dev/null && [ -n "$TOOL_INPUT" ]; then
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null)
fi

# If no file path from JSON, try positional argument
if [ -z "$FILE_PATH" ] && [ -n "$1" ]; then
    FILE_PATH="$1"
fi

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Get content being written (for Write tool)
NEW_CONTENT=""
if [ -n "$TOOL_INPUT" ] && command -v jq &> /dev/null; then
    NEW_CONTENT=$(echo "$TOOL_INPUT" | jq -r '.content // empty' 2>/dev/null)
fi

# Helper function to output block message
block_with_message() {
    echo "BLOCKED: $1"
    echo ""
    echo "Rule: $2"
    echo "See: $3"
    exit 2
}

# Helper function to output warning (non-blocking)
warn_with_message() {
    echo "WARNING: $1"
    echo "Consider: $2"
}

# =============================================================================
# RULE 1: Block float money values in TypeScript/JavaScript files
# =============================================================================
check_float_money() {
    local content="$1"
    local filepath="$2"

    # Only check TypeScript/JavaScript files
    if [[ ! "$filepath" =~ \.(ts|tsx|js|jsx)$ ]]; then
        return 0
    fi

    # Skip test files and mocks
    if [[ "$filepath" =~ (\.test\.|\.spec\.|__tests__|__mocks__|\.mock\.) ]]; then
        return 0
    fi

    # Pattern: amount/price/cost/total followed by : and a decimal number
    # This catches: amount: 10.50, price: 99.99, cost: 5.00
    if echo "$content" | grep -qE '(amount|price|cost|total|balance|fee|tax|subtotal|discount)\s*[=:]\s*[0-9]+\.[0-9]+[^%]'; then
        block_with_message \
            "Float value detected for monetary field" \
            "Money MUST be stored as integer cents (1050, not 10.50)" \
            "docs/standards/financial-data.md"
    fi

    return 0
}

# =============================================================================
# RULE 2: Warn on missing tenantId in Prisma queries
# =============================================================================
check_tenant_isolation() {
    local content="$1"
    local filepath="$2"

    # Only check TypeScript files in api/domains or services
    if [[ ! "$filepath" =~ (domains|services).*\.(ts|tsx)$ ]]; then
        return 0
    fi

    # Skip if file contains tenantId reference
    if echo "$content" | grep -q 'tenantId'; then
        return 0
    fi

    # Check for Prisma queries without tenantId
    if echo "$content" | grep -qE 'prisma\.[a-zA-Z]+\.(findMany|findFirst|findUnique|create|update|delete)'; then
        warn_with_message \
            "Prisma query detected without explicit tenantId" \
            "Ensure all queries filter by tenantId for multi-tenant isolation"
    fi

    return 0
}

# =============================================================================
# RULE 3: Block files in wrong locations
# =============================================================================
check_file_location() {
    local filepath="$1"

    # Get filename
    local filename=$(basename "$filepath")

    # Check brainstorm files
    if [[ "$filename" =~ brainstorm ]] && [[ ! "$filepath" =~ docs/brainstorms/ ]]; then
        block_with_message \
            "Brainstorm file in wrong location: $filepath" \
            "Brainstorm files must be in docs/brainstorms/" \
            "CLAUDE.md (File Creation Rules)"
    fi

    # Check plan files
    if [[ "$filename" =~ -plan\.md$ ]] && [[ ! "$filepath" =~ docs/plans/ ]] && [[ ! "$filepath" =~ \.claude/commands/ ]]; then
        block_with_message \
            "Plan file in wrong location: $filepath" \
            "Implementation plans must be in docs/plans/" \
            "CLAUDE.md (File Creation Rules)"
    fi

    # Check session files
    if [[ "$filename" =~ ^(WEEK_|CODE_REVIEW_|PERFORMANCE_|COMPOUND_) ]] && [[ ! "$filepath" =~ docs/archive/sessions/ ]]; then
        block_with_message \
            "Session artifact in wrong location: $filepath" \
            "Session files must be in docs/archive/sessions/" \
            "CLAUDE.md (File Creation Rules)"
    fi

    # Check for markdown files in root that shouldn't be there
    local allowed_root_md="README.md|CLAUDE.md|STATUS.md|ROADMAP.md|TASKS.md|CHANGELOG.md|CONTRIBUTING.md|LICENSE.md"
    if [[ "$filepath" =~ ^[^/]+\.md$ ]] && [[ ! "$filename" =~ ^($allowed_root_md)$ ]]; then
        # Allow config-related md files
        if [[ ! "$filename" =~ ^(turbo|vercel|railway|docker|pnpm) ]]; then
            warn_with_message \
                "Markdown file in project root: $filename" \
                "Consider moving to appropriate docs/ subdirectory"
        fi
    fi

    return 0
}

# =============================================================================
# RULE 4: Block hard delete in service files
# =============================================================================
check_hard_delete() {
    local content="$1"
    local filepath="$2"

    # Only check service files
    if [[ ! "$filepath" =~ (service|repository).*\.ts$ ]]; then
        return 0
    fi

    # Check for .delete() calls on financial models
    local financial_models="invoice|bill|payment|journalEntry|journalLine|transaction|bankTransaction"
    if echo "$content" | grep -qE "prisma\.($financial_models)\.delete\("; then
        block_with_message \
            "Hard delete detected on financial model" \
            "Financial records must use soft delete (set deletedAt)" \
            "docs/standards/financial-data.md"
    fi

    return 0
}

# =============================================================================
# RULE 5: Warn on unbalanced journal entry creation
# =============================================================================
check_journal_balance() {
    local content="$1"
    local filepath="$2"

    # Only check files that might create journal entries
    if [[ ! "$filepath" =~ (journal|accounting|posting).*\.ts$ ]]; then
        return 0
    fi

    # Check for journal entry creation without balance validation
    if echo "$content" | grep -q 'journalEntry.create' && ! echo "$content" | grep -qE '(validateBalance|debits.*===.*credits|SUM.*debit.*credit)'; then
        warn_with_message \
            "Journal entry creation without explicit balance validation" \
            "Ensure SUM(debits) === SUM(credits) before creating entries"
    fi

    return 0
}

# =============================================================================
# RULE 6: Block $queryRawUnsafe usage (Security P1-1)
# =============================================================================
check_query_raw_unsafe() {
    local content="$1"
    local filepath="$2"

    # Only check TypeScript files in api/src
    if [[ ! "$filepath" =~ apps/api/src.*\.ts$ ]]; then
        return 0
    fi

    # Skip test files
    if [[ "$filepath" =~ (\.test\.|\.spec\.|__tests__|__mocks__|\.mock\.) ]]; then
        return 0
    fi

    # Check for $queryRawUnsafe usage
    if echo "$content" | grep -q '\$queryRawUnsafe'; then
        block_with_message \
            "\$queryRawUnsafe is banned for security (SQL injection risk)" \
            "Use \$queryRaw with tagged template literals, or better: tenantScopedQuery()" \
            "apps/api/src/lib/tenant-scoped-query.ts"
    fi

    return 0
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Run all checks
if [ -n "$NEW_CONTENT" ]; then
    # For Write tool with content
    check_float_money "$NEW_CONTENT" "$FILE_PATH"
    check_tenant_isolation "$NEW_CONTENT" "$FILE_PATH"
    check_hard_delete "$NEW_CONTENT" "$FILE_PATH"
    check_journal_balance "$NEW_CONTENT" "$FILE_PATH"
    check_query_raw_unsafe "$NEW_CONTENT" "$FILE_PATH"
fi

# Always check file location
check_file_location "$FILE_PATH"

# All checks passed
exit 0
