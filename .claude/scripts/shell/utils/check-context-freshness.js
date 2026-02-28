#!/usr/bin/env node

/**
 * Context Documentation Freshness Checker
 *
 * Compares last-modified dates of context docs vs related code files.
 * Flags if docs are >7 days older than code they document.
 *
 * Checks:
 *   - docs/context-map.md vs packages/db/prisma/schema.prisma
 *   - apps/api/CLAUDE.md vs apps/api/src/domains/
 *   - apps/web/CLAUDE.md vs apps/web/src/app/
 *   - packages/db/CLAUDE.md vs packages/db/prisma/
 *
 * Usage:
 *   node .claude/scripts/check-context-freshness.js
 *   node .claude/scripts/check-context-freshness.js --file "docs/context-map.md"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const STALE_THRESHOLD_DAYS = 7;
const STALE_THRESHOLD_MS = STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

// Context file → Related code paths mapping
const CONTEXT_FILES = {
  'docs/context-map.md': {
    name: 'Context Map (Model Glossary)',
    relatedPaths: ['packages/db/prisma/schema.prisma'],
  },
  'apps/api/CLAUDE.md': {
    name: 'API Context',
    relatedPaths: ['apps/api/src/domains/**/*.ts'],
  },
  'apps/web/CLAUDE.md': {
    name: 'Web Context',
    relatedPaths: ['apps/web/src/app/**/*.tsx', 'apps/web/src/components/**/*.tsx'],
  },
  'packages/db/CLAUDE.md': {
    name: 'Database Context',
    relatedPaths: ['packages/db/prisma/schema.prisma', 'packages/db/prisma/migrations/**/*'],
  },
  'CLAUDE.md': {
    name: 'Root Context',
    relatedPaths: ['.claude/rules/*.md', 'TASKS.md', 'ROADMAP.md'],
  },
};

/**
 * Get newest mtime from glob patterns
 */
function getNewestMtime(patterns) {
  let newestMtime = 0;
  let newestFile = null;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, {
      cwd: PROJECT_ROOT,
      absolute: true,
      ignore: ['**/node_modules/**']
    });

    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        if (stat.mtimeMs > newestMtime) {
          newestMtime = stat.mtimeMs;
          newestFile = path.relative(PROJECT_ROOT, file).replace(/\\/g, '/');
        }
      } catch (error) {
        // File might not exist
      }
    }
  }

  return { mtime: newestMtime, file: newestFile };
}

/**
 * Check if context file is stale
 */
function checkContextFreshness(contextFile, config) {
  const fullPath = path.join(PROJECT_ROOT, contextFile);

  if (!fs.existsSync(fullPath)) {
    return {
      file: contextFile,
      name: config.name,
      stale: true,
      reason: 'File does not exist',
    };
  }

  const contextStat = fs.statSync(fullPath);
  const contextMtime = contextStat.mtimeMs;

  // Find newest related code file
  const newest = getNewestMtime(config.relatedPaths);

  if (!newest.file) {
    return {
      file: contextFile,
      name: config.name,
      stale: false,
      reason: 'No related code files found',
    };
  }

  const ageDiff = newest.mtime - contextMtime;
  const ageDays = Math.round(ageDiff / (24 * 60 * 60 * 1000));

  if (ageDiff > STALE_THRESHOLD_MS) {
    return {
      file: contextFile,
      name: config.name,
      stale: true,
      ageDays,
      newestCodeFile: newest.file,
      contextDate: new Date(contextMtime).toISOString().split('T')[0],
      codeDate: new Date(newest.mtime).toISOString().split('T')[0],
    };
  }

  return {
    file: contextFile,
    name: config.name,
    stale: false,
    ageDays: ageDays > 0 ? ageDays : 0,
  };
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  const fileArg = args.find(a => a.startsWith('--file'));

  console.log('🔍 Context Documentation Freshness Check\n');
  console.log(`Threshold: ${STALE_THRESHOLD_DAYS} days\n`);

  let filesToCheck = Object.keys(CONTEXT_FILES);

  if (fileArg) {
    const fileName = fileArg.split('=')[1] || args[args.indexOf(fileArg) + 1] || '';
    filesToCheck = [fileName];
  }

  let staleCount = 0;
  const staleFiles = [];

  for (const contextFile of filesToCheck) {
    const config = CONTEXT_FILES[contextFile];
    if (!config) {
      console.log(`⚠️  Unknown context file: ${contextFile}`);
      continue;
    }

    const result = checkContextFreshness(contextFile, config);

    if (result.stale) {
      console.log(`❌ ${result.name}`);
      console.log(`   File: ${result.file}`);
      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      } else {
        console.log(`   STALE by ${result.ageDays} days`);
        console.log(`   Context last updated: ${result.contextDate}`);
        console.log(`   Code last changed: ${result.codeDate}`);
        console.log(`   Newest code file: ${result.newestCodeFile}`);
      }
      console.log();

      staleFiles.push(result.file);
      staleCount++;
    } else {
      console.log(`✅ ${result.name} (fresh${result.ageDays ? `, ${result.ageDays} day${result.ageDays > 1 ? 's' : ''} old` : ''})`);
    }
  }

  console.log();

  if (staleCount > 0) {
    console.log(`⚠️  ${staleCount} context file(s) stale:`);
    for (const file of staleFiles) {
      console.log(`   - ${file}`);
    }
    console.log();
    console.log('💡 Recommendation: Refresh stale context files');
    process.exit(1);
  } else {
    console.log('✅ All context documentation fresh!');
    process.exit(0);
  }
}

main();
