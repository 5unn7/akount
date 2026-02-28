# PLANNING Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 40
**Estimated tokens:** ~4,426

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 40,
  "f": {
    "index": {
      "p": "apps/api/src/domains/planning/routes/index.ts",
      "e": [
        "planningRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "./goal.routes",
        "./budget.routes",
        "./forecast.routes"
      ],
      "l": 24,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "budget.routes": {
      "p": "apps/api/src/domains/planning/routes/budget.routes.ts",
      "e": [
        "budgetRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/budget.service",
        "../services/budget-variance.service",
        "../services/budget-suggestions.service"
      ],
      "l": 280,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "budgetRoutes": [
          "index"
        ]
      }
    },
    "forecast.routes": {
      "p": "apps/api/src/domains/planning/routes/forecast.routes.ts",
      "e": [
        "forecastRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../../../middleware/rate-limit",
        "../services/forecast.service",
        "../services/cash-runway.service",
        "../services/seasonal-patterns.service",
        "../services/ai-forecast.service"
      ],
      "l": 257,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "forecastRoutes": [
          "index"
        ]
      }
    },
    "goal.routes": {
      "p": "apps/api/src/domains/planning/routes/goal.routes.ts",
      "e": [
        "goalRoutes"
      ],
      "i": [
        "fastify",
        "../../../middleware/withPermission",
        "../../../middleware/validation",
        "../services/goal.service",
        "../services/goal-tracking.service",
        "../services/goal-templates"
      ],
      "l": 241,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "goalRoutes": [
          "index"
        ]
      }
    },
    "budget.schema": {
      "p": "apps/api/src/domains/planning/schemas/budget.schema.ts",
      "e": [
        "CreateBudgetSchema",
        "UpdateBudgetSchema",
        "ListBudgetsQuerySchema",
        "BudgetIdParamSchema",
        "BudgetVarianceQuerySchema",
        "BudgetRolloverBodySchema",
        "BudgetSuggestionsQuerySchema",
        "CreateBudgetInput",
        "UpdateBudgetInput",
        "ListBudgetsQuery"
      ],
      "i": [
        "zod"
      ],
      "l": 59,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "forecast.schema": {
      "p": "apps/api/src/domains/planning/schemas/forecast.schema.ts",
      "e": [
        "ForecastTypeEnum",
        "ForecastScenarioEnum",
        "CreateForecastSchema",
        "UpdateForecastSchema",
        "ListForecastsQuerySchema",
        "ForecastIdParamSchema",
        "ForecastAnalyticsQuerySchema",
        "AIForecastQuerySchema",
        "CreateForecastInput",
        "UpdateForecastInput"
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
      "d": "pln",
      "c": {}
    },
    "goal.schema": {
      "p": "apps/api/src/domains/planning/schemas/goal.schema.ts",
      "e": [
        "GoalTypeEnum",
        "GoalStatusEnum",
        "CreateGoalSchema",
        "UpdateGoalSchema",
        "ListGoalsQuerySchema",
        "GoalIdParamSchema",
        "GoalTrackingQuerySchema",
        "CreateGoalInput",
        "UpdateGoalInput",
        "ListGoalsQuery"
      ],
      "i": [
        "zod"
      ],
      "l": 50,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "ai-forecast.service": {
      "p": "apps/api/src/domains/planning/services/ai-forecast.service.ts",
      "e": [
        "ForecastProjection",
        "AIForecastResult",
        "AIForecastService"
      ],
      "i": [
        "@akount/db",
        "./seasonal-patterns.service"
      ],
      "l": 389,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "ForecastProjection": [
          "forecast.routes"
        ],
        "AIForecastResult": [
          "forecast.routes"
        ],
        "AIForecastService": [
          "forecast.routes"
        ]
      }
    },
    "budget-suggestions.service": {
      "p": "apps/api/src/domains/planning/services/budget-suggestions.service.ts",
      "e": [
        "BudgetSuggestion",
        "BudgetSuggestionService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 174,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "BudgetSuggestion": [
          "budget.routes"
        ],
        "BudgetSuggestionService": [
          "budget.routes"
        ]
      }
    },
    "budget-variance.service": {
      "p": "apps/api/src/domains/planning/services/budget-variance.service.ts",
      "e": [
        "BudgetVarianceResult",
        "BudgetVarianceDetail",
        "BudgetVarianceService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/logger"
      ],
      "l": 323,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "BudgetVarianceResult": [
          "budget.routes"
        ],
        "BudgetVarianceDetail": [
          "budget.routes"
        ],
        "BudgetVarianceService": [
          "budget.routes"
        ]
      }
    },
    "budget.service": {
      "p": "apps/api/src/domains/planning/services/budget.service.ts",
      "e": [
        "ListBudgetsParams",
        "PaginatedBudgets",
        "BudgetService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/logger"
      ],
      "l": 286,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/planning/services/__tests__/budget.service.test.ts",
        "testCount": 19
      },
      "d": "pln",
      "c": {
        "ListBudgetsParams": [
          "budget.routes"
        ],
        "PaginatedBudgets": [
          "budget.routes"
        ],
        "BudgetService": [
          "budget.routes"
        ]
      }
    },
    "cash-runway.service": {
      "p": "apps/api/src/domains/planning/services/cash-runway.service.ts",
      "e": [
        "CashRunwayResult",
        "CashRunwayService"
      ],
      "i": [
        "@akount/db",
        "../../../lib/logger"
      ],
      "l": 155,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "CashRunwayResult": [
          "forecast.routes"
        ],
        "CashRunwayService": [
          "forecast.routes"
        ]
      }
    },
    "forecast.service": {
      "p": "apps/api/src/domains/planning/services/forecast.service.ts",
      "e": [
        "ListForecastsParams",
        "PaginatedForecasts",
        "ForecastService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 161,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "ListForecastsParams": [
          "forecast.routes"
        ],
        "PaginatedForecasts": [
          "forecast.routes"
        ],
        "ForecastService": [
          "forecast.routes"
        ]
      }
    },
    "goal-templates": {
      "p": "apps/api/src/domains/planning/services/goal-templates.ts",
      "e": [
        "GoalTemplate",
        "GoalTemplateResult",
        "GoalTemplateService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 362,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "GoalTemplate": [
          "goal.routes"
        ],
        "GoalTemplateResult": [
          "goal.routes"
        ],
        "GoalTemplateService": [
          "goal.routes"
        ]
      }
    },
    "goal-tracking.service": {
      "p": "apps/api/src/domains/planning/services/goal-tracking.service.ts",
      "e": [
        "MilestoneEvent",
        "TrackingResult",
        "GoalTrackingService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 271,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "MilestoneEvent": [
          "goal.routes"
        ],
        "TrackingResult": [
          "goal.routes"
        ],
        "GoalTrackingService": [
          "goal.routes"
        ]
      }
    },
    "goal.service": {
      "p": "apps/api/src/domains/planning/services/goal.service.ts",
      "e": [
        "ListGoalsParams",
        "PaginatedGoals",
        "GoalService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 209,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/planning/services/__tests__/goal.service.test.ts",
        "testCount": 17
      },
      "d": "pln",
      "c": {
        "ListGoalsParams": [
          "goal.routes"
        ],
        "PaginatedGoals": [
          "goal.routes"
        ],
        "GoalService": [
          "goal.routes"
        ]
      }
    },
    "seasonal-patterns.service": {
      "p": "apps/api/src/domains/planning/services/seasonal-patterns.service.ts",
      "e": [
        "MonthlyDataPoint",
        "SeasonalAnalysis",
        "SeasonalPatternsService"
      ],
      "i": [
        "@akount/db"
      ],
      "l": 139,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "MonthlyDataPoint": [
          "forecast.routes",
          "ai-forecast.service"
        ],
        "SeasonalAnalysis": [
          "forecast.routes",
          "ai-forecast.service"
        ],
        "SeasonalPatternsService": [
          "forecast.routes",
          "ai-forecast.service"
        ]
      }
    },
    "budget-form": {
      "p": "apps/web/src/app/(dashboard)/planning/budgets/budget-form.tsx",
      "e": [
        "BudgetForm"
      ],
      "i": [
        "react",
        "@/lib/api/planning",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react"
      ],
      "l": 201,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "BudgetForm": [
          "budgets-list"
        ]
      }
    },
    "budgets-list": {
      "p": "apps/web/src/app/(dashboard)/planning/budgets/budgets-list.tsx",
      "e": [
        "BudgetsList"
      ],
      "i": [
        "react",
        "@/lib/api/planning",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@akount/ui",
        "lucide-react",
        "@/lib/utils/currency",
        "./budget-form",
        "../export-planning"
      ],
      "l": 250,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "error": {
      "p": "apps/web/src/app/(dashboard)/planning/goals/error.tsx",
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
      "d": "pln",
      "c": {}
    },
    "loading": {
      "p": "apps/web/src/app/(dashboard)/planning/loading.tsx",
      "e": [],
      "i": [
        "@/components/ui/skeleton"
      ],
      "l": 37,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "page": {
      "p": "apps/web/src/app/(dashboard)/planning/page.tsx",
      "e": [
        "metadata"
      ],
      "i": [
        "next",
        "next/link",
        "@/lib/api/planning",
        "@/lib/api/entities",
        "@/lib/entity-cookies",
        "@/lib/utils/currency",
        "@/components/ui/card",
        "@/components/ui/button",
        "@/components/ui/badge",
        "lucide-react"
      ],
      "l": 192,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "export-planning": {
      "p": "apps/web/src/app/(dashboard)/planning/export-planning.tsx",
      "e": [
        "ExportPlanningButton"
      ],
      "i": [
        "@/components/ui/button",
        "lucide-react",
        "@/lib/api/planning"
      ],
      "l": 123,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "ExportPlanningButton": [
          "budgets-list",
          "goals-list"
        ]
      }
    },
    "forecast-form": {
      "p": "apps/web/src/app/(dashboard)/planning/forecasts/forecast-form.tsx",
      "e": [
        "ForecastForm"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react"
      ],
      "l": 388,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "ForecastForm": [
          "forecasts-list"
        ]
      }
    },
    "forecasts-list": {
      "p": "apps/web/src/app/(dashboard)/planning/forecasts/forecasts-list.tsx",
      "e": [
        "ForecastsList"
      ],
      "i": [
        "react",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@akount/ui",
        "@/lib/utils/currency",
        "./forecast-form",
        "./scenario-comparison"
      ],
      "l": 400,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "scenario-comparison": {
      "p": "apps/web/src/app/(dashboard)/planning/forecasts/scenario-comparison.tsx",
      "e": [
        "ScenarioComparison"
      ],
      "i": [
        "react",
        "lucide-react",
        "@akount/ui",
        "@/lib/utils/currency",
        "@/lib/api/planning"
      ],
      "l": 172,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "ScenarioComparison": [
          "forecasts-list"
        ]
      }
    },
    "goal-form": {
      "p": "apps/web/src/app/(dashboard)/planning/goals/goal-form.tsx",
      "e": [
        "GoalForm"
      ],
      "i": [
        "react",
        "@/lib/api/planning",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "lucide-react"
      ],
      "l": 237,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {
        "GoalForm": [
          "goals-list"
        ]
      }
    },
    "goal-trajectory": {
      "p": "apps/web/src/app/(dashboard)/planning/goals/goal-trajectory.tsx",
      "e": [
        "GoalTrajectory"
      ],
      "i": [
        "@/lib/api/planning",
        "@/lib/utils/currency"
      ],
      "l": 141,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "goals-list": {
      "p": "apps/web/src/app/(dashboard)/planning/goals/goals-list.tsx",
      "e": [
        "GoalsList"
      ],
      "i": [
        "react",
        "@/lib/api/planning",
        "@/lib/api/client-browser",
        "@/components/ui/button",
        "@/components/ui/badge",
        "@akount/ui",
        "lucide-react",
        "@/lib/utils/currency",
        "./goal-form",
        "../export-planning"
      ],
      "l": 235,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    },
    "layout": {
      "p": "apps/web/src/app/(dashboard)/planning/layout.tsx",
      "e": [],
      "i": [],
      "l": 10,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pln",
      "c": {}
    }
  },
  "d": {
    "pln": {
      "n": 40,
      "l": 6290
    }
  },
  "p": {
    "L": [
      "budget.routes",
      "forecast.routes",
      "goal.routes"
    ],
    "S": [
      "ai-forecast.service",
      "budget-suggestions.service",
      "budget-variance.service",
      "budget.service",
      "cash-runway.service",
      "forecast.service",
      "goal-templates",
      "goal-tracking.service",
      "goal.service",
      "seasonal-patterns.service"
    ],
    "P": [
      "ai-forecast.service",
      "budget-suggestions.service",
      "budget-variance.service",
      "budget.service",
      "cash-runway.service",
      "forecast.service",
      "goal-templates",
      "goal-tracking.service",
      "goal.service",
      "seasonal-patterns.service"
    ],
    "T": [
      "budget-variance.service",
      "budget.service",
      "forecast.service",
      "goal.service"
    ],
    "C": [
      "budget-form",
      "budgets-list",
      "error",
      "export-planning",
      "forecast-form",
      "forecasts-list",
      "scenario-comparison",
      "goal-form",
      "goal-trajectory",
      "goals-list"
    ]
  },
  "v": {}
}
CODE-INDEX:END -->

---

## Quick Stats

**Files by domain:**
- pln: 40 files, 6,290 LOC

**Patterns found:**
- L: 3 files
- S: 10 files
- P: 10 files
- T: 4 files
- C: 10 files

**Violations found:**
- None ✅

---

_Generated by: .claude/scripts/regenerate-code-index.js_
