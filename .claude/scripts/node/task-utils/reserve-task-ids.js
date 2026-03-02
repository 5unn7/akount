#!/usr/bin/env node

/**
 * Atomic Task ID Reservation Service
 *
 * Provides atomic ID generation for task creation across concurrent agents.
 * Uses file-based locking to prevent ID collisions.
 *
 * Usage:
 *   node .claude/scripts/reserve-task-ids.js <PREFIX> [count]
 *
 * Examples:
 *   node .claude/scripts/reserve-task-ids.js SEC
 *   → {"ids":["SEC-20"],"reservedAt":"2026-02-19T18:00:00.000Z"}
 *
 *   node .claude/scripts/reserve-task-ids.js UX 3
 *   → {"ids":["UX-61","UX-62","UX-63"],"reservedAt":"2026-02-19T18:00:00.000Z"}
 *
 * Exit codes:
 *   0 = success
 *   1 = error (invalid args, lock timeout, file error)
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const COUNTER_FILE = path.join(PROJECT_ROOT, '.claude/state/.task-id-counters.json');
const LOCK_FILE = COUNTER_FILE + '.lock';
const TMP_FILE = COUNTER_FILE + '.tmp';

const LOCK_TIMEOUT_MS = 5000; // 5 seconds
const LOCK_RETRY_MS = 10; // 10 milliseconds

// ─── Lock Management ────────────────────────────────────────────────

/**
 * Acquire lock using spinlock with timeout
 */
function acquireLock() {
  const startTime = Date.now();

  while (fs.existsSync(LOCK_FILE)) {
    // Check for timeout
    if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
      // Check if lock holder is stale (older than timeout)
      try {
        const lockData = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf-8'));
        const lockAge = Date.now() - new Date(lockData.lockedAt).getTime();

        if (lockAge > LOCK_TIMEOUT_MS) {
          console.error(`⚠️  Stale lock detected (${Math.round(lockAge / 1000)}s old) - breaking lock`);
          fs.unlinkSync(LOCK_FILE);
          break;
        }
      } catch (err) {
        // Lock file corrupted or unreadable - break it
        console.error('⚠️  Corrupted lock file - breaking lock');
        fs.unlinkSync(LOCK_FILE);
        break;
      }

      throw new Error(`Lock acquisition timeout (${LOCK_TIMEOUT_MS}ms) - another agent holding lock`);
    }

    // Sleep 10ms using busy wait (Atomics.wait not available in single-threaded Node)
    const sleepUntil = Date.now() + LOCK_RETRY_MS;
    while (Date.now() < sleepUntil) {
      // Busy wait
    }
  }

  // Create lock file atomically (flag 'wx' fails if exists)
  try {
    fs.writeFileSync(
      LOCK_FILE,
      JSON.stringify({
        pid: process.pid,
        lockedAt: new Date().toISOString()
      }),
      { flag: 'wx' }
    );
  } catch (err) {
    if (err.code === 'EEXIST') {
      // Lock created between check and write - retry
      return acquireLock();
    }
    throw err;
  }
}

/**
 * Release lock
 */
function releaseLock() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}

// ─── ID Reservation ─────────────────────────────────────────────────

/**
 * Reserve N task IDs for a given prefix
 */
function reserveTaskIds(prefix, count = 1) {
  // Validate prefix
  const validPrefixes = [
    'SEC', 'PERF', 'UX', 'TEST', 'DEV', 'ARCH', 'FIN', 'DRY',
    'DS', 'MKT', 'CNT', 'INFRA', 'OPS', 'DOC', 'QUAL'
  ];

  if (!validPrefixes.includes(prefix)) {
    throw new Error(`Invalid prefix "${prefix}". Valid: ${validPrefixes.join(', ')}`);
  }

  // Validate count
  if (count < 1 || count > 100) {
    throw new Error(`Invalid count ${count}. Must be 1-100.`);
  }

  let counters = { version: '1.0', counters: {} };

  // Check if counter file exists
  if (!fs.existsSync(COUNTER_FILE)) {
    throw new Error(
      `Counter file not found: ${COUNTER_FILE}\n` +
      `Run: node .claude/scripts/init-task-counters.js`
    );
  }

  // Acquire lock
  acquireLock();

  try {
    // Read counters
    counters = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));

    // Reserve IDs
    const currentCount = counters.counters[prefix] || 0;
    const ids = [];

    for (let i = 1; i <= count; i++) {
      ids.push(`${prefix}-${currentCount + i}`);
    }

    // Update counter
    counters.counters[prefix] = currentCount + count;
    counters.lastUpdated = new Date().toISOString();

    // Write atomically (tmp + rename)
    fs.writeFileSync(TMP_FILE, JSON.stringify(counters, null, 2) + '\n');
    fs.renameSync(TMP_FILE, COUNTER_FILE);

    return {
      ids,
      reservedAt: new Date().toISOString()
    };
  } finally {
    // Always release lock
    releaseLock();
  }
}

// ─── CLI ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Atomic Task ID Reservation Service\n');
    console.log('Usage:');
    console.log('  node reserve-task-ids.js <PREFIX> [count]\n');
    console.log('Examples:');
    console.log('  node reserve-task-ids.js SEC          # Reserve 1 ID');
    console.log('  node reserve-task-ids.js UX 5         # Reserve 5 IDs\n');
    console.log('Valid prefixes:');
    console.log('  SEC, PERF, UX, TEST, DEV, ARCH, FIN, DRY, DS, MKT, CNT, INFRA, OPS, DOC, QUAL');
    process.exit(0);
  }

  const prefix = args[0].toUpperCase();
  const count = args[1] ? parseInt(args[1], 10) : 1;

  if (isNaN(count)) {
    console.error(`❌ Error: Invalid count "${args[1]}" (must be a number)`);
    process.exit(1);
  }

  try {
    const result = reserveTaskIds(prefix, count);

    // Output JSON for programmatic consumption
    console.log(JSON.stringify(result));
    process.exit(0);
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

// ─── Run ────────────────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = { reserveTaskIds };