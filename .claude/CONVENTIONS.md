# .claude Folder Conventions

**One rule:** If a file here doesn't get loaded into AI context or enforce a guardrail, it doesn't belong.

## What belongs

| Folder | Purpose | Examples |
|--------|---------|---------|
| `commands/` | Runnable skills (`/skill-name`) | brainstorm.md, plan.md, work.md |
| `agents/` | Agent prompt definitions | security-sentinel.md, financial-data-validator.md |
| `rules/` | Auto-loaded context rules (path-scoped) | api-conventions.md, financial-rules.md |
| `hooks/` | Shell scripts that enforce guardrails | hard-rules.sh, protect-files.sh |
| `settings.local.json` | Permissions, hooks config | — |

## What doesn't belong

- Indexes, registries, or catalogs of other files (the files ARE the index)
- Guides about how to create skills/agents (do it when you need it)
- Documentation about the configuration (the config is self-documenting)
- Templates for hypothetical future files
- README files that duplicate what the individual files already say

## Maintenance

- **Periodically clean `settings.local.json`** — one-off permission approvals accumulate as garbage entries (full file contents, commit messages). Remove anything that isn't a clean glob pattern.
- **Don't create meta-docs** — if you need to explain how something works, add a comment in the file itself.
- **Agent files are self-documenting** — no separate registry or README needed.
- **Skills should be under 150 lines** — if longer, it's doing too much or duplicating rules.
