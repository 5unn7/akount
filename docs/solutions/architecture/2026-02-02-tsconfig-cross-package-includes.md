---
title: "TSConfig Anti-Pattern: Direct Cross-Package File Includes"
category: architecture
date: 2026-02-02
severity: medium
module: apps/api
tags: [typescript, tsconfig, monorepo, imports]
---

# TSConfig Anti-Pattern: Direct Cross-Package File Includes

## Problem

Found this anti-pattern in `apps/api/tsconfig.json`:

```json
{
  "include": [
    "src/**/*",
    "../../packages/db/index.ts",      // ANTI-PATTERN
    "../../packages/types/index.ts"    // ANTI-PATTERN
  ]
}
```

**Problems with direct file includes:**

1. Breaks package encapsulation
2. Can cause duplicate type definitions
3. Makes dependency graph unclear
4. Doesn't scale as packages grow
5. IDE may show incorrect import suggestions

## Root Cause

Likely added to fix "cannot find module" errors when packages weren't properly built or linked. A quick fix that became technical debt.

## Solution

**Remove direct includes, let packages resolve through node_modules:**

```json
// CORRECT: apps/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "noEmit": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

**For imports to work, ensure:**

1. **Packages are built first:**

   ```bash
   # packages/db generates Prisma client
   cd packages/db && npm run build
   ```

2. **Turborepo pipeline is correct:**

   ```json
   // turbo.json
   {
     "tasks": {
       "build": {
         "dependsOn": ["^build"]  // Build dependencies first
       }
     }
   }
   ```

3. **Path aliases in base tsconfig (optional):**

   ```json
   // tsconfig.base.json
   {
     "compilerOptions": {
       "paths": {
         "@akount/db": ["packages/db"],
         "@akount/types": ["packages/types"]
       }
     }
   }
   ```

4. **npm workspaces symlinks packages:**

   ```bash
   # Verify symlinks exist
   ls -la node_modules/@akount/
   # Should show:
   # db -> ../../packages/db
   # types -> ../../packages/types
   ```

## Prevention

### Proper Monorepo Import Flow

```
apps/api/src/index.ts
    ↓ imports
node_modules/@akount/db  (symlink)
    ↓ points to
packages/db/index.ts
    ↓ exports
Prisma client + types
```

### If "Cannot Find Module" Errors

**Don't:** Add direct file paths to `include`

**Do:**

1. Run `npm install` (creates symlinks)
2. Run `npm run build` (generates Prisma client)
3. Restart TypeScript server in IDE
4. Check `node_modules/@akount/` symlinks exist

### Code Review Checklist

- [ ] Does tsconfig `include` only reference local `src/**/*`?
- [ ] Are there any `../../packages/` paths in tsconfig?
- [ ] Do imports use package names (`@akount/db`) not relative paths?

## Files Changed

- `apps/api/tsconfig.json` - Removed `../../packages/db/index.ts` and `../../packages/types/index.ts`

## Time to Fix

- Investigation: 1 minute
- Fix: 1 minute
- Verification: `npm run typecheck` passes
- **Future lookup: 30 seconds**
