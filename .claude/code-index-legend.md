# Code Index Legend

**Shared decode legend for all CODEBASE-*.md index files.**

---

## Fields

- `p` = path (relative from project root)
- `d` = domain code (bnk, inv, acc, pln, ai, pg, cmp, pkg)
- `e` = exports (array of function/class/const names)
- `i` = imports (array of module paths)
- `l` = LOC (lines of code)
- `pt` = patterns (compact codes)
- `v` = violations (detailed with fix suggestions)

## Pattern Codes

- `T` = tenant-isolation (includes tenantId filter)
- `S` = soft-delete (uses deletedAt)
- `L` = pino-logging (uses request.log/server.log)
- `P` = prisma (uses prisma.*)
- `C` = client-component (has 'use client')

## Violation Codes

- `F` = inline formatCurrency (not imported from canonical)
- `H` = hardcoded color (text-[#...] or bg-[rgba...])
- `L` = console.log in production
- `A` = : any type annotation

## Domain Codes

- `bnk` = banking, `inv` = invoicing, `acc` = accounting
- `pln` = planning, `ai` = ai, `pg` = pages
- `cmp` = components/utils, `pkg` = packages

---

_Version 1.0 - Extracted from CODEBASE-*.md for deduplication (INFRA-67)_
