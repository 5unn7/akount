---
name: competition-analysis
description: Refresh competitive intelligence — research competitors, update tracking table, identify new threats
argument-hint: "[competitor name to add, or 'refresh' for full update, or 'quick' for top threats only]"
aliases:
  - competitors
  - comp-analysis
  - competitive-intel
keywords:
  - competition
  - competitor
  - competitive
  - market
  - landscape
  - rival
---

# Competition Analysis Agent

Research and update Akount's competitive intelligence in `brand/competitive-analysis.md`.

---

## How It Works

### Step 1: Determine Scope

Parse the user's input to determine scope:

- **`refresh`** or no argument → Full refresh of all competitors
- **`quick`** → Quick update on top 5 threats only (Kick, Puzzle, Digits, Synder, Tabula)
- **`[company name]`** → Research a specific competitor and add/update their entry
- **`yc`** → Scan YC directory for new finance/accounting companies
- **`market`** → Update market sizing and trend data only

### Step 2: Read Current State

```
Read brand/competitive-analysis.md
```

Note what's already tracked, last update dates, and any gaps.

### Step 3: Research (Launch Parallel Agents)

Based on scope, launch research agents using the Task tool:

**For full refresh or quick update:**

Launch a Task agent (subagent_type: general-purpose) for each top competitor:
- Search for latest pricing, features, funding, product launches
- Check for acquisitions, shutdowns, pivots
- Look for new competitors that have emerged

**For adding a specific competitor:**

Launch a single Task agent to research:
1. Target market (freelancer, solopreneur, SMB, enterprise?)
2. Pricing (free tier? monthly cost? per user?)
3. Core features (bookkeeping, invoicing, banking, reports, tax)
4. AI capabilities (auto-categorization, insights, recommendations?)
5. Multi-currency/multi-entity support
6. Design/UX quality (modern? dated? mobile app?)
7. Integrations (bank connections, payment processors, tax filing)
8. Unique strengths (what do they do better than anyone else?)
9. Key weaknesses (common complaints, missing features)
10. Recent funding/trajectory (growing? acquired? shutting down?)

**For YC scan:**

Launch a Task agent to:
- Fetch https://www.ycombinator.com/companies/industry/finance-and-accounting
- Identify companies NOT already in the tracking document
- Research new finds for relevance to Akount

**For market update:**

Launch Task agents to research:
- Latest market sizing data (TAM/SAM/SOM)
- Industry trend updates
- Regulatory changes (e-invoicing, open banking, privacy)
- Solopreneur population/spending data

### Step 4: Classify Threat Level

For each competitor (new or updated), classify:

| Tier | Criteria |
|------|----------|
| **HIGH** | Same target market + overlapping core features + funded + growing |
| **MEDIUM** | Adjacent market OR partial feature overlap + could expand into Akount's space |
| **LOW-MEDIUM** | Niche overlap OR different model but same problem space |
| **LOW** | Feature-limited OR different market segment |
| **VERY LOW** | Complementary, adjacent, or clearly different category |

### Step 5: Update Document

Edit `brand/competitive-analysis.md` with:

1. **Updated competitor entries** — new data in existing rows
2. **New competitors** — added to appropriate threat tier table
3. **Removed competitors** — if shut down or no longer relevant
4. **Updated market data** — if scope includes market research
5. **Updated changelog** — date + description of what changed
6. **Updated "Last Updated" date** in header

### Step 6: Report Changes

Output a summary to the user:

```
## Competition Analysis Update — [DATE]

### Changes
- [List of what was updated/added/removed]

### Key Findings
- [Most important new intelligence]

### Threat Level Changes
- [Any competitors that moved up or down in threat tier]

### Action Items
- [Anything Akount should respond to — pricing changes, new features, market shifts]
```

---

## Akount's Position (Context for Research)

**Product:** AI-powered financial command center for globally-operating solopreneurs

**Core Features:**
- AI categorization (bank transactions)
- AI Advisor (insights, rules engine)
- Bank statement import (PDF parsing, CSV)
- Multi-entity management (included, not per-entity pricing)
- Multi-currency (included, not locked behind expensive tier)
- Double-entry bookkeeping (journal entries, trial balance, chart of accounts)
- Invoicing + Bill/Payment management (AR/AP)
- Financial reports (P&L, Balance Sheet, Cash Flow, AR/AP Aging, Trial Balance)
- Glass morphism dark-first design ("Financial Clarity" aesthetic)

**Key Differentiators:**
1. Multi-entity + multi-currency included at base price (competitors charge extra)
2. Full double-entry bookkeeping (many "modern" tools lack this)
3. Bank statement PDF/CSV import (works globally, not just US Plaid)
4. Design-forward UX (no accounting tool has won a design award)
5. AI-first architecture (not bolted-on AI features)

**Target Price Range:** $25-49/month

---

## Competitor Watchlist (Top 5 Threats)

Always check these first during any refresh:

1. **Kick** — Closest positioning. $20M funding. "Self-driving bookkeeping"
2. **Puzzle** — Strong AI. $66.5M funding. Simultaneous cash+accrual
3. **Digits** — Best AI benchmark (97.8%). $97.4M funding. "Agentic GL"
4. **Synder** (YC S19) — Multi-currency e-commerce accounting. 4K+ daily users
5. **Tabula** (YC S24) — European SME AI accounting. $4.6M seed. EU VAT handling

---

## Sources to Check

| Source | URL | What to Look For |
|--------|-----|-----------------|
| YC Directory | https://www.ycombinator.com/companies/industry/finance-and-accounting | New companies, batch announcements |
| Crunchbase | Search individual companies | Funding rounds, acquisitions |
| Accounting Today | https://www.accountingtoday.com | Product launches, industry trends |
| TechCrunch Fintech | https://techcrunch.com/category/fintech/ | Funding announcements, launches |
| Product Hunt | Search "accounting" or "bookkeeping" | New product launches |
| G2/Capterra | Search competitor names | User reviews, feature comparisons |
| Company blogs/pricing pages | Individual competitor sites | Pricing changes, feature announcements |
