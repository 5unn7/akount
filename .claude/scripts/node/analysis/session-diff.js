#!/usr/bin/env node

/**
 * Session Diff Tracker
 *
 * Tracks what files changed between sessions so /processes:begin can show "what's new."
 *
 * Usage:
 *   node .claude/scripts/session-diff.js --save    # Save current HEAD (end of session)
 *   node .claude/scripts/session-diff.js           # Show diff since last session (start of session)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const LAST_COMMIT_FILE = path.join(PROJECT_ROOT, '.claude/runtime/last-session-commit.txt');
const RUNTIME_DIR = path.join(PROJECT_ROOT, '.claude/runtime');

/**
 * Ensure runtime directory exists
 */
function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

/**
 * Get current HEAD commit hash
 */
function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * Get last session commit
 */
function getLastSessionCommit() {
  if (!fs.existsSync(LAST_COMMIT_FILE)) {
    return null;
  }

  try {
    return fs.readFileSync(LAST_COMMIT_FILE, 'utf-8').trim();
  } catch (error) {
    return null;
  }
}

/**
 * Save current commit as last session
 */
function saveCurrentCommit() {
  ensureRuntimeDir();
  const currentCommit = getCurrentCommit();

  if (!currentCommit) {
    console.error('❌ Could not get current commit (not a git repository?)');
    process.exit(1);
  }

  fs.writeFileSync(LAST_COMMIT_FILE, currentCommit);
  console.log(`✅ Saved session commit: ${currentCommit.substring(0, 8)}`);
  console.log(`   File: .claude/runtime/last-session-commit.txt`);
}

/**
 * Infer domain from file path
 */
function inferDomain(filePath) {
  if (filePath.includes('/banking/')) return 'banking';
  if (filePath.includes('/invoicing/')) return 'invoicing';
  if (filePath.includes('/clients/')) return 'clients';
  if (filePath.includes('/vendors/')) return 'vendors';
  if (filePath.includes('/accounting/')) return 'accounting';
  if (filePath.includes('/planning/')) return 'planning';
  if (filePath.includes('/ai/')) return 'ai';
  if (filePath.includes('/app/(dashboard)/')) return 'web-pages';
  if (filePath.includes('/components/')) return 'web-components';
  if (filePath.includes('packages/')) return 'packages';
  if (filePath.includes('.claude/')) return 'infrastructure';
  if (filePath.includes('docs/')) return 'documentation';
  return 'other';
}

/**
 * Categorize file type
 */
function categorizeFile(filePath) {
  if (filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx') || filePath.includes('__tests__')) {
    return 'test';
  }
  if (filePath.includes('/routes/')) return 'route';
  if (filePath.includes('/services/')) return 'service';
  if (filePath.includes('/components/')) return 'component';
  if (filePath.includes('schema.prisma')) return 'schema';
  if (filePath.includes('/migrations/')) return 'migration';
  if (filePath.includes('.md')) return 'documentation';
  return 'other';
}

/**
 * Get diff summary since last session
 */
function getDiffSummary() {
  const lastCommit = getLastSessionCommit();
  const currentCommit = getCurrentCommit();

  if (!currentCommit) {
    console.log('❌ Not a git repository or no commits');
    return null;
  }

  if (!lastCommit) {
    console.log('ℹ️  No previous session tracked');
    console.log('   This is your first session with diff tracking.');
    console.log('   Run with --save at end of session to start tracking.');
    return null;
  }

  if (lastCommit === currentCommit) {
    console.log('ℹ️  No changes since last session');
    console.log(`   Last session: ${lastCommit.substring(0, 8)}`);
    return null;
  }

  // Get changed files
  let changedFiles;
  try {
    changedFiles = execSync(
      `git diff --name-only ${lastCommit}..${currentCommit}`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    )
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.log(`⚠️  Could not compute diff (commits may be in different branches)`);
    console.log(`   Last session: ${lastCommit.substring(0, 8)}`);
    console.log(`   Current: ${currentCommit.substring(0, 8)}`);
    return null;
  }

  // Get commit count
  let commitCount;
  try {
    commitCount = execSync(
      `git rev-list --count ${lastCommit}..${currentCommit}`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    ).trim();
  } catch (error) {
    commitCount = '?';
  }

  // Categorize files
  const domainCounts = {};
  const typeCounts = {};
  const notableFiles = [];

  for (const file of changedFiles) {
    const domain = inferDomain(file);
    const type = categorizeFile(file);

    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    typeCounts[type] = (typeCounts[type] || 0) + 1;

    // Notable files (new files or schema changes)
    if (type === 'schema' || type === 'migration') {
      notableFiles.push({ file, reason: type });
    }
  }

  // Find new files (A = added in git diff)
  let newFiles;
  try {
    newFiles = execSync(
      `git diff --name-status ${lastCommit}..${currentCommit}`,
      { cwd: PROJECT_ROOT, encoding: 'utf-8' }
    )
      .split('\n')
      .filter(line => line.startsWith('A\t'))
      .map(line => line.substring(2));

    for (const file of newFiles) {
      const type = categorizeFile(file);
      if (type === 'test' || type === 'service' || type === 'route' || type === 'component') {
        notableFiles.push({ file, reason: 'new' });
      }
    }
  } catch (error) {
    newFiles = [];
  }

  return {
    lastCommit,
    currentCommit,
    commitCount,
    fileCount: changedFiles.length,
    newFileCount: newFiles.length,
    domainCounts,
    typeCounts,
    notableFiles: notableFiles.slice(0, 5), // Limit to 5
  };
}

/**
 * Format diff summary for display
 */
function formatDiffSummary(summary) {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Changes Since Last Session');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   Commits: ${summary.commitCount}`);
  console.log(`   Files changed: ${summary.fileCount} (${summary.newFileCount} new)`);
  console.log('');

  // Domain breakdown
  const domains = Object.entries(summary.domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (domains.length > 0) {
    console.log('   Domains affected:');
    for (const [domain, count] of domains) {
      console.log(`     • ${domain} (${count} files)`);
    }
    console.log('');
  }

  // Type breakdown
  const types = Object.entries(summary.typeCounts)
    .filter(([type]) => type !== 'other')
    .sort((a, b) => b[1] - a[1]);

  if (types.length > 0) {
    console.log('   File types:');
    for (const [type, count] of types) {
      console.log(`     • ${type}: ${count}`);
    }
    console.log('');
  }

  // Notable changes
  if (summary.notableFiles.length > 0) {
    console.log('   Notable:');
    for (const { file, reason } of summary.notableFiles) {
      const shortPath = file.length > 60 ? '...' + file.substring(file.length - 57) : file;
      console.log(`     • ${shortPath} (${reason})`);
    }
    console.log('');
  }

  console.log(`   Last session: ${summary.lastCommit.substring(0, 8)}`);
  console.log(`   Current: ${summary.currentCommit.substring(0, 8)}`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--save')) {
    saveCurrentCommit();
    return;
  }

  const summary = getDiffSummary();
  if (summary) {
    formatDiffSummary(summary);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getDiffSummary, saveCurrentCommit, getLastSessionCommit };