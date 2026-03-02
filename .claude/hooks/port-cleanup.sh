#!/bin/bash
#
# SessionStart Hook: Detect stale processes on dev ports
# Checks ports 3000 (Next.js) and 4000 (Fastify API)
# Non-blocking — warns but does NOT auto-kill
#

PORTS=(3000 4000)
PORT_NAMES=("Next.js" "Fastify API")
STALE_FOUND=false
WARNINGS=""

for i in "${!PORTS[@]}"; do
  PORT="${PORTS[$i]}"
  NAME="${PORT_NAMES[$i]}"

  # Windows-compatible port check using netstat
  PID=$(netstat -ano 2>/dev/null | grep ":${PORT} " | grep "LISTENING" | awk '{print $NF}' | head -1)

  if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    STALE_FOUND=true
    WARNINGS="${WARNINGS}\n  WARNING: Port $PORT ($NAME) in use by PID $PID"
    WARNINGS="${WARNINGS}\n  -> To kill: taskkill /PID $PID /F"
  fi
done

if [ "$STALE_FOUND" = true ]; then
  echo "{\"additionalContext\": \"## Port Conflict Warning (Auto-detected)${WARNINGS}\n\n  Stale dev processes may cause startup failures. Kill them before running dev servers.\"}"
fi

exit 0