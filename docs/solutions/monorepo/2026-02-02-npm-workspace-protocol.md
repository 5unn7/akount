---
title: "npm vs pnpm Workspace Protocol Confusion"
category: monorepo
date: 2026-02-02
severity: low
module: root
tags: [npm, pnpm, workspaces, turborepo, package-json]
---

# npm vs pnpm Workspace Protocol Confusion

## Problem

A code review agent recommended changing workspace dependencies from `"*"` to `"workspace:*"`:

```json
// Agent recommended this change
{
  "dependencies": {
    "@akount/db": "workspace:*",  // WRONG for npm
    "@akount/types": "workspace:*"
  }
}
```

Running `npm install` failed:

```
npm error code EUNSUPPORTEDPROTOCOL
npm error Unsupported URL Type "workspace:": workspace:*
```

## Root Cause

**The `workspace:` protocol is pnpm-specific, NOT supported by npm.**

| Package Manager | Workspace Syntax | Notes |
|-----------------|------------------|-------|
| **npm** | `"*"` or `"^1.0.0"` | Resolves from workspace automatically |
| **pnpm** | `"workspace:*"` | Explicit workspace protocol |
| **yarn** | `"workspace:*"` | Yarn 2+ supports this |

The review agent confused npm workspaces with pnpm workspaces.

## Solution

**For npm workspaces, use `"*"` (the original was correct):**

```json
// package.json in apps/api or apps/web
{
  "dependencies": {
    "@akount/db": "*",
    "@akount/types": "*"
  }
}
```

**How npm workspaces resolve `"*"`:**

1. npm sees `@akount/db` with version `*`
2. Checks root `package.json` for `workspaces` field
3. Finds `packages/*` includes `packages/db`
4. Symlinks `node_modules/@akount/db` → `packages/db`
5. No registry lookup needed

**Root package.json must have:**

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

## Prevention

### Before Changing Workspace Dependencies

1. Check which package manager the project uses:
   - `package-lock.json` → npm
   - `pnpm-lock.yaml` → pnpm
   - `yarn.lock` → yarn
2. Check root `package.json` for `packageManager` field
3. Test with `npm install` / `pnpm install` before committing

### Quick Reference

```bash
# Check package manager
cat package.json | grep packageManager
# "packageManager": "npm@10.2.4" → Use "*"
# "packageManager": "pnpm@8.x" → Use "workspace:*"
```

### Turborepo Note

Turborepo works with all package managers. The workspace syntax depends on the underlying package manager, not Turborepo itself.

## Files Changed

- `apps/api/package.json` - Reverted to `"*"`
- `apps/web/package.json` - Reverted to `"*"`

## Time to Fix

- Investigation: 2 minutes (npm error was clear)
- Fix: 1 minute
- **Future lookup: 30 seconds**

## Lesson Learned

AI review agents can make mistakes, especially about tooling differences. Always verify recommendations against the actual project setup before implementing.
