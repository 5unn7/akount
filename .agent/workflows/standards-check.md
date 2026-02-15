---
description: verify code against critical rules
---

1. Scan for Multi-Tenancy violations
Grep for Prisma calls without `tenantId` in the `where` clause.
2. Verify financial data patterns
Check for use of `Float` where `Int` cents are required.
3. Check for security best practices
Validate Zod schemas for all new API routes.
4. Report findings
Summarize any violations and provide fix recommendations.
