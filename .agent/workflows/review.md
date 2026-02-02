---
description: perform code reviews using specialized agents
---

1. Identify files for review
List changed files or specify a PR/directory.
2. Invoke review agents
Run specialized validation against the code matching patterns in `.claude/agents/REGISTRY.json`:
- `financial-data-validator`
- `security-sentinel`
- `architecture-strategist`
- `kieran-typescript-reviewer`
3. Categorize findings
Group by severity (Critical, Warning, Info).
4. Present review report
Generate a detailed report with specific examples and recommendations.
