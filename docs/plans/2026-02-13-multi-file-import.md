# Multi-File Import Upload

## Context

After uploading one PDF/CSV, there's no way to upload more files without fully resetting the wizard. Users importing multiple bank statements (catching up on months, or importing across accounts) must repeat the full cycle per file. The brainstorm chose a multi-file picker approach with per-file account assignment and combined results.

**Scope:** Frontend-only. Backend handles sequential single-file uploads already (100 req/min rate limit, 10MB/file, synchronous responses). No API changes needed.

**Brainstorm:** `docs/brainstorms/2026-02-13-multi-file-import-brainstorm.md`

---

## Implementation Plan

### Step 1: Create shared types file

**New file:** `apps/web/src/components/import/types.ts` (~40 lines)

- `UploadFileItem` — `{ id, file, accountId, status: 'pending'|'uploading'|'success'|'error', result?, error? }`
- `BatchImportResult` — `{ files: [...per-file stats], aggregateStats: { totalFiles, successFiles, totalTransactions, imported, duplicates, errors } }`
- Move `ImportAccount` and `ImportResult` interfaces here from ImportUploadForm (shared across components)

### Step 2: Create FileListEditor component

**New file:** `apps/web/src/components/import/FileListEditor.tsx` (~170 lines)

Displays selected files as a list. Each row shows:
- File icon + name + size (mono) + type badge (PDF/CSV)
- Account dropdown (glass styling, pre-filled with last selected account)
- Remove button (ghost, red on hover)
- "Add more files" button at bottom

Props: `files, accounts, onAccountChange, onRemoveFile, disabled`

### Step 3: Create UploadProgressList component

**New file:** `apps/web/src/components/import/UploadProgressList.tsx` (~130 lines)

Real-time per-file upload status. Each row shows:
- File name + status icon (gray circle=pending, amber spinner=uploading, green check=success, red X=error)
- Inline stats on success: "12 imported, 2 duplicates"
- Error message on failure
- Current file gets subtle amber border glow

Props: `files, currentIndex`

### Step 4: Create BatchImportResults component

**New file:** `apps/web/src/components/import/BatchImportResults.tsx` (~190 lines)

Combined results screen replacing ImportConfirmation for multi-file:
- Success banner with aggregate summary ("3 files imported")
- 4-stat grid: total transactions, imported (green), duplicates (amber), errors (red)
- Per-file breakdown table: name + account + status badge + stats
- Actions: "View Transactions" (primary), "Add More Files" (secondary), "Import History" (ghost link)

Props: `batchResult, accounts, onAddMoreFiles`

### Step 5: Refactor ImportUploadForm for multi-file

**Modify:** `apps/web/src/components/import/ImportUploadForm.tsx` (target ~250 lines, down from 516)

**State changes:**
- `selectedFile: File | null` → `files: UploadFileItem[]`
- `selectedAccountId: string` → `lastSelectedAccountId: string` (for pre-fill)
- Add `batchResult: BatchImportResult | null`
- Remove `csvColumns`, `csvPreviewRows`, `columnMappings` from top-level state (handled per-file during upload)

**Wizard step changes:**
- `'select'` — Multi-file drop zone + `<FileListEditor>` below it. File input gets `multiple` attribute. Drag-and-drop reads `Array.from(e.dataTransfer.files)`. "Import All (N files)" button.
- `'map'` — **Removed from wizard.** CSV auto-detection happens inline during upload using existing `readCsvHeaders()` + `detectMappings()` from ColumnMappingEditor.tsx.
- `'uploading'` — `<UploadProgressList>` replaces single spinner.
- `'results'` — `<BatchImportResults>` replaces `<ImportConfirmation>`.

**Upload logic (`handleBatchUpload`):**
- Loop sequentially through `files[]`
- For each file: update status to 'uploading', get auth token, auto-detect CSV mappings if needed, build FormData (accountId BEFORE file), POST, update status to success/error
- On error: log error on that file, continue with next
- After loop: build `BatchImportResult` from all file statuses, transition to 'results'

**Validation before upload:**
- All files must have an account assigned
- Max 10 files enforced at selection time
- 10MB per file enforced at selection time

### Step 6: Update ImportUploadForm type

**Simplify wizard type:** `type WizardStep = 'select' | 'uploading' | 'results'` (remove 'map')

### Step 7: Keep existing components unchanged

- `ImportConfirmation.tsx` — Keep as-is (may be useful for single-file edge cases or future use)
- `ColumnMappingEditor.tsx` — Keep as-is (its exported `readCsvHeaders` and `detectMappings` are called during upload)
- `ImportPreviewTable.tsx` — Keep as-is
- `ImportHistoryClient.tsx` — Keep as-is
- `apps/web/src/app/(dashboard)/banking/import/page.tsx` — No changes needed (already passes accounts)

---

## File Summary

| File | Action | Est. Lines |
|------|--------|-----------|
| `components/import/types.ts` | New | ~40 |
| `components/import/FileListEditor.tsx` | New | ~170 |
| `components/import/UploadProgressList.tsx` | New | ~130 |
| `components/import/BatchImportResults.tsx` | New | ~190 |
| `components/import/ImportUploadForm.tsx` | Refactor | ~250 (was 516) |

**Net change:** +264 lines across 5 files, well-decomposed (all under 250 lines).

---

## Key Patterns to Reuse

- `readCsvHeaders(file)` and `detectMappings(columns)` from `ColumnMappingEditor.tsx` — auto-detect CSV column mappings
- `window.Clerk.session.getToken()` for auth — same pattern as current ImportUploadForm
- FormData field ordering: accountId BEFORE file (Fastify multipart gotcha, documented in `docs/solutions/bugs/2026-02-12-pdf-import-pipeline.md`)
- Glass card styling from existing ImportConfirmation (stat grid, badges, table)
- `cuid()` or `crypto.randomUUID()` for file item IDs

---

## Verification

1. **Manual test — multi-PDF same account:** Select 2-3 PDFs, assign same account, upload. Expect combined results with per-file breakdown.
2. **Manual test — mixed files different accounts:** Select 1 PDF + 1 CSV for different accounts. Expect auto-detect CSV mappings, both upload successfully.
3. **Manual test — error resilience:** Upload valid PDF + invalid file. Expect first succeeds, second shows error, results show both.
4. **Manual test — max files:** Try adding 11 files. Expect "Maximum 10 files" error.
5. **Manual test — add more:** From results, click "Add More Files", verify returns to empty file picker.
6. **Accessibility:** Tab through file list, dropdowns, buttons. Screen reader announces file status changes.