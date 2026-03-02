#!/usr/bin/env node

/**
 * Reorganize TASKS.md by moving all completed tasks to Done section
 *
 * Process:
 * 1. Parse TASKS.md and identify all sections
 * 2. Extract completed tasks (strikethrough + checkmark)
 * 3. Remove completed tasks from active sections
 * 4. Add completed tasks to Done section
 * 5. Update summary counts
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(process.cwd(), 'TASKS.md');

// Parse a task line to extract components
function parseTaskLine(line) {
  // Simple check: does line have strikethrough AND checkmark?
  const isCompleted = line.includes('~~') && line.includes('✅');

  if (!isCompleted) {
    return null; // Not a completed task
  }

  // Extract ID (first ~~ID~~ pattern)
  const idMatch = line.match(/~~([A-Z]+-\d+)~~/);
  if (!idMatch) return null;

  const id = idMatch[1];

  // Split by pipes and clean up (DON'T filter empty parts!)
  const parts = line.split('|').map(p => p.trim());

  if (parts.length < 7) return null;

  // parts[0] = empty (before first |)
  // parts[1] = ~~ID~~
  // parts[2] = ~~description~~
  // parts[3] = effort
  // parts[4] = priority
  // parts[5] = ✅
  // parts[6] = commit (may be empty)
  // parts[7] = source
  // parts[8] = empty (after last |)

  const description = parts[2].replace(/~~/g, ''); // Remove strikethrough markers
  const commit = parts[6] || '';
  const source = parts[7] || '';

  return {
    id,
    description,
    effort: parts[3],
    priority: parts[4],
    commit,
    source,
    isComplete: true,
    originalLine: line
  };
}

// Extract completion date from git log for a task ID
function getCompletionDate(taskId, commitHash) {
  if (!commitHash || commitHash === 'existing' || commitHash === 'pending') {
    return '2026-02-21'; // Default to today for tasks without commits
  }

  try {
    const { execSync } = require('child_process');
    const date = execSync(`git log -1 --format=%cs ${commitHash} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return date || '2026-02-21';
  } catch (error) {
    return '2026-02-21';
  }
}

// Convert completed task to Done section format
function toDoneFormat(task) {
  const completionDate = getCompletionDate(task.id, task.commit);
  const commit = task.commit || 'pending';
  const shortDesc = task.description.replace(/\*\*/g, ''); // Remove markdown bold

  return `| ✅ ${task.id} | ${shortDesc} | ${completionDate} | ${commit} |`;
}

function main() {
  console.log('📊 Reorganizing TASKS.md...\n');

  // Read TASKS.md
  const content = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = content.split('\n');

  const completedTasks = [];
  const newLines = [];
  let inDoneSection = false;
  let doneStartIndex = -1;
  let currentSection = '';
  let removedCount = 0;

  // First pass: extract completed tasks and remove from active sections
  let parsedTaskCount = 0;
  let completedInDoneCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track sections
    if (line.startsWith('## ')) {
      currentSection = line;
      if (line.includes('Done (Recent)')) {
        inDoneSection = true;
        doneStartIndex = i;
      } else {
        inDoneSection = false;
      }
    }

    // Parse task lines
    const task = parseTaskLine(line);

    if (task) {
      parsedTaskCount++;
      if (inDoneSection) {
        completedInDoneCount++;
      }
    }

    if (task && task.isComplete && !inDoneSection) {
      // This is a completed task in an active section - extract it
      completedTasks.push(task);
      removedCount++;
      console.log(`  ✅ Extracted: ${task.id} - ${task.description.substring(0, 60)}...`);
      continue; // Skip adding to newLines (remove from active section)
    }

    newLines.push(line);
  }

  console.log(`\n🔍 Debug: parsedTaskCount=${parsedTaskCount}, completedInDoneCount=${completedInDoneCount}, inDoneSection=${inDoneSection}`);

  console.log(`\n📋 Found ${completedTasks.length} completed tasks in active sections`);

  if (completedTasks.length === 0) {
    console.log('✨ No tasks to move - TASKS.md is already organized!\n');
    return;
  }

  // Sort completed tasks by completion date (newest first)
  completedTasks.sort((a, b) => {
    const dateA = getCompletionDate(a.id, a.commit);
    const dateB = getCompletionDate(b.id, b.commit);
    return dateB.localeCompare(dateA); // Descending
  });

  // Find Done section and insert completed tasks
  const doneHeaderIndex = newLines.findIndex(line => line.includes('## Done (Recent)'));

  if (doneHeaderIndex === -1) {
    console.error('❌ Could not find "## Done (Recent)" section!');
    process.exit(1);
  }

  // Find the table header (should be 2 lines after Done header)
  const tableHeaderIndex = doneHeaderIndex + 2;
  const tableSeparatorIndex = doneHeaderIndex + 3;

  // Insert completed tasks after the table separator
  const insertIndex = tableSeparatorIndex + 1;

  // Convert completed tasks to Done format
  const doneEntries = completedTasks.map(task => toDoneFormat(task));

  // Insert at the top of Done section (after header row)
  newLines.splice(insertIndex, 0, ...doneEntries);

  console.log(`\n📝 Added ${doneEntries.length} tasks to Done section`);

  // Write back to file
  fs.writeFileSync(TASKS_FILE, newLines.join('\n'), 'utf8');

  console.log('\n✨ TASKS.md reorganized successfully!');
  console.log(`   Removed ${removedCount} completed tasks from active sections`);
  console.log(`   Added ${doneEntries.length} tasks to Done section`);
  console.log('\n💡 Next: Run `node .claude/scripts/regenerate-task-index.js` to update counts\n');
}

main();
