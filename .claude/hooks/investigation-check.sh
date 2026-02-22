#!/bin/bash
# Investigation Protocol Enforcement Hook
# Validates that proper investigation was done before code changes
#
# Checks:
# 1. MEMORY topic files were searched
# 2. Existing patterns were Grep'd
# 3. Affected files were Read before editing
# 4. Domain adjacency considered for cross-domain changes
#
# Exit codes:
# 0 = Investigation complete
# 1 = Investigation incomplete (block commit)

set -euo pipefail

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Session tracking file (created by session hooks)
SESSION_LOG=".claude/.session-context.log"

echo "🔍 Checking investigation protocol compliance..."

# Track investigation completeness
INVESTIGATION_SCORE=0
MAX_SCORE=100
WARNINGS=()

# ─── Check 1: MEMORY Search (25 points) ────────────────────────────

echo "  → Checking MEMORY search..."

if [ ! -f "$SESSION_LOG" ]; then
  WARNINGS+=("No session log found (first session or hook not configured)")
  echo -e "  ${YELLOW}⚠️  Warning: No session log${NC}"
else
  # Check if MEMORY directory was searched this session
  MEMORY_SEARCHES=$(grep -c "Grep.*memory/" "$SESSION_LOG" 2>/dev/null || echo "0")

  if [ "$MEMORY_SEARCHES" -gt 0 ]; then
    INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 25))
    echo -e "  ${GREEN}✅ MEMORY searched ($MEMORY_SEARCHES topic files)${NC}"
  else
    WARNINGS+=("MEMORY topic files not searched before code changes")
    echo -e "  ${YELLOW}⚠️  MEMORY not searched${NC}"
  fi
fi

# ─── Check 2: Pattern Verification (25 points) ─────────────────────

echo "  → Checking pattern verification..."

if [ -f "$SESSION_LOG" ]; then
  # Check if Grep was used to search for existing patterns
  GREP_SEARCHES=$(grep -c "Grep " "$SESSION_LOG" 2>/dev/null || echo "0")

  if [ "$GREP_SEARCHES" -gt 2 ]; then
    INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 25))
    echo -e "  ${GREEN}✅ Patterns verified ($GREP_SEARCHES Grep searches)${NC}"
  elif [ "$GREP_SEARCHES" -gt 0 ]; then
    INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 15))
    echo -e "  ${YELLOW}⚠️  Limited pattern verification ($GREP_SEARCHES searches)${NC}"
    WARNINGS+=("Only $GREP_SEARCHES Grep searches (recommend 3+ for thorough investigation)")
  else
    WARNINGS+=("No pattern verification (Grep not used)")
    echo -e "  ${YELLOW}⚠️  No pattern verification${NC}"
  fi
fi

# ─── Check 3: Files Read Before Edit (30 points) ───────────────────

echo "  → Checking files read before edit..."

# Get list of files being committed
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || echo "")

if [ -z "$STAGED_FILES" ]; then
  # No code files changed, skip this check
  INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 30))
  echo -e "  ${GREEN}✅ No code files changed${NC}"
elif [ -f "$SESSION_LOG" ]; then
  FILES_READ=0
  FILES_EDITED=0

  while IFS= read -r file; do
    FILES_EDITED=$((FILES_EDITED + 1))

    # Check if file was read this session
    if grep -q "Read.*$file" "$SESSION_LOG" 2>/dev/null; then
      FILES_READ=$((FILES_READ + 1))
    fi
  done <<< "$STAGED_FILES"

  if [ "$FILES_EDITED" -eq 0 ]; then
    INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 30))
    echo -e "  ${GREEN}✅ No files edited${NC}"
  else
    READ_PERCENTAGE=$((FILES_READ * 100 / FILES_EDITED))

    if [ "$READ_PERCENTAGE" -ge 80 ]; then
      INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 30))
      echo -e "  ${GREEN}✅ Files read before edit ($FILES_READ/$FILES_EDITED, ${READ_PERCENTAGE}%)${NC}"
    elif [ "$READ_PERCENTAGE" -ge 50 ]; then
      INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 20))
      echo -e "  ${YELLOW}⚠️  Some files not read ($FILES_READ/$FILES_EDITED, ${READ_PERCENTAGE}%)${NC}"
      WARNINGS+=("$((FILES_EDITED - FILES_READ)) files edited without reading first")
    else
      echo -e "  ${RED}❌ Most files not read ($FILES_READ/$FILES_EDITED, ${READ_PERCENTAGE}%)${NC}"
      WARNINGS+=("$((FILES_EDITED - FILES_READ)) files edited blindly (read first!)")
    fi
  fi
fi

# ─── Check 4: Domain Adjacency (20 points) ─────────────────────────

echo "  → Checking domain adjacency..."

# Domain adjacency map (changes in one often affect the other)
declare -A ADJACENCY_MAP=(
  ["banking"]="accounting invoicing"
  ["invoicing"]="accounting clients"
  ["vendors"]="accounting banking"
  ["accounting"]="banking invoicing vendors"
  ["planning"]="accounting banking"
)

# Detect which domains are affected by staged files
DOMAINS_AFFECTED=()

for file in $STAGED_FILES; do
  if [[ "$file" == *"/banking/"* ]]; then
    DOMAINS_AFFECTED+=("banking")
  elif [[ "$file" == *"/invoicing/"* ]] || [[ "$file" == *"/business/invoices/"* ]]; then
    DOMAINS_AFFECTED+=("invoicing")
  elif [[ "$file" == *"/accounting/"* ]]; then
    DOMAINS_AFFECTED+=("accounting")
  elif [[ "$file" == *"/vendors/"* ]] || [[ "$file" == *"/business/vendors/"* ]]; then
    DOMAINS_AFFECTED+=("vendors")
  elif [[ "$file" == *"/planning/"* ]]; then
    DOMAINS_AFFECTED+=("planning")
  fi
done

# Remove duplicates
DOMAINS_AFFECTED=($(echo "${DOMAINS_AFFECTED[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))

if [ ${#DOMAINS_AFFECTED[@]} -eq 0 ]; then
  # No domain-specific changes
  INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 20))
  echo -e "  ${GREEN}✅ No domain-specific changes${NC}"
elif [ ${#DOMAINS_AFFECTED[@]} -eq 1 ]; then
  # Single domain changed - check if adjacent domains were considered
  DOMAIN="${DOMAINS_AFFECTED[0]}"
  ADJACENT="${ADJACENCY_MAP[$DOMAIN]:-}"

  if [ -n "$ADJACENT" ]; then
    # Check if any adjacent domain files were read/searched
    ADJACENT_CHECKED=false

    for adj in $ADJACENT; do
      if [ -f "$SESSION_LOG" ] && grep -q "$adj" "$SESSION_LOG" 2>/dev/null; then
        ADJACENT_CHECKED=true
        break
      fi
    done

    if $ADJACENT_CHECKED; then
      INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 20))
      echo -e "  ${GREEN}✅ Adjacent domains checked ($DOMAIN → $ADJACENT)${NC}"
    else
      INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 10))
      echo -e "  ${YELLOW}⚠️  Adjacent domains not checked ($DOMAIN affects: $ADJACENT)${NC}"
      WARNINGS+=("Changes in $DOMAIN may affect: $ADJACENT (verify impact)")
    fi
  else
    INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 20))
    echo -e "  ${GREEN}✅ No adjacent domains${NC}"
  fi
else
  # Multiple domains changed - cross-domain change
  INVESTIGATION_SCORE=$((INVESTIGATION_SCORE + 20))
  echo -e "  ${CYAN}ℹ️  Cross-domain change (${DOMAINS_AFFECTED[*]})${NC}"
fi

# ─── Final Scoring ──────────────────────────────────────────────────

echo ""
echo "📊 Investigation Quality Score: $INVESTIGATION_SCORE/$MAX_SCORE"

# Grade thresholds
if [ "$INVESTIGATION_SCORE" -ge 80 ]; then
  GRADE="A"
  COLOR="$GREEN"
  STATUS="✅ PASS"
elif [ "$INVESTIGATION_SCORE" -ge 60 ]; then
  GRADE="B"
  COLOR="$YELLOW"
  STATUS="⚠️  WARN"
elif [ "$INVESTIGATION_SCORE" -ge 40 ]; then
  GRADE="C"
  COLOR="$YELLOW"
  STATUS="⚠️  WARN"
else
  GRADE="D"
  COLOR="$RED"
  STATUS="❌ FAIL"
fi

echo -e "${COLOR}Grade: $GRADE ($STATUS)${NC}"

# ─── Warnings & Recommendations ─────────────────────────────────────

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Investigation Gaps:${NC}"
  for warning in "${WARNINGS[@]}"; do
    echo "  • $warning"
  done
fi

# ─── Pass/Fail Logic ────────────────────────────────────────────────

# Fail if score < 60 (Grade D or F)
if [ "$INVESTIGATION_SCORE" -lt 60 ]; then
  echo ""
  echo -e "${RED}❌ COMMIT BLOCKED: Investigation incomplete${NC}"
  echo ""
  echo -e "${YELLOW}Required Investigation Steps:${NC}"
  echo "  1. Search MEMORY topic files: Grep '<concept>' C:\\Users\\Sunny\\.claude\\projects\\w--Marakana-Corp-Companies-akount-Development-Brand-aggoogle-product-plan\\memory/"
  echo "  2. Search for existing patterns: Grep '<feature>' apps/"
  echo "  3. Read files before editing: Read <file-path>"
  echo "  4. Check domain adjacency (see .claude/rules/product-thinking.md)"
  echo ""
  echo -e "${YELLOW}To bypass (NOT recommended):${NC}"
  echo "  Add '--no-verify' to git commit (but this defeats the purpose!)"
  echo ""
  exit 1
fi

# Warn if score 60-79 (Grade B or C)
if [ "$INVESTIGATION_SCORE" -lt 80 ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Investigation could be more thorough, but allowing commit.${NC}"
  echo "   Consider addressing the gaps above in future commits."
  echo ""
fi

echo -e "${GREEN}✅ Investigation protocol passed${NC}"
exit 0