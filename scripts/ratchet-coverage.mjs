#!/usr/bin/env node

/**
 * Coverage Ratcheting Script
 *
 * Reads coverage-summary.json from each app and updates
 * vitest.config.ts thresholds to lock in current coverage.
 *
 * Usage:
 *   node scripts/ratchet-coverage.mjs          # Preview changes
 *   node scripts/ratchet-coverage.mjs --apply   # Apply changes to vitest configs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const APPS = [
  { name: 'api', coveragePath: 'apps/api/coverage/coverage-summary.json', configPath: 'apps/api/vitest.config.ts' },
  { name: 'web', coveragePath: 'apps/web/coverage/coverage-summary.json', configPath: 'apps/web/vitest.config.ts' },
];

const METRICS = ['statements', 'branches', 'functions', 'lines'];

function readCoverage(summaryPath) {
  const fullPath = resolve(root, summaryPath);
  if (!existsSync(fullPath)) {
    return null;
  }
  const data = JSON.parse(readFileSync(fullPath, 'utf-8'));
  const total = data.total;
  return {
    statements: Math.floor(total.statements.pct),
    branches: Math.floor(total.branches.pct),
    functions: Math.floor(total.functions.pct),
    lines: Math.floor(total.lines.pct),
  };
}

function updateConfig(configPath, newThresholds) {
  const fullPath = resolve(root, configPath);
  let content = readFileSync(fullPath, 'utf-8');

  for (const metric of METRICS) {
    const regex = new RegExp(`(${metric}:\\s*)\\d+`);
    content = content.replace(regex, `$1${newThresholds[metric]}`);
  }

  return content;
}

const applyMode = process.argv.includes('--apply');

console.log('Coverage Ratcheting Report');
console.log('='.repeat(50));
console.log();

for (const app of APPS) {
  console.log(`[${app.name}]`);

  const coverage = readCoverage(app.coveragePath);
  if (!coverage) {
    console.log(`  No coverage data found at ${app.coveragePath}`);
    console.log(`  Run: cd apps/${app.name} && npx vitest run --coverage`);
    console.log();
    continue;
  }

  // Read current thresholds from config
  const configContent = readFileSync(resolve(root, app.configPath), 'utf-8');
  const currentThresholds = {};
  for (const metric of METRICS) {
    const match = configContent.match(new RegExp(`${metric}:\\s*(\\d+)`));
    currentThresholds[metric] = match ? parseInt(match[1]) : 0;
  }

  console.log('  Metric       Current  Actual  New Threshold');
  console.log('  ' + '-'.repeat(48));

  const newThresholds = {};
  let hasChanges = false;

  for (const metric of METRICS) {
    const current = currentThresholds[metric];
    const actual = coverage[metric];
    // Ratchet: only go up, never down. Floor to nearest integer.
    const proposed = Math.max(current, actual);
    newThresholds[metric] = proposed;

    const changed = proposed > current;
    if (changed) hasChanges = true;

    const marker = changed ? ' ^' : '';
    console.log(`  ${metric.padEnd(14)} ${String(current).padStart(5)}%  ${String(actual).padStart(5)}%  ${String(proposed).padStart(5)}%${marker}`);
  }

  if (hasChanges && applyMode) {
    const updatedContent = updateConfig(app.configPath, newThresholds);
    writeFileSync(resolve(root, app.configPath), updatedContent);
    console.log(`  -> Updated ${app.configPath}`);
  } else if (hasChanges) {
    console.log(`  -> Run with --apply to update thresholds`);
  } else {
    console.log(`  -> Thresholds are current (no changes needed)`);
  }

  console.log();
}

if (!applyMode) {
  console.log('Dry run complete. Use --apply to write changes.');
}
