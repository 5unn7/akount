# Milestone 6: Analytics

**Prerequisites:** Foundation, Transactions, Invoicing complete

## Goal

Build financial reporting dashboards with cash flow analysis, P&L, balance sheet, and customizable reports.

## Key Functionality

1. **Dashboard Overview** - Key metrics and trend visualizations
2. **Cash Flow Analysis** - Money in vs. out over time with category breakdowns
3. **P&L Statement** - Income statement showing revenue, expenses, net income
4. **Balance Sheet** - Assets, liabilities, equity snapshot
5. **AI Insights Panel** - Financial observations and recommendations
6. **Time Period Selector** - This month, last quarter, YTD, custom ranges
7. **Entity Filter** - View specific entity or consolidated
8. **Export** - Download reports as PDF or CSV
9. **Saved Reports** - Save filter/layout preferences

## Components

- `AnalyticsDashboard` - Main view with metric cards and charts
- `CashFlowView` - Line chart of inflows vs. outflows, category breakdown
- `PLView` - Structured income statement with revenue/expense sections
- `BalanceSheetView` - Assets, liabilities, equity with totals
- `InsightsPanel` - AI-generated financial observations
- `MetricCard` - Individual metric with trend indicator
- `ChartContainer` - Wrapper for responsive charts
- `ExportButton` - PDF/CSV download trigger
- `ReportFilters` - Entity, time period, account group selectors

## Tab Navigation

- **Dashboard** (default)
- **Cash Flow**
- **P&L**
- **Balance Sheet**
- **Insights**

## Done Checklist

- [ ] Dashboard displays key metrics with trends
- [ ] Cash flow chart shows inflows and outflows
- [ ] Category breakdown in cash flow view
- [ ] P&L statement generates correctly by period
- [ ] Balance sheet shows assets, liabilities, equity
- [ ] AI insights panel displays recommendations
- [ ] Time period selector updates all reports
- [ ] Entity filter works across all views
- [ ] Can export reports to PDF and CSV
- [ ] Charts are responsive and interactive
- [ ] Can save report configurations
- [ ] Multi-entity consolidated reporting works
- [ ] Tests pass

**Reference:** `sections/analytics/`
