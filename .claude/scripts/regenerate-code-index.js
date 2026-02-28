#!/usr/bin/env node

/**
 * Code Index Generator (v1)
 *
 * Scans TypeScript files and generates domain-specific indexes:
 *   - 8 domain indexes: CODEBASE-{DOMAIN}.md
 *   - Semi-compressed format (export names, import paths visible)
 *   - Pattern detection (tenant-isolation, soft-delete, etc.)
 *   - Violation detection (inline utils, hardcoded colors, etc.)
 *
 * Usage:
 *   node .claude/scripts/regenerate-code-index.js
 *   node .claude/scripts/regenerate-code-index.js --domains "banking invoicing"
 *   node .claude/scripts/regenerate-code-index.js --force
 *
 * Triggered by:
 *   - .claude/hooks/rebuild-code-index.sh (post-commit)
 *   - Manual (when index stale)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const STATE_FILE = path.join(PROJECT_ROOT, '.claude/.code-index-state.json');
const INDEX_START = '<!-- CODE-INDEX:START (auto-generated, do not edit manually)';
const INDEX_END = 'CODE-INDEX:END -->';

// Domain mapping
const DOMAINS = {
  banking: {
    name: 'BANKING',
    paths: ['apps/api/src/domains/banking/**/*.ts', 'apps/web/src/app/(dashboard)/banking/**/*.tsx'],
    indexFile: 'CODEBASE-BANKING.md',
  },
  invoicing: {
    name: 'INVOICING',
    paths: ['apps/api/src/domains/invoicing/**/*.ts', 'apps/web/src/app/(dashboard)/business/invoices/**/*.tsx'],
    indexFile: 'CODEBASE-INVOICING.md',
  },
  accounting: {
    name: 'ACCOUNTING',
    paths: ['apps/api/src/domains/accounting/**/*.ts', 'apps/web/src/app/(dashboard)/accounting/**/*.tsx'],
    indexFile: 'CODEBASE-ACCOUNTING.md',
  },
  planning: {
    name: 'PLANNING',
    paths: ['apps/api/src/domains/planning/**/*.ts', 'apps/web/src/app/(dashboard)/planning/**/*.tsx'],
    indexFile: 'CODEBASE-PLANNING.md',
  },
  ai: {
    name: 'AI',
    paths: ['apps/api/src/domains/ai/**/*.ts', 'apps/web/src/app/(dashboard)/insights/**/*.tsx'],
    indexFile: 'CODEBASE-AI.md',
  },
  'web-pages': {
    name: 'WEB-PAGES',
    paths: [
      'apps/web/src/app/(dashboard)/overview/**/*.tsx',
      'apps/web/src/app/(dashboard)/business/clients/**/*.tsx',
      'apps/web/src/app/(dashboard)/business/vendors/**/*.tsx',
      'apps/web/src/app/(marketing)/**/*.tsx',
      'apps/web/src/app/(auth)/**/*.tsx',
    ],
    indexFile: 'CODEBASE-WEB-PAGES.md',
  },
  'web-business': {
    name: 'WEB-BUSINESS',
    paths: [
      'apps/web/src/components/business/**/*.tsx',
      'apps/web/src/components/invoicing/**/*.tsx',
      'apps/web/src/components/entities/**/*.tsx',
    ],
    indexFile: 'CODEBASE-WEB-BUSINESS.md',
  },
  'web-shared': {
    name: 'WEB-SHARED',
    paths: [
      'apps/web/src/components/ui/**/*.tsx',
      'apps/web/src/components/shared/**/*.tsx',
      'apps/web/src/components/layout/**/*.tsx',
      'apps/web/src/components/dashboard/**/*.tsx',
      'apps/web/src/lib/**/*.ts',
    ],
    indexFile: 'CODEBASE-WEB-SHARED.md',
  },
  'web-forms': {
    name: 'WEB-FORMS',
    paths: [
      'apps/web/src/components/forms/**/*.tsx',
      'apps/web/src/components/accounts/**/*.tsx',
    ],
    indexFile: 'CODEBASE-WEB-FORMS.md',
  },
  packages: {
    name: 'PACKAGES',
    paths: ['packages/**/*.ts', 'packages/**/*.tsx'],
    indexFile: 'CODEBASE-PACKAGES.md',
  },
};

// ─── File Analysis ──────────────────────────────────────────────

/**
 * Find test file for a given source file (INFRA-68)
 */
function findTestFile(sourceFile) {
  const dir = path.dirname(sourceFile);
  const baseName = path.basename(sourceFile, path.extname(sourceFile));

  // Check for X.test.ts in same directory
  const testFile1 = path.join(dir, `${baseName}.test.ts`);
  const testFile2 = path.join(dir, `${baseName}.test.tsx`);

  // Check for __tests__/X.test.ts
  const testFile3 = path.join(dir, '__tests__', `${baseName}.test.ts`);
  const testFile4 = path.join(dir, '__tests__', `${baseName}.test.tsx`);

  for (const testFile of [testFile1, testFile2, testFile3, testFile4]) {
    if (fs.existsSync(testFile)) {
      const testContent = fs.readFileSync(testFile, 'utf-8');
      const testCount = (testContent.match(/\b(it|test)\s*\(/g) || []).length;

      return {
        exists: true,
        file: path.relative(PROJECT_ROOT, testFile).replace(/\\/g, '/'),
        testCount,
      };
    }
  }

  return { exists: false };
}

/**
 * Analyze a TypeScript file and extract metadata
 */
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract exports (top 10)
    const exports = [];
    const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
      if (exports.length >= 10) break;
    }

    // Extract imports (top 10, unique)
    const imports = [];
    const importSet = new Set();
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      if (!importSet.has(match[1])) {
        importSet.add(match[1]);
        imports.push(match[1]);
        if (imports.length >= 10) break;
      }
    }

    // Detect patterns (compact codes)
    const patterns = [];
    if (content.includes('tenantId') && content.match(/where.*tenantId/)) patterns.push('T');
    if (content.includes('deletedAt')) patterns.push('S');
    if (content.includes('request.log') || content.includes('server.log')) patterns.push('L');
    if (content.includes('prisma.')) patterns.push('P');
    if (content.includes("'use client'")) patterns.push('C');

    // Detect violations (detailed)
    const violations = [];

    // Inline formatCurrency (skip canonical location)
    if (content.match(/function\s+formatCurrency\s*\(/) &&
        !filePath.endsWith('currency.ts')) {
      violations.push({
        code: 'F',
        msg: 'Inline formatCurrency (not imported from canonical)',
        fix: 'Import formatCurrency from @/lib/utils/currency or apps/web/src/lib/utils/currency.ts'
      });
    }

    // Hardcoded colors
    const colorMatch = content.match(/(text|bg)-\[(#[0-9A-Fa-f]+|rgba?\([^\]]+\))\]/);
    if (colorMatch) {
      violations.push({
        code: 'H',
        msg: `Hardcoded color: ${colorMatch[0]}`,
        fix: 'Use semantic tokens from globals.css (text-ak-green, glass, etc.)'
      });
    }

    // console.log in production
    if (content.includes('console.log') &&
        !filePath.includes('test') &&
        !filePath.includes('seed') &&
        !filePath.includes('scripts') &&
        !filePath.includes('__tests__')) {
      violations.push({
        code: 'L',
        msg: 'console.log in production',
        fix: 'Use request.log or server.log (pino structured logging)'
      });
    }

    // : any type
    if (content.match(/:\s*any(?![a-zA-Z])/)) {
      violations.push({
        code: 'A',
        msg: ': any type annotation',
        fix: 'Use unknown + type guard or specific type'
      });
    }

    // Shortened path (relative from project root)
    const shortPath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

    // Test coverage detection (INFRA-68)
    const tests = findTestFile(filePath);

    return {
      p: shortPath,
      e: exports,
      i: imports,
      l: lines.length,
      pt: patterns.join(''),
      v: violations,
      t: tests, // Test coverage info
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Determine domain code from file path
 */
function getDomainCode(filePath) {
  if (filePath.includes('/banking/')) return 'bnk';
  if (filePath.includes('/invoicing/')) return 'inv';
  if (filePath.includes('/accounting/')) return 'acc';
  if (filePath.includes('/planning/')) return 'pln';
  if (filePath.includes('/ai/')) return 'ai';
  if (filePath.includes('/app/(dashboard)/')) return 'pg';
  if (filePath.includes('/components/') || filePath.includes('/lib/')) return 'cmp';
  if (filePath.includes('packages/')) return 'pkg';
  return 'unk';
}

// ─── Domain Index Builder ───────────────────────────────────────

/**
 * Build index for a single domain
 */
function buildDomainIndex(domainKey) {
  const domain = DOMAINS[domainKey];
  const index = {
    _: new Date().toISOString().split('T')[0],
    n: 0,
    f: {},
    d: {},
    p: {},
    v: {},
  };

  console.log(`\n📂 Scanning ${domain.name} domain...`);

  // Find all files for this domain
  let allFiles = [];
  for (const pattern of domain.paths) {
    const files = glob.sync(pattern, {
      cwd: PROJECT_ROOT,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**']
    });
    allFiles = allFiles.concat(files);
  }

  // Dedupe
  allFiles = [...new Set(allFiles)];

  console.log(`  Found ${allFiles.length} files`);

  // Analyze each file
  for (const filePath of allFiles) {
    const metadata = analyzeFile(filePath);
    if (!metadata) continue;

    index.n++;

    const fileName = path.basename(filePath, path.extname(filePath));
    const domainCode = getDomainCode(filePath);

    // Add domain code to metadata
    metadata.d = domainCode;

    // Store in files map
    index.f[fileName] = metadata;

    // Track domain stats
    if (!index.d[domainCode]) {
      index.d[domainCode] = { n: 0, l: 0 };
    }
    index.d[domainCode].n++;
    index.d[domainCode].l += metadata.l;

    // Track patterns
    for (const pattern of metadata.pt.split('')) {
      if (!pattern) continue;
      if (!index.p[pattern]) index.p[pattern] = [];
      if (!index.p[pattern].includes(fileName)) {
        index.p[pattern].push(fileName);
      }
    }

    // Track violations
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

  console.log(`  Indexed ${index.n} files`);
  console.log(`  Patterns: ${Object.keys(index.p).length}`);
  console.log(`  Violations: ${Object.keys(index.v).length}`);

  // Second pass: Build caller graph (PERF-29)
  buildCallerGraph(index);

  return index;
}

/**
 * Build caller graph - reverse import map (PERF-29)
 * For each export, find which files import it
 */
function buildCallerGraph(index) {
  // Build export map: exportName → fileName
  const exportMap = {};
  for (const [fileName, metadata] of Object.entries(index.f)) {
    for (const exportName of metadata.e) {
      if (!exportMap[exportName]) exportMap[exportName] = [];
      exportMap[exportName].push(fileName);
    }
  }

  // For each file, match imports to exports and build callers
  for (const [fileName, metadata] of Object.entries(index.f)) {
    metadata.c = {}; // Callers map: exportName → [callerFile1, callerFile2]

    // For each import, find files that import this file's exports
    for (const [otherFileName, otherMetadata] of Object.entries(index.f)) {
      if (fileName === otherFileName) continue;

      // Check if otherFile imports from this file
      const importsThisFile = otherMetadata.i.some(importPath => {
        // Match relative imports
        if (importPath.startsWith('.') || importPath.startsWith('../')) {
          // Simple heuristic: if import path ends with this fileName
          return importPath.includes(fileName.replace('.ts', '').replace('.tsx', ''));
        }

        // Match package imports (@akount/db, @akount/ui, etc.)
        // Not implemented yet - would need package.json resolution

        return false;
      });

      if (importsThisFile) {
        // Add this file as a caller for all exports
        for (const exportName of metadata.e) {
          if (!metadata.c[exportName]) metadata.c[exportName] = [];
          if (!metadata.c[exportName].includes(otherFileName)) {
            metadata.c[exportName].push(otherFileName);
          }
        }
      }
    }
  }
}

/**
 * Write index to domain file
 */
function writeDomainIndex(domainKey, index) {
  const domain = DOMAINS[domainKey];
  const indexFile = path.join(PROJECT_ROOT, domain.indexFile);

  const jsonString = JSON.stringify(index, null, 2);
  const tokens = Math.ceil(jsonString.length / 4);

  const content = `# ${domain.name} Code Index

**Auto-generated:** ${new Date().toISOString().split('T')[0]}
**Files indexed:** ${index.n}
**Estimated tokens:** ~${tokens.toLocaleString()}

---

<!-- Legend: .claude/code-index-legend.md -->

---

${INDEX_START}
${jsonString}
${INDEX_END}

---

## Quick Stats

**Files by domain:**
${Object.entries(index.d).map(([code, stats]) => `- ${code}: ${stats.n} files, ${stats.l.toLocaleString()} LOC`).join('\n')}

**Patterns found:**
${Object.entries(index.p).length > 0 ? Object.entries(index.p).map(([code, files]) => `- ${code}: ${files.length} files`).join('\n') : '- None'}

**Violations found:**
${Object.entries(index.v).length > 0 ? Object.entries(index.v).map(([code, viols]) => `- ${code}: ${viols.length} occurrences`).join('\n') : '- None ✅'}

---

_Generated by: .claude/scripts/regenerate-code-index.js_
`;

  fs.writeFileSync(indexFile, content, 'utf-8');
  console.log(`  ✅ Wrote ${domain.indexFile} (${tokens.toLocaleString()} tokens)`);

  return { tokens, file: indexFile };
}

/**
 * Update freshness state
 */
function updateFreshnessState(results) {
  const state = {
    lastBuild: new Date().toISOString(),
    gitCommit: execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT }).toString().trim(),
    gitBranch: execSync('git branch --show-current', { cwd: PROJECT_ROOT }).toString().trim(),
    domains: {},
  };

  for (const [domainKey, result] of Object.entries(results)) {
    state.domains[domainKey] = {
      lastBuild: state.lastBuild,
      fileCount: result.index.n,
      indexFile: DOMAINS[domainKey].indexFile,
      indexSize: result.tokens,
    };
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  console.log(`\n💾 Updated freshness state: ${STATE_FILE}`);
}

// ─── Main ───────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const domainsArg = args.find(a => a.startsWith('--domains'));

  let domainsToRebuild = Object.keys(DOMAINS);

  if (domainsArg && !force) {
    const domainList = domainsArg.split('=')[1] || args[args.indexOf(domainsArg) + 1] || '';
    domainsToRebuild = domainList.split(/[\s,]+/).filter(d => DOMAINS[d]);

    if (domainsToRebuild.length === 0) {
      console.error('❌ No valid domains specified');
      console.error('Valid domains:', Object.keys(DOMAINS).join(', '));
      process.exit(1);
    }
  }

  console.log('🔨 Code Index Generator (v1)');
  console.log(`📅 ${new Date().toISOString().split('T')[0]}`);
  console.log(`🔧 Rebuilding domains: ${domainsToRebuild.join(', ')}`);

  const results = {};
  let totalFiles = 0;
  let totalTokens = 0;

  for (const domainKey of domainsToRebuild) {
    const index = buildDomainIndex(domainKey);
    const result = writeDomainIndex(domainKey, index);

    results[domainKey] = { index, ...result };
    totalFiles += index.n;
    totalTokens += result.tokens;
  }

  // Update freshness state
  updateFreshnessState(results);

  console.log('\n📊 Summary:');
  console.log(`  Total files indexed: ${totalFiles}`);
  console.log(`  Total tokens: ~${totalTokens.toLocaleString()}`);
  console.log(`  Domains rebuilt: ${domainsToRebuild.length}`);
  console.log(`  Index files: ${domainsToRebuild.map(d => DOMAINS[d].indexFile).join(', ')}`);
  console.log('\n✅ Code index generation complete!');
}

// Check for lock file (prevent concurrent execution)
const LOCK_FILE = path.join(PROJECT_ROOT, '.claude/.code-index.lock');

if (fs.existsSync(LOCK_FILE)) {
  const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
  if (lockAge < 300000) { // 5 minutes
    console.log('⏳ Code index rebuild already in progress (lock file exists)');
    console.log('   Waiting for other process to finish...');
    process.exit(0);
  } else {
    console.log('⚠️  Stale lock file detected (>5 min), removing...');
    fs.unlinkSync(LOCK_FILE);
  }
}

// Create lock file
fs.writeFileSync(LOCK_FILE, new Date().toISOString());

try {
  main();
} finally {
  // Remove lock file
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}
