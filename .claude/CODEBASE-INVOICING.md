# INVOICING Code Index

**Auto-generated:** 2026-02-28
**Files indexed:** 19
**Estimated tokens:** ~2,985

---

<!-- Legend: .claude/code-index-legend.md -->

---

<!-- CODE-INDEX:START (auto-generated, do not edit manually)
{
  "_": "2026-02-28",
  "n": 19,
  "f": {
    "bills": {
      "p": "apps/api/src/domains/invoicing/routes/bills.ts",
      "e": [
        "billRoutes"
      ],
      "i": [
        "fastify",
        "zod",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../../../middleware/rate-limit",
        "../services/bill.service",
        "../../accounting/services/document-posting.service",
        "../../accounting/errors"
      ],
      "l": 320,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "inv",
      "c": {}
    },
    "invoices": {
      "p": "apps/api/src/domains/invoicing/routes/invoices.ts",
      "e": [
        "invoiceRoutes"
      ],
      "i": [
        "fastify",
        "zod",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../../../middleware/rate-limit",
        "../services/invoice.service",
        "../../accounting/services/document-posting.service",
        "../../accounting/errors"
      ],
      "l": 391,
      "pt": "L",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "inv",
      "c": {
        "invoiceRoutes": [
          "page"
        ]
      }
    },
    "payments": {
      "p": "apps/api/src/domains/invoicing/routes/payments.ts",
      "e": [
        "paymentRoutes"
      ],
      "i": [
        "fastify",
        "zod",
        "../../../middleware/auth",
        "../../../middleware/tenant",
        "../../../middleware/validation",
        "../../../middleware/rbac",
        "../services/payment.service",
        "../../accounting/services/document-posting.service",
        "../../accounting/errors"
      ],
      "l": 274,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "inv",
      "c": {}
    },
    "bill.schema": {
      "p": "apps/api/src/domains/invoicing/schemas/bill.schema.ts",
      "e": [
        "BillLineSchema",
        "CreateBillSchema",
        "UpdateBillSchema",
        "ListBillsSchema",
        "CreateBillInput",
        "UpdateBillInput",
        "ListBillsInput",
        "BillLine"
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
      "d": "inv",
      "c": {}
    },
    "invoice.schema": {
      "p": "apps/api/src/domains/invoicing/schemas/invoice.schema.ts",
      "e": [
        "InvoiceLineSchema",
        "CreateInvoiceSchema",
        "UpdateInvoiceSchema",
        "ListInvoicesSchema",
        "CreateInvoiceInput",
        "UpdateInvoiceInput",
        "ListInvoicesInput",
        "InvoiceLine"
      ],
      "i": [
        "zod"
      ],
      "l": 61,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "inv",
      "c": {}
    },
    "payment.schema": {
      "p": "apps/api/src/domains/invoicing/schemas/payment.schema.ts",
      "e": [
        "CreatePaymentSchema",
        "UpdatePaymentSchema",
        "ListPaymentsSchema",
        "AllocatePaymentSchema",
        "PostPaymentAllocationSchema",
        "CreatePaymentInput",
        "UpdatePaymentInput",
        "ListPaymentsInput",
        "AllocatePaymentInput",
        "PostPaymentAllocationInput"
      ],
      "i": [
        "zod"
      ],
      "l": 60,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "inv",
      "c": {}
    },
    "bill.service": {
      "p": "apps/api/src/domains/invoicing/services/bill.service.ts",
      "e": [
        "createBill",
        "listBills",
        "getBill",
        "updateBill",
        "deleteBill",
        "getBillStats",
        "approveBill",
        "cancelBill",
        "markBillOverdue",
        "applyPaymentToBill"
      ],
      "i": [
        "@akount/db",
        "../../../middleware/tenant.js"
      ],
      "l": 484,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/invoicing/services/__tests__/bill.service.test.ts",
        "testCount": 46
      },
      "d": "inv",
      "c": {
        "createBill": [
          "bills",
          "payment.service"
        ],
        "listBills": [
          "bills",
          "payment.service"
        ],
        "getBill": [
          "bills",
          "payment.service"
        ],
        "updateBill": [
          "bills",
          "payment.service"
        ],
        "deleteBill": [
          "bills",
          "payment.service"
        ],
        "getBillStats": [
          "bills",
          "payment.service"
        ],
        "approveBill": [
          "bills",
          "payment.service"
        ],
        "cancelBill": [
          "bills",
          "payment.service"
        ],
        "markBillOverdue": [
          "bills",
          "payment.service"
        ],
        "applyPaymentToBill": [
          "bills",
          "payment.service"
        ]
      }
    },
    "invoice.service": {
      "p": "apps/api/src/domains/invoicing/services/invoice.service.ts",
      "e": [
        "createInvoice",
        "listInvoices",
        "getInvoice",
        "updateInvoice",
        "deleteInvoice",
        "getInvoiceStats",
        "sendInvoice",
        "getInvoicePdf",
        "cancelInvoice",
        "voidInvoice"
      ],
      "i": [
        "@akount/db",
        "../../../middleware/tenant.js",
        "./pdf.service",
        "../../../lib/email",
        "../../accounting/services/journal-entry.service"
      ],
      "l": 639,
      "pt": "TSP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/invoicing/services/__tests__/invoice.service.test.ts",
        "testCount": 46
      },
      "d": "inv",
      "c": {
        "createInvoice": [
          "invoices",
          "payment.service"
        ],
        "listInvoices": [
          "invoices",
          "payment.service"
        ],
        "getInvoice": [
          "invoices",
          "payment.service"
        ],
        "updateInvoice": [
          "invoices",
          "payment.service"
        ],
        "deleteInvoice": [
          "invoices",
          "payment.service"
        ],
        "getInvoiceStats": [
          "invoices",
          "payment.service"
        ],
        "sendInvoice": [
          "invoices",
          "payment.service"
        ],
        "getInvoicePdf": [
          "invoices",
          "payment.service"
        ],
        "cancelInvoice": [
          "invoices",
          "payment.service"
        ],
        "voidInvoice": [
          "invoices",
          "payment.service"
        ]
      }
    },
    "payment.service": {
      "p": "apps/api/src/domains/invoicing/services/payment.service.ts",
      "e": [
        "createPayment",
        "getPayment",
        "listPayments",
        "updatePayment",
        "deletePayment",
        "allocatePayment",
        "deallocatePayment"
      ],
      "i": [
        "@akount/db",
        "../../../middleware/tenant.js",
        "./invoice.service",
        "./bill.service"
      ],
      "l": 295,
      "pt": "SP",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/invoicing/services/__tests__/payment.service.test.ts",
        "testCount": 22
      },
      "d": "inv",
      "c": {
        "createPayment": [
          "payments"
        ],
        "getPayment": [
          "payments"
        ],
        "listPayments": [
          "payments"
        ],
        "updatePayment": [
          "payments"
        ],
        "deletePayment": [
          "payments"
        ],
        "allocatePayment": [
          "payments"
        ],
        "deallocatePayment": [
          "payments"
        ]
      }
    },
    "pdf.service": {
      "p": "apps/api/src/domains/invoicing/services/pdf.service.ts",
      "e": [
        "generateInvoicePdf"
      ],
      "i": [
        "pdfkit"
      ],
      "l": 363,
      "pt": "",
      "v": [],
      "t": {
        "exists": true,
        "file": "apps/api/src/domains/invoicing/services/__tests__/pdf.service.test.ts",
        "testCount": 9
      },
      "d": "inv",
      "c": {
        "generateInvoicePdf": [
          "invoice.service"
        ]
      }
    },
    "error": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/error.tsx",
      "e": [],
      "i": [
        "react",
        "@/components/ui/card",
        "@/components/ui/button",
        "lucide-react"
      ],
      "l": 47,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "invoice-actions": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/[id]/invoice-actions.tsx",
      "e": [
        "InvoiceActions"
      ],
      "i": [
        "react",
        "next/navigation",
        "next/dynamic",
        "next/link",
        "@/components/ui/button",
        "@/lib/api/invoices",
        "./actions",
        "lucide-react",
        "sonner"
      ],
      "l": 338,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "loading": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/loading.tsx",
      "e": [],
      "i": [
        "@/components/ui/skeleton"
      ],
      "l": 88,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "page": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/page.tsx",
      "e": [
        "metadata"
      ],
      "i": [
        "next",
        "@/components/shared/StatsGrid",
        "@/components/shared/AgingBar",
        "@/components/business/BillsTable",
        "./invoices-list-client",
        "@/components/business/InvoicingActions",
        "@/lib/api/invoices",
        "@/lib/api/bills",
        "@/lib/api/clients",
        "@/lib/api/vendors"
      ],
      "l": 186,
      "pt": "",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "invoice-scan-upload": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/invoice-scan-upload.tsx",
      "e": [
        "InvoiceScanUpload"
      ],
      "i": [
        "react",
        "react-dropzone",
        "@/hooks/use-job-stream",
        "@/lib/api/client-browser",
        "@/lib/utils/currency",
        "@akount/ui",
        "sonner",
        "lucide-react"
      ],
      "l": 489,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {}
    },
    "invoices-list-client": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/invoices-list-client.tsx",
      "e": [
        "InvoicesListClient"
      ],
      "i": [
        "react",
        "@/lib/api/invoices",
        "@/components/business/InvoiceTable",
        "@/components/ui/button",
        "@/components/ui/input",
        "@/components/ui/label",
        "@/components/ui/card",
        "lucide-react",
        "../actions"
      ],
      "l": 217,
      "pt": "C",
      "v": [],
      "t": {
        "exists": false
      },
      "d": "pg",
      "c": {
        "InvoicesListClient": [
          "page"
        ]
      }
    }
  },
  "d": {
    "inv": {
      "n": 10,
      "l": 2951
    },
    "pg": {
      "n": 9,
      "l": 1704
    }
  },
  "p": {
    "L": [
      "bills",
      "invoices"
    ],
    "T": [
      "bill.service",
      "invoice.service"
    ],
    "S": [
      "bill.service",
      "invoice.service",
      "payment.service"
    ],
    "P": [
      "bill.service",
      "invoice.service",
      "payment.service"
    ],
    "C": [
      "error",
      "invoice-actions",
      "invoice-scan-upload",
      "invoices-list-client"
    ]
  },
  "v": {}
}
CODE-INDEX:END -->

---

## Quick Stats

**Files by domain:**
- inv: 10 files, 2,951 LOC
- pg: 9 files, 1,704 LOC

**Patterns found:**
- L: 2 files
- T: 2 files
- S: 3 files
- P: 3 files
- C: 4 files

**Violations found:**
- None ✅

---

_Generated by: .claude/scripts/regenerate-code-index.js_
