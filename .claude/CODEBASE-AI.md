# AI Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 73
**Estimated tokens:** ~12,620

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 73,
  "f": {
    "errors": {
      "p": "apps/api/src/domains/ai/errors.ts",
      "e": [
        "AIErrorCode",
        "AIError",
        "handleAIError"
      ],
      "i": [],
      "l": 45,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "AIErrorCode": [
          "action.routes",
          "monthly-close",
          "natural-bookkeeping.routes",
          "natural-search.routes",
          "rule-suggestions",
          "rules",
          "action-executor.service",
          "ai-action.service",
          "monthly-close.service"
        ],
        "AIError": [
          "action.routes",
          "monthly-close",
          "natural-bookkeeping.routes",
          "natural-search.routes",
          "rule-suggestions",
          "rules",
          "action-executor.service",
          "ai-action.service",
          "monthly-close.service"
        ],
        "handleAIError": [
          "action.routes",
          "monthly-close",
          "natural-bookkeeping.routes",
          "natural-search.routes",
          "rule-suggestions",
          "rules",
          "action-executor.service",
          "ai-action.service",
          "monthly-close.service"
        ]
      }
    },
    "index": {
      "p": "apps/api/src/domains/ai/index.ts",
      "e": [],
      "i": [],
      "l": 39,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "routes": {
      "p": "apps/api/src/domains/ai/routes.ts",
      "e": [
        "aiRoutes"
      ],
      "i": [
        "fastify",
        "@akount/db",
        "./services/ai.service",
        "./services/categorization.service",
        "../../middleware/auth",
        "../../middleware/tenant",
        "../../middleware/validation",
        "../../middleware/withPermission",
        "../../middleware/rate-limit",
        "./services/je-suggestion.service"
      ],
      "l": 687,
      "pt": "TSLP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/__tests__/routes.test.ts",
        "testCount": 24
      },
      "d": "ai",
      "c": {}
    },
    "action.routes": {
      "p": "apps/api/src/domains/ai/routes/action.routes.ts",
      "e": [
        "actionRoutes"
      ],
      "i": [
        "fastify",
        "@akount/db",
        "../services/ai-action.service",
        "../errors",
        "../../../middleware/validation",
        "../../../middleware/withPermission"
      ],
      "l": 296,
      "pt": "TLP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "jobs": {
      "p": "apps/api/src/domains/ai/routes/jobs.ts",
      "e": [
        "jobStreamRoutes"
      ],
      "i": [
        "fastify",
        "bullmq",
        "../../../lib/queue/queue-manager",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../lib/logger"
      ],
      "l": 221,
      "pt": "",
      "v": [
        {
          "code": "L",
          "msg": "console.log in production",
          "fix": "Use request.log or server.log (pino structured logging)"
        }
      ],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "monthly-close": {
      "p": "apps/api/src/domains/ai/routes/monthly-close.ts",
      "e": [
        "monthlyCloseRoutes"
      ],
      "i": [
        "fastify",
        "@akount/db",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/monthly-close.service",
        "../errors"
      ],
      "l": 155,
      "pt": "LP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "natural-bookkeeping.routes": {
      "p": "apps/api/src/domains/ai/routes/natural-bookkeeping.routes.ts",
      "e": [
        "naturalBookkeepingRoutes"
      ],
      "i": [
        "fastify",
        "../services/natural-bookkeeping.service",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/consent-gate",
        "../../../middleware/rate-limit",
        "../errors"
      ],
      "l": 124,
      "pt": "L",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/routes/__tests__/natural-bookkeeping.routes.test.ts",
        "testCount": 8
      },
      "d": "ai",
      "c": {}
    },
    "natural-search.routes": {
      "p": "apps/api/src/domains/ai/routes/natural-search.routes.ts",
      "e": [
        "naturalSearchRoutes"
      ],
      "i": [
        "fastify",
        "../services/natural-search.service",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/consent-gate",
        "../../../middleware/rate-limit",
        "../errors"
      ],
      "l": 125,
      "pt": "L",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/routes/__tests__/natural-search.routes.test.ts",
        "testCount": 7
      },
      "d": "ai",
      "c": {}
    },
    "rule-suggestions": {
      "p": "apps/api/src/domains/ai/routes/rule-suggestions.ts",
      "e": [
        "ruleSuggestionRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/rule-suggestion.service",
        "../services/pattern-detection.service",
        "../errors"
      ],
      "l": 231,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "rules": {
      "p": "apps/api/src/domains/ai/routes/rules.ts",
      "e": [
        "rulesRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/rule.service",
        "../errors"
      ],
      "l": 240,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "rulesRoutes": [
          "page"
        ]
      }
    },
    "action.schema": {
      "p": "apps/api/src/domains/ai/schemas/action.schema.ts",
      "e": [
        "ActionIdParamsSchema",
        "ActionIdParams",
        "ListActionsQuerySchema",
        "ListActionsQuery",
        "ReviewActionBodySchema",
        "ReviewActionBody",
        "BatchReviewBodySchema",
        "BatchReviewBody",
        "StatsQuerySchema",
        "StatsQuery"
      ],
      "i": [
        "zod"
      ],
      "l": 64,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "ActionIdParamsSchema": [
          "document-extraction.service"
        ],
        "ActionIdParams": [
          "document-extraction.service"
        ],
        "ListActionsQuerySchema": [
          "document-extraction.service"
        ],
        "ListActionsQuery": [
          "document-extraction.service"
        ],
        "ReviewActionBodySchema": [
          "document-extraction.service"
        ],
        "ReviewActionBody": [
          "document-extraction.service"
        ],
        "BatchReviewBodySchema": [
          "document-extraction.service"
        ],
        "BatchReviewBody": [
          "document-extraction.service"
        ],
        "StatsQuerySchema": [
          "document-extraction.service"
        ],
        "StatsQuery": [
          "document-extraction.service"
        ]
      }
    },
    "bank-statement-extraction.schema": {
      "p": "apps/api/src/domains/ai/schemas/bank-statement-extraction.schema.ts",
      "e": [
        "TransactionTypeSchema",
        "BankStatementTransactionSchema",
        "BankStatementTransaction",
        "StatementAccountInfoSchema",
        "StatementAccountInfo",
        "BankStatementExtractionSchema",
        "BankStatementExtraction",
        "validateStatementBalances"
      ],
      "i": [
        "zod"
      ],
      "l": 157,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "TransactionTypeSchema": [
          "document-extraction.service"
        ],
        "BankStatementTransactionSchema": [
          "document-extraction.service"
        ],
        "BankStatementTransaction": [
          "document-extraction.service"
        ],
        "StatementAccountInfoSchema": [
          "document-extraction.service"
        ],
        "StatementAccountInfo": [
          "document-extraction.service"
        ],
        "BankStatementExtractionSchema": [
          "document-extraction.service"
        ],
        "BankStatementExtraction": [
          "document-extraction.service"
        ],
        "validateStatementBalances": [
          "document-extraction.service"
        ]
      }
    },
    "bill-extraction.schema": {
      "p": "apps/api/src/domains/ai/schemas/bill-extraction.schema.ts",
      "e": [
        "LineItemSchema",
        "LineItem",
        "TaxBreakdownSchema",
        "TaxBreakdown",
        "PaymentTermsSchema",
        "PaymentTerms",
        "BillExtractionSchema",
        "BillExtraction",
        "validateBillTotals"
      ],
      "i": [
        "zod"
      ],
      "l": 156,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/schemas/__tests__/bill-extraction.schema.test.ts",
        "testCount": 19
      },
      "d": "ai",
      "c": {
        "LineItemSchema": [
          "document-extraction.service"
        ],
        "LineItem": [
          "document-extraction.service"
        ],
        "TaxBreakdownSchema": [
          "document-extraction.service"
        ],
        "TaxBreakdown": [
          "document-extraction.service"
        ],
        "PaymentTermsSchema": [
          "document-extraction.service"
        ],
        "PaymentTerms": [
          "document-extraction.service"
        ],
        "BillExtractionSchema": [
          "document-extraction.service"
        ],
        "BillExtraction": [
          "document-extraction.service"
        ],
        "validateBillTotals": [
          "document-extraction.service"
        ]
      }
    },
    "categorization.schema": {
      "p": "apps/api/src/domains/ai/schemas/categorization.schema.ts",
      "e": [
        "CategorizeSingleSchema",
        "CategorizeSingleInput",
        "CategorizeBatchSchema",
        "CategorizeBatchInput",
        "ChatBodySchema",
        "ChatBodyInput"
      ],
      "i": [
        "zod"
      ],
      "l": 49,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "insight.schema": {
      "p": "apps/api/src/domains/ai/schemas/insight.schema.ts",
      "e": [
        "ListInsightsSchema",
        "ListInsightsInput",
        "DismissInsightSchema",
        "DismissInsightInput",
        "SnoozeInsightSchema",
        "SnoozeInsightInput",
        "GenerateInsightsSchema",
        "GenerateInsightsInput",
        "GetInsightCountsSchema",
        "GetInsightCountsInput"
      ],
      "i": [
        "zod"
      ],
      "l": 53,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "invoice-extraction.schema": {
      "p": "apps/api/src/domains/ai/schemas/invoice-extraction.schema.ts",
      "e": [
        "InvoiceLineItemSchema",
        "InvoiceLineItem",
        "InvoiceTaxBreakdownSchema",
        "InvoiceTaxBreakdown",
        "InvoicePaymentTermsSchema",
        "InvoicePaymentTerms",
        "InvoiceExtractionSchema",
        "InvoiceExtraction",
        "validateInvoiceTotals"
      ],
      "i": [
        "zod"
      ],
      "l": 170,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/schemas/__tests__/invoice-extraction.schema.test.ts",
        "testCount": 13
      },
      "d": "ai",
      "c": {
        "InvoiceLineItemSchema": [
          "document-extraction.service"
        ],
        "InvoiceLineItem": [
          "document-extraction.service"
        ],
        "InvoiceTaxBreakdownSchema": [
          "document-extraction.service"
        ],
        "InvoiceTaxBreakdown": [
          "document-extraction.service"
        ],
        "InvoicePaymentTermsSchema": [
          "document-extraction.service"
        ],
        "InvoicePaymentTerms": [
          "document-extraction.service"
        ],
        "InvoiceExtractionSchema": [
          "document-extraction.service"
        ],
        "InvoiceExtraction": [
          "document-extraction.service"
        ],
        "validateInvoiceTotals": [
          "document-extraction.service"
        ]
      }
    },
    "je-suggestion.schema": {
      "p": "apps/api/src/domains/ai/schemas/je-suggestion.schema.ts",
      "e": [
        "JESuggestSchema",
        "JESuggestInput",
        "JECreateFromSuggestionsSchema",
        "JECreateFromSuggestionsInput"
      ],
      "i": [
        "zod"
      ],
      "l": 34,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "monthly-close.schema": {
      "p": "apps/api/src/domains/ai/schemas/monthly-close.schema.ts",
      "e": [
        "CloseReadinessSchema",
        "CloseReadinessQuery",
        "ExecuteCloseSchema",
        "ExecuteCloseInput",
        "CloseHistorySchema",
        "CloseHistoryQuery"
      ],
      "i": [
        "zod"
      ],
      "l": 33,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "natural-bookkeeping.schema": {
      "p": "apps/api/src/domains/ai/schemas/natural-bookkeeping.schema.ts",
      "e": [
        "ParseNaturalLanguageSchema",
        "ParseNaturalLanguageInput",
        "ParsedTransactionSchema",
        "ParsedTransaction",
        "mistralTransactionFunctionSchema"
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
      "d": "ai",
      "c": {
        "ParseNaturalLanguageSchema": [
          "natural-bookkeeping.service"
        ],
        "ParseNaturalLanguageInput": [
          "natural-bookkeeping.service"
        ],
        "ParsedTransactionSchema": [
          "natural-bookkeeping.service"
        ],
        "ParsedTransaction": [
          "natural-bookkeeping.service"
        ],
        "mistralTransactionFunctionSchema": [
          "natural-bookkeeping.service"
        ]
      }
    },
    "natural-search.schema": {
      "p": "apps/api/src/domains/ai/schemas/natural-search.schema.ts",
      "e": [
        "NaturalSearchQuerySchema",
        "NaturalSearchQueryInput",
        "mistralSearchFunctionSchema"
      ],
      "i": [
        "zod"
      ],
      "l": 71,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "NaturalSearchQuerySchema": [
          "natural-search.service"
        ],
        "NaturalSearchQueryInput": [
          "natural-search.service"
        ],
        "mistralSearchFunctionSchema": [
          "natural-search.service"
        ]
      }
    },
    "rule-suggestion.schema": {
      "p": "apps/api/src/domains/ai/schemas/rule-suggestion.schema.ts",
      "e": [
        "ListSuggestionsSchema",
        "ListSuggestionsQuery",
        "SuggestionIdSchema",
        "SuggestionIdParams",
        "RejectSuggestionSchema",
        "RejectSuggestionInput",
        "DetectPatternsSchema",
        "DetectPatternsQuery",
        "ExpireSuggestionsSchema",
        "ExpireSuggestionsInput"
      ],
      "i": [
        "zod"
      ],
      "l": 49,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "rule.schema": {
      "p": "apps/api/src/domains/ai/schemas/rule.schema.ts",
      "e": [
        "RuleConditionSchema",
        "RuleCondition",
        "RuleConditionsSchema",
        "RuleConditions",
        "RuleActionSchema",
        "RuleAction",
        "CreateRuleSchema",
        "CreateRuleInput",
        "UpdateRuleSchema",
        "UpdateRuleInput"
      ],
      "i": [
        "zod",
        "@akount/db"
      ],
      "l": 140,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "action-executor.service": {
      "p": "apps/api/src/domains/ai/services/action-executor.service.ts",
      "e": [
        "ExecutionResult",
        "ActionExecutorService"
      ],
      "i": [
        "@akount/db",
        "../../accounting/services/journal-entry.service",
        "./insight.service",
        "../errors",
        "../../../lib/logger"
      ],
      "l": 471,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "ExecutionResult": [
          "ai-action.service"
        ],
        "ActionExecutorService": [
          "ai-action.service"
        ]
      }
    },
    "ai-action.service": {
      "p": "apps/api/src/domains/ai/services/ai-action.service.ts",
      "e": [
        "ACTION_EXPIRY_DAYS",
        "HIGH_CONFIDENCE_THRESHOLD",
        "CreateActionInput",
        "ListActionsFilter",
        "ActionStats",
        "BatchResult",
        "AIActionService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "./action-executor.service",
        "../../../lib/logger"
      ],
      "l": 471,
      "pt": "P",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/ai-action.service.test.ts",
        "testCount": 22
      },
      "d": "ai",
      "c": {
        "ACTION_EXPIRY_DAYS": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "HIGH_CONFIDENCE_THRESHOLD": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "CreateActionInput": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "ListActionsFilter": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "ActionStats": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "BatchResult": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ],
        "AIActionService": [
          "action.routes",
          "insight-generator.service",
          "je-suggestion.service",
          "rule-suggestion.service"
        ]
      }
    },
    "ai-decision-log.service": {
      "p": "apps/api/src/domains/ai/services/ai-decision-log.service.ts",
      "e": [
        "LogDecisionInput",
        "QueryDecisionsInput",
        "AIDecisionLogService"
      ],
      "i": [
        "@akount/db",
        "crypto",
        "../../../lib/logger"
      ],
      "l": 289,
      "pt": "TP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/ai-decision-log.service.test.ts",
        "testCount": 10
      },
      "d": "ai",
      "c": {
        "LogDecisionInput": [
          "natural-bookkeeping.service",
          "natural-search.service"
        ],
        "QueryDecisionsInput": [
          "natural-bookkeeping.service",
          "natural-search.service"
        ],
        "AIDecisionLogService": [
          "natural-bookkeeping.service",
          "natural-search.service"
        ]
      }
    },
    "ai.service": {
      "p": "apps/api/src/domains/ai/services/ai.service.ts",
      "e": [
        "AIService",
        "aiService"
      ],
      "i": [
        "./types",
        "./providers/perplexity.provider",
        "./providers/claude.provider"
      ],
      "l": 53,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/ai.service.test.ts",
        "testCount": 23
      },
      "d": "ai",
      "c": {
        "AIService": [
          "routes",
          "categorization.service"
        ],
        "aiService": [
          "routes",
          "categorization.service"
        ]
      }
    },
    "cash-flow.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/cash-flow.analyzer.ts",
      "e": [
        "analyzeCashFlow"
      ],
      "i": [
        "../../types/insight.types.js",
        "../insight-generator.service.js"
      ],
      "l": 94,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/cash-flow.analyzer.test.ts",
        "testCount": 9
      },
      "d": "ai",
      "c": {
        "analyzeCashFlow": [
          "insight-generator.service"
        ]
      }
    },
    "duplicate.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/duplicate.analyzer.ts",
      "e": [
        "analyzeDuplicates"
      ],
      "i": [
        "@akount/db",
        "../../types/insight.types.js"
      ],
      "l": 119,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/duplicate.analyzer.test.ts",
        "testCount": 11
      },
      "d": "ai",
      "c": {
        "analyzeDuplicates": [
          "insight-generator.service"
        ]
      }
    },
    "overdue.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/overdue.analyzer.ts",
      "e": [
        "analyzeOverdue"
      ],
      "i": [
        "../../types/insight.types.js",
        "../insight-generator.service.js"
      ],
      "l": 99,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/overdue.analyzer.test.ts",
        "testCount": 10
      },
      "d": "ai",
      "c": {
        "analyzeOverdue": [
          "insight-generator.service"
        ]
      }
    },
    "reconciliation.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/reconciliation.analyzer.ts",
      "e": [
        "analyzeReconciliation"
      ],
      "i": [
        "@akount/db",
        "../../types/insight.types.js"
      ],
      "l": 108,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/reconciliation.analyzer.test.ts",
        "testCount": 13
      },
      "d": "ai",
      "c": {}
    },
    "revenue.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/revenue.analyzer.ts",
      "e": [
        "analyzeRevenue"
      ],
      "i": [
        "../../types/insight.types.js",
        "../../../accounting/services/report.service.js"
      ],
      "l": 110,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/revenue.analyzer.test.ts",
        "testCount": 11
      },
      "d": "ai",
      "c": {
        "analyzeRevenue": [
          "insight-generator.service"
        ]
      }
    },
    "spending.analyzer": {
      "p": "apps/api/src/domains/ai/services/analyzers/spending.analyzer.ts",
      "e": [
        "analyzeSpending"
      ],
      "i": [
        "../../types/insight.types.js",
        "../insight-generator.service.js"
      ],
      "l": 122,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/analyzers/__tests__/spending.analyzer.test.ts",
        "testCount": 11
      },
      "d": "ai",
      "c": {
        "analyzeSpending": [
          "insight-generator.service"
        ]
      }
    },
    "categorization.service": {
      "p": "apps/api/src/domains/ai/services/categorization.service.ts",
      "e": [
        "ConfidenceTier",
        "CategorySuggestion",
        "CATEGORY_TO_COA_CODE",
        "CategorizationService",
        "categorizeTransaction",
        "categorizeTransactions",
        "learnFromCorrection"
      ],
      "i": [
        "@akount/db",
        "./ai.service",
        "./rule.service",
        "./rule-engine.service",
        "../../../lib/logger"
      ],
      "l": 725,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/categorization.service.test.ts",
        "testCount": 36
      },
      "d": "ai",
      "c": {
        "ConfidenceTier": [
          "routes",
          "je-suggestion.service"
        ],
        "CategorySuggestion": [
          "routes",
          "je-suggestion.service"
        ],
        "CATEGORY_TO_COA_CODE": [
          "routes",
          "je-suggestion.service"
        ],
        "CategorizationService": [
          "routes",
          "je-suggestion.service"
        ],
        "categorizeTransaction": [
          "routes",
          "je-suggestion.service"
        ],
        "categorizeTransactions": [
          "routes",
          "je-suggestion.service"
        ],
        "learnFromCorrection": [
          "routes",
          "je-suggestion.service"
        ]
      }
    },
    "document-extraction.service": {
      "p": "apps/api/src/domains/ai/services/document-extraction.service.ts",
      "e": [
        "MAX_FILE_SIZE_BYTES",
        "ExtractionOptions",
        "ExtractionResult",
        "DocumentExtractionService"
      ],
      "i": [
        "./providers/mistral.provider",
        "../../../lib/pii-redaction",
        "../schemas/bill-extraction.schema",
        "../schemas/invoice-extraction.schema",
        "../schemas/bank-statement-extraction.schema",
        "../../../lib/logger",
        "../../../lib/env"
      ],
      "l": 505,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/document-extraction.service.test.ts",
        "testCount": 16
      },
      "d": "ai",
      "c": {
        "MAX_FILE_SIZE_BYTES": [
          "bill-scan.worker",
          "invoice-scan.worker"
        ],
        "ExtractionOptions": [
          "bill-scan.worker",
          "invoice-scan.worker"
        ],
        "ExtractionResult": [
          "bill-scan.worker",
          "invoice-scan.worker"
        ],
        "DocumentExtractionService": [
          "bill-scan.worker",
          "invoice-scan.worker"
        ]
      }
    },
    "insight-generator.service": {
      "p": "apps/api/src/domains/ai/services/insight-generator.service.ts",
      "e": [
        "GenerationSummary",
        "SharedAnalysisData",
        "InsightGeneratorService"
      ],
      "i": [
        "../../../lib/logger.js",
        "./insight.service.js",
        "./ai-action.service.js",
        "../../overview/services/dashboard.service.js",
        "../types/insight.types.js",
        "./analyzers/cash-flow.analyzer.js",
        "./analyzers/overdue.analyzer.js",
        "./analyzers/spending.analyzer.js",
        "./analyzers/duplicate.analyzer.js",
        "./analyzers/revenue.analyzer.js"
      ],
      "l": 243,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/insight-generator.service.test.ts",
        "testCount": 14
      },
      "d": "ai",
      "c": {
        "GenerationSummary": [
          "cash-flow.analyzer",
          "overdue.analyzer",
          "spending.analyzer"
        ],
        "SharedAnalysisData": [
          "cash-flow.analyzer",
          "overdue.analyzer",
          "spending.analyzer"
        ],
        "InsightGeneratorService": [
          "cash-flow.analyzer",
          "overdue.analyzer",
          "spending.analyzer"
        ]
      }
    },
    "insight.service": {
      "p": "apps/api/src/domains/ai/services/insight.service.ts",
      "e": [
        "ListInsightsParams",
        "InsightCounts",
        "InsightService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/audit.js"
      ],
      "l": 348,
      "pt": "TP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/insight.service.test.ts",
        "testCount": 15
      },
      "d": "ai",
      "c": {
        "ListInsightsParams": [
          "action-executor.service",
          "insight-generator.service"
        ],
        "InsightCounts": [
          "action-executor.service",
          "insight-generator.service"
        ],
        "InsightService": [
          "action-executor.service",
          "insight-generator.service"
        ]
      }
    },
    "je-suggestion.service": {
      "p": "apps/api/src/domains/ai/services/je-suggestion.service.ts",
      "e": [
        "JESuggestionInput",
        "JournalLineSuggestion",
        "JESuggestion",
        "JESuggestionBatchResult",
        "JESuggestionService"
      ],
      "i": [
        "@akount/db",
        "../../accounting/utils/entry-number",
        "./categorization.service",
        "./ai-action.service",
        "../../../lib/logger"
      ],
      "l": 418,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/je-suggestion.service.test.ts",
        "testCount": 28
      },
      "d": "ai",
      "c": {
        "JESuggestionInput": [
          "routes"
        ],
        "JournalLineSuggestion": [
          "routes"
        ],
        "JESuggestion": [
          "routes"
        ],
        "JESuggestionBatchResult": [
          "routes"
        ],
        "JESuggestionService": [
          "routes"
        ]
      }
    },
    "monthly-close.service": {
      "p": "apps/api/src/domains/ai/services/monthly-close.service.ts",
      "e": [
        "ChecklistStatus",
        "ChecklistItem",
        "CloseReadinessReport",
        "MonthlyCloseService"
      ],
      "i": [
        "@akount/db",
        "../errors",
        "../../accounting/services/fiscal-period.service",
        "../../../lib/audit"
      ],
      "l": 387,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/monthly-close.service.test.ts",
        "testCount": 17
      },
      "d": "ai",
      "c": {
        "ChecklistStatus": [
          "monthly-close"
        ],
        "ChecklistItem": [
          "monthly-close"
        ],
        "CloseReadinessReport": [
          "monthly-close"
        ],
        "MonthlyCloseService": [
          "monthly-close"
        ]
      }
    },
    "natural-bookkeeping.service": {
      "p": "apps/api/src/domains/ai/services/natural-bookkeeping.service.ts",
      "e": [
        "ParsedTransactionData",
        "ParseResult",
        "NaturalBookkeepingService"
      ],
      "i": [
        "@akount/db",
        "./providers/mistral.provider",
        "./ai-decision-log.service",
        "../../../lib/logger",
        "../schemas/natural-bookkeeping.schema"
      ],
      "l": 444,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "ParsedTransactionData": [
          "natural-bookkeeping.routes"
        ],
        "ParseResult": [
          "natural-bookkeeping.routes"
        ],
        "NaturalBookkeepingService": [
          "natural-bookkeeping.routes"
        ]
      }
    },
    "natural-search.service": {
      "p": "apps/api/src/domains/ai/services/natural-search.service.ts",
      "e": [
        "FilterChip",
        "ParsedSearchFilters",
        "SearchParseResult",
        "NaturalSearchService"
      ],
      "i": [
        "@akount/db",
        "./providers/mistral.provider",
        "./ai-decision-log.service",
        "../../../lib/logger",
        "../schemas/natural-search.schema"
      ],
      "l": 558,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "FilterChip": [
          "natural-search.routes"
        ],
        "ParsedSearchFilters": [
          "natural-search.routes"
        ],
        "SearchParseResult": [
          "natural-search.routes"
        ],
        "NaturalSearchService": [
          "natural-search.routes"
        ]
      }
    },
    "pattern-detection.service": {
      "p": "apps/api/src/domains/ai/services/pattern-detection.service.ts",
      "e": [
        "DetectedPattern",
        "tokenizeDescription",
        "PatternDetectionService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/logger",
        "./rule.service"
      ],
      "l": 538,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/pattern-detection.service.test.ts",
        "testCount": 31
      },
      "d": "ai",
      "c": {
        "DetectedPattern": [
          "rule-suggestions"
        ],
        "tokenizeDescription": [
          "rule-suggestions"
        ],
        "PatternDetectionService": [
          "rule-suggestions"
        ]
      }
    },
    "claude.provider": {
      "p": "apps/api/src/domains/ai/services/providers/claude.provider.ts",
      "e": [
        "ClaudeProvider"
      ],
      "i": [
        "@anthropic-ai/sdk",
        "../types",
        "../../../../lib/logger"
      ],
      "l": 72,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "ClaudeProvider": [
          "ai.service"
        ]
      }
    },
    "mistral.provider": {
      "p": "apps/api/src/domains/ai/services/providers/mistral.provider.ts",
      "e": [
        "MistralChatOptions",
        "MistralProvider"
      ],
      "i": [
        "@mistralai/mistralai",
        "../types",
        "../../../../lib/logger",
        "zod"
      ],
      "l": 427,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/providers/__tests__/mistral.provider.test.ts",
        "testCount": 25
      },
      "d": "ai",
      "c": {
        "MistralChatOptions": [
          "document-extraction.service",
          "natural-bookkeeping.service",
          "natural-search.service"
        ],
        "MistralProvider": [
          "document-extraction.service",
          "natural-bookkeeping.service",
          "natural-search.service"
        ]
      }
    },
    "perplexity.provider": {
      "p": "apps/api/src/domains/ai/services/providers/perplexity.provider.ts",
      "e": [
        "PerplexityProvider"
      ],
      "i": [
        "openai",
        "../types",
        "../../../../lib/logger"
      ],
      "l": 56,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "PerplexityProvider": [
          "ai.service"
        ]
      }
    },
    "rule-engine.service": {
      "p": "apps/api/src/domains/ai/services/rule-engine.service.ts",
      "e": [
        "TransactionData",
        "RuleMatch",
        "RuleEngineService"
      ],
      "i": [
        "@akount/db",
        "./rule.service"
      ],
      "l": 361,
      "pt": "P",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/rule-engine.service.test.ts",
        "testCount": 28
      },
      "d": "ai",
      "c": {
        "TransactionData": [
          "categorization.service"
        ],
        "RuleMatch": [
          "categorization.service"
        ],
        "RuleEngineService": [
          "categorization.service"
        ]
      }
    },
    "rule-suggestion.service": {
      "p": "apps/api/src/domains/ai/services/rule-suggestion.service.ts",
      "e": [
        "DetectedPattern",
        "RuleSuggestionWithDetails",
        "RuleSuggestionService"
      ],
      "i": [
        "@akount/db",
        "./ai-action.service",
        "./rule.service",
        "../../../lib/audit",
        "../../../lib/logger"
      ],
      "l": 343,
      "pt": "P",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "DetectedPattern": [
          "rule-suggestions"
        ],
        "RuleSuggestionWithDetails": [
          "rule-suggestions"
        ],
        "RuleSuggestionService": [
          "rule-suggestions"
        ]
      }
    },
    "rule.service": {
      "p": "apps/api/src/domains/ai/services/rule.service.ts",
      "e": [
        "RuleCondition",
        "RuleConditions",
        "RuleAction",
        "CreateRuleInput",
        "UpdateRuleInput",
        "ListRulesParams",
        "ListRulesResult",
        "RuleService"
      ],
      "i": [
        "@akount/db",
        "zod",
        "../../../lib/audit"
      ],
      "l": 569,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/ai/services/__tests__/rule.service.test.ts",
        "testCount": 37
      },
      "d": "ai",
      "c": {
        "RuleCondition": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "RuleConditions": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "RuleAction": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "CreateRuleInput": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "UpdateRuleInput": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "ListRulesParams": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "ListRulesResult": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ],
        "RuleService": [
          "rules",
          "categorization.service",
          "pattern-detection.service",
          "rule-engine.service",
          "rule-suggestion.service"
        ]
      }
    },
    "types": {
      "p": "apps/api/src/domains/ai/services/types.ts",
      "e": [],
      "i": [],
      "l": 12,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "insight.types": {
      "p": "apps/api/src/domains/ai/types/insight.types.ts",
      "e": [
        "INSIGHT_TYPES",
        "InsightType",
        "INSIGHT_PRIORITIES",
        "InsightPriority",
        "INSIGHT_STATUSES",
        "InsightStatus",
        "INSIGHT_TYPE_CONFIG",
        "CashFlowMetadata",
        "SpendingAnomalyMetadata",
        "DuplicateExpenseMetadata"
      ],
      "i": [],
      "l": 174,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {
        "INSIGHT_TYPES": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "InsightType": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "INSIGHT_PRIORITIES": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "InsightPriority": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "INSIGHT_STATUSES": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "InsightStatus": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "INSIGHT_TYPE_CONFIG": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "CashFlowMetadata": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "SpendingAnomalyMetadata": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ],
        "DuplicateExpenseMetadata": [
          "cash-flow.analyzer",
          "duplicate.analyzer",
          "overdue.analyzer",
          "reconciliation.analyzer",
          "revenue.analyzer",
          "spending.analyzer",
          "insight-generator.service"
        ]
      }
    },
    "bill-scan.worker": {
      "p": "apps/api/src/domains/ai/workers/bill-scan.worker.ts",
      "e": [
        "BillScanJobData",
        "BillScanJobResult",
        "startBillScanWorker"
      ],
      "i": [
        "bullmq",
        "@akount/db",
        "crypto",
        "../../../lib/queue/queue-manager",
        "../services/document-extraction.service",
        "../../../lib/logger",
        "../../../lib/env"
      ],
      "l": 335,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "invoice-scan.worker": {
      "p": "apps/api/src/domains/ai/workers/invoice-scan.worker.ts",
      "e": [
        "InvoiceScanJobData",
        "InvoiceScanJobResult",
        "startInvoiceScanWorker"
      ],
      "i": [
        "bullmq",
        "@akount/db",
        "crypto",
        "../../../lib/queue/queue-manager",
        "../services/document-extraction.service",
        "../../../lib/logger",
        "../../../lib/env"
      ],
      "l": 338,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "ai",
      "c": {}
    },
    "actions-list-client": {
      "p": "apps/web/src/app/(dashboard)/insights/actions/actions-list-client.tsx",
      "e": [
        "ActionsListClient"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@akount/ui/business",
        "@akount/ui",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/checkbox",
        "date-fns"
      ],
      "l": 463,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "error": {
      "p": "apps/web/src/app/(dashboard)/insights/rules/error.tsx",
      "e": [],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 50,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "loading": {
      "p": "apps/web/src/app/(dashboard)/insights/rules/loading.tsx",
      "e": [],
      "i": [
        "@/components/ui/skeleton",
        "@/components/ui/card"
      ],
      "l": 64,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "page": {
      "p": "apps/web/src/app/(dashboard)/insights/rules/page.tsx",
      "e": [
        "metadata"
      ],
      "i": [
        "next",
        "@/lib/api/ai",
        "./rules-client",
        "next/headers"
      ],
      "l": 57,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "chat-interface": {
      "p": "apps/web/src/app/(dashboard)/insights/chat-interface.tsx",
      "e": [
        "ChatInterface"
      ],
      "i": [
        "react",
        "lucide-react",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/card",
        "@/lib/api/client-browser"
      ],
      "l": 243,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "insight-card": {
      "p": "apps/web/src/app/(dashboard)/insights/insight-card.tsx",
      "e": [
        "InsightCard"
      ],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/badge",
        "date-fns",
        "@/lib/api/ai",
        "@/lib/utils/currency"
      ],
      "l": 223,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {
        "InsightCard": [
          "insights-client"
        ]
      }
    },
    "insights-client": {
      "p": "apps/web/src/app/(dashboard)/insights/insights-client.tsx",
      "e": [
        "InsightsClient"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@/components/ui/badge",
        "@/components/ui/button",
        "lucide-react",
        "./insight-card"
      ],
      "l": 343,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "monthly-close-client": {
      "p": "apps/web/src/app/(dashboard)/insights/policy-alerts/monthly-close-client.tsx",
      "e": [
        "MonthlyCloseClient"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/badge",
        "@/lib/utils",
        "date-fns"
      ],
      "l": 387,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "rule-condition-builder": {
      "p": "apps/web/src/app/(dashboard)/insights/rules/rule-condition-builder.tsx",
      "e": [
        "RuleConditionBuilder"
      ],
      "i": [
        "@/lib/api/ai",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react"
      ],
      "l": 202,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "rules-client": {
      "p": "apps/web/src/app/(dashboard)/insights/rules/rules-client.tsx",
      "e": [
        "RulesClient"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@akount/ui",
        "@/components/ui/button",
        "@/components/ui/card",
        "@/components/ui/badge",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/switch",
        "date-fns"
      ],
      "l": 612,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {
        "RulesClient": [
          "page"
        ]
      }
    }
  },
  "d": {
    "ai": {
      "n": 51,
      "l": 12001
    },
    "pg": {
      "n": 22,
      "l": 3226
    }
  },
  "p": {
    "T": [
      "routes",
      "action.routes",
      "ai-decision-log.service",
      "categorization.service",
      "insight.service",
      "monthly-close.service",
      "pattern-detection.service",
      "rule.service"
    ],
    "S": [
      "routes",
      "action-executor.service",
      "duplicate.analyzer",
      "reconciliation.analyzer",
      "categorization.service",
      "je-suggestion.service",
      "monthly-close.service",
      "natural-bookkeeping.service",
      "natural-search.service",
      "pattern-detection.service",
      "rule.service",
      "bill-scan.worker",
      "invoice-scan.worker"
    ],
    "L": [
      "routes",
      "action.routes",
      "monthly-close",
      "natural-bookkeeping.routes",
      "natural-search.routes",
      "rule-suggestions",
      "rules"
    ],
    "P": [
      "routes",
      "action.routes",
      "monthly-close",
      "action-executor.service",
      "ai-action.service",
      "ai-decision-log.service",
      "duplicate.analyzer",
      "reconciliation.analyzer",
      "categorization.service",
      "insight.service",
      "je-suggestion.service",
      "monthly-close.service",
      "natural-bookkeeping.service",
      "natural-search.service",
      "pattern-detection.service",
      "rule-engine.service",
      "rule-suggestion.service",
      "rule.service",
      "bill-scan.worker",
      "invoice-scan.worker"
    ],
    "C": [
      "actions-list-client",
      "error",
      "chat-interface",
      "insight-card",
      "insights-client",
      "monthly-close-client",
      "rule-condition-builder",
      "rules-client"
    ]
  },
  "v": {
    "L": [
      {
        "file": "jobs",
        "path": "apps/api/src/domains/ai/routes/jobs.ts",
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
- ai: 51 files, 12,001 LOC
- pg: 22 files, 3,226 LOC

**Patterns found:**
- T: 8 files
- S: 13 files
- L: 7 files
- P: 20 files
- C: 8 files

**Violations found:**
- L: 1 occurrences

---

_Generated by: .claude/scripts/regenerate-code-index.js_
