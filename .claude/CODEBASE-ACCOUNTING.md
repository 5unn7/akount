# ACCOUNTING Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 107
**Estimated tokens:** ~9,524

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 107,
  "f": {
    "errors": {
      "p": "apps/api/src/domains/accounting/errors.ts",
      "e": [
        "AccountingErrorCode",
        "AccountingError",
        "handleAccountingError"
      ],
      "i": [],
      "l": 79,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "AccountingErrorCode": [
          "asset",
          "fiscal-period",
          "gl-account",
          "journal-entry",
          "report",
          "tax-rate",
          "asset.service",
          "coa-template",
          "document-posting.service",
          "fiscal-period.service",
          "gl-account.service",
          "journal-entry.service",
          "posting.service",
          "report.service",
          "tax-rate.service",
          "gl-resolve",
          "validate-ownership"
        ],
        "AccountingError": [
          "asset",
          "fiscal-period",
          "gl-account",
          "journal-entry",
          "report",
          "tax-rate",
          "asset.service",
          "coa-template",
          "document-posting.service",
          "fiscal-period.service",
          "gl-account.service",
          "journal-entry.service",
          "posting.service",
          "report.service",
          "tax-rate.service",
          "gl-resolve",
          "validate-ownership"
        ],
        "handleAccountingError": [
          "asset",
          "fiscal-period",
          "gl-account",
          "journal-entry",
          "report",
          "tax-rate",
          "asset.service",
          "coa-template",
          "document-posting.service",
          "fiscal-period.service",
          "gl-account.service",
          "journal-entry.service",
          "posting.service",
          "report.service",
          "tax-rate.service",
          "gl-resolve",
          "validate-ownership"
        ]
      }
    },
    "index": {
      "p": "apps/api/src/domains/accounting/routes/index.ts",
      "e": [
        "accountingRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "./gl-account",
        "./journal-entry",
        "./report",
        "./tax-rate",
        "./fiscal-period",
        "./asset"
      ],
      "l": 30,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "routes": {
      "p": "apps/api/src/domains/accounting/routes.ts",
      "e": [],
      "i": [],
      "l": 3,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "asset": {
      "p": "apps/api/src/domains/accounting/routes/asset.ts",
      "e": [
        "assetRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/asset.service",
        "../errors"
      ],
      "l": 214,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "assetRoutes": [
          "index",
          "assets-client",
          "assets-empty"
        ]
      }
    },
    "fiscal-period": {
      "p": "apps/api/src/domains/accounting/routes/fiscal-period.ts",
      "e": [
        "fiscalPeriodRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/fiscal-period.service",
        "../errors"
      ],
      "l": 168,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "fiscalPeriodRoutes": [
          "index"
        ]
      }
    },
    "gl-account": {
      "p": "apps/api/src/domains/accounting/routes/gl-account.ts",
      "e": [
        "glAccountRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/gl-account.service",
        "../services/coa-template",
        "../errors"
      ],
      "l": 198,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "glAccountRoutes": [
          "index",
          "gl-account.service",
          "chart-of-accounts-client"
        ]
      }
    },
    "journal-entry": {
      "p": "apps/api/src/domains/accounting/routes/journal-entry.ts",
      "e": [
        "journalEntryRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/journal-entry.service",
        "../services/posting.service",
        "../errors"
      ],
      "l": 305,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "journalEntryRoutes": [
          "index",
          "journal-entry.service",
          "journal-entries-client"
        ]
      }
    },
    "report": {
      "p": "apps/api/src/domains/accounting/routes/report.ts",
      "e": [
        "reportRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../../../middleware/rate-limit",
        "../services/report.service",
        "../services/report-export.service",
        "../errors",
        "../templates/profit-loss-pdf",
        "../templates/balance-sheet-pdf",
        "../templates/cash-flow-pdf"
      ],
      "l": 224,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "reportRoutes": [
          "index",
          "document-posting.service",
          "journal-entry.service",
          "report.service"
        ]
      }
    },
    "tax-rate": {
      "p": "apps/api/src/domains/accounting/routes/tax-rate.ts",
      "e": [
        "taxRateRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/tax-rate.service",
        "../errors"
      ],
      "l": 154,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "taxRateRoutes": [
          "index",
          "page",
          "tax-rates-client",
          "tax-rates-empty"
        ]
      }
    },
    "asset.schema": {
      "p": "apps/api/src/domains/accounting/schemas/asset.schema.ts",
      "e": [
        "AssetCategoryEnum",
        "DepreciationMethodEnum",
        "AssetStatusEnum",
        "AssetParamsSchema",
        "AssetParams",
        "CreateAssetSchema",
        "CreateAssetInput",
        "UpdateAssetSchema",
        "UpdateAssetInput",
        "ListAssetsSchema"
      ],
      "i": [
        "zod"
      ],
      "l": 111,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "fiscal-period.schema": {
      "p": "apps/api/src/domains/accounting/schemas/fiscal-period.schema.ts",
      "e": [
        "CalendarParamsSchema",
        "CalendarParams",
        "PeriodParamsSchema",
        "PeriodParams",
        "CreateCalendarSchema",
        "CreateCalendarInput",
        "ListCalendarsSchema",
        "ListCalendarsQuery",
        "LockPeriodSchema",
        "LockPeriodInput"
      ],
      "i": [
        "zod"
      ],
      "l": 51,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "gl-account.schema": {
      "p": "apps/api/src/domains/accounting/schemas/gl-account.schema.ts",
      "e": [
        "GLAccountParamsSchema",
        "GLAccountParams",
        "CreateGLAccountSchema",
        "CreateGLAccountInput",
        "UpdateGLAccountSchema",
        "UpdateGLAccountInput",
        "ListGLAccountsSchema",
        "ListGLAccountsQuery",
        "SeedCOASchema",
        "SeedCOAInput"
      ],
      "i": [
        "zod",
        "@akount/db"
      ],
      "l": 70,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "GLAccountParamsSchema": [
          "gl-account.service"
        ],
        "GLAccountParams": [
          "gl-account.service"
        ],
        "CreateGLAccountSchema": [
          "gl-account.service"
        ],
        "CreateGLAccountInput": [
          "gl-account.service"
        ],
        "UpdateGLAccountSchema": [
          "gl-account.service"
        ],
        "UpdateGLAccountInput": [
          "gl-account.service"
        ],
        "ListGLAccountsSchema": [
          "gl-account.service"
        ],
        "ListGLAccountsQuery": [
          "gl-account.service"
        ],
        "SeedCOASchema": [
          "gl-account.service"
        ],
        "SeedCOAInput": [
          "gl-account.service"
        ]
      }
    },
    "journal-entry.schema": {
      "p": "apps/api/src/domains/accounting/schemas/journal-entry.schema.ts",
      "e": [
        "JournalEntryParamsSchema",
        "JournalEntryParams",
        "JournalLineInputSchema",
        "JournalLineInput",
        "CreateJournalEntrySchema",
        "CreateJournalEntryInput",
        "ListJournalEntriesSchema",
        "ListJournalEntriesQuery",
        "PostTransactionSchema",
        "PostTransactionInput"
      ],
      "i": [
        "zod",
        "@akount/db"
      ],
      "l": 152,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "JournalEntryParamsSchema": [
          "journal-entry.service"
        ],
        "JournalEntryParams": [
          "journal-entry.service"
        ],
        "JournalLineInputSchema": [
          "journal-entry.service"
        ],
        "JournalLineInput": [
          "journal-entry.service"
        ],
        "CreateJournalEntrySchema": [
          "journal-entry.service"
        ],
        "CreateJournalEntryInput": [
          "journal-entry.service"
        ],
        "ListJournalEntriesSchema": [
          "journal-entry.service"
        ],
        "ListJournalEntriesQuery": [
          "journal-entry.service"
        ],
        "PostTransactionSchema": [
          "journal-entry.service"
        ],
        "PostTransactionInput": [
          "journal-entry.service"
        ]
      }
    },
    "report.schema": {
      "p": "apps/api/src/domains/accounting/schemas/report.schema.ts",
      "e": [
        "ProfitLossQuerySchema",
        "ProfitLossQuery",
        "BalanceSheetQuerySchema",
        "BalanceSheetQuery",
        "CashFlowQuerySchema",
        "CashFlowQuery",
        "TrialBalanceQuerySchema",
        "TrialBalanceQuery",
        "GLLedgerQuerySchema",
        "GLLedgerQuery"
      ],
      "i": [
        "zod"
      ],
      "l": 105,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/accounting/schemas/__tests__/report.schema.test.ts",
        "testCount": 17
      },
      "d": "acc",
      "c": {}
    },
    "tax-rate.schema": {
      "p": "apps/api/src/domains/accounting/schemas/tax-rate.schema.ts",
      "e": [
        "TaxRateParamsSchema",
        "TaxRateParams",
        "CreateTaxRateSchema",
        "CreateTaxRateInput",
        "UpdateTaxRateSchema",
        "UpdateTaxRateInput",
        "ListTaxRatesSchema",
        "ListTaxRatesQuery",
        "DeactivateTaxRateSchema",
        "DeactivateTaxRateInput"
      ],
      "i": [
        "zod"
      ],
      "l": 73,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "asset.service": {
      "p": "apps/api/src/domains/accounting/services/asset.service.ts",
      "e": [
        "AssetService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../utils/validate-ownership",
        "../../../lib/audit",
        "../utils/entry-number"
      ],
      "l": 615,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "AssetService": [
          "asset"
        ]
      }
    },
    "coa-template": {
      "p": "apps/api/src/domains/accounting/services/coa-template.ts",
      "e": [
        "seedDefaultCOA"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/audit"
      ],
      "l": 161,
      "pt": "TP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "seedDefaultCOA": [
          "gl-account"
        ]
      }
    },
    "document-posting.service": {
      "p": "apps/api/src/domains/accounting/services/document-posting.service.ts",
      "e": [
        "DocumentPostingService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/audit",
        "../../banking/services/fx-rate.service",
        "./report-cache",
        "../utils/entry-number",
        "../utils/gl-resolve"
      ],
      "l": 1059,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "fiscal-period.service": {
      "p": "apps/api/src/domains/accounting/services/fiscal-period.service.ts",
      "e": [
        "FiscalPeriodService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../utils/validate-ownership",
        "../../../lib/audit"
      ],
      "l": 348,
      "pt": "P",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "FiscalPeriodService": [
          "fiscal-period"
        ]
      }
    },
    "gl-account.service": {
      "p": "apps/api/src/domains/accounting/services/gl-account.service.ts",
      "e": [
        "GLAccountService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/audit",
        "../schemas/gl-account.schema"
      ],
      "l": 453,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "GLAccountService": [
          "gl-account"
        ]
      }
    },
    "journal-entry.service": {
      "p": "apps/api/src/domains/accounting/services/journal-entry.service.ts",
      "e": [
        "JournalEntryService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/audit",
        "./report-cache",
        "../utils/entry-number",
        "../schemas/journal-entry.schema"
      ],
      "l": 708,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "JournalEntryService": [
          "journal-entry"
        ]
      }
    },
    "posting.service": {
      "p": "apps/api/src/domains/accounting/services/posting.service.ts",
      "e": [
        "PostingService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/audit",
        "../utils/entry-number"
      ],
      "l": 833,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "PostingService": [
          "journal-entry"
        ]
      }
    },
    "report-cache": {
      "p": "apps/api/src/domains/accounting/services/report-cache.ts",
      "e": [
        "ReportCache",
        "reportCache"
      ],
      "i": [
        "../../../lib/env"
      ],
      "l": 157,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "ReportCache": [
          "document-posting.service",
          "journal-entry.service",
          "report.service"
        ],
        "reportCache": [
          "document-posting.service",
          "journal-entry.service",
          "report.service"
        ]
      }
    },
    "report-export.service": {
      "p": "apps/api/src/domains/accounting/services/report-export.service.ts",
      "e": [
        "ReportExportService",
        "reportExportService"
      ],
      "i": [
        "../../../lib/csv"
      ],
      "l": 265,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/accounting/services/__tests__/report-export.service.test.ts",
        "testCount": 46
      },
      "d": "acc",
      "c": {
        "ReportExportService": [
          "report"
        ],
        "reportExportService": [
          "report"
        ]
      }
    },
    "report.service": {
      "p": "apps/api/src/domains/accounting/services/report.service.ts",
      "e": [
        "ReportService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../../lib/tenant-scoped-query",
        "./report-cache"
      ],
      "l": 1234,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/accounting/services/__tests__/report.service.test.ts",
        "testCount": 38
      },
      "d": "acc",
      "c": {
        "ReportService": [
          "report"
        ]
      }
    },
    "tax-rate.service": {
      "p": "apps/api/src/domains/accounting/services/tax-rate.service.ts",
      "e": [
        "TaxRateService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../utils/validate-ownership",
        "../../../lib/audit"
      ],
      "l": 309,
      "pt": "P",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "TaxRateService": [
          "tax-rate"
        ]
      }
    },
    "shared-styles": {
      "p": "apps/api/src/domains/accounting/templates/shared-styles.ts",
      "e": [
        "reportStyles",
        "truncate",
        "formatCentsForPdf",
        "formatDateForPdf",
        "countLineItems",
        "PDF_MAX_ENTRIES",
        "PDF_TIMEOUT_MS"
      ],
      "i": [
        "@react-pdf/renderer"
      ],
      "l": 210,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "entry-number": {
      "p": "apps/api/src/domains/accounting/utils/entry-number.ts",
      "e": [
        "generateEntryNumber"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 39,
      "pt": "P",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "generateEntryNumber": [
          "asset.service",
          "document-posting.service",
          "journal-entry.service",
          "posting.service"
        ]
      }
    },
    "gl-resolve": {
      "p": "apps/api/src/domains/accounting/utils/gl-resolve.ts",
      "e": [
        "resolveGLAccountByCode"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../utils/gl-resolve"
      ],
      "l": 47,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "resolveGLAccountByCode": [
          "document-posting.service"
        ]
      }
    },
    "validate-ownership": {
      "p": "apps/api/src/domains/accounting/utils/validate-ownership.ts",
      "e": [
        "validateEntityOwnership",
        "validateGLAccountOwnership"
      ],
      "i": [
        "@akount/db",
        "../errors"
      ],
      "l": 47,
      "pt": "TP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "validateEntityOwnership": [
          "asset.service",
          "fiscal-period.service",
          "tax-rate.service"
        ],
        "validateGLAccountOwnership": [
          "asset.service",
          "fiscal-period.service",
          "tax-rate.service"
        ]
      }
    },
    "accounting-empty": {
      "p": "apps/web/src/app/(dashboard)/accounting/accounting-empty.tsx",
      "e": [
        "AccountingSetupCards"
      ],
      "i": [
        "@/components/ui/glow-card",
        "@/components/ui/button",
        "next/link"
      ],
      "l": 139,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "asset-sheet": {
      "p": "apps/web/src/app/(dashboard)/accounting/assets/asset-sheet.tsx",
      "e": [
        "AssetSheet"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "sonner",
        "./actions",
        "@/lib/api/accounting"
      ],
      "l": 295,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "AssetSheet": [
          "assets-client",
          "assets-empty"
        ]
      }
    },
    "assets-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/assets/assets-client.tsx",
      "e": [
        "AssetsClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/utils/currency",
        "@/lib/utils/date",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@/components/ui/input",
        "@/components/ui/label",
        "sonner",
        "./asset-sheet"
      ],
      "l": 678,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "assets-empty": {
      "p": "apps/web/src/app/(dashboard)/accounting/assets/assets-empty.tsx",
      "e": [
        "AssetsEmpty"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/components/ui/button",
        "next/link",
        "./asset-sheet"
      ],
      "l": 50,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "error": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/error.tsx",
      "e": [],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 53,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "loading": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/loading.tsx",
      "e": [],
      "i": [
        "@/components/ui/skeleton"
      ],
      "l": 59,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "page": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/page.tsx",
      "e": [
        "metadata"
      ],
      "i": [
        "next",
        "@/lib/api/accounting",
        "@/lib/api/entities",
        "@/lib/entity-cookies",
        "./tax-rates-client",
        "./tax-rates-empty"
      ],
      "l": 47,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "balance-equation": {
      "p": "apps/web/src/app/(dashboard)/accounting/balance-equation.tsx",
      "e": [
        "BalanceEquation"
      ],
      "i": [
        "@/lib/api/accounting",
        "@/lib/utils/currency"
      ],
      "l": 90,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "account-row": {
      "p": "apps/web/src/app/(dashboard)/accounting/chart-of-accounts/account-row.tsx",
      "e": [
        "AccountNode",
        "AccountGroup",
        "buildTree",
        "buildGroupedTree",
        "GroupHeaderRow",
        "AccountRow"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/lib/api/accounting",
        "@/lib/utils/currency",
        "@/components/ui/badge"
      ],
      "l": 343,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "AccountNode": [
          "chart-of-accounts-client"
        ],
        "AccountGroup": [
          "chart-of-accounts-client"
        ],
        "buildTree": [
          "chart-of-accounts-client"
        ],
        "buildGroupedTree": [
          "chart-of-accounts-client"
        ],
        "GroupHeaderRow": [
          "chart-of-accounts-client"
        ],
        "AccountRow": [
          "chart-of-accounts-client"
        ]
      }
    },
    "chart-of-accounts-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx",
      "e": [
        "ChartOfAccountsClient"
      ],
      "i": [
        "react",
        "@/lib/api/entities",
        "@/lib/utils/currency",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/input",
        "sonner",
        "./account-row",
        "./gl-account-sheet"
      ],
      "l": 461,
      "pt": "C",
      "v": [
        {
          "code": "A",
          "msg": ": any type annotation",
          "fix": "Use unknown + type guard or specific type"
        }
      ],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "gl-account-sheet": {
      "p": "apps/web/src/app/(dashboard)/accounting/chart-of-accounts/gl-account-sheet.tsx",
      "e": [
        "GLAccountSheet"
      ],
      "i": [
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label"
      ],
      "l": 197,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "GLAccountSheet": [
          "chart-of-accounts-client"
        ]
      }
    },
    "coa-snapshot": {
      "p": "apps/web/src/app/(dashboard)/accounting/coa-snapshot.tsx",
      "e": [
        "COASnapshot"
      ],
      "i": [
        "@/lib/api/accounting",
        "@/lib/utils/currency",
        "next/link",
        "lucide-react"
      ],
      "l": 104,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "fiscal-periods-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/fiscal-periods/fiscal-periods-client.tsx",
      "e": [
        "FiscalPeriodsClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/accounting",
        "@/lib/utils/date",
        "@/components/ui/button",
        "@/components/ui/badge",
        "sonner"
      ],
      "l": 319,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "fiscal-periods-empty": {
      "p": "apps/web/src/app/(dashboard)/accounting/fiscal-periods/fiscal-periods-empty.tsx",
      "e": [
        "FiscalPeriodsEmpty"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/components/ui/button",
        "lucide-react",
        "sonner",
        "next/link",
        "./actions"
      ],
      "l": 120,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "income-summary": {
      "p": "apps/web/src/app/(dashboard)/accounting/income-summary.tsx",
      "e": [
        "IncomeSummary"
      ],
      "i": [
        "@/lib/api/reports",
        "@/lib/utils/currency",
        "next/link",
        "lucide-react"
      ],
      "l": 110,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "journal-entry-detail-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/journal-entries/[id]/journal-entry-detail-client.tsx",
      "e": [
        "JournalEntryDetailClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "next/link",
        "@/lib/api/accounting",
        "@/lib/api/transactions.types",
        "@/components/ui/button",
        "@akount/ui/business",
        "sonner",
        "../actions"
      ],
      "l": 435,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "journal-entries-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entries-client.tsx",
      "e": [
        "JournalEntriesClient"
      ],
      "i": [
        "react",
        "next/link",
        "@/lib/api/transactions.types",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/input",
        "sonner",
        "./journal-entry-detail"
      ],
      "l": 417,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "journal-entry-detail": {
      "p": "apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entry-detail.tsx",
      "e": [
        "EntryDetail"
      ],
      "i": [
        "next/link",
        "lucide-react",
        "@/lib/api/accounting",
        "@/lib/api/transactions.types",
        "@/components/ui/button",
        "@akount/ui/business"
      ],
      "l": 243,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "EntryDetail": [
          "journal-entries-client"
        ]
      }
    },
    "journal-entry-form": {
      "p": "apps/web/src/app/(dashboard)/accounting/journal-entries/journal-entry-form.tsx",
      "e": [
        "JournalEntryInitialData",
        "JournalEntryForm"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/lib/api/accounting",
        "@/lib/api/transactions.types",
        "sonner",
        "./actions",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/input"
      ],
      "l": 364,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "layout": {
      "p": "apps/web/src/app/(dashboard)/accounting/layout.tsx",
      "e": [],
      "i": [],
      "l": 10,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "recent-entries": {
      "p": "apps/web/src/app/(dashboard)/accounting/recent-entries.tsx",
      "e": [
        "RecentEntries"
      ],
      "i": [
        "@/lib/api/accounting",
        "@/lib/utils/date",
        "@/lib/utils/currency",
        "next/link",
        "@akount/ui/business",
        "lucide-react"
      ],
      "l": 90,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "bs-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/balance-sheet/bs-report-view.tsx",
      "e": [
        "BSReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/checkbox",
        "@akount/ui/business",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 310,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "cf-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/cash-flow/cf-report-view.tsx",
      "e": [
        "CFReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 271,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "gl-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/general-ledger/gl-report-view.tsx",
      "e": [
        "GLReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@akount/ui/business",
        "@/lib/utils/currency",
        "./actions"
      ],
      "l": 252,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "pl-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/profit-loss/pl-report-view.tsx",
      "e": [
        "PLReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/checkbox",
        "@akount/ui/business",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 267,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "revenue-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/revenue/revenue-report-view.tsx",
      "e": [
        "RevenueReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 180,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "spending-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/spending/spending-report-view.tsx",
      "e": [
        "SpendingReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/select",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 290,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "tb-report-view": {
      "p": "apps/web/src/app/(dashboard)/accounting/reports/trial-balance/tb-report-view.tsx",
      "e": [
        "TBReportView"
      ],
      "i": [
        "react",
        "next/navigation",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@akount/ui/business",
        "@/lib/api/reports-client",
        "@/lib/utils/currency"
      ],
      "l": 190,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {}
    },
    "tax-rate-sheet": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rate-sheet.tsx",
      "e": [
        "TaxRateSheet"
      ],
      "i": [
        "react",
        "@/lib/api/accounting",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/switch"
      ],
      "l": 267,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "TaxRateSheet": [
          "tax-rates-client",
          "tax-rates-empty"
        ]
      }
    },
    "tax-rates-client": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-client.tsx",
      "e": [
        "TaxRatesClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/accounting",
        "@/lib/utils/date",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@/components/ui/input",
        "sonner",
        "./tax-rate-sheet"
      ],
      "l": 335,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "TaxRatesClient": [
          "page"
        ]
      }
    },
    "tax-rates-empty": {
      "p": "apps/web/src/app/(dashboard)/accounting/tax-rates/tax-rates-empty.tsx",
      "e": [
        "TaxRatesEmpty"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/components/ui/button",
        "@/components/ui/badge",
        "lucide-react",
        "sonner",
        "next/link",
        "./actions",
        "./tax-rate-sheet",
        "@/lib/api/accounting"
      ],
      "l": 336,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "acc",
      "c": {
        "TaxRatesEmpty": [
          "page"
        ]
      }
    }
  },
  "d": {
    "acc": {
      "n": 107,
      "l": 18763
    }
  },
  "p": {
    "L": [
      "asset",
      "journal-entry",
      "tax-rate"
    ],
    "S": [
      "asset.service",
      "document-posting.service",
      "gl-account.service",
      "journal-entry.service",
      "posting.service",
      "report.service"
    ],
    "P": [
      "asset.service",
      "coa-template",
      "document-posting.service",
      "fiscal-period.service",
      "gl-account.service",
      "journal-entry.service",
      "posting.service",
      "report.service",
      "tax-rate.service",
      "entry-number",
      "validate-ownership"
    ],
    "T": [
      "coa-template",
      "gl-account.service",
      "journal-entry.service",
      "report.service",
      "validate-ownership"
    ],
    "C": [
      "accounting-empty",
      "asset-sheet",
      "assets-client",
      "assets-empty",
      "error",
      "account-row",
      "chart-of-accounts-client",
      "gl-account-sheet",
      "fiscal-periods-client",
      "fiscal-periods-empty",
      "journal-entry-detail-client",
      "journal-entries-client",
      "journal-entry-detail",
      "journal-entry-form",
      "bs-report-view",
      "cf-report-view",
      "gl-report-view",
      "pl-report-view",
      "revenue-report-view",
      "spending-report-view",
      "tb-report-view",
      "tax-rate-sheet",
      "tax-rates-client",
      "tax-rates-empty"
    ]
  },
  "v": {
    "A": [
      {
        "file": "chart-of-accounts-client",
        "path": "apps/web/src/app/(dashboard)/accounting/chart-of-accounts/chart-of-accounts-client.tsx",
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
- acc: 107 files, 18,763 LOC

**Patterns found:**
- L: 3 files
- S: 6 files
- P: 11 files
- T: 5 files
- C: 24 files

**Violations found:**
- A: 1 occurrences

---

_Generated by: .claude/scripts/regenerate-code-index.js_
