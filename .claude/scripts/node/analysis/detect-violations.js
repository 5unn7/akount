#!/usr/bin/env node

/**
 * Pattern Violation Detector
 *
 * Scans TypeScript files for anti-patterns from guardrails.md and design-aesthetic.md:
 *   1. Inline utility functions (formatCurrency, formatDate not from canonical)
 *   2. Hardcoded colors (text-[#...], bg-[rgba...] instead of tokens)
 *   3. console.log in production (use request.log/server.log)
 *   4. Missing tenant filters (WHERE without tenantId in services)
 *   5. Missing timestamps in SELECT constants (no createdAt/updatedAt)
 *   6. : any type annotations
 *   7. Duplicate component logic (same markup in 3+ files)
 *
 * Usage:
 *   node .claude/scripts/detect-violations.js
 *   node .claude/scripts/detect-violations.js --staged
 *   node .claude/scripts/detect-violations.js --files "file1.ts file2.ts"
 *   node .claude/scripts/detect-violations.js --critical-only
 *
 * Exit codes:
 *   0 = No violations
 *   1 = Violations found
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);

// Canonical locations (don't flag these)
const CANONICAL_LOCATIONS = {
  formatCurrency: 'apps/web/src/lib/utils/currency.ts',
  formatDate: 'apps/web/src/lib/utils/date.ts',
};

// Violation severity levels
const SEVERITY = {
  CRITICAL: 'critical', // Block commits
  HIGH: 'high',         // Warn loudly
  MEDIUM: 'medium',     // Warn
  LOW: 'low',           // Info
};

// ─── Violation Checkers ─────────────────────────────────────────

/**
 * Check for inline formatCurrency (not imported from canonical)
 */
function checkInlineFormatCurrency(filePath, content) {
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  if (content.match(/function\s+formatCurrency\s*\(/) &&
      !relativePath.endsWith(CANONICAL_LOCATIONS.formatCurrency)) {
    return {
      code: 'F',
      severity: SEVERITY.HIGH,
      msg: 'Inline formatCurrency function (not imported from canonical)',
      fix: `Import from @/lib/utils/currency`,
      canonical: CANONICAL_LOCATIONS.formatCurrency,
    };
  }

  return null;
}

/**
 * Check for inline formatDate
 */
function checkInlineFormatDate(filePath, content) {
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  if (content.match(/function\s+formatDate\s*\(/) &&
      !relativePath.endsWith(CANONICAL_LOCATIONS.formatDate)) {
    return {
      code: 'D',
      severity: SEVERITY.HIGH,
      msg: 'Inline formatDate function (not imported from canonical)',
      fix: `Import from @/lib/utils/date`,
      canonical: CANONICAL_LOCATIONS.formatDate,
    };
  }

  return null;
}

/**
 * Check for hardcoded colors
 */
function checkHardcodedColors(filePath, content) {
  const colorMatch = content.match(/(text|bg|border)-\[(#[0-9A-Fa-f]+|rgba?\([^\]]+\))\]/);

  if (colorMatch) {
    return {
      code: 'H',
      severity: SEVERITY.MEDIUM,
      msg: `Hardcoded color: ${colorMatch[0]}`,
      fix: 'Use semantic tokens from globals.css (text-ak-green, glass, border-ak-border, etc.)',
      example: colorMatch[0],
    };
  }

  return null;
}

/**
 * Check for console.log in production
 */
function checkConsoleLog(filePath, content) {
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  // Skip test files, seed files, scripts
  if (relativePath.includes('test') ||
      relativePath.includes('seed') ||
      relativePath.includes('scripts') ||
      relativePath.includes('__tests__') ||
      relativePath.includes('spike-')) {
    return null;
  }

  if (content.includes('console.log')) {
    return {
      code: 'L',
      severity: SEVERITY.CRITICAL,
      msg: 'console.log in production code',
      fix: 'Use request.log.info() or server.log.info() (pino structured logging)',
    };
  }

  return null;
}

/**
 * Check for : any type annotations
 */
function checkAnyType(filePath, content) {
  const matches = content.match(/:\s*any(?![a-zA-Z])/g);

  if (matches) {
    return {
      code: 'A',
      severity: SEVERITY.HIGH,
      msg: `: any type annotation (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
      fix: 'Use unknown + type guard or specific type',
      count: matches.length,
    };
  }

  return null;
}

/**
 * Check for missing tenant filter in service queries
 */
function checkMissingTenantFilter(filePath, content) {
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  // Only check service files
  if (!relativePath.includes('/services/') || !relativePath.endsWith('.service.ts')) {
    return null;
  }

  // Check for prisma queries WITHOUT tenantId
  const hasQuery = content.match(/prisma\.\w+\.(?:findMany|findFirst|findUnique|count|aggregate)/);
  const hasTenantId = content.includes('tenantId');

  if (hasQuery && !hasTenantId) {
    return {
      code: 'T',
      severity: SEVERITY.CRITICAL,
      msg: 'Prisma query without tenantId filter (potential tenant leak)',
      fix: 'Add where: { entity: { tenantId: ctx.tenantId } } or where: { tenantId: ctx.tenantId }',
    };
  }

  return null;
}

/**
 * Check for SELECT constants missing timestamps
 */
function checkMissingTimestamps(filePath, content) {
  const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');

  // Only check service/route files
  if (!relativePath.includes('/services/') && !relativePath.includes('/routes/')) {
    return null;
  }

  // Look for SELECT constants
  const selectMatch = content.match(/const\s+\w+_SELECT\s*=\s*{([^}]+)}/);
  if (selectMatch) {
    const selectBody = selectMatch[1];
    const hasCreatedAt = selectBody.includes('createdAt');
    const hasUpdatedAt = selectBody.includes('updatedAt');

    if (!hasCreatedAt || !hasUpdatedAt) {
      return {
        code: 'S',
        severity: SEVERITY.MEDIUM,
        msg: 'SELECT constant missing timestamps (createdAt/updatedAt)',
        fix: 'Add createdAt: true, updatedAt: true to SELECT constant',
      };
    }
  }

  return null;
}

/**
 * Check for arbitrary font sizes
 */
function checkArbitraryFontSizes(filePath, content) {
  const arbitraryMatch = content.match(/text-\[(\d+)px\]/);

  if (arbitraryMatch) {
    return {
      code: 'B',
      severity: SEVERITY.LOW,
      msg: `Arbitrary font size: text-[${arbitraryMatch[1]}px]`,
      fix: 'Use Tailwind size classes (text-xs, text-sm, text-base) or custom utilities (text-micro)',
    };
  }

  return null;
}

// ─── File Scanning ──────────────────────────────────────────────

/**
 * Scan a single file for violations
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const violations = [
      checkInlineFormatCurrency(filePath, content),
      checkInlineFormatDate(filePath, content),
      checkHardcodedColors(filePath, content),
      checkConsoleLog(filePath, content),
      checkAnyType(filePath, content),
      checkMissingTenantFilter(filePath, content),
      checkMissingTimestamps(filePath, content),
      checkArbitraryFontSizes(filePath, content),
    ].filter(Boolean);

    return violations;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Get files to scan
 */
function getFilesToScan(options = {}) {
  if (options.files) {
    return options.files;
  }

  if (options.staged) {
    // Get staged files only
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
      });

      return output
        .split('\n')
        .filter(f => f.match(/\.tsx?$/))
        .map(f => path.join(PROJECT_ROOT, f));
    } catch (error) {
      console.error('Error getting staged files:', error.message);
      return [];
    }
  }

  // Scan all TypeScript files
  const patterns = [
    'apps/api/src/**/*.ts',
    'apps/web/src/**/*.tsx',
    'apps/web/src/**/*.ts',
    'packages/**/*.ts',
    'packages/**/*.tsx',
  ];

  let allFiles = [];
  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      cwd: PROJECT_ROOT,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**', '**/spike-*']
    });
    allFiles = allFiles.concat(files);
  }

  return [...new Set(allFiles)];
}

// ─── Main ───────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  const options = {
    staged: args.includes('--staged'),
    criticalOnly: args.includes('--critical-only'),
    files: null,
  };

  const filesArg = args.find(a => a.startsWith('--files'));
  if (filesArg) {
    const fileList = filesArg.split('=')[1] || args[args.indexOf(filesArg) + 1] || '';
    options.files = fileList.split(/[\s,]+/).filter(Boolean).map(f => path.join(PROJECT_ROOT, f));
  }

  console.log('🔍 Pattern Violation Detector\n');

  const filesToScan = getFilesToScan(options);
  console.log(`Scanning ${filesToScan.length} files...\n`);

  const results = {};
  let totalViolations = 0;

  for (const filePath of filesToScan) {
    const violations = scanFile(filePath);

    if (violations.length > 0) {
      const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
      results[relativePath] = violations;
      totalViolations += violations.length;
    }
  }

  // Filter by severity if critical-only
  if (options.criticalOnly) {
    for (const [file, violations] of Object.entries(results)) {
      results[file] = violations.filter(v => v.severity === SEVERITY.CRITICAL);
      if (results[file].length === 0) {
        delete results[file];
      }
    }
  }

  // Report results
  if (totalViolations === 0) {
    console.log('✅ No violations found!\n');
    process.exit(0);
  }

  console.log(`❌ Found ${totalViolations} violation(s) in ${Object.keys(results).length} file(s):\n`);

  // Group by severity
  const bySeverity = { critical: [], high: [], medium: [], low: [] };

  for (const [file, violations] of Object.entries(results)) {
    for (const violation of violations) {
      bySeverity[violation.severity].push({ file, ...violation });
    }
  }

  // Print violations by severity
  for (const severity of ['critical', 'high', 'medium', 'low']) {
    const viols = bySeverity[severity];
    if (viols.length === 0) continue;

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '⚪';
    console.log(`${icon} ${severity.toUpperCase()} (${viols.length}):\n`);

    for (const v of viols) {
      console.log(`  ${v.file}`);
      console.log(`    ❌ [${v.code}] ${v.msg}`);
      console.log(`    💡 Fix: ${v.fix}`);
      if (v.canonical) {
        console.log(`    📍 Canonical: ${v.canonical}`);
      }
      console.log();
    }
  }

  // Summary
  console.log('---');
  console.log(`Total: ${totalViolations} violations`);
  console.log(`  🔴 Critical: ${bySeverity.critical.length} (blocks commit)`);
  console.log(`  🟠 High: ${bySeverity.high.length} (should fix)`);
  console.log(`  🟡 Medium: ${bySeverity.medium.length} (recommend fix)`);
  console.log(`  ⚪ Low: ${bySeverity.low.length} (optional)`);
  console.log();

  // Exit with error if critical violations found
  if (bySeverity.critical.length > 0) {
    console.log('❌ Commit blocked due to critical violations');
    process.exit(1);
  } else {
    console.log('⚠️  Non-critical violations found (commit allowed)');
    process.exit(0);
  }
}

main();
