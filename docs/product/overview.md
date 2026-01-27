# Akount

## Description
Akount is a multi-country financial command center for solo entrepreneurs managing complex finances across borders. It provides a unified view of all personal and business accounts, tracks money flow across multiple currencies and legal entities, and uses AI to surface insights on spending, cash flow, and tax optimization - giving you complete financial clarity in one place.

## Sections

1. **Accounts Overview** - Connect and view all bank accounts, credit cards, loans, and assets across countries with multi-currency support, entity separation, and consolidated net worth dashboard.

2. **Bank Reconciliation** - Import bank feed transactions, match them to internal records, handle transfers between accounts, and maintain reconciliation status with automated and manual matching workflows.

3. **Transactions & Bookkeeping** - Transaction categorization, chart of accounts management, double-entry journal entries with debits/credits, and multi-entity bookkeeping with proper GL account posting.

4. **Invoicing & Bills** - Manage clients and vendors, create invoices and bills with line items and tax calculations, track payment allocations, handle credit notes, and integrate AR/AP with the general ledger.

5. **Analytics** - Visual cash flow analysis, burn rate tracking, spending breakdowns, P&L and balance sheet generation, financial trend insights across entities and time periods with customizable reporting.

6. **Planning** - Set budgets by entity, category, and period; define financial goals for savings or debt paydown; track progress against targets with variance analysis and alerts.

7. **AI Financial Advisor** - Personalized spending insights, tax optimization recommendations, deduction discovery, alerts for subsidies and programs, automated categorization rules, and intelligent financial guidance.

## Data Model Summary

**Core Accounting Backbone:** Entity, GLAccount, JournalEntry, JournalLine, TaxRate, Currency, FxRate, FiscalCalendar

**Accounts Receivable & Payable:** Client, Invoice, InvoiceLine, CreditNote, Vendor, Bill, BillLine, Payment, PaymentAllocation

**Banking, Feeds & Reconciliation:** Account, BankConnection, BankFeedTransaction, Transaction, TransactionMatch, Transfer, Category

**Budgeting, Goals & Analytics:** Budget, Goal, ReportDefinition, Snapshot

**Users, Sharing & SaaS:** User, Workspace, UserRole, Subscription, AuditLog

**AI, Rules & Documents:** Insight, InsightTrigger, Rule, Attachment, RecurringTemplate

**Optional High-Value Entities:** Project, Tag, IntercompanyMapping, Notification

## Design System

**Colors:** Orange (primary), Violet (secondary), Slate (neutral)

**Typography:** Newsreader (headings), Manrope (body), JetBrains Mono (monospace)

**Tailwind CSS v4:** All designs use Tailwind v4 utility classes with responsive prefixes and dark mode support

## Implementation Sequence

The product is designed to be built incrementally across 8 milestones:

1. **Foundation** - Design tokens, data model types, routing structure, application shell
2. **Accounts Overview** - Multi-currency dashboard and account management
3. **Bank Reconciliation** - Transaction matching and reconciliation workflows
4. **Transactions & Bookkeeping** - Transaction list, categorization, journal entries, chart of accounts
5. **Invoicing & Bills** - AR/AP management with invoices, bills, clients, vendors
6. **Analytics** - Financial reporting with cash flow, P&L, and balance sheet
7. **Planning** - Budgets, goals, and financial calculators
8. **AI Financial Advisor** - Insights feed and categorization rules

Each section is self-contained and can be built independently after the foundation is complete.
