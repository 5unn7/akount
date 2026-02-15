
# Multi-File Import Brainstorm

**Date:** 2026-02-13
**Status:** Brainstormed

## Problem

After uploading one PDF/CSV, there's no way to upload more files without fully resetting the wizard. Users importing multiple bank statements (common when catching up on months of data, or importing across several accounts) must repeat the full select → upload → results cycle for each file. This is tedious.

**Who:** All users importing bank data. Especially new users onboarding with months of history.

## Chosen Approach: Multi-File Picker with Combined Results

Select multiple files at once (or add more after picking), assign each to an account, upload sequentially, see combined results.

### Key Features

1. **Multi-file selection** — file picker accepts `multiple` attribute, drag-and-drop accepts multiple files
2. **Per-file account assignment** — each file gets its own account dropdown (default: last selected account, since same-account batches are common)
3. **Sequential upload with progress** — files upload one at a time with a progress list showing status per file (pending → uploading → done/error)
4. **Combined results** — after all uploads finish, show aggregated stats (total transactions, duplicates, errors) with per-file breakdown
5. **Error resilience** — if one file fails, continue with the rest; show errors inline per file
6. **"Add more" from results** — results screen has "Add More Files" that returns to picker without losing the session history

### UX Flow

```
Step 1: Select files + assign accounts
  ┌─────────────────────────────────┐
  │ [Drop files or browse]          │
  │                                 │
  │ CIBC_Aug.pdf  → CIBC MC (CAD)  │
  │ CIBC_Sep.pdf  → CIBC MC (CAD)  │
  │ TD_Aug.csv    → TD Chequing    │
  │              [+ Add more files] │
  │                                 │
  │ [Import All (3 files)]          │
  └─────────────────────────────────┘

Step 2: Uploading (progress)
  ┌─────────────────────────────────┐
  │ Importing 3 files...            │
  │                                 │
  │ ✅ CIBC_Aug.pdf   12 txns      │
  │ ⏳ CIBC_Sep.pdf   uploading... │
  │ ○  TD_Aug.csv     pending      │
  └─────────────────────────────────┘

Step 3: Results (combined)
  ┌─────────────────────────────────┐
  │ ✅ Import Complete              │
  │                                 │
  │ 3 files  │  47 txns  │  2 dups │
  │                                 │
  │ CIBC_Aug.pdf  ✅ 12 imported   │
  │ CIBC_Sep.pdf  ✅ 18 imported   │
  │ TD_Aug.csv    ✅ 17 imported   │
  │                                 │
  │ [View Transactions] [Add More] │
  └─────────────────────────────────┘
```

### CSV Handling

CSV files need column mapping (Step 2 in current wizard). Two options:

- **Option A:** Pop a mapping modal per CSV file before uploading (interrupts batch flow)
- **Option B:** Auto-detect mappings, show mapping only if detection confidence is low

**Decision:** Option B — auto-detect first, only prompt if ambiguous. The `detectColumnMappings()` function already exists. Most bank CSVs have standard headers.

### Constraints

- Backend processes one file at a time (no batch endpoint needed — sequential `POST /api/banking/imports/{csv|pdf}` calls)
- Each file must be associated with exactly one account
- Max 10 files per batch (prevent abuse, keep UX manageable)
- Max 10MB per file (existing limit)
- PDF files skip column mapping (existing behavior)

### Edge Cases

- Mixed file types (2 PDFs + 1 CSV) — handled, each takes its own upload path
- Same file uploaded twice — backend's duplicate detection catches this per-transaction
- One file fails mid-batch — show error for that file, continue with rest
- User navigates away mid-upload — warn with beforeunload dialog
- Very large batch (10 files) — show estimated time, allow cancel

## Alternatives Considered

- **Queue-based (add one by one):** More complex UX without clear benefit over multi-select. Users would have to repeatedly click "add file" which is what they're trying to avoid.
- **Loop faster (auto-return to picker):** Quickest to build but doesn't solve the core pain — still one-at-a-time mental model. Doesn't show combined results.

## Open Questions

- [ ] Should we remember the last-used account per session to pre-fill the dropdown? // We can give some assistance with automation. 
- [ ] Do we need a "save as template" for recurring imports (same bank, same mapping)? //Nope, I dont see the use of it now..

## Next Steps

- [ ] Create implementation plan: `/processes:plan multi-file-import`
