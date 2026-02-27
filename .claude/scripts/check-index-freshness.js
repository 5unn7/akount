#!/usr/bin/env node

/**
 * Code Index Freshness Checker
 *
 * Compares index build time vs file modification times to detect staleness.
 * Warns if indexes are >1 hour older than newest file in domain.
 *
 * Usage:
 *   node .claude/scripts/check-index-freshness.js
 *   node .claude/scripts/check-index-freshness.js --domain banking
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PROJECT_ROOT = path.join(__dirname, '../..');
const STATE_FILE = path.join(PROJECT_ROOT, '.claude/.code-index-state.json');

// Domain to file paths mapping
const DOMAIN_PATHS = {
  banking: ['apps/api/src/domains/banking/**/*.ts', 'apps/web/src/app/(dashboard)/banking/**/*.tsx'],
  invoicing: ['apps/api/src/domains/invoicing/**/*.ts', 'apps/web/src/app/(dashboard)/business/invoices/**/*.tsx'],
  accounting: ['apps/api/src/domains/accounting/**/*.ts', 'apps/web/src/app/(dashboard)/accounting/**/*.tsx'],
  planning: ['apps/api/src/domains/planning/**/*.ts', 'apps/web/src/app/(dashboard)/planning/**/*.tsx'],
  ai: ['apps/api/src/domains/ai/**/*.ts', 'apps/web/src/app/(dashboard)/insights/**/*.tsx'],
  'web-pages': [
    'apps/web/src/app/(dashboard)/overview/**/*.tsx',
    'apps/web/src/app/(dashboard)/business/clients/**/*.tsx',
    'apps/web/src/app/(dashboard)/business/vendors/**/*.tsx',
  ],
  'web-components': ['apps/web/src/components/**/*.tsx', 'apps/web/src/lib/**/*.ts'],
  packages: ['packages/**/*.ts', 'packages/**/*.tsx'],
};

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get newest file mtime in domain
 */
function getNewestFileMtime(domainKey) {
  const patterns = DOMAIN_PATHS[domainKey];
  if (!patterns) return null;

  let newestMtime = 0;
  let newestFile = null;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      cwd: PROJECT_ROOT,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**']
    });

    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        if (stat.mtimeMs > newestMtime) {
          newestMtime = stat.mtimeMs;
          newestFile = path.relative(PROJECT_ROOT, file);
        }
      } catch (error) {
        // File might have been deleted, skip
      }
    }
  }

  return { mtime: newestMtime, file: newestFile };
}

/**
 * Check if domain index is stale
 */
function checkDomainFreshness(domainKey, domainState) {
  const newest = getNewestFileMtime(domainKey);
  if (!newest || !newest.file) {
    return { stale: false, reason: 'no files found' };
  }

  const indexBuildTime = new Date(domainState.lastBuild).getTime();
  const fileModTime = newest.mtime;

  const ageDiff = fileModTime - indexBuildTime;

  if (ageDiff > STALE_THRESHOLD_MS) {
    const ageHours = Math.round(ageDiff / (60 * 60 * 1000));
    return {
      stale: true,
      reason: `Files modified ${ageHours}h after index build`,
      newestFile: newest.file,
      ageDiff,
    };
  }

  return { stale: false };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);
  const domainArg = args.find(a => a.startsWith('--domain'));

  if (!fs.existsSync(STATE_FILE)) {
    console.log('⚠️  No freshness state found');
    console.log('   Run: node .claude/scripts/regenerate-code-index.js --force');
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));

  let domainsToCheck = Object.keys(state.domains);

  if (domainArg) {
    const domainList = domainArg.split('=')[1] || args[args.indexOf(domainArg) + 1] || '';
    domainsToCheck = domainList.split(/[\s,]+/).filter(Boolean);
  }

  console.log('🔍 Code Index Freshness Check\n');
  console.log(`Last build: ${state.lastBuild}`);
  console.log(`Git commit: ${state.gitCommit.substring(0, 7)}`);
  console.log(`Git branch: ${state.gitBranch}`);
  console.log();

  let staleCount = 0;
  const staleDomains = [];

  for (const domainKey of domainsToCheck) {
    const domainState = state.domains[domainKey];
    if (!domainState) {
      console.log(`❌ ${domainKey}: No state found`);
      staleDomains.push(domainKey);
      staleCount++;
      continue;
    }

    const freshness = checkDomainFreshness(domainKey, domainState);

    if (freshness.stale) {
      console.log(`❌ ${domainKey}: STALE (${freshness.reason})`);
      console.log(`   Newest file: ${freshness.newestFile}`);
      console.log(`   Index size: ${domainState.indexSize} tokens, ${domainState.fileCount} files`);
      staleDomains.push(domainKey);
      staleCount++;
    } else {
      console.log(`✅ ${domainKey}: Fresh (${domainState.fileCount} files, ${domainState.indexSize} tokens)`);
    }
  }

  console.log();

  if (staleCount > 0) {
    console.log(`⚠️  ${staleCount} domain(s) stale: ${staleDomains.join(', ')}`);
    console.log(`   Run: node .claude/scripts/regenerate-code-index.js --domains "${staleDomains.join(' ')}"`);
    process.exit(1);
  } else {
    console.log('✅ All indexes fresh!');
    process.exit(0);
  }
}

main();
