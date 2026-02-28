#!/usr/bin/env node

/**
 * Runtime Summary Script
 *
 * Reads .claude/runtime logs and produces markdown summary for /processes:begin
 * Filters by last session timestamp if available
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const RUNTIME_DIR = '.claude/runtime';
const REQUEST_LOG = join(RUNTIME_DIR, 'request-log.json');
const QUERY_LOG = join(RUNTIME_DIR, 'query-log.json');
const ERROR_LOG = join(RUNTIME_DIR, 'error-log.json');
const LAST_SESSION_FILE = '.claude/last-session-commit.txt';

function readJSONFile(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    if (!content.trim()) return [];

    // Support both array and line-delimited JSON
    if (content.trim().startsWith('[')) {
      return JSON.parse(content);
    } else {
      return content
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    }
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}:`, error.message);
    return [];
  }
}

function getLastSessionTimestamp() {
  if (!existsSync(LAST_SESSION_FILE)) {
    return null;
  }

  try {
    const commit = readFileSync(LAST_SESSION_FILE, 'utf-8').trim();
    // Get commit timestamp
    const { execSync } = await import('child_process');
    const timestamp = execSync(`git show -s --format=%cI ${commit}`, { encoding: 'utf-8' }).trim();
    return new Date(timestamp);
  } catch {
    return null;
  }
}

function filterByTimestamp(logs, cutoffTime) {
  if (!cutoffTime) return logs;

  return logs.filter(log => {
    const logTime = new Date(log.timestamp);
    return logTime > cutoffTime;
  });
}

function analyzeLogs() {
  const cutoff = getLastSessionTimestamp();

  const requestLogs = filterByTimestamp(readJSONFile(REQUEST_LOG), cutoff);
  const queryLogs = filterByTimestamp(readJSONFile(QUERY_LOG), cutoff);
  const errorLogs = filterByTimestamp(readJSONFile(ERROR_LOG), cutoff);

  const summary = {
    slowRequests: requestLogs.filter(r => r.slow || r.durationMs > 500),
    slowQueries: queryLogs.filter(q => q.duration > 100),
    n1Patterns: queryLogs.filter(q => q.n1Pattern),
    errors: errorLogs,
  };

  // Sort by duration/count
  summary.slowRequests.sort((a, b) => (b.durationMs || 0) - (a.durationMs || 0));
  summary.slowQueries.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  summary.errors.sort((a, b) => (b.count || 1) - (a.count || 1));

  return summary;
}

function generateMarkdown(summary) {
  const lines = [];

  lines.push('## Runtime Signals (Since Last Session)');
  lines.push('');

  if (
    summary.slowRequests.length === 0 &&
    summary.slowQueries.length === 0 &&
    summary.n1Patterns.length === 0 &&
    summary.errors.length === 0
  ) {
    lines.push('_No runtime signals detected._');
    return lines.join('\n');
  }

  // Slow Requests
  if (summary.slowRequests.length > 0) {
    const worst = summary.slowRequests[0];
    lines.push(`**Slow Requests:** ${summary.slowRequests.length} (worst: ${worst.method} ${worst.url} - ${worst.durationMs}ms)`);
  } else {
    lines.push('**Slow Requests:** None');
  }

  // Slow Queries
  if (summary.slowQueries.length > 0) {
    const worst = summary.slowQueries[0];
    const modelOp = worst.model && worst.operation ? `${worst.model}.${worst.operation}` : 'Query';
    lines.push(`**Slow Queries:** ${summary.slowQueries.length} (worst: ${modelOp} - ${worst.duration}ms)`);
  } else {
    lines.push('**Slow Queries:** None');
  }

  // N+1 Patterns
  if (summary.n1Patterns.length > 0) {
    const examples = summary.n1Patterns.slice(0, 2).map(q => {
      const modelOp = q.model && q.operation ? `${q.model}.${q.operation}` : 'Query';
      return `${modelOp} called ${q.count || '5+'}x`;
    });
    lines.push(`**N+1 Patterns:** ${summary.n1Patterns.length} (${examples.join(', ')})`);
  } else {
    lines.push('**N+1 Patterns:** None');
  }

  // Errors
  if (summary.errors.length > 0) {
    lines.push(`**Errors:** ${summary.errors.length}`);
    summary.errors.slice(0, 3).forEach(err => {
      const count = err.count > 1 ? ` (${err.count} occurrences)` : '';
      lines.push(`  - ${err.message}${count}`);
    });
    if (summary.errors.length > 3) {
      lines.push(`  - ... and ${summary.errors.length - 3} more`);
    }
  } else {
    lines.push('**Errors:** None');
  }

  return lines.join('\n');
}

// Main execution
try {
  const summary = analyzeLogs();
  const markdown = generateMarkdown(summary);
  console.log(markdown);
} catch (error) {
  console.error('Error generating runtime summary:', error);
  console.log('## Runtime Signals\n\n_Error generating summary. Check .claude/runtime/ logs manually._');
  process.exit(1);
}
