---
name: pm:README
description: Agent Execution Commands
---

# Agent Execution Commands

```
Single task:    /pm:execute <task-id>
Parallel:       /pm:execute-parallel <task-id1> <task-id2> [task-id3 ...]
```

| Command | Purpose |
|---------|---------|
| `/pm:execute` | Spawn one agent in a worktree to complete a task |
| `/pm:execute-parallel` | Spawn multiple agents simultaneously (2-4 tasks) |

## Available Agents

| Agent | Domain | Handles |
|-------|--------|---------|
| `banking-agent` | Banking | Accounts, transactions, transfers, reconciliation |
| `ui-agent` | Frontend/UI | Design system, components, pages, accessibility |
| `security-agent` | Security | Tenant isolation, auth, OWASP, input validation |
| `compliance-agent` | Compliance | Audit trails, double-entry, immutability, retention |

## Flow

```
Task Lookup → Agent Selection → Worktree Creation → Agent Execution
→ Security Gate → Compliance Gate (financial only) → Merge → Tests → Report
```

## Worktree Management

```bash
bash .claude/scripts/worktree-status.sh       # List active worktrees
bash .claude/scripts/worktree-cleanup.sh <agent> <task>  # Manual merge+cleanup
```

## See Also

- `/processes:claim` — Claim a task from TASKS.md
- `/processes:work` — Manual step-by-step execution (no agent)
- `/processes:review` — Multi-agent code review (post-implementation)
