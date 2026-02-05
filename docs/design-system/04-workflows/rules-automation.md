This is the **scaling engine** of Akount.

Rules & Automation is what turns:

> “I’m managing finances”
> into
> “My finances manage themselves.”

Done poorly, it feels risky.
Done well, it feels like **delegating to a trusted assistant**.

---

# ⚙️ RULES & AUTOMATION ENGINE — MASTER SYSTEM

## 🎯 Purpose

Rules exist to:

1. Eliminate repetitive work
2. Enforce consistency across entities & countries
3. Encode *financial intent*
4. Work **with** AI, not against it

Rules should feel:

> predictable · reversible · explainable

---

# 🧠 1. Mental Model

Rules are **policies**, not shortcuts.

Think:

* Email filters
* Accounting controls
* Financial governance

Not:

* “If this then that” toys

---

# 🧭 2. Entry Points

Rules can be created from:

* Transactions table (“Create rule from this”)
* AI Advisor suggestion
* Settings → Rules & Automation
* Bulk action (“Apply rule”)

Context is preserved.

---

# 🧱 3. Rules Center (Main Screen)

```
────────────────────────
Rules & Automation
────────────────────────

[ Active Rules ]
[ Draft Rules ]
[ Disabled Rules ]
```

Each rule is a **living object**, not a toggle.

---

# 📜 4. Rule Card Anatomy

```
Marketing SaaS Expenses
──────────────────────
WHEN
Description contains "AWS"
AND Account = RBC CAD
AND Entity = 🇨🇦 Canadian Corp

DO
Category → Cloud Services
Tax Treatment → Deductible
Confidence → High

Status: Active
Last Applied: Today (12x)
[Edit] [Pause] [Audit]
```

Rules read like plain English.

---

# 🧠 5. Rule Builder UX (Guided, Safe)

### Step 1: Trigger

Choose conditions:

* Description text
* Amount range
* Merchant
* Account
* Entity
* Currency
* Country
* Transaction type

Live preview shows matching transactions.

---

### Step 2: Actions

Actions may include:

* Set category / GL
* Assign entity
* Mark reconciled
* Apply tax rule
* Split transaction
* Create journal entry
* Ignore transaction

Rules can have **multiple actions**.

---

### Step 3: Scope & Safety

| Option               | Purpose           |
| -------------------- | ----------------- |
| Apply to future only | Default           |
| Apply retroactively  | Explicit          |
| Require confirmation | For risky actions |
| Confidence threshold | AI-backed rules   |

No silent mass changes.

---

# 🧠 6. AI + Rules Cooperation Model

This is important.

### Rule Priority Order:

1. **Explicit user rule**
2. AI-suggested rule (confirmed)
3. AI one-off suggestion

AI never overrides user intent.

---

# 🧩 7. AI-Suggested Rules (Huge Value)

After repeated actions:

> “You’ve categorized ‘Stripe Fees’ as Processing Fees 6 times.
> Create a rule?”

Shows:

* What will change
* How many past transactions affected

User approves.

---

# 🔁 8. Rule Simulation Mode

Before saving:

```
This rule will affect:
✓ 24 past transactions
✓ 3 future accounts

Preview changes
```

Simulation builds trust.

---

# ⚠️ 9. Guardrails & Constraints

Rules cannot:

* Change locked transactions
* Cross entities without permission
* Modify fiscal-closed periods
* Violate accounting balance

Warnings explain why.

---

# 🧾 10. Audit & Explainability

Every automated change logs:

```
Changed by: Rule "Marketing SaaS Expenses"
Created by: User
Timestamp
```

Click “Why?” → explanation panel.

This is **audit gold**.

---

# 🧠 11. Rule States

| State      | Meaning         |
| ---------- | --------------- |
| Draft      | Not active      |
| Active     | Running         |
| Paused     | Temporarily off |
| Failed     | Needs attention |
| Deprecated | Superseded      |

Rules are *managed*, not forgotten.

---

# 🌍 12. Multi-Entity & Jurisdiction Rules

Rules can be:

* Entity-specific
* Jurisdiction-specific
* Global

Example:

> Apply GST for 🇮🇳 Sole Prop
> Ignore for 🇨🇦 Corp

This is where Akount beats everyone.

---

# ⚡ 13. Performance & Feedback

Rule execution shows:

* Count applied
* Errors
* Conflicts

No black boxes.

---

# 🧠 14. User Trust Principle

Rules must be:

* Transparent
* Reviewable
* Undoable

Undo = automatic reversal entry or rule rollback.

---

# ✨ Emotional Outcome

After using rules, users feel:

> “Akount understands how I run my finances.”

Not:

> “I hope this doesn’t mess things up.”

---