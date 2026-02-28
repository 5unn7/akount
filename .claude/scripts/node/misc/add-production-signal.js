#!/usr/bin/env node

/**
 * Add Production Signal CLI
 *
 * Manual tool for adding/resolving/listing production signals
 */

const fs = require('fs');
const path = require('path');

const SIGNALS_FILE = '.claude/production/signals.json';

function readSignals() {
  if (!fs.existsSync(SIGNALS_FILE)) {
    return { version: '1.0', lastSync: null, signals: [] };
  }

  try {
    return JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf-8'));
  } catch (error) {
    console.error('Error reading signals.json:', error.message);
    process.exit(1);
  }
}

function writeSignals(data) {
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generateSignalId(signals) {
  const maxId = signals.reduce((max, s) => {
    const num = parseInt(s.id.replace('sig-', ''));
    return Math.max(max, num);
  }, 0);
  return `sig-${String(maxId + 1).padStart(3, '0')}`;
}

function addSignal(args) {
  const data = readSignals();

  const signal = {
    id: generateSignalId(data.signals),
    timestamp: new Date().toISOString(),
    type: args.type,
    severity: args.severity,
    source: args.source || 'manual',
    message: args.message,
    file: args.file || null,
    line: args.line ? parseInt(args.line) : null,
    frequency: 1,
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    resolved: false,
  };

  data.signals.push(signal);
  writeSignals(data);

  console.log(`✅ Signal added: ${signal.id}`);
  console.log(`   Type: ${signal.type}`);
  console.log(`   Severity: ${signal.severity}`);
  console.log(`   Message: ${signal.message}`);
  if (signal.file) {
    console.log(`   File: ${signal.file}${signal.line ? ':' + signal.line : ''}`);
  }
}

function resolveSignal(signalId) {
  const data = readSignals();
  const signal = data.signals.find(s => s.id === signalId);

  if (!signal) {
    console.error(`Error: Signal ${signalId} not found`);
    process.exit(1);
  }

  signal.resolved = true;
  signal.resolvedAt = new Date().toISOString();
  writeSignals(data);

  console.log(`✅ Signal ${signalId} marked as resolved`);
  console.log(`   Message: ${signal.message}`);
}

function listSignals() {
  const data = readSignals();
  const unresolved = data.signals.filter(s => !s.resolved);

  if (unresolved.length === 0) {
    console.log('No unresolved signals.');
    return;
  }

  console.log('Unresolved Production Signals:');
  console.log('');
  console.log('| ID | Type | Severity | Message | Frequency |');
  console.log('|----|------|----------|---------|-----------|');

  unresolved.forEach(s => {
    const msg = s.message.length > 50 ? s.message.slice(0, 47) + '...' : s.message;
    console.log(`| ${s.id} | ${s.type} | ${s.severity} | ${msg} | ${s.frequency}x |`);
  });

  console.log('');
  console.log(`Total: ${unresolved.length} unresolved`);
  console.log('');
  console.log('To resolve: node add-production-signal.js --resolve <id>');
}

// Parse arguments
const args = process.argv.slice(2);

if (args.includes('--list')) {
  listSignals();
  process.exit(0);
}

if (args.includes('--resolve')) {
  const idIndex = args.indexOf('--resolve') + 1;
  if (idIndex >= args.length) {
    console.error('Error: --resolve requires signal ID');
    process.exit(1);
  }
  resolveSignal(args[idIndex]);
  process.exit(0);
}

// Add signal
const parsedArgs = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  parsedArgs[key] = value;
}

// Validate required fields
if (!parsedArgs.type || !parsedArgs.severity || !parsedArgs.message) {
  console.error('Usage: node add-production-signal.js --type <type> --severity <severity> --message <msg> [--file <path>] [--line <num>]');
  console.error('');
  console.error('Required:');
  console.error('  --type       error | performance | security | deprecation | usage');
  console.error('  --severity   high | medium | low');
  console.error('  --message    Signal description');
  console.error('');
  console.error('Optional:');
  console.error('  --file       File path');
  console.error('  --line       Line number');
  console.error('  --source     sentry | vercel | manual | monitoring (default: manual)');
  console.error('');
  console.error('Other commands:');
  console.error('  --list               List all unresolved signals');
  console.error('  --resolve <id>       Mark signal as resolved');
  process.exit(1);
}

addSignal(parsedArgs);
