#!/usr/bin/env node

/**
 * SPIKE: Code Index Prototype
 *
 * Minimal version to validate:
 * 1. Can we extract meaningful metadata from TS files?
 * 2. What's the token count for N files?
 * 3. Will 642 files fit in <20K tokens?
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

// Sample files from different domains (10 files)
const SAMPLE_FILES = [
  'apps/api/src/domains/banking/services/account.service.ts',
  'apps/api/src/domains/banking/routes/accounts.ts',
  'apps/api/src/domains/invoicing/services/invoice.service.ts',
  'apps/api/src/domains/accounting/services/journal-entry.service.ts',
  'apps/web/src/lib/utils/currency.ts',
  'apps/web/src/lib/utils/date.ts',
  'apps/web/src/app/(dashboard)/banking/accounts/page.tsx',
  'apps/web/src/components/shared/DomainTabs.tsx',
  'packages/ui/src/components/ui/button.tsx',
  'packages/db/prisma/seed.ts',
];

/**
 * Extract metadata from a TypeScript file
 */
function analyzeFile(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  // Extract exports (functions, classes, consts)
  const exports = [];
  const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|interface|type)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Extract imports
  const imports = [];
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Detect patterns
  const patterns = [];
  if (content.includes('tenantId') && content.includes('where')) {
    patterns.push('tenant-isolation');
  }
  if (content.includes('deletedAt') && content.includes('IS NULL')) {
    patterns.push('soft-delete');
  }
  if (content.includes('request.log') || content.includes('server.log')) {
    patterns.push('pino-logging');
  }
  if (content.includes('prisma.')) {
    patterns.push('prisma');
  }
  if (content.includes("'use client'")) {
    patterns.push('client-component');
  }
  if (content.includes('async function') && !content.includes("'use client'")) {
    patterns.push('server-component');
  }

  // Detect violations
  const violations = [];

  // Inline formatCurrency (not imported from canonical)
  if (content.match(/function formatCurrency\s*\(/)) {
    violations.push('inline-formatCurrency');
  }

  // Hardcoded colors
  if (content.match(/text-\[#|bg-\[#|bg-\[rgba/)) {
    violations.push('hardcoded-color');
  }

  // console.log in production
  if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('seed')) {
    violations.push('console-log');
  }

  // : any type
  if (content.match(/:\s*any[^a-zA-Z]/)) {
    violations.push('any-type');
  }

  // Determine domain
  let domain = 'unknown';
  if (filePath.includes('/banking/')) domain = 'banking';
  else if (filePath.includes('/invoicing/')) domain = 'invoicing';
  else if (filePath.includes('/accounting/')) domain = 'accounting';
  else if (filePath.includes('/planning/')) domain = 'planning';
  else if (filePath.includes('/ai/')) domain = 'ai';
  else if (filePath.includes('/system/')) domain = 'system';
  else if (filePath.includes('/web/src/app/')) domain = 'web-pages';
  else if (filePath.includes('/web/src/lib/')) domain = 'web-utils';
  else if (filePath.includes('/web/src/components/')) domain = 'web-components';
  else if (filePath.includes('packages/ui/')) domain = 'ui';
  else if (filePath.includes('packages/db/')) domain = 'db';

  return {
    path: filePath,
    domain,
    exports: exports.slice(0, 5), // Limit to first 5
    imports: imports.slice(0, 5), // Limit to first 5
    patterns,
    violations,
    loc: lines.length,
  };
}

/**
 * Build index from sample files
 */
function buildIndex() {
  const index = {
    generated: new Date().toISOString(),
    fileCount: 0,
    services: {},
    routes: {},
    pages: {},
    components: {},
    utils: {},
    other: {},
    domains: {},
    patterns: {},
    violations: {},
  };

  for (const filePath of SAMPLE_FILES) {
    const metadata = analyzeFile(filePath);

    if (!metadata) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    index.fileCount++;

    // Categorize by file type
    const fileName = path.basename(filePath);
    let category;

    if (fileName.endsWith('.service.ts')) {
      category = 'services';
    } else if (fileName.endsWith('.routes.ts') || fileName.endsWith('routes.ts')) {
      category = 'routes';
    } else if (fileName === 'page.tsx') {
      category = 'pages';
    } else if (filePath.includes('/components/')) {
      category = 'components';
    } else if (filePath.includes('/utils/') || filePath.includes('/lib/')) {
      category = 'utils';
    } else {
      category = 'other';
    }

    index[category][fileName] = metadata;

    // Track domain stats
    if (!index.domains[metadata.domain]) {
      index.domains[metadata.domain] = { files: 0, loc: 0 };
    }
    index.domains[metadata.domain].files++;
    index.domains[metadata.domain].loc += metadata.loc;

    // Track patterns
    for (const pattern of metadata.patterns) {
      if (!index.patterns[pattern]) {
        index.patterns[pattern] = [];
      }
      index.patterns[pattern].push(fileName);
    }

    // Track violations
    for (const violation of metadata.violations) {
      if (!index.violations[violation]) {
        index.violations[violation] = [];
      }
      index.violations[violation].push({ file: fileName, path: filePath });
    }
  }

  return index;
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars)
 */
function estimateTokens(json) {
  const jsonString = JSON.stringify(json, null, 2);
  const chars = jsonString.length;
  const tokens = Math.ceil(chars / 4);
  return { chars, tokens };
}

/**
 * Extrapolate to full codebase
 */
function extrapolate(sampleStats, sampleCount, totalCount) {
  const ratio = totalCount / sampleCount;
  return {
    estimatedTokens: Math.ceil(sampleStats.tokens * ratio),
    estimatedChars: Math.ceil(sampleStats.chars * ratio),
  };
}

// ─── Main ───────────────────────────────────────────────────────

console.log('🔬 SPIKE 1: Code Index Prototype\n');
console.log(`Scanning ${SAMPLE_FILES.length} sample files...\n`);

const index = buildIndex();
const stats = estimateTokens(index);

console.log('📊 Sample Index Stats:');
console.log(`  Files scanned: ${index.fileCount}`);
console.log(`  Services: ${Object.keys(index.services).length}`);
console.log(`  Routes: ${Object.keys(index.routes).length}`);
console.log(`  Pages: ${Object.keys(index.pages).length}`);
console.log(`  Components: ${Object.keys(index.components).length}`);
console.log(`  Utils: ${Object.keys(index.utils).length}`);
console.log(`  Domains: ${Object.keys(index.domains).length}`);
console.log(`  Patterns detected: ${Object.keys(index.patterns).length}`);
console.log(`  Violations found: ${Object.keys(index.violations).length}`);
console.log();

console.log('📏 Size Metrics:');
console.log(`  JSON size: ${stats.chars.toLocaleString()} characters`);
console.log(`  Estimated tokens: ~${stats.tokens.toLocaleString()}`);
console.log();

// Extrapolate to full codebase (642 files)
const fullCodebase = extrapolate(stats, index.fileCount, 642);
console.log('🔮 Extrapolated to Full Codebase (642 files):');
console.log(`  Estimated tokens: ~${fullCodebase.estimatedTokens.toLocaleString()}`);
console.log(`  Estimated chars: ~${fullCodebase.estimatedChars.toLocaleString()}`);
console.log();

// Verdict
const TOKEN_BUDGET = 20000;
if (fullCodebase.estimatedTokens < TOKEN_BUDGET) {
  console.log(`✅ PASS: Estimated ${fullCodebase.estimatedTokens} tokens < ${TOKEN_BUDGET} budget`);
  console.log(`   Headroom: ${TOKEN_BUDGET - fullCodebase.estimatedTokens} tokens (${Math.round((TOKEN_BUDGET - fullCodebase.estimatedTokens) / TOKEN_BUDGET * 100)}%)`);
} else {
  console.log(`❌ FAIL: Estimated ${fullCodebase.estimatedTokens} tokens > ${TOKEN_BUDGET} budget`);
  console.log(`   Overflow: ${fullCodebase.estimatedTokens - TOKEN_BUDGET} tokens`);
  console.log(`   Recommendation: Add domain filtering or pagination`);
}
console.log();

// Show sample index structure
console.log('📋 Sample Index Structure:');
console.log(JSON.stringify(index, null, 2));
console.log();

console.log('💾 Saving to spike-code-index.json...');
fs.writeFileSync(
  path.join(__dirname, 'spike-code-index.json'),
  JSON.stringify(index, null, 2)
);
console.log('✅ Done! Review spike-code-index.json for full output.\n');
