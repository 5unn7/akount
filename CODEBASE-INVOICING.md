# INVOICING Code Index

**Auto-generated:** 2026-02-27
**Files indexed:** 18
**Estimated tokens:** ~1,934

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
  "n": 18,
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "inv"
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
      "d": "pg"
    },
    "invoice-actions": {
      "p": "apps/web/src/app/(dashboard)/business/invoices/[id]/invoice-actions.tsx",
      "e": [
        "InvoiceActions"
      ],
      "i": [
        "react",
        "next/navigation",
        "next/link",
        "@/components/ui/button",
        "@/lib/api/invoices",
        "./actions",
        "lucide-react",
        "sonner",
        "@/components/business/InvoiceForm",
        "@/components/business/PaymentForm"
      ],
      "l": 330,
      "pt": "C",
      "v": [],
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
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
      "d": "pg"
    }
  },
  "d": {
    "inv": {
      "n": 10,
      "l": 2951
    },
    "pg": {
      "n": 8,
      "l": 1207
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
- pg: 8 files, 1,207 LOC

**Patterns found:**
- L: 2 files
- T: 2 files
- S: 3 files
- P: 3 files
- C: 3 files

**Violations found:**
- None ✅

---

_Generated by: .claude/scripts/regenerate-code-index.js_
