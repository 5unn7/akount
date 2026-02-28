/**
 * Shared Project Root Calculator
 *
 * Calculates PROJECT_ROOT regardless of where the script is located in the scripts/ hierarchy.
 * Searches upward for the root marker (package.json or .git/).
 *
 * Usage:
 *   const { getProjectRoot } = require('./lib/project-root');
 *   const PROJECT_ROOT = getProjectRoot(__dirname);
 */

const fs = require('fs');
const path = require('path');

/**
 * Find project root by searching upward for markers
 * @param {string} startDir - Starting directory (usually __dirname)
 * @returns {string} Absolute path to project root
 */
function getProjectRoot(startDir) {
  let currentDir = startDir;
  const markers = ['package.json', '.git', 'TASKS.md'];

  // Traverse up to 10 levels
  for (let i = 0; i < 10; i++) {
    // Check if any marker exists
    for (const marker of markers) {
      const markerPath = path.join(currentDir, marker);
      if (fs.existsSync(markerPath)) {
        return currentDir;
      }
    }

    // Go up one level
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root without finding marker
      break;
    }
    currentDir = parentDir;
  }

  // Fallback: assume scripts are in .claude/scripts and go up 2 levels
  console.warn('⚠️  Could not find project root markers, using fallback');
  return path.resolve(startDir, '../..');
}

module.exports = { getProjectRoot };
