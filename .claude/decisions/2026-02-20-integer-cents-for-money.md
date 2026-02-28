# Use Integer Cents for All Monetary Values

**Date:** 2026-02-20
**Tags:** financial, data-model, architecture
**Status:** Active

---

## Context

Financial applications need to represent money precisely. Floating-point arithmetic introduces rounding errors that compound over time, leading to "penny discrepancies" that break accounting rules and audit requirements.

**Requirements:**
- Exact representation of monetary values
- No precision loss in calculations
- Database storage compatible with PostgreSQL
- Multi-currency support

**Trigger:** Initial schema design for Invoice, Payment, Transaction models.

## Decision

**All monetary amounts are stored as integers representing cents** (or smallest currency unit).

- `amount: 1050` = $10.50 USD
- `amount: 499` = $4.99 CAD
- Database type: `Int` (Prisma) / `INTEGER` (PostgreSQL)

## Alternatives Considered

### Alternative 1: Float/Decimal
**Pros:**
- More "natural" representation ($10.50 vs 1050)
- Easier to read in database queries

**Cons:**
- Floating-point precision errors (0.1 + 0.2 !== 0.3)
- Rounding accumulates over transactions
- Violates accounting precision requirements

**Why rejected:** Precision loss is unacceptable for financial data. Even rare rounding errors break double-entry bookkeeping.

### Alternative 2: PostgreSQL DECIMAL(19,4)
**Pros:**
- Exact precision (no float errors)
- Native database support
- Handles 4 decimal places (for currencies like Bitcoin)

**Cons:**
- Prisma doesn't support DECIMAL well (maps to string)
- Application-level arithmetic still needs care
- Overkill for most currencies (2 decimals sufficient)

**Why rejected:** Integer cents is simpler, faster, and sufficient for USD/CAD/EUR. Future crypto support can use separate field.

## Consequences

**Positive:**
- Zero rounding errors
- Fast integer arithmetic
- PostgreSQL indexes work efficiently on integers
- Clear conversion: `cents / 100 = dollars`

**Negative / Trade-offs:**
- Must convert for display (`formatCurrency` utility)
- Developers must remember cents vs dollars
- Larger numbers in database (1050 vs 10.50)

**Future implications:**
- All UI formatting must use `formatCurrency(cents)` utility
- All API inputs must validate integers (Zod `.int()`)
- All calculations stay in cents until final display

## Files Affected

- `packages/db/prisma/schema.prisma` — All amount fields as `Int`
- `apps/web/src/lib/utils/currency.ts` — formatCurrency utility
- `apps/api/src/domains/*/schemas/*.schema.ts` — Zod validation `.int()`
- All invoice, bill, payment, transaction models

## References

- Stripe API: Uses integer cents (https://stripe.com/docs/currencies#zero-decimal)
- Accounting standards: Require exact precision
- `.claude/rules/financial-rules.md` — Integer cents rule documented

---

_Created: 2026-02-20 (Phase 3 schema design)_
_Example decision - demonstrates format_
