#!/usr/bin/env node

/**
 * Session Cost Tracker
 *
 * Tracks token usage across Claude Code sessions to provide cost visibility.
 * Logs tool calls to .claude/session-cost.json for analysis.
 *
 * Usage:
 *   node .claude/scripts/track-session-cost.js log <tool> <tokens> [--description "..."]
 *   node .claude/scripts/track-session-cost.js summary
 *   node .claude/scripts/track-session-cost.js report [--last N]
 *
 * Examples:
 *   node .claude/scripts/track-session-cost.js log Read 45000 --description "Read large schema file"
 *   node .claude/scripts/track-session-cost.js summary
 *   node .claude/scripts/track-session-cost.js report --last 3
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const COST_FILE = path.join(PROJECT_ROOT, '.claude/state/session-cost.json');

// Pricing (as of 2026-02, approximate)
const PRICING = {
  opus: {
    input: 15.00 / 1_000_000,   // $15 per 1M input tokens
    output: 75.00 / 1_000_000,  // $75 per 1M output tokens
  },
  sonnet: {
    input: 3.00 / 1_000_000,    // $3 per 1M input tokens
    output: 15.00 / 1_000_000,  // $15 per 1M output tokens
  },
  haiku: {
    input: 0.25 / 1_000_000,    // $0.25 per 1M input tokens
    output: 1.25 / 1_000_000,   // $1.25 per 1M output tokens
  },
};

// ─── Session Management ────────────────────────────────────────────

function getSessionId() {
  // Generate session ID from date + random suffix
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const random = Math.random().toString(36).substring(2, 6);
  return `${dateStr}-${timeStr}-${random}`;
}

function loadCostData() {
  if (!fs.existsSync(COST_FILE)) {
    return {
      version: '1.0',
      sessions: [],
    };
  }

  return JSON.parse(fs.readFileSync(COST_FILE, 'utf-8'));
}

function saveCostData(data) {
  const dir = path.dirname(COST_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(COST_FILE, JSON.stringify(data, null, 2) + '\n');
}

function getCurrentSession(data) {
  // Get or create today's session
  const today = new Date().toISOString().split('T')[0];

  let session = data.sessions.find(s => s.date === today && !s.ended);

  if (!session) {
    session = {
      id: getSessionId(),
      date: today,
      startedAt: new Date().toISOString(),
      model: 'opus', // Default to Opus, can be overridden
      toolCalls: [],
      totalTokens: 0,
      estimatedCost: 0,
    };
    data.sessions.push(session);
  }

  return session;
}

// ─── Logging ────────────────────────────────────────────────────────

function logToolCall(tool, tokens, description = '') {
  const data = loadCostData();
  const session = getCurrentSession(data);

  const toolCall = {
    timestamp: new Date().toISOString(),
    tool,
    tokens,
    description,
  };

  session.toolCalls.push(toolCall);
  session.totalTokens += tokens;

  // Estimate cost (assume 80% input, 20% output split)
  const inputTokens = tokens * 0.8;
  const outputTokens = tokens * 0.2;
  const pricing = PRICING[session.model];
  const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output);

  session.estimatedCost += cost;

  saveCostData(data);

  console.log(`✅ Logged: ${tool} (${tokens.toLocaleString()} tokens, $${cost.toFixed(4)})`);
}

// ─── Summary ────────────────────────────────────────────────────────

function printSummary() {
  const data = loadCostData();

  if (data.sessions.length === 0) {
    console.log('📊 No sessions tracked yet');
    return;
  }

  const currentSession = data.sessions[data.sessions.length - 1];

  console.log('📊 Current Session Summary\n');
  console.log(`Session ID: ${currentSession.id}`);
  console.log(`Started: ${new Date(currentSession.startedAt).toLocaleString()}`);
  console.log(`Model: ${currentSession.model}`);
  console.log(`Total Tokens: ${currentSession.totalTokens.toLocaleString()}`);
  console.log(`Estimated Cost: $${currentSession.estimatedCost.toFixed(2)}`);
  console.log(`\nTool Calls: ${currentSession.toolCalls.length}`);

  // Group by tool
  const byTool = {};
  currentSession.toolCalls.forEach(call => {
    if (!byTool[call.tool]) {
      byTool[call.tool] = { count: 0, tokens: 0 };
    }
    byTool[call.tool].count++;
    byTool[call.tool].tokens += call.tokens;
  });

  console.log('\nTop Tools:');
  Object.entries(byTool)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 5)
    .forEach(([tool, stats]) => {
      const pct = ((stats.tokens / currentSession.totalTokens) * 100).toFixed(1);
      console.log(`  ${tool}: ${stats.count} calls, ${stats.tokens.toLocaleString()} tokens (${pct}%)`);
    });
}

// ─── Report ─────────────────────────────────────────────────────────

function printReport(lastN = 3) {
  const data = loadCostData();

  if (data.sessions.length === 0) {
    console.log('📊 No sessions tracked yet');
    return;
  }

  const sessions = data.sessions.slice(-lastN);

  console.log(`💰 Session Cost Report (Last ${lastN} Sessions)\n`);

  sessions.forEach((session, idx) => {
    const date = new Date(session.startedAt).toLocaleDateString();
    const time = new Date(session.startedAt).toLocaleTimeString();
    const efficiency = session.totalTokens < 500_000 ? '⚡ Efficient!' : '';

    console.log(`${idx + 1}. ${date} ${time}`);
    console.log(`   Tokens: ${session.totalTokens.toLocaleString()}`);
    console.log(`   Cost: $${session.estimatedCost.toFixed(2)} ${efficiency}`);
    console.log(`   Model: ${session.model}`);
    console.log('');
  });

  // Averages
  const avgTokens = sessions.reduce((sum, s) => sum + s.totalTokens, 0) / sessions.length;
  const avgCost = sessions.reduce((sum, s) => sum + s.estimatedCost, 0) / sessions.length;

  console.log('📈 Averages:');
  console.log(`   Tokens: ${Math.round(avgTokens).toLocaleString()}`);
  console.log(`   Cost: $${avgCost.toFixed(2)}`);

  // Tips
  console.log('\n💡 Cost Optimization Tips:');
  if (avgTokens > 500_000) {
    console.log('   • Use /fast for searches (saves ~60% cost)');
  }
  if (avgTokens > 300_000) {
    console.log('   • Use offset/limit for large files (saves ~40% tokens)');
  }
  console.log('   • Stay on Opus only for multi-file features, architecture, financial logic');
}

// ─── CLI ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Session Cost Tracker\n');
    console.log('Usage:');
    console.log('  node track-session-cost.js log <tool> <tokens> [--description "..."]');
    console.log('  node track-session-cost.js summary');
    console.log('  node track-session-cost.js report [--last N]\n');
    console.log('Examples:');
    console.log('  node track-session-cost.js log Read 45000 --description "Read schema"');
    console.log('  node track-session-cost.js summary');
    console.log('  node track-session-cost.js report --last 5');
    process.exit(0);
  }

  const command = args[0];

  if (command === 'log') {
    if (args.length < 3) {
      console.error('❌ Error: log requires <tool> and <tokens>');
      process.exit(1);
    }

    const tool = args[1];
    const tokens = parseInt(args[2], 10);

    if (isNaN(tokens)) {
      console.error(`❌ Error: Invalid token count "${args[2]}"`);
      process.exit(1);
    }

    // Parse description (optional)
    const descIdx = args.indexOf('--description');
    const description = descIdx !== -1 && args[descIdx + 1] ? args[descIdx + 1] : '';

    logToolCall(tool, tokens, description);
  } else if (command === 'summary') {
    printSummary();
  } else if (command === 'report') {
    const lastIdx = args.indexOf('--last');
    const lastN = lastIdx !== -1 && args[lastIdx + 1] ? parseInt(args[lastIdx + 1], 10) : 3;

    if (isNaN(lastN) || lastN < 1) {
      console.error('❌ Error: --last requires a positive number');
      process.exit(1);
    }

    printReport(lastN);
  } else {
    console.error(`❌ Error: Unknown command "${command}"`);
    console.error('Run with --help for usage');
    process.exit(1);
  }
}

// ─── Run ────────────────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = { logToolCall, printSummary, printReport };
