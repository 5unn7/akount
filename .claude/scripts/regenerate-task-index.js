#!/usr/bin/env node

/**
 * TASKS.md Index Generator
 *
 * Parses TASKS.md markdown tables and generates a JSON index embedded
 * as an HTML comment at the bottom of the file. This enables fast O(1)
 * task lookup without parsing the entire markdown file.
 *
 * Usage:
 *   node .claude/scripts/regenerate-task-index.js
 *
 * Triggered by:
 *   - .claude/hooks/task-complete-sync.sh (auto on TASKS.md changes)
 *   - /processes:claim --rebuild-index (manual)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TASKS_FILE = path.join(__dirname, '../../TASKS.md');
const INDEX_START = '<!-- TASK-INDEX:START (auto-generated, do not edit manually)';
const INDEX_END = 'TASK-INDEX:END -->';

/**
 * Parse effort string to categorize tasks by time
 * @param {string} effort - e.g., "15m", "1h", "2-4h", "30min-2h"
 * @returns {string} - "quick", "short", "medium", or "long"
 */
function categorizeEffort(effort) {
  if (!effort) return 'unknown';

  const effortLower = effort.toLowerCase().replace(/\s+/g, '');

  // Quick: <30min
  if (effortLower.match(/^(\d+)m$/) && parseInt(effortLower) < 30) return 'quick';
  if (effortLower === '15m' || effortLower === '10m' || effortLower === '5m') return 'quick';

  // Short: 30min-2h
  if (effortLower.match(/^(\d+)m$/) && parseInt(effortLower) >= 30) return 'short';
  if (effortLower.match(/^(\d+)h$/) && parseInt(effortLower) <= 2) return 'short';
  if (effortLower.match(/30m.+2h|1.+2h/)) return 'short';

  // Medium: 2-4h
  if (effortLower.match(/^([2-4])h$/)) return 'medium';
  if (effortLower.match(/2.+4h|3.+4h/)) return 'medium';

  // Long: >4h
  if (effortLower.match(/^(\d+)h$/) && parseInt(effortLower) > 4) return 'long';
  if (effortLower.match(/[5-9]h|1\dh/)) return 'long';

  return 'unknown';
}

/**
 * Parse priority emoji to string
 * @param {string} priority - e.g., "🔴 Critical", "🟠 High"
 * @returns {string} - "critical", "high", "medium", or "low"
 */
function parsePriority(priority) {
  if (!priority) return 'unknown';
  const lower = priority.toLowerCase();
  if (lower.includes('critical') || lower.includes('🔴')) return 'critical';
  if (lower.includes('high') || lower.includes('🟠')) return 'high';
  if (lower.includes('medium') || lower.includes('🟡')) return 'medium';
  if (lower.includes('low') || lower.includes('⚪')) return 'low';
  return 'unknown';
}

/**
 * Parse status emoji to string
 * @param {string} status - e.g., "🟢 ready", "🔒 blocked", "✅ done"
 * @returns {string} - "ready", "blocked", "backlog", or "done"
 */
function parseStatus(status) {
  if (!status) return 'unknown';
  const lower = status.toLowerCase();
  if (lower.includes('🟢') || lower.includes('ready')) return 'ready';
  if (lower.includes('🔒') || lower.includes('blocked')) return 'blocked';
  if (lower.includes('📦') || lower.includes('backlog')) return 'backlog';
  if (lower.includes('✅') || lower.includes('done')) return 'done';
  return 'unknown';
}

/**
 * Extract domain from task ID prefix
 * @param {string} taskId - e.g., "SEC-8", "PERF-1", "UX-9"
 * @returns {string} - domain name
 */
function extractDomain(taskId) {
  if (!taskId) return 'unknown';

  const prefix = taskId.split('-')[0].toLowerCase();

  // Map prefixes to domains
  const domainMap = {
    'sec': 'security',
    'perf': 'performance',
    'ux': 'ux',
    'test': 'testing',
    'dry': 'code-quality',
    'dev': 'development',
    'arch': 'architecture',
    'fin': 'financial',
    'doc': 'documentation',
    'ds': 'design-system',
    'mkt': 'marketing',
    'cnt': 'content',
    'infra': 'infrastructure',
    'ops': 'operations',
    'qual': 'quality'
  };

  return domainMap[prefix] || 'other';
}

/**
 * Check if task is a dashboard-related task
 * @param {string} title - Task title
 * @returns {boolean}
 */
function isDashboardTask(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return lower.includes('dashboard') ||
         lower.includes('sparkcard') ||
         lower.includes('leftRail') ||
         lower.includes('rightRail') ||
         lower.includes('networth') ||
         lower.includes('aibrief');
}

/**
 * Parse a markdown table row into task object
 * @param {string} line - Markdown table row
 * @param {number} lineNumber - Line number in file
 * @returns {object|null} - Task object or null if not a task row
 */
function parseTaskRow(line, lineNumber) {
  // Match: | ID | Task | Effort | Priority | Status | Deps | Source |
  const match = line.match(/^\|\s*([A-Z]+-\d+[a-z]?)\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|/);

  if (!match) return null;

  const [, id, title, effort, priority, status, deps, source] = match.map(s => s.trim());

  // Parse dependencies
  const depsArray = [];
  const needsMatch = deps.match(/\[needs:\s*([A-Z]+-\d+[a-z]?)\]/g);
  if (needsMatch) {
    needsMatch.forEach(dep => {
      const depId = dep.match(/\[needs:\s*([A-Z]+-\d+[a-z]?)\]/);
      if (depId) depsArray.push(depId[1]);
    });
  }

  const task = {
    id,
    line: lineNumber,
    title: title.replace(/^~~|~~$/g, '').trim(), // Remove strikethrough
    effort: effort.trim(),
    priority: parsePriority(priority),
    status: parseStatus(status),
    deps: depsArray,
    source: source.trim(),
    domain: extractDomain(id),
    effortCategory: categorizeEffort(effort.trim())
  };

  // Add dashboard flag
  if (isDashboardTask(title)) {
    task.tags = ['dashboard'];
  }

  return task;
}

/**
 * Build index from TASKS.md content
 * @param {string} content - Full TASKS.md content
 * @returns {object} - Index object
 */
function buildIndex(content) {
  const lines = content.split('\n');
  const tasks = {};
  const byPriority = { critical: [], high: [], medium: [], low: [] };
  const byEffort = { quick: [], short: [], medium: [], long: [] };
  const byDomain = {};
  const byStatus = { ready: [], blocked: [], backlog: [], done: [] };
  const quickWins = [];
  const dashboardTasks = [];

  // Parse each line
  lines.forEach((line, index) => {
    const task = parseTaskRow(line, index + 1);
    if (!task) return;

    // Store task details
    tasks[task.id] = {
      line: task.line,
      title: task.title,
      effort: task.effort,
      priority: task.priority,
      status: task.status,
      deps: task.deps,
      domain: task.domain
    };

    // Index by priority
    if (byPriority[task.priority]) {
      byPriority[task.priority].push(task.id);
    }

    // Index by effort
    if (byEffort[task.effortCategory]) {
      byEffort[task.effortCategory].push(task.id);
    }

    // Index by domain
    if (!byDomain[task.domain]) {
      byDomain[task.domain] = [];
    }
    byDomain[task.domain].push(task.id);

    // Index by status
    if (byStatus[task.status]) {
      byStatus[task.status].push(task.id);
    }

    // Quick wins: high priority + quick/short effort + ready
    if ((task.priority === 'high' || task.priority === 'critical') &&
        (task.effortCategory === 'quick' || task.effortCategory === 'short') &&
        task.status === 'ready') {
      quickWins.push(task.id);
    }

    // Dashboard tasks
    if (task.tags && task.tags.includes('dashboard') && task.status === 'ready') {
      dashboardTasks.push(task.id);
    }
  });

  // Count totals
  const allTasks = Object.keys(tasks);
  const summary = {
    total: allTasks.length,
    ready: byStatus.ready.length,
    blocked: byStatus.blocked.length,
    backlog: byStatus.backlog.length,
    done: byStatus.done.length
  };

  return {
    version: '1.0',
    generated: new Date().toISOString(),
    summary,
    byPriority,
    byEffort,
    byDomain,
    ready: byStatus.ready,
    quickWins,
    dashboard: dashboardTasks,
    tasks
  };
}

/**
 * Main function
 */
function main() {
  try {
    console.log('📊 Regenerating TASKS.md index...');

    // Read TASKS.md
    if (!fs.existsSync(TASKS_FILE)) {
      console.error(`❌ Error: ${TASKS_FILE} not found`);
      process.exit(1);
    }

    const content = fs.readFileSync(TASKS_FILE, 'utf8');

    // Build index
    const index = buildIndex(content);

    // Format JSON (compact but readable)
    const indexJson = JSON.stringify(index, null, 2);

    // Create index comment
    const indexComment = `\n${INDEX_START}\n${indexJson}\n${INDEX_END}\n`;

    // Remove old index if exists
    const startIdx = content.indexOf(INDEX_START);
    const endIdx = content.indexOf(INDEX_END);

    let newContent;
    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing index
      newContent = content.substring(0, startIdx) + indexComment;
      console.log('✅ Updated existing index');
    } else {
      // Append new index
      newContent = content + indexComment;
      console.log('✅ Added new index');
    }

    // Write back to file
    fs.writeFileSync(TASKS_FILE, newContent, 'utf8');

    console.log(`\n📈 Index Stats:`);
    console.log(`   Total tasks: ${index.summary.total}`);
    console.log(`   Ready: ${index.summary.ready}`);
    console.log(`   Quick wins: ${index.quickWins.length}`);
    console.log(`   Domains: ${Object.keys(index.byDomain).length}`);
    console.log(`\n✨ Index regenerated successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { buildIndex, categorizeEffort, parsePriority, parseStatus };
