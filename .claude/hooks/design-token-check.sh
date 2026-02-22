#!/bin/bash
# Design Token Validation Hook
# Blocks commits with hardcoded colors (text-[#hex], bg-[rgba()], etc.)
# and arbitrary font sizes (text-[10px], text-[11px], etc.)
# Run manually: .claude/hooks/design-token-check.sh

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Only check web app files (UI components)
SEARCH_PATHS="apps/web/src packages/ui/src"

echo "🎨 Checking for hardcoded colors and arbitrary sizes..."

# Patterns to detect
PATTERNS=(
  'text-\[#[0-9A-Fa-f]'     # text-[#34D399]
  'bg-\[#[0-9A-Fa-f]'       # bg-[#F59E0B]
  'border-\[#[0-9A-Fa-f]'   # border-[#71717A]
  'text-\[rgba\('           # text-[rgba(255,255,255,0.06)]
  'bg-\[rgba\('             # bg-[rgba(52,211,153,0.18)]
  'border-\[rgba\('         # border-[rgba(255,255,255,0.09)]
  'text-\[[0-9]+px\]'       # text-[10px], text-[11px] — use text-micro or Tailwind classes
)

# Token suggestions mapping
declare -A TOKEN_SUGGESTIONS=(
  ["#34D399"]="text-ak-green (Income/success green)"
  ["#F87171"]="text-ak-red (Expense/error red)"
  ["#60A5FA"]="text-ak-blue (Transfer/info blue)"
  ["#A78BFA"]="text-ak-purple (AI/purple accent)"
  ["#2DD4BF"]="text-ak-teal (Teal accent)"
  ["#F59E0B"]="text-primary (Primary amber)"
  ["#FBBF24"]="hover:bg-ak-pri-hover (Primary hover)"
  ["rgba(255,255,255,0.025)"]="glass (Glass tier 1)"
  ["rgba(255,255,255,0.04)"]="glass-2 (Glass tier 2)"
  ["rgba(255,255,255,0.06)"]="glass-3 (Glass tier 3)"
  ["rgba(255,255,255,0.06)"]="border-ak-border (Default border)"
  ["rgba(255,255,255,0.09)"]="border-ak-border-2 (Medium border)"
  ["rgba(255,255,255,0.13)"]="border-ak-border-3 (Strong border)"
  ["#71717A"]="text-muted-foreground (Muted text)"
  ["#1A1A26"]="bg-ak-bg-3 (Hover surface)"
  ["#22222E"]="bg-ak-bg-4 (Active surface)"
)

VIOLATIONS_FOUND=0

for pattern in "${PATTERNS[@]}"; do
  # Search for pattern in web app files only
  if grep -r -n -E "$pattern" $SEARCH_PATHS 2>/dev/null; then
    VIOLATIONS_FOUND=1
  fi
done

if [ $VIOLATIONS_FOUND -eq 1 ]; then
  echo ""
  echo -e "${RED}❌ COMMIT BLOCKED: Hardcoded colors or arbitrary sizes detected!${NC}"
  echo ""
  echo -e "${YELLOW}Akount Design System Rule:${NC}"
  echo "  NEVER use arbitrary color values like text-[#34D399] or bg-[rgba(255,255,255,0.06)]"
  echo "  NEVER use arbitrary font sizes like text-[10px] or text-[11px]"
  echo "  ALWAYS use semantic tokens from globals.css"
  echo ""
  echo -e "${YELLOW}Common Token Mappings:${NC}"
  echo "  text-[#34D399]              → text-ak-green"
  echo "  text-[#F87171]              → text-ak-red"
  echo "  text-[#60A5FA]              → text-ak-blue"
  echo "  text-[#F59E0B]              → text-primary"
  echo "  bg-[rgba(255,255,255,0.025)] → glass"
  echo "  bg-[rgba(255,255,255,0.04)]  → glass-2"
  echo "  border-[rgba(255,255,255,0.06)] → border-ak-border"
  echo ""
  echo -e "${YELLOW}Font Size Mappings:${NC}"
  echo "  text-[10px]                 → text-micro (custom utility in globals.css)"
  echo "  text-[11px]                 → text-xs (Tailwind default, 12px)"
  echo "  text-[9px]                  → text-micro with smaller variant or define new utility"
  echo ""
  echo -e "${YELLOW}Full token reference:${NC}"
  echo "  .claude/rules/design-aesthetic.md (Color Token Mapping + Typography Rules)"
  echo "  apps/web/src/app/globals.css (token definitions)"
  echo ""
  echo -e "${YELLOW}How to fix:${NC}"
  echo "  1. Replace hardcoded values with tokens from the mapping above"
  echo "  2. If you need a new color or size, add it to globals.css first"
  echo "  3. Re-run: git commit"
  echo ""
  exit 1
fi

echo -e "${GREEN}✅ No hardcoded colors or arbitrary sizes detected${NC}"
exit 0
