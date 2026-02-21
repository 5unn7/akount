# Banking Command Center — Tasks

**Plan:** [2026-02-20-banking-command-center.md](./2026-02-20-banking-command-center.md)
**Created:** 2026-02-21
**Total:** 28 tasks across 4 sprints

---

## Sprint 1: Accounts Page Redesign

| ID | Task | Effort | Priority | Status | Deps | Source |
|----|------|--------|----------|--------|------|--------|
| UX-86 | Create BankingBalanceHero component (gradient hero + balance + action pills) | 30m | 🟠 High | ✅ | | plan:banking-command-center |
| UX-87 | Create BankingInsightPanel component (insight card + needs attention) | 30m | 🟠 High | ✅ | | plan:banking-command-center |
| UX-88 | Create AccountCardGrid component (4-col grid + type filter tabs) | 30m | 🟠 High | ✅ | | plan:banking-command-center |
| UX-89 | Create BankingStatsRow component (4 stats using StatsGrid) | 15m | 🟠 High | ✅ | | plan:banking-command-center |
| UX-90 | Rewrite banking/accounts/page.tsx with grid layout | 45m | 🟠 High | ✅ | [needs: UX-86,87,88,89] | plan:banking-command-center |
| UX-91 | Update accounts/loading.tsx skeleton for grid layout | 15m | 🟡 Medium | ✅ | [needs: UX-90] | plan:banking-command-center |

---

## Sprint 1.5: Account Detail Page Redesign

| ID | Task | Effort | Priority | Status | Deps |
|----|------|--------|----------|--------|------|
| — | Create AccountDetailHero component | 30m | 🟠 High | ✅ | |
| — | Create AccountInsightCard component | 20m | 🟠 High | ✅ | |
| — | Create AccountDetailsPanel component | 20m | 🟠 High | ✅ | |
| — | Create AccountStatsRow component | 20m | 🟠 High | ✅ | |
| — | Create BalanceHistoryChart component | 45m | 🟠 High | ✅ | |
| — | Rewrite accounts/[id]/page.tsx with grid layout | 45m | 🟠 High | ✅ | |
| — | Update accounts/[id]/loading.tsx skeleton | 15m | 🟡 Medium | ✅ | |

---

## Sprint 2: Transactions Command Center

| ID | Task | Effort | Priority | Status | Deps |
|----|------|--------|----------|--------|------|
| — | Backend: spending-by-category endpoint | 1h | 🟠 High | ✅ | |
| — | Frontend API client for spending breakdown | 15m | 🟠 High | ✅ | |
| — | Create SpendingBreakdown component | 30m | 🟠 High | ✅ | |
| — | Create AICategoryQueue component | 30m | 🟠 High | ✅ | |
| — | Create TopMerchants component | 20m | 🟡 Medium | ✅ | |
| — | Create RecurringDetected component | 30m | 🟡 Medium | ✅ | |
| — | Create DailyCashFlowTimeline component | 30m | 🟠 High | ✅ | |
| — | Enhance TransactionsTable (running balance, AI, anomaly) | 1h | 🟠 High | ✅ | |
| — | Create TransactionsStatsRow component | 20m | 🟠 High | ✅ | |
| — | Rewrite transactions/page.tsx with command center layout | 1h | 🟠 High | ✅ | |

---

## Sprint 3: Polish + Mobile

| ID | Task | Effort | Priority | Status | Deps |
|----|------|--------|----------|--------|------|
| — | Mobile responsive layout for Accounts | 30m | 🟡 Medium | 📦 | |
| — | Mobile responsive layout for Account Detail | 30m | 🟡 Medium | 📦 | |
| — | Mobile responsive layout for Transactions | 30m | 🟡 Medium | 📦 | |
| — | Update transactions/loading.tsx skeleton | 15m | 🟡 Medium | 📦 | |
| — | Cleanup deprecated components | 30m | 🟡 Medium | 📦 | |

---

## Done

| ID | Task | Completed | Commit |
|----|------|-----------|--------|
