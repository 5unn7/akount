---
title: "PDF Import Pipeline — 5 Bugs in One Flow"
category: "bugs"
date: 2026-02-12
severity: high
module: "Banking > Import (frontend + backend)"
commit: 53869c2
---

# PDF Import Pipeline — 5 Bugs in One Flow

The PDF bank statement import was completely non-functional. Five distinct bugs prevented the upload from reaching the parser, and a sixth issue (date format) prevented any transactions from being extracted.

## Problem

Uploading a PDF bank statement from the Import Transactions page failed with `accountId is required`, even though an account was selected in the dropdown.

## Root Causes & Solutions

### Bug 1: Wrong API Endpoint

**Symptom:** 404 or wrong handler
**Cause:** Frontend called `/api/import/upload` (legacy route) instead of `/api/banking/imports/pdf` (new route).

```typescript
// BEFORE (wrong)
const response = await fetch(`${apiUrl}/api/import/upload`, { ... });

// AFTER (correct)
const endpoint = isCSV ? '/api/banking/imports/csv' : '/api/banking/imports/pdf';
const response = await fetch(`${apiUrl}${endpoint}`, { ... });
```

**File:** `apps/web/src/components/import/ImportUploadForm.tsx`

---

### Bug 2: Missing Auth Token

**Symptom:** 401 Unauthorized
**Cause:** The upload request didn't include the Clerk JWT. The server-side `apiClient` handles auth automatically, but this is a client component using raw `fetch`.

```typescript
const clerk = (window as any).Clerk;
const token = await clerk?.session?.getToken();

const response = await fetch(url, {
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});
```

**Lesson:** Client components using `fetch` directly must manually get tokens from `window.Clerk`. The `apiFetch` helper in `client-browser.ts` does this, but can't be used for FormData uploads because it sets `Content-Type: application/json`.

---

### Bug 3: FormData Field Ordering (Fastify Multipart)

**Symptom:** `accountId is required` (400) — the most confusing bug
**Cause:** Fastify's `@fastify/multipart` processes the multipart stream sequentially. When `request.file()` is called, it reads until it finds the file — any form fields that appear **after** the file in the stream are never read.

```typescript
// BEFORE (broken — file before fields)
formData.append('file', selectedFile);
formData.append('accountId', selectedAccountId);  // Never read by Fastify!

// AFTER (working — fields before file)
formData.append('accountId', selectedAccountId);  // Read first
formData.append('columnMappings', JSON.stringify(mappings));
formData.append('file', selectedFile);  // Read last
```

**This is the key gotcha.** The browser's FormData API preserves insertion order, and Fastify's multipart parser is a streaming parser that processes entries sequentially. Once it encounters the file, `data.fields` won't contain any fields appended after it.

---

### Bug 4: pdf-parse ESM/CJS Crash

**Symptom:** `pdfParse is not a function` at runtime
**Cause:** The `pdf-parse` npm package has broken ESM/CJS interop. Four different import strategies all failed:

```typescript
// All of these FAIL with tsx runtime:
import pdfParse from 'pdf-parse';                    // Not a function
const pdfParse = require('pdf-parse');                // ESM context
const mod = await import('pdf-parse');                // .default is undefined
import * as pdfParseImport from 'pdf-parse';          // Still broken
```

**Solution:** Replaced `pdf-parse` entirely with `pdfjs-dist` (Mozilla's PDF.js):

```typescript
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}
```

Must use dynamic import — static import crashes the server on startup. Must use `/legacy/` build for Node.js (no worker threads).

**File:** `apps/api/src/domains/banking/services/parser.service.ts`

---

### Bug 5: CIBC Date Format Not Recognized

**Symptom:** "No transactions found in PDF" — text extracted successfully but 0 transactions parsed
**Cause:** Regex patterns expected `MM/DD/YYYY` dates, but CIBC statements use `Mon DD` format (e.g., "Aug 08").

**CIBC line format:**
```
Aug 08  Aug 11  PAYMENT THANK YOU  5,390.44
```

**Solution:** Added bank-specific regex patterns:

```typescript
// Pattern A: CIBC — "Mon DD  Mon DD  Description  Amount"
const cibcPattern = /^([A-Z][a-z]{2})\s+(\d{2})\s+([A-Z][a-z]{2})\s+(\d{2})\s+(.+?)\s{2,}([\d,]+\.\d{2})\s*$/;

// Pattern A2: Single date variant
const cibcSinglePattern = /^([A-Z][a-z]{2})\s+(\d{2})\s+(.+?)\s{2,}([\d,]+\.\d{2})\s*$/;
```

Also added statement year detection from header text (e.g., "August 5 to September 4, 2025").

---

### Bug 6: Response Format Mismatch

**Symptom:** Import appeared to succeed but showed 0 transactions
**Cause:** Frontend expected `data.summary.total` (legacy format) but new endpoint returns `data.stats.total`.

```typescript
// BEFORE
totalRows: data.summary?.totalTransactions ?? 0,

// AFTER
totalRows: data.stats?.total ?? 0,
processedRows: data.stats?.imported ?? 0,
duplicateRows: data.stats?.duplicates ?? 0,
errorRows: data.stats?.skipped ?? 0,
```

---

## Prevention

1. **FormData ordering:** Always append file LAST in FormData when targeting Fastify multipart endpoints. Add a code comment as a reminder.
2. **PDF libraries:** Use `pdfjs-dist` (well-maintained by Mozilla) over `pdf-parse` (abandoned, broken ESM). Always use dynamic import for Node.js PDF libraries.
3. **Bank format support:** Build a pattern registry for bank statement formats. Log unmatched lines to discover new formats. Consider bank detection from PDF metadata.
4. **Integration testing:** The import flow spans frontend form → API route → parser → database. A single unit test on the parser wouldn't have caught bugs 1-3. Need end-to-end smoke test for file upload flows.
5. **Response contracts:** When endpoints change, update both backend response shape AND frontend parsing together.

## Time Investment

- Investigation + fix: ~3 hours (5 bugs in sequence, each revealed the next)
- Documentation: ~10 minutes
- **Estimated savings per reuse: 2.5 hours** (knowing the FormData ordering + pdfjs-dist pattern alone saves most of the time)
