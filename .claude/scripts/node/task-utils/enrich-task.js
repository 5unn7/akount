#!/usr/bin/env node

/**
 * Task Auto-Enrichment Script
 *
 * Auto-populates task enrichments (files, verification, acceptance criteria)
 * from git history, task descriptions, and domain patterns.
 *
 * Usage:
 *   node .claude/scripts/enrich-task.js <task-id>
 *   node .claude/scripts/enrich-task.js --all
 *   node .claude/scripts/enrich-task.js --domain banking
 *   node .claude/scripts/enrich-task.js --dry-run <task-id>
 *
 * Examples:
 *   node .claude/scripts/enrich-task.js DEV-121
 *   node .claude/scripts/enrich-task.js --all --dry-run
 *   node .claude/scripts/enrich-task.js --domain accounting
 *
 * Auto-enrichment sources:
 *   1. Git history: Most-changed files in task's domain (last 30 days)
 *   2. Task type: Generate verification commands based on prefix/description
 *   3. Description parsing: Extract "should", "must", "needs to" as criteria
 *   4. Domain patterns: Apply known patterns for banking, accounting, etc.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getProjectRoot } = require('../../lib/project-root');
const { loadEnrichments, saveEnrichments } = require('../../lib/load-enrichments');

const PROJECT_ROOT = getProjectRoot(__dirname);
const TASKS_FILE = path.join(PROJECT_ROOT, 'TASKS.md');

// ─── Domain Mapping ─────────────────────────────────────────────────

const DOMAIN_MAP = {
  // Dev domains
  SEC: 'security',
  PERF: 'performance',
  UX: 'web',
  DEV: 'api',
  ARCH: 'architecture',
  FIN: 'accounting',
  TEST: 'testing',
  DRY: 'refactoring',
  DOC: 'documentation',

  // Design system
  DS: 'design-system',

  // Marketing & Content
  MKT: 'marketing',
  CNT: 'content',

  // Operations
  INFRA: 'infrastructure',
  OPS: 'operations',
};

const DOMAIN_PATHS = {
  banking: ['apps/api/src/domains/banking/', 'apps/web/src/app/(dashboard)/banking/'],
  invoicing: ['apps/api/src/domains/invoicing/', 'apps/web/src/app/(dashboard)/business/invoices/'],
  clients: ['apps/api/src/domains/clients/', 'apps/web/src/app/(dashboard)/business/clients/'],
  vendors: ['apps/api/src/domains/vendors/', 'apps/web/src/app/(dashboard)/business/vendors/'],
  accounting: ['apps/api/src/domains/accounting/', 'apps/web/src/app/(dashboard)/accounting/'],
  planning: ['apps/api/src/domains/planning/', 'apps/web/src/app/(dashboard)/planning/'],
  insights: ['apps/api/src/domains/ai/', 'apps/web/src/app/(dashboard)/insights/'],
  overview: ['apps/api/src/domains/overview/', 'apps/web/src/app/(dashboard)/overview/'],
  security: ['apps/api/src/middleware/', 'apps/api/src/lib/'],
  testing: ['apps/api/src/__tests__/', 'apps/web/src/__tests__/'],
  performance: ['apps/api/src/', 'apps/web/src/'],
  infrastructure: ['.github/', 'docker-compose.yml', 'Dockerfile'],
  'design-system': ['packages/ui/', 'packages/design-tokens/'],
};

// ─── Git History Analysis ───────────────────────────────────────────

function getRecentFilesByDomain(domain, days = 30) {
  const paths = DOMAIN_PATHS[domain];
  if (!paths) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  try {
    const allChangedFiles = execSync(
      `git log --since="${sinceStr}" --name-only --pretty=format: -- ${paths.join(' ')}`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    ).trim();

    if (!allChangedFiles) return [];

    // Count occurrences
    const fileCounts = {};
    allChangedFiles.split('\n').forEach(file => {
      if (file.trim()) {
        fileCounts[file] = (fileCounts[file] || 0) + 1;
      }
    });

    // Sort by frequency
    const sorted = Object.entries(fileCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([file]) => file);

    // Return top 5
    return sorted.slice(0, 5);
  } catch (err) {
    // Git not available or no history
    return [];
  }
}

// ─── Verification Command Generation ────────────────────────────────

function generateVerification(task) {
  const prefix = task.id.split('-')[0];
  const title = task.title.toLowerCase();

  // Test tasks
  if (prefix === 'TEST' || title.includes('test')) {
    if (title.includes('e2e')) {
      return 'Run: npm run test:e2e';
    }
    if (title.includes('integration')) {
      return 'Run: npm test -- --testPathPattern=integration';
    }
    return 'Run: npm test';
  }

  // Security tasks
  if (prefix === 'SEC') {
    if (title.includes('csrf')) {
      return "Grep 'csrf' apps/api/src/ && check middleware";
    }
    if (title.includes('rate limit')) {
      return "Grep 'rate.*limit' apps/api/src/middleware/";
    }
    if (title.includes('auth')) {
      return "Grep 'auth' apps/api/src/middleware/ && test protected routes";
    }
    return 'Review security middleware and run security tests';
  }

  // Performance tasks
  if (prefix === 'PERF') {
    if (title.includes('index')) {
      return "Check: git diff HEAD~1 packages/db/prisma/schema.prisma | grep '@@index'";
    }
    if (title.includes('bundle')) {
      return 'Run: cd apps/web && npx next build --debug';
    }
    if (title.includes('cache')) {
      return "Grep 'cache' apps/api/src/ && test cache hit rate";
    }
    return 'Run performance benchmarks';
  }

  // API/Backend tasks
  if (prefix === 'DEV' && (title.includes('api') || title.includes('service') || title.includes('route'))) {
    return 'Run: cd apps/api && npm test -- [domain]';
  }

  // Frontend tasks
  if (prefix === 'UX' || title.includes('page') || title.includes('component')) {
    return 'Check: Navigate to page in browser, verify UI renders correctly';
  }

  // Infrastructure tasks
  if (prefix === 'INFRA') {
    if (title.includes('ci') || title.includes('pipeline')) {
      return 'Check: .github/workflows/ exists and runs successfully';
    }
    if (title.includes('docker')) {
      return 'Run: docker-compose build && docker-compose up';
    }
    return 'Verify infrastructure configuration';
  }

  // Generic fallback
  return `Grep for related code: Grep "${task.id.split('-')[0].toLowerCase()}" apps/`;
}

// ─── Acceptance Criteria Extraction ─────────────────────────────────

function extractAcceptanceCriteria(task) {
  const criteria = [];
  const description = task.title.toLowerCase();

  // Look for modal verbs
  const modalPatterns = [
    /must (.+?)(?:\.|$|—)/gi,
    /should (.+?)(?:\.|$|—)/gi,
    /needs to (.+?)(?:\.|$|—)/gi,
    /requires (.+?)(?:\.|$|—)/gi,
  ];

  modalPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(task.title)) !== null) {
      criteria.push(match[1].trim());
    }
  });

  // Extract features from comma-separated lists
  if (description.includes(',')) {
    const parts = task.title.split(/[,—]/).filter(p => p.trim().length > 10);
    if (parts.length > 1) {
      parts.forEach(part => {
        const cleaned = part.trim().replace(/^(add|build|create|implement|wire)\s+/i, '');
        if (cleaned.length > 5) {
          criteria.push(cleaned);
        }
      });
    }
  }

  // Domain-specific criteria
  if (description.includes('journal entry')) {
    criteria.push('Debits equal credits (double-entry validation)');
    criteria.push('Source document preserved');
  }

  if (description.includes('invoice') || description.includes('bill')) {
    criteria.push('Amount stored as integer cents');
    criteria.push('Soft delete implemented (deletedAt field)');
  }

  if (description.includes('test')) {
    criteria.push('All test assertions pass');
    criteria.push('Coverage maintained or improved');
  }

  if (description.includes('page') || description.includes('ui')) {
    criteria.push('Page renders without errors');
    criteria.push('Loading and error states implemented');
  }

  // Fallback: split on dashes and extract main features
  if (criteria.length === 0) {
    const dashParts = task.title.split('—').filter(p => p.trim().length > 10);
    if (dashParts.length > 1) {
      dashParts.slice(1).forEach(part => {
        criteria.push(part.trim());
      });
    }
  }

  // Limit to 5 criteria
  return criteria.slice(0, 5);
}

// ─── Task Parsing ───────────────────────────────────────────────────

function parseTasks() {
  const content = fs.readFileSync(TASKS_FILE, 'utf-8');

  // Extract task table rows
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

// ─── Domain Detection ───────────────────────────────────────────────

function detectDomain(task) {
  const prefix = task.id.split('-')[0];
  const baseDomain = DOMAIN_MAP[prefix];

  // Check task title for specific domains
  const title = task.title.toLowerCase();

  if (title.includes('banking') || title.includes('account') || title.includes('transaction')) {
    return 'banking';
  }
  if (title.includes('invoice') || title.includes('client')) {
    return 'invoicing';
  }
  if (title.includes('bill') || title.includes('vendor')) {
    return 'vendors';
  }
  if (title.includes('accounting') || title.includes('journal') || title.includes('gl ') || title.includes('chart of accounts')) {
    return 'accounting';
  }
  if (title.includes('planning') || title.includes('budget') || title.includes('goal') || title.includes('forecast')) {
    return 'planning';
  }
  if (title.includes('insights') || title.includes('ai ') || title.includes('chat')) {
    return 'insights';
  }
  if (title.includes('overview') || title.includes('dashboard')) {
    return 'overview';
  }

  return baseDomain || 'web';
}

// ─── Enrichment Generation ──────────────────────────────────────────

function generateEnrichment(task) {
  const domain = detectDomain(task);
  const files = getRecentFilesByDomain(domain);
  const verification = generateVerification(task);
  const acceptanceCriteria = extractAcceptanceCriteria(task);

  // Add domain-specific files if git history is empty
  if (files.length === 0 && DOMAIN_PATHS[domain]) {
    DOMAIN_PATHS[domain].slice(0, 2).forEach(p => files.push(p));
  }

  return {
    files,
    verification,
    acceptanceCriteria,
    tags: [domain, task.id.split('-')[0].toLowerCase()],
    autoGenerated: true,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Enrichment File Management ─────────────────────────────────────
// (loadEnrichments and saveEnrichments now imported from lib/load-enrichments.js)

// ─── Enrichment Logic ───────────────────────────────────────────────

function enrichTask(task, enrichments, dryRun = false) {
  // Skip if manually enriched (not auto-generated)
  if (enrichments[task.id] && !enrichments[task.id].autoGenerated) {
    console.log(`⏭️  Skipping ${task.id} (manually enriched)`);
    return false;
  }

  const enrichment = generateEnrichment(task);

  console.log(`\n🔍 Enriching ${task.id}: ${task.title.substring(0, 50)}...`);
  console.log(`   Domain: ${detectDomain(task)}`);
  console.log(`   Files (${enrichment.files.length}): ${enrichment.files.slice(0, 3).join(', ')}`);
  console.log(`   Verification: ${enrichment.verification.substring(0, 60)}...`);
  console.log(`   Criteria (${enrichment.acceptanceCriteria.length}): ${enrichment.acceptanceCriteria.slice(0, 2).join('; ')}`);

  if (!dryRun) {
    enrichments[task.id] = enrichment;
    return true;
  }

  return false;
}

// ─── CLI ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('Task Auto-Enrichment Script\n');
    console.log('Usage:');
    console.log('  node enrich-task.js <task-id>');
    console.log('  node enrich-task.js --all [--dry-run]');
    console.log('  node enrich-task.js --domain <domain> [--dry-run]');
    console.log('  node enrich-task.js --high-risk [--dry-run]\n');
    console.log('Examples:');
    console.log('  node enrich-task.js DEV-121');
    console.log('  node enrich-task.js --all --dry-run');
    console.log('  node enrich-task.js --domain accounting');
    console.log('  node enrich-task.js --high-risk');
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const tasks = parseTasks();
  const enrichments = loadEnrichments();

  let tasksToEnrich = [];

  if (args[0] === '--all') {
    tasksToEnrich = tasks;
  } else if (args[0] === '--domain') {
    const domain = args[1];
    tasksToEnrich = tasks.filter(t => detectDomain(t) === domain);
    console.log(`\n📂 Enriching tasks in domain: ${domain} (${tasksToEnrich.length} tasks)`);
  } else if (args[0] === '--high-risk') {
    // Enrich tasks with no enrichments or auto-generated only
    tasksToEnrich = tasks.filter(t => !enrichments[t.id] || enrichments[t.id].autoGenerated);
    console.log(`\n⚠️  Enriching high-risk tasks (${tasksToEnrich.length} tasks)`);
  } else {
    // Single task
    const taskId = args[0].toUpperCase();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      console.error(`❌ Error: Task ${taskId} not found in TASKS.md`);
      process.exit(1);
    }

    tasksToEnrich = [task];
  }

  let enrichedCount = 0;

  tasksToEnrich.forEach(task => {
    if (enrichTask(task, enrichments, dryRun)) {
      enrichedCount++;
    }
  });

  if (!dryRun && enrichedCount > 0) {
    saveEnrichments(enrichments);
    console.log(`\n✅ Enriched ${enrichedCount} tasks`);
    console.log(`📄 Updated: .claude/state/task-enrichments/ (domain files)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review enrichments in .claude/task-enrichments.json');
    console.log('   2. Run: node .claude/scripts/score-task-risk.js --all');
    console.log('   3. Expect risk score reduction: 243 → ~50 critical tasks');
  } else if (dryRun) {
    console.log(`\n🔍 Dry run complete: ${enrichedCount} tasks would be enriched`);
    console.log('   Remove --dry-run to apply changes');
  } else {
    console.log('\n✅ No tasks needed enrichment');
  }
}

// ─── Run ────────────────────────────────────────────────────────────

if (require.main === module) {
  main();
}

module.exports = { generateEnrichment, detectDomain };
