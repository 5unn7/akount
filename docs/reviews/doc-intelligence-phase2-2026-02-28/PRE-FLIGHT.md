# Pre-Flight Violations

## :any types
apps/api/src/lib/prisma-observer.ts:200:        prisma.$on('query', (event: any) => {
apps/api/src/middleware/csrf.ts:104:export function getCsrfToken(request: any): string {
apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx:89:            const params: any = { entityId };

## console.log in production
apps/api/src/domains/ai/routes/jobs.ts:18: *   console.log('Progress:', data.progress);
apps/api/src/domains/ai/services/rule-engine.service.ts:75:          .catch((err) => console.error('Failed to increment execution:', err));
apps/api/src/domains/ai/services/rule-engine.service.ts:118:      ).catch((err) => console.error('Failed to batch increment execution:', err));

## Hardcoded colors

## Float types for money
✅ None found
