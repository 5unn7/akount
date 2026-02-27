#!/usr/bin/env node

/**
 * SPIKE 1B: Compressed Code Index
 *
 * Test aggressive compression to fit 642 files in <20K tokens
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');

const SAMPLE_FILES = [
  'apps/api/src/domains/banking/services/account.service.ts',
  'apps/api/src/domains/invoicing/services/invoice.service.ts',
  'apps/api/src/domains/accounting/services/journal-entry.service.ts',
  'apps/web/src/lib/utils/currency.ts',
  'apps/web/src/lib/utils/date.ts',
  'apps/web/src/app/(dashboard)/banking/accounts/page.tsx',
  'apps/web/src/components/shared/DomainTabs.tsx',
  'packages/db/prisma/seed.ts',
];

function analyzeFile(filePath) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n');

  // Count only, don't list
  const exportCount = (content.match(/export\s+(?:async\s+)?(?:function|class|const|interface|type)\s+\w+/g) || []).length;
  const importCount = (content.match(/import\s+.*?from\s+['"][^'"]+['"]/g) || []).length;

  // Compact patterns (1-letter codes)
  const patterns = [];
  if (content.includes('tenantId')) patterns.push('T'); // Tenant
  if (content.includes('deletedAt')) patterns.push('S'); // Soft-delete
  if (content.includes('request.log')) patterns.push('L'); // Logging
  if (content.includes('prisma.')) patterns.push('P'); // Prisma
  if (content.includes("'use client'")) patterns.push('C'); // Client

  // Compact violations (1-letter codes)
  const violations = [];
  if (content.match(/function formatCurrency\s*\(/)) violations.push('F'); // formatCurrency
  if (content.match(/text-\[#|bg-\[rgba/)) violations.push('H'); // Hardcoded color
  if (content.includes('console.log') && !filePath.includes('test')) violations.push('L'); // console.log
  if (content.match(/:\s*any[^a-zA-Z]/)) violations.push('A'); // any type

  // Shortened domain code
  const domainMap = {
    '/banking/': 'bnk',
    '/invoicing/': 'inv',
    '/accounting/': 'acc',
    '/planning/': 'pln',
    '/ai/': 'ai',
    '/system/': 'sys',
    '/web/src/app/': 'pg',
    '/web/src/lib/': 'util',
    '/web/src/components/': 'cmp',
    'packages/ui/': 'ui',
    'packages/db/': 'db',
  };

  let domain = 'unk';
  for (const [key, value] of Object.entries(domainMap)) {
    if (filePath.includes(key)) {
      domain = value;
      break;
    }
  }

  // Shorten path (relative from domain root)
  const shortPath = filePath.replace(/^apps\/(?:api|web)\/src\//, '').replace(/^packages\//, '');

  return {
    p: shortPath, // path
    d: domain, // domain
    e: exportCount, // export count
    i: importCount, // import count
    l: lines.length, // LOC
    pt: patterns.join(''), // patterns (compact)
    v: violations.join(''), // violations (compact)
  };
}

function buildCompressedIndex() {
  const index = {
    _: new Date().toISOString().split('T')[0], // Date only
    n: 0, // file count
    f: {}, // files (keyed by short name)
    d: {}, // domain stats
    p: {}, // patterns
    v: {}, // violations
  };

  for (const filePath of SAMPLE_FILES) {
    const metadata = analyzeFile(filePath);
    if (!metadata) continue;

    index.n++;

    const fileName = path.basename(filePath, path.extname(filePath));
    index.f[fileName] = metadata;

    // Domain stats
    if (!index.d[metadata.d]) {
      index.d[metadata.d] = { n: 0, l: 0 }; // count, LOC
    }
    index.d[metadata.d].n++;
    index.d[metadata.d].l += metadata.l;

    // Pattern tracking
    for (const pattern of metadata.pt.split('')) {
      if (!pattern) continue;
      if (!index.p[pattern]) index.p[pattern] = [];
      index.p[pattern].push(fileName);
    }

    // Violation tracking
    for (const violation of metadata.v.split('')) {
      if (!violation) continue;
      if (!index.v[violation]) index.v[violation] = [];
      index.v[violation].push(fileName);
    }
  }

  return index;
}

function estimateTokens(json) {
  const jsonString = JSON.stringify(json);
  const chars = jsonString.length;
  const tokens = Math.ceil(chars / 4);
  return { chars, tokens };
}

function extrapolate(sampleStats, sampleCount, totalCount) {
  const ratio = totalCount / sampleCount;
  return {
    estimatedTokens: Math.ceil(sampleStats.tokens * ratio),
    estimatedChars: Math.ceil(sampleStats.chars * ratio),
  };
}

// ─── Main ───────────────────────────────────────────────────────

console.log('🔬 SPIKE 1B: Compressed Code Index\n');
console.log('Compression techniques:');
console.log('  - Single-letter field names (p, d, e, i, l)');
console.log('  - Pattern codes (T=tenant, S=soft-delete, L=log, P=prisma, C=client)');
console.log('  - Violation codes (F=formatCurrency, H=hardcoded-color, L=log, A=any)');
console.log('  - Short domain codes (bnk, inv, acc, etc.)');
console.log('  - Counts instead of arrays (exportCount vs list of exports)');
console.log('  - Shortened paths (relative from domain root)');
console.log();

console.log(`Scanning ${SAMPLE_FILES.length} sample files...\n`);

const index = buildCompressedIndex();
const stats = estimateTokens(index);

console.log('📊 Compressed Index Stats:');
console.log(`  Files scanned: ${index.n}`);
console.log(`  Domains: ${Object.keys(index.d).length}`);
console.log(`  Patterns: ${Object.keys(index.p).length}`);
console.log(`  Violations: ${Object.keys(index.v).length}`);
console.log();

console.log('📏 Size Metrics (Compressed):');
console.log(`  JSON size: ${stats.chars.toLocaleString()} characters`);
console.log(`  Estimated tokens: ~${stats.tokens.toLocaleString()}`);
console.log();

// Compare to original
const ORIGINAL_TOKENS = 1153;
const compression = Math.round((1 - stats.tokens / ORIGINAL_TOKENS) * 100);
console.log('📊 Compression vs Original:');
console.log(`  Original: ${ORIGINAL_TOKENS} tokens`);
console.log(`  Compressed: ${stats.tokens} tokens`);
console.log(`  Savings: ${compression}%`);
console.log();

// Extrapolate to full codebase
const fullCodebase = extrapolate(stats, index.n, 642);
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
  console.log(`   Need ${Math.round(fullCodebase.estimatedTokens / TOKEN_BUDGET)} separate indexes or more compression`);
}
console.log();

// Show sample
console.log('📋 Compressed Index Structure:');
console.log(JSON.stringify(index, null, 2));
console.log();

// Decode legend
console.log('🔑 Decode Legend:');
console.log('  Fields: p=path, d=domain, e=exports, i=imports, l=LOC, pt=patterns, v=violations');
console.log('  Patterns: T=tenant, S=soft-delete, L=logging, P=prisma, C=client');
console.log('  Violations: F=inline-formatCurrency, H=hardcoded-color, L=console.log, A=any-type');
console.log('  Domains: bnk=banking, inv=invoicing, acc=accounting, pg=pages, util=utils, cmp=components');
console.log();

fs.writeFileSync(
  path.join(__dirname, 'spike-code-index-compressed.json'),
  JSON.stringify(index, null, 2)
);
console.log('💾 Saved to spike-code-index-compressed.json\n');
