#!/usr/bin/env node

/**
 * SPIKE 2: Semi-Compressed (Readable) Code Index
 *
 * Test middle ground between verbose and compressed:
 * - Keep single-letter field names (save tokens)
 * - ADD BACK export/import names (prevent hallucination)
 * - Keep pattern codes (compact)
 * - Add canonical paths for violations
 *
 * Goal: Maximize readability while staying under 20K budget
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

  // Extract ACTUAL export names (not counts)
  const exports = [];
  const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|interface|type)\s+(\w+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }

  // Extract ACTUAL import paths (not counts)
  const imports = [];
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Compact patterns (keep codes)
  const patterns = [];
  if (content.includes('tenantId')) patterns.push('T'); // Tenant
  if (content.includes('deletedAt')) patterns.push('S'); // Soft-delete
  if (content.includes('request.log')) patterns.push('L'); // Logging
  if (content.includes('prisma.')) patterns.push('P'); // Prisma
  if (content.includes("'use client'")) patterns.push('C'); // Client

  // DETAILED violations (with paths for fixing)
  const violations = [];
  if (content.match(/function formatCurrency\s*\(/)) {
    violations.push({
      code: 'F',
      msg: 'Inline formatCurrency',
      fix: 'Import from @/lib/utils/currency'
    });
  }
  if (content.match(/text-\[#|bg-\[rgba/)) {
    const colorMatch = content.match(/(text|bg)-\[(#[0-9A-Fa-f]+|rgba[^\]]+)\]/);
    violations.push({
      code: 'H',
      msg: `Hardcoded color: ${colorMatch ? colorMatch[0] : 'unknown'}`,
      fix: 'Use semantic tokens from globals.css'
    });
  }
  if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('seed')) {
    violations.push({
      code: 'L',
      msg: 'console.log in production',
      fix: 'Use request.log or server.log (pino)'
    });
  }
  if (content.match(/:\s*any[^a-zA-Z]/)) {
    violations.push({
      code: 'A',
      msg: ': any type',
      fix: 'Use unknown + type guard or specific type'
    });
  }

  // Domain code
  let domain = 'unk';
  if (filePath.includes('/banking/')) domain = 'bnk';
  else if (filePath.includes('/invoicing/')) domain = 'inv';
  else if (filePath.includes('/accounting/')) domain = 'acc';
  else if (filePath.includes('/planning/')) domain = 'pln';
  else if (filePath.includes('/ai/')) domain = 'ai';
  else if (filePath.includes('/app/(dashboard)/')) domain = 'pg';
  else if (filePath.includes('/components/')) domain = 'cmp';
  else if (filePath.includes('packages/')) domain = 'pkg';

  // Shortened path
  const shortPath = filePath.replace(/^apps\/(?:api|web)\/src\//, '').replace(/^packages\//, '');

  return {
    p: shortPath,
    d: domain,
    e: exports.slice(0, 10), // Top 10 exports (NAMES, not count)
    i: imports.slice(0, 10), // Top 10 imports (PATHS, not count)
    l: lines.length,
    pt: patterns.join(''),
    v: violations,
  };
}

function buildSemiCompressedIndex() {
  const index = {
    _: new Date().toISOString().split('T')[0],
    n: 0,
    f: {},
    d: {},
    p: {},
    v: {},
  };

  for (const filePath of SAMPLE_FILES) {
    const metadata = analyzeFile(filePath);
    if (!metadata) continue;

    index.n++;

    const fileName = path.basename(filePath, path.extname(filePath));
    index.f[fileName] = metadata;

    // Domain stats
    if (!index.d[metadata.d]) {
      index.d[metadata.d] = { n: 0, l: 0 };
    }
    index.d[metadata.d].n++;
    index.d[metadata.d].l += metadata.l;

    // Pattern tracking
    for (const pattern of metadata.pt.split('')) {
      if (!pattern) continue;
      if (!index.p[pattern]) index.p[pattern] = [];
      index.p[pattern].push(fileName);
    }

    // Violation tracking (with details)
    for (const violation of metadata.v) {
      const code = violation.code;
      if (!index.v[code]) index.v[code] = [];
      index.v[code].push({
        file: fileName,
        path: metadata.p,
        msg: violation.msg,
        fix: violation.fix
      });
    }
  }

  return index;
}

function estimateTokens(json) {
  const jsonString = JSON.stringify(json, null, 2);
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

console.log('🔬 SPIKE 2: Semi-Compressed (Readable) Code Index\n');
console.log('Middle ground approach:');
console.log('  ✓ Single-letter fields (compact)');
console.log('  ✓ Export NAMES (not counts) — prevents hallucination');
console.log('  ✓ Import PATHS (not counts) — verifiable');
console.log('  ✓ Pattern codes (compact)');
console.log('  ✓ Detailed violations (with fix suggestions)');
console.log();

console.log(`Scanning ${SAMPLE_FILES.length} sample files...\n`);

const index = buildSemiCompressedIndex();
const stats = estimateTokens(index);

console.log('📊 Semi-Compressed Index Stats:');
console.log(`  Files scanned: ${index.n}`);
console.log(`  Domains: ${Object.keys(index.d).length}`);
console.log(`  Patterns: ${Object.keys(index.p).length}`);
console.log(`  Violations: ${Object.keys(index.v).length}`);
console.log();

console.log('📏 Size Metrics (Semi-Compressed):');
console.log(`  JSON size: ${stats.chars.toLocaleString()} characters`);
console.log(`  Estimated tokens: ~${stats.tokens.toLocaleString()}`);
console.log();

// Compare to compressed
const COMPRESSED_TOKENS = 315;
const compressionVsCompressed = Math.round((stats.tokens / COMPRESSED_TOKENS - 1) * 100);
console.log('📊 Comparison:');
console.log(`  Fully compressed: 315 tokens`);
console.log(`  Semi-compressed: ${stats.tokens} tokens (${compressionVsCompressed > 0 ? '+' : ''}${compressionVsCompressed}% larger)`);
console.log();

// Extrapolate to full codebase
const fullCodebase = extrapolate(stats, index.n, 642);
console.log('🔮 Extrapolated to Full Codebase (642 files):');
console.log(`  Estimated tokens: ~${fullCodebase.estimatedTokens.toLocaleString()}`);
console.log(`  Estimated chars: ~${fullCodebase.estimatedChars.toLocaleString()}`);
console.log();

// Per-domain estimate (80 files)
const perDomain = extrapolate(stats, index.n, 80);
console.log('🎯 Per-Domain Estimate (80 files):');
console.log(`  Estimated tokens: ~${perDomain.estimatedTokens.toLocaleString()}`);
console.log(`  Estimated chars: ~${perDomain.estimatedChars.toLocaleString()}`);
console.log();

// Verdict
const TOKEN_BUDGET = 20000;
if (perDomain.estimatedTokens < TOKEN_BUDGET) {
  console.log(`✅ PASS: Estimated ${perDomain.estimatedTokens} tokens < ${TOKEN_BUDGET} budget per domain`);
  console.log(`   Headroom: ${TOKEN_BUDGET - perDomain.estimatedTokens} tokens (${Math.round((TOKEN_BUDGET - perDomain.estimatedTokens) / TOKEN_BUDGET * 100)}%)`);
  console.log();
  console.log('🎉 RECOMMENDATION: Use semi-compressed format!');
  console.log('   Benefits:');
  console.log('   ✓ Agent can verify exact export names (prevents hallucination)');
  console.log('   ✓ Agent can see import paths (better context)');
  console.log('   ✓ Detailed violation messages (actionable fixes)');
  console.log('   ✓ Still fits comfortably in budget');
} else {
  console.log(`❌ FAIL: Estimated ${perDomain.estimatedTokens} tokens > ${TOKEN_BUDGET} budget`);
  console.log(`   Overflow: ${perDomain.estimatedTokens - TOKEN_BUDGET} tokens`);
  console.log(`   Must use fully compressed format`);
}
console.log();

// Show sample
console.log('📋 Semi-Compressed Index Structure:');
console.log(JSON.stringify(index, null, 2));
console.log();

// Decode legend
console.log('🔑 Decode Legend:');
console.log('  Fields: p=path, d=domain, e=exports(NAMES), i=imports(PATHS), l=LOC, pt=patterns, v=violations');
console.log('  Patterns: T=tenant, S=soft-delete, L=logging, P=prisma, C=client');
console.log('  Violations: F=formatCurrency, H=hardcoded-color, L=console.log, A=any-type');
console.log('  Domains: bnk=banking, inv=invoicing, acc=accounting, pg=pages, cmp=components, pkg=packages');
console.log();

fs.writeFileSync(
  path.join(__dirname, 'spike-code-index-readable.json'),
  JSON.stringify(index, null, 2)
);
console.log('💾 Saved to spike-code-index-readable.json\n');
