# Akount Data Model

This document describes the core entities and relationships in the Akount data model.

> [!IMPORTANT]
> **Financial Math Policy:** All monetary values are stored as **Integers** (cents).
> - $10.00 CAD -> `1000`
> - $145.80 USD -> `14580`
> - ¥1,500 JPY -> `1500`
> This prevents floating point errors during consolidation and complex tax math.

## Core Accounting Backbone

### Entity
A legal entity such as a corporation, LLC, or personal identity that owns accounts and conducts financial activities. Used to maintain separation between personal and business finances across multiple jurisdictions.

### GLAccount (Chart of Accounts)
A general ledger account that defines each account in the chart of accounts with type (asset, liability, equity, income, expense), normal balance, account codes, and posting rules for building financial statements.

### JournalEntry
The header record for a group of accounting postings, containing date, memo, associated entity, source reference, and status (draft/posted). Ensures proper double-entry bookkeeping.

### JournalLine
Individual debit or credit posting tied to a JournalEntry and GLAccount. Multiple lines comprise a balanced journal entry where total debits equal total credits.

### TaxRate
Stores tax rates and codes (GST/HST/PST, etc.), tax jurisdiction, inclusive/exclusive flags, and links to how tax amounts are posted to the general ledger.

### Currency
Defines currencies supported in the system (CAD, USD, INR, etc.), including currency codes, symbols, and decimal precision.

### FxRate
Foreign exchange rates between currencies, tracked by date to support multi-currency transactions and reporting with historical accuracy.

### FiscalCalendar
Defines fiscal years and accounting periods with open/closed status, enabling period locking and time-bound financial reporting.

## Accounts Receivable & Payable

### Client
A customer who receives invoices and makes payments for services or products delivered. Tracks contact information, payment terms, and account status.

### Invoice
A bill sent to a client requesting payment, containing header information like issue date, due date, total amount, currency, payment status, and links to the client and entity.

### InvoiceLine
Individual line items on an invoice, including description, quantity, unit price, linked category or GLAccount, applicable tax codes, and calculated amounts.

### CreditNote
Negative invoices or credits that can be applied to existing invoices or refunded, supporting adjustments and returns for both receivables and payables.

### Vendor
A supplier or service provider from whom the entity purchases goods or services. Mirror of Client but for accounts payable.

### Bill
An incoming invoice from a vendor requesting payment, containing similar structure to Invoice but on the payable side.

### BillLine
Individual line items on a vendor bill, parallel to InvoiceLine for tracking purchased goods and services.

### Payment
Records money received from clients or paid to vendors, including payment date, amount, currency, payment method (card, transfer, cash), and supports partial payments and overpayments.

### PaymentAllocation
Junction entity linking payments to specific invoices or bills, supporting scenarios where one payment settles multiple invoices and enabling proper aging reports.

## Banking, Feeds & Reconciliation

### Account
A financial account such as a bank account, credit card, loan, or mortgage. Tracks account name, type, institution, currency, current balance, and country.

### BankConnection
Represents an authorization to a financial institution for automatic transaction sync, storing connection tokens, institution identifiers, sync status, last sync date, and error information.

### BankFeedTransaction
Raw imported transactions from bank feeds, maintaining an immutable snapshot with bank-provided IDs, descriptions, amounts, dates, and currency for reconciliation purposes.

### Transaction
A matched and categorized financial transaction representing actual money movement, linked to an Account and Category, with proper accounting postings. **Can be split** into multiple categories via `TransactionSplit`.

### TransactionSplit
Represents a portion of a transaction allocated to a specific category, project, or tag. The sum of all splits must equal the total transaction amount.

### TransactionMatch
Links raw BankFeedTransactions to internal Transactions or JournalEntries, tracking match status (matched, suggested, unmatched) for reconciliation workflows.

### Transfer
Explicit record of money moved between two accounts owned by the user, creating offsetting postings to avoid double-counting as income or expense.

### Category
A classification for transactions used for reporting and budgeting (e.g., "Office Supplies", "Salary", "Rent"), providing simplified grouping above detailed GL accounts.

## Budgeting, Goals & Analytics

### Budget
Planned income and expense amounts per Entity, optionally broken down by Category or GLAccount and time period (monthly, quarterly), used for variance analysis.

### Goal
Financial targets such as savings goals or debt paydown objectives, linked to specific Accounts or Categories, with progress tracking and target dates.

### ReportDefinition
Saved report configurations for P&L, balance sheet, cash flow, and custom dashboards, storing filters, layout preferences, and formatting options for re-running reports.

### Snapshot
Precomputed balance snapshots by date, Entity, and GLAccount or Category, optimizing performance for dashboards and multi-entity consolidated views.

## Users, Sharing & SaaS

### User
Individual user identity with authentication credentials, profile information, and preferences.

### Workspace
The top-level organizational unit (an "Akount board") that contains multiple Entities, Users, and all associated financial data.

### UserRole
Defines access permissions per Workspace and per Entity, supporting roles like owner, collaborator, bookkeeper, and read-only access.

### Subscription
Tracks the pricing tier, feature limits (entities, accounts, AI calls), renewal dates, and payment provider integration details.

### AuditLog
Immutable log of all data changes recording who changed what and when, supporting debugging, compliance, and trust.

## AI, Rules & Documents

### Insight
An AI-generated recommendation, alert, or analysis about spending patterns, tax optimization opportunities, deductions, subsidies, or financial trends.

### InsightTrigger
Defines what event or condition generated an Insight (e.g., "large budget deviation", "recurring subscription detected", "potential tax deduction found").

### Rule
User-defined or AI-generated categorization rules with conditions (e.g., "if description contains UBER and account is card X, then Category is Transport"), automatically applied to new transactions.

### Attachment
Uploaded documents (PDFs, receipts, bank statements, invoice scans) with OCR status, linked to Transactions, Invoices, Bills, or JournalEntries.

### RecurringTemplate
Templates for recurring financial activities like invoices, bills, or journal entries, including scheduling rules (monthly, quarterly, custom intervals).

## Optional High-Value Entities

### Project
Additional classification dimension for transactions and invoices, enabling project-based reporting and profitability analysis without complicating the chart of accounts.

### Tag
Flexible labeling system for transactions, invoices, and other entities, supporting ad-hoc grouping and filtering for custom analytics.

### IntercompanyMapping
Defines relationships between related Entities and auto-posting rules for inter-entity transactions, invoices, and transfers in multi-entity scenarios.

### Notification
In-app and email notifications for events like invoices due, low account balances, tax reminders, and newly generated AI insights.

## Key Relationships

### Core Accounting
- Entity has many GLAccounts, JournalEntries, Accounts, Invoices, Bills, and Budgets
- JournalEntry belongs to an Entity and has many JournalLines
- JournalLine belongs to a JournalEntry and a GLAccount
- GLAccount belongs to an Entity and has many JournalLines
- FiscalCalendar belongs to an Entity and has many Periods
- TaxRate can belong to multiple Entities or be shared globally
- FxRate links two Currencies with a date and rate value

### AR & AP
- Client belongs to an Entity and has many Invoices and Payments
- Invoice belongs to a Client and Entity, has many InvoiceLines
- InvoiceLine belongs to an Invoice and references a GLAccount or Category
- Bill belongs to a Vendor and Entity, has many BillLines
- BillLine belongs to a Bill and references a GLAccount or Category
- Payment belongs to an Entity and links to a Client or Vendor
- PaymentAllocation links a Payment to one or more Invoices or Bills
- CreditNote belongs to an Entity and can link to Invoices or Bills

### Banking & Reconciliation
- Account belongs to an Entity and a Currency
- BankConnection belongs to an Entity and has many BankFeedTransactions
- BankFeedTransaction belongs to a BankConnection and Account
- Transaction belongs to an Account and Category, may link to a JournalEntry
- TransactionMatch links a BankFeedTransaction to a Transaction or JournalEntry
- Transfer links two Accounts and creates offsetting Transactions
- Category can be hierarchical (parent/child relationships)

### Budgeting & Analytics
- Budget belongs to an Entity and optionally a Category or GLAccount
- Goal belongs to an Entity and may link to Accounts or Categories
- ReportDefinition belongs to a User or Workspace
- Snapshot belongs to an Entity and references GLAccounts or Categories

### Users & Access
- Workspace has many Users and Entities
- User has many UserRoles across different Workspaces and Entities
- UserRole links a User to a Workspace or Entity with permission level
- Subscription belongs to a Workspace
- AuditLog entries reference Users, Entities, and changed records

### AI & Automation
- Insight belongs to an Entity and has an InsightTrigger
- InsightTrigger defines the conditions that generated Insights
- Rule belongs to an Entity and references Categories or GLAccounts
- Attachment can link to Transactions, Invoices, Bills, or JournalEntries
- RecurringTemplate belongs to an Entity and generates Invoices, Bills, or JournalEntries

### Optional Features
- Project belongs to an Entity and can link to Transactions, Invoices, and Bills
- Tag can be applied to any entity (many-to-many)
- IntercompanyMapping links two Entities with posting rules
- Notification belongs to a User and references events or entities
