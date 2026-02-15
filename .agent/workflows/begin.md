---
description: start a session with a health check dashboard
---

1. Check git status
git status --short
2. Check recent commits
git log --oneline -5
3. Check branch status
git branch --show-current
4. Check for open PRs
gh pr list --limit 5
5. Check for critical tasks in TASKS.md
grep -E "\[ \]|\[→\]" TASKS.md | head -10
6. Check for TypeScript errors
npx tsc --noEmit
7. Generate a session summary for the user
Summarize the current state based on the output above and ask what to focus on.
