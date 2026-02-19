#!/usr/bin/env node
/**
 * Task Claiming for Parallel Claude Agents
 *
 * File-based claiming mechanism that prevents two agents from working on the
 * same task simultaneously. Claims are stored in .claude/task-claims.json
 * (gitignored — local to each machine).
 *
 * Usage:
 *   node task-claim.js claim <taskId> [agentId]
 *   node task-claim.js release <taskId>
 *   node task-claim.js status <taskId>
 *   node task-claim.js list
 *   node task-claim.js clean
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CLAIMS_FILE = path.join(PROJECT_ROOT, '.claude', 'task-claims.json');
const TASKS_FILE = path.join(PROJECT_ROOT, 'tasks.json');

// --- Helpers ---

function loadClaims() {
  try {
    return JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf-8'));
  } catch {
    return { claims: {} };
  }
}

function saveClaims(data) {
  fs.mkdirSync(path.dirname(CLAIMS_FILE), { recursive: true });
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(data, null, 2) + '\n');
}

function loadTasks() {
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf-8'));
  } catch {
    return { tasks: {} };
  }
}

function isPidAlive(pid) {
  if (!pid) return false;
  try {
    if (process.platform === 'win32') {
      const out = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: 'utf-8', timeout: 5000 });
      return out.includes(String(pid));
    } else {
      process.kill(pid, 0); // Signal 0 = check existence
      return true;
    }
  } catch {
    return false;
  }
}

function getEffortMinutes(taskId) {
  const tasks = loadTasks();
  const task = tasks.tasks?.[taskId];
  return task?.effortMinutes || 120; // default 2h
}

function generateAgentId() {
  return `agent-${process.pid}-${Date.now().toString(36)}`;
}

// --- Core Operations ---

function claim(taskId, agentId) {
  const data = loadClaims();
  const existing = data.claims[taskId];

  // Check if already claimed by a live process
  if (existing) {
    if (isPidAlive(existing.pid)) {
      const expiresAt = new Date(existing.expiresAt);
      if (expiresAt > new Date()) {
        console.error(`CLAIMED: ${taskId} is already claimed by ${existing.agentId} (PID ${existing.pid}, expires ${existing.expiresAt})`);
        process.exit(1);
      }
      // Expired but process alive — warn but allow takeover
      console.warn(`WARN: ${taskId} claim expired but process ${existing.pid} still alive. Taking over.`);
    }
    // Dead PID or expired — safe to take over
  }

  const effortMinutes = getEffortMinutes(taskId);
  const expiryMs = effortMinutes * 2 * 60 * 1000; // 2x effort
  const now = new Date();

  data.claims[taskId] = {
    agentId: agentId || generateAgentId(),
    claimedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + expiryMs).toISOString(),
    pid: process.ppid || process.pid // Parent PID (the Claude process) or self
  };

  saveClaims(data);
  console.log(`CLAIMED: ${taskId} by ${data.claims[taskId].agentId} (expires in ${effortMinutes * 2}m)`);
}

function release(taskId) {
  const data = loadClaims();
  if (!data.claims[taskId]) {
    console.log(`OK: ${taskId} was not claimed`);
    return;
  }
  delete data.claims[taskId];
  saveClaims(data);
  console.log(`RELEASED: ${taskId}`);
}

function status(taskId) {
  const data = loadClaims();
  const claim = data.claims[taskId];
  if (!claim) {
    console.log(`AVAILABLE: ${taskId} is not claimed`);
    return;
  }

  const alive = isPidAlive(claim.pid);
  const expired = new Date(claim.expiresAt) < new Date();

  if (!alive || expired) {
    console.log(`STALE: ${taskId} claimed by ${claim.agentId} but ${!alive ? 'process dead' : 'expired'}`);
  } else {
    console.log(`CLAIMED: ${taskId} by ${claim.agentId} (PID ${claim.pid}, expires ${claim.expiresAt})`);
  }
}

function list() {
  const data = loadClaims();
  const claims = Object.entries(data.claims);
  if (claims.length === 0) {
    console.log('No active claims');
    return;
  }

  console.log(`Active claims (${claims.length}):`);
  for (const [taskId, claim] of claims) {
    const alive = isPidAlive(claim.pid);
    const expired = new Date(claim.expiresAt) < new Date();
    const flag = !alive ? ' [DEAD PID]' : expired ? ' [EXPIRED]' : '';
    console.log(`  ${taskId}: ${claim.agentId} (PID ${claim.pid})${flag}`);
  }
}

function cleanExpired() {
  const data = loadClaims();
  let cleaned = 0;

  for (const [taskId, claim] of Object.entries(data.claims)) {
    const alive = isPidAlive(claim.pid);
    const expired = new Date(claim.expiresAt) < new Date();

    if (!alive || expired) {
      delete data.claims[taskId];
      cleaned++;
    }
  }

  saveClaims(data);
  console.log(`Cleaned ${cleaned} expired/dead claims. ${Object.keys(data.claims).length} active.`);
}

// --- CLI ---

const [,, command, taskId, extra] = process.argv;

switch (command) {
  case 'claim':
    if (!taskId) { console.error('Usage: task-claim.js claim <taskId> [agentId]'); process.exit(1); }
    claim(taskId, extra);
    break;
  case 'release':
    if (!taskId) { console.error('Usage: task-claim.js release <taskId>'); process.exit(1); }
    release(taskId);
    break;
  case 'status':
    if (!taskId) { console.error('Usage: task-claim.js status <taskId>'); process.exit(1); }
    status(taskId);
    break;
  case 'list':
    list();
    break;
  case 'clean':
    cleanExpired();
    break;
  default:
    console.log('Task Claiming for Parallel Claude Agents\n');
    console.log('Usage:');
    console.log('  node task-claim.js claim <taskId> [agentId]  — Claim a task');
    console.log('  node task-claim.js release <taskId>          — Release a claim');
    console.log('  node task-claim.js status <taskId>           — Check claim status');
    console.log('  node task-claim.js list                      — List all claims');
    console.log('  node task-claim.js clean                     — Remove expired claims');
}
