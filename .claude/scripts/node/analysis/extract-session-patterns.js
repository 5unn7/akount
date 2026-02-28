#!/usr/bin/env node

/**
 * Git Diff Pattern Extractor
 *
 * Analyzes git commits from current session to auto-detect:
 * - New utilities
 * - Cross-domain changes
 * - Bug fix patterns
 * - Schema changes
 * - New test files
 * - New shared components
 *
 * Output: .claude/session-patterns.json
 * Consumed by: /processes:end-session
 *
 * Usage:
 *   node .claude/scripts/extract-session-patterns.js [--since="2 hours ago"]
 *   node .claude/scripts/extract-session-patterns.js --commits=5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = '.claude/session-patterns.json';
const DOMAIN_FOLDERS = [
  'apps/api/src/domains/overview',
  'apps/api/src/domains/banking',
  'apps/api/src/domains/business',
  'apps/api/src/domains/invoicing',
  'apps/api/src/domains/clients',
  'apps/api/src/domains/vendors',
  'apps/api/src/domains/accounting',
  'apps/api/src/domains/planning',
  'apps/api/src/domains/ai',
  'apps/api/src/domains/services',
  'apps/api/src/domains/system',
];

const BUG_FIX_KEYWORDS = ['fix', 'bug', 'crash', 'error', 'issue', 'resolve', 'patch'];

// Parse command line args
const args = process.argv.slice(2);
const sinceArg = args.find(arg => arg.startsWith('--since='));
const commitsArg = args.find(arg => arg.startsWith('--commits='));

const since = sinceArg ? sinceArg.split('=')[1] : '2 hours ago';
const commitLimit = commitsArg ? parseInt(commitsArg.split('=')[1]) : 10;

/**
 * Execute git command safely
 */
function gitExec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    return '';
  }
}

/**
 * Get commits since last session
 */
function getRecentCommits() {
  // Try time-based first
  let commits = gitExec(`git log --oneline --format="%H" --since="${since}"`).split('\n').filter(Boolean);

  // Fallback to count-based if no commits found
  if (commits.length === 0) {
    commits = gitExec(`git log --oneline --format="%H" -${commitLimit}`).split('\n').filter(Boolean);
  }

  return commits;
}

/**
 * Get commit details
 */
function getCommitDetails(hash) {
  const subject = gitExec(`git show --format="%s" --no-patch ${hash}`);
  const body = gitExec(`git show --format="%b" --no-patch ${hash}`);
  const files = gitExec(`git diff-tree --no-commit-id --name-only -r ${hash}`).split('\n').filter(Boolean);

  return { hash, subject, body, files };
}

/**
 * Extract domain from file path
 */
function extractDomain(filePath) {
  for (const domainFolder of DOMAIN_FOLDERS) {
    if (filePath.startsWith(domainFolder)) {
      return domainFolder.split('/').pop(); // Last segment is domain name
    }
  }
  return null;
}

/**
 * Detect cross-domain changes
 */
function detectCrossDomain(commit) {
  const domains = new Set();

  commit.files.forEach(file => {
    const domain = extractDomain(file);
    if (domain) {
      domains.add(domain);
    }
  });

  if (domains.size >= 2) {
    return {
      type: 'cross-domain',
      description: `Commit touches ${domains.size} domains: ${Array.from(domains).join(', ')}`,
      domains: Array.from(domains),
      files: commit.files.filter(f => extractDomain(f)),
      confidence: 0.9,
      commit: commit.hash.substring(0, 7),
      message: commit.subject,
    };
  }

  return null;
}

/**
 * Detect new utility functions
 */
function detectNewUtility(commit) {
  const utilityFiles = commit.files.filter(f =>
    (f.includes('/lib/utils/') || f.includes('/domains/') && f.includes('/utils/')) &&
    f.endsWith('.ts') && !f.endsWith('.test.ts')
  );

  if (utilityFiles.length === 0) return null;

  // Check if files are new (added, not modified)
  const newFiles = utilityFiles.filter(file => {
    const status = gitExec(`git diff-tree --no-commit-id --name-status -r ${commit.hash} | grep "${file}"`);
    return status.startsWith('A\t'); // A = Added
  });

  if (newFiles.length > 0) {
    // Try to extract exported function names
    const exports = [];
    newFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const exportMatches = content.match(/export\s+(function|const|class)\s+(\w+)/g) || [];
        exportMatches.forEach(match => {
          const name = match.split(/\s+/).pop();
          exports.push(name);
        });
      } catch (error) {
        // File might not exist in working tree (from old commit)
      }
    });

    return {
      type: 'new-utility',
      description: `New utility added: ${newFiles.map(f => path.basename(f, '.ts')).join(', ')}`,
      files: newFiles,
      exports: exports.slice(0, 10), // Limit to 10
      confidence: 1.0,
      commit: commit.hash.substring(0, 7),
      message: commit.subject,
    };
  }

  return null;
}

/**
 * Detect new shared components
 */
function detectNewComponent(commit) {
  const componentFiles = commit.files.filter(f =>
    (f.includes('packages/ui/src/') || f.includes('apps/web/src/components/shared/')) &&
    (f.endsWith('.tsx') || f.endsWith('.ts')) &&
    !f.endsWith('.test.tsx') &&
    !f.endsWith('.test.ts')
  );

  if (componentFiles.length === 0) return null;

  // Check if files are new
  const newFiles = componentFiles.filter(file => {
    const status = gitExec(`git diff-tree --no-commit-id --name-status -r ${commit.hash} | grep "${file}"`);
    return status.startsWith('A\t');
  });

  if (newFiles.length > 0) {
    return {
      type: 'new-component',
      description: `New shared component: ${newFiles.map(f => path.basename(f, path.extname(f))).join(', ')}`,
      files: newFiles,
      confidence: 0.95,
      commit: commit.hash.substring(0, 7),
      message: commit.subject,
    };
  }

  return null;
}

/**
 * Detect bug fixes
 */
function detectBugFix(commit) {
  const messageText = (commit.subject + ' ' + commit.body).toLowerCase();
  const hasBugKeyword = BUG_FIX_KEYWORDS.some(keyword => messageText.includes(keyword));

  if (hasBugKeyword) {
    // Extract task IDs if present (SEC-XX, FIN-XX, etc.)
    const taskIds = (commit.subject.match(/\b(SEC|FIN|PERF|ARCH|DRY|UX|DEV|TEST)-\d+\b/g) || []).join(', ');

    return {
      type: 'bug-fix',
      description: commit.subject,
      files: commit.files,
      taskIds: taskIds || undefined,
      confidence: 0.85,
      commit: commit.hash.substring(0, 7),
      message: commit.subject,
    };
  }

  return null;
}

/**
 * Detect schema changes
 */
function detectSchemaChange(commit) {
  const schemaFiles = commit.files.filter(f =>
    f.includes('packages/db/prisma/schema.prisma') ||
    f.includes('packages/db/prisma/migrations/')
  );

  if (schemaFiles.length === 0) return null;

  // Analyze what changed
  const changes = [];

  if (schemaFiles.some(f => f.includes('schema.prisma'))) {
    // Try to detect type of change from diff
    const diff = gitExec(`git show ${commit.hash} -- packages/db/prisma/schema.prisma`);

    if (diff.includes('model ') && diff.includes('+model ')) {
      changes.push('Added new model');
    }
    if (diff.includes('@@unique') || diff.includes('@@index')) {
      changes.push('Added index/constraint');
    }
    if (diff.includes('deletedAt')) {
      changes.push('Added soft delete');
    }
    if (diff.includes('@relation')) {
      changes.push('Modified relations');
    }
  }

  const migrationFiles = schemaFiles.filter(f => f.includes('migrations/'));
  if (migrationFiles.length > 0) {
    changes.push(`${migrationFiles.length} migration file(s)`);
  }

  return {
    type: 'schema-change',
    description: changes.length > 0 ? changes.join(', ') : 'Schema modified',
    files: schemaFiles,
    confidence: 1.0,
    commit: commit.hash.substring(0, 7),
    message: commit.subject,
  };
}

/**
 * Detect new test files
 */
function detectNewTests(commit) {
  const testFiles = commit.files.filter(f =>
    f.includes('__tests__/') || f.endsWith('.test.ts') || f.endsWith('.test.tsx')
  );

  if (testFiles.length === 0) return null;

  // Check if files are new
  const newFiles = testFiles.filter(file => {
    const status = gitExec(`git diff-tree --no-commit-id --name-status -r ${commit.hash} | grep "${file}"`);
    return status.startsWith('A\t');
  });

  if (newFiles.length > 0) {
    return {
      type: 'new-tests',
      description: `${newFiles.length} new test file(s) added`,
      files: newFiles,
      confidence: 1.0,
      commit: commit.hash.substring(0, 7),
      message: commit.subject,
    };
  }

  return null;
}

/**
 * Analyze all commits and extract patterns
 */
function analyzeCommits() {
  const commits = getRecentCommits();

  if (commits.length === 0) {
    console.log('No commits found. Try adjusting --since or --commits parameters.');
    return {
      sessionId: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      commitCount: 0,
      patterns: [],
      newExports: [],
      schemaChanges: [],
    };
  }

  console.log(`Analyzing ${commits.length} commits...`);

  const patterns = [];
  const allExports = new Set();
  const schemaChanges = [];

  commits.forEach(hash => {
    const commit = getCommitDetails(hash);

    // Run all detectors
    const detectors = [
      detectCrossDomain,
      detectNewUtility,
      detectNewComponent,
      detectBugFix,
      detectSchemaChange,
      detectNewTests,
    ];

    detectors.forEach(detector => {
      const pattern = detector(commit);
      if (pattern) {
        patterns.push(pattern);

        // Collect exports
        if (pattern.exports) {
          pattern.exports.forEach(exp => allExports.add(exp));
        }

        // Collect schema changes
        if (pattern.type === 'schema-change') {
          schemaChanges.push({
            description: pattern.description,
            commit: pattern.commit,
          });
        }
      }
    });
  });

  return {
    sessionId: `session-${Date.now()}`,
    timestamp: new Date().toISOString(),
    commitCount: commits.length,
    commitRange: `${commits[commits.length - 1].substring(0, 7)}..${commits[0].substring(0, 7)}`,
    patterns,
    newExports: Array.from(allExports),
    schemaChanges,
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Git Diff Pattern Extractor');
  console.log(`   Analyzing commits since: ${since}`);
  console.log(`   Commit limit: ${commitLimit}\n`);

  const results = analyzeCommits();

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  console.log(`\n✅ Analysis complete!`);
  console.log(`   Commits analyzed: ${results.commitCount}`);
  console.log(`   Patterns found: ${results.patterns.length}`);
  console.log(`   New exports: ${results.newExports.length}`);
  console.log(`   Schema changes: ${results.schemaChanges.length}`);
  console.log(`\n📄 Output: ${OUTPUT_FILE}`);

  // Print summary
  if (results.patterns.length > 0) {
    console.log(`\n📊 Pattern Summary:`);
    const typeCounts = {};
    results.patterns.forEach(p => {
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    });
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
  }
}

main();
