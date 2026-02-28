#!/usr/bin/env node

/**
 * Import Verification Layer
 *
 * Verifies that claimed imports exist before allowing Edit/Write operations.
 * Prevents hallucination by checking code indexes and falling back to Grep.
 *
 * Usage:
 *   node .claude/scripts/verify-import.js --import "createAccount" --from "account.service"
 *   node .claude/scripts/verify-import.js --import "formatCurrency" --from "@/lib/utils/currency"
 *
 * Exit codes:
 *   0 = Import verified (exists)
 *   1 = Import NOT found (hallucination)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PROJECT_ROOT = path.join(__dirname, '../..');

// Load code index loader
const { loadIndexes } = require('./load-code-index');

const CACHE_FILE = path.join(PROJECT_ROOT, '.claude/cache/exports.json');

/**
 * Check export cache (fast path, before loading indexes)
 */
function checkExportCache(importName, modulePath) {
  // Cache file may not exist yet (not built)
  if (!fs.existsSync(CACHE_FILE)) {
    return { found: false, method: 'cache-miss', reason: 'Cache not built' };
  }

  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

    // Check if export exists
    if (!cache.exports[importName]) {
      return { found: false, method: 'cache', reason: 'Export not in cache' };
    }

    const exportData = cache.exports[importName];

    // Module path verification (if provided)
    if (modulePath) {
      const moduleClean = modulePath.replace(/^.*\//, '').replace(/\.\w+$/, '');
      const pathMatch = exportData.paths.some(p => p.includes(moduleClean)) ||
                        exportData.files.some(f => f.includes(moduleClean));

      if (!pathMatch) {
        return { found: false, method: 'cache', reason: 'Export exists but not in specified module' };
      }
    }

    // Found in cache
    return {
      found: true,
      method: 'cache',
      domains: exportData.domains,
      files: exportData.files,
      paths: exportData.paths,
    };
  } catch (error) {
    // Cache corrupted or invalid, fall back
    return { found: false, method: 'cache-error', reason: error.message };
  }
}

/**
 * Normalize module path for lookup
 */
function normalizeModulePath(modulePath) {
  // Handle package imports (@akount/db, @/lib/utils/currency)
  if (modulePath.startsWith('@akount/')) {
    return modulePath;
  }

  if (modulePath.startsWith('@/')) {
    // @/lib/utils/currency → apps/web/src/lib/utils/currency
    return modulePath.replace('@/', 'apps/web/src/');
  }

  // Relative imports (../services/account.service)
  return modulePath;
}

/**
 * Infer domain from module path
 */
function inferDomainFromPath(modulePath) {
  const normalized = normalizeModulePath(modulePath);

  if (normalized.includes('/banking/')) return 'banking';
  if (normalized.includes('/invoicing/')) return 'invoicing';
  if (normalized.includes('/accounting/')) return 'accounting';
  if (normalized.includes('/planning/')) return 'planning';
  if (normalized.includes('/ai/')) return 'ai';
  if (normalized.includes('/lib/') || normalized.includes('/components/')) return 'web-components';
  if (normalized.includes('packages/')) return 'packages';

  return null;
}

/**
 * Search code index for export
 */
function searchIndexForExport(importName, modulePath) {
  // Try to infer domain from module path
  let domainsToSearch = [];
  const domain = inferDomainFromPath(modulePath);

  if (domain) {
    domainsToSearch = [domain];
  } else {
    // Can't infer, search all domains
    domainsToSearch = ['banking', 'invoicing', 'accounting', 'planning', 'ai', 'web-components', 'packages'];
  }

  // Load relevant domain indexes (suppress console output)
  const originalLog = console.log;
  console.log = () => {}; // Suppress loader output
  const indexes = loadIndexes({ domains: domainsToSearch, includeAdjacency: false });
  console.log = originalLog;

  // Search all loaded indexes
  for (const [domainKey, index] of Object.entries(indexes)) {
    if (!index || !index.f) continue;

    // Search all files in this domain
    for (const [fileName, metadata] of Object.entries(index.f)) {
      if (!metadata.e || !Array.isArray(metadata.e)) continue;

      // Check if module path matches file
      const moduleClean = modulePath.replace(/^.*\//, '').replace(/\.\w+$/, '');
      const pathMatch = metadata.p.includes(moduleClean) || fileName.includes(moduleClean);

      if (pathMatch && metadata.e.includes(importName)) {
        return {
          found: true,
          method: 'index',
          domain: domainKey,
          file: metadata.p,
          exports: metadata.e,
        };
      }
    }
  }

  return { found: false, method: 'index', reason: 'Not found in any index' };
}

/**
 * Fallback: Search with Grep
 */
function searchWithGrep(importName, modulePath) {
  try {
    const normalized = normalizeModulePath(modulePath);

    // Try to find the file
    const patterns = [
      `apps/**/${normalized}.ts`,
      `apps/**/${normalized}.tsx`,
      `packages/**/${normalized}.ts`,
      `packages/**/${normalized}.tsx`,
    ];

    let foundFiles = [];
    for (const pattern of patterns) {
      const files = glob.sync(pattern, {
        cwd: PROJECT_ROOT,
        absolute: true,
        ignore: ['**/node_modules/**', '**/__tests__/**']
      });
      foundFiles = foundFiles.concat(files);
    }

    if (foundFiles.length === 0) {
      return { found: false, method: 'grep', reason: 'File not found' };
    }

    // Search for export in file
    for (const file of foundFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const exportRegex = new RegExp(`export\\s+(?:async\\s+)?(?:function|class|const|interface|type)\\s+${importName}\\b`);

      if (exportRegex.test(content)) {
        return {
          found: true,
          method: 'grep',
          file: path.relative(PROJECT_ROOT, file).replace(/\\/g, '/'),
        };
      }
    }

    return { found: false, method: 'grep', reason: 'Export not found in file' };
  } catch (error) {
    return { found: false, method: 'grep', reason: error.message };
  }
}

/**
 * Main verification function
 */
function verifyImport(importName, modulePath) {
  console.log(`🔍 Verifying import: ${importName} from ${modulePath}\n`);

  // Try cache first (fastest)
  console.log('1️⃣ Checking export cache...');
  const cacheResult = checkExportCache(importName, modulePath);

  if (cacheResult.found) {
    console.log(`✅ Found in cache: ${cacheResult.paths[0]}`);
    console.log(`   Domains: ${cacheResult.domains.join(', ')}`);
    return { verified: true, method: 'cache', ...cacheResult };
  }

  console.log(`❌ Not found in cache (${cacheResult.reason})`);

  // Try index (fast)
  console.log('\n2️⃣ Checking code index...');
  const indexResult = searchIndexForExport(importName, modulePath);

  if (indexResult.found) {
    console.log(`✅ Found in index: ${indexResult.file}`);
    console.log(`   Exports: ${indexResult.exports.join(', ')}`);
    console.log(`⚠️  Cache may be stale, recommend rebuild: node .claude/scripts/build-export-cache.js`);
    return { verified: true, method: 'index', ...indexResult };
  }

  console.log(`❌ Not found in index (${indexResult.reason})`);

  // Fallback to Grep
  console.log('\n3️⃣ Falling back to Grep search...');
  const grepResult = searchWithGrep(importName, modulePath);

  if (grepResult.found) {
    console.log(`✅ Found via Grep: ${grepResult.file}`);
    console.log(`⚠️  Cache and index may be stale`);
    console.log(`   Rebuild cache: node .claude/scripts/build-export-cache.js`);
    console.log(`   Rebuild index: node .claude/scripts/regenerate-code-index.js --force`);
    return { verified: true, method: 'grep', ...grepResult };
  }

  console.log(`❌ Not found via Grep (${grepResult.reason})`);

  // Not found anywhere
  console.log('\n❌ HALLUCINATION DETECTED\n');
  console.log(`Import "${importName}" from "${modulePath}" does not exist.\n`);
  console.log('Possible reasons:');
  console.log('  1. Function name is incorrect');
  console.log('  2. Module path is incorrect');
  console.log('  3. Function exists but is not exported');
  console.log('  4. Cache/index is stale (rebuild both)');
  console.log();

  return { verified: false, importName, modulePath, ...grepResult };
}

// ─── CLI ────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  const importArg = args.find(a => a.startsWith('--import'));
  const fromArg = args.find(a => a.startsWith('--from'));

  if (!importArg || !fromArg) {
    console.log('Usage:');
    console.log('  node verify-import.js --import "createAccount" --from "account.service"');
    console.log('  node verify-import.js --import "formatCurrency" --from "@/lib/utils/currency"');
    process.exit(1);
  }

  const importName = importArg.split('=')[1] || args[args.indexOf(importArg) + 1] || '';
  const modulePath = fromArg.split('=')[1] || args[args.indexOf(fromArg) + 1] || '';

  const result = verifyImport(importName, modulePath);

  if (result.verified) {
    console.log(`\n✅ Import verified via ${result.method}`);
    process.exit(0);
  } else {
    console.log('\n❌ Import verification failed');
    process.exit(1);
  }
}

module.exports = { verifyImport, checkExportCache, searchIndexForExport, searchWithGrep };
