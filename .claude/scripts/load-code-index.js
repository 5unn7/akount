#!/usr/bin/env node

/**
 * Multi-Domain Code Index Loader
 *
 * Determines which domain indexes to load based on context:
 *   1. Path-based (infer from file paths being worked on)
 *   2. Adjacency-based (auto-load related domains)
 *   3. Task-based (read domain from TASKS.md)
 *   4. Keyword-based (extract from user message)
 *
 * Usage:
 *   const { loadIndexes } = require('.claude/scripts/load-code-index');
 *
 *   // Path-based
 *   const indexes = loadIndexes({ filePaths: ['apps/api/src/domains/banking/...'] });
 *
 *   // Explicit domains
 *   const indexes = loadIndexes({ domains: ['banking', 'accounting'] });
 *
 *   // Keyword-based
 *   const indexes = loadIndexes({ keywords: ['invoice', 'payment', 'GL'] });
 *
 * Returns: { banking: {...}, accounting: {...}, ... }
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const ADJACENCY_FILE = path.join(PROJECT_ROOT, '.claude/domain-adjacency.json');
const INDEX_START = '<!-- CODE-INDEX:START';
const INDEX_END = 'CODE-INDEX:END';

// Domain to index file mapping
const DOMAIN_INDEX_MAP = {
  banking: 'CODEBASE-BANKING.md',
  invoicing: 'CODEBASE-INVOICING.md',
  accounting: 'CODEBASE-ACCOUNTING.md',
  planning: 'CODEBASE-PLANNING.md',
  ai: 'CODEBASE-AI.md',
  'web-pages': 'CODEBASE-WEB-PAGES.md',
  'web-business': 'CODEBASE-WEB-BUSINESS.md',
  'web-shared': 'CODEBASE-WEB-SHARED.md',
  'web-forms': 'CODEBASE-WEB-FORMS.md',
  packages: 'CODEBASE-PACKAGES.md',
};

// Keyword to domain mapping
const KEYWORD_MAP = {
  // Banking
  account: ['banking', 'accounting'],
  transaction: ['banking', 'accounting'],
  transfer: ['banking', 'accounting'],
  reconciliation: ['banking', 'accounting'],

  // Invoicing
  invoice: ['invoicing', 'accounting'],
  'credit note': ['invoicing', 'accounting'],

  // Clients/Vendors
  client: ['clients', 'invoicing'],
  vendor: ['vendors', 'accounting'],
  customer: ['clients', 'invoicing'],

  // Payments
  payment: ['banking', 'invoicing', 'accounting'],
  'receive payment': ['invoicing', 'banking'],
  'pay bill': ['vendors', 'banking'],

  // Accounting
  journal: ['accounting'],
  'journal entry': ['accounting'],
  'gl': ['accounting'],
  'chart of accounts': ['accounting'],
  'general ledger': ['accounting'],
  'double-entry': ['accounting'],

  // Planning
  budget: ['planning', 'accounting'],
  forecast: ['planning', 'accounting', 'banking'],
  goal: ['planning'],

  // AI
  categorization: ['ai', 'banking', 'accounting'],
  insight: ['ai'],
  rule: ['ai', 'banking'],
  'auto-categorize': ['ai', 'banking'],

  // Web UI
  component: ['web-shared', 'web-business'],
  form: ['web-forms', 'web-shared'],
  button: ['web-shared'],
  input: ['web-forms', 'web-shared'],
  modal: ['web-shared'],
  'status badge': ['web-business'],
  'entity card': ['web-business'],
  layout: ['web-shared'],
  dashboard: ['web-shared', 'web-pages'],
};

/**
 * Load adjacency matrix
 * Supports both v1 (flat arrays) and v2 (semantic relationships) formats
 */
function loadAdjacencyMatrix() {
  if (!fs.existsSync(ADJACENCY_FILE)) {
    console.warn('⚠️  Adjacency matrix not found, using empty matrix');
    return {};
  }

  const content = fs.readFileSync(ADJACENCY_FILE, 'utf-8');
  const data = JSON.parse(content);

  // V2 format (semantic relationships)
  if (data.relationships) {
    const flatMatrix = {};
    for (const [domain, relationships] of Object.entries(data.relationships)) {
      // Skip domains with only _note (they have no relationships)
      if (typeof relationships === 'object' && !relationships._note) {
        flatMatrix[domain] = Object.keys(relationships).filter(key => !key.startsWith('_'));
      } else {
        flatMatrix[domain] = [];
      }
    }
    return flatMatrix;
  }

  // V1 format (flat arrays) - backward compatibility
  delete data.$comment;
  delete data._rationale;
  delete data.version;
  delete data.lastUpdated;

  return data;
}

/**
 * Infer domains from file paths
 */
function inferDomainsFromPaths(filePaths) {
  const domains = new Set();

  for (const filePath of filePaths) {
    if (filePath.includes('/banking/')) domains.add('banking');
    if (filePath.includes('/invoicing/')) domains.add('invoicing');
    if (filePath.includes('/clients/')) domains.add('clients');
    if (filePath.includes('/vendors/')) domains.add('vendors');
    if (filePath.includes('/accounting/')) domains.add('accounting');
    if (filePath.includes('/planning/')) domains.add('planning');
    if (filePath.includes('/ai/')) domains.add('ai');
    if (filePath.includes('/app/(dashboard)/')) domains.add('web-pages');
    if (filePath.includes('/components/') || filePath.includes('/lib/')) domains.add('web-components');
    if (filePath.includes('packages/')) domains.add('packages');
  }

  return Array.from(domains);
}

/**
 * Infer domains from keywords
 */
function inferDomainsFromKeywords(text) {
  const domains = new Set();
  const lowerText = text.toLowerCase();

  for (const [keyword, relatedDomains] of Object.entries(KEYWORD_MAP)) {
    if (lowerText.includes(keyword)) {
      for (const domain of relatedDomains) {
        domains.add(domain);
      }
    }
  }

  return Array.from(domains);
}

/**
 * Expand domains with adjacency
 */
function expandWithAdjacency(domains) {
  const adjacency = loadAdjacencyMatrix();
  const expanded = new Set(domains);

  for (const domain of domains) {
    const adjacent = adjacency[domain] || [];
    for (const adj of adjacent) {
      expanded.add(adj);
    }
  }

  return Array.from(expanded);
}

/**
 * Load a single domain index
 */
function loadDomainIndex(domainKey) {
  const indexFile = DOMAIN_INDEX_MAP[domainKey];
  if (!indexFile) {
    console.warn(`⚠️  Unknown domain: ${domainKey}`);
    return null;
  }

  const indexPath = path.join(PROJECT_ROOT, indexFile);
  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️  Index not found: ${indexFile}`);
    console.warn(`   Run: node .claude/scripts/regenerate-code-index.js --domains "${domainKey}"`);
    return null;
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Find START and END markers
    const startIdx = content.indexOf(INDEX_START);
    if (startIdx === -1) {
      console.warn(`⚠️  No index found in ${indexFile}`);
      return null;
    }

    const startLineEnd = content.indexOf('\n', startIdx);
    const endIdx = content.indexOf(INDEX_END);

    if (endIdx === -1) {
      console.warn(`⚠️  Malformed index in ${indexFile}`);
      return null;
    }

    // Extract JSON
    const jsonText = content.substring(startLineEnd + 1, endIdx).trim();
    const index = JSON.parse(jsonText);

    return index;
  } catch (error) {
    console.error(`❌ Error loading ${indexFile}:`, error.message);
    return null;
  }
}

/**
 * Main: Load relevant indexes based on context
 */
function loadIndexes(options = {}) {
  const {
    filePaths = [],
    domains: explicitDomains = [],
    keywords = '',
    maxDomains = 3,
    includeAdjacency = true,
  } = options;

  let domainsToLoad = new Set();

  // Strategy 1: Explicit domains (highest priority)
  if (explicitDomains.length > 0) {
    for (const domain of explicitDomains) {
      domainsToLoad.add(domain);
    }
  }

  // Strategy 2: Path-based
  if (filePaths.length > 0) {
    const pathDomains = inferDomainsFromPaths(filePaths);
    for (const domain of pathDomains) {
      domainsToLoad.add(domain);
    }
  }

  // Strategy 3: Keyword-based (fallback)
  if (domainsToLoad.size === 0 && keywords) {
    const keywordDomains = inferDomainsFromKeywords(keywords);
    for (const domain of keywordDomains) {
      domainsToLoad.add(domain);
    }
  }

  // Strategy 4: Adjacency expansion
  if (includeAdjacency && domainsToLoad.size > 0) {
    const expanded = expandWithAdjacency(Array.from(domainsToLoad));
    domainsToLoad = new Set(expanded);
  }

  // Safety limit
  const finalDomains = Array.from(domainsToLoad).slice(0, maxDomains);

  if (finalDomains.length > maxDomains) {
    console.warn(`⚠️  Too many domains (${domainsToLoad.size}), limited to ${maxDomains}`);
  }

  // Load indexes
  const indexes = {};
  let totalTokens = 0;

  for (const domain of finalDomains) {
    const index = loadDomainIndex(domain);
    if (index) {
      indexes[domain] = index;

      // Estimate tokens (rough: JSON length / 4)
      const tokens = Math.ceil(JSON.stringify(index).length / 4);
      totalTokens += tokens;

      console.log(`✓ Loaded ${domain} index (${index.n} files, ~${tokens} tokens)`);
    }
  }

  console.log(`\n📊 Loaded ${Object.keys(indexes).length} domain indexes`);
  console.log(`   Total tokens: ~${totalTokens.toLocaleString()}`);
  console.log(`   Context usage: ${(totalTokens / 1000000 * 100).toFixed(2)}%`);

  return indexes;
}

/**
 * CLI usage
 */
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node load-code-index.js --domains "banking accounting"');
    console.log('  node load-code-index.js --paths "apps/api/src/domains/banking/..."');
    console.log('  node load-code-index.js --keywords "invoice payment GL"');
    process.exit(1);
  }

  const domainsArg = args.find(a => a.startsWith('--domains'));
  const pathsArg = args.find(a => a.startsWith('--paths'));
  const keywordsArg = args.find(a => a.startsWith('--keywords'));

  const options = {};

  if (domainsArg) {
    const domainList = domainsArg.split('=')[1] || args[args.indexOf(domainsArg) + 1] || '';
    options.domains = domainList.split(/[\s,]+/).filter(Boolean);
  }

  if (pathsArg) {
    const pathList = pathsArg.split('=')[1] || args[args.indexOf(pathsArg) + 1] || '';
    options.filePaths = pathList.split(/[\s,]+/).filter(Boolean);
  }

  if (keywordsArg) {
    const keywordText = keywordsArg.split('=')[1] || args[args.indexOf(keywordsArg) + 1] || '';
    options.keywords = keywordText;
  }

  console.log('🔍 Multi-Domain Index Loader\n');
  console.log('Input:');
  if (options.domains) console.log(`  Domains: ${options.domains.join(', ')}`);
  if (options.filePaths) console.log(`  Paths: ${options.filePaths.length} files`);
  if (options.keywords) console.log(`  Keywords: ${options.keywords}`);
  console.log();

  const indexes = loadIndexes(options);

  console.log('\n✅ Indexes loaded successfully!');
  console.log(`   Available domains: ${Object.keys(indexes).join(', ')}`);
}

module.exports = { loadIndexes, inferDomainsFromPaths, inferDomainsFromKeywords };
