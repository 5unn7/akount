#!/bin/bash
# Cost Dashboard Display
# Shows session cost summary for last N sessions
# Integrated into /processes:begin

set -euo pipefail

# Default to last 3 sessions
LAST_N=${1:-3}

echo ""
echo "💰 Session Cost Dashboard (Last $LAST_N Sessions)"
echo "═══════════════════════════════════════════════════"

# Check if cost tracker exists
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js not found - cost tracking unavailable"
  exit 0
fi

# Check if cost tracking script exists
COST_SCRIPT=".claude/scripts/track-session-cost.js"
if [ ! -f "$COST_SCRIPT" ]; then
  echo "⚠️  Cost tracker not initialized"
  echo "   Run: node .claude/scripts/track-session-cost.js log Read 0"
  exit 0
fi

# Check if session cost file exists
COST_FILE=".claude/session-cost.json"
if [ ! -f "$COST_FILE" ]; then
  echo "📊 No sessions tracked yet"
  echo ""
  echo "💡 Cost tracking will start automatically as you work."
  echo "   Sessions are logged to: $COST_FILE"
  exit 0
fi

# Generate report
node "$COST_SCRIPT" report --last "$LAST_N" 2>/dev/null || {
  echo "⚠️  Error generating cost report"
  exit 0
}

echo ""
