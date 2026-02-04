           
# 🧩 INDIVIDUAL / STUDENT DASHBOARD — WIDGET ARCHITECTURE

## 🎯 Core Principle

> **Dashboard = awareness surface**
> **Widgets = gentle helpers**

No widget should:

* block anything
* demand action
* introduce a workflow

Each widget answers *one small question*.

---

## 🧠 Dashboard Layout Model

Use a **modular widget grid**:

```
────────────────────────────
Header (Month, Balance, Mood)
────────────────────────────
Primary Widgets (2-column)
────────────────────────────
Secondary Widgets (1-column)
────────────────────────────
Optional / Hidden Widgets
────────────────────────────
```

Widgets are:

* reorderable
* removable
* collapsible

---

# 1️⃣ CORE DASHBOARD WIDGETS (ALWAYS ON)

These are foundational.

### 🟦 Balance Snapshot

> “How much money do I have?”

* Total balance
* Change since last month
* No account breakdown (tap to expand)

---

### 🟦 This Month’s Spending

> “Am I spending more or less?”

* Simple bar
* Compared to last month
* No categories by default

---

### 🟦 Budget Progress

> “Am I okay this month?”

* Top 3 categories only
* Progress bars
* Remaining amount highlighted

---

# 2️⃣ MICRO-HABITS WIDGET

### Widget Name

**🌱 Today’s Small Step**

```
🌱 Today’s Small Step
────────────────────
Check yesterday’s spending

You spent ₹430 yesterday.
Looks normal 👍

[ Mark done ]
```

Rules:

* One habit only
* Disappears once done
* Reappears next day (new habit)

If user hides this widget → habits fully disabled.

---

# 3️⃣ STREAKS WIDGET (SOFT)

### Widget Name

**✨ Staying Aware**

```
✨ Staying Aware
───────────────
You’ve checked your money
5 days in a row 🌱
```

Rules:

* No numbers > 14 days
* No “broken” state
* Hidden if streak = 0 and user opted out

This widget **never shames**.

---

# 4️⃣ GOALS PROGRESS WIDGET

### Widget Name

**🎯 Your Goals**

```
🎯 Your Goals
────────────
💻 New Laptop
₹35,000 / ₹80,000
█████░░░░░░ 44%
```

Rules:

* Max 2 goals shown
* Most recent or nearest deadline
* Tap → full goals page

---

# 5️⃣ EDUCATION SNIPPET WIDGET

### Widget Name

**💡 Quick Tip**

```
💡 Quick Tip
───────────
Small daily expenses often
matter more than big ones.

[ Got it ]
```

Rules:

* Appears at most 2–3x per week
* Contextual
* Dismissible forever

No “Learn more” rabbit holes.

---

# 6️⃣ OPTIONAL WIDGETS (OFF BY DEFAULT)

These are **opt-in**.

* 📅 Upcoming Bills
* 🔁 Subscriptions
* 🧾 Recent Transactions
* 🧠 AI Tips (Consumer tone only)

---

# 7️⃣ WIDGET SETTINGS UX

Accessible via:

```
Customize Dashboard
```

Controls:

* Toggle widgets on/off
* Reorder via drag
* Reset to default

Language:

> “Choose what helps you stay aware.”

---

# 8️⃣ ROLE-BASED SAFETY

| Widget       | Student / Individual | Founder      | Accountant |
| ------------ | -------------------- | ------------ | ---------- |
| Micro-habits | ✅                    | ❌            | ❌          |
| Streaks      | ✅                    | ❌            | ❌          |
| Education    | ✅                    | ❌            | ❌          |
| Budgets      | ✅                    | ✅ (advanced) | ❌          |
| Goals        | ✅                    | ✅            | ❌          |

Accountants **never see** behavior widgets.

---

# 9️⃣ GRADUATION PATH (SUBTLE)

As users mature:

* Widgets shrink
* Advanced widgets appear (cash flow, categories)
* Micro-habits fade naturally

No forced switch.

---


