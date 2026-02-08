#!/bin/bash
# Context Validation Hook for Claude Code
# PreToolUse hook for Edit/Write operations
#
# Validates:
# 1. File locations match project conventions
# 2. Financial code patterns are correct
# 3. Schema compliance for data files
#
# Exit codes:
# 0 = Valid
# 2 = Validation failure (block operation)

# Get tool input from environment
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"
FILE_PATH=""
NEW_CONTENT=""

# Extract from JSON input
if command -v jq &> /dev/null && [ -n "$TOOL_INPUT" ]; then
    FILE_PATH=$(echo "$TOOL_INPUT" | jq -r '.file_path // empty' 2>/dev/null)
    NEW_CONTENT=$(echo "$TOOL_INPUT" | jq -r '.content // empty' 2>/dev/null)
    OLD_STRING=$(echo "$TOOL_INPUT" | jq -r '.old_string // empty' 2>/dev/null)
    NEW_STRING=$(echo "$TOOL_INPUT" | jq -r '.new_string // empty' 2>/dev/null)
fi

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Get project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Helper functions
block() {
    echo "BLOCKED: $1"
    echo ""
    echo "Reason: $2"
    [ -n "$3" ] && echo "See: $3"
    exit 2
}

warn() {
    echo "WARNING: $1"
}

# =============================================================================
# VALIDATION 1: File Convention Compliance
# =============================================================================
validate_file_conventions() {
    local filepath="$1"
    local filename=$(basename "$filepath")
    local dirname=$(dirname "$filepath")

    # Design system files must be in design-system folder
    if [[ "$filename" =~ ^(tokens|colors|typography|spacing|components)\. ]] && [[ ! "$filepath" =~ (design-system|design-tokens) ]]; then
        warn "Design-related file may belong in docs/design-system/ or packages/design-tokens/"
    fi

    # Schema files must be in prisma folder
    if [[ "$filename" == "schema.prisma" ]] && [[ ! "$filepath" =~ packages/database/prisma/ ]]; then
        block \
            "Prisma schema file in wrong location" \
            "schema.prisma must be in packages/database/prisma/" \
            "docs/repo-map.md"
    fi

    # Migration files must be in migrations folder
    if [[ "$filepath" =~ \.sql$ ]] && [[ "$dirname" =~ migration ]] && [[ ! "$filepath" =~ packages/database/prisma/migrations/ ]]; then
        block \
            "Migration file in wrong location" \
            "Migrations must be in packages/database/prisma/migrations/" \
            "docs/repo-map.md"
    fi

    # API routes must be in domains folder
    if [[ "$filename" =~ routes?\.(ts|js)$ ]] && [[ "$filepath" =~ apps/api/ ]] && [[ ! "$filepath" =~ apps/api/src/domains/ ]]; then
        warn "API route file may belong in apps/api/src/domains/<domain>/routes/"
    fi

    # Components should be in proper location
    if [[ "$filename" =~ ^[A-Z].*\.(tsx|jsx)$ ]] && [[ "$filepath" =~ packages/ ]] && [[ ! "$filepath" =~ packages/ui/src/ ]]; then
        warn "Shared component may belong in packages/ui/src/components/"
    fi

    return 0
}

# =============================================================================
# VALIDATION 2: Financial Pattern Compliance
# =============================================================================
validate_financial_patterns() {
    local content="$1"
    local filepath="$2"

    # Only check relevant files
    if [[ ! "$filepath" =~ \.(ts|tsx)$ ]]; then
        return 0
    fi

    # Check for Decimal type usage (should use Int for money)
    if echo "$content" | grep -qE 'Decimal|decimal|BigDecimal'; then
        if [[ "$filepath" =~ (invoice|bill|payment|transaction|journal|accounting|money) ]]; then
            warn "Decimal type detected in financial code - consider using Int (cents) instead"
        fi
    fi

    # Check for parseFloat on money values
    if echo "$content" | grep -qE 'parseFloat\s*\([^)]*\s*(amount|price|cost|total|balance)'; then
        block \
            "parseFloat used on monetary value" \
            "Use parseInt or ensure value is already in cents" \
            "docs/standards/financial-data.md"
    fi

    # Check for toFixed on money (usually means float handling)
    if echo "$content" | grep -qE '\.(toFixed|toPrecision)\s*\(' && [[ "$filepath" =~ (invoice|bill|payment|transaction) ]]; then
        warn "toFixed/toPrecision detected - ensure money calculations use integer cents"
    fi

    return 0
}

# =============================================================================
# VALIDATION 3: Security Pattern Compliance
# =============================================================================
validate_security_patterns() {
    local content="$1"
    local filepath="$2"

    # Check for hardcoded secrets patterns
    if echo "$content" | grep -qiE '(api_key|apikey|secret|password|token)\s*[=:]\s*["\x27][^"\x27]{8,}["\x27]'; then
        # Allow example/placeholder values
        if ! echo "$content" | grep -qiE '(example|placeholder|your_|xxx|test_|sk_test_)'; then
            block \
                "Potential hardcoded secret detected" \
                "Use environment variables for sensitive values" \
                "docs/standards/security.md"
        fi
    fi

    # Check for SQL in string templates (injection risk)
    if echo "$content" | grep -qE '\$\{.*\}.*SELECT|SELECT.*\$\{'; then
        warn "Template literal in SQL query - use parameterized queries"
    fi

    return 0
}

# =============================================================================
# VALIDATION 4: API Pattern Compliance
# =============================================================================
validate_api_patterns() {
    local content="$1"
    local filepath="$2"

    # Only check API files
    if [[ ! "$filepath" =~ apps/api/src/ ]]; then
        return 0
    fi

    # Check for missing Zod validation in route handlers
    if [[ "$filepath" =~ routes.*\.ts$ ]]; then
        if echo "$content" | grep -qE 'fastify\.(get|post|put|patch|delete)\(' && ! echo "$content" | grep -q 'schema:'; then
            warn "Route handler without schema validation - consider adding Zod schema"
        fi
    fi

    # Check for direct prisma access without service layer
    if [[ "$filepath" =~ routes.*\.ts$ ]] && echo "$content" | grep -q 'prisma\.'; then
        warn "Direct Prisma access in route - consider using service layer"
    fi

    return 0
}

# =============================================================================
# VALIDATION 5: Schema File Compliance
# =============================================================================
validate_schema_patterns() {
    local content="$1"
    local filepath="$2"

    # Only check Prisma schema
    if [[ ! "$filepath" =~ schema\.prisma$ ]]; then
        return 0
    fi

    # Check for Float type on money fields
    if echo "$content" | grep -qE '(amount|price|cost|total|balance|fee|tax)\s+Float'; then
        block \
            "Float type used for monetary field in schema" \
            "Use Int type for money (store as cents)" \
            "docs/standards/financial-data.md"
    fi

    # Check for missing tenantId on tenant-scoped models
    # This is a heuristic - warn if model has no tenantId and isn't a known system model
    local system_models="User|Session|Account|VerificationToken"
    if echo "$content" | grep -qE '^model\s+[A-Z]' && ! echo "$content" | grep -q 'tenantId'; then
        local model_name=$(echo "$content" | grep -oE '^model\s+[A-Z][a-zA-Z]+' | head -1 | awk '{print $2}')
        if [ -n "$model_name" ] && [[ ! "$model_name" =~ ^($system_models)$ ]]; then
            warn "Model may be missing tenantId field for multi-tenant isolation"
        fi
    fi

    # Check for missing audit fields on financial models
    local financial_patterns="Invoice|Bill|Payment|JournalEntry|Transaction"
    if echo "$content" | grep -qE "^model\s+($financial_patterns)" && ! echo "$content" | grep -q 'deletedAt'; then
        warn "Financial model may be missing deletedAt for soft delete"
    fi

    return 0
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

# Run file convention validation
validate_file_conventions "$FILE_PATH"

# Run content validations if we have content
CONTENT_TO_CHECK=""
if [ -n "$NEW_CONTENT" ]; then
    CONTENT_TO_CHECK="$NEW_CONTENT"
elif [ -n "$NEW_STRING" ]; then
    CONTENT_TO_CHECK="$NEW_STRING"
fi

if [ -n "$CONTENT_TO_CHECK" ]; then
    validate_financial_patterns "$CONTENT_TO_CHECK" "$FILE_PATH"
    validate_security_patterns "$CONTENT_TO_CHECK" "$FILE_PATH"
    validate_api_patterns "$CONTENT_TO_CHECK" "$FILE_PATH"
    validate_schema_patterns "$CONTENT_TO_CHECK" "$FILE_PATH"
fi

# All validations passed
exit 0
