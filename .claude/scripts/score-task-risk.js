#!/usr/bin/env node

/**
 * Task Hallucination Risk Scorer
 *
 * Scores tasks 0-100 based on hallucination risk factors.
 * Higher score = higher risk of off-track implementation.
 *
 * Usage:
 *   node .claude/scripts/score-task-risk.js <task-id>
 *   node .claude/scripts/score-task-risk.js --all
 *   node .claude/scripts/score-task-risk.js --high-risk
 *
 * Examples:
 *   node .claude/scripts/score-task-risk.js SEC-9
 *   node .claude/scripts/score-task-risk.js --all
 *   node .claude/scripts/score-task-risk.js --high-risk
 *
 * Scoring Factors:
 *   +30 risk: No `files` array
 *   +20 risk: No `verification` command
 *   +20 risk: No `acceptanceCriteria`
 *   +15 risk: Domain doesn't match recent git history
 *   +15 risk: Effort >4h (complex tasks)
 *
 * Risk Levels:
 *   0-20: ✅ Low risk
 *   21-40: ⚠️  Medium risk
 *   41-60: ⚠️  High risk
 *   61+: 🚨 Critical risk (investigate before coding)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '../..');
const TASKS_FILE = path.join(PROJECT_ROOT, 'TASKS.md');
const ENRICHMENTS_FILE = path.join(PROJECT_ROOT, '.claude/task-enrichments.json');

// ─── Risk Scoring Weights ───────────────────────────────────────────

const WEIGHTS = {
  NO_FILES: 30,
  NO_VERIFICATION: 20,
  NO_ACCEPTANCE_CRITERIA: 20,
  DOMAIN_MISMATCH: 15,
  HIGH_EFFORT: 15,
};

// ─── Enrichment Data ────────────────────────────────────────────────

function loadEnrichments() {
  if (!fs.existsSync(ENRICHMENTS_FILE)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(ENRICHMENTS_FILE, 'utf-8'));
}

// ─── Git History Analysis ───────────────────────────────────────────

function getRecentDomains() {
  // Get file paths changed in last 30 days
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().split('T')[0];

    const changedFiles = execSync(
      `git log --since="${sinceStr}" --name-only --pretty=format: | sort -u`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    ).trim();

    // Extract domains from file paths
    const domains = new Set();
    changedFiles.split('\n').forEach(file => {
      const match = file.match(/apps\/(api|web)\/src\/.*?\/domains\/([^/]+)/);
      if (match) {
        domains.add(match[2]);
      }
    });

    return Array.from(domains);
  } catch (err) {
    // Git not available or no history
    return [];
  }
}

// ─── Task Parsing ───────────────────────────────────────────────────

function parseTasks() {
  const content = fs.readFileSync(TASKS_FILE, 'utf-8');

  // Extract task table rows (simple regex - fragile but works)
  const taskPattern = /\|\s+([A-Z]+-\d+)\s+\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/g;
  const tasks = [];
  let match;

  while ((match = taskPattern.exec(content)) !== null) {
    const [, id, title, effort, priority, status] = match.map(s => s.trim());

    tasks.push({
      id,
      title,
      effort,
      priority,
      status,
    });
  }

  return tasks;
}

// ─── Risk Scoring ───────────────────────────────────────────────────

function scoreTask(task, enrichments, recentDomains) {
  let risk = 0;
  const reasons = [];

  const enrichment = enrichments[task.id];

  // 1. No files array
  if (!enrichment || !enrichment.files || enrichment.files.length === 0) {
    risk += WEIGHTS.NO_FILES;
    reasons.push(`+${WEIGHTS.NO_FILES} risk: No files specified`);
  }

  // 2. No verification command
  if (!enrichment || !enrichment.verification) {
    risk += WEIGHTS.NO_VERIFICATION;
    reasons.push(`+${WEIGHTS.NO_VERIFICATION} risk: No verification command`);
  }

  // 3. No acceptance criteria
  if (!enrichment || !enrichment.acceptanceCriteria || enrichment.acceptanceCriteria.length === 0) {
    risk += WEIGHTS.NO_ACCEPTANCE_CRITERIA;
    reasons.push(`+${WEIGHTS.NO_ACCEPTANCE_CRITERIA} risk: No acceptance criteria`);
  }

  // 4. Domain mismatch (check if task prefix matches recent work)
  const taskPrefix = task.id.split('-')[0];
  const domainMap = {
    SEC: 'security',
    PERF: 'performance',
    UX: 'web',
    DEV: 'api',
    ARCH: 'architecture',
    FIN: 'accounting',
    TEST: 'testing',
  };

  const taskDomain = domainMap[taskPrefix];
  if (taskDomain && recentDomains.length > 0 && !recentDomains.includes(taskDomain)) {
    risk += WEIGHTS.DOMAIN_MISMATCH;
    reasons.push(`+${WEIGHTS.DOMAIN_MISMATCH} risk: Domain mismatch (no recent work in ${taskDomain})`);
  }

  // 5. High effort (>4h)
  if (task.effort.includes('>4') || task.effort.includes('4+')) {
    risk += WEIGHTS.HIGH_EFFORT;
    reasons.push(`+${WEIGHTS.HIGH_EFFORT} risk: High effort (>4h, complex task)`);
  }

  return { risk, reasons };
}

function getRiskLevel(risk) {
  if (risk <= 20) return { level: 'Low', emoji: '✅', color: 'green' };
  if (risk <= 40) return { level: 'Medium', emoji: '⚠️ ', color: 'yellow' };
  if (risk <= 60) return { level: 'High', emoji: '⚠️ ', color: 'orange' };
  return { level: 'Critical', emoji: '🚨', color: 'red' };
}

// ─── Display ────────────────────────────────────────────────────────

function printTaskRisk(task, enrichments, recentDomains) {
  const { risk, reasons } = scoreTask(task, enrichments, recentDomains);
  const { level, emoji } = getRiskLevel(risk);

  console.log(`\n${emoji} Task: ${task.id} - ${task.title}`);
  console.log(`Risk Score: ${risk}/100 (${level})`);

  if (reasons.length > 0) {
    console.log('\nRisk Factors:');
    reasons.forEach(r => console.log(`  ${r}`));
  }

  // Recommendations
  if (risk > 60) {
    console.log('\n🚨 CRITICAL RISK - Recommendations:');
    console.log('  1. Run enrichment script to auto-populate files/verification');
    console.log('  2. Manually add acceptance criteria to .claude/task-enrichments.json');
    console.log('  3. Investigate pattern before coding (Grep for similar work)');
  } else if (risk > 40) {
    console.log('\n⚠️  HIGH RISK - Recommendations:');
    console.log('  1. Add at least 1 file path to enrichment');
    console.log('  2. Define verification command');
  } else if (risk > 20) {
    console.log('\n⚠️  MEDIUM RISK - Consider adding enrichments for safer execution');
  } else {
    console.log('\n✅ LOW RISK - Task is well-specified');
  }
}

function printAllRisks(tasks, enrichments, recentDomains, highRiskOnly = false) {
  const scored = tasks.map(task => {
    const { risk, reasons } = scoreTask(task, enrichments, recentDomains);
    const { level, emoji } = getRiskLevel(risk);
    return { task, risk, level, emoji, reasons };
  });

  // Filter if high-risk only
  const filtered = highRiskOnly ? scored.filter(s => s.risk > 40) : scored;

  // Sort by risk (highest first)
  filtered.sort((a, b) => b.risk - a.risk);

  console.log('\n📊 Task Risk Report\n');

  if (filtered.length === 0) {
    console.log('✅ No tasks found (all low risk)');
    return;
  }

  console.log('ID         | Title                          | Risk   | Level');
  console.log('-----------|--------------------------------|--------|-------------');

  filtered.forEach(({ task, risk, level, emoji }) => {
    const id = task.id.padEnd(10);
    const title = task.title.substring(0, 30).padEnd(30);
    const riskStr = `${risk}/100`.padEnd(6);

    console.log(`${id} | ${title} | ${riskStr} | ${emoji} ${level}`);
  });

  // Summary stats
  console.log('\n📈 Summary:');
  console.log(`  Total tasks: ${tasks.length}`);
  console.log(`  Critical risk (61+): ${scored.filter(s => s.risk > 60).length}`);
  console.log(`  High risk (41-60): ${scored.filter(s => s.risk > 40 && s.risk <= 60).length}`);
  console.log(`  Medium risk (21-40): ${scored.filter(s => s.risk > 20 && s.risk <= 40).length}`);
  console.log(`  Low risk (0-20): ${scored.filter(s => s.risk <= 20).length}`);
}

// ─── CLI ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Task Hallucination Risk Scorer\n');
    console.log('Usage:');
    console.log('  node score-task-risk.js <task-id>');
    console.log('  node score-task-risk.js --all');
    console.log('  node score-task-risk.js --high-risk\n');
    console.log('Examples:');
    console.log('  node score-task-risk.js SEC-9');
    console.log('  node score-task-risk.js --all');
    console.log('  node score-task-risk.js --high-risk');
    process.exit(0);
  }

  const enrichments = loadEnrichments();
  const recentDomains = getRecentDomains();
  const tasks = parseTasks();

  if (args[0] === '--all') {
    printAllRisks(tasks, enrichments, recentDomains, false);
  } else if (args[0] === '--high-risk') {
    printAllRisks(tasks, enrichments, recentDomains, true);
  } else {
    // Single task lookup
    const taskId = args[0].toUpperCase();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.error(`❌ Error: Task ${taskId} not found in TASKS.md`);
      process.exit(1);
    }

    printTaskRisk(task, enrichments, recentDomains);
  }
}

// ─── Run ────────────────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = { scoreTask, getRiskLevel };
