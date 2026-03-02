---
name: changelog
description: Create engaging changelogs from recent merges
---

# Changelog Generator

Generate user-friendly changelogs from git commits.

**When to Use:** Before releases, sprint reviews, or documenting progress.

---

## Usage

```bash
# Generate changelog from last 10 commits
/changelog

# Specific commit range
/changelog from=abc123 to=def456

# Since last tag
/changelog since=v1.0.0
```

---

## What It Does

1. **Analyzes commits** - Parses commit messages
2. **Categorizes changes** - Groups by type (feat, fix, refactor, etc.)
3. **Formats output** - Markdown changelog ready for release notes

---

## Output Format

```markdown
# Changelog - YYYY-MM-DD

## ✨ Features
- **[Domain]:** [User-facing description] ([commit-hash](link))

## 🐛 Bug Fixes
- **[Domain]:** [What was fixed] ([commit-hash](link))

## 🔧 Improvements
- **[Domain]:** [What improved] ([commit-hash](link))

## 📚 Documentation
- [Doc changes] ([commit-hash](link))

## 🏗️ Internal
- [Refactoring, tests, tooling] ([commit-hash](link))
```

---

## Commit Message Parsing

**Conventional commits recognized:**

- `feat:` → Features
- `fix:` → Bug Fixes
- `perf:` → Performance
- `refactor:` → Internal
- `docs:` → Documentation
- `test:` → Internal
- `chore:` → Internal
- `style:` → Internal

**Domain extraction:**

```
feat(banking): Add transaction list pagination
         ↓
Domain: Banking
```

---

## Example

**Input commits:**

```
feat(banking): Add account CRUD with cursor pagination
fix(api): Resolve tenant isolation in account queries
docs: Update CLAUDE.md with hierarchical context
refactor(web): Slim begin.md workflow from 856→243 lines
```

**Output:**

```markdown
# Changelog - 2026-02-09

## ✨ Features
- **Banking:** Add account CRUD with cursor pagination (a1b2c3d)

## 🐛 Bug Fixes
- **API:** Resolve tenant isolation in account queries (d4e5f6g)

## 📚 Documentation
- Update CLAUDE.md with hierarchical context (g7h8i9j)

## 🏗️ Internal
- **Web:** Slim begin.md workflow from 856→243 lines (j0k1l2m)
```

---

## Tips

**For better changelogs:**

- Write clear commit messages (users see these!)
- Use conventional commit prefixes
- Include domain in parentheses
- Focus on user impact, not implementation

**User-facing vs Internal:**

- User-facing: "Add invoice filtering"
- Internal: "Refactor service layer"

---

_Lines: ~100 (slimmed from 560). Focused changelog generation._
