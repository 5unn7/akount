#!/usr/bin/env node

/**
 * Task ID Counter Initialization
 *
 * One-time script to initialize .task-id-counters.json by parsing TASKS.md
 * and extracting the highest ID number for each prefix.
 *
 * Usage:
 *   node .claude/scripts/init-task-counters.js
 *
 * Output:
 *   .claude/.task-id-counters.json (gitignored)
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const TASKS_FILE = path.join(PROJECT_ROOT, 'TASKS.md');
const COUNTER_FILE = path.join(PROJECT_ROOT, '.claude/state/.task-id-counters.json');

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  console.log('📊 Initializing task ID counters from TASKS.md...\n');

  // Check if TASKS.md exists
  if (!fs.existsSync(TASKS_FILE)) {
    console.error(`❌ Error: TASKS.md not found at ${TASKS_FILE}`);
    process.exit(1);
  }

  // Read TASKS.md
  const tasksMd = fs.readFileSync(TASKS_FILE, 'utf-8');

  // Parse task IDs
  const counters = {};
  const regex = /^\|\s*(?:~~)?([A-Z]+-\d+[a-z]?)(?:~~)?\s*\|/gm;

  let match;
  let totalTasks = 0;
  while ((match = regex.exec(tasksMd)) !== null) {
    const taskId = match[1];
    const parts = taskId.match(/^([A-Z]+)-(\d+)/);

    if (parts) {
      const prefix = parts[1];
      const num = parseInt(parts[2], 10);

      counters[prefix] = Math.max(counters[prefix] || 0, num);
      totalTasks++;
    }
  }

  // Create output
  const output = {
    version: '1.0',
    counters,
    lastUpdated: new Date().toISOString(),
    metadata: {
      initializedFrom: 'TASKS.md',
      totalTasksParsed: totalTasks
    }
  };

  // Ensure .claude directory exists
  const claudeDir = path.dirname(COUNTER_FILE);
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  // Write counter file
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(output, null, 2) + '\n');

  // Print summary
  console.log(`✅ Initialized counters from ${totalTasks} tasks:\n`);

  const sortedPrefixes = Object.keys(counters).sort();
  for (const prefix of sortedPrefixes) {
    console.log(`   ${prefix.padEnd(8)} → ${counters[prefix]}`);
  }

  console.log(`\n📝 Counter file written to: ${COUNTER_FILE}`);
  console.log(`\n⚠️  This file is gitignored - do not commit to version control.`);
}

// ─── Run ────────────────────────────────────────────────────────────

main();
