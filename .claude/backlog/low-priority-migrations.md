# Low-Priority Test Migrations (37 files)

**Domain:** AI, system, planning, misc
**Effort:** 3-4h
**Method:** Incremental via pre-commit hook OR batch with Task agent

---

## Files

1. 🌐 `apps\api\src\domains\ai\routes\__tests__\communication-drafts.routes.test.ts` (9 literals)
2. 🌐 `apps\api\src\domains\ai\routes\__tests__\jobs.routes.test.ts` (12 literals)
3. 🌐 `apps\api\src\domains\ai\routes\__tests__\natural-bookkeeping.routes.test.ts` (9 literals)
4. 🌐 `apps\api\src\domains\ai\routes\__tests__\natural-search.routes.test.ts` (11 literals)
5. 🌐 `apps\api\src\domains\ai\routes\__tests__\rule-suggestions.routes.test.ts` (16 literals)
6. 🌐 `apps\api\src\domains\ai\routes\__tests__\rules.routes.test.ts` (18 literals)
7. 📄 `apps\api\src\domains\ai\schemas\__tests__\bill-extraction.schema.test.ts` (19 literals)
8. 📄 `apps\api\src\domains\ai\schemas\__tests__\invoice-extraction.schema.test.ts` (13 literals)
9. 📄 `apps\api\src\domains\ai\services\analyzers\__tests__\cash-flow.analyzer.test.ts` (10 literals)
10. 📄 `apps\api\src\domains\ai\services\analyzers\__tests__\duplicate.analyzer.test.ts` (11 literals)
11. 📄 `apps\api\src\domains\ai\services\analyzers\__tests__\overdue.analyzer.test.ts` (9 literals)
12. 📄 `apps\api\src\domains\ai\services\analyzers\__tests__\spending.analyzer.test.ts` (11 literals)
13. 📄 `apps\api\src\domains\ai\services\providers\__tests__\mistral.provider.test.ts` (9 literals)
14. ⚙️ `apps\api\src\domains\ai\services\__tests__\ai.service.test.ts` (6 literals)
15. ⚙️ `apps\api\src\domains\ai\services\__tests__\anomaly-detection.service.test.ts` (4 literals)
16. ⚙️ `apps\api\src\domains\ai\services\__tests__\insight-generator.service.test.ts` (5 literals)
17. ⚙️ `apps\api\src\domains\ai\services\__tests__\monthly-close.service.test.ts` (2 literals)
18. ⚙️ `apps\api\src\domains\ai\services\__tests__\rule-engine.service.test.ts` (23 literals)
19. ⚙️ `apps\api\src\domains\ai\services\__tests__\rule.service.test.ts` (14 literals)
20. ⚙️ `apps\api\src\domains\ai\__tests__\action-executor.service.test.ts` (5 literals)
21. 🌐 `apps\api\src\domains\ai\__tests__\action.routes.test.ts` (18 literals)
22. 🌐 `apps\api\src\domains\ai\__tests__\insight.routes.test.ts` (10 literals)
23. 🌐 `apps\api\src\domains\ai\__tests__\monthly-close.routes.test.ts` (13 literals)
24. 🌐 `apps\api\src\domains\ai\__tests__\routes.test.ts` (27 literals)
25. 🌐 `apps\api\src\domains\overview\__tests__\routes.test.ts` (6 literals)
26. 📄 `apps\api\src\domains\planning\__tests__\goals.test.ts` (23 literals)
27. 🌐 `apps\api\src\domains\system\routes\__tests__\entities.routes.test.ts` (32 literals)
28. 📄 `apps\api\src\domains\system\routes\__tests__\entity.test.ts` (11 literals)
29. 📄 `apps\api\src\domains\system\routes\__tests__\onboarding-progress.test.ts` (4 literals)
30. 📄 `apps\api\src\domains\system\routes\__tests__\onboarding-wizard.test.ts` (9 literals)
31. ⚙️ `apps\api\src\domains\system\services\__tests__\user.service.test.ts` (5 literals)
32. 📄 `apps\api\src\middleware\__tests__\consent-gate.test.ts` (10 literals)
33. 📄 `apps\api\src\middleware\__tests__\csrf.test.ts` (17 literals)
34. 📄 `apps\api\src\middleware\__tests__\errorHandler.test.ts` (4 literals)
35. 📄 `apps\api\src\middleware\__tests__\rate-limit.test.ts` (8 literals)
36. 📄 `apps\api\src\middleware\__tests__\security-headers.test.ts` (1 literals)
37. 📄 `apps\api\src\middleware\__tests__\validation.test.ts` (7 literals)

---

## Migration Strategy

**Option A:** Wait for pre-commit hook warnings (incremental, 6-12 months)
**Option B:** Batch migrate after high-priority complete (dedicated 1 day)

Pre-commit hook will warn developers when they modify these files.
