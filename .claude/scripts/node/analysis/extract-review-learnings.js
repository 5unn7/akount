#!/usr/bin/env node

/**
 * Review Learning Extractor
 *
 * Parses review SUMMARY.md files from docs/reviews/ and extracts:
 *   - Patterns discovered (API patterns, frontend patterns, gotchas)
 *   - Security issues (for security-patterns.md)
 *   - Financial issues (for financial-patterns.md)
 *   - Architecture lessons (for api-patterns.md)
 *
 * Maps findings to MEMORY topic files for auto-update.
 *
 * Usage:
 *   node .claude/scripts/extract-review-learnings.js
 *   node .claude/scripts/extract-review-learnings.js --review "planning-domain"
 *   node .claude/scripts/extract-review-learnings.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot } = require('../../lib/project-root');

const PROJECT_ROOT = getProjectRoot(__dirname);
const REVIEWS_DIR = path.join(PROJECT_ROOT, 'docs/reviews');
const MEMORY_DIR = path.join(PROJECT_ROOT, 'memory');

// Mapping: finding type → MEMORY topic file
const TOPIC_FILE_MAP = {
  security: 'security-patterns.md',
  financial: 'financial-patterns.md',
  api: 'api-patterns.md',
  frontend: 'frontend-patterns.md',
  database: 'codebase-quirks.md',
  performance: 'codebase-quirks.md',
  architecture: 'api-patterns.md',
  bug: 'debugging-log.md',
  gotcha: 'codebase-quirks.md',
};

/**
 * Parse a review SUMMARY.md file
 */
function parseReviewSummary(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const review = {
    file: path.relative(REVIEWS_DIR, filePath),
    date: null,
    reviewer: null,
    grade: null,
    patterns: [],
    recommendations: [],
    findings: [],
  };

  // Extract metadata
  const dateMatch = content.match(/\*\*Review Date:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) review.date = dateMatch[1];

  const reviewerMatch = content.match(/\*\*Reviewer:\*\*\s*([^\n]+)/);
  if (reviewerMatch) review.reviewer = reviewerMatch[1].trim();

  const gradeMatch = content.match(/\*\*Overall Grade:\*\*\s*([A-F][+-]?)\s*\((\d+)\/100\)/);
  if (gradeMatch) review.grade = { letter: gradeMatch[1], score: parseInt(gradeMatch[2]) };

  // Extract patterns (look for ## or ### Pattern, Best Practice, Lesson, etc.)
  const patternSections = content.match(/###?\s+(Pattern|Best Practice|Lesson|Key Learning|Anti-Pattern)[^\n]*\n([\s\S]*?)(?=\n###?\s+|\n---|\n## |$)/gi);

  if (patternSections) {
    for (const section of patternSections) {
      const titleMatch = section.match(/###?\s+([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

      // Extract first paragraph or bullet points
      const contentMatch = section.match(/\n\n(.+?)(?:\n\n|\n-|\n\*|$)/s);
      const description = contentMatch ? contentMatch[1].trim().substring(0, 200) : '';

      review.patterns.push({ title, description });
    }
  }

  // Extract recommendations
  const recommendationSections = content.match(/###?\s+(Recommendation|Should|Must)[^\n]*\n([\s\S]*?)(?=\n###?\s+|\n---|\n## |$)/gi);

  if (recommendationSections) {
    for (const section of recommendationSections) {
      const titleMatch = section.match(/###?\s+([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown';

      const contentMatch = section.match(/\n\n(.+?)(?:\n\n|\n-|\n\*|$)/s);
      const description = contentMatch ? contentMatch[1].trim().substring(0, 200) : '';

      review.recommendations.push({ title, description });
    }
  }

  // Extract findings (look for severity markers)
  const findingMatches = content.matchAll(/(?:🔴|🟠|🟡|⚪|❌)\s*\*\*([^*]+)\*\*[^\n]*\n([\s\S]*?)(?=\n(?:🔴|🟠|🟡|⚪|❌)|\n###|\n---|\n## |$)/gi);

  for (const match of findingMatches) {
    const title = match[1].trim();
    const description = match[2].trim().substring(0, 300);

    // Classify finding type
    let type = 'general';
    if (title.match(/security|auth|tenant|permission/i)) type = 'security';
    else if (title.match(/financial|money|cents|double-entry|GL/i)) type = 'financial';
    else if (title.match(/API|route|service|endpoint/i)) type = 'api';
    else if (title.match(/frontend|component|UI|page/i)) type = 'frontend';
    else if (title.match(/database|prisma|schema|migration/i)) type = 'database';
    else if (title.match(/performance|slow|index|query/i)) type = 'performance';
    else if (title.match(/bug|error|crash/i)) type = 'bug';

    review.findings.push({ title, description, type });
  }

  return review;
}

/**
 * Map findings to MEMORY topic files
 */
function mapFindingsToTopicFiles(reviews) {
  const topicMap = {};

  for (const review of reviews) {
    for (const finding of review.findings) {
      const topicFile = TOPIC_FILE_MAP[finding.type] || 'debugging-log.md';

      if (!topicMap[topicFile]) {
        topicMap[topicFile] = [];
      }

      topicMap[topicFile].push({
        source: review.file,
        date: review.date,
        reviewer: review.reviewer,
        title: finding.title,
        description: finding.description,
        type: finding.type,
      });
    }

    // Add high-value patterns
    for (const pattern of review.patterns) {
      const topicFile = 'api-patterns.md'; // Default for patterns

      if (!topicMap[topicFile]) {
        topicMap[topicFile] = [];
      }

      topicMap[topicFile].push({
        source: review.file,
        date: review.date,
        reviewer: review.reviewer,
        title: pattern.title,
        description: pattern.description,
        type: 'pattern',
      });
    }
  }

  return topicMap;
}

/**
 * Generate MEMORY updates
 */
function generateMemoryUpdates(topicMap, dryRun = false) {
  console.log('📝 Proposed MEMORY Updates:\n');

  const updates = [];

  for (const [topicFile, learnings] of Object.entries(topicMap)) {
    const topicPath = path.join(MEMORY_DIR, topicFile);

    console.log(`\n## ${topicFile} (+${learnings.length} learnings)\n`);

    for (const learning of learnings) {
      console.log(`### ${learning.title}`);
      console.log(`Source: ${learning.source} (${learning.date})`);
      console.log(`Type: ${learning.type}`);
      console.log(`${learning.description.substring(0, 150)}...`);
      console.log();
    }

    // Generate markdown append
    const appendText = learnings.map(l => `
### ${l.title} (${l.date})

**Source:** ${l.source}
**Reviewer:** ${l.reviewer}
**Type:** ${l.type}

${l.description}

---
`).join('\n');

    updates.push({ file: topicPath, content: appendText });
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN - No files modified');
    return updates;
  }

  // Prompt for approval
  console.log('\n📋 Summary:');
  console.log(`  ${Object.keys(topicMap).length} topic files affected`);
  console.log(`  ${Object.values(topicMap).flat().length} total learnings`);
  console.log();
  console.log('Append these learnings to MEMORY topic files? [y/N]');

  return updates;
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  const reviewArg = args.find(a => a.startsWith('--review'));
  const dryRun = args.includes('--dry-run');

  console.log('🧠 Review Learning Extractor\n');

  // Find review summaries
  let reviewFiles = [];

  if (reviewArg) {
    const reviewName = reviewArg.split('=')[1] || args[args.indexOf(reviewArg) + 1] || '';
    const reviewPath = path.join(REVIEWS_DIR, reviewName, 'SUMMARY.md');

    if (!fs.existsSync(reviewPath)) {
      console.error(`❌ Review not found: ${reviewPath}`);
      process.exit(1);
    }

    reviewFiles = [reviewPath];
  } else {
    // Find all SUMMARY.md files (skip template)
    const allSummaries = [];
    const reviewDirs = fs.readdirSync(REVIEWS_DIR);

    for (const dir of reviewDirs) {
      if (dir === '.template') continue;

      const summaryPath = path.join(REVIEWS_DIR, dir, 'SUMMARY.md');
      if (fs.existsSync(summaryPath)) {
        allSummaries.push(summaryPath);
      }
    }

    reviewFiles = allSummaries;
  }

  console.log(`Found ${reviewFiles.length} review summaries\n`);

  // Parse reviews
  const reviews = reviewFiles.map(parseReviewSummary);

  // Map to topic files
  const topicMap = mapFindingsToTopicFiles(reviews);

  // Generate updates
  const updates = generateMemoryUpdates(topicMap, dryRun);

  if (dryRun) {
    console.log(`\n✅ Dry run complete. ${updates.length} files would be updated.`);
  }
}

main();
