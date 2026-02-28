# PACKAGES Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 70
**Estimated tokens:** ~4,526

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 70,
  "f": {
    "index": {
      "p": "packages/ui/src/primitives/index.ts",
      "e": [],
      "i": [
        "@akount/ui/primitives"
      ],
      "l": 16,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "seed": {
      "p": "packages/db/prisma/seed.ts",
      "e": [],
      "i": [
        "@prisma/client"
      ],
      "l": 468,
      "pt": "P",
      "v": [],
      "d": "pkg"
    },
    "link-dev-user": {
      "p": "packages/db/scripts/link-dev-user.ts",
      "e": [],
      "i": [
        "@prisma/client"
      ],
      "l": 82,
      "pt": "P",
      "v": [],
      "d": "pkg"
    },
    "tailwind-preset": {
      "p": "packages/design-tokens/src/tailwind-preset.ts",
      "e": [
        "akountPreset"
      ],
      "i": [
        "tailwindcss"
      ],
      "l": 121,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "ai": {
      "p": "packages/types/src/ai.ts",
      "e": [
        "AIMessageRole",
        "AIMessage",
        "AIChatOptions",
        "AIChatResponse",
        "AIProvider"
      ],
      "i": [],
      "l": 36,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "currency": {
      "p": "packages/types/src/financial/currency.ts",
      "e": [
        "CURRENCIES",
        "Currency",
        "CurrencyInfo",
        "CURRENCY_INFO",
        "isCurrency",
        "getCurrencyInfo",
        "DEFAULT_CURRENCY"
      ],
      "i": [],
      "l": 106,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "format": {
      "p": "packages/types/src/financial/format.ts",
      "e": [
        "formatCents",
        "formatCentsWithSign",
        "formatCentsCompact",
        "formatCentsAccounting",
        "formatCentsPlain",
        "parseCents"
      ],
      "i": [
        "./money",
        "./currency"
      ],
      "l": 136,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "money": {
      "p": "packages/types/src/financial/money.ts",
      "e": [
        "Cents",
        "cents",
        "ZERO_CENTS",
        "addCents",
        "subtractCents",
        "multiplyCents",
        "divideCents",
        "dollarsToCents",
        "centsToDollars",
        "absCents"
      ],
      "i": [],
      "l": 125,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "reports": {
      "p": "packages/types/src/financial/reports.ts",
      "e": [
        "ReportLineItem",
        "ProfitLossQuery",
        "ProfitLossReport",
        "BalanceSheetQuery",
        "BalanceSheetReport",
        "CashFlowQuery",
        "CashFlowReport",
        "TrialBalanceQuery",
        "TrialBalanceAccount",
        "TrialBalanceReport"
      ],
      "i": [],
      "l": 273,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "jurisdiction": {
      "p": "packages/types/src/jurisdiction.ts",
      "e": [
        "EntityTypeConfig",
        "TaxIdFormat",
        "JurisdictionConfig"
      ],
      "i": [],
      "l": 51,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "permissions": {
      "p": "packages/types/src/rbac/permissions.ts",
      "e": [
        "PERMISSION_LEVELS",
        "PermissionLevel",
        "PERMISSION_HIERARCHY",
        "hasPermission",
        "PermissionKey",
        "PermissionEntry",
        "PERMISSION_MATRIX",
        "getPermission",
        "canAccess",
        "getRolePermissions"
      ],
      "i": [
        "./roles"
      ],
      "l": 415,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "roles": {
      "p": "packages/types/src/rbac/roles.ts",
      "e": [
        "ROLES",
        "Role",
        "RoleInfo",
        "ROLE_INFO",
        "isRole",
        "getRoleInfo",
        "ADMIN_ROLES",
        "ACCOUNTING_ROLES",
        "TRANSACTING_ROLES",
        "VIEWER_ROLES"
      ],
      "i": [],
      "l": 117,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "setup": {
      "p": "packages/ui/src/test/setup.ts",
      "e": [],
      "i": [
        "@testing-library/react",
        "vitest"
      ],
      "l": 8,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "utils": {
      "p": "packages/ui/src/utils.ts",
      "e": [
        "cn"
      ],
      "i": [
        "clsx",
        "tailwind-merge"
      ],
      "l": 15,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "vitest.config": {
      "p": "packages/ui/vitest.config.ts",
      "e": [],
      "i": [
        "vitest/config",
        "@vitejs/plugin-react"
      ],
      "l": 13,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "AIBadge": {
      "p": "packages/ui/src/ai/AIBadge.tsx",
      "e": [
        "AIBadgeProps",
        "AIBadge",
        "isAICreated"
      ],
      "i": [
        "../primitives/Badge",
        "lucide-react"
      ],
      "l": 91,
      "pt": "",
      "v": [],
      "d": "ai"
    },
    "AIPanel": {
      "p": "packages/ui/src/ai/AIPanel.tsx",
      "e": [
        "Insight",
        "AIPanelProps",
        "AIPanel"
      ],
      "i": [
        "react",
        "../utils",
        "./InsightCard"
      ],
      "l": 197,
      "pt": "C",
      "v": [],
      "d": "ai"
    },
    "ConfidenceBadge": {
      "p": "packages/ui/src/ai/ConfidenceBadge.tsx",
      "e": [
        "ConfidenceBadgeProps",
        "ConfidenceBadge"
      ],
      "i": [
        "../utils"
      ],
      "l": 112,
      "pt": "",
      "v": [],
      "d": "ai"
    },
    "CriticalAlert": {
      "p": "packages/ui/src/ai/CriticalAlert.tsx",
      "e": [
        "CriticalAlertProps",
        "CriticalAlert"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 120,
      "pt": "",
      "v": [],
      "d": "ai"
    },
    "FeedbackComponent": {
      "p": "packages/ui/src/ai/FeedbackComponent.tsx",
      "e": [
        "FeedbackComponentProps",
        "FeedbackComponent",
        "AILearningIndicatorProps",
        "AILearningIndicator"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 217,
      "pt": "C",
      "v": [],
      "d": "ai"
    },
    "InsightCard": {
      "p": "packages/ui/src/ai/InsightCard.tsx",
      "e": [
        "InsightType",
        "InsightCardProps",
        "InsightCard"
      ],
      "i": [
        "react",
        "../utils",
        "./ConfidenceBadge"
      ],
      "l": 239,
      "pt": "C",
      "v": [],
      "d": "ai"
    },
    "SuggestionChip": {
      "p": "packages/ui/src/ai/SuggestionChip.tsx",
      "e": [
        "SuggestionChipProps",
        "SuggestionChip",
        "InlineSuggestionProps",
        "InlineSuggestion"
      ],
      "i": [
        "../utils",
        "./ConfidenceBadge"
      ],
      "l": 192,
      "pt": "C",
      "v": [],
      "d": "ai"
    },
    "AccountStatusBadge": {
      "p": "packages/ui/src/business/AccountStatusBadge.tsx",
      "e": [
        "AccountStatusBadge"
      ],
      "i": [
        "../primitives/Badge"
      ],
      "l": 21,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "AIActionStatusBadge": {
      "p": "packages/ui/src/business/AIActionStatusBadge.tsx",
      "e": [
        "AIActionStatusBadge"
      ],
      "i": [
        "../primitives/Badge"
      ],
      "l": 26,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "BillStatusBadge": {
      "p": "packages/ui/src/business/BillStatusBadge.tsx",
      "e": [
        "BillStatusBadge"
      ],
      "i": [
        "../primitives/Badge",
        "@akount/db"
      ],
      "l": 32,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "ClientStatusBadge": {
      "p": "packages/ui/src/business/ClientStatusBadge.tsx",
      "e": [
        "ClientStatusBadge"
      ],
      "i": [
        "../primitives/Badge"
      ],
      "l": 21,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "EntitySelector": {
      "p": "packages/ui/src/business/EntitySelector.tsx",
      "e": [
        "EntitySelector"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 93,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "InvoiceStatusBadge": {
      "p": "packages/ui/src/business/InvoiceStatusBadge.tsx",
      "e": [
        "InvoiceStatusBadge"
      ],
      "i": [
        "../primitives/Badge",
        "@akount/db"
      ],
      "l": 28,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "JournalEntryStatusBadge": {
      "p": "packages/ui/src/business/JournalEntryStatusBadge.tsx",
      "e": [
        "JournalEntryStatusBadge"
      ],
      "i": [
        "../primitives/Badge"
      ],
      "l": 23,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "VendorStatusBadge": {
      "p": "packages/ui/src/business/VendorStatusBadge.tsx",
      "e": [
        "VendorStatusBadge"
      ],
      "i": [
        "../primitives/Badge"
      ],
      "l": 21,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Card": {
      "p": "packages/ui/src/data-display/Card.tsx",
      "e": [
        "CardVariant",
        "CardProps",
        "Card",
        "CardHeaderProps",
        "CardHeader"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 174,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "DataTable": {
      "p": "packages/ui/src/data-display/DataTable.tsx",
      "e": [
        "Column",
        "DataTableProps",
        "DataTable"
      ],
      "i": [
        "../utils"
      ],
      "l": 268,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "LoadingState": {
      "p": "packages/ui/src/data-display/LoadingState.tsx",
      "e": [
        "SkeletonProps",
        "Skeleton",
        "SpinnerProps",
        "Spinner",
        "LoadingOverlayProps",
        "LoadingOverlay",
        "SkeletonTableProps",
        "SkeletonTable",
        "SkeletonCardProps",
        "SkeletonCard"
      ],
      "i": [
        "../utils"
      ],
      "l": 238,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Alert": {
      "p": "packages/ui/src/feedback/Alert.tsx",
      "e": [
        "AlertVariant",
        "AlertProps",
        "Alert"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 138,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "ConfirmDialog": {
      "p": "packages/ui/src/feedback/ConfirmDialog.tsx",
      "e": [
        "ConfirmDialogProps",
        "ConfirmDialog"
      ],
      "i": [
        "react",
        "./Modal",
        "../utils"
      ],
      "l": 148,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "Modal": {
      "p": "packages/ui/src/feedback/Modal.tsx",
      "e": [
        "ModalProps",
        "Modal"
      ],
      "i": [
        "../utils"
      ],
      "l": 229,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "Progress": {
      "p": "packages/ui/src/feedback/Progress.tsx",
      "e": [
        "ProgressBarProps",
        "ProgressBar",
        "ProgressCircleProps",
        "ProgressCircle",
        "IndeterminateProgressProps",
        "IndeterminateProgress"
      ],
      "i": [
        "../utils"
      ],
      "l": 242,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Toast": {
      "p": "packages/ui/src/feedback/Toast.tsx",
      "e": [
        "ToastVariant",
        "ToastProps",
        "Toast",
        "ToastContainerProps",
        "ToastContainer"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 230,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "AccountCard": {
      "p": "packages/ui/src/financial/AccountCard.tsx",
      "e": [
        "AccountType",
        "AccountCardProps",
        "AccountCard"
      ],
      "i": [
        "../utils"
      ],
      "l": 222,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "BudgetCard": {
      "p": "packages/ui/src/financial/BudgetCard.tsx",
      "e": [
        "BudgetCardProps",
        "BudgetCard"
      ],
      "i": [
        "../utils"
      ],
      "l": 162,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "EntityBadge": {
      "p": "packages/ui/src/financial/EntityBadge.tsx",
      "e": [
        "EntityType",
        "EntityBadgeProps",
        "EntityBadge"
      ],
      "i": [
        "@akount/types",
        "../utils"
      ],
      "l": 107,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "GLAccountSelector": {
      "p": "packages/ui/src/financial/GLAccountSelector.tsx",
      "e": [
        "AccountClass",
        "GLAccount",
        "GLAccountSelectorProps",
        "GLAccountSelector"
      ],
      "i": [
        "../utils"
      ],
      "l": 484,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "JournalEntryPreview": {
      "p": "packages/ui/src/financial/JournalEntryPreview.tsx",
      "e": [
        "JournalLine",
        "FiscalPeriod",
        "JournalEntryEntity",
        "JournalEntryUser",
        "JournalEntryPreviewProps",
        "JournalEntryPreview"
      ],
      "i": [
        "../utils"
      ],
      "l": 300,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "KPICard": {
      "p": "packages/ui/src/financial/KPICard.tsx",
      "e": [
        "KPICardProps",
        "KPICard"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 184,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "MoneyAmount": {
      "p": "packages/ui/src/financial/MoneyAmount.tsx",
      "e": [
        "MoneyAmountProps",
        "MoneyAmount"
      ],
      "i": [
        "@akount/types",
        "../utils"
      ],
      "l": 79,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "MoneyInput": {
      "p": "packages/ui/src/financial/MoneyInput.tsx",
      "e": [
        "MoneyInputProps",
        "MoneyInput"
      ],
      "i": [
        "react",
        "@akount/types",
        "../utils"
      ],
      "l": 151,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "TransactionRow": {
      "p": "packages/ui/src/financial/TransactionRow.tsx",
      "e": [
        "TransactionStatus",
        "TransactionEntity",
        "TransactionAccount",
        "TransactionCategory",
        "Transaction",
        "TransactionRowProps",
        "TransactionRow",
        "TransactionTableHeader"
      ],
      "i": [
        "../utils",
        "react"
      ],
      "l": 301,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "EmptyState": {
      "p": "packages/ui/src/patterns/EmptyState.tsx",
      "e": [
        "EmptyStateProps",
        "EmptyState"
      ],
      "i": [
        "react",
        "lucide-react",
        "../utils"
      ],
      "l": 166,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Sidebar": {
      "p": "packages/ui/src/patterns/navigation/Sidebar.tsx",
      "e": [
        "SidebarProps",
        "Sidebar"
      ],
      "i": [
        "@akount/types",
        "../../utils"
      ],
      "l": 294,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "TopCommandBar": {
      "p": "packages/ui/src/patterns/navigation/TopCommandBar.tsx",
      "e": [
        "TopCommandBarProps",
        "TopCommandBar"
      ],
      "i": [
        "react",
        "@akount/types",
        "../../utils"
      ],
      "l": 282,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "Badge": {
      "p": "packages/ui/src/primitives/Badge.tsx",
      "e": [
        "BadgeVariant",
        "BadgeProps",
        "Badge"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 97,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Button": {
      "p": "packages/ui/src/primitives/Button.tsx",
      "e": [
        "ButtonVariant",
        "ButtonSize",
        "ButtonProps",
        "Button"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 149,
      "pt": "",
      "v": [],
      "d": "pkg"
    },
    "Chip": {
      "p": "packages/ui/src/primitives/Chip.tsx",
      "e": [
        "ChipVariant",
        "ChipProps",
        "Chip"
      ],
      "i": [
        "react",
        "../utils"
      ],
      "l": 151,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "Input": {
      "p": "packages/ui/src/primitives/Input.tsx",
      "e": [
        "InputProps",
        "Input"
      ],
      "i": [
        "../utils"
      ],
      "l": 184,
      "pt": "C",
      "v": [],
      "d": "pkg"
    },
    "Select": {
      "p": "packages/ui/src/primitives/Select.tsx",
      "e": [
        "SelectOption",
        "SelectProps",
        "Select"
      ],
      "i": [
        "../utils"
      ],
      "l": 442,
      "pt": "C",
      "v": [],
      "d": "pkg"
    }
  },
  "d": {
    "pkg": {
      "n": 62,
      "l": 8495
    },
    "ai": {
      "n": 8,
      "l": 1185
    }
  },
  "p": {
    "T": [
      "index"
    ],
    "P": [
      "index",
      "seed",
      "link-dev-user"
    ],
    "C": [
      "AIPanel",
      "FeedbackComponent",
      "InsightCard",
      "SuggestionChip",
      "EntitySelector",
      "DataTable",
      "ConfirmDialog",
      "Modal",
      "Toast",
      "AccountCard",
      "GLAccountSelector",
      "MoneyInput",
      "TransactionRow",
      "Sidebar",
      "TopCommandBar",
      "Chip",
      "Input",
      "Select"
    ]
  },
  "v": {
    "L": [
      {
        "file": "index",
        "path": "packages/db/index.ts",
        "msg": "console.log in production",
        "fix": "Use request.log or server.log (pino structured logging)"
      },
      {
        "file": "index",
        "path": "packages/types/src/financial/index.ts",
        "msg": "console.log in production",
        "fix": "Use request.log or server.log (pino structured logging)"
      },
      {
        "file": "index",
        "path": "packages/types/src/rbac/index.ts",
        "msg": "console.log in production",
        "fix": "Use request.log or server.log (pino structured logging)"
      }
    ],
    "A": [
      {
        "file": "index",
        "path": "packages/db/index.ts",
        "msg": ": any type annotation",
        "fix": "Use unknown + type guard or specific type"
      }
    ]
  }
}
CODE-INDEX:END -->

---

## Quick Stats

**Files by domain:**
- pkg: 62 files, 8,495 LOC
- ai: 8 files, 1,185 LOC

**Patterns found:**
- T: 1 files
- P: 3 files
- C: 18 files

**Violations found:**
- L: 3 occurrences
- A: 1 occurrences

---

_Generated by: .claude/scripts/regenerate-code-index.js_
