**Invoicing, Clients & Vendors** is where:

* accounting meets the real world
* cash flow is created (AR)
* liabilities are formed (AP)

If this is weak, Akount feels theoretical.
If it’s done right, Akount becomes the **operational backbone**.

Let’s design it at the same regulatory + professional level.

---

# 🧾 INVOICING, CLIENTS & VENDORS — MASTER SYSTEM

## 🎯 Core Objective

This system must:

1. Create **legally correct documents**
2. Post **accurate accounting entries**
3. Respect **entity & jurisdiction rules**
4. Integrate seamlessly with reconciliation
5. Support both founders *and* accountants

This is **operational accounting**, not just billing.

---

## 🧠 Mental Model

Think of this system as:

> Structured economic agreements that turn into accounting facts

Not:

* PDFs
* Simple payment requests
* CRM-lite features

---

# 🏗️ SYSTEM SCOPE

The system covers **Accounts Receivable (AR)** and **Accounts Payable (AP)**.

| Area         | Objects                               |
| ------------ | ------------------------------------- |
| Clients (AR) | Client, Invoice, Credit Note, Payment |
| Vendors (AP) | Vendor, Bill, Vendor Credit, Payment  |
| Shared       | Line Items, Tax Rates, Attachments    |

---

# 👤 1. Clients & Vendors (Foundational Objects)

### Client / Vendor Profile

```
Name
Legal Name
Country
Currency
Tax Registration (GST / VAT / EIN / PAN)
Billing Address
Default Tax Treatment
Entity Ownership
```

Why this matters:

* Tax accuracy
* Jurisdiction compliance
* Correct GL posting

These are **legal counterparts**, not contacts.

---

## 🧠 Smart Defaults

From profile:

* Default currency
* Tax rate
* Payment terms
* GL mapping

Reduces errors later.

---

# 🧾 2. Invoicing (Accounts Receivable)

## Invoice Lifecycle (State Machine)

```
DRAFT → SENT → PARTIALLY PAID → PAID → LOCKED
        ↘ VOIDED
```

State transitions are explicit and logged.

---

## Invoice Creation UX

### Header (Context Lock)

* Entity (locked after save)
* Client
* Invoice date
* Due date
* Currency

### Line Items

Each line has:

* Description
* Quantity
* Unit price
* Tax rate
* GL revenue account

Tax is **calculated per line**, not globally.

---

## Posting Logic (Non-Negotiable)

On **invoice posting**:

```
Dr Accounts Receivable
Cr Revenue
Cr Tax Payable (if applicable)
```

This happens automatically and visibly.

No silent posting.

---

## Credit Notes

Used for:

* Refunds
* Adjustments
* Corrections

Posting:

```
Dr Revenue
Dr Tax Payable
Cr Accounts Receivable
```

Never modify posted invoices — always credit.

---

# 🏦 3. Bills (Accounts Payable)

## Bill Lifecycle

```
DRAFT → RECEIVED → APPROVED → PAID → LOCKED
```

Approval can be optional but logged.

---

## Bill Entry UX

* Vendor
* Bill date
* Due date
* Reference number
* Line items with expense GL accounts
* Tax treatment (recoverable vs non-recoverable)

---

## Posting Logic

On posting:

```
Dr Expense / Asset
Dr Recoverable Tax (if applicable)
Cr Accounts Payable
```

Again — automatic, visible, auditable.

---

# 💸 4. Payments & Allocation (Critical)

Payments are **separate objects**.

### One payment can

* Pay multiple invoices
* Partially pay an invoice
* Include FX differences
* Include bank fees

Allocation UI must be explicit.

---

## FX Handling (Enterprise-Grade)

If payment currency ≠ invoice currency:

* FX difference auto-detected
* Gain/loss journal suggested
* Posted transparently

This is a major differentiator.

---

# 🔁 5. Reconciliation Integration

Bank feed payments can:

* Auto-match invoices/bills
* Suggest allocations
* Flag discrepancies

But user confirms always.

---

# 🌍 6. Multi-Entity & Jurisdiction Rules

Invoices and bills:

* Belong to **exactly one entity**
* Follow that entity’s tax regime
* Cannot cross entities

Cross-entity billing uses **intercompany invoices** (advanced, optional).

---

# 🧠 7. AI Assistance (Carefully Scoped)

AI may:

* Suggest line item categories
* Detect missing tax
* Flag unusual amounts
* Suggest payment matching

AI may **not**:

* Send invoices
* Post bills
* Allocate payments automatically

Human remains accountable.

---

# 📊 8. AR / AP Visibility (Dashboard Integration)

Founders see:

* Outstanding receivables
* Upcoming payables
* Aging summaries

Accountants see:

* AR/AP integrity
* Unapplied payments
* Credit balances

Different lenses, same data.

---

# 🔒 9. Controls & Guardrails

* No deleting posted invoices/bills
* No editing after posting
* Reversals via credit notes only
* Period locks enforced
* All actions logged

This preserves audit defensibility.

---

# 📜 10. Audit Trail (Mandatory)

Every document logs:

* Created by
* Posted by
* Sent by
* Paid by
* Timestamp
* Entity
* Source

This satisfies professional review.

---

# 🧠 Emotional Outcome

Founder feels:

> "This is how I actually run my business."

Accountant feels:

> "This is posted correctly."

Auditor feels:

> "This is defensible."

---

## Planned Enhancements (From Roadmap)

### Revenue Recognition (MEDIUM Priority, 6-12 months)

**Future enhancement:** Support for deferred revenue and milestone-based revenue recognition.

**What's planned:**
* Deferred revenue handling for advance payments
* Simple recognition schedules (linear or milestone-based)
* Visibility of deferred amounts in reports
* Recognition date separated from invoice date
* Automatic journal entries for recognition events

**Real-world patterns:**
* Bill annually, deliver monthly (SaaS)
* Annual retainers
* Project milestones
* Subscription services

**Why it matters:**
Becomes critical for compliance in many jurisdictions. Understating revenue or overstating it creates audit risk. Currently invoices assume immediate revenue recognition, which doesn't reflect real business patterns.

**Expected impact:** Enables compliance-ready invoicing for recurring revenue models and contract-based billing. "I can bill annually but recognize revenue monthly, correctly."

---
