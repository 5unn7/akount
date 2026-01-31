---
name: changelog
description: Create engaging changelogs from recent merges
argument-hint: "[days] or [start-date]..[end-date]"
---

# Changelog Generator

Generate engaging, human-readable changelogs from recent GitHub merges.

**Current Date:** 2026-01-30

---

## Purpose

Transform git commit history into compelling changelog entries that:
- 📰 Keep team informed of changes
- 🎯 Highlight important updates
- 🚀 Celebrate shipped features
- 🐛 Track bug fixes
- ⚡ Note performance improvements

---

## Usage

```bash
# Last 24 hours (default)
/changelog

# Last 7 days
/changelog 7

# Last 30 days
/changelog 30

# Custom date range
/changelog 2026-01-20..2026-01-30

# For specific branch
/changelog --branch=main

# Include all commits (not just merged PRs)
/changelog --all-commits
```

---

## Workflow

### Phase 1: Fetch Changes

Collect merged PRs and commits:

```bash
# Get merged PRs in time period
gh pr list --state merged --limit 100 --json number,title,author,labels,mergedAt

# Get commits if no PRs
git log --since="24 hours ago" --pretty=format:"%h %s (%an)"
```

**Filter by:**
- Merge date within time period
- Main/master branch
- Non-draft PRs
- Has meaningful commit messages

---

### Phase 2: Categorize Changes

**Priority Order:**

1. **🚨 Breaking Changes** (highest priority)
   - Labels: `breaking`, `breaking-change`
   - Commit prefix: `BREAKING:`, `!:`
   - Requires migration or action

2. **✨ Features** (user-facing)
   - Labels: `feature`, `enhancement`
   - Commit prefix: `feat:`, `feature:`
   - New capabilities

3. **🐛 Bug Fixes** (critical)
   - Labels: `bug`, `hotfix`
   - Commit prefix: `fix:`, `bugfix:`
   - Resolved issues

4. **⚡ Performance** (improvements)
   - Labels: `performance`, `optimization`
   - Commit prefix: `perf:`
   - Speed/efficiency gains

5. **🔒 Security** (important)
   - Labels: `security`, `vulnerability`
   - Commit prefix: `security:`
   - Security patches

6. **📚 Documentation**
   - Labels: `docs`, `documentation`
   - Commit prefix: `docs:`
   - README, guides, comments

7. **🔧 Developer Experience**
   - Labels: `dx`, `tooling`, `devex`
   - Commit prefix: `chore:`, `build:`, `ci:`
   - Build, CI, tools

8. **♻️ Refactoring**
   - Labels: `refactor`, `cleanup`
   - Commit prefix: `refactor:`
   - Code improvements (no feature change)

9. **🧪 Tests**
   - Labels: `test`, `testing`
   - Commit prefix: `test:`
   - Test additions/fixes

---

### Phase 3: Analyze Each Change

For each PR/commit:

**Extract:**
- PR number and title
- Author name
- Labels and categories
- Description/body
- Related issues (#123)
- Breaking change notes
- Files changed

**Determine:**
- User impact (high/medium/low)
- Technical significance
- Deployment requirements
- Migration needs

---

### Phase 4: Generate Changelog

**Format:**

```markdown
# Changelog - [Date Range]

**Period:** [Start Date] to [End Date]
**Changes:** [Count] merged PRs
**Contributors:** @user1, @user2, @user3

---

## 🚨 Breaking Changes

### [Title] (#123)
**What changed:** Description of the change
**Impact:** What users/developers need to do
**Migration:** Step-by-step upgrade path
**Reason:** Why we made this change

**Example:**
```typescript
// Before
oldMethod()

// After
newMethod()
```

---

## ✨ Features

- **[Feature Name]** (#456) - Description of what users can now do
- **[Feature Name]** (#789) - Another cool feature

---

## 🐛 Bug Fixes

- Fixed invoice calculation rounding error (#234)
- Resolved authentication timeout issue (#567)
- Corrected multi-currency display (#890)

---

## ⚡ Performance

- Optimized dashboard load time (2.5s → 180ms) (#345)
- Reduced API response time by 40% (#678)

---

## 🔒 Security

- Updated Clerk SDK to patch auth vulnerability (#432)
- Fixed tenant isolation in API routes (#765)

---

## 📚 Documentation

- Added API authentication guide (#543)
- Updated deployment runbook (#876)

---

## 🔧 Developer Experience

- Added ESLint rule for Prisma queries (#234)
- Improved CI pipeline speed (#567)
- Updated turbo.json for better caching (#890)

---

## Deployment Notes

### Database Migrations
```bash
cd packages/db
npx prisma migrate deploy
```

### Environment Variables
Add these to your `.env`:
```
NEW_FEATURE_FLAG=true
API_TIMEOUT=30000
```

### Manual Steps
1. Clear Redis cache
2. Restart API instances
3. Verify health checks

---

## Contributors

Thank you to everyone who contributed! 🎉

@alice (5 PRs), @bob (3 PRs), @charlie (2 PRs)

---

_Generated with `/changelog` on 2026-01-30_
```

---

### Phase 5: Tone & Style

**Writing Guidelines:**

1. **Be Human**
   - "You can now..." (not "Users can now...")
   - "We fixed..." (not "Bug fix:")
   - "This makes it easier to..." (not just what changed)

2. **Be Specific**
   - ✅ "Dashboard loads 14x faster (2.5s → 180ms)"
   - ❌ "Improved performance"

3. **Add Context**
   - Why the change matters
   - What problem it solves
   - How users benefit

4. **Use Emoji Sparingly**
   - Section headers only
   - Consistent across entries
   - Don't overdo it

5. **Link Everything**
   - PR numbers: #123
   - Issues: Fixes #456
   - Contributors: @username

---

## Example Changelog

```markdown
# Changelog - January 23-30, 2026

**Period:** Last 7 days
**Changes:** 12 merged PRs
**Contributors:** @alice, @bob, @charlie

---

## ✨ Features

### Multi-Currency Invoice Support (#234)
You can now create invoices in any currency! The system automatically handles exchange rates and displays amounts in both the invoice currency and your functional currency. Perfect for international clients.

```typescript
// Create invoice in EUR
const invoice = await createInvoice({
  currency: 'EUR',
  amount: 1000_00 // €1,000.00
})
```

### Dashboard Performance Boost (#345)
The dashboard now loads **14x faster** (2.5s → 180ms). We optimized database queries and eliminated N+1 issues. You'll notice the difference immediately.

---

## 🐛 Bug Fixes

- **Fixed invoice rounding error** (#456) - Amounts now calculate correctly with proper decimal precision
- **Resolved auth timeout** (#567) - No more unexpected logouts after 15 minutes
- **Corrected entity filter** (#678) - Multi-entity views now show the right data

---

## 🔒 Security

### Updated Clerk Authentication (#432)
We've upgraded to Clerk v6 which patches a session fixation vulnerability. All users should refresh their browser to get the latest security updates.

**Action Required:** None - automatic on next login

---

## Deployment Notes

### Database Migration
```bash
npx prisma migrate deploy
```

### New Environment Variables
```bash
MULTI_CURRENCY_ENABLED=true
FX_API_KEY=your_key_here  # Get from dashboard
```

---

## Contributors

Huge thanks to our contributors! 🎉

- @alice - Multi-currency feature and bug fixes
- @bob - Performance optimizations
- @charlie - Security updates

---

_Generated on 2026-01-30 · 12 PRs merged this week_
```

---

## Discord/Slack Integration

**For Team Channels:**

```markdown
📰 **Weekly Changelog** (Jan 23-30)

🚀 **Highlights:**
• Multi-currency invoices now supported (#234)
• Dashboard 14x faster (#345)
• Security: Clerk v6 update (#432)

🐛 **Fixes:**
• Invoice rounding (#456)
• Auth timeouts (#567)
• Entity filtering (#678)

👥 **Contributors:** @alice @bob @charlie

📖 Full changelog: [link]
```

**Character Limit:** 2000 chars for Discord

---

## Best Practices

### Do:
- ✅ Focus on user impact
- ✅ Include code examples for breaking changes
- ✅ Link to PRs and issues
- ✅ Celebrate contributors
- ✅ Note deployment requirements
- ✅ Use consistent emoji
- ✅ Be specific with metrics

### Don't:
- ❌ List every commit
- ❌ Use technical jargon without explanation
- ❌ Skip breaking changes
- ❌ Forget migration instructions
- ❌ Be vague ("various improvements")
- ❌ Overuse emoji
- ❌ Leave out context

---

## Customization

### Audience Variants

**For Developers:**
- Technical details
- Code examples
- Architecture changes
- Migration steps

**For Product Team:**
- User impact
- Feature descriptions
- Bug fixes affecting UX
- Metrics

**For Leadership:**
- Strategic impact
- Key metrics
- Major milestones
- Team productivity

---

## Automation

**Recommended Schedule:**

```bash
# Daily (6 AM)
/changelog --output=daily-changelog.md

# Weekly (Mondays)
/changelog 7 --output=weekly-changelog.md

# Monthly (1st of month)
/changelog 30 --output=monthly-changelog.md
```

**GitHub Actions Integration:**
```yaml
name: Generate Changelog
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - run: claude-code changelog
```

---

## Output Options

```bash
# Print to console
/changelog

# Save to file
/changelog --output=CHANGELOG.md

# Copy to clipboard
/changelog --clipboard

# Post to Slack
/changelog --slack=#engineering

# Post to Discord
/changelog --discord=webhook-url
```

---

## Quiet Days

**When no changes:**

```markdown
# Changelog - January 30, 2026

**Period:** Last 24 hours
**Changes:** 0 merged PRs

🌙 A quiet day! No merges to main.

The team is hard at work on:
- #234 - Multi-currency support (in review)
- #345 - Performance optimization (draft)
- #456 - Security updates (in progress)

Check back tomorrow! 👋
```

---

## Error Handling

**If changelog generation fails:**

```markdown
# Changelog - January 30, 2026

⚠️ Unable to generate detailed changelog.

**Merged PRs:** #234, #345, #456

Please review manually at: https://github.com/org/repo/pulls?q=is:pr+is:merged

Error: [Error message]
```

---

## Akount-Specific Sections

### Financial Changes
- Invoice/payment logic updates
- Multi-currency features
- Accounting rules
- Audit trail improvements

### Multi-Tenant Changes
- Tenant isolation fixes
- Performance per tenant
- Onboarding improvements

### Authentication Changes
- Clerk SDK updates
- Session management
- Security patches
- Multi-device support

---

**Generate your changelog:**
```bash
/changelog 7
```

🎉 Keep your team in the loop!
