# WEB-COMPONENTS Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 183
**Estimated tokens:** ~17,154

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 183,
  "f": {
    "gl-account-combobox": {
      "p": "apps/web/src/components/accounting/gl-account-combobox.tsx",
      "e": [
        "GLAccountCombobox"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/api/accounting"
      ],
      "l": 169,
      "pt": "C",
      "v": [],
      "d": "acc"
    },
    "AccountFormSheet": {
      "p": "apps/web/src/components/accounts/AccountFormSheet.tsx",
      "e": [
        "AccountFormSheet"
      ],
      "i": [
        "react",
        "next/link",
        "sonner",
        "@/providers/entity-provider",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react",
        "@/lib/api/accounts",
        "@/lib/api/entities"
      ],
      "l": 362,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "AddAccountModal": {
      "p": "apps/web/src/components/accounts/AddAccountModal.tsx",
      "e": [
        "AddAccountModal"
      ],
      "i": [
        "react",
        "next/dynamic",
        "next/navigation",
        "@/providers/entity-provider",
        "@/components/ui/glow-card",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/skeleton",
        "lucide-react",
        "@/lib/api/entities"
      ],
      "l": 248,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TransactionsList": {
      "p": "apps/web/src/components/transactions/TransactionsList.tsx",
      "e": [
        "TransactionsList"
      ],
      "i": [
        "lucide-react",
        "@/lib/api/transactions",
        "@/lib/api/accounts",
        "./TransactionsListClient"
      ],
      "l": 40,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "TransactionsTableClient": {
      "p": "apps/web/src/components/accounts/TransactionsTableClient.tsx",
      "e": [
        "TransactionsTableClient"
      ],
      "i": [
        "react",
        "@/components/ui/card",
        "lucide-react",
        "date-fns",
        "@/lib/api/accounts",
        "@/lib/utils/currency",
        "./TransactionsToolbar"
      ],
      "l": 216,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TransactionsToolbar": {
      "p": "apps/web/src/components/accounts/TransactionsToolbar.tsx",
      "e": [
        "TransactionsToolbar"
      ],
      "i": [
        "lucide-react"
      ],
      "l": 64,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "job-progress": {
      "p": "apps/web/src/components/ai/job-progress.tsx",
      "e": [
        "JobProgressProps",
        "JobProgress"
      ],
      "i": [
        "@/hooks/use-job-stream",
        "@akount/ui",
        "lucide-react"
      ],
      "l": 130,
      "pt": "C",
      "v": [
        {
          "code": "L",
          "msg": "console.log in production",
          "fix": "Use request.log or server.log (pino structured logging)"
        }
      ],
      "d": "ai"
    },
    "AccountCardGrid": {
      "p": "apps/web/src/components/banking/AccountCardGrid.tsx",
      "e": [
        "AccountCardGrid"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/badge",
        "@/components/ui/glow-card",
        "@/components/ui/card",
        "@/lib/api/accounts",
        "@/lib/utils/currency",
        "@/lib/utils"
      ],
      "l": 205,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "AccountDetailHero": {
      "p": "apps/web/src/components/banking/AccountDetailHero.tsx",
      "e": [
        "AccountDetailHero"
      ],
      "i": [
        "react",
        "next/link",
        "@/components/ui/badge",
        "@/components/ui/button",
        "lucide-react",
        "@/lib/api/accounts",
        "@/lib/utils/currency",
        "@/components/dashboard/MiniSparkline",
        "@/lib/dashboard/constants"
      ],
      "l": 197,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "AccountDetailsPanel": {
      "p": "apps/web/src/components/banking/AccountDetailsPanel.tsx",
      "e": [
        "AccountDetailsPanel"
      ],
      "i": [
        "react",
        "@/lib/api/accounts",
        "@/lib/api/client-browser",
        "@/lib/utils/account-helpers",
        "./GLAccountSelector",
        "@/components/ui/button",
        "lucide-react",
        "next/navigation",
        "sonner"
      ],
      "l": 149,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "AccountInsightCard": {
      "p": "apps/web/src/components/banking/AccountInsightCard.tsx",
      "e": [
        "AccountInsightCard"
      ],
      "i": [
        "lucide-react",
        "@/lib/api/accounts",
        "@/lib/utils/account-helpers",
        "@/lib/utils/currency"
      ],
      "l": 74,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "AccountStatsRow": {
      "p": "apps/web/src/components/banking/AccountStatsRow.tsx",
      "e": [
        "AccountStatsRow"
      ],
      "i": [
        "@/components/shared/StatsGrid",
        "@/lib/utils/account-helpers",
        "@/lib/utils/currency"
      ],
      "l": 56,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "AICategoryQueue": {
      "p": "apps/web/src/components/banking/AICategoryQueue.tsx",
      "e": [
        "AICategoryQueue"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/api/transactions.types",
        "@/lib/utils/currency"
      ],
      "l": 119,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "BalanceHistoryChart": {
      "p": "apps/web/src/components/banking/BalanceHistoryChart.tsx",
      "e": [
        "BalanceHistoryChart"
      ],
      "i": [
        "react",
        "@/lib/utils/currency",
        "@/lib/utils"
      ],
      "l": 288,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "BankingBalanceHero": {
      "p": "apps/web/src/components/banking/BankingBalanceHero.tsx",
      "e": [
        "BankingBalanceHero"
      ],
      "i": [
        "react",
        "next/link",
        "@/components/ui/badge",
        "@/components/ui/button",
        "lucide-react",
        "@/lib/api/accounts",
        "@/lib/api/entities",
        "@/lib/utils/account-helpers",
        "@/lib/utils/currency",
        "@/components/accounts/AddAccountModal"
      ],
      "l": 193,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "BankingInsightPanel": {
      "p": "apps/web/src/components/banking/BankingInsightPanel.tsx",
      "e": [
        "BankingInsightPanel"
      ],
      "i": [
        "lucide-react",
        "next/link",
        "@/lib/api/accounts",
        "@/lib/utils/account-helpers"
      ],
      "l": 145,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "BankingStatsRow": {
      "p": "apps/web/src/components/banking/BankingStatsRow.tsx",
      "e": [
        "BankingStatsRow"
      ],
      "i": [
        "@/components/shared/StatsGrid",
        "@/lib/utils/account-helpers",
        "@/lib/utils/currency"
      ],
      "l": 47,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "DailyCashFlowTimeline": {
      "p": "apps/web/src/components/banking/DailyCashFlowTimeline.tsx",
      "e": [
        "DailyCashFlowTimeline"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/api/transactions.types",
        "@/lib/utils/currency"
      ],
      "l": 271,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "FlinksConnect": {
      "p": "apps/web/src/components/banking/FlinksConnect.tsx",
      "e": [
        "FlinksConnect"
      ],
      "i": [
        "react",
        "@/components/ui/glow-card",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/skeleton",
        "lucide-react",
        "@/lib/utils/currency",
        "@/app/(dashboard)/banking/accounts/actions",
        "@/lib/api/accounts"
      ],
      "l": 177,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "GLAccountSelector": {
      "p": "apps/web/src/components/banking/GLAccountSelector.tsx",
      "e": [
        "GLAccountSelector"
      ],
      "i": [
        "react",
        "@/lib/api/accounting",
        "@/lib/api/client-browser"
      ],
      "l": 70,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "RecurringDetected": {
      "p": "apps/web/src/components/banking/RecurringDetected.tsx",
      "e": [
        "RecurringDetected"
      ],
      "i": [
        "@/lib/api/transactions.types",
        "@/lib/utils/currency",
        "lucide-react"
      ],
      "l": 149,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "SpendingBreakdown": {
      "p": "apps/web/src/components/banking/SpendingBreakdown.tsx",
      "e": [
        "SpendingBreakdown"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/utils/currency",
        "@/lib/utils"
      ],
      "l": 138,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "TopMerchants": {
      "p": "apps/web/src/components/banking/TopMerchants.tsx",
      "e": [
        "TopMerchants"
      ],
      "i": [
        "lucide-react",
        "@/lib/api/transactions.types",
        "@/lib/utils/currency"
      ],
      "l": 83,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "TransactionsStatsRow": {
      "p": "apps/web/src/components/banking/TransactionsStatsRow.tsx",
      "e": [
        "TransactionsStatsRow"
      ],
      "i": [
        "@/components/shared/StatsGrid",
        "@/lib/utils/currency",
        "@/lib/utils/account-helpers"
      ],
      "l": 77,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "TransferForm": {
      "p": "apps/web/src/components/banking/TransferForm.tsx",
      "e": [
        "TransferForm"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/accounts",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/textarea",
        "lucide-react",
        "sonner",
        "@/lib/utils/currency"
      ],
      "l": 259,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "BillDetailPanel": {
      "p": "apps/web/src/components/business/BillDetailPanel.tsx",
      "e": [
        "BillDetailPanel"
      ],
      "i": [
        "@/lib/utils/date",
        "@/lib/api/bills",
        "@/components/ui/separator",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "lucide-react"
      ],
      "l": 195,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "BillForm": {
      "p": "apps/web/src/components/business/BillForm.tsx",
      "e": [
        "BillForm"
      ],
      "i": [
        "react",
        "@/components/ui/sheet",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/components/line-item-builder",
        "@/lib/api/client-browser",
        "lucide-react",
        "@/lib/api/bills"
      ],
      "l": 274,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "BillsTable": {
      "p": "apps/web/src/components/business/BillsTable.tsx",
      "e": [
        "BillsTable"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/bills",
        "@/components/ui/card",
        "@/components/ui/checkbox",
        "@/lib/utils/currency",
        "@/lib/utils/date",
        "@akount/ui/business",
        "@akount/ui",
        "@/lib/api/client-browser"
      ],
      "l": 201,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ClientDetailPanel": {
      "p": "apps/web/src/components/business/ClientDetailPanel.tsx",
      "e": [
        "ClientDetailPanel"
      ],
      "i": [
        "@/lib/api/clients",
        "@/components/ui/separator",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "lucide-react"
      ],
      "l": 161,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ClientForm": {
      "p": "apps/web/src/components/business/ClientForm.tsx",
      "e": [
        "ClientForm"
      ],
      "i": [
        "react",
        "@/components/ui/sheet",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/textarea",
        "@/components/ui/select",
        "@/lib/api/client-browser",
        "lucide-react",
        "@/lib/api/clients"
      ],
      "l": 184,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ClientsTable": {
      "p": "apps/web/src/components/business/ClientsTable.tsx",
      "e": [
        "ClientsTable"
      ],
      "i": [
        "next/navigation",
        "@/lib/api/clients",
        "@/components/ui/card",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "@akount/ui"
      ],
      "l": 137,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "InvoiceDetailPanel": {
      "p": "apps/web/src/components/business/InvoiceDetailPanel.tsx",
      "e": [
        "InvoiceDetailPanel"
      ],
      "i": [
        "@/lib/utils/date",
        "@/lib/api/invoices",
        "@/components/ui/separator",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "lucide-react"
      ],
      "l": 199,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "InvoiceForm": {
      "p": "apps/web/src/components/business/InvoiceForm.tsx",
      "e": [
        "InvoiceForm"
      ],
      "i": [
        "react",
        "@/components/ui/sheet",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/components/line-item-builder",
        "@/lib/api/client-browser",
        "lucide-react",
        "@/lib/api/invoices"
      ],
      "l": 279,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "InvoiceTable": {
      "p": "apps/web/src/components/business/InvoiceTable.tsx",
      "e": [
        "InvoiceTable"
      ],
      "i": [
        "react",
        "@/lib/utils/date",
        "next/navigation",
        "@/lib/api/invoices",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/checkbox",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "@akount/ui"
      ],
      "l": 274,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "InvoicingActions": {
      "p": "apps/web/src/components/business/InvoicingActions.tsx",
      "e": [
        "InvoicingActions"
      ],
      "i": [
        "react",
        "next/navigation",
        "next/dynamic",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 90,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "PaymentForm": {
      "p": "apps/web/src/components/business/PaymentForm.tsx",
      "e": [
        "PaymentForm"
      ],
      "i": [
        "react",
        "@/components/ui/sheet",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/lib/api/client-browser",
        "@/lib/utils/currency",
        "lucide-react"
      ],
      "l": 449,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "PaymentTable": {
      "p": "apps/web/src/components/business/PaymentTable.tsx",
      "e": [
        "PaymentTable"
      ],
      "i": [
        "@/lib/utils/date",
        "react",
        "next/link",
        "@/lib/api/payments",
        "@/components/ui/badge",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/separator",
        "@/lib/utils/currency",
        "@/lib/api/client-browser"
      ],
      "l": 523,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "VendorDetailPanel": {
      "p": "apps/web/src/components/business/VendorDetailPanel.tsx",
      "e": [
        "VendorDetailPanel"
      ],
      "i": [
        "@/lib/api/vendors",
        "@/components/ui/separator",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "lucide-react"
      ],
      "l": 161,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "VendorForm": {
      "p": "apps/web/src/components/business/VendorForm.tsx",
      "e": [
        "VendorForm"
      ],
      "i": [
        "react",
        "@/components/ui/sheet",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/textarea",
        "@/components/ui/select",
        "@/lib/api/client-browser",
        "lucide-react",
        "@/lib/api/vendors"
      ],
      "l": 184,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "VendorsTable": {
      "p": "apps/web/src/components/business/VendorsTable.tsx",
      "e": [
        "VendorsTable"
      ],
      "i": [
        "react",
        "@/lib/api/vendors",
        "@/components/ui/card",
        "@/lib/utils/currency",
        "@akount/ui/business",
        "@akount/ui",
        "./VendorDetailPanel"
      ],
      "l": 142,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "SimpleBarChart": {
      "p": "apps/web/src/components/charts/SimpleBarChart.tsx",
      "e": [
        "SimpleBarChart"
      ],
      "i": [
        "react",
        "@/lib/utils/currency"
      ],
      "l": 93,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ActionItems": {
      "p": "apps/web/src/components/dashboard/ActionItems.tsx",
      "e": [
        "ActionItems"
      ],
      "i": [
        "react",
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client"
      ],
      "l": 100,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "AIActionWidget": {
      "p": "apps/web/src/components/dashboard/AIActionWidget.tsx",
      "e": [
        "AIActionWidget"
      ],
      "i": [
        "react",
        "next/link",
        "lucide-react",
        "@/components/ui/badge",
        "@/components/ui/button",
        "@/lib/api/client-browser"
      ],
      "l": 231,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "AIBrief": {
      "p": "apps/web/src/components/dashboard/AIBrief.tsx",
      "e": [
        "AIBrief"
      ],
      "i": [
        "lucide-react"
      ],
      "l": 43,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "BudgetVsActualWidget": {
      "p": "apps/web/src/components/dashboard/BudgetVsActualWidget.tsx",
      "e": [
        "BudgetVsActualWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@/lib/api/planning",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 79,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "CashFlowChart": {
      "p": "apps/web/src/components/dashboard/CashFlowChart.tsx",
      "e": [
        "CashFlowChart"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 213,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "CircularProgress": {
      "p": "apps/web/src/components/dashboard/CircularProgress.tsx",
      "e": [
        "CircularProgress"
      ],
      "i": [],
      "l": 55,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "CircularProgressDynamic": {
      "p": "apps/web/src/components/dashboard/CircularProgressDynamic.tsx",
      "e": [],
      "i": [],
      "l": 8,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "CommandCenterRightPanel": {
      "p": "apps/web/src/components/dashboard/CommandCenterRightPanel.tsx",
      "e": [
        "CommandCenterRightPanel"
      ],
      "i": [
        "./QuickActionPills",
        "./UpcomingPayments",
        "@/lib/api/dashboard"
      ],
      "l": 22,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "DashboardCharts": {
      "p": "apps/web/src/components/dashboard/DashboardCharts.tsx",
      "e": [
        "DashboardCashFlowChart",
        "DashboardExpenseChart",
        "DashboardCharts"
      ],
      "i": [
        "react",
        "next/dynamic",
        "@/lib/api/dashboard-client"
      ],
      "l": 62,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "DashboardFilters": {
      "p": "apps/web/src/components/dashboard/DashboardFilters.tsx",
      "e": [
        "DashboardFilters"
      ],
      "i": [
        "next/navigation",
        "react",
        "@/lib/api/entities"
      ],
      "l": 90,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "DashboardLeftRail": {
      "p": "apps/web/src/components/dashboard/DashboardLeftRail.tsx",
      "e": [
        "DashboardLeftRail"
      ],
      "i": [
        "@/lib/dashboard/constants",
        "./StatCard"
      ],
      "l": 24,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "DashboardMetrics": {
      "p": "apps/web/src/components/dashboard/DashboardMetrics.tsx",
      "e": [
        "DashboardMetrics"
      ],
      "i": [
        "@/components/ui/card",
        "@/components/ui/glow-card",
        "lucide-react",
        "@/lib/api/dashboard",
        "@/lib/utils/currency"
      ],
      "l": 95,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "DashboardRightRail": {
      "p": "apps/web/src/components/dashboard/DashboardRightRail.tsx",
      "e": [
        "DashboardRightRail"
      ],
      "i": [
        "@/lib/utils",
        "./AIBrief",
        "./QuickActions",
        "./ActionItems",
        "./UpcomingPayments"
      ],
      "l": 28,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "EntitiesList": {
      "p": "apps/web/src/components/dashboard/EntitiesList.tsx",
      "e": [
        "EntitiesList"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/components/ui/glow-card",
        "@/lib/api/entities",
        "./EntityFormSheet"
      ],
      "l": 126,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "EntitiesSection": {
      "p": "apps/web/src/components/dashboard/EntitiesSection.tsx",
      "e": [
        "EntitiesSection"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/hooks/use-keyboard-shortcuts",
        "@/components/ui/collapsible",
        "./EntitiesList",
        "@/components/shared/SectionHeader",
        "@/lib/utils",
        "@/lib/api/entities"
      ],
      "l": 52,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "EntityAccountCards": {
      "p": "apps/web/src/components/dashboard/EntityAccountCards.tsx",
      "e": [
        "EntityAccountCards"
      ],
      "i": [
        "next/link",
        "@/components/ui/glow-card",
        "@/lib/api/accounts",
        "@/lib/utils/currency"
      ],
      "l": 100,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "EntityFormSheet": {
      "p": "apps/web/src/components/dashboard/EntityFormSheet.tsx",
      "e": [
        "EntityFormSheet"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/client-browser",
        "@/lib/api/entities",
        "@/lib/data/countries",
        "@/components/ui/country-select",
        "@/components/ui/scroll-area",
        "lucide-react"
      ],
      "l": 338,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ExpenseChart": {
      "p": "apps/web/src/components/dashboard/ExpenseChart.tsx",
      "e": [
        "ExpenseChart"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 183,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ExpenseForecastWidget": {
      "p": "apps/web/src/components/dashboard/ExpenseForecastWidget.tsx",
      "e": [
        "ExpenseForecastWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@/lib/api/planning",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 103,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "GoalProgressWidget": {
      "p": "apps/web/src/components/dashboard/GoalProgressWidget.tsx",
      "e": [
        "GoalProgressWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@/lib/api/planning",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 100,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "InsightCards": {
      "p": "apps/web/src/components/dashboard/InsightCards.tsx",
      "e": [
        "InsightCards"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/components/ui/badge",
        "@/lib/api/ai",
        "@/lib/utils"
      ],
      "l": 111,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "LiquidityHero": {
      "p": "apps/web/src/components/dashboard/LiquidityHero.tsx",
      "e": [
        "LiquidityHero"
      ],
      "i": [
        "@clerk/nextjs",
        "lucide-react",
        "@/components/ui/glow-card",
        "@/lib/utils/currency"
      ],
      "l": 108,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "MiniSparkline": {
      "p": "apps/web/src/components/dashboard/MiniSparkline.tsx",
      "e": [
        "MiniSparkline"
      ],
      "i": [
        "react",
        "@/lib/dashboard/constants"
      ],
      "l": 69,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "NetWorthHero": {
      "p": "apps/web/src/components/dashboard/NetWorthHero.tsx",
      "e": [
        "NetWorthHero"
      ],
      "i": [
        "@clerk/nextjs",
        "lucide-react",
        "@/components/ui/glow-card",
        "@/lib/utils/currency"
      ],
      "l": 135,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ProfitLossSummaryWidget": {
      "p": "apps/web/src/components/dashboard/ProfitLossSummaryWidget.tsx",
      "e": [
        "ProfitLossSummaryWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@akount/types/financial",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 103,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "QuickActionPills": {
      "p": "apps/web/src/components/dashboard/QuickActionPills.tsx",
      "e": [
        "QuickActionPills"
      ],
      "i": [
        "next/link"
      ],
      "l": 47,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "QuickActions": {
      "p": "apps/web/src/components/dashboard/QuickActions.tsx",
      "e": [
        "QuickActions"
      ],
      "i": [
        "next/link",
        "lucide-react"
      ],
      "l": 38,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "QuickStats": {
      "p": "apps/web/src/components/dashboard/QuickStats.tsx",
      "e": [
        "QuickStats"
      ],
      "i": [
        "lucide-react"
      ],
      "l": 39,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "RecentTransactions": {
      "p": "apps/web/src/components/dashboard/RecentTransactions.tsx",
      "e": [
        "RecentTransactions"
      ],
      "i": [
        "next/link",
        "@/lib/utils/date",
        "lucide-react",
        "@/lib/utils/currency",
        "@/lib/api/transactions"
      ],
      "l": 115,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "SparkCards": {
      "p": "apps/web/src/components/dashboard/SparkCards.tsx",
      "e": [
        "SparkCards"
      ],
      "i": [
        "react",
        "@/lib/utils",
        "lucide-react",
        "./MiniSparkline"
      ],
      "l": 106,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "StatCard": {
      "p": "apps/web/src/components/dashboard/StatCard.tsx",
      "e": [
        "StatCard"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/lib/utils",
        "./MiniSparkline"
      ],
      "l": 100,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TopRevenueClientsWidget": {
      "p": "apps/web/src/components/dashboard/TopRevenueClientsWidget.tsx",
      "e": [
        "TopRevenueClientsWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@akount/types/financial",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 88,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TrialBalanceStatusWidget": {
      "p": "apps/web/src/components/dashboard/TrialBalanceStatusWidget.tsx",
      "e": [
        "TrialBalanceStatusWidget"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard-client",
        "@/lib/utils/currency",
        "@akount/types/financial",
        "@/hooks/useWidgetData",
        "./WidgetPrimitives"
      ],
      "l": 90,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "UpcomingPayments": {
      "p": "apps/web/src/components/dashboard/UpcomingPayments.tsx",
      "e": [
        "UpcomingPayments"
      ],
      "i": [
        "react",
        "next/link",
        "lucide-react",
        "@/lib/api/dashboard",
        "@/lib/utils/currency",
        "@/lib/utils/date"
      ],
      "l": 114,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "WidgetPrimitives": {
      "p": "apps/web/src/components/dashboard/WidgetPrimitives.tsx",
      "e": [
        "WidgetTitle",
        "WidgetLoadingSkeleton",
        "WidgetErrorState",
        "WidgetEmptyState",
        "ProgressBar"
      ],
      "i": [
        "@/lib/utils",
        "lucide-react"
      ],
      "l": 236,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "EntityCard": {
      "p": "apps/web/src/components/entities/EntityCard.tsx",
      "e": [
        "EntityCard"
      ],
      "i": [
        "next/navigation",
        "@/lib/api/entities"
      ],
      "l": 104,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "EntityDetailClient": {
      "p": "apps/web/src/components/entities/EntityDetailClient.tsx",
      "e": [
        "EntityDetailClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "next/link",
        "@/components/ui/button",
        "@/lib/api/entities",
        "@/lib/api/client-browser"
      ],
      "l": 422,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "EntityHubClient": {
      "p": "apps/web/src/components/entities/EntityHubClient.tsx",
      "e": [
        "EntityHubClient"
      ],
      "i": [
        "react",
        "next/dynamic",
        "lucide-react",
        "@/lib/api/entities",
        "./EntityCard"
      ],
      "l": 97,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "BatchImportResults": {
      "p": "apps/web/src/components/import/BatchImportResults.tsx",
      "e": [
        "BatchImportResults"
      ],
      "i": [
        "next/link",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@/components/ui/glow-card",
        "./types"
      ],
      "l": 329,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ColumnMappingEditor": {
      "p": "apps/web/src/components/import/ColumnMappingEditor.tsx",
      "e": [
        "ColumnMappings",
        "detectMappings",
        "readCsvHeaders",
        "ColumnMappingEditor"
      ],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/label",
        "@/components/ui/switch",
        "lucide-react"
      ],
      "l": 305,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "FileListEditor": {
      "p": "apps/web/src/components/import/FileListEditor.tsx",
      "e": [
        "FileListEditor"
      ],
      "i": [
        "@/components/ui/button",
        "@/components/ui/badge",
        "lucide-react",
        "./types"
      ],
      "l": 194,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ImportConfirmation": {
      "p": "apps/web/src/components/import/ImportConfirmation.tsx",
      "e": [
        "ImportConfirmation"
      ],
      "i": [
        "@/lib/utils/date",
        "next/link",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/badge"
      ],
      "l": 273,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ImportHistoryClient": {
      "p": "apps/web/src/components/import/ImportHistoryClient.tsx",
      "e": [
        "ImportHistoryClient"
      ],
      "i": [
        "@/lib/utils/date",
        "react",
        "next/navigation",
        "next/link",
        "@/lib/api/imports",
        "@/app/(dashboard)/banking/imports/actions",
        "@/components/ui/card",
        "@/components/ui/badge",
        "@/components/ui/button"
      ],
      "l": 312,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ImportPreviewTable": {
      "p": "apps/web/src/components/import/ImportPreviewTable.tsx",
      "e": [
        "ImportPreviewTable"
      ],
      "i": [
        "@/components/ui/card",
        "@/components/ui/badge",
        "lucide-react",
        "@/lib/utils/currency"
      ],
      "l": 257,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ImportUploadForm": {
      "p": "apps/web/src/components/import/ImportUploadForm.tsx",
      "e": [
        "ImportUploadForm"
      ],
      "i": [
        "react",
        "./steps",
        "./types"
      ],
      "l": 155,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "FileSelectionStep": {
      "p": "apps/web/src/components/import/steps/FileSelectionStep.tsx",
      "e": [
        "FileSelectionStep"
      ],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "lucide-react",
        "../FileListEditor",
        "../types"
      ],
      "l": 286,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ResultsStep": {
      "p": "apps/web/src/components/import/steps/ResultsStep.tsx",
      "e": [
        "ResultsStep"
      ],
      "i": [
        "react",
        "lucide-react",
        "../BatchImportResults",
        "@/app/(dashboard)/banking/transactions/actions",
        "../types"
      ],
      "l": 116,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "UploadProgressStep": {
      "p": "apps/web/src/components/import/steps/UploadProgressStep.tsx",
      "e": [
        "UploadProgressStep"
      ],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "lucide-react",
        "../UploadProgressList",
        "../ColumnMappingEditor",
        "../types"
      ],
      "l": 241,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "UploadProgressList": {
      "p": "apps/web/src/components/import/UploadProgressList.tsx",
      "e": [
        "UploadProgressList"
      ],
      "i": [
        "lucide-react",
        "./types"
      ],
      "l": 102,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "Navbar": {
      "p": "apps/web/src/components/layout/Navbar.tsx",
      "e": [
        "Navbar"
      ],
      "i": [
        "next/dynamic",
        "@/hooks/use-sync-status",
        "@/providers/entity-provider",
        "./Sidebar",
        "@/components/ui/button",
        "@/components/ui/theme-toggle",
        "@/lib/api/entities"
      ],
      "l": 223,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "Sidebar": {
      "p": "apps/web/src/components/layout/Sidebar.tsx",
      "e": [
        "Sidebar",
        "MobileSidebar"
      ],
      "i": [
        "react",
        "next/link",
        "next/navigation",
        "@clerk/nextjs",
        "lucide-react",
        "@/lib/utils",
        "@/components/ui/button",
        "@/components/ui/scroll-area",
        "@/components/ui/sheet",
        "@/components/onboarding/SidebarProgressIndicator"
      ],
      "l": 358,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "SidebarProgressIndicator": {
      "p": "apps/web/src/components/onboarding/SidebarProgressIndicator.tsx",
      "e": [
        "SidebarProgressIndicator"
      ],
      "i": [
        "next/link",
        "@/lib/utils",
        "@/lib/api/onboarding"
      ],
      "l": 72,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "line-item-builder": {
      "p": "apps/web/src/components/line-item-builder.tsx",
      "e": [
        "LineItem",
        "TaxRateOption",
        "LineItemBuilder",
        "computeLineTotals"
      ],
      "i": [
        "react",
        "@/components/ui/input",
        "@/components/ui/button",
        "lucide-react",
        "@/lib/utils/currency"
      ],
      "l": 297,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "OnboardingHeroCard": {
      "p": "apps/web/src/components/onboarding/OnboardingHeroCard.tsx",
      "e": [
        "OnboardingHeroCard"
      ],
      "i": [
        "next/link",
        "@/lib/utils",
        "lucide-react"
      ],
      "l": 153,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "OnboardingOverlay": {
      "p": "apps/web/src/components/onboarding/OnboardingOverlay.tsx",
      "e": [
        "OnboardingOverlay"
      ],
      "i": [
        "react",
        "next/dynamic",
        "lucide-react"
      ],
      "l": 56,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ThemeProvider": {
      "p": "apps/web/src/components/providers/ThemeProvider.tsx",
      "e": [
        "ThemeProvider"
      ],
      "i": [
        "react",
        "next-themes"
      ],
      "l": 21,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "reconciliation-parts": {
      "p": "apps/web/src/components/reconciliation/reconciliation-parts.tsx",
      "e": [
        "StatusCard",
        "TransactionRow"
      ],
      "i": [
        "@/lib/api/transactions.types",
        "@/lib/api/reconciliation.types",
        "@/components/ui/badge",
        "@/components/ui/button"
      ],
      "l": 233,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ReconciliationDashboard": {
      "p": "apps/web/src/components/reconciliation/ReconciliationDashboard.tsx",
      "e": [
        "ReconciliationDashboard"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/accounts",
        "@/lib/api/transactions",
        "@/lib/api/reconciliation",
        "@/components/ui/button",
        "./reconciliation-parts"
      ],
      "l": 327,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "AgingBar": {
      "p": "apps/web/src/components/shared/AgingBar.tsx",
      "e": [
        "AgingBar"
      ],
      "i": [
        "@/lib/utils",
        "@/lib/utils/currency"
      ],
      "l": 119,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "BulkActionToolbar": {
      "p": "apps/web/src/components/shared/BulkActionToolbar.tsx",
      "e": [
        "BulkActionToolbar"
      ],
      "i": [
        "lucide-react",
        "@/components/ui/button"
      ],
      "l": 58,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "ContentPanel": {
      "p": "apps/web/src/components/shared/ContentPanel.tsx",
      "e": [
        "ContentPanel"
      ],
      "i": [
        "@/lib/utils"
      ],
      "l": 20,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "DetailPanel": {
      "p": "apps/web/src/components/shared/DetailPanel.tsx",
      "e": [
        "DetailPanel",
        "DetailRow",
        "DetailActions"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react"
      ],
      "l": 172,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "DomainTabs": {
      "p": "apps/web/src/components/shared/DomainTabs.tsx",
      "e": [
        "DomainTabs"
      ],
      "i": [
        "next/link",
        "next/navigation",
        "@/lib/utils",
        "@/lib/navigation"
      ],
      "l": 57,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "KeyboardShortcutsModal": {
      "p": "apps/web/src/components/shared/KeyboardShortcutsModal.tsx",
      "e": [
        "KeyboardShortcutsModal"
      ],
      "i": [
        "react",
        "lucide-react"
      ],
      "l": 111,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "PageHeader": {
      "p": "apps/web/src/components/shared/PageHeader.tsx",
      "e": [
        "PageHeader"
      ],
      "i": [],
      "l": 66,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "SectionHeader": {
      "p": "apps/web/src/components/shared/SectionHeader.tsx",
      "e": [
        "SectionHeader"
      ],
      "i": [
        "@/lib/utils"
      ],
      "l": 35,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "StatPill": {
      "p": "apps/web/src/components/shared/StatPill.tsx",
      "e": [
        "StatPill"
      ],
      "i": [
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 55,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "StatsGrid": {
      "p": "apps/web/src/components/shared/StatsGrid.tsx",
      "e": [
        "StatsGrid"
      ],
      "i": [
        "@/lib/utils",
        "lucide-react"
      ],
      "l": 96,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "TwoColumnLayout": {
      "p": "apps/web/src/components/shared/TwoColumnLayout.tsx",
      "e": [
        "TwoColumnLayout"
      ],
      "i": [
        "@/lib/utils"
      ],
      "l": 29,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "BulkActionBar": {
      "p": "apps/web/src/components/transactions/BulkActionBar.tsx",
      "e": [
        "BulkActionBar"
      ],
      "i": [
        "react",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 204,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "CategorySelector": {
      "p": "apps/web/src/components/transactions/CategorySelector.tsx",
      "e": [
        "CategorySelector"
      ],
      "i": [
        "react",
        "@/lib/api/categories",
        "@/components/ui/input",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 179,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "CreateTransactionForm": {
      "p": "apps/web/src/components/transactions/CreateTransactionForm.tsx",
      "e": [
        "CreateTransactionDialog"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react",
        "sonner",
        "@/app/(dashboard)/banking/transactions/actions"
      ],
      "l": 287,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TransactionsFilters": {
      "p": "apps/web/src/components/transactions/TransactionsFilters.tsx",
      "e": [
        "TransactionsFilters"
      ],
      "i": [
        "react",
        "@/lib/api/accounts",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/card",
        "lucide-react"
      ],
      "l": 146,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TransactionsListClient": {
      "p": "apps/web/src/components/transactions/TransactionsListClient.tsx",
      "e": [
        "TransactionsListClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/transactions",
        "@/lib/api/accounts",
        "@/lib/api/accounting",
        "@/lib/api/categories",
        "./TransactionsTable",
        "./TransactionsFilters",
        "./BulkActionBar",
        "@/components/ui/button"
      ],
      "l": 509,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "TransactionsTable": {
      "p": "apps/web/src/components/transactions/TransactionsTable.tsx",
      "e": [
        "TransactionsTable"
      ],
      "i": [
        "next/link",
        "@/lib/api/transactions.types",
        "@/lib/api/categories",
        "@/components/ui/badge",
        "@/components/ui/card",
        "lucide-react",
        "./CategorySelector",
        "@/lib/utils"
      ],
      "l": 295,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "alert-dialog": {
      "p": "apps/web/src/components/ui/alert-dialog.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-alert-dialog",
        "@/lib/utils",
        "@/components/ui/button"
      ],
      "l": 142,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "avatar": {
      "p": "apps/web/src/components/ui/avatar.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-avatar",
        "@/lib/utils"
      ],
      "l": 51,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "badge": {
      "p": "apps/web/src/components/ui/badge.tsx",
      "e": [
        "BadgeProps"
      ],
      "i": [
        "react",
        "class-variance-authority",
        "@/lib/utils"
      ],
      "l": 40,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "breadcrumb": {
      "p": "apps/web/src/components/ui/breadcrumb.tsx",
      "e": [
        "Breadcrumb",
        "BreadcrumbItem",
        "BreadcrumbLink",
        "BreadcrumbPage",
        "BreadcrumbSeparator"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 76,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "button": {
      "p": "apps/web/src/components/ui/button.tsx",
      "e": [
        "ButtonProps"
      ],
      "i": [
        "react",
        "@radix-ui/react-slot",
        "class-variance-authority",
        "@/lib/utils"
      ],
      "l": 58,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "card": {
      "p": "apps/web/src/components/ui/card.tsx",
      "e": [],
      "i": [
        "react",
        "class-variance-authority",
        "@/lib/utils"
      ],
      "l": 93,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "checkbox": {
      "p": "apps/web/src/components/ui/checkbox.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-checkbox",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 31,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "circular-progress": {
      "p": "apps/web/src/components/ui/circular-progress.tsx",
      "e": [
        "CircularProgress"
      ],
      "i": [
        "@/lib/utils"
      ],
      "l": 118,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "collapsible": {
      "p": "apps/web/src/components/ui/collapsible.tsx",
      "e": [],
      "i": [
        "@radix-ui/react-collapsible"
      ],
      "l": 12,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "country-select": {
      "p": "apps/web/src/components/ui/country-select.tsx",
      "e": [
        "CountrySelect"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/components/ui/scroll-area",
        "@/lib/data/countries",
        "@/lib/utils"
      ],
      "l": 158,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "dialog": {
      "p": "apps/web/src/components/ui/dialog.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-dialog",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 123,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "dropdown-menu": {
      "p": "apps/web/src/components/ui/dropdown-menu.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-dropdown-menu",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 202,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "glow-card": {
      "p": "apps/web/src/components/ui/glow-card.tsx",
      "e": [],
      "i": [
        "react",
        "@/lib/utils",
        "./card",
        "class-variance-authority"
      ],
      "l": 80,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "hover-card": {
      "p": "apps/web/src/components/ui/hover-card.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-hover-card",
        "@/lib/utils"
      ],
      "l": 30,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "input": {
      "p": "apps/web/src/components/ui/input.tsx",
      "e": [],
      "i": [
        "react",
        "@/lib/utils"
      ],
      "l": 26,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "label": {
      "p": "apps/web/src/components/ui/label.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-label",
        "class-variance-authority",
        "@/lib/utils"
      ],
      "l": 27,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "scroll-area": {
      "p": "apps/web/src/components/ui/scroll-area.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-scroll-area",
        "@/lib/utils"
      ],
      "l": 49,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "select": {
      "p": "apps/web/src/components/ui/select.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-select",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 160,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "separator": {
      "p": "apps/web/src/components/ui/separator.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-separator",
        "@/lib/utils"
      ],
      "l": 32,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "sheet": {
      "p": "apps/web/src/components/ui/sheet.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-dialog",
        "class-variance-authority",
        "lucide-react",
        "@/lib/utils"
      ],
      "l": 141,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "skeleton": {
      "p": "apps/web/src/components/ui/skeleton.tsx",
      "e": [],
      "i": [
        "@/lib/utils"
      ],
      "l": 16,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "switch": {
      "p": "apps/web/src/components/ui/switch.tsx",
      "e": [],
      "i": [
        "react"
      ],
      "l": 44,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "table": {
      "p": "apps/web/src/components/ui/table.tsx",
      "e": [],
      "i": [
        "react",
        "@/lib/utils"
      ],
      "l": 133,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "textarea": {
      "p": "apps/web/src/components/ui/textarea.tsx",
      "e": [],
      "i": [
        "react",
        "@/lib/utils"
      ],
      "l": 25,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "theme-toggle": {
      "p": "apps/web/src/components/ui/theme-toggle.tsx",
      "e": [
        "ThemeToggle"
      ],
      "i": [
        "react",
        "next-themes",
        "@/lib/utils"
      ],
      "l": 85,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "tooltip": {
      "p": "apps/web/src/components/ui/tooltip.tsx",
      "e": [],
      "i": [
        "react",
        "@radix-ui/react-tooltip",
        "@/lib/utils"
      ],
      "l": 31,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "accounting": {
      "p": "apps/web/src/lib/api/accounting.ts",
      "e": [
        "GLAccountType",
        "NormalBalance",
        "GLAccount",
        "GLAccountBalance",
        "CreateGLAccountInput",
        "UpdateGLAccountInput",
        "ListGLAccountsParams",
        "JournalEntryStatus",
        "JournalLine",
        "JournalEntry"
      ],
      "i": [
        "./client"
      ],
      "l": 646,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "accounts": {
      "p": "apps/web/src/lib/api/accounts.ts",
      "e": [
        "AccountType",
        "AccountEntity",
        "GLAccountRef",
        "Account",
        "CreateAccountInput",
        "UpdateAccountInput",
        "ListAccountsParams",
        "ListAccountsResponse",
        "listAccounts",
        "getAccount"
      ],
      "i": [
        "./client"
      ],
      "l": 275,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "ai": {
      "p": "apps/web/src/lib/api/ai.ts",
      "e": [
        "AIMessageRole",
        "AIMessage",
        "AIChatOptions",
        "AIChatResponse",
        "CategorySuggestion",
        "InsightType",
        "InsightPriority",
        "InsightStatus",
        "AIInsight",
        "InsightListResponse"
      ],
      "i": [
        "./client"
      ],
      "l": 774,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "bills": {
      "p": "apps/web/src/lib/api/bills.ts",
      "e": [
        "BillLine",
        "Bill",
        "BillStats",
        "ListBillsParams",
        "ListBillsResponse",
        "CreateBillInput",
        "UpdateBillInput",
        "listBills",
        "getBill",
        "getBillStats"
      ],
      "i": [
        "./client"
      ],
      "l": 225,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "categories": {
      "p": "apps/web/src/lib/api/categories.ts",
      "e": [
        "Category",
        "ListCategoriesParams",
        "CreateCategoryInput",
        "UpdateCategoryInput",
        "listCategories",
        "getCategory",
        "createCategory",
        "updateCategory",
        "deleteCategory",
        "seedCategories"
      ],
      "i": [
        "./client"
      ],
      "l": 123,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "client-browser": {
      "p": "apps/web/src/lib/api/client-browser.ts",
      "e": [
        "apiFetch"
      ],
      "i": [],
      "l": 133,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "client": {
      "p": "apps/web/src/lib/api/client.ts",
      "e": [
        "apiClient"
      ],
      "i": [
        "@clerk/nextjs/server"
      ],
      "l": 61,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "clients": {
      "p": "apps/web/src/lib/api/clients.ts",
      "e": [
        "Client",
        "ListClientsParams",
        "ListClientsResponse",
        "CreateClientInput",
        "UpdateClientInput",
        "listClients",
        "getClient",
        "createClient",
        "updateClient",
        "deleteClient"
      ],
      "i": [
        "./client"
      ],
      "l": 130,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "dashboard-client": {
      "p": "apps/web/src/lib/api/dashboard-client.ts",
      "e": [
        "CashFlowProjectionPoint",
        "CashFlowProjectionData",
        "getCashFlowProjection",
        "UpcomingPayment",
        "UpcomingPaymentsData",
        "getUpcomingPayments",
        "ExpenseCategory",
        "ExpenseMonth",
        "ExpenseBreakdownData",
        "getExpenseBreakdown"
      ],
      "i": [
        "./client-browser",
        "@akount/types/financial",
        "./planning"
      ],
      "l": 332,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "dashboard": {
      "p": "apps/web/src/lib/api/dashboard.ts",
      "e": [
        "DashboardMetrics",
        "getDashboardMetrics",
        "getIntents",
        "NetWorthData",
        "getNetWorth",
        "CashFlowData",
        "getCashFlow",
        "UpcomingPayment",
        "getUpcomingPayments"
      ],
      "i": [
        "./client"
      ],
      "l": 199,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "entities": {
      "p": "apps/web/src/lib/api/entities.ts",
      "e": [
        "EntityType",
        "EntityStatus",
        "Entity",
        "EntityDetail",
        "EntitiesResponse",
        "CreateEntityInput",
        "UpdateEntityInput",
        "listEntities",
        "getEntityDetail",
        "createEntity"
      ],
      "i": [
        "./client"
      ],
      "l": 129,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "imports": {
      "p": "apps/web/src/lib/api/imports.ts",
      "e": [
        "ImportBatch",
        "ImportBatchDetail",
        "ListImportsParams",
        "ListImportsResponse",
        "listImports",
        "getImportBatch",
        "formatImportStatus"
      ],
      "i": [
        "./client"
      ],
      "l": 109,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "invoices": {
      "p": "apps/web/src/lib/api/invoices.ts",
      "e": [
        "InvoiceLine",
        "Invoice",
        "InvoiceStats",
        "ListInvoicesParams",
        "ListInvoicesResponse",
        "CreateInvoiceInput",
        "UpdateInvoiceInput",
        "listInvoices",
        "getInvoice",
        "getInvoiceStats"
      ],
      "i": [
        "./client"
      ],
      "l": 237,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "onboarding": {
      "p": "apps/web/src/lib/api/onboarding.ts",
      "e": [
        "OnboardingProgress",
        "UpdateProgressRequest",
        "SkipStepRequest",
        "useOnboardingProgress",
        "useUpdateProgress",
        "useSkipStep",
        "useDismissCard",
        "shouldShowOnboardingCard"
      ],
      "i": [
        "@tanstack/react-query",
        "sonner",
        "./client-browser"
      ],
      "l": 162,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "payments": {
      "p": "apps/web/src/lib/api/payments.ts",
      "e": [
        "PaymentMethod",
        "PaymentAllocation",
        "Payment",
        "ListPaymentsParams",
        "ListPaymentsResponse",
        "CreatePaymentInput",
        "AllocatePaymentInput",
        "listPayments",
        "getPayment",
        "recordPayment"
      ],
      "i": [
        "./client"
      ],
      "l": 181,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "performance": {
      "p": "apps/web/src/lib/api/performance.ts",
      "e": [
        "MetricDetail",
        "Receivables",
        "AccountsSummary",
        "PerformanceMetrics",
        "getPerformanceMetrics"
      ],
      "i": [
        "./client"
      ],
      "l": 55,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "planning": {
      "p": "apps/web/src/lib/api/planning.ts",
      "e": [
        "GoalType",
        "GoalStatus",
        "Goal",
        "ListGoalsParams",
        "ListGoalsResponse",
        "CreateGoalInput",
        "UpdateGoalInput",
        "BudgetPeriod",
        "Budget",
        "ListBudgetsParams"
      ],
      "i": [
        "./client"
      ],
      "l": 602,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "reconciliation": {
      "p": "apps/web/src/lib/api/reconciliation.ts",
      "e": [
        "getSuggestions",
        "createMatch",
        "unmatch",
        "getReconciliationStatus"
      ],
      "i": [
        "./client",
        "./reconciliation.types"
      ],
      "l": 55,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "reconciliation.types": {
      "p": "apps/web/src/lib/api/reconciliation.types.ts",
      "e": [
        "MatchSuggestion",
        "ReconciliationStatus",
        "TransactionMatch",
        "getConfidenceLevel",
        "formatConfidence"
      ],
      "i": [],
      "l": 87,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "reports-client": {
      "p": "apps/web/src/lib/api/reports-client.ts",
      "e": [
        "downloadReport"
      ],
      "i": [],
      "l": 60,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "reports-types": {
      "p": "apps/web/src/lib/api/reports-types.ts",
      "e": [],
      "i": [],
      "l": 9,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "reports": {
      "p": "apps/web/src/lib/api/reports.ts",
      "e": [
        "getProfitLossReport",
        "getBalanceSheetReport",
        "getCashFlowReport",
        "getTrialBalanceReport",
        "getGLLedgerReport",
        "getSpendingReport",
        "getRevenueReport"
      ],
      "i": [
        "./client"
      ],
      "l": 125,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "transactions": {
      "p": "apps/web/src/lib/api/transactions.ts",
      "e": [
        "listTransactions",
        "getTransaction",
        "createTransaction",
        "updateTransaction",
        "deleteTransaction",
        "bulkCategorizeTransactions",
        "bulkDeleteTransactions",
        "deduplicateTransactions",
        "getSpendingByCategory"
      ],
      "i": [
        "./client"
      ],
      "l": 170,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "transactions.types": {
      "p": "apps/web/src/lib/api/transactions.types.ts",
      "e": [
        "Transaction",
        "ListTransactionsParams",
        "ListTransactionsResponse",
        "CreateTransactionInput",
        "UpdateTransactionInput",
        "SpendingByCategoryResponse",
        "SpendingByCategoryParams",
        "formatAmount",
        "formatDate"
      ],
      "i": [],
      "l": 135,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "transfers": {
      "p": "apps/web/src/lib/api/transfers.ts",
      "e": [
        "Transfer",
        "CreateTransferInput",
        "ListTransfersParams",
        "TransferResult",
        "createTransfer",
        "listTransfers",
        "getTransfer"
      ],
      "i": [
        "./client"
      ],
      "l": 94,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "vendors": {
      "p": "apps/web/src/lib/api/vendors.ts",
      "e": [
        "Vendor",
        "ListVendorsParams",
        "ListVendorsResponse",
        "CreateVendorInput",
        "UpdateVendorInput",
        "listVendors",
        "getVendor",
        "createVendor",
        "updateVendor",
        "deleteVendor"
      ],
      "i": [
        "./client"
      ],
      "l": 131,
      "pt": "S",
      "v": [],
      "d": "cmp"
    },
    "browser": {
      "p": "apps/web/src/lib/browser.ts",
      "e": [
        "isBrowser",
        "prefersReducedMotion"
      ],
      "i": [],
      "l": 20,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "dashboard-personalization": {
      "p": "apps/web/src/lib/dashboard-personalization.ts",
      "e": [
        "DashboardConfig",
        "getDashboardConfig"
      ],
      "i": [],
      "l": 75,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "constants": {
      "p": "apps/web/src/lib/dashboard/constants.ts",
      "e": [
        "SparkColor",
        "TrendDirection",
        "TrendData",
        "StatCardData",
        "sparkColorMap",
        "trendColorMap",
        "glowColorMap",
        "colorMap"
      ],
      "i": [],
      "l": 69,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "transformers": {
      "p": "apps/web/src/lib/dashboard/transformers.ts",
      "e": [
        "formatTrend",
        "formatCurrencyValue",
        "convertSparkline",
        "buildQuickStats",
        "orderStats"
      ],
      "i": [
        "./constants"
      ],
      "l": 140,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "countries": {
      "p": "apps/web/src/lib/data/countries.ts",
      "e": [
        "CountryData",
        "COUNTRIES",
        "getCountryByCode",
        "getCurrencyForCountry",
        "getAllCurrencies"
      ],
      "i": [],
      "l": 245,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "entity-cookies": {
      "p": "apps/web/src/lib/entity-cookies.ts",
      "e": [
        "EntitySelection",
        "getEntitySelection",
        "validateEntityId"
      ],
      "i": [
        "next/headers"
      ],
      "l": 42,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "error-tracking": {
      "p": "apps/web/src/lib/error-tracking.ts",
      "e": [
        "ErrorContext",
        "reportError",
        "safeReportError"
      ],
      "i": [
        "@/lib/error-tracking"
      ],
      "l": 110,
      "pt": "C",
      "v": [],
      "d": "cmp"
    },
    "logger": {
      "p": "apps/web/src/lib/logger.ts",
      "e": [
        "logger"
      ],
      "i": [],
      "l": 53,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "navigation": {
      "p": "apps/web/src/lib/navigation.ts",
      "e": [
        "NavItem",
        "NavDomain",
        "navigationDomains",
        "getDomainTabs",
        "getNavigationForRole",
        "mainNavItems"
      ],
      "i": [
        "@akount/types"
      ],
      "l": 459,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "utils": {
      "p": "apps/web/src/lib/utils.ts",
      "e": [
        "cn"
      ],
      "i": [
        "clsx",
        "tailwind-merge"
      ],
      "l": 7,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "account-helpers": {
      "p": "apps/web/src/lib/utils/account-helpers.ts",
      "e": [
        "accountTypeIcons",
        "accountTypeLabels",
        "accountTypeColors",
        "CurrencyGroup",
        "groupAccountsByCurrency",
        "TransactionStats",
        "computeTransactionStats"
      ],
      "i": [
        "@/lib/api/accounts"
      ],
      "l": 107,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "currency": {
      "p": "apps/web/src/lib/utils/currency.ts",
      "e": [
        "formatCurrency",
        "formatCompactNumber",
        "formatCents",
        "parseCentsInput"
      ],
      "i": [],
      "l": 79,
      "pt": "",
      "v": [],
      "d": "cmp"
    },
    "date": {
      "p": "apps/web/src/lib/utils/date.ts",
      "e": [
        "formatDate",
        "formatDateTime",
        "formatDateSplit",
        "formatMonthYear"
      ],
      "i": [
        "@/lib/utils/date"
      ],
      "l": 84,
      "pt": "",
      "v": [],
      "d": "cmp"
    }
  },
  "d": {
    "acc": {
      "n": 1,
      "l": 169
    },
    "cmp": {
      "n": 163,
      "l": 24208
    },
    "ai": {
      "n": 1,
      "l": 130
    },
    "bnk": {
      "n": 18,
      "l": 2697
    }
  },
  "p": {
    "C": [
      "gl-account-combobox",
      "AccountFormSheet",
      "AddAccountModal",
      "TransactionsTableClient",
      "TransactionsToolbar",
      "job-progress",
      "AccountCardGrid",
      "AccountDetailHero",
      "AccountDetailsPanel",
      "AICategoryQueue",
      "BalanceHistoryChart",
      "BankingBalanceHero",
      "DailyCashFlowTimeline",
      "FlinksConnect",
      "GLAccountSelector",
      "SpendingBreakdown",
      "TransferForm",
      "BillDetailPanel",
      "BillForm",
      "BillsTable",
      "ClientDetailPanel",
      "ClientForm",
      "ClientsTable",
      "InvoiceDetailPanel",
      "InvoiceForm",
      "InvoiceTable",
      "InvoicingActions",
      "PaymentForm",
      "PaymentTable",
      "VendorDetailPanel",
      "VendorForm",
      "VendorsTable",
      "SimpleBarChart",
      "ActionItems",
      "AIActionWidget",
      "BudgetVsActualWidget",
      "CashFlowChart",
      "CircularProgress",
      "DashboardCharts",
      "DashboardFilters",
      "DashboardLeftRail",
      "EntitiesSection",
      "EntityFormSheet",
      "ExpenseChart",
      "ExpenseForecastWidget",
      "GoalProgressWidget",
      "LiquidityHero",
      "MiniSparkline",
      "NetWorthHero",
      "ProfitLossSummaryWidget",
      "SparkCards",
      "StatCard",
      "TopRevenueClientsWidget",
      "TrialBalanceStatusWidget",
      "UpcomingPayments",
      "EntityCard",
      "EntityDetailClient",
      "EntityHubClient",
      "BatchImportResults",
      "ColumnMappingEditor",
      "FileListEditor",
      "ImportConfirmation",
      "ImportHistoryClient",
      "ImportPreviewTable",
      "ImportUploadForm",
      "FileSelectionStep",
      "ResultsStep",
      "UploadProgressStep",
      "UploadProgressList",
      "Navbar",
      "SidebarProgressIndicator",
      "line-item-builder",
      "OnboardingHeroCard",
      "OnboardingOverlay",
      "ThemeProvider",
      "reconciliation-parts",
      "ReconciliationDashboard",
      "BulkActionToolbar",
      "DetailPanel",
      "DomainTabs",
      "KeyboardShortcutsModal",
      "BulkActionBar",
      "CategorySelector",
      "CreateTransactionForm",
      "TransactionsFilters",
      "TransactionsListClient",
      "TransactionsTable",
      "circular-progress",
      "country-select",
      "glow-card",
      "switch",
      "theme-toggle",
      "client-browser",
      "onboarding",
      "reports-client",
      "error-tracking"
    ],
    "S": [
      "accounting",
      "accounts",
      "bills",
      "clients",
      "invoices",
      "payments",
      "transactions.types",
      "vendors"
    ]
  },
  "v": {
    "L": [
      {
        "file": "job-progress",
        "path": "apps/web/src/components/ai/job-progress.tsx",
        "msg": "console.log in production",
        "fix": "Use request.log or server.log (pino structured logging)"
      }
    ]
  }
}
CODE-INDEX:END -->

---

## Quick Stats

**Files by domain:**
- acc: 1 files, 169 LOC
- cmp: 163 files, 24,208 LOC
- ai: 1 files, 130 LOC
- bnk: 18 files, 2,697 LOC

**Patterns found:**
- C: 96 files
- S: 8 files

**Violations found:**
- L: 1 occurrences

---

_Generated by: .claude/scripts/regenerate-code-index.js_
