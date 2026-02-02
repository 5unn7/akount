---
name: processes:begin
description: Session startup dashboard - Get up to speed quickly
argument-hint: "[optional focus area]"
---

# Workflow: Begin

Your session startup ritual. Get Claude and yourself up to speed in 2-3 minutes.

**Current Date:** 2026-01-30

---

## Purpose

Start every coding session with context:
- 📊 **Overview** - Project status at a glance
- 🎯 **Next Tasks** - What to work on
- ⚠️ **Blockers** - Issues to watch
- 📰 **Updates** - Relevant news and changes
- 💡 **Recommendations** - Smart suggestions

**Like a morning standup with your AI pair programmer.**

---

## Usage

```bash
# Standard session start
/workflows:begin

# Focus on specific area
/workflows:begin api
/workflows:begin frontend
/workflows:begin database

# Quick mode (30 seconds)
/workflows:begin --quick

# Deep dive (5 minutes)
/workflows:begin --deep
```

---

## Workflow

### Phase 1: Project Health Check (30 seconds)

Quick scan of project status:

#### Git Status
```bash
# Uncommitted changes
git status --short

# Recent commits
git log --oneline -5

# Current branch
git branch --show-current

# Ahead/behind remote
git status -sb
```

**Check for:**
- Uncommitted work
- Untracked files
- Stale branches
- Conflicts

#### Repository State
```bash
# Open PRs
gh pr list --json number,title,author,updatedAt --limit 5

# Recent issues
gh issue list --json number,title,labels,updatedAt --limit 5

# CI/CD status
gh run list --limit 3
```

**Check for:**
- PRs needing review
- Critical issues
- Failed builds
- Deployment status

---

### Phase 2: Task Overview (45 seconds)

Identify what's next:

#### From TASKS.md
```bash
# Read current tasks
cat TASKS.md | grep -E "\[ \]|\[x\]" | head -20
```

**Extract:**
- Pending tasks [ ]
- In progress tasks [→]
- Completed today [x]
- Priority items 🔥

#### From TODO Comments
```bash
# Find TODO/FIXME in code
grep -r "TODO\|FIXME\|HACK" apps/ packages/ --include="*.ts" --include="*.tsx" | head -10
```

**Categorize:**
- Critical TODOs
- Quick wins
- Technical debt
- Future enhancements

#### From Recent Activity
```bash
# Files changed recently
git diff --name-only HEAD~3..HEAD

# Active work areas
git log --oneline --since="3 days ago" --pretty=format:"%s" | head -10
```

**Identify:**
- Active features
- Recent fixes
- Current focus area

---

### Phase 3: Problems & Blockers (30 seconds)

Surface issues needing attention:

#### Code Issues
```bash
# TypeScript errors
npx tsc --noEmit 2>&1 | grep "error TS" | head -5

# ESLint warnings
npm run lint 2>&1 | grep -E "warning|error" | head -5

# Test failures
npm test 2>&1 | grep -E "FAIL|ERROR" | head -3
```

#### Build/Deploy Issues
```bash
# Check build status
npm run build --dry-run 2>&1 | grep -E "ERROR|WARN"

# Database status
npx prisma migrate status
```

#### Recent Errors
```bash
# Search error logs
tail -100 server.log 2>/dev/null | grep -i "error" | tail -5

# Recent exceptions
grep -r "throw new Error" apps/api/src --include="*.ts" | wc -l
```

**Flag:**
- Build failures
- Test failures
- Type errors
- Database issues
- Recent exceptions

---

### Phase 4: Recent Learnings (15 seconds)

Quick review of solved problems:

```bash
# Recent solutions
ls -lt docs/solutions/**/*.md | head -3

# Read latest learning
cat $(ls -t docs/solutions/**/*.md | head -1) | head -30
```

**Surface:**
- Recent fixes
- New patterns
- Lessons learned
- Preventions

---

### Phase 5: Stack News & Updates (30 seconds)

Check for relevant updates:

#### Framework Updates
```bash
# Check outdated packages (critical only)
npm outdated | grep -E "next|fastify|prisma|clerk"

# Check for security advisories
npm audit --audit-level=high 2>&1 | head -10
```

#### Technology News (Quick Search)
```bash
# Use research agents
Task(best-practices-researcher, "Check for Next.js 16 breaking changes 2026")
Task(framework-docs-researcher, "Clerk authentication updates January 2026")
```

**Focus on:**
- Breaking changes
- Security patches
- Deprecations
- Best practice updates

#### Akount-Specific
- Railway status
- Clerk service status
- Database health
- API performance

---

### Phase 6: Generate Dashboard (30 seconds)

Compile findings into readable summary:

```markdown
# Session Dashboard - [Date] [Time]

## 📊 Project Status: [HEALTHY / NEEDS ATTENTION / BLOCKED]

### Git Status
- Branch: [current-branch]
- Uncommitted: [X files]
- Behind origin: [X commits]
- Untracked: [X files]

### Build Health
- ✅ TypeScript: No errors
- ⚠️ ESLint: 3 warnings
- ✅ Tests: 142 passing
- ✅ Build: Successful

---

## 🎯 Next Tasks (Priority Order)

### 🔥 High Priority
1. **Fix auth timeout issue** (Bug #234)
   - Status: In Progress
   - Blocker: Needs Clerk SDK update
   - Est: 2 hours

2. **Add invoice pagination** (Feature #345)
   - Status: Ready to start
   - Depends on: API changes merged
   - Est: 4 hours

### 📋 Medium Priority
3. Review PR #123 - Multi-currency support
4. Update Prisma schema for new entity types
5. Fix TODO in invoice calculation (apps/api/src/routes/invoices.ts:45)

### 💡 Quick Wins (< 30 min)
- Fix TypeScript error in dashboard component
- Update README with new API endpoints
- Add test for edge case in payment processing

---

## ⚠️ Things to Watch Out For

### Critical
- 🔴 **Security:** 2 high-severity npm vulnerabilities
  - Action: Run `npm audit fix`
  - Affects: Clerk authentication

- 🔴 **Build:** TypeScript error in new feature branch
  - Location: apps/web/src/components/InvoiceList.tsx:23
  - Action: Fix type mismatch

### Important
- 🟡 **Performance:** Dashboard slow on 100+ invoices
  - Potential N+1 query issue
  - Location: apps/api/src/routes/dashboard.ts
  - Consider: Add pagination

- 🟡 **Tech Debt:** 15 TODO comments in invoice module
  - 3 marked as FIXME
  - 2 marked as HACK

### Monitoring
- ⚪ Database connections: 45/100 (healthy)
- ⚪ API response time: 180ms avg (good)
- ⚪ Memory usage: 512MB/2GB (healthy)

---

## 📰 Recent Updates (Last 3 Days)

### Completed
- ✅ Fixed tenant isolation in invoice API (2026-01-29)
- ✅ Added Zod validation to all routes (2026-01-28)
- ✅ Optimized N+1 query in dashboard (2026-01-27)

### In Progress
- 🚧 Multi-currency invoice support (PR #123)
- 🚧 Performance optimization sprint
- 🚧 Clerk SDK v6 migration

### Recent PRs
- #123: Multi-currency support (Waiting for review)
- #124: Fix auth timeout (Merged yesterday)
- #125: Add pagination (Draft)

---

## 💡 Smart Recommendations

### Based on Recent Activity
1. **Continue multi-currency work** - PR #123 is close to done
   - Needs: Final review from @bob
   - Then: Document with /workflows:compound

2. **Address auth timeout issue** - High priority
   - Related: Recent Clerk updates
   - Check: docs/solutions/security/ for similar issues

3. **Plan performance sprint** - Multiple slow queries identified
   - Run: /deepen-plan on performance optimization
   - Review: docs/solutions/performance/ learnings

### Based on Stack News
4. **Update Clerk SDK** - Version 6.0 released
   - Breaking changes in JWT verification
   - Security patches included
   - Migration guide available

5. **Next.js 16.1 available** - Performance improvements
   - Faster server actions
   - Better error boundaries
   - Consider upgrading soon

### Technical Debt
6. **Refactor invoice module** - 15 TODOs accumulated
   - Dedicate 2 hours to cleanup
   - Extract common patterns
   - Update tests

---

## 🎯 Suggested Session Plan

**Morning Session (2-4 hours):**
1. Fix critical security vulnerabilities (30 min)
2. Address auth timeout bug (2 hours)
3. Review and merge PR #123 (30 min)
4. Document learnings with /workflows:compound (15 min)

**Afternoon Session (2-3 hours):**
1. Start invoice pagination feature (1.5 hours)
2. Clean up 5 TODO comments (45 min)
3. Write tests for new features (30 min)
4. Review code with /workflows:review (15 min)

---

## 📚 Helpful Resources

### Recent Learnings
- [N+1 Query Fix](docs/solutions/performance/2026-01-27-n-plus-one.md)
- [Tenant Isolation](docs/solutions/security/2026-01-25-tenant-isolation.md)
- [Clerk JWT Verification](docs/solutions/security/2026-01-20-clerk-jwt.md)

### Relevant Docs
- [API Design Standards](docs/standards/api-design.md)
- [Multi-tenancy Standards](docs/standards/multi-tenancy.md)
- [Security Standards](docs/standards/security.md)

### Quick Commands
```bash
# Start work on high priority task
/workflows:work "Fix auth timeout issue"

# Review before merging
/workflows:review

# Document when done
/workflows:compound "Fixed auth timeout"
```

---

## 🚦 Session Status: READY TO CODE

**Focus:** Fix auth timeout issue
**Blocker:** None
**Support:** All systems operational

**Let's ship it! 🚀**

---

_Generated by /workflows:begin on 2026-01-30 at 9:00 AM_
_Refresh: Run /workflows:begin again anytime_
```

---

## Output Variants

### Quick Mode (--quick)

**30 seconds:** Essential info only

```
📊 Status: HEALTHY | Branch: main | Uncommitted: 2 files

🎯 Next: Fix auth timeout (#234) → Add pagination (#345)

⚠️ Watch: 2 npm vulnerabilities, TypeScript error in InvoiceList.tsx

📰 Recent: Fixed N+1 query, Multi-currency PR ready

💡 Start: Fix security issues → Work on auth timeout

Ready! 🚀
```

### Deep Mode (--deep)

**5 minutes:** Comprehensive analysis

- Run all checks
- Read recent commits in detail
- Analyze TODO comments by module
- Check all open PRs and issues
- Review last 3 solutions
- Search for relevant stack news
- Generate detailed recommendations
- Create session plan with time estimates

---

## Focus Modes

### API Focus
```bash
/workflows:begin api
```

**Checks:**
- API routes and tests
- Fastify configuration
- Database queries
- Authentication
- Recent API PRs

### Frontend Focus
```bash
/workflows:begin frontend
```

**Checks:**
- Next.js components
- Client/Server boundaries
- UI tests
- Styling issues
- Recent frontend PRs

### Database Focus
```bash
/workflows:begin database
```

**Checks:**
- Prisma schema
- Migrations status
- Query performance
- Recent database changes
- Data integrity

---

## Best Practices

### Daily Ritual

**Every morning:**
```bash
# Start your day
/workflows:begin

# Review dashboard
# Pick high priority task
# Start focused work

# Mid-day check
/workflows:begin --quick
```

**After breaks:**
```bash
# Quick refresh
/workflows:begin --quick
```

**Before EOD:**
```bash
# Final check
/workflows:begin

# Document what you learned
/workflows:compound

# Generate changelog
/changelog 1
```

---

## Integration with Other Workflows

### Start Session → Work → End Session

```bash
# 1. Start: Get context
/workflows:begin

# 2. Plan: If needed
/workflows:plan "Task from dashboard"

# 3. Work: Execute
/workflows:work

# 4. Review: Before commit
/workflows:review

# 5. Document: After solving
/workflows:compound

# 6. Share: End of day
/changelog 1
```

---

## Customization

### Add Custom Checks

Edit this file to include Akount-specific checks:

```bash
# Check Railway deployment status
railway status

# Check Clerk service status
curl https://status.clerk.com/api/v2/status.json

# Check database health
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tenants;"

# Check API health
curl https://api.akount.com/health
```

### Add Team Metrics

```bash
# Team velocity
gh pr list --state merged --since "7 days ago" | wc -l

# Bug closure rate
gh issue list --state closed --label bug --since "7 days ago" | wc -l

# Test coverage
npm test -- --coverage --silent | grep "All files"
```

---

## Automation

### Auto-run on Terminal Start

Add to `.bashrc` or `.zshrc`:

```bash
# Run workflows:begin when starting work
if [ -d ".git" ]; then
  echo "🚀 Starting session..."
  claude-code "/workflows:begin --quick"
fi
```

### Scheduled Reminders

```bash
# Cron job for mid-day refresh
0 12 * * 1-5 cd /path/to/project && claude-code "/workflows:begin --quick"
```

---

## Example Real Output

```
🚀 Session Dashboard - 2026-01-30 @ 9:00 AM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PROJECT STATUS: HEALTHY ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Git: main | Clean | ✓ Up to date
Build: ✓ Passing | Tests: 142/142 | TypeScript: ✓ No errors
Deployment: ✓ Production healthy | API: 180ms avg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT TASKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔥 HIGH PRIORITY (Do First)
   1. Fix auth timeout issue (#234) - 2h
   2. Review PR #123 (Multi-currency) - 30m

📋 MEDIUM PRIORITY (Do Today)
   3. Add invoice pagination (#345) - 4h
   4. Clean up 5 TODO comments - 1h

💡 QUICK WINS (< 30m)
   5. Fix type error in InvoiceList.tsx
   6. Update API documentation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ WATCH OUT FOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL
   • 2 npm security vulnerabilities (Run: npm audit fix)
   • TypeScript error in InvoiceList.tsx:23

🟡 IMPORTANT
   • Dashboard slow with 100+ invoices (N+1 query suspected)
   • 15 TODO comments in invoice module (3 marked FIXME)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 RECENT UPDATES (Last 3 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLETED ✅
   • Fixed tenant isolation in invoice API
   • Added Zod validation to all routes
   • Optimized N+1 query (14x faster!)

IN PROGRESS 🚧
   • Multi-currency invoice support (PR #123)
   • Clerk SDK v6 migration

STACK NEWS 📡
   • Clerk v6.0 released - Security patches included
   • Next.js 16.1 available - Performance improvements
   • Prisma 6.0 beta - New query engine

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 SMART RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. START HERE: Fix security vulnerabilities (10 min)
   → npm audit fix
   → Test auth flow
   → Document if issues found

2. THEN: Work on auth timeout issue (2 hours)
   → Check docs/solutions/security/ for similar issues
   → May relate to recent Clerk updates
   → Document with /workflows:compound when done

3. REVIEW: Multi-currency PR #123 is ready
   → Needs your approval
   → Then merge and document

4. PLAN: Performance optimization sprint
   → Multiple slow queries identified
   → Use /deepen-plan for approach
   → Schedule for this afternoon

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚦 SESSION STATUS: READY TO CODE ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Focus: Fix security vulnerabilities → Auth timeout issue
Time Estimate: 2-3 hours for high priority tasks
Blocker: None - All systems go! 🚀

Commands:
  npm audit fix              # Fix security issues
  /workflows:work "auth"     # Start auth timeout work
  /workflows:review          # Review before commit
  /workflows:compound        # Document when done

Let's ship it! 💪
```

---

## Time Investment

**Standard mode:** 2-3 minutes
**Quick mode:** 30 seconds
**Deep mode:** 5 minutes

**Value:** Immediate context, prioritized tasks, proactive problem detection

---

**Start your next session:**
```bash
/workflows:begin
```

🚀 **Get up to speed instantly!**
