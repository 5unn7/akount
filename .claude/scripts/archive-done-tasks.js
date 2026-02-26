#!/usr/bin/env node

/**
 * TASKS.md Auto-Archive Script
 *
 * Moves completed tasks from TASKS.md → TASKS-ARCHIVE.md
 * Keeps a rolling window of recent completions in TASKS.md
 *
 * Detection rules (task is "done" if ANY match):
 *   1. Strikethrough ID in active table: ~~SEC-24~~
 *   2. Status column contains ✅ or "done"
 *   3. Listed in "Recently Completed" section
 *   4. ID already exists in TASKS-ARCHIVE.md but still in active table
 *
 * Usage:
 *   node .claude/scripts/archive-done-tasks.js              # execute
 *   node .claude/scripts/archive-done-tasks.js --dry-run     # preview
 *   node .claude/scripts/archive-done-tasks.js --keep-recent=5
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const TASKS_FILE = path.join(PROJECT_ROOT, 'TASKS.md');
const ARCHIVE_FILE = path.join(PROJECT_ROOT, 'TASKS-ARCHIVE.md');

const TODAY = new Date().toISOString().split('T')[0];

// ─── Parsers ────────────────────────────────────────────────────────

/**
 * Parse a task row from an active table.
 * Format: | ID | Task | Effort | Priority | Status | Deps | Source |
 */
function parseActiveTaskRow(line) {
  const match = line.match(
    /^\|\s*(?:~~)?([A-Z]+-\d+[a-z]?)(?:~~)?\s*\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|([^|]*)\|/
  );
  if (!match) return null;

  const [, id, title, effort, priority, status, deps, source] = match.map(s =>
    s.trim()
  );
  const isStrikethrough = line.match(/^\|\s*~~[A-Z]+-\d+/);
  const isDone =
    status.includes('✅') || status.toLowerCase().includes('done');

  return {
    id,
    title: title.replace(/^~~|~~$/g, '').trim(),
    effort,
    priority,
    status,
    deps,
    source,
    isStrikethrough: !!isStrikethrough,
    isDone,
    rawLine: line,
  };
}

/**
 * Parse the "Recently Completed" section.
 * Format: | ID | Task | Completed |
 */
function parseRecentlyCompleted(lines) {
  const tasks = [];
  let inSection = false;
  let startLine = -1;
  let endLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('## Recently Completed')) {
      inSection = true;
      startLine = i;
      continue;
    }

    if (inSection && line.startsWith('---')) {
      endLine = i;
      break;
    }

    if (!inSection) continue;

    // Match: | ID | Task | Completed |
    const match = line.match(/^\|\s*([A-Z]+-\d+[a-z]?)\s*\|([^|]+)\|([^|]+)\|/);
    if (match) {
      const [, id, title, completed] = match.map(s => s.trim());
      tasks.push({
        id,
        title,
        completedAt: completed || TODAY,
        lineIndex: i,
      });
    }
  }

  return { tasks, startLine, endLine };
}

/**
 * Build a set of IDs already in the archive file.
 */
function parseArchiveIds(archiveContent) {
  const ids = new Set();
  const lines = archiveContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\|\s*([A-Z]+-\d+[a-z]?)\s*\|/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

// ─── Detection ──────────────────────────────────────────────────────

/**
 * Find all completed tasks in active tables (rules 1, 2, 4).
 */
function findCompletedInActiveTables(lines, archivedIds) {
  const completed = [];
  // Track which sections are "active" (not Recently Completed, not Phase Progress, etc.)
  let inRecentlyCompleted = false;
  let inPhaseProgress = false;
  let inLinkedPlans = false;
  let inUncommitted = false;
  let inLegend = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track sections to skip
    if (line.includes('## Recently Completed')) {
      inRecentlyCompleted = true;
      continue;
    }
    if (line.includes('## Phase Progress')) inPhaseProgress = true;
    if (line.includes('## Linked Plans')) inLinkedPlans = true;
    if (line.includes('## Uncommitted Work')) inUncommitted = true;
    if (line.startsWith('> **Legend:**')) inLegend = true;

    // Reset section tracking on new ## heading
    if (line.startsWith('## ') && !line.includes('## Recently Completed')) {
      inRecentlyCompleted = false;
    }

    // Skip non-active sections
    if (inRecentlyCompleted || inPhaseProgress || inLegend) continue;

    const task = parseActiveTaskRow(line);
    if (!task) continue;

    let reason = null;

    // Rule 1: Strikethrough ID
    if (task.isStrikethrough) {
      reason = 'strikethrough';
    }

    // Rule 2: Status is done
    if (task.isDone) {
      reason = 'done-status';
    }

    // Rule 4: Already in archive
    if (archivedIds.has(task.id)) {
      reason = reason || 'duplicate-in-archive';
    }

    if (reason) {
      completed.push({
        id: task.id,
        title: task.title,
        source: task.source,
        completedAt: TODAY,
        lineIndex: i,
        reason,
      });
    }
  }

  return completed;
}

// ─── Mutations ──────────────────────────────────────────────────────

/**
 * Remove specific line indices from content lines array.
 * Returns new array with those lines removed.
 */
function removeLinesFromContent(lines, lineIndices) {
  const toRemove = new Set(lineIndices);
  return lines.filter((_, i) => !toRemove.has(i));
}

/**
 * Prepend tasks to TASKS-ARCHIVE.md.
 * Inserts after the table header row (| ID | Task | ... | and |----...|).
 */
function prependToArchive(archiveContent, tasks) {
  if (tasks.length === 0) return archiveContent;

  const lines = archiveContent.split('\n');
  let insertAfter = -1;

  // Find the header separator row (|----|------|...)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\|[-\s|]+\|$/)) {
      insertAfter = i;
      break;
    }
  }

  if (insertAfter === -1) {
    // No table found — create one
    const header = '| ID | Task | Completed | Source |';
    const separator = '|----|------|-----------|--------|';
    const rows = tasks.map(
      t => `| ${t.id} | ${t.title} | ${t.completedAt} | ${t.source || ''} |`
    );
    return archiveContent + '\n' + header + '\n' + separator + '\n' + rows.join('\n') + '\n';
  }

  // Insert new rows after separator
  const newRows = tasks.map(
    t => `| ${t.id} | ${t.title} | ${t.completedAt} | ${t.source || ''} |`
  );

  lines.splice(insertAfter + 1, 0, ...newRows);
  return lines.join('\n');
}

/**
 * Trim the "Recently Completed" section to keepCount entries.
 * Returns { lines, overflowTasks } where overflowTasks need archiving.
 */
function trimRecentlyCompleted(lines, keepCount) {
  const { tasks, startLine, endLine } = parseRecentlyCompleted(lines);

  if (tasks.length <= keepCount) {
    return { lines, overflowTasks: [] };
  }

  // Keep the most recent (first keepCount), archive the rest
  const toKeep = tasks.slice(0, keepCount);
  const toArchive = tasks.slice(keepCount);

  // Rebuild the section
  const beforeSection = lines.slice(0, startLine);
  const afterSection = lines.slice(endLine);

  const sectionLines = [
    '## Recently Completed',
    '',
    `_Last ${keepCount} — full history in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_`,
    '',
    '| ID | Task | Completed |',
    '|----|------|-----------|',
    ...toKeep.map(t => `| ${t.id} | ${t.title} | ${t.completedAt} |`),
    '',
  ];

  const newLines = [...beforeSection, ...sectionLines, ...afterSection];

  const overflowTasks = toArchive.map(t => ({
    id: t.id,
    title: t.title,
    completedAt: t.completedAt,
    source: '',
    reason: 'recently-completed-overflow',
  }));

  return { lines: newLines, overflowTasks };
}

/**
 * Recount active tasks and update the header stats line.
 */
function updateHeaderStats(lines) {
  let critical = 0,
    high = 0,
    medium = 0,
    low = 0;
  let backlog = 0,
    ready = 0,
    blocked = 0,
    deferred = 0;
  let total = 0;

  // Skip "Recently Completed" and non-task sections
  let inRecentlyCompleted = false;
  let inPhaseProgress = false;

  for (const line of lines) {
    if (line.includes('## Recently Completed')) inRecentlyCompleted = true;
    if (line.includes('## Phase Progress')) inPhaseProgress = true;
    if (
      line.startsWith('## ') &&
      !line.includes('## Recently Completed') &&
      !line.includes('## Phase Progress')
    ) {
      inRecentlyCompleted = false;
      inPhaseProgress = false;
    }
    if (inRecentlyCompleted || inPhaseProgress) continue;

    const task = parseActiveTaskRow(line);
    if (!task) continue;
    // Skip done tasks still in active tables (shouldn't happen after archive)
    if (task.isDone || task.isStrikethrough) continue;

    total++;

    // Priority
    if (task.priority.includes('🔴')) critical++;
    else if (task.priority.includes('🟠')) high++;
    else if (task.priority.includes('🟡')) medium++;
    else if (task.priority.includes('⚪')) low++;

    // Status
    if (task.status.includes('📦')) backlog++;
    else if (task.status.includes('🟢')) ready++;
    else if (task.status.includes('🔒')) blocked++;
    else if (task.status.includes('🟡')) deferred++;
  }

  // Find and replace the stats line
  const statsLine = `> **${total} active tasks** · 🔴 ${critical} critical · 🟠 ${high} high · 🟡 ${medium} medium · ⚪ ${low} low`;
  const statusLine = `> 📦 ${backlog} backlog · 🟢 ${ready} ready · 🔒 ${blocked} blocked · 🟡 ${deferred} deferred`;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('> **') && lines[i].includes('active tasks')) {
      lines[i] = statsLine;
    }
    if (lines[i].startsWith('> 📦')) {
      lines[i] = statusLine;
    }
  }

  return lines;
}

// ─── Main ───────────────────────────────────────────────────────────

function archiveDoneTasks(options = {}) {
  const dryRun = options.dryRun || false;
  const keepRecent = options.keepRecent || 10;

  console.log(`📦 Archive Done Tasks${dryRun ? ' (DRY RUN)' : ''}`);
  console.log(`   Keep recent: ${keepRecent}\n`);

  // Read files
  if (!fs.existsSync(TASKS_FILE)) {
    console.error('❌ TASKS.md not found');
    return { archivedCount: 0 };
  }

  const tasksContent = fs.readFileSync(TASKS_FILE, 'utf8');
  let archiveContent = '';
  if (fs.existsSync(ARCHIVE_FILE)) {
    archiveContent = fs.readFileSync(ARCHIVE_FILE, 'utf8');
  } else {
    archiveContent = [
      '# Akount — Completed Tasks Archive',
      '',
      '> Historical record of completed tasks. Active tasks are in [TASKS.md](TASKS.md).',
      '',
      '---',
      '',
      '## Completed Tasks (Most Recent First)',
      '',
      '| ID | Task | Completed | Source |',
      '|----|------|-----------|--------|',
      '',
    ].join('\n');
  }

  let lines = tasksContent.split('\n');
  const archivedIds = parseArchiveIds(archiveContent);

  // Step 1: Find completed tasks in active tables (rules 1, 2, 4)
  const completedInActive = findCompletedInActiveTables(lines, archivedIds);
  console.log(
    `  🔍 Found ${completedInActive.length} completed tasks in active tables`
  );
  for (const t of completedInActive) {
    console.log(`     ${t.id}: ${t.title.substring(0, 60)} [${t.reason}]`);
  }

  // Step 2: Remove completed tasks from active tables
  const linesToRemove = completedInActive.map(t => t.lineIndex);
  lines = removeLinesFromContent(lines, linesToRemove);

  // Step 3: Trim "Recently Completed" to keepRecent
  const { lines: trimmedLines, overflowTasks } = trimRecentlyCompleted(
    lines,
    keepRecent
  );
  lines = trimmedLines;

  console.log(
    `  📋 Recently Completed overflow: ${overflowTasks.length} tasks to archive`
  );

  // Step 4: Combine all tasks to archive (dedup by ID)
  const allToArchive = [];
  const seenIds = new Set();

  // Active table completions first (they have source info)
  for (const t of completedInActive) {
    if (!seenIds.has(t.id) && !archivedIds.has(t.id)) {
      seenIds.add(t.id);
      allToArchive.push(t);
    }
  }

  // Then overflow from Recently Completed
  for (const t of overflowTasks) {
    if (!seenIds.has(t.id) && !archivedIds.has(t.id)) {
      seenIds.add(t.id);
      allToArchive.push(t);
    }
  }

  console.log(`  📦 Total tasks to archive: ${allToArchive.length}`);

  // Step 5: Update header stats
  lines = updateHeaderStats(lines);

  // Step 6: Prepend to archive
  const newArchiveContent = prependToArchive(archiveContent, allToArchive);

  // Step 7: Update archive count in TASKS.md header
  const currentArchiveCount = archivedIds.size + allToArchive.length;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Completed tasks') && lines[i].includes('archived')) {
      lines[i] = `> _Completed tasks (${currentArchiveCount}) archived in [TASKS-ARCHIVE.md](TASKS-ARCHIVE.md)_`;
    }
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN — no files modified');
    console.log(`   Would remove ${completedInActive.length} rows from active tables`);
    console.log(`   Would archive ${allToArchive.length} tasks to TASKS-ARCHIVE.md`);
    console.log(`   Would keep ${keepRecent} in Recently Completed`);
    if (allToArchive.length > 0) {
      console.log('\n   Tasks to archive:');
      for (const t of allToArchive) {
        console.log(`     ${t.id}: ${t.title.substring(0, 70)}`);
      }
    }
    return { archivedCount: allToArchive.length, dryRun: true };
  }

  // Write files
  fs.writeFileSync(TASKS_FILE, lines.join('\n'), 'utf8');
  console.log('  ✅ Updated TASKS.md');

  fs.writeFileSync(ARCHIVE_FILE, newArchiveContent, 'utf8');
  console.log('  ✅ Updated TASKS-ARCHIVE.md');

  console.log(`\n✨ Archived ${allToArchive.length} tasks successfully!`);
  return { archivedCount: allToArchive.length };
}

// ─── CLI ────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const keepRecentArg = args.find(a => a.startsWith('--keep-recent='));
  const keepRecent = keepRecentArg
    ? parseInt(keepRecentArg.split('=')[1], 10)
    : 10;

  archiveDoneTasks({ dryRun, keepRecent });
}

module.exports = { archiveDoneTasks };