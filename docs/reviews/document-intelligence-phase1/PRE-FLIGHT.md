# Pre-Flight Violations Check

Quick automated scan for common anti-patterns before agent review.

---

## :any types
apps/api/src/middleware/csrf.ts:104:export function getCsrfToken(request: any): string {

## console.log in production
apps/api/src/domains/ai/routes/jobs.ts:18: *   console.log('Progress:', data.progress);
apps/api/src/domains/ai/services/rule-engine.service.ts:75:          .catch((err) => console.error('Failed to increment execution:', err));
apps/api/src/domains/ai/services/rule-engine.service.ts:118:      ).catch((err) => console.error('Failed to batch increment execution:', err));

## Hardcoded colors (frontend)
✅ None found

## Float types for money (schema)
✅ None found
