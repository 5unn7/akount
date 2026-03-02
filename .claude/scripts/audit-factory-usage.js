#!/usr/bin/env node
/**
 * Factory Adoption Audit Script
 *
 * Analyzes test files to measure factory adoption and identify files
 * needing migration from inline mocks to schema-driven factories.
 *
 * Usage:
 *   node .claude/scripts/audit-factory-usage.js
 *   node .claude/scripts/audit-factory-usage.js --json  (machine-readable output)
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════

const PROJECT_ROOT = path.join(__dirname, '../..');
const TEST_DIRS = [
  path.join(PROJECT_ROOT, 'apps/api/src'),
];

const FACTORY_PATTERNS = [
  /Factory\.build/,
  /mockInput\(/,
  /from.*test-utils/,
  /from.*__generated__\/fabbrica/,
];

const INLINE_MOCK_PATTERNS = [
  /const\s+MOCK_\w+\s*=\s*\{/, // const MOCK_TAX_RATE = {
  /const\s+mock\w+\s*=\s*\{/,  // const mockAccount = {
];

// ═══════════════════════════════════════════════════════════════
// File Analysis
// ═══════════════════════════════════════════════════════════════

function hasFactories(content) {
  return FACTORY_PATTERNS.some((pattern) => pattern.test(content));
}

function hasInlineMocks(content) {
  return INLINE_MOCK_PATTERNS.some((pattern) => pattern.test(content));
}

function countObjectLiterals(content) {
  // Count lines with object literal starts
  const matches = content.match(/const.*=.*{$/gm);
  return matches ? matches.length : 0;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(PROJECT_ROOT, filePath);

  const usesFactories = hasFactories(content);
  const hasInline = hasInlineMocks(content);
  const objectCount = countObjectLiterals(content);

  const testType = filePath.includes('routes.test.ts')
    ? 'route'
    : filePath.includes('service.test.ts')
    ? 'service'
    : 'other';

  return {
    path: relativePath,
    testType,
    usesFactories,
    hasInlineMocks: hasInline,
    objectLiteralCount: objectCount,
    needsMigration: !usesFactories && (hasInline || objectCount > 3),
  };
}

// ═══════════════════════════════════════════════════════════════
// Directory Walking
// ═══════════════════════════════════════════════════════════════

function* walkTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        yield* walkTestFiles(fullPath);
      }
    } else if (entry.name.endsWith('.test.ts')) {
      yield fullPath;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

function main() {
  const isJsonOutput = process.argv.includes('--json');

  const results = [];

  for (const testDir of TEST_DIRS) {
    if (!fs.existsSync(testDir)) continue;

    for (const file of walkTestFiles(testDir)) {
      const analysis = analyzeFile(file);
      results.push(analysis);
    }
  }

  // Aggregate metrics
  const total = results.length;
  const usingFactories = results.filter((r) => r.usesFactories).length;
  const needsMigration = results.filter((r) => r.needsMigration).length;
  const byType = results.reduce((acc, r) => {
    acc[r.testType] = (acc[r.testType] || 0) + 1;
    return acc;
  }, {});

  if (isJsonOutput) {
    console.log(
      JSON.stringify(
        {
          total,
          usingFactories,
          needsMigration,
          adoptionPercent: Math.round((usingFactories / total) * 100),
          byType,
          files: results,
        },
        null,
        2
      )
    );
    return;
  }

  // Human-readable output
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Test Factory Adoption Audit');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Total test files:      ${total}`);
  console.log(`Using factories:       ${usingFactories} (${Math.round((usingFactories / total) * 100)}%)`);
  console.log(`Needs migration:       ${needsMigration} (${Math.round((needsMigration / total) * 100)}%)`);
  console.log('');
  console.log('By type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type.padEnd(10)} ${count}`);
  });
  console.log('');

  if (needsMigration > 0) {
    console.log('Files needing migration (showing first 20):');
    console.log('');

    results
      .filter((r) => r.needsMigration)
      .slice(0, 20)
      .forEach((r) => {
        const badge = r.testType === 'route' ? '🌐' : r.testType === 'service' ? '⚙️' : '📄';
        console.log(`${badge} ${r.path}`);
        if (r.objectLiteralCount > 5) {
          console.log(`   └─ ${r.objectLiteralCount} object literals detected`);
        }
      });

    if (needsMigration > 20) {
      console.log('');
      console.log(`... and ${needsMigration - 20} more`);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Migration guide:');
  console.log('  - Route tests:   Use mockTaxRateInput(), mockInvoiceInput(), etc.');
  console.log('  - Service tests: Use mockPrisma + mockAccount(), mockInvoice(), etc.');
  console.log('  - Template:      apps/api/src/test-utils/templates/service.test.template.ts');
  console.log('  - Examples:      See recently migrated files:');
  console.log('                   - apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts');
  console.log('                   - apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts');
  console.log('');

  process.exit(needsMigration > 0 ? 1 : 0);
}

main();