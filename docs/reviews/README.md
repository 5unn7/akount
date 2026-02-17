# Code Review Archive

Multi-agent code review synthesis reports with **machine-readable learning extraction**.

> **See [LEARNING-SYSTEM.md](./LEARNING-SYSTEM.md) for the continuous improvement architecture.**

---

## Learning System Overview

Every review creates a **feedback loop**:

```
Review → Extract Patterns → Update Knowledge → Prevent Future Mistakes
```

**Key features:**
- ✅ Machine-readable frontmatter (YAML) for automated learning extraction
- ✅ Integration with `/processes:eod`, `/processes:audit`, `/processes:reset`
- ✅ Anti-patterns automatically feed into guardrails
- ✅ Recurring issues trigger systemic improvements
- ✅ Architecture strengths become reusable patterns

**See [LEARNING-SYSTEM.md](./LEARNING-SYSTEM.md) for full architecture.**

---

## File Structure

```
docs/reviews/
├── README.md                        # This file
├── {feature-name}/                  # One directory per review
│   ├── SUMMARY.md                   # Executive summary (for quick scanning)
│   ├── agents/                      # Detailed agent reports
│   │   ├── financial.md
│   │   ├── architecture.md
│   │   ├── security.md
│   │   ├── performance.md
│   │   ├── fastify.md
│   │   └── nextjs.md
│   └── changed-files.txt            # List of reviewed files
```

## Usage

### For EOD/Audit Agents
Read `SUMMARY.md` first for high-level overview:
- Verdict (merge/block)
- P0/P1/P2 counts
- Top 5 findings
- Estimated fix effort

Only read detailed agent reports if deeper investigation is needed.

### For Developers
Start with `SUMMARY.md`, then drill into specific agent reports for context.

## Current Reviews

| Review | Date | Verdict | Findings | Key Learnings |
|--------|------|---------|----------|---------------|
| [phase5-reports](./phase5-reports/) | 2026-02-17 | ⚠️ Changes Required | 5 P0, 13 P1, 26 P2 | CSV sanitization, server/client split, cache invalidation |

---

## Quick Start

### For EOD/Audit Agents

**To get review overview:**
```
Read docs/reviews/{feature-name}/SUMMARY.md (lines 1-100)
```

**To extract learnings:**
```
1. Read frontmatter (YAML between --- markers)
2. Check anti_patterns against MEMORY
3. Suggest MEMORY/guardrail updates
```

See [extract-review-learnings.md](../.claude/scripts/extract-review-learnings.md) for full workflow.

### For Developers

**To understand findings:**
1. Read `SUMMARY.md` (quick scan, ~150 lines)
2. Read `DETAILED.md` (full findings with code examples)
3. Check `agents/` for specific domain deep-dives

---

## Documentation

- **[LEARNING-SYSTEM.md](./LEARNING-SYSTEM.md)** — Continuous improvement architecture
- **[BEFORE-AFTER.md](./BEFORE-AFTER.md)** — Visual comparison of old vs new structure
- **[MIGRATION.md](./MIGRATION.md)** — Migration explanation from `.reviews/`
- **[.meta/summary.schema.json](./.meta/summary.schema.json)** — Machine-readable schema
- **[.template/](./.template/)** — Template for future reviews
