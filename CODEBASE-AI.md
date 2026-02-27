# AI Code Index

**Auto-generated:** 2026-02-27
**Files indexed:** 65
**Estimated tokens:** ~5,973

---

## Decode Legend

**Fields:**
- `p` = path (relative from project root)
- `d` = domain code (bnk, inv, acc, pln, ai, pg, cmp, pkg)
- `e` = exports (array of function/class/const names)
- `i` = imports (array of module paths)
- `l` = LOC (lines of code)
- `pt` = patterns (compact codes)
- `v` = violations (detailed with fix suggestions)

**Pattern Codes:**
- `T` = tenant-isolation (includes tenantId filter)
- `S` = soft-delete (uses deletedAt)
- `L` = pino-logging (uses request.log/server.log)
- `P` = prisma (uses prisma.*)
- `C` = client-component (has 'use client')

**Violation Codes:**
- `F` = inline formatCurrency (not imported from canonical)
- `H` = hardcoded color (text-[#...] or bg-[rgba...])
- `L` = console.log in production
- `A` = : any type annotation

**Domain Codes:**
- `bnk` = banking, `inv` = invoicing, `acc` = accounting
- `pln` = planning, `ai` = ai, `pg` = pages
- `cmp` = components/utils, `pkg` = packages

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-27",
  "n": 65,
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
      "d": "ai"
    },
    "index": {
      "p": "apps/api/src/domains/ai/index.ts",
      "e": [],
      "i": [],
      "l": 39,
      "pt": "",
      "v": [],
      "d": "ai"
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
      "l": 675,
      "pt": "TSLP",
      "v": [],
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
        "../../../lib/logger",
        "../../../lib/env"
      ],
      "l": 401,
      "pt": "",
      "v": [],
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
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
      "d": "ai"
    },
    "types": {
      "p": "apps/api/src/domains/ai/services/types.ts",
      "e": [],
      "i": [],
      "l": 12,
      "pt": "",
      "v": [],
      "d": "ai"
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
      "d": "ai"
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
        "../../../lib/queue/queue-manager",
        "../services/document-extraction.service",
        "../../../lib/logger",
        "../../../lib/env"
      ],
      "l": 339,
      "pt": "SP",
      "v": [],
      "d": "ai"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
    }
  },
  "d": {
    "ai": {
      "n": 43,
      "l": 9999
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
      "pattern-detection.service",
      "rule.service",
      "bill-scan.worker"
    ],
    "L": [
      "routes",
      "action.routes",
      "monthly-close",
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
      "pattern-detection.service",
      "rule-engine.service",
      "rule-suggestion.service",
      "rule.service",
      "bill-scan.worker"
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
- ai: 43 files, 9,999 LOC
- pg: 22 files, 3,226 LOC

**Patterns found:**
- T: 8 files
- S: 10 files
- L: 5 files
- P: 17 files
- C: 8 files

**Violations found:**
- L: 1 occurrences

---

_Generated by: .claude/scripts/regenerate-code-index.js_
