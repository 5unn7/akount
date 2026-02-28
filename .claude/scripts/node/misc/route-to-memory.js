#!/usr/bin/env node

/**
 * Route to Memory Script
 *
 * Reads .claude/session-patterns.json and routes patterns to appropriate MEMORY topic files
 * - bug-fix → debugging-log.md
 * - new-utility, cross-domain → api-patterns.md
 * - new-component, schema-change → codebase-quirks.md
 * - performance → debugging-log.md (Performance section)
 *
 * Deduplicates using fuzzy matching and appends only new patterns.
 */

const fs = require('fs');
const path = require('path');

const PATTERN_FILE = '.claude/session-patterns.json';
const MEMORY_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE,
  '.claude',
  'projects',
  'w--Marakana-Corp-Companies-akount-Development-Brand-aggoogle-product-plan',
  'memory'
);

const TOPIC_FILES = {
  'debugging-log.md': path.join(MEMORY_DIR, 'debugging-log.md'),
  'api-patterns.md': path.join(MEMORY_DIR, 'api-patterns.md'),
  'codebase-quirks.md': path.join(MEMORY_DIR, 'codebase-quirks.md'),
};

// Routing rules
const ROUTING_MAP = {
  'bug-fix': 'debugging-log.md',
  'new-utility': 'api-patterns.md',
  'cross-domain': 'api-patterns.md',
  'new-component': 'codebase-quirks.md',
  'schema-change': 'api-patterns.md',
  'performance': 'debugging-log.md',
  'new-test': null, // Don't route test additions to memory
};

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshtein(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1.0 - distance / maxLen;
}

/**
 * Check if pattern is duplicate of existing content
 */
function isDuplicate(pattern, existingContent) {
  const patternDesc = pattern.description.toLowerCase();

  // Extract existing pattern descriptions from content
  const existingPatterns = existingContent
    .split('\n')
    .filter(line => line.startsWith('- ') || line.startsWith('  - '))
    .map(line => line.replace(/^- \*\*\d{4}-\d{2}-\d{2}\*\* /, '').replace(/^  - /, '').toLowerCase());

  // Check fuzzy similarity
  for (const existing of existingPatterns) {
    if (similarity(patternDesc, existing) > 0.75) {
      return true;
    }

    // Also check keyword overlap
    const patternWords = new Set(patternDesc.split(/\s+/).filter(w => w.length > 3));
    const existingWords = new Set(existing.split(/\s+/).filter(w => w.length > 3));
    const intersection = [...patternWords].filter(w => existingWords.has(w));

    if (intersection.length / patternWords.size > 0.6) {
      return true;
    }
  }

  return false;
}

/**
 * Format pattern as markdown entry
 */
function formatPattern(pattern, date) {
  const files = pattern.files ? pattern.files.slice(0, 3).join(', ') : '';
  const filesText = files ? ` — ${files}` : '';
  const exports = pattern.exports && pattern.exports.length > 0 ? ` (exports: ${pattern.exports.join(', ')})` : '';

  return `- **${date}** ${pattern.description}${filesText}${exports}`;
}

/**
 * Append pattern to topic file
 */
function appendToFile(filePath, content) {
  let existing = '';

  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, 'utf-8');
  } else {
    // Create file with header
    const fileName = path.basename(filePath);
    existing = `# ${fileName.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}\n\n_Auto-managed by route-to-memory.js_\n\n---\n\n`;
  }

  // Find insertion point (before "Last updated" footer if exists, otherwise end)
  const footerMatch = existing.match(/\n_Last updated:.*$/);
  const insertionPoint = footerMatch ? existing.indexOf(footerMatch[0]) : existing.length;

  const updated = existing.slice(0, insertionPoint) + '\n' + content + '\n' + existing.slice(insertionPoint);

  fs.writeFileSync(filePath, updated, 'utf-8');
}

/**
 * Route patterns to memory topic files
 */
function routePatterns() {
  if (!fs.existsSync(PATTERN_FILE)) {
    console.log('No session-patterns.json found. Run extract-session-patterns.js first.');
    return;
  }

  const data = JSON.parse(fs.readFileSync(PATTERN_FILE, 'utf-8'));
  const patterns = data.patterns || [];
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let routed = 0;
  let duplicates = 0;
  let skipped = 0;

  console.log(`📋 Found ${patterns.length} pattern(s) to route`);

  for (const pattern of patterns) {
    const targetFile = ROUTING_MAP[pattern.type];

    if (!targetFile) {
      console.log(`⏭️  Skipped pattern type: ${pattern.type}`);
      skipped++;
      continue;
    }

    const filePath = TOPIC_FILES[targetFile];

    // Check for duplicates
    let existing = '';
    if (fs.existsSync(filePath)) {
      existing = fs.readFileSync(filePath, 'utf-8');
    }

    if (isDuplicate(pattern, existing)) {
      console.log(`⏭️  Duplicate detected: "${pattern.description.slice(0, 50)}..." — skipping`);
      duplicates++;
      continue;
    }

    // Append pattern
    const entry = formatPattern(pattern, date);
    appendToFile(filePath, entry);

    console.log(`✅ Routed to ${targetFile}: "${pattern.description.slice(0, 60)}..."`);
    routed++;
  }

  console.log('');
  console.log('📊 Routing Summary:');
  console.log(`   Routed: ${routed}`);
  console.log(`   Duplicates: ${duplicates}`);
  console.log(`   Skipped: ${skipped}`);
}

// Main execution
try {
  routePatterns();
} catch (error) {
  console.error('Error routing patterns to memory:', error);
  process.exit(1);
}

module.exports = { routePatterns, isDuplicate, formatPattern };
