# .reviews/ — Temporary Workspace

This directory is a **temporary workspace** for review agents during multi-agent code reviews.

## Purpose

- Agents write their findings here during `/processes:review` execution
- Prevents merge conflicts when multiple agents run in parallel
- Files are **not committed** — they're intermediate artifacts

## Workflow

1. **During review:** Agents write individual reports here (`financial.md`, `architecture.md`, etc.)
2. **After review:** Synthesis process creates final report in `docs/reviews/{feature-name}/`
3. **Cleanup:** This directory is cleared before next review (gitignored)

## Final Reports

Completed reviews are archived in:
```
docs/reviews/{feature-name}/
├── SUMMARY.md           # Quick scan overview
├── DETAILED.md          # Full findings
├── agents/              # Individual agent reports
└── changed-files.txt    # Reviewed files list
```

See [docs/reviews/README.md](../docs/reviews/README.md) for archive structure.
