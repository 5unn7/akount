# Middleware Consolidation — Kill proxy.ts Forever

**Created:** 2026-02-10
**Status:** Draft

## Overview

`proxy.ts` is a footgun. Next.js requires middleware at `src/middleware.ts` — no re-exports, no indirection, no "proxy pattern." The split caused Clerk auth to silently stop working (sign-in/sign-up freeze, social auth hangs). Fix: move everything into `middleware.ts`, delete `proxy.ts`, done.

## Root Cause

- Commit `ec0c884` introduced a "proxy pattern" that moved middleware logic to `proxy.ts`
- At some point `middleware.ts` was deleted from the working tree
- Next.js never loaded `proxy.ts` — auth stopped working entirely
- Next.js also forbids re-exporting `config` from another file

## Success Criteria

- [ ] All middleware logic lives in `middleware.ts` (single file, no indirection)
- [ ] `proxy.ts` is deleted
- [ ] Sign-in, sign-up, and social auth work without lag/freeze
- [ ] RBAC route protection still works
- [ ] Security headers still applied

## Tasks

### Task 1: Move proxy.ts content into middleware.ts

**File:** `apps/web/src/middleware.ts`
**What:** Replace the current re-export stub with the full middleware implementation (the exact content currently in `proxy.ts`). This is the only file Next.js recognizes.
**Depends on:** none
**Success:** `middleware.ts` contains all route matchers, RBAC checks, security headers, and the `config` export

### Task 2: Delete proxy.ts

**File:** `apps/web/src/proxy.ts`
**What:** Remove the file entirely. Nothing imports from it.
**Depends on:** Task 1
**Success:** File no longer exists, no import errors anywhere

## Reference Files

- `apps/web/src/proxy.ts` — source of truth for current middleware logic (copy from here)
- `apps/web/src/app/layout.tsx` — ClerkProvider setup (no changes needed)
- `apps/web/src/app/api/webhooks/clerk/route.ts` — webhook handler (no changes needed)

## Edge Cases

- **Re-export trap:** Next.js statically analyzes `config` — it MUST be a direct `export const config` in `middleware.ts`, never re-exported
- **File naming:** Must be exactly `middleware.ts` at `src/middleware.ts` — no aliases, no barrel exports

## Testing Strategy

1. Start dev server (`pnpm dev` in apps/web)
2. Visit `/sign-in` — Clerk component should render and work
3. Try social sign-in (Google/GitHub) — should complete without hanging
4. Visit a protected route while signed out — should redirect to `/sign-in`
5. Visit `/system/settings` as non-admin — should redirect to `/forbidden`

## Progress

- [ ] Task 1: Move proxy.ts content into middleware.ts
- [ ] Task 2: Delete proxy.ts
