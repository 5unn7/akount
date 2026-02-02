# Claude Workflow Visual Guide

Complete visual map of Claude's development workflows for your project.

---

## Single Day Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    🌅 MORNING: Start                         │
│                   /processes:begin                           │
│                  Load yesterday's context                    │
│                  Review TASKS.md for today                  │
│                  Check ROADMAP phase status                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              ⚙️ DAYTIME: Development Work                     │
│                  Pick what to do:                            │
│                                                              │
│    Unclear requirements?                                    │
│           ↓                                                 │
│    /processes:brainstorm                                    │
│           ↓                                                 │
│    Have approach?                                           │
│           ↓                                                 │
│    /processes:plan                                          │
│           ↓                                                 │
│    Ready to code?                                           │
│           ↓                                                 │
│    /processes:work                                          │
│           ↓                                                 │
│    Code complete?                                           │
│           ↓                                                 │
│    /processes:review                                        │
│                                                              │
│    [Repeat as needed throughout day]                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                 🌙 EVENING: End of Day                        │
│                   /processes:eod                             │
│                                                              │
│  ✅ Clean temporary files                                    │
│  ✅ Organize artifacts (brainstorms, plans, reports)        │
│  ✅ Update STATUS.md (today's progress)                     │
│  ✅ Update TASKS.md (tomorrow's work)                       │
│  ✅ Update ROADMAP.md (phase status)                        │
│  ✅ Commit and push to git                                  │
│  ✅ Prepare handoff for tomorrow                            │
│                                                              │
│              Takes ~15-20 minutes                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              ✨ NEXT DAY: Ready to Go                         │
│                                                              │
│  📄 All documentation up-to-date                            │
│  📁 Files organized properly                                │
│  🔒 Work saved to git                                       │
│  📋 Clear next tasks                                        │
│  🧠 Full context preserved                                  │
│                                                              │
│           → Start with /processes:begin                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Development Lifecycle

```
                    IDEA
                     │
         ┌───────────┴────────────┐
         │                        │
    Clear what     Unclear what
    to build?      to build?
         │                        │
         │                  /processes:brainstorm
         │                   (1-2 hours)
         │                        │
         │          ┌────────────┘
         │          │
         ▼          ▼
    /processes:plan
    (0.5-1 hour)
    Creates: docs/plans/YYYY-MM-DD-feature-plan.md
         │
         ▼
    /processes:work
    Execute plan systematically
    (varies by feature: 4-40 hours)
         │
    ┌────┴─────────────┐
    │                  │
    │ Feature complete?
    │                  │
    │    YES    NO
    │     │      │
    │     │   Continue work
    │     │
    ▼     │
/processes:review
All agents validate:
  • kieran-typescript-reviewer
  • architecture-strategist
  • security-sentinel
  • performance-oracle
  • [+10 more as needed]
         │
         ▼
Address findings
         │
         ▼
✅ MERGE & DEPLOY
         │
    /processes:eod
    (Organize artifacts, update docs, push)
         │
    ✨ Feature shipped
         │
  Next feature starts
```

---

## Decision Tree: Which Workflow?

```
START
  │
  ├─ You have an IDEA
  │   │
  │   ├─ Do you have CLEAR requirements?
  │   │   │
  │   │   ├─ NO → /processes:brainstorm (explore)
  │   │   │   └─ Have concrete approach now?
  │   │   │       ├─ YES → /processes:plan
  │   │   │       └─ NO → Continue brainstorming
  │   │   │
  │   │   └─ YES → /processes:plan (create plan)
  │   │       └─ Plan looks complete?
  │   │           ├─ YES → /processes:work
  │   │           └─ NO → Refine plan
  │   │
  │   └─ Ready to CODE?
  │       └─ YES → /processes:work
  │           └─ Implementation done?
  │               ├─ YES → /processes:review
  │               │   └─ Issues found?
  │               │       ├─ YES → Fix them
  │               │       └─ NO → Ready to merge
  │               │
  │               └─ NO → Keep coding
  │
  ├─ It's END OF DAY
  │   └─ /processes:eod
  │       └─ Everything saved, documented, organized
  │
  ├─ You want to START FRESH
  │   └─ /processes:begin
  │       └─ Context loaded, ready to work
  │
  └─ You want to DOCUMENT SOLUTION
      └─ /processes:compound (compound knowledge)
          └─ Create engineering report
```

---

## Weekly Flow

```
📅 MONDAY
  ├─ 🌅 /processes:begin
  ├─ ⚙️  Development work (brainstorm → plan → work → review)
  └─ 🌙 /processes:eod
         (Save week 1 status)

📅 TUESDAY
  ├─ 🌅 /processes:begin
  ├─ ⚙️  Development work
  └─ 🌙 /processes:eod

📅 WEDNESDAY
  ├─ 🌅 /processes:begin
  ├─ ⚙️  Development work
  └─ 🌙 /processes:eod

📅 THURSDAY
  ├─ 🌅 /processes:begin
  ├─ ⚙️  Development work
  └─ 🌙 /processes:eod

📅 FRIDAY
  ├─ 🌅 /processes:begin (start week review)
  ├─ ⚙️  Development work (final push)
  └─ 🌙 /processes:eod (COMPLETE week review)
         └─ Weekly Status Update: docs/archive/sessions/WEEK_2026-W05-SUMMARY.md
         └─ All docs organized for weekend
         └─ Clear priorities for next week

🌙 WEEKEND
  └─ 📄 Review docs/archive/sessions/WEEK_*.md (rest)

📅 MONDAY NEXT WEEK
  └─ 🌅 /processes:begin (context fresh from WEEK_*.md)
```

---

## File Organization (After EOD)

```
Before EOD:
└── project-root/
    ├── STATUS.md (outdated)
    ├── TASKS.md (outdated)
    ├── ROADMAP.md (outdated)
    ├── brainstorm-1.md (loose file)
    ├── plan-1.md (loose file)
    ├── *_errors.txt (build artifact)
    ├── .agent/ (temp directory)
    └── docs/ (incomplete)


After EOD:
└── project-root/
    ├── STATUS.md ✅ UPDATED
    ├── TASKS.md ✅ UPDATED
    ├── ROADMAP.md ✅ UPDATED
    ├── docs/
    │   ├── brainstorms/
    │   │   └── brainstorm-1.md ✅ MOVED
    │   ├── plans/
    │   │   └── plan-1.md ✅ MOVED
    │   └── archive/
    │       └── sessions/
    │           ├── WEEK_2026-01-27-SUMMARY.md (previous)
    │           ├── TOMORROW-SESSION-PREP.md ✅ NEW
    │           └── CODE_REVIEW_*.md (if any, moved here)
    │
    └── (Deleted: *_errors.txt, .agent/)
```

---

## Git Commits Over Time

```
Each Day:
  commit A: "feat: Add dashboard real data integration"
  commit B: "docs: End-of-day update for 2026-02-01"
           └─ STATUS, TASKS, ROADMAP updated
           └─ Session artifacts organized
           └─ Always last commit of the day

Each Week:
  Monday - Friday: ~10 commits total (2 per day)
  Friday Evening: Final commit
             commit N: "docs: End-of-day update for 2026-02-05"
                      └─ Entire week organized
                      └─ Week summary created
                      └─ Ready for weekend

Result: Clean git history with
        • Feature commits mixed with
        • Daily doc update commits
        • All work captured
        • Easy to find "what was done when"
```

---

## Command Quick Map

```
WORKFLOW            COMMAND              INPUT            OUTPUT
─────────────────────────────────────────────────────────────────
Explore             /processes:brainstorm [topic]          docs/brainstorms/
Plan                /processes:plan      [feature]         docs/plans/
Execute             /processes:work      [plan file]       Feature + tests
Review              /processes:review    [PR # or branch]  Review findings
Document            /processes:compound  [problem]         docs/archive/
Close Day           /processes:eod       []                Updated docs + git
Load Context        /processes:begin     []                Session context
Help                /processes:README    []                This guide
─────────────────────────────────────────────────────────────────

Quick Reference:     .claude/commands/processes/eod-quick-ref.md
Detailed Docs:       .claude/commands/processes/*.md
EOD Details:         .claude/commands/processes/eod.md
EOD Quick:           .claude/commands/processes/eod-quick-ref.md
```

---

## Time Investment vs. Benefit

```
Daily EOD Workflow:

Time per day:       15-20 minutes
Days per week:      5 days
Weekly time:        75-100 minutes

Benefit saved:
• No context loss between sessions: +30 min/week
• No hunting for related docs: +20 min/week
• No repeated work due to poor notes: +60 min/week
• Faster context switching: +30 min/week
• Better git history: +10 min/week

Total saved per week: ~150 minutes
Net benefit:         +50-75 minutes/week
Monthly return:      +4-6 hours/month
```

---

## Pro Tips

✅ **Automation:**
- Run EOD at same time (5 PM)
- Make it a ritual (coffee breaks for EOD)
- Set calendar reminder

✅ **Consistency:**
- Always update TASKS before leaving
- Always commit/push at EOD
- Always review next day's tasks before starting

✅ **Context Preservation:**
- Take session notes as you work
- Update TASKS as you discover them
- Link documentation across files

✅ **Team Benefits:**
- Others can pick up your work
- Git history tells the story
- Documentation always current
- No "where did they leave off?" questions

---

## Troubleshooting

```
PROBLEM: "I forgot to run EOD yesterday"
SOLUTION: Run it whenever - it catches everything up

PROBLEM: "Too many files to organize"
SOLUTION: Run daily, takes 2 min if daily vs 30 min if weekly

PROBLEM: "Not sure what to commit"
SOLUTION: Use quick ref checklist - "What should I stage?"

PROBLEM: "Lost context from yesterday"
SOLUTION: Check docs/archive/sessions/TOMORROW-SESSION-PREP.md

PROBLEM: "EOD workflow takes too long"
SOLUTION: Use eod-quick-ref.md instead of full eod.md

PROBLEM: "Temporary files keep piling up"
SOLUTION: Delete in Phase 2 of EOD workflow
```

---

## Success Indicators

After running EOD workflow, you should have:

✅ Clean git history (`git log --oneline` is readable)
✅ Updated documentation (STATUS/TASKS/ROADMAP fresh)
✅ Organized files (no loose brainstorms/plans in root)
✅ Meaningful commits (clear message for each change)
✅ Clear next tasks (TASKS.md is specific and ordered)
✅ No temporary files (errors, .agent directory cleaned)
✅ Saved to remote (git push succeeded)
✅ Ready for tomorrow (can pick up exactly where you left)

---

**This guide maps all workflows. Print it out or bookmark for reference!**
