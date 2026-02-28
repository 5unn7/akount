#!/usr/bin/env node

/**
 * Read Production Signals
 *
 * Reads .claude/production/signals.json and formats unresolved signals for /processes:begin
 */

const fs = require('fs');
const path = require('path');

const SIGNALS_FILE = '.claude/production/signals.json';

function readSignals() {
  if (!fs.existsSync(SIGNALS_FILE)) {
    return { signals: [] };
  }

  try {
    const content = fs.readFileSync(SIGNALS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('Warning: Could not parse signals.json:', error.message);
    return { signals: [] };
  }
}

function formatSignal(signal) {
  // Severity badge
  const badges = {
    high: '🔴',
    medium: '🟡',
    low: '⚪',
  };
  const badge = badges[signal.severity] || '⚪';

  // Type label
  const typeLabels = {
    error: 'Error',
    performance: 'Performance',
    security: 'Security',
    deprecation: 'Deprecation',
    usage: 'Usage',
  };
  const typeLabel = typeLabels[signal.type] || signal.type;

  // File link
  const fileLink = signal.file && signal.line
    ? `[${signal.file}:${signal.line}](${signal.file}#L${signal.line})`
    : signal.file
      ? `[${signal.file}](${signal.file})`
      : '';

  // Frequency
  const freq = signal.frequency > 1 ? ` (${signal.frequency}x)` : '';

  // Time range
  const timeRange = signal.firstSeen !== signal.lastSeen
    ? ` [${new Date(signal.firstSeen).toLocaleDateString()} - ${new Date(signal.lastSeen).toLocaleDateString()}]`
    : '';

  return `${badge} **${typeLabel}:** ${signal.message}${freq}${timeRange}\n${fileLink ? `  ${fileLink}` : ''}`;
}

function generateMarkdown() {
  const data = readSignals();
  const unresolved = data.signals.filter(s => !s.resolved);

  if (unresolved.length === 0) {
    return '## Production Signals\n\n_No unresolved production signals._';
  }

  // Sort by severity (high first), then by frequency
  const severityOrder = { high: 0, medium: 1, low: 2 };
  unresolved.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (b.frequency || 1) - (a.frequency || 1);
  });

  const lines = [];
  lines.push('## Production Signals');
  lines.push('');
  lines.push(`**Unresolved:** ${unresolved.length} signals`);
  lines.push('');

  unresolved.slice(0, 10).forEach(signal => {
    lines.push(formatSignal(signal));
    lines.push('');
  });

  if (unresolved.length > 10) {
    lines.push(`_... and ${unresolved.length - 10} more. Run: \`node .claude/scripts/add-production-signal.js --list\`_`);
  }

  return lines.join('\n');
}

// Main execution
try {
  const markdown = generateMarkdown();
  console.log(markdown);
} catch (error) {
  console.error('Error reading production signals:', error);
  console.log('## Production Signals\n\n_Error reading signals. Check .claude/production/signals.json._');
  process.exit(1);
}
