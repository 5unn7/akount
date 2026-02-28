#!/usr/bin/env node

/**
 * Build Export Verification Cache
 *
 * Flattens all exports from code indexes into a single lookup cache.
 * Used by verify-import.js for instant export verification (no index loading needed).
 *
 * Usage:
 *   node .claude/scripts/build-export-cache.js
 *
 * Output:
 *   .claude/cache/exports.json (gitignored, regenerated on demand)
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const CACHE_DIR = path.join(PROJECT_ROOT, '.claude/cache');
const CACHE_FILE = path.join(CACHE_DIR, 'exports.json');

// Domain index files
const DOMAIN_INDEX_MAP = {
  banking: 'CODEBASE-BANKING.md',
  invoicing: 'CODEBASE-INVOICING.md',
  accounting: 'CODEBASE-ACCOUNTING.md',
  planning: 'CODEBASE-PLANNING.md',
  ai: 'CODEBASE-AI.md',
  'web-pages': 'CODEBASE-WEB-PAGES.md',
  'web-components': 'CODEBASE-WEB-COMPONENTS.md',
  packages: 'CODEBASE-PACKAGES.md',
};

/**
 * Load a single domain index
 */
function loadDomainIndex(domainKey) {
  const indexFile = DOMAIN_INDEX_MAP[domainKey];
  const indexPath = path.join(PROJECT_ROOT, indexFile);

  if (!fs.existsSync(indexPath)) {
    console.warn(`⚠️  Index not found: ${indexFile}`);
    return null;
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Find START and END markers
    const startIdx = content.indexOf('<!-- CODE-INDEX:START');
    if (startIdx === -1) return null;

    const startLineEnd = content.indexOf('\n', startIdx);
    const endIdx = content.indexOf('CODE-INDEX:END');
    if (endIdx === -1) return null;

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
 * Build flat export cache
 */
function buildExportCache() {
  const cache = {
    exports: {},
    generatedAt: new Date().toISOString(),
    totalExports: 0,
  };

  console.log('🔍 Building export cache from code indexes...\n');

  for (const [domainKey, indexFile] of Object.entries(DOMAIN_INDEX_MAP)) {
    const index = loadDomainIndex(domainKey);
    if (!index) continue;

    console.log(`   Processing ${domainKey}...`);

    // Iterate through files in index
    for (const [fileKey, fileData] of Object.entries(index.f || {})) {
      if (!fileData.e || fileData.e.length === 0) continue; // No exports

      const filePath = fileData.p; // Full path

      // Add each export to cache
      for (const exportName of fileData.e) {
        if (!cache.exports[exportName]) {
          cache.exports[exportName] = {
            domains: [],
            files: [],
            paths: [],
          };
        }

        // Avoid duplicates
        if (!cache.exports[exportName].domains.includes(domainKey)) {
          cache.exports[exportName].domains.push(domainKey);
        }

        if (!cache.exports[exportName].files.includes(fileKey)) {
          cache.exports[exportName].files.push(fileKey);
        }

        if (!cache.exports[exportName].paths.includes(filePath)) {
          cache.exports[exportName].paths.push(filePath);
        }

        cache.totalExports++;
      }
    }
  }

  return cache;
}

/**
 * Main
 */
function main() {
  // Ensure cache directory exists
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  // Build cache
  const cache = buildExportCache();

  // Write to file
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  console.log(`\n✅ Export cache built successfully!`);
  console.log(`   Total exports: ${cache.totalExports}`);
  console.log(`   Unique exports: ${Object.keys(cache.exports).length}`);
  console.log(`   Cache file: .claude/cache/exports.json`);
  console.log(`   Size: ${(fs.statSync(CACHE_FILE).size / 1024).toFixed(2)} KB`);
}

if (require.main === module) {
  main();
}

module.exports = { buildExportCache };
