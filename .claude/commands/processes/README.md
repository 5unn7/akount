---
name: processes:README
description: Workflow Commands
---

# Workflow Commands

```
Small fix:    just do it → commit
Medium:       /processes:plan → /processes:work → commit
Large:        /processes:brainstorm → /processes:plan → /processes:work → /processes:review → commit
Validation:   /braindump "is my approach sound?"
```

| Command | Purpose |
|---------|---------|
| `/processes:begin` | Start session — git status, tasks, context |
| `/processes:brainstorm` | Explore unclear requirements |
| `/processes:plan` | Break feature into tasks |
| `/processes:work` | Execute plan step-by-step |
| `/processes:review` | Multi-agent code review |
| `/processes:eod` | End session — document progress |
| `/processes:reset` | Reload context when off-track |
| `/processes:compound` | Document solved problems |
| `/braindump` | Quick validation of an idea/approach |

**Quality checks:** `/quality:a11y-review`, `/quality:brand-voice-check`, `/quality:design-system-enforce`, `/quality:test-coverage-analyze`
