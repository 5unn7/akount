#!/usr/bin/env node

/**
 * TASKS.md Index Generator (v2)
 *
 * Parses TASKS.md markdown tables and generates:
 *   1. JSON index embedded as HTML comment in TASKS.md (v1 backward compat)
 *   2. Standalone tasks.json with enriched metadata (v2 for external apps)
 *
 * v2 additions: staleness detection, hallucination risk scoring,
 * git blame creation dates, review cross-referencing, effort normalization,
 * task claiming integration, inbox/outbox processing.
 *
 * Usage:
 *   node .claude/scripts/regenerate-task-index.js
 *   node .claude/scripts/regenerate-task-index.js --process-inbox
 *
 * Triggered by:
 *   - .claude/hooks/task-complete-sync.sh (auto on TASKS.md changes)
 *   - /processes:claim --rebuild-index (manual)
 *   - /processes:begin (session start)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const TASKS_FILE = path.join(PROJECT_ROOT, 'TASKS.md');
const TASKS_JSON_FILE = path.join(PROJECT_ROOT, 'tasks.json');
const ENRICHMENTS_FILE = path.join(PROJECT_ROOT, '.claude/task-enrichments.json');
const CLAIMS_FILE = path.join(PROJECT_ROOT, '.claude/task-claims.json');
const BLAME_CACHE_FILE = path.join(PROJECT_ROOT, '.claude/.task-blame-cache.json');
const REVIEWS_DIR = path.join(PROJECT_ROOT, 'docs/reviews');
const INBOX_FILE = path.join(PROJECT_ROOT, '.claude/task-inbox.json');
const OUTBOX_FILE = path.join(PROJECT_ROOT, '.claude/task-outbox.json');
const COUNTER_FILE = path.join(PROJECT_ROOT, '.claude/.task-id-counters.json');
const INDEX_START = '<!-- TASK-INDEX:START (auto-generated, do not edit manually)';
const INDEX_END = 'TASK-INDEX:END -->';

// Staleness thresholds by effort category (days)
const STALE_THRESHOLDS = {
  quick: 14,
  short: 10,
  medium: 7,
  long: 5,
  unknown: 10
};

// Source types that get extended staleness
const STABLE_SOURCES = ['roadmap', 'manual'];
const STABLE_SOURCE_BONUS_DAYS = 10;

// ─── Parsing Helpers ────────────────────────────────────────────────

/**
 * Parse effort string to category
 */
function categorizeEffort(effort) {
  if (!effort) return 'unknown';
  const e = effort.toLowerCase().replace(/\s+/g, '');

  if (e.match(/^(\d+)m$/) && parseInt(e) < 30) return 'quick';
  if (e === '15m' || e === '10m' || e === '5m') return 'quick';
  if (e.match(/^(\d+)m$/) && parseInt(e) >= 30) return 'short';
  if (e.match(/^(\d+)h$/) && parseInt(e) <= 2) return 'short';
  if (e.match(/30m.+2h|1.+2h/)) return 'short';
  if (e.match(/^([2-4])h$/)) return 'medium';
  if (e.match(/2.+4h|3.+4h/)) return 'medium';
  if (e.match(/^(\d+)h$/) && parseInt(e) > 4) return 'long';
  if (e.match(/[5-9]h|1\dh/)) return 'long';

  return 'unknown';
}

/**
 * Parse effort string to minutes
 */
function effortToMinutes(effort) {
  if (!effort) return null;
  const e = effort.toLowerCase().replace(/\s+/g, '');

  // Simple: "30m" -> 30
  const mMatch = e.match(/^(\d+)m$/);
  if (mMatch) return parseInt(mMatch[1]);

  // Simple: "2h" -> 120
  const hMatch = e.match(/^(\d+)h$/);
  if (hMatch) return parseInt(hMatch[1]) * 60;

  // Range: "2-4h" -> midpoint 180
  const rangeH = e.match(/(\d+)-(\d+)h/);
  if (rangeH) return Math.round((parseInt(rangeH[1]) + parseInt(rangeH[2])) / 2 * 60);

  // Range: "1-2h" -> 90
  const rangeHH = e.match(/(\d+)h?-(\d+)h/);
  if (rangeHH) return Math.round((parseInt(rangeHH[1]) + parseInt(rangeHH[2])) / 2 * 60);

  // "doc" or unknown
  if (e === 'doc') return 15;

  return null;
}

function parsePriority(priority) {
  if (!priority) return 'unknown';
  const lower = priority.toLowerCase();
  if (lower.includes('critical') || lower.includes('\u{1F534}')) return 'critical';
  if (lower.includes('high') || lower.includes('\u{1F7E0}')) return 'high';
  if (lower.includes('medium') || lower.includes('\u{1F7E1}')) return 'medium';
  if (lower.includes('low') || lower.includes('\u26AA')) return 'low';
  return 'unknown';
}

function parseStatus(status) {
  if (!status) return 'unknown';
  const lower = status.toLowerCase();
  if (lower.includes('\u{1F7E2}') || lower.includes('ready')) return 'ready';
  if (lower.includes('\u{1F512}') || lower.includes('blocked')) return 'blocked';
  if (lower.includes('\u{1F4E6}') || lower.includes('backlog')) return 'backlog';
  if (lower.includes('\u2705') || lower.includes('done')) return 'done';
  return 'unknown';
}

function extractDomain(taskId) {
  if (!taskId) return 'unknown';
  const prefix = taskId.split('-')[0].toLowerCase();
  const domainMap = {
    'sec': 'security', 'perf': 'performance', 'ux': 'ux',
    'test': 'testing', 'dry': 'code-quality', 'dev': 'development',
    'arch': 'architecture', 'fin': 'financial', 'doc': 'documentation',
    'ds': 'design-system', 'mkt': 'marketing', 'cnt': 'content',
    'infra': 'infrastructure', 'ops': 'operations', 'qual': 'quality'
  };
  return domainMap[prefix] || 'other';
}

function isDashboardTask(title) {
  if (!title) return false;
  const lower = title.toLowerCase();
  return lower.includes('dashboard') || lower.includes('sparkcard') ||
         lower.includes('leftrail') || lower.includes('rightrail') ||
         lower.includes('networth') || lower.includes('aibrief');
}

// ─── Task Row Parser ────────────────────────────────────────────────

function parseTaskRow(line, lineNumber) {
  // Match: | ID | Task | Effort | Priority | Status | Deps | Source |
  const match = line.match(/^\|\s*(?:~~)?([A-Z]+-\d+[a-z]?)(?:~~)?\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|/);
  if (!match) return null;

  const [, id, title, effort, priority, status, deps, source] = match.map(s => s.trim());

  const depsArray = [];
  const needsMatch = deps.match(/\[needs:\s*([A-Z]+-\d+[a-z]?)\]/g);
  if (needsMatch) {
    needsMatch.forEach(dep => {
      const depId = dep.match(/\[needs:\s*([A-Z]+-\d+[a-z]?)\]/);
      if (depId) depsArray.push(depId[1]);
    });
  }

  const cleanTitle = title.replace(/^~~|~~$/g, '').trim();
  const effortCategory = categorizeEffort(effort.trim());

  const task = {
    id,
    line: lineNumber,
    title: cleanTitle,
    effort: effort.trim(),
    effortMinutes: effortToMinutes(effort.trim()),
    effortCategory,
    priority: parsePriority(priority),
    status: parseStatus(status),
    deps: depsArray,
    source: source || '',
    domain: extractDomain(id),
    tags: []
  };

  if (isDashboardTask(cleanTitle)) {
    task.tags.push('dashboard');
  }

  return task;
}

// ─── Done Table Parser ──────────────────────────────────────────────

function parseDoneTable(content) {
  const done = {};
  const lines = content.split('\n');
  let inDoneSection = false;

  for (const line of lines) {
    if (line.includes('## Done (Recent)')) {
      inDoneSection = true;
      continue;
    }
    if (inDoneSection && line.startsWith('## ')) {
      break; // Next section
    }
    if (!inDoneSection) continue;

    // Match: | ✅ ID | Task | Date | Commit |
    const match = line.match(/^\|\s*✅\s*([A-Z]+-\d+[a-z]?)\s*\|([^|]+)\|([^|]+)\|([^|]*)\|/);
    if (match) {
      const [, id, title, completedAt, commit] = match.map(s => s.trim());
      done[id] = {
        title: title.trim(),
        completedAt: completedAt.trim(),
        completedCommit: commit.trim()
      };
    }
  }

  return done;
}

// ─── Git Blame for Creation Dates ───────────────────────────────────

function getBlameData() {
  // Check cache
  if (fs.existsSync(BLAME_CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(BLAME_CACHE_FILE, 'utf8'));
      const tasksMtime = fs.statSync(TASKS_FILE).mtimeMs;
      if (cache.tasksMtime === tasksMtime) {
        return cache.lineCreated;
      }
    } catch {
      // Cache invalid, regenerate
    }
  }

  const lineCreated = {};

  try {
    // Run git blame with porcelain format for structured output
    const blameOutput = execSync(
      `git blame --line-porcelain "${TASKS_FILE}"`,
      { cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' }
    );

    let currentLine = 0;
    let currentTimestamp = 0;

    for (const blameLine of blameOutput.split('\n')) {
      // Line header: <hash> <orig-line> <final-line> [<num-lines>]
      const headerMatch = blameLine.match(/^[0-9a-f]{40}\s+\d+\s+(\d+)/);
      if (headerMatch) {
        currentLine = parseInt(headerMatch[1]);
      }

      // Author timestamp
      if (blameLine.startsWith('author-time ')) {
        currentTimestamp = parseInt(blameLine.split(' ')[1]);
        if (currentLine > 0) {
          const date = new Date(currentTimestamp * 1000);
          lineCreated[currentLine] = date.toISOString().split('T')[0];
        }
      }
    }

    // Cache results
    const tasksMtime = fs.statSync(TASKS_FILE).mtimeMs;
    fs.writeFileSync(BLAME_CACHE_FILE, JSON.stringify({ tasksMtime, lineCreated }, null, 2), 'utf8');

  } catch (err) {
    console.error(`  ⚠️ Git blame failed (using fallback dates): ${err.message}`);
    // Return empty — tasks will get today's date as fallback
  }

  return lineCreated;
}

// ─── Review Cross-Reference ─────────────────────────────────────────

/**
 * Parse YAML frontmatter from a markdown file and extract anti_patterns.
 * Returns { antiPatterns: [...] } or null if no valid frontmatter found.
 */
function parseReviewFrontmatter(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1].replace(/\r\n/g, '\n');

  // Must contain anti_patterns to be useful
  if (!frontmatter.includes('anti_patterns:')) return null;

  const antiPatterns = [];
  const apBlocks = frontmatter.split(/\n  - id:/);
  for (let i = 1; i < apBlocks.length; i++) {
    const block = '  - id:' + apBlocks[i];
    const idMatch = block.match(/id:\s*(.+)/);
    const filesMatch = block.match(/files:\s*\[([^\]]+)\]/);
    const fixMatch = block.match(/fix:\s*"([^"]+)"/);
    const severityMatch = block.match(/severity:\s*(\S+)/);

    if (idMatch) {
      antiPatterns.push({
        id: idMatch[1].trim(),
        files: filesMatch ? filesMatch[1].split(',').map(f => f.trim()) : [],
        fix: fixMatch ? fixMatch[1].trim() : '',
        severity: severityMatch ? severityMatch[1].trim() : ''
      });
    }
  }

  return antiPatterns.length > 0 ? { antiPatterns } : null;
}

/**
 * Load all review data from docs/reviews/.
 * Searches both directory-based (dir/SUMMARY.md) and standalone (.md) files.
 * Indexes by review_id from frontmatter AND by filename/dirname for matching.
 */
function loadReviewData() {
  const reviewData = {};

  if (!fs.existsSync(REVIEWS_DIR)) return reviewData;

  try {
    const entries = fs.readdirSync(REVIEWS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden dirs and template
      if (entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        // Directory-based: look for SUMMARY.md
        const summaryPath = path.join(REVIEWS_DIR, entry.name, 'SUMMARY.md');
        const parsed = parseReviewFrontmatter(summaryPath);
        if (parsed) {
          reviewData[entry.name] = parsed;
        }
      } else if (entry.name.endsWith('.md')) {
        // Standalone .md file: check for frontmatter with anti_patterns
        const filePath = path.join(REVIEWS_DIR, entry.name);
        const parsed = parseReviewFrontmatter(filePath);
        if (parsed) {
          // Index by filename without extension
          const name = entry.name.replace(/\.md$/, '');
          reviewData[name] = parsed;
        }
      }
    }

    // Also scan one level deeper for any SUMMARY.md in subdirectories
    // This handles cases like docs/reviews/category/review-name/SUMMARY.md
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const subDir = path.join(REVIEWS_DIR, entry.name);
      let subEntries;
      try { subEntries = fs.readdirSync(subDir, { withFileTypes: true }); } catch { continue; }
      for (const sub of subEntries) {
        if (sub.isDirectory()) {
          const deepSummary = path.join(subDir, sub.name, 'SUMMARY.md');
          const parsed = parseReviewFrontmatter(deepSummary);
          if (parsed) {
            reviewData[sub.name] = parsed;
          }
        }
      }
    }
  } catch (err) {
    console.error(`  ⚠️ Review cross-ref failed: ${err.message}`);
  }

  return reviewData;
}

/**
 * Try to match a task to a review anti-pattern by title similarity
 */
function findMatchingAntiPattern(task, reviewAntiPatterns) {
  if (!reviewAntiPatterns || reviewAntiPatterns.length === 0) return null;

  const titleLower = task.title.toLowerCase();

  for (const ap of reviewAntiPatterns) {
    const apIdWords = ap.id.replace(/-/g, ' ').toLowerCase();
    const apFixLower = ap.fix.toLowerCase();

    // Check if task title contains keywords from anti-pattern ID or fix
    const idWords = apIdWords.split(' ').filter(w => w.length > 3);
    const matchCount = idWords.filter(w => titleLower.includes(w)).length;

    if (matchCount >= 2 || (matchCount >= 1 && titleLower.length < 60)) {
      return ap;
    }

    // Check if anti-pattern fix matches task title
    const fixWords = apFixLower.split(' ').filter(w => w.length > 4);
    const fixMatchCount = fixWords.filter(w => titleLower.includes(w)).length;
    if (fixMatchCount >= 2) {
      return ap;
    }
  }

  return null;
}

// ─── Enrichment Sidecar ─────────────────────────────────────────────

function loadEnrichments() {
  if (!fs.existsSync(ENRICHMENTS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ENRICHMENTS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// ─── Task Claims ────────────────────────────────────────────────────

function loadClaims() {
  if (!fs.existsSync(CLAIMS_FILE)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(CLAIMS_FILE, 'utf8'));
    return data.claims || {};
  } catch {
    return {};
  }
}

// ─── Staleness & Risk Scoring ───────────────────────────────────────

function computeStaleness(task, today) {
  const created = task.created ? new Date(task.created) : today;
  const lastVerified = task.lastVerified ? new Date(task.lastVerified) : created;
  const referenceDate = lastVerified > created ? lastVerified : created;

  let staleAfterDays = STALE_THRESHOLDS[task.effortCategory] || 10;

  // Stable sources (roadmap, manual) get bonus days
  if (task.source && STABLE_SOURCES.some(s => task.source.startsWith(s))) {
    staleAfterDays += STABLE_SOURCE_BONUS_DAYS;
  }

  // Manual override from enrichments
  if (task.staleAfterDays) {
    staleAfterDays = task.staleAfterDays;
  }

  const daysSinceVerified = Math.floor((today - referenceDate) / (1000 * 60 * 60 * 24));
  const isStale = daysSinceVerified > staleAfterDays;

  return {
    isStale,
    daysSinceVerified,
    staleAfterDays,
    recommendation: isStale ? 'verify_before_executing' : 'ok'
  };
}

/**
 * Check if title is "vague" — too generic for safe AI execution
 */
function isTitleVague(title) {
  if (!title) return true;
  const words = title.split(/\s+/).length;
  const hasFilePath = /[/\\]/.test(title) || /\.\w{2,4}/.test(title);
  const hasFunctionName = /[a-z][A-Z]|[A-Z][a-z].*\(/.test(title); // camelCase or function()
  const hasSpecificPattern = /`[^`]+`/.test(title); // backtick-quoted code

  // Vague = short AND no specific references
  return words < 8 && !hasFilePath && !hasFunctionName && !hasSpecificPattern;
}

function computeRisk(task) {
  let score = 0;
  const factors = [];

  // +3: Task is stale
  if (task.staleness && task.staleness.isStale) {
    score += 3;
    factors.push('age_stale');
  }

  // +2: No files identified
  if (!task.files || task.files.length === 0) {
    score += 2;
    factors.push('no_files');
  }

  // +2: Vague title
  if (isTitleVague(task.title)) {
    score += 2;
    factors.push('vague_title');
  }

  // +1: Large effort (>= 3h = 180 min)
  if (task.effortMinutes && task.effortMinutes >= 180) {
    score += 1;
    factors.push('large_effort');
  }

  // +1: No acceptance criteria
  if (!task.acceptanceCriteria || task.acceptanceCriteria.length === 0) {
    score += 1;
    factors.push('no_acceptance_criteria');
  }

  // +1: Unspecific source
  if (!task.source || task.source === 'manual' || task.source === 'roadmap') {
    score += 1;
    factors.push('source_unspecific');
  }

  let risk = 'low';
  if (score >= 6) risk = 'high';
  else if (score >= 3) risk = 'medium';

  return { hallucinationRisk: risk, riskScore: score, riskFactors: factors };
}

// ─── Build V1 Index (backward compat for TASKS.md HTML comment) ─────

function buildV1Index(allTasks) {
  const byPriority = { critical: [], high: [], medium: [], low: [] };
  const byEffort = { quick: [], short: [], medium: [], long: [] };
  const byDomain = {};
  const byStatus = { ready: [], blocked: [], backlog: [], done: [] };
  const quickWins = [];
  const dashboardTasks = [];
  const tasks = {};

  for (const task of Object.values(allTasks)) {
    tasks[task.id] = {
      line: task.line,
      title: task.title,
      effort: task.effort,
      priority: task.priority,
      status: task.status,
      deps: task.deps,
      domain: task.domain
    };

    if (byPriority[task.priority]) byPriority[task.priority].push(task.id);
    if (byEffort[task.effortCategory]) byEffort[task.effortCategory].push(task.id);
    if (!byDomain[task.domain]) byDomain[task.domain] = [];
    byDomain[task.domain].push(task.id);
    if (byStatus[task.status]) byStatus[task.status].push(task.id);

    if ((task.priority === 'high' || task.priority === 'critical') &&
        (task.effortCategory === 'quick' || task.effortCategory === 'short') &&
        task.status === 'ready') {
      quickWins.push(task.id);
    }

    if (task.tags && task.tags.includes('dashboard') && task.status === 'ready') {
      dashboardTasks.push(task.id);
    }
  }

  const allIds = Object.keys(tasks);
  return {
    version: '1.0',
    generated: new Date().toISOString(),
    summary: {
      total: allIds.length,
      ready: byStatus.ready.length,
      blocked: byStatus.blocked.length,
      backlog: byStatus.backlog.length,
      done: byStatus.done.length
    },
    byPriority, byEffort, byDomain,
    ready: byStatus.ready,
    quickWins,
    dashboard: dashboardTasks,
    tasks
  };
}

// ─── Build V2 Index (standalone tasks.json) ─────────────────────────

function buildV2Index(allTasks, doneTable, claims) {
  const today = new Date();
  const tasks = {};
  const done = {};
  const staleIds = [];
  const riskDistribution = { low: 0, medium: 0, high: 0 };
  const byDomain = {};
  const byPriority = { critical: [], high: [], medium: [], low: [] };
  const byEffort = { quick: [], short: [], medium: [], long: [] };
  const byStatus = { ready: [], blocked: [], backlog: [] };
  const quickWins = [];
  const highRisk = [];

  for (const task of Object.values(allTasks)) {
    // Skip completed tasks — they go in the done section
    if (task.status === 'done') {
      const doneInfo = doneTable[task.id] || {};
      done[task.id] = {
        id: task.id,
        title: task.title,
        domain: task.domain,
        source: task.source,
        completedAt: doneInfo.completedAt || null,
        completedCommit: doneInfo.completedCommit || null
      };
      continue;
    }

    // Compute staleness
    task.staleness = computeStaleness(task, today);

    // Compute risk
    const risk = computeRisk(task);
    task.hallucinationRisk = risk.hallucinationRisk;
    task.riskScore = risk.riskScore;
    task.riskFactors = risk.riskFactors;

    // Check claims
    const claim = claims[task.id];
    if (claim) {
      const expiresAt = new Date(claim.expiresAt);
      task.claimed = expiresAt > today;
      task.claimedBy = task.claimed ? claim.agentId : null;
    } else {
      task.claimed = false;
      task.claimedBy = null;
    }

    // Build v2 task object
    tasks[task.id] = {
      id: task.id,
      title: task.title,
      effort: task.effort,
      effortMinutes: task.effortMinutes,
      effortCategory: task.effortCategory,
      priority: task.priority,
      status: task.status,
      deps: task.deps,
      domain: task.domain,
      source: task.source,
      created: task.created || today.toISOString().split('T')[0],
      line: task.line,
      files: task.files || [],
      verification: task.verification || null,
      acceptanceCriteria: task.acceptanceCriteria || [],
      lastVerified: task.lastVerified || null,
      sourceRef: task.sourceRef || null,
      externalId: task.externalId || null,
      tags: task.tags || [],
      notes: task.notes || null,
      staleness: task.staleness,
      hallucinationRisk: task.hallucinationRisk,
      riskScore: task.riskScore,
      riskFactors: task.riskFactors,
      claimed: task.claimed,
      claimedBy: task.claimedBy
    };

    // Indexes
    if (task.staleness.isStale) staleIds.push(task.id);
    riskDistribution[task.hallucinationRisk]++;
    if (!byDomain[task.domain]) byDomain[task.domain] = [];
    byDomain[task.domain].push(task.id);
    if (byPriority[task.priority]) byPriority[task.priority].push(task.id);
    if (byEffort[task.effortCategory]) byEffort[task.effortCategory].push(task.id);
    if (byStatus[task.status]) byStatus[task.status].push(task.id);

    if ((task.priority === 'high' || task.priority === 'critical') &&
        (task.effortCategory === 'quick' || task.effortCategory === 'short') &&
        task.status === 'ready') {
      quickWins.push(task.id);
    }

    if (task.hallucinationRisk === 'high') highRisk.push(task.id);
  }

  const activeCount = Object.keys(tasks).length;
  const doneCount = Object.keys(done).length;

  return {
    $schema: './tasks.schema.json',
    version: '2.0',
    generated: today.toISOString(),
    generatedBy: 'regenerate-task-index.js',
    summary: {
      total: activeCount + doneCount,
      active: activeCount,
      done: doneCount,
      stale: staleIds.length,
      riskDistribution,
      byPriority: {
        critical: byPriority.critical.length,
        high: byPriority.high.length,
        medium: byPriority.medium.length,
        low: byPriority.low.length
      },
      byStatus: {
        ready: byStatus.ready.length,
        blocked: byStatus.blocked.length,
        backlog: byStatus.backlog.length
      }
    },
    agentInstructions: {
      low: 'Execute normally',
      medium: 'Verify the issue still exists before coding. Read affected files and confirm the problem is still present.',
      high: 'Read affected files, re-scope the task, and consider running a fresh review before starting. The codebase may have changed significantly since this task was created.'
    },
    tasks,
    done,
    indexes: {
      byDomain,
      byPriority,
      byEffort,
      byStatus,
      quickWins,
      stale: staleIds,
      highRisk
    }
  };
}

// ─── Inbox Processing ───────────────────────────────────────────────

/**
 * Process tasks from inbox.json and validate against ID counters
 * Appends validated tasks to TASKS.md and clears inbox
 */
function processTaskInbox() {
  if (!fs.existsSync(INBOX_FILE)) {
    console.log('  📭 No inbox file found - skipping inbox processing');
    return { processed: 0, errors: [] };
  }

  const inbox = JSON.parse(fs.readFileSync(INBOX_FILE, 'utf-8'));

  if (!inbox.tasks || inbox.tasks.length === 0) {
    console.log('  📭 Inbox is empty - nothing to process');
    return { processed: 0, errors: [] };
  }

  // Load counter file for validation
  let counters = null;
  if (fs.existsSync(COUNTER_FILE)) {
    counters = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf-8'));
  }

  const errors = [];
  const validTasks = [];

  console.log(`  📥 Processing ${inbox.tasks.length} tasks from inbox...`);

  for (const task of inbox.tasks) {
    // Validate required fields
    if (!task.id) {
      errors.push(`Task missing ID: ${JSON.stringify(task)}`);
      continue;
    }

    // Validate ID format
    const idMatch = task.id.match(/^([A-Z]+)-(\d+)$/);
    if (!idMatch) {
      errors.push(`Invalid ID format "${task.id}" (expected: PREFIX-NUMBER)`);
      continue;
    }

    const [, prefix, numStr] = idMatch;
    const num = parseInt(numStr, 10);

    // Validate against counter file (if available)
    if (counters && counters.counters) {
      const expectedMax = counters.counters[prefix];

      if (expectedMax !== undefined && num > expectedMax) {
        errors.push(
          `Invalid task ID ${task.id}: counter at ${prefix}-${expectedMax}. ` +
          `Run: node .claude/scripts/reserve-task-ids.js ${prefix} to reserve IDs first.`
        );
        continue;
      }
    }

    validTasks.push(task);
  }

  if (errors.length > 0) {
    console.error('\n  ❌ Inbox validation errors:');
    errors.forEach(err => console.error(`     - ${err}`));
    throw new Error(`Inbox validation failed with ${errors.length} error(s)`);
  }

  // Append valid tasks to TASKS.md
  // (Implementation would go here - for now just log)
  console.log(`  ✅ Validated ${validTasks.length} tasks from inbox`);
  console.log(`  ⚠️  Task appending to TASKS.md not yet implemented - tasks remain in inbox`);

  // TODO: Append tasks to TASKS.md in appropriate sections
  // TODO: Clear inbox after successful append

  return { processed: validTasks.length, errors };
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const processInbox = args.includes('--process-inbox');

  try {
    console.log('📊 Regenerating TASKS.md index (v2)...');

    // Process inbox first if requested
    if (processInbox) {
      console.log('\n📥 Processing task inbox...');
      const inboxResult = processTaskInbox();
      console.log(`   Processed ${inboxResult.processed} tasks\n`);
    }

    if (!fs.existsSync(TASKS_FILE)) {
      console.error(`❌ Error: ${TASKS_FILE} not found`);
      process.exit(1);
    }

    const content = fs.readFileSync(TASKS_FILE, 'utf8');
    const lines = content.split('\n');

    // ── Step 1: Parse all task rows ──
    const allTasks = {};
    lines.forEach((line, index) => {
      const task = parseTaskRow(line, index + 1);
      if (task) allTasks[task.id] = task;
    });
    console.log(`  📝 Parsed ${Object.keys(allTasks).length} tasks`);

    // ── Step 2: Parse Done table ──
    const doneTable = parseDoneTable(content);
    console.log(`  ✅ Parsed ${Object.keys(doneTable).length} completed tasks`);

    // ── Step 3: Git blame for creation dates ──
    console.log('  🔍 Loading git blame data...');
    const blameData = getBlameData();
    const blameHits = Object.keys(blameData).length;
    console.log(`  📅 Got ${blameHits} line dates from git blame`);

    for (const task of Object.values(allTasks)) {
      task.created = blameData[task.line] || new Date().toISOString().split('T')[0];
    }

    // ── Step 4: Review cross-reference ──
    console.log('  🔗 Loading review data...');
    const reviewData = loadReviewData();
    const reviewNames = Object.keys(reviewData);
    console.log(`  📋 Found ${reviewNames.length} review summaries: ${reviewNames.join(', ') || '(none)'}`);

    let crossRefHits = 0;
    for (const task of Object.values(allTasks)) {
      if (!task.source) continue;

      // Extract review name from source like "review:dashboard-overview" or "review:smooth-floating-mountain §2.2.1"
      const reviewMatch = task.source.match(/^review:([a-z0-9-]+)/);
      if (!reviewMatch) continue;

      const reviewName = reviewMatch[1];
      const review = reviewData[reviewName];
      if (!review) continue;

      const match = findMatchingAntiPattern(task, review.antiPatterns);
      if (match) {
        if (match.files.length > 0 && (!task.files || task.files.length === 0)) {
          task.files = match.files;
        }
        if (match.fix && (!task.acceptanceCriteria || task.acceptanceCriteria.length === 0)) {
          task.acceptanceCriteria = [match.fix];
        }
        task.sourceRef = `docs/reviews/${reviewName}/SUMMARY.md#${match.id}`;
        crossRefHits++;
      }
    }
    console.log(`  🎯 Cross-referenced ${crossRefHits} tasks with review findings`);

    // ── Step 5: Merge enrichment sidecar ──
    const enrichments = loadEnrichments();
    const enrichmentCount = Object.keys(enrichments).length;
    if (enrichmentCount > 0) {
      console.log(`  📦 Merging ${enrichmentCount} manual enrichments`);
      for (const [taskId, enrichment] of Object.entries(enrichments)) {
        if (allTasks[taskId]) {
          Object.assign(allTasks[taskId], enrichment);
        }
      }
    }

    // ── Step 6: Load claims ──
    const claims = loadClaims();
    const claimCount = Object.keys(claims).length;
    if (claimCount > 0) {
      console.log(`  🔒 Found ${claimCount} active claims`);
    }

    // ── Step 7: Build V1 index (backward compat) ──
    const v1Index = buildV1Index(allTasks);
    const v1Json = JSON.stringify(v1Index, null, 2);
    const indexComment = `\n${INDEX_START}\n${v1Json}\n${INDEX_END}\n`;

    const startIdx = content.indexOf(INDEX_START);
    const endIdx = content.indexOf(INDEX_END);

    let newContent;
    if (startIdx !== -1 && endIdx !== -1) {
      newContent = content.substring(0, startIdx) + indexComment;
    } else {
      newContent = content + indexComment;
    }

    fs.writeFileSync(TASKS_FILE, newContent, 'utf8');
    console.log('  ✅ Updated TASKS.md v1 index');

    // ── Step 8: Build V2 index (standalone tasks.json) ──
    const v2Index = buildV2Index(allTasks, doneTable, claims);
    fs.writeFileSync(TASKS_JSON_FILE, JSON.stringify(v2Index, null, 2), 'utf8');
    console.log('  ✅ Generated tasks.json (v2)');

    // ── Stats ──
    const summary = v2Index.summary;
    console.log(`\n📈 Index Stats:`);
    console.log(`   Total: ${summary.total} (${summary.active} active, ${summary.done} done)`);
    console.log(`   Ready: ${summary.byStatus.ready} | Blocked: ${summary.byStatus.blocked} | Backlog: ${summary.byStatus.backlog}`);
    console.log(`   Stale: ${summary.stale}`);
    console.log(`   Risk: ${summary.riskDistribution.low} low, ${summary.riskDistribution.medium} medium, ${summary.riskDistribution.high} high`);
    console.log(`   Quick wins: ${v2Index.indexes.quickWins.length}`);

    if (v2Index.indexes.highRisk.length > 0) {
      console.log(`\n⚠️  High-risk tasks (verify before executing):`);
      for (const id of v2Index.indexes.highRisk) {
        console.log(`   ${id}: ${v2Index.tasks[id].title.substring(0, 60)}...`);
      }
    }

    console.log(`\n✨ Index regenerated successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { buildV1Index, buildV2Index, categorizeEffort, parsePriority, parseStatus, effortToMinutes, isTitleVague, computeRisk };
