# AI Components

> **Purpose:** UI components for AI suggestions, insights, and recommendations
>
> **Last Updated:** 2026-02-04

## Overview

AI components surface insights without being intrusive. They follow the principle:

> **Advisor, not authority. Suggest, never dictate.**

All AI components include:

- **Confidence level** - How sure is the AI?
- **Reasoning** - Why is this suggested?
- **Action mapping** - What should the user do?
- **Escape hatch** - How to dismiss or override?

---

## Insight Card

Core component for displaying a single AI insight:

```
┌────────────────────────────────────┐
│ 💡 Tax Optimization               │  ← Icon + type
│ You may deduct $48,000 for home   │
│ office expenses                   │
│                                  │
│ Applies to: 🇨🇦 Canadian Corp    │  ← Context
│ Impact: +$12,500 tax savings     │
│ Confidence: High (87%)           │
│                                  │
│           [Review] [Ignore]      │  ← Actions
└────────────────────────────────────┘
```

**Components:**

- **Icon + Title:** Visual + text label
- **Summary:** 1-2 sentences, benefit-focused
- **Context strip:** Entity, period, jurisdiction
- **Action buttons:** Primary + secondary

**Insight Types:**

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| Optimization | 💡 | Violet | Tax, cost savings, efficiency |
| Alert | ⚠ | Amber | Deadlines, policy changes, risks |
| Observation | 📊 | Slate | Trends, anomalies, patterns |
| Confirmation | ✓ | Green | "Good job", "This is correct" |

---

## Insight Detail View

Expands card to show full reasoning:

```
┌────────────────────────────────────┐
│ ✕ Home Office Deduction            │
├────────────────────────────────────┤
│ What we noticed                    │
│ You spent $4,000/month on         │
│ internet, utilities, and rent.    │
│                                  │
│ Why this matters                  │
│ Canadian tax law allows           │
│ proportional deduction for home   │
│ office, reducing taxable income.  │
│                                  │
│ Estimated impact                 │
│ $12,500 saved this year (≈2 mo)  │
│                                  │
│ Recommended action               │
│ [Apply deduction] [Learn more]   │
│ [Mark as reviewed]               │
│                                  │
│ Confidence: High (87%)           │
│ Applies to: 🇨🇦 Canadian Corp    │
│ Period: 2025 Tax Year            │
│                                  │
│ Sources                          │
│ Canadian Tax Act Section XX      │
│ Similar deductions applied: 3    │
│                                  │
│ Was this helpful? 👍 👎         │
└────────────────────────────────────┘
```

**Sections:**

1. **What we noticed** - Observable facts
2. **Why this matters** - Business/financial impact
3. **Estimated impact** - Quantified benefit
4. **Recommended action** - Clear next step
5. **Confidence level** - How certain?
6. **Context** - Entity, jurisdiction, period
7. **Sources** - Where did this come from?
8. **Feedback** - Learn from user reaction

---

## Confidence Badge

Visual confidence indicator:

```
High    ████░░░░░░ 87%
Medium  ███░░░░░░░ 65%
Low     ██░░░░░░░░ 42%
```

**Display variants:**

- **Percentage:** "87% confident"
- **Label:** "High confidence"
- **Visual bar:** Filled portion represents confidence
- **Text only:** For space-constrained areas

**Thresholds:**

- High: 75%+ (show confidently)
- Medium: 50-74% (show with caveat)
- Low: <50% (tentative, show sparingly)

---

## Suggestion Chip

Inline suggestion appearing next to form field:

```
Category: [Marketing..................▼]

AI Suggests: Cloud Services
             87%

             [Apply] [Ignore]
```

**Components:**

- Current value in dropdown
- "AI Suggests:" label
- Suggested value
- Confidence percentage
- [Apply] - Updates field, dismisses chip
- [Ignore] - Dismisses, records feedback

**Behavior:**

- Only show if confidence >75%
- Auto-dismiss if user types/selects manually
- Record feedback for model improvement

---

## Categorization Suggestion

AI suggestion for transaction categorization:

```
Current:     Uncategorized
AI Suggests: Cloud Services (87%)

Reasoning:
• "AWS" in description (common cloud vendor)
• Amount matches typical cloud bill
• Monthly pattern detected

[Apply Suggestion] [Choose Different] [Always use this]
```

**Features:**

- Show current and suggested value
- Explain reasoning
- "Always use this" option (creates rule)
- Alternative chooser

---

## AI Insight Panel (Side Panel)

Main access point for all AI insights:

```
┌─────────────────────────────┐
│ 🧠 Akount Advisor          │
│ Watching your finances      │
├─────────────────────────────┤
│                             │
│ Attention Required (3)      │
│ ┌─────────────────────────┐ │
│ │ ⚠ New policy affects   │ │
│ │ your US LLC             │ │
│ │ [Review]               │ │
│ └─────────────────────────┘ │
│                             │
│ Optimization (2)            │
│ ┌─────────────────────────┐ │
│ │ 💡 Tax deduction        │ │
│ │ $12,500 saved          │ │
│ │ [Review]               │ │
│ └─────────────────────────┘ │
│                             │
│ Observations (1)            │
│ ┌─────────────────────────┐ │
│ │ 📊 Spending up 42%     │ │
│ │ vs last quarter        │ │
│ │ [Review]               │ │
│ └─────────────────────────┘ │
│                             │
│ [View History]              │
└─────────────────────────────┘
```

**Layout:**

- Header: "Akount Advisor" + subtitle
- Grouped by type: Attention, Optimization, Observations
- Card per insight (max 5-7 visible)
- [View History] link for dismissed insights

**Behavior:**

- Slides in from right (doesn't replace main view)
- Click card to expand detail view
- Dismiss/apply from detail
- Auto-refresh based on data changes

---

## AI Explanation Tooltip

Context-sensitive explanation:

```
Why is this suggested?
↓
This matches 4 previous transactions
in your "Cloud Services" category
with similar amount + description
pattern.

Confidence: 87%
Model version: v2.3
Trained on: 18 months of data

[Learn more]
```

**Usage:**

- Help icon (?) that triggers tooltip
- Explain AI reasoning concisely
- Link to documentation
- Show model version (for trust)

---

## Critical Alert

Rare, serious alert that requires action:

```
┌────────────────────────────────┐
│ ⚠ CRITICAL ALERT               │
│                                │
│ New US tax law affects your   │
│ LLC effective immediately.    │
│                                │
│ Review required before next   │
│ filing to avoid penalties.    │
│                                │
│ [Learn More]  [Connect CPA]   │
└────────────────────────────────┘
```

**When to use:**

- Tax law changes (not optional)
- Hard compliance deadlines
- Material financial risk
- **NOT** for normal suggestions

**Rule:** If everything is urgent → nothing is trusted.

---

## AI Action Button

Call-to-action for AI recommendation:

```
Standard:     [Apply Suggestion]
Primary:      [Apply Deduction to Journal]
Destructive:  [Auto-categorize all]
Secondary:    [Learn more] [Ignore]
```

**Types:**

- **Apply:** Accept and execute
- **Learn more:** Get more information
- **Ignore:** Dismiss this suggestion
- **Always:** Create rule from suggestion

**Behavior:**

- Primary button: Benefit of accepting
- Secondary button: Escape option
- Clear result: What happens on click?

---

## Feedback Component

Post-action feedback collection:

```
Was this helpful?

👍 Yes, I liked this suggestion
👎 No, this wasn't helpful
[Give feedback]
```

**Usage:**

- After user acts on suggestion
- Helps improve AI model
- Optional detailed feedback form
- Tracks suggestion quality

**Data collected:**

- Helpful? (yes/no)
- Optional comment
- Context (transaction, category, etc.)
- Timestamp

---

## AI Learning Indicator

Shows AI is learning from user:

```
✨ AI is learning

We've recorded 12 categorization
preferences. AI suggestions are
getting more accurate.

Current accuracy: 87%
```

**When to show:**

- After user provides feedback
- When confidence improves
- Quarterly progress reports

---

## Escalation Component

Route complex issue to human:

```
┌────────────────────────────────┐
│ This involves cross-border     │
│ transfer pricing.              │
│                                │
│ Would you like to speak to a  │
│ vetted CPA?                   │
│                                │
│ [Connect with Accountant]      │
│ [Learn more] [Later]           │
└────────────────────────────────┘
```

**When AI doesn't know:**

- Complex tax scenarios
- Jurisdiction-specific rules
- Multi-entity scenarios
- Unusual transactions

**Behavior:**

- Clear statement: "This is beyond AI scope"
- Connection option (vetted professionals)
- Learn more link
- "Not now" option

---

## AI Suggestion Chip in Table

Appears next to categorized transaction:

```
Category: Cloud Services ▾
          [✨ AI Suggests: Infrastructure] 87%
          [Apply] [Ignore]
```

**Compact version:**
Shows confidence % and quick action buttons.

---

## Insight History

View past suggestions (reviewed/applied/dismissed):

```
✓ Applied (5)
  • Tax deduction - Dec 1
  • Duplicate detection - Nov 28
  • [Show more]

✓ Reviewed (3)
  • Policy change - Dec 2
  • [Show more]

✗ Dismissed (2)
  • Spending anomaly - Dec 3
  • [Show more]

[Clear History]
```

**Features:**

- Group by action (applied, reviewed, dismissed)
- Show date and summary
- Re-apply dismissed suggestions
- Clear history option

---

## Component Composition

**AI suggestion flow:**

```
Raw Data
    ↓
AI Model → Insight (with confidence)
    ↓
Insight Card (display)
    ↓
User Action: Apply / Ignore / Learn
    ↓
Feedback Loop → Improve Model
```

---

## AI Transparency Rules (Critical)

Every AI component MUST include:

1. **What we noticed** - Observable facts from data
2. **Why this matters** - Business impact
3. **Recommended action** - Clear next step
4. **Confidence level** - How certain?
5. **Context** - Entity, jurisdiction, period (never generic)
6. **Escape hatch** - How to dismiss/override

**Never:**

- ❌ "You might save money" (vague)
- ❌ "This is wrong" (judgmental)
- ❌ "AI thinks you should..." (authority)
- ✅ "Your 🇨🇦 Canadian Corp may save $2,300 CAD this tax year (87% confidence)"

---

## Accessibility

All AI components:

- ✓ Keyboard accessible (Tab, Enter, Escape)
- ✓ Screen reader friendly (proper labels, ARIA)
- ✓ Clear focus indicators
- ✓ Sufficient contrast (WCAG AA)
- ✓ Explain reasoning (not just icons)
- ✓ Provide escape route (can dismiss/ignore)

---

## Dark Mode

AI components in dark mode:

- Violet accent color (--ak-ai-primary) remains consistent
- Background panels elevated for contrast
- Icon colors adjusted for visibility
- Insight cards have subtle borders

---

## See Also

- [`../02-patterns/ai-interaction.md`](../02-patterns/ai-interaction.md) - Complete AI pattern specification
- [`../00-foundations/colors.md`](../00-foundations/colors.md) - Violet color for AI
- [`primitives.md`](./primitives.md) - Button and badge components
- [`data-display.md`](./data-display.md) - Card and panel layouts
