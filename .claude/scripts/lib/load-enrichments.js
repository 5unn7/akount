/**
 * Load task enrichments from domain-based file structure
 *
 * Usage:
 *   const { loadEnrichments, saveEnrichments } = require('./lib/load-enrichments');
 *
 *   // Load all enrichments
 *   const enrichments = loadEnrichments();
 *
 *   // Load enrichments for specific task
 *   const enrichment = loadEnrichments('SEC-24');
 *
 *   // Save enrichments (auto-splits by domain)
 *   saveEnrichments(enrichments);
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../../..');
const ENRICHMENTS_DIR = path.join(PROJECT_ROOT, '.claude/state/task-enrichments');
const INDEX_FILE = path.join(ENRICHMENTS_DIR, 'index.json');

/**
 * Load enrichments from new domain-based structure
 * @param {string} taskId - Optional task ID to load enrichments for specific task
 * @returns {Object} Enrichments object (all or single task)
 */
function loadEnrichments(taskId = null) {
  // Check if new structure exists
  if (!fs.existsSync(ENRICHMENTS_DIR)) {
    console.warn(`⚠️  Enrichments directory not found: ${ENRICHMENTS_DIR}`);
    console.warn('   Run: node .claude/scripts/split-task-enrichments.js');
    return {};
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.warn(`⚠️  Index file not found: ${INDEX_FILE}`);
    return {};
  }

  // Load index
  const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  const index = JSON.parse(indexContent);
  delete index.$comment;

  // Load specific task
  if (taskId) {
    const domain = index[taskId];
    if (!domain) {
      return {}; // Task not enriched
    }

    const domainFile = path.join(ENRICHMENTS_DIR, `${domain}.json`);
    if (!fs.existsSync(domainFile)) {
      console.warn(`⚠️  Domain file not found: ${domainFile}`);
      return {};
    }

    const domainData = JSON.parse(fs.readFileSync(domainFile, 'utf-8'));
    return domainData[taskId] || {};
  }

  // Load all enrichments
  const allEnrichments = {};
  const domains = Array.from(new Set(Object.values(index)));

  for (const domain of domains) {
    const domainFile = path.join(ENRICHMENTS_DIR, `${domain}.json`);
    if (fs.existsSync(domainFile)) {
      const domainData = JSON.parse(fs.readFileSync(domainFile, 'utf-8'));
      Object.assign(allEnrichments, domainData);
    }
  }

  return allEnrichments;
}

/**
 * Save enrichments to domain-based structure
 * @param {Object} enrichments - Enrichments object to save
 */
function saveEnrichments(enrichments) {
  // Ensure directory exists
  fs.mkdirSync(ENRICHMENTS_DIR, { recursive: true });

  // Load current index
  let index = {};
  if (fs.existsSync(INDEX_FILE)) {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
    index = JSON.parse(indexContent);
    delete index.$comment;
  }

  // Load existing domain files
  const domainData = {
    banking: {},
    invoicing: {},
    accounting: {},
    planning: {},
    ai: {},
    web: {},
    'cross-cutting': {},
  };

  for (const domain of Object.keys(domainData)) {
    const domainFile = path.join(ENRICHMENTS_DIR, `${domain}.json`);
    if (fs.existsSync(domainFile)) {
      domainData[domain] = JSON.parse(fs.readFileSync(domainFile, 'utf-8'));
    }
  }

  // Merge new enrichments
  for (const [taskId, enrichment] of Object.entries(enrichments)) {
    const domain = index[taskId] || inferDomain(taskId);
    domainData[domain][taskId] = enrichment;
    index[taskId] = domain;
  }

  // Write domain files
  for (const [domain, data] of Object.entries(domainData)) {
    if (Object.keys(data).length === 0) continue;

    const domainFile = path.join(ENRICHMENTS_DIR, `${domain}.json`);
    fs.writeFileSync(domainFile, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Write index
  const indexContent = {
    $comment: 'Master index mapping task IDs to domain files. Auto-generated.',
    ...index,
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexContent, null, 2), 'utf-8');
}

/**
 * Infer domain from task ID (same logic as split-task-enrichments.js)
 */
function inferDomain(taskId) {
  const match = taskId.match(/^([A-Z]+)/);
  if (!match) return 'cross-cutting';

  const prefix = match[1];

  const prefixMap = {
    BANK: 'banking',
    INV: 'invoicing',
    BILL: 'invoicing',
    CLI: 'invoicing',
    VEN: 'invoicing',
    PAY: 'invoicing',
    ACC: 'accounting',
    GL: 'accounting',
    JE: 'accounting',
    TAX: 'accounting',
    PLAN: 'planning',
    BUDG: 'planning',
    FCST: 'planning',
    GOAL: 'planning',
    AI: 'ai',
    INS: 'ai',
    RULE: 'ai',
    CAT: 'ai',
    UX: 'web',
    UI: 'web',
    FE: 'web',
  };

  if (prefixMap[prefix]) {
    return prefixMap[prefix];
  }

  return 'cross-cutting';
}

module.exports = { loadEnrichments, saveEnrichments };
