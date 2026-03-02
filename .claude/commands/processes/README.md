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
| `/processes:diagnose` | Structured bug investigation |
| `/processes:end-session` | Lightweight per-instance session capture |
| `/processes:eod` | End of day — aggregate sessions, update artifacts |
| `/processes:reset` | Reload context when off-track |
| `/processes:audit` | Weekly health audit |
| `/braindump` | Quick validation of an idea/approach |

**Quality checks:** `/quality:a11y-review`, `/quality:brand-voice-check`, `/quality:design-system-enforce`, `/quality:test-coverage-analyze`
