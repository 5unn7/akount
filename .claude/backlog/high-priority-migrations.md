# High-Priority Test Migrations (20 files)

**Domain:** Accounting, Banking, Invoicing (core financial logic)
**Effort:** 4-6h (20-30min per file with review)
**Method:** Manual migration with Task agent assistance

---

## Files

1. **🌐 Route** | ⚠️ High complexity | 27 literals
   `apps\api\src\domains\accounting\__tests__\journal-entry.routes.test.ts`

2. **🌐 Route** | ⚠️ High complexity | 22 literals
   `apps\api\src\domains\banking\routes\__tests__\categories.routes.test.ts`

3. **🌐 Route** | ⚠️ High complexity | 19 literals
   `apps\api\src\domains\accounting\__tests__\fiscal-period.routes.test.ts`

4. **📄 Other** | Medium complexity | 15 literals
   `apps\api\src\domains\accounting\schemas\__tests__\report.schema.test.ts`

5. **⚙️ Service** | Medium complexity | 15 literals
   `apps\api\src\domains\accounting\services\__tests__\report-export.service.test.ts`

6. **🌐 Route** | Medium complexity | 13 literals
   `apps\api\src\domains\accounting\__tests__\gl-account.routes.test.ts`

7. **🌐 Route** | Medium complexity | 13 literals
   `apps\api\src\domains\banking\routes\__tests__\connections.routes.test.ts`

8. **🌐 Route** | Medium complexity | 13 literals
   `apps\api\src\domains\banking\routes\__tests__\transfers.routes.test.ts`

9. **⚙️ Service** | Medium complexity | 11 literals
   `apps\api\src\domains\accounting\__tests__\posting.service.test.ts`

10. **⚙️ Service** | Low complexity | 7 literals
   `apps\api\src\domains\accounting\__tests__\journal-entry.service.test.ts`

11. **⚙️ Service** | Low complexity | 5 literals
   `apps\api\src\domains\accounting\__tests__\fiscal-period.service.test.ts`

12. **⚙️ Service** | Low complexity | 5 literals
   `apps\api\src\domains\banking\services\__tests__\category.service.test.ts`

13. **⚙️ Service** | Low complexity | 5 literals
   `apps\api\src\domains\invoicing\services\__tests__\pdf.service.test.ts`

14. **⚙️ Service** | Low complexity | 4 literals
   `apps\api\src\domains\accounting\__tests__\tax-rate.service.test.ts`

15. **📄 Other** | Low complexity | 3 literals
   `apps\api\src\domains\invoicing\services\__tests__\invoice-send.test.ts`

---

## Migration Pattern

See: [apps/api/src/test-utils/README.md](../../apps/api/src/test-utils/README.md)

Examples:
- Route: [domains/accounting/__tests__/tax-rate.routes.test.ts](../../apps/api/src/domains/accounting/__tests__/tax-rate.routes.test.ts)
- Service: [domains/accounting/__tests__/gl-account.service.test.ts](../../apps/api/src/domains/accounting/__tests__/gl-account.service.test.ts)
