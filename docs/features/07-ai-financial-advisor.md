# AI Financial Advisor

AI-powered financial guidance providing personalized spending insights, tax optimization recommendations, and subsidy/program alerts. Features a feed-style timeline of AI insights with priority levels, impact amounts, and confidence scores.

## Key Features
- AI-generated insights in chronological feed
- Priority badges (high/medium/low)
- Impact/savings amounts and confidence scores
- Insight types: spending, tax deductions, subsidies, alerts, recommendations
- Action deadlines for time-sensitive insights
- One-click actions (create rules, add deductions, apply suggestions)
- Dismiss, apply, or provide feedback on insights
- Share insights with accountants/advisors
- Categorization rules management (review AI-created rules)
- Related data links to transactions/accounts that triggered insight

## Tab Navigation
- **Insights Feed** (default)
- **Categorization Rules**

## Components
- Insights feed (timeline/card layout)
- Insight cards with priority, impact, actions
- Priority and confidence indicators
- Action buttons (Dismiss, Apply, Feedback, Share)
- Rules list with active/inactive toggle
- Rule detail views
- Filter dropdown (priority, insight type)
- Deadline countdown indicators

**Reference:** `product/sections/ai-financial-advisor/spec.md`, `types.ts`, `sample-data.json`, `tests.md`
