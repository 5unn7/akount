# Review Template

This is a template for creating code review synthesis reports.

## Usage

When running `/processes:review`, the synthesis step should:

1. **Create feature directory:** `docs/reviews/{feature-name}/`
2. **Copy this template:** Use `SUMMARY.md` as starting point
3. **Fill in the blanks:**
   - Replace `{Feature Name}`, `{branch-name}`, etc.
   - Update metrics from actual review data
   - Populate findings from agent reports
4. **Create detailed findings:** Copy full synthesis to `DETAILED.md`
5. **Move agent reports:** Copy from `.reviews/` to `agents/` subdirectory
6. **Update README:** Add entry to `docs/reviews/README.md`

## File Structure

```
docs/reviews/{feature-name}/
├── SUMMARY.md           # This template (filled in)
├── DETAILED.md          # Full synthesis from .reviews/SYNTHESIS.md
├── agents/              # Individual agent reports from .reviews/
│   ├── financial.md
│   ├── architecture.md
│   ├── security.md
│   ├── performance.md
│   ├── fastify.md
│   └── nextjs.md
└── changed-files.txt    # List of reviewed files
```

## Guidelines

- **SUMMARY.md:** Keep under 150 lines. Quick scan for EOD/Audit agents.
- **DETAILED.md:** Full findings with code examples, file locations, fix approaches.
- **Agent reports:** Raw output from each specialized agent (no editing needed).
