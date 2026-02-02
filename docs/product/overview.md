# Akount

## Vision

**Akount is an AI-powered financial command center for globally-operating solopreneurs.**

It's NOT a simple bookkeeping tool. It's a sophisticated multi-jurisdiction financial management platform for business owners who:
- Operate legal entities across multiple countries (e.g., Canada, India, US)
- Work with clients globally (Australia, UK, Europe, etc.)
- Need consolidated oversight of personal AND business finances
- Want AI-powered guidance on tax optimization, deductions, subsidies, and policies
- Need to understand cross-border financial implications
- Want an "AI accountant" that helps make better financial decisions

## Target User

**The Global Solopreneur:**
- Freelancers, consultants, and small business owners operating internationally
- People with bank accounts and entities in multiple countries
- Those who need financial clarity across jurisdictions
- Business owners who want to be conscious about their money
- Solopreneurs who can't afford a full-time CFO but need CFO-level insights

**NOT for:**
- Simple single-country freelancers (Wave, FreshBooks serve them)
- Large enterprises (QuickBooks Enterprise, NetSuite serve them)
- Accountants managing client books (Xero Practice Manager serves them)

## Core Value Proposition

1. **Unified View** - See all accounts (personal + business) across all countries in one dashboard
2. **Financial Consciousness** - Know exactly where your money is, what you can deduct, what you're spending
3. **AI Accountant** - Get proactive guidance on tax incentives, deductions, subsidies, and better financial decisions
4. **Multi-Jurisdiction Intelligence** - Understand tax implications across Canada, US, India, UK, Europe, Australia
5. **Real Accountant Bridge** - When you need a human, connect to vetted accountants and bookkeeping services

## Why the Complexity is Necessary

| Requirement | Why It Matters |
|-------------|----------------|
| **Multi-tenancy** | One user can have multiple legal entities (Canadian corp, US LLC, Indian sole prop) |
| **Multi-currency** | CAD, USD, INR, GBP, EUR transactions must be tracked accurately with FX conversions |
| **Double-entry bookkeeping** | Tax compliance across jurisdictions requires proper accounting, not just income/expense tracking |
| **Entity model (BUSINESS/PERSONAL)** | Solopreneurs mix personal and business - need clear separation for tax purposes |
| **Audit trails** | Cross-border tax audits require complete transaction history |
| **GL accounts** | Different countries have different chart of accounts requirements |

## Sections

1. **Accounts Overview** - Connect and view all bank accounts, credit cards, loans, and assets across countries with multi-currency support, entity separation, and consolidated net worth dashboard.

2. **Bank Reconciliation** - Import bank feed transactions, match them to internal records, handle transfers between accounts, and maintain reconciliation status with automated and manual matching workflows.

3. **Transactions & Bookkeeping** - Transaction categorization, chart of accounts management, double-entry journal entries with debits/credits, and multi-entity bookkeeping with proper GL account posting.

4. **Invoicing & Bills** - Manage clients and vendors, create invoices and bills with line items and tax calculations, track payment allocations, handle credit notes, and integrate AR/AP with the general ledger.

5. **Analytics** - Visual cash flow analysis, burn rate tracking, spending breakdowns, P&L and balance sheet generation, financial trend insights across entities and time periods with customizable reporting.

6. **Planning** - Set budgets by entity, category, and period; define financial goals for savings or debt paydown; track progress against targets with variance analysis and alerts.

7. **AI Financial Advisor** - The core differentiator:
   - Automated transaction categorization with learning
   - Tax deduction discovery ("You spent $X on home office - here's your deduction")
   - Subsidy and grant alerts ("Your Canadian corp qualifies for SR&ED")
   - Policy monitoring ("New tax law affects your US LLC")
   - Financial health insights ("Your burn rate increased 20% this quarter")
   - Optimization recommendations ("Transfer $X to maximize tax efficiency")
   - Accountant connection ("This is complex - here's a vetted CPA in your jurisdiction")

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

## Competitive Positioning

| Product | Focus | Why Akount is Different |
|---------|-------|------------------------|
| Wave | Simple bookkeeping, single country | Multi-jurisdiction, AI-powered |
| FreshBooks | Invoicing for freelancers | Full financial command center |
| QuickBooks | SMB accounting (single entity) | Multi-entity, multi-country |
| Xero | Cloud accounting | AI advisor, cross-border intelligence |
| Pilot | Bookkeeping service | Self-service with AI, not human-dependent |

**Akount's moat:** Multi-jurisdiction AI intelligence that no current tool provides.

## Success Metrics

- User can see consolidated net worth across all countries in <5 seconds
- AI surfaces at least 3 actionable tax insights per quarter
- Time to monthly close reduced by 70% vs manual tracking
- Zero missed deductions or tax incentives
