# BANKING Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 57
**Estimated tokens:** ~3,733

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 57,
  "f": {
    "index": {
      "p": "apps/api/src/domains/banking/index.ts",
      "e": [],
      "i": [],
      "l": 10,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "routes": {
      "p": "apps/api/src/domains/banking/routes.ts",
      "e": [
        "bankingRoutes"
      ],
      "i": [
        "fastify",
        "zod",
        "./services/account.service",
        "../../middleware/auth",
        "../../middleware/tenant",
        "../../middleware/validation",
        "../../middleware/withPermission",
        "../accounting/errors",
        "./routes/imports",
        "./routes/transactions"
      ],
      "l": 407,
      "pt": "L",
      "v": [],
      "d": "bnk"
    },
    "categories": {
      "p": "apps/api/src/domains/banking/routes/categories.ts",
      "e": [
        "categoryRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../services/category.service"
      ],
      "l": 214,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "connections": {
      "p": "apps/api/src/domains/banking/routes/connections.ts",
      "e": [
        "connectionRoutes"
      ],
      "i": [
        "fastify",
        "zod",
        "../services/flinks.service",
        "../../../middleware/validation",
        "../../../middleware/withPermission",
        "../../../middleware/rate-limit"
      ],
      "l": 174,
      "pt": "L",
      "v": [],
      "d": "bnk"
    },
    "imports": {
      "p": "apps/api/src/domains/banking/routes/imports.ts",
      "e": [
        "importsRoutes"
      ],
      "i": [
        "fastify",
        "../services/import.service",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../lib/file-scanner",
        "../../../lib/audit",
        "../../../lib/upload-quota",
        "zod"
      ],
      "l": 597,
      "pt": "L",
      "v": [],
      "d": "bnk"
    },
    "reconciliation": {
      "p": "apps/api/src/domains/banking/routes/reconciliation.ts",
      "e": [
        "reconciliationRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../services/reconciliation.service"
      ],
      "l": 164,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "transactions": {
      "p": "apps/api/src/domains/banking/routes/transactions.ts",
      "e": [
        "transactionRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "@akount/db",
        "../services/transaction.service",
        "../services/duplication.service",
        "../../../middleware/rate-limit",
        "../../accounting/services/report-cache"
      ],
      "l": 339,
      "pt": "SP",
      "v": [],
      "d": "bnk"
    },
    "transfers": {
      "p": "apps/api/src/domains/banking/routes/transfers.ts",
      "e": [
        "transferRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../../accounting/errors",
        "../services/transfer.service"
      ],
      "l": 115,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "category.schema": {
      "p": "apps/api/src/domains/banking/schemas/category.schema.ts",
      "e": [
        "CreateCategorySchema",
        "UpdateCategorySchema",
        "ListCategoriesQuerySchema",
        "CategoryIdParamSchema",
        "CreateCategoryInput",
        "UpdateCategoryInput",
        "ListCategoriesQuery",
        "CategoryIdParam"
      ],
      "i": [
        "zod"
      ],
      "l": 31,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "reconciliation.schema": {
      "p": "apps/api/src/domains/banking/schemas/reconciliation.schema.ts",
      "e": [
        "SuggestMatchesParamsSchema",
        "SuggestMatchesParams",
        "SuggestMatchesQuerySchema",
        "SuggestMatchesQuery",
        "CreateMatchSchema",
        "CreateMatchInput",
        "MatchIdParamSchema",
        "MatchIdParam",
        "ReconciliationStatusParamsSchema",
        "ReconciliationStatusParams"
      ],
      "i": [
        "zod"
      ],
      "l": 49,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "transaction.schema": {
      "p": "apps/api/src/domains/banking/schemas/transaction.schema.ts",
      "e": [
        "CreateTransactionSchema",
        "CreateTransactionInput",
        "UpdateTransactionSchema",
        "UpdateTransactionInput",
        "ListTransactionsQuerySchema",
        "ListTransactionsQuery",
        "TransactionIdParamSchema",
        "TransactionIdParam",
        "BulkCategorizeSchema",
        "BulkCategorizeInput"
      ],
      "i": [
        "zod"
      ],
      "l": 126,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "transfer.schema": {
      "p": "apps/api/src/domains/banking/schemas/transfer.schema.ts",
      "e": [
        "CreateTransferSchema",
        "CreateTransferInput",
        "ListTransfersQuerySchema",
        "ListTransfersQuery",
        "TransferIdParamSchema",
        "TransferIdParam"
      ],
      "i": [
        "zod"
      ],
      "l": 69,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "account-matcher.service": {
      "p": "apps/api/src/domains/banking/services/account-matcher.service.ts",
      "e": [
        "ExternalAccountData",
        "AccountMatchResult",
        "matchAccountToBankConnection",
        "findDuplicateAccounts"
      ],
      "i": [
        "@akount/db",
        "@prisma/client",
        "./parser.service"
      ],
      "l": 159,
      "pt": "P",
      "v": [],
      "d": "bnk"
    },
    "account.service": {
      "p": "apps/api/src/domains/banking/services/account.service.ts",
      "e": [
        "getDefaultGLAccountForType",
        "ListAccountsParams",
        "PaginatedAccounts",
        "AccountService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 375,
      "pt": "SP",
      "v": [],
      "d": "bnk"
    },
    "category.service": {
      "p": "apps/api/src/domains/banking/services/category.service.ts",
      "e": [
        "CreateCategoryInput",
        "UpdateCategoryInput",
        "ListCategoriesParams",
        "CategoryService"
      ],
      "i": [
        "@akount/db",
        "@prisma/client",
        "../../../lib/audit"
      ],
      "l": 456,
      "pt": "TSP",
      "v": [],
      "d": "bnk"
    },
    "duplication.service": {
      "p": "apps/api/src/domains/banking/services/duplication.service.ts",
      "e": [
        "DuplicateResult",
        "findDuplicates",
        "deduplicateExistingTransactions",
        "findInternalDuplicates"
      ],
      "i": [
        "@akount/db",
        "string-similarity",
        "../../../schemas/import"
      ],
      "l": 323,
      "pt": "SP",
      "v": [],
      "d": "bnk"
    },
    "flinks.service": {
      "p": "apps/api/src/domains/banking/services/flinks.service.ts",
      "e": [
        "toCents",
        "mapFlinksAccountType",
        "scrubPII",
        "TenantContext",
        "FlinksService",
        "FlinksError"
      ],
      "i": [
        "../../../lib/env",
        "../../../lib/logger",
        "../../../lib/audit",
        "./account.service"
      ],
      "l": 570,
      "pt": "TSP",
      "v": [],
      "d": "bnk"
    },
    "fx-rate.service": {
      "p": "apps/api/src/domains/banking/services/fx-rate.service.ts",
      "e": [
        "FxRateService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/logger"
      ],
      "l": 176,
      "pt": "P",
      "v": [],
      "d": "bnk"
    },
    "import.service": {
      "p": "apps/api/src/domains/banking/services/import.service.ts",
      "e": [
        "CreateCSVImportParams",
        "CreatePDFImportParams",
        "CreateXLSXImportParams",
        "ImportBatchWithStats",
        "ImportBatchWithTransactions",
        "ListImportBatchesParams",
        "PaginatedImportBatches",
        "ImportService"
      ],
      "i": [
        "@akount/db",
        "./parser.service",
        "./duplication.service",
        "./category.service",
        "../../ai/services/categorization.service",
        "../../ai/services/insight-generator.service",
        "../../../schemas/import",
        "../../../lib/logger"
      ],
      "l": 728,
      "pt": "SP",
      "v": [],
      "d": "bnk"
    },
    "parser-csv": {
      "p": "apps/api/src/domains/banking/services/parser-csv.ts",
      "e": [
        "parseCSV",
        "parseXLSX"
      ],
      "i": [
        "papaparse",
        "exceljs",
        "../../../schemas/import"
      ],
      "l": 294,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "parser-pdf-mistral": {
      "p": "apps/api/src/domains/banking/services/parser-pdf-mistral.ts",
      "e": [
        "parsePDF"
      ],
      "i": [
        "../../../schemas/import",
        "./parser-shared",
        "../../ai/services/document-extraction.service",
        "../../ai/schemas/bank-statement-extraction.schema",
        "../../../lib/logger",
        "../../../lib/file-scanner"
      ],
      "l": 318,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "parser-pdf": {
      "p": "apps/api/src/domains/banking/services/parser-pdf.ts",
      "e": [
        "parsePDF"
      ],
      "i": [
        "../../../schemas/import",
        "./parser-shared"
      ],
      "l": 671,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "parser-shared": {
      "p": "apps/api/src/domains/banking/services/parser-shared.ts",
      "e": [
        "ParseResult",
        "sanitizeCSVInjection",
        "parseDate",
        "parseAmount",
        "parseAmountValue",
        "generateTempId",
        "normalizeInstitutionName"
      ],
      "i": [
        "../../../schemas/import",
        "crypto"
      ],
      "l": 152,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "parser.service": {
      "p": "apps/api/src/domains/banking/services/parser.service.ts",
      "e": [],
      "i": [],
      "l": 12,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "reconciliation.service": {
      "p": "apps/api/src/domains/banking/services/reconciliation.service.ts",
      "e": [
        "MatchSuggestion",
        "ReconciliationStatus",
        "CreateMatchInput",
        "ListMatchesParams",
        "PaginatedMatches",
        "ReconciliationService"
      ],
      "i": [
        "@akount/db",
        "string-similarity",
        "../../../lib/audit"
      ],
      "l": 542,
      "pt": "SP",
      "v": [],
      "d": "bnk"
    },
    "transaction.service": {
      "p": "apps/api/src/domains/banking/services/transaction.service.ts",
      "e": [
        "ListTransactionsParams",
        "PaginatedTransactions",
        "CreateTransactionInput",
        "UpdateTransactionInput",
        "TransactionService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/audit"
      ],
      "l": 662,
      "pt": "TSP",
      "v": [],
      "d": "bnk"
    },
    "transfer.service": {
      "p": "apps/api/src/domains/banking/services/transfer.service.ts",
      "e": [
        "TransferService"
      ],
      "i": [
        "@akount/db",
        "../../accounting/errors",
        "../../../lib/audit",
        "../schemas/transfer.schema"
      ],
      "l": 622,
      "pt": "TSP",
      "v": [],
      "d": "bnk"
    },
    "error": {
      "p": "apps/web/src/app/(dashboard)/banking/transfers/error.tsx",
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
      "d": "bnk"
    },
    "loading": {
      "p": "apps/web/src/app/(dashboard)/banking/transfers/loading.tsx",
      "e": [],
      "i": [
        "@/components/ui/card",
        "@/components/ui/skeleton"
      ],
      "l": 53,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "page": {
      "p": "apps/web/src/app/(dashboard)/banking/transfers/page.tsx",
      "e": [
        "metadata"
      ],
      "i": [
        "next",
        "./transfers-client",
        "@/lib/api/accounts",
        "@/lib/api/transfers",
        "@/lib/api/entities",
        "@/lib/entity-cookies"
      ],
      "l": 46,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "categories-client": {
      "p": "apps/web/src/app/(dashboard)/banking/categories/categories-client.tsx",
      "e": [
        "CategoriesClient"
      ],
      "i": [
        "react",
        "next/navigation",
        "@/lib/api/categories",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/badge",
        "@/components/ui/input",
        "@/components/ui/label",
        "sonner",
        "@/lib/utils"
      ],
      "l": 359,
      "pt": "C",
      "v": [],
      "d": "bnk"
    },
    "layout": {
      "p": "apps/web/src/app/(dashboard)/banking/layout.tsx",
      "e": [],
      "i": [],
      "l": 10,
      "pt": "",
      "v": [],
      "d": "bnk"
    },
    "transfers-client": {
      "p": "apps/web/src/app/(dashboard)/banking/transfers/transfers-client.tsx",
      "e": [
        "TransfersClient"
      ],
      "i": [
        "react",
        "@/lib/api/accounts",
        "@/lib/api/transfers",
        "@/components/ui/button",
        "@/components/ui/card",
        "lucide-react",
        "@/lib/utils/currency",
        "@/lib/api/transactions.types",
        "@/components/banking/TransferForm",
        "@akount/ui"
      ],
      "l": 191,
      "pt": "C",
      "v": [],
      "d": "bnk"
    }
  },
  "d": {
    "bnk": {
      "n": 57,
      "l": 11311
    }
  },
  "p": {
    "L": [
      "routes",
      "connections",
      "imports"
    ],
    "S": [
      "transactions",
      "account.service",
      "category.service",
      "duplication.service",
      "flinks.service",
      "import.service",
      "reconciliation.service",
      "transaction.service",
      "transfer.service"
    ],
    "P": [
      "transactions",
      "account-matcher.service",
      "account.service",
      "category.service",
      "duplication.service",
      "flinks.service",
      "fx-rate.service",
      "import.service",
      "reconciliation.service",
      "transaction.service",
      "transfer.service"
    ],
    "T": [
      "category.service",
      "flinks.service",
      "transaction.service",
      "transfer.service"
    ],
    "C": [
      "error",
      "categories-client",
      "transfers-client"
    ]
  },
  "v": {}
}
CODE-INDEX:END -->

---

## Quick Stats

**Files by domain:**
- bnk: 57 files, 11,311 LOC

**Patterns found:**
- L: 3 files
- S: 9 files
- P: 11 files
- T: 4 files
- C: 3 files

**Violations found:**
- None ✅

---

_Generated by: .claude/scripts/regenerate-code-index.js_
