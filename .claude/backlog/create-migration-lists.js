#!/usr/bin/env node
/**
 * Creates prioritized migration lists from audit JSON
 */

const fs = require('fs');
const path = require('path');

const auditPath = path.join(__dirname, 'factory-migration-audit.json');
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));

// Extract files needing migration
const needsMigration = audit.files.filter((f) => f.needsMigration);

// Priority domains for focused migration
const HIGH_PRIORITY_DOMAINS = ['accounting', 'banking', 'invoicing', 'business'];

// Prioritize files (handle both / and \ path separators)
const highPriority = needsMigration
  .filter((f) => HIGH_PRIORITY_DOMAINS.some((d) => f.path.includes(`domains${path.sep}${d}`) || f.path.includes(`domains/${d}`)))
  .sort((a, b) => b.objectLiteralCount - a.objectLiteralCount) // Most complex first
  .slice(0, 20);

const lowPriority = needsMigration.filter(
  (f) => !highPriority.find((hp) => hp.path === f.path)
);

// ═══════════════════════════════════════════════════════════════
// Create High-Priority List
// ═══════════════════════════════════════════════════════════════

const highPriorityMd = `# High-Priority Test Migrations (20 files)

**Domain:** Accounting, Banking, Invoicing (core financial logic)
**Effort:** 4-6h (20-30min per file with review)
**Method:** Manual migration with Task agent assistance

---

## Files

${highPriority
  .map((f, i) => {
    const type = f.testType === 'route' ? '🌐 Route' : f.testType === 'service' ? '⚙️ Service' : '📄 Other';
    const complexity = f.objectLiteralCount > 15 ? '⚠️ High' : f.objectLiteralCount > 8 ? 'Medium' : 'Low';
    return `${i + 1}. **${type}** | ${complexity} complexity | ${f.objectLiteralCount} literals\n   \`${f.path}\``;
  })
  .join('\n\n')}

---

## Migration Pattern

See: [apps/api/src/test-utils/README.md](../../apps/api/src/test-utils/README.md)

Examples:
- Route: [domains/accounting/__tests__/tax-rate.routes.test.ts](../../apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts)
- Service: [domains/accounting/__tests__/gl-account.service.test.ts](../../apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts)
`;

fs.writeFileSync(
  path.join(__dirname, 'high-priority-migrations.md'),
  highPriorityMd
);

// ═══════════════════════════════════════════════════════════════
// Create Low-Priority List
// ═══════════════════════════════════════════════════════════════

const lowPriorityMd = `# Low-Priority Test Migrations (${lowPriority.length} files)

**Domain:** AI, system, planning, misc
**Effort:** 3-4h
**Method:** Incremental via pre-commit hook OR batch with Task agent

---

## Files

${lowPriority
  .map((f, i) => {
    const type = f.testType === 'route' ? '🌐' : f.testType === 'service' ? '⚙️' : '📄';
    return `${i + 1}. ${type} \`${f.path}\` (${f.objectLiteralCount} literals)`;
  })
  .join('\n')}

---

## Migration Strategy

**Option A:** Wait for pre-commit hook warnings (incremental, 6-12 months)
**Option B:** Batch migrate after high-priority complete (dedicated 1 day)

Pre-commit hook will warn developers when they modify these files.
`;

fs.writeFileSync(
  path.join(__dirname, 'low-priority-migrations.md'),
  lowPriorityMd
);

// ═══════════════════════════════════════════════════════════════
// Create Summary
// ═══════════════════════════════════════════════════════════════

const summaryMd = `# Factory Migration Lists

**Generated:** ${new Date().toISOString().split('T')[0]}
**Total needing migration:** ${needsMigration.length} files

---

## Priority Distribution

| Priority | Count | Domain Focus | Effort |
|----------|-------|--------------|--------|
| **High** | ${highPriority.length} | Accounting, Banking, Invoicing | 4-6h |
| **Low** | ${lowPriority.length} | AI, System, Planning, Misc | 3-4h or incremental |

---

## Files

- [High-Priority Migrations](./high-priority-migrations.md) — 20 core financial domain files
- [Low-Priority Migrations](./low-priority-migrations.md) — ${lowPriority.length} remaining files
- [Full Audit (JSON)](./factory-migration-audit.json) — Machine-readable metrics

---

## Approach: Hybrid

1. **This week:** Migrate 20 high-priority files (focused sprint)
2. **Ongoing:** Pre-commit hook warns on low-priority files as they're touched
3. **Target:** 90% adoption in 2-4 months

---

## Completed Migrations (2)

✅ \`apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts\` (14 tests passing)
✅ \`apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts\` (23 tests passing)
`;

fs.writeFileSync(path.join(__dirname, 'README.md'), summaryMd);

console.log('✅ Migration lists created:');
console.log('   - .claude/backlog/README.md (summary)');
console.log('   - .claude/backlog/high-priority-migrations.md (20 files)');
console.log(`   - .claude/backlog/low-priority-migrations.md (${lowPriority.length} files)`);
console.log('   - .claude/backlog/factory-migration-audit.json (full audit)');
