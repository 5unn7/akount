# Factory Migration Lists

**Generated:** 2026-02-28
**Total needing migration:** 52 files

---

## Priority Distribution

| Priority | Count | Domain Focus | Effort |
|----------|-------|--------------|--------|
| **High** | 15 | Accounting, Banking, Invoicing | 4-6h |
| **Low** | 37 | AI, System, Planning, Misc | 3-4h or incremental |

---

## Files

- [High-Priority Migrations](./high-priority-migrations.md) — 15 core financial domain files
- [Low-Priority Migrations](./low-priority-migrations.md) — 37 remaining files
- [Full Audit (JSON)](./factory-migration-audit.json) — Machine-readable metrics

---

## Approach: Hybrid

1. **This week:** Migrate 15 high-priority files (focused sprint, 4-5h)
2. **Ongoing:** Pre-commit hook warns on low-priority files as they're touched
3. **Target:** 90% adoption in 2-4 months

---

## Completed Migrations (2)

✅ `apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts` (14 tests passing)
✅ `apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts` (23 tests passing)
