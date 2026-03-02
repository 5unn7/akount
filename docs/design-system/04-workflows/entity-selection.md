This is one of the **most dangerous moments** in the product.

Entity switching isn’t a simple dropdown.
It’s a **financial context shift** that can affect tax decisions, reports, and compliance.

So the experience must feel:

> deliberate
> safe
> clear
> reversible

Not fast and casual.

---

# 🌍 ENTITY SWITCHING EXPERIENCE FLOW

## 🎯 Goal

Make users always aware of:

* **Which legal entity they’re in**
* Whether they’re viewing **combined or isolated data**
* The consequences of switching

---

# 🧠 1. Core Concept: “Financial Context”

Akount treats entity selection as:

> **Financial Context Mode**

Just like switching environments in a dev tool.

---

## 🧩 2. Entry Point

From Top Command Bar:

`🌍 All Entities ▼`

---

# 📂 3. Entity Switcher Panel (Structured, not list)

This opens a **context panel**, not a tiny dropdown.

### Layout

```
────────────────────────
FINANCIAL CONTEXT
────────────────────────

VIEW MODE
(•) All Entities (Consolidated)
( ) Selected Entities

ENTITIES
— BUSINESS —
☑ 🇨🇦 Canadian Corp   (CAD)
☐ 🇺🇸 US LLC         (USD)
☐ 🇮🇳 Sole Prop       (INR)

— PERSONAL —
☑ 👤 Personal

────────────────────────
⚠ Some reports may change when combining entities
────────────────────────
[Cancel]        [Apply Context]
```

This makes the user *think*.

---

# ⚠️ 4. Smart Warning System

If switching from:

* Single entity → Multi-entity
* Business → Personal
* One jurisdiction → Another

Show micro-warning:

> “You are now viewing consolidated data. Tax reports may differ.”

Subtle, not scary.

---

# 🎯 5. Post-Switch Feedback

After applying:

Top bar briefly shows:

`Context updated → 🇨🇦 CAN Corp + 🇺🇸 US LLC`

Prevents disorientation.

---

# 🧭 6. Persistent Context Indicators

Throughout UI:

| Location    | Indicator                      |
| ----------- | ------------------------------ |
| Page title  | `Transactions — 🇨🇦 CAN Corp` |
| Table rows  | Entity badge                   |
| Reports     | “Based on 2 entities” label    |
| AI insights | “Applies to US LLC” tag        |

Never let the user forget context.

---

# 🔁 7. Quick Toggle (Power Users)

Hover entity badge in header → mini switcher:

`Switch to last entity → 🇺🇸 US LLC`

Fast but still explicit.

---

# 🧠 8. Entity Memory Logic

System remembers:

* Last context per page type
* Preferred entity for invoicing
* Preferred entity for expenses

Feels intelligent.

---

# 🚫 9. Guardrails

If user tries to:

* Edit a journal entry across entities
* Post invoice under wrong entity

Show:

> “This action belongs to 🇨🇦 Canadian Corp. Switch context?”

Safety net for accounting errors.

---

# 🧩 10. Multi-Entity Visualization

When multiple entities active:

Add subtle “stacked entities” icon in header.

Indicates consolidated mode visually.

---

# 💡 The UX Philosophy

Switching entity ≠ navigation
Switching entity = **changing financial reality**

So the UI treats it like:

* Switching AWS account
* Changing Git branch
* Switching production environment

Deliberate, visible, controlled.

---

# ✨ Emotional Result

User feels:

> “I always know which business I’m operating in.”

That builds **trust**, which financial software lives or dies on.

---
