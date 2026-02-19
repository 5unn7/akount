# AI Interaction Patterns

> **Extracted from:** `insights-sidepanel.md` + Design Philosophy (AI Transparency)
>
> **Last Updated:** 2026-02-04

## Overview

The AI system in Akount is **contextual, reactive, and proactive—but never intrusive.**

It should feel like:
> a senior cross-border accountant
> who watches everything quietly
> and speaks only when it matters

Not a chatbot. Not noisy. Not "ask me anything."

---

## Core Philosophy

### AI = Advisor, Not Authority

AI exists to:

1. **Surface what the user would miss**
2. **Explain why it matters**
3. **Recommend an action**
4. **Know when to escalate to a human**

That's it.

### AI Transparency Rules

All AI suggestions must include:

- **What we noticed** - Observable facts
- **Why this matters** - Business/financial impact
- **Recommended action** - Specific, actionable recommendation
- **Confidence level** - How confident is the AI?
- **Context** - Entity, jurisdiction, period (never generic)

### Mental Model

Think: **GitHub Copilot for finance**, not ChatGPT in a box.

---

## Entry Points

Multiple intentional ways to access AI insights:

### Primary

- Click **AI Indicator** in top command bar (violet dot or badge)

### Secondary (Contextual)

- "AI Suggestion" chip inline in transaction table
- "View insight" link in reports
- Warning banner ("New policy affects you")
- Quick tip widget on dashboard

**All roads lead to one unified panel** - the Insights Panel.

---

## Insights Panel

### Panel Anatomy

Panel slides in from **right**, width ~420–480px

```
────────────────────────────
🧠 Akount Advisor
Watching your finances
────────────────────────────

[ Insight Feed - Prioritized list ]
────────────────────────────

[ Insight Detail View - Depth, not navigation ]
────────────────────────────

[ Action Footer - Clear next steps ]
```

**No modal. No navigation break.**

### Insight Feed

A **prioritized list**, not chronological. Shows 5-7 insights max.

#### Insight Card Structure

```
[VIOLET ICON]  Tax Optimization
You may deduct $48,000 for home office expenses
Applies to: 🇨🇦 Canadian Corp
Impact: +$12,500 tax savings
Confidence: High

[Review]
```

#### Insight Types (Color-Coded)

| Type          | Accent | Icon | Examples |
| ------------- | ------ | ---- | -------- |
| Optimization  | Violet | 💡   | Deductions, tax efficiency, cost savings |
| Alert         | Amber  | ⚠    | Policy changes, risks, deadlines |
| Observation   | Slate  | 📊   | Spending changes, trends |
| Confirmation  | Green  | ✓    | "This looks correct", "Well done" |

---

## Insight Detail View

When clicked, the panel **deepens** (not navigates to new page).

### Structure

```
🧠 Home Office Deduction Opportunity
────────────────────────────────────

What we noticed
You spent $4,000/month on internet, utilities, and rent.

Why this matters
Canadian tax law allows proportional deduction for home office,
reducing your taxable income significantly.

Estimated impact
$12,500 saved this fiscal year (≈ 2 months revenue)

Recommended action
[Apply deduction to journal]
[Mark as reviewed]
[Learn more]

Confidence
High (based on 6 months of consistent data)
Applies to: 🇨🇦 Canadian Corp
Period: 2025 Tax Year

Sources
Canadian Tax Act Section XX
Previous similar deductions: 3

Feedback
Was this helpful?  👍  👎
```

**This builds trust.** Users understand exactly why the AI is recommending something.

---

## Context Awareness (Critical)

Every insight shows:

- **Entity** - Which legal entity does this affect?
- **Jurisdiction** - Which tax jurisdiction applies?
- **Period** - Which fiscal period?
- **Confidence level** - How certain is the AI?

Never generic. Always specific.

### Bad AI Says
>
> "You might save money."

### Good AI Says
>
> "Your 🇨🇦 Canadian Corp may save $2,300 CAD this year (March 2025 tax year, based on 6 months of data, high confidence)."

---

## Action System

Every insight must map to an **actionable next step**:

| Insight Type | Action | Result |
| ------------ | ------ | ------ |
| Categorization | Apply / Create Rule | Categorize transaction |
| Deduction | Apply to journal | Create journal entry |
| Optimization | Schedule action | Execute recommendation |
| Alert | Acknowledge / Escalate | Mark as reviewed or escalate |
| Complex | Connect accountant | Open accountant portal |

**If no action → insight doesn't ship.**

---

## Insight Lifecycle

Insights are **living objects** with state:

| State     | Meaning            | Action |
| --------- | ------------------ | ------ |
| New       | Needs attention    | Display in feed |
| Reviewed  | User acknowledged  | Move to history (still accessible) |
| Applied   | Action taken       | Remove from feed, record in audit |
| Dismissed | Not relevant       | Remove, track for learning |
| Escalated | Human involved     | Route to accountant |

**This avoids AI spam.** Users see only relevant insights.

---

## Learning & Feedback Loop

After user acts on insight:

```
Was this helpful?  👍  👎
```

**Negative feedback trains the system:**

- Adjusts confidence thresholds
- Refines insight triggers
- Makes AI more conservative over time

The AI learns from being wrong.

---

## Critical Alerts (Rare, Serious)

Only for compliance risk, hard deadlines, or material tax impact.

Example:

```
⚠ New US tax law affects your LLC
Review required before next filing
[Learn more] [Connect accountant]
```

**Rule:** If everything is urgent → nothing is trusted.

---

## Human Accountant Bridge

For complexity beyond AI scope:

```
This involves cross-border transfer pricing.
Would you like to speak to a vetted CPA?

[Connect Accountant]
```

**AI knows when to stop.** This is huge for credibility.

---

## Tone & Language Rules

AI voice must be:

- **Calm** - Never alarmist
- **Specific** - Always with numbers and context
- **Non-absolute** - Acknowledges uncertainty
- **Respectful** - Empowers user decision-making

### Don'ts & Do's

| ❌ Avoid | ✅ Use Instead |
| --------- | --------------- |
| "You should do this" | "You may want to consider…" |
| "This will save you money" | "Based on current data, this may reduce tax liability" |
| "You forgot to categorize" | "3 transactions need categorization" |
| "Wrong category!" | "AI suggests Cloud Services instead of Marketing" |

---

## Inline AI Suggestions

AI doesn't just live in the side panel—it assists **within context**:

### In Transaction Table

```
Category: Marketing ▾
AI Suggestion: Cloud Services
Confidence: 87%

[Apply] [Ignore] [Always cloud]
```

### In Invoice Form

```
Category:
[Search categories]

AI Suggests: Professional Services
Based on: "Software development invoice"

[Apply] [Learn why]
```

### In Report View

```
P&L Statement - Q4 2025

⚠ Unusual item detected:
"Meals & Entertainment" up 42% vs Q3

[View similar periods] [Create rule]
```

---

## Visual Identity

| Element | Rule | Rationale |
| ------- | ---- | --------- |
| Accent Color | Violet (`--ak-ai-primary`) | Distinct from financial semantic colors |
| Icon | Sparkle (✨) or Lightbulb (💡) | Never robot/chatbot icons |
| Motion | Soft, deliberate | AI feels thoughtful, not rushed |
| Density | Comfortable reading | This is where users *think* |
| Notifications | Badge only (no toasts) | Respects user attention |

### Dark Mode

AI violet remains consistent. Background panels slightly elevated for contrast.

---

## Confidence Display

Always show confidence level:

```
High (87%)     - Very confident
Medium (65%)   - Reasonably confident
Low (42%)      - Tentative suggestion
```

Use as:

- Badge in insight cards
- Percentage in detail view
- Line thickness in suggestions (thicker = more confident)

---

## Emotional Outcomes

After using AI features, users should feel:

> "I am not alone in managing global finances."

That's the product moat.

---

## Component Decomposition

### Primitives

- `InsightCard` - Card with icon, title, description, action
- `ConfidenceBadge` - Displays confidence level
- `AIActionButton` - "Apply", "Ignore", "Learn why"
- `EntityContextLabel` - Shows entity, jurisdiction, period
- `AIIndicator` - Violet dot with notification badge

### Composites

- `InsightsPanel` - Main side panel
- `InsightFeed` - Prioritized list of insights
- `InsightDetail` - Expanded view with full context
- `InlineAISuggestion` - Chip/popover in transaction/form context
- `CriticalAlert` - Urgent, important notification

### Patterns

- **Suggestion Workflow** - User sees suggestion → applies/ignores → feedback loop
- **Contextual Help** - AI explains why something matters
- **Progressive Disclosure** - Summary → detail on demand
- **Escalation Path** - Complex issue → human accountant

---

## Implementation Example

### React Hook

```tsx
export function useAIInsight(context) {
  const [insights, setInsights] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchInsights(context).then(data => {
      // Sort by: critical alerts first, then by confidence, then by entity
      const sorted = data.sort((a, b) => {
        if (a.severity === 'critical') return -1;
        return b.confidence - a.confidence;
      });
      setInsights(sorted);
    });
  }, [context]);

  return { insights, selected, setSelected };
}

function AIInsightCard({ insight, onApply }) {
  return (
    <div className="ai-insight-card" data-type={insight.type}>
      <div className="ai-insight-header">
        <AIIndicator type={insight.type} />
        <h3>{insight.title}</h3>
      </div>

      <p className="ai-insight-summary">{insight.summary}</p>

      <div className="ai-insight-context">
        <EntityContextLabel entity={insight.entity} />
        <ConfidenceBadge level={insight.confidence} />
      </div>

      <div className="ai-insight-actions">
        {insight.actions.map(action => (
          <AIActionButton
            key={action.id}
            action={action}
            onClick={() => onApply(insight.id, action)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Accessibility

- **Screen readers:** Insight cards have ARIA labels
- **Keyboard:** Tab through insights, Enter to expand
- **Focus:** Visible focus ring on all interactive elements
- **Contrast:** Confidence badges meet WCAG AA
- **Color:** Icons + text (never color-only)

---

## Planned Enhancements (From Roadmap)

### AI Drift & Confidence Degradation Handling (MEDIUM Priority, 12+ months)

**Future enhancement:** Detect when AI suggestions degrade in accuracy and alert users.

**What's planned:**

- Confidence decay model over time (adjusts as patterns change)
- "AI unsure" states when accuracy drops below threshold
- Periodic re-learning checkpoints to retrain on new patterns
- Manual feedback loop that improves model accuracy over time
- Visual indicators when AI is degrading in confidence

**The problem:**
Over time, business patterns change. Businesses evolve. AI suggestions can drift without the user knowing, leading to silent erosion of suggestion quality.

**Why it matters:**
Prevents **silent AI erosion** — where suggestions degrade without visible warning. Maintains trust by being transparent about model uncertainty.

**Expected impact:** AI suggestions remain trustworthy long-term. "My AI advisor tells me when it's less confident."

---

### AI Explainability Logs (LOW Priority, 18+ months)

**Future enhancement:** Store and audit complete reasoning for every AI decision.

**What's planned:**

- Stored explanation layers for each AI decision:
  - Inputs considered (which transactions, rules, patterns)
  - Reasoning summary (how the model arrived at conclusion)
  - Confidence calculation breakdown
  - Feature importance (which factors mattered most)
- Complete audit trail for all AI decisions
- Export functionality for regulatory review
- Regulator-facing documentation of AI usage

**Why it matters:**

- Auditors may ask: "Why was this categorized as X?"
- Regulators may scrutinize AI usage in future enforcement actions
- Builds legal defensibility for financial decisions influenced by AI
- Future-proofs Akount against regulatory scrutiny

**Expected impact:** AI decisions become legally defensible. "Here's why the AI recommended this, with full transparency."

---

## See Also

- [`../00-foundations/philosophy.md`](../00-foundations/philosophy.md) - AI Transparency principle
- [`../01-components/ai-components.md`](../01-components/ai-components.md) - Reusable AI components
- [`../03-screens/dashboards.md`](../03-screens/dashboards.md) - AI insights on dashboard
- [`./tables-data.md`](./tables-data.md) - Inline AI suggestions in tables
- [`../05-governance/permissions-matrix.md`](../05-governance/permissions-matrix.md) - Who sees AI features
