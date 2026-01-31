# Bank Import Feature - Test Plan

**Date:** 2026-01-30
**Status:** Manual Testing (No test framework configured)
**Coverage:** CSV Parsing, Categorization, Duplication, Account Matching

---

## Test Environment Setup Needed

### Missing Dependencies
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react
npm install --save-dev supertest @types/supertest  # For API testing
npm install --save-dev msw  # For mocking external APIs
```

### Test Script Needed
Add to `apps/api/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 1. Parser Service Tests

### CSV Parsing Tests

#### Test Case 1.1: Valid CSV with Standard Format
**Input:**
```csv
Date,Description,Amount
2026-01-15,Starbucks Coffee,$12.50
2026-01-16,Shell Gas Station,$45.00
```

**Expected:**
- ✅ Parses 2 transactions
- ✅ Auto-detects column mappings
- ✅ Converts amounts to cents (1250, 4500)
- ✅ Generates unique tempIds

**Test:**
```typescript
describe('parseCSV', () => {
  it('should parse valid CSV with standard format', () => {
    const csv = `Date,Description,Amount
2026-01-15,Starbucks Coffee,12.50
2026-01-16,Shell Gas Station,45.00`;

    const buffer = Buffer.from(csv, 'utf-8');
    const result = parseCSV(buffer);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: '2026-01-15',
      description: 'Starbucks Coffee',
      amount: 1250,
    });
  });
});
```

#### Test Case 1.2: Debit/Credit Column Format
**Input:**
```csv
Date,Description,Debit,Credit,Balance
2026-01-15,Shell Gas,45.00,,955.00
2026-01-16,Payroll Deposit,,2500.00,3455.00
```

**Expected:**
- ✅ Handles debit as negative
- ✅ Handles credit as positive
- ✅ Captures balance

#### Test Case 1.3: Date Format Variations
**Test Dates:**
- `2026-01-15` (ISO)
- `01/15/2026` (MM/DD/YYYY)
- `15/01/2026` (DD/MM/YYYY with format hint)
- `1/5/26` (Short year)

**Expected:**
- ✅ All formats parse correctly
- ✅ 2-digit years handled (26 → 2026)

#### Test Case 1.4: Amount Format Variations
**Test Amounts:**
- `$1,234.56` (Currency symbol, commas)
- `(45.00)` (Parentheses for negative)
- `-123.45` (Negative sign)
- `€100.00` (Euro symbol)

**Expected:**
- ✅ Removes currency symbols
- ✅ Removes commas
- ✅ Handles negatives (both `-` and `()`)
- ✅ Converts to cents

#### Test Case 1.5: Edge Cases
**Scenarios:**
- Empty CSV → Error: "CSV file contains no data rows"
- Invalid date → Error: "Invalid date: ..."
- Invalid amount → Error: "Invalid amount: ..."
- Missing required columns → Auto-detect fallback

---

## 2. Categorization Service Tests

### Keyword Matching Tests

#### Test Case 2.1: Common Merchants
**Transactions:**
```typescript
[
  { description: 'STARBUCKS #1234', amount: 1250 },
  { description: 'UBER TRIP 01/15', amount: 1800 },
  { description: 'AMAZON.COM ORDER', amount: 4500 },
]
```

**Expected:**
- ✅ Starbucks → "Meals & Entertainment" (confidence: 85%)
- ✅ Uber → "Transportation" (confidence: 85%)
- ✅ Amazon → "Office Supplies" (confidence: 85%)

#### Test Case 2.2: No Match
**Transaction:**
```typescript
{ description: 'OBSCURE MERCHANT NAME', amount: 1000 }
```

**Expected:**
- ✅ categoryId: null
- ✅ confidence: 0
- ✅ matchReason: "No match found"

#### Test Case 2.3: Category Exists in Tenant
**Setup:**
- Tenant has category "Meals & Entertainment"
- Transaction: "Starbucks Coffee"

**Expected:**
- ✅ Returns existing category ID
- ✅ Uses tenant's category name (not default)

#### Test Case 2.4: Category Missing in Tenant
**Setup:**
- Tenant has NO "Meals & Entertainment" category
- Transaction: "Starbucks Coffee"

**Expected:**
- ✅ categoryId: null
- ✅ categoryName: "Meals & Entertainment" (suggestion)
- ✅ matchReason: "category not found in your account"

#### Test Case 2.5: Batch Categorization Performance
**Input:** 1000 transactions

**Expected:**
- ✅ Single DB query for all categories
- ✅ No N+1 queries
- ✅ Completes in < 2 seconds

---

## 3. Duplication Service Tests

### Database Duplicate Detection

#### Test Case 3.1: Exact Duplicate
**Existing Transaction:**
- Date: 2026-01-15
- Description: "Starbucks Coffee"
- Amount: 1250 cents

**Imported Transaction:**
- Date: 2026-01-15
- Description: "Starbucks Coffee"
- Amount: 1250 cents

**Expected:**
- ✅ isDuplicate: true
- ✅ confidence: 100
- ✅ matchReason: "Same date, Exact amount, Description exact match"

#### Test Case 3.2: ±1 Day, Same Amount
**Existing:** 2026-01-15, "Shell Gas", $45.00
**Imported:** 2026-01-16, "Shell Gas", $45.00

**Expected:**
- ✅ isDuplicate: true (confidence: 88 = 30+40+18)
- ✅ matchReason: "±1 day, Exact amount, Description very similar"

#### Test Case 3.3: Different Amount
**Existing:** 2026-01-15, "Starbucks", $12.50
**Imported:** 2026-01-15, "Starbucks", $15.00

**Expected:**
- ✅ isDuplicate: false
- ✅ confidence: 0 (skipped due to amount mismatch)

#### Test Case 3.4: Similar Description
**Existing:** "SHELL GAS STATION #1234"
**Imported:** "SHELL GAS #1234"

**Expected:**
- ✅ High similarity score (≥85%)
- ✅ Contributes to confidence

### Internal Duplicate Detection

#### Test Case 3.5: CSV Contains Duplicates
**CSV:**
```csv
Date,Description,Amount
2026-01-15,Starbucks,12.50
2026-01-15,Starbucks,12.50
2026-01-16,Shell Gas,45.00
```

**Expected:**
- ✅ Detects row 2 as duplicate of row 1
- ✅ Returns Map: { tempId1: [tempId2] }
- ✅ Both marked isDuplicate: true

---

## 4. Account Matcher Service Tests

### Bank Connection Matching

#### Test Case 4.1: High Confidence Match
**Existing Account:**
- Currency: CAD
- ImportBatch metadata: { externalAccountId: "xxxx1234", institutionName: "TD Bank" }

**Incoming Connection:**
- Currency: CAD
- Mask: "1234"
- InstitutionId: "TD Bank"

**Expected:**
- ✅ confidence: 90 (30+40+20)
- ✅ reason: "Currency match, Account number match (last 4: 1234), Institution match"

#### Test Case 4.2: Medium Confidence (Suggest)
**Score:** 50-79

**Expected:**
- ✅ Returns account
- ✅ Requires user confirmation (UI)

#### Test Case 4.3: Low Confidence (No Match)
**Score:** < 50

**Expected:**
- ✅ account: null
- ✅ Prompts user to select manually

#### Test Case 4.4: Currency Mismatch
**Expected:**
- ✅ Skips account (currency is required match)

---

## 5. Integration Tests (Upload Endpoint)

### End-to-End Flow

#### Test Case 5.1: Upload Valid CSV
**Request:**
```typescript
POST /api/import/upload
Content-Type: multipart/form-data

file: sample.csv
accountId: account_123
dateFormat: MM/DD/YYYY
```

**Expected:**
1. ✅ Validates file size (< 10MB)
2. ✅ Validates file type (.csv)
3. ✅ Parses CSV
4. ✅ Detects column mappings
5. ✅ Runs duplicate detection
6. ✅ Runs categorization (batch)
7. ✅ Stores in cache (parseId)
8. ✅ Returns enriched transactions

**Response:**
```json
{
  "parseId": "uuid",
  "accountId": "account_123",
  "fileName": "sample.csv",
  "transactions": [...],
  "summary": {
    "total": 10,
    "duplicates": 2,
    "categorized": 7,
    "needsReview": 1
  }
}
```

#### Test Case 5.2: Upload Without accountId
**Expected:**
- ✅ Parses successfully
- ✅ Returns suggested accounts (if matches found)
- ✅ requiresAccountSelection: true

#### Test Case 5.3: File Too Large (> 10MB)
**Expected:**
- ✅ HTTP 413 Payload Too Large
- ✅ Error message with actual file size

#### Test Case 5.4: Invalid File Type
**Request:** file.txt

**Expected:**
- ✅ HTTP 400 Bad Request
- ✅ Error: "Invalid file type. Supported formats: CSV, PDF, OFX, XLSX"

#### Test Case 5.5: Tenant Isolation
**Request:** accountId from different tenant

**Expected:**
- ✅ HTTP 403 Forbidden
- ✅ Error: "Account not found or access denied"

#### Test Case 5.6: Parse Cache Retrieval
**Flow:**
1. Upload CSV → Get parseId
2. GET /api/import/parse/:parseId

**Expected:**
- ✅ Returns cached data
- ✅ Preserves enriched transactions (duplicates, categories)

#### Test Case 5.7: Parse Cache Expiry
**Setup:** Wait 65 minutes

**Expected:**
- ✅ Cache auto-cleans (older than 1 hour)
- ✅ HTTP 404 Not Found

---

## 6. Security Tests

### Authentication

#### Test Case 6.1: Missing Auth Token
**Expected:**
- ✅ HTTP 401 Unauthorized
- ✅ authMiddleware blocks request

### Tenant Isolation

#### Test Case 6.2: Cross-Tenant Data Access
**Scenario:** User A tries to import to User B's account

**Expected:**
- ✅ HTTP 403 Forbidden
- ✅ Database query filters by tenant membership

### Input Validation

#### Test Case 6.3: Malicious CSV Content
**Input:**
```csv
Date,Description,Amount
<script>alert('xss')</script>,Test,100
```

**Expected:**
- ✅ Description sanitized
- ✅ No XSS vulnerability

#### Test Case 6.4: SQL Injection in Description
**Input:** `'; DROP TABLE transactions; --`

**Expected:**
- ✅ Prisma parameterized queries prevent injection
- ✅ Description stored as-is (escaped)

---

## 7. Performance Tests

### Load Tests

#### Test Case 7.1: Large CSV (10,000 rows)
**Expected:**
- ✅ Parses in < 5 seconds
- ✅ Memory usage < 100MB
- ✅ No timeout

#### Test Case 7.2: Duplicate Detection Performance
**Setup:** 10,000 imported + 50,000 existing transactions

**Expected:**
- ✅ Query optimized with date range filter
- ✅ Completes in < 30 seconds
- ✅ Uses indexes on (accountId, date)

#### Test Case 7.3: Categorization Batch Performance
**Setup:** 10,000 transactions

**Expected:**
- ✅ Single DB query for categories
- ✅ Completes in < 2 seconds
- ✅ No N+1 queries

---

## 8. Edge Cases

### Empty/Invalid Data

#### Test Case 8.1: Empty CSV
**Input:** Header only, no data rows

**Expected:**
- ✅ Error: "CSV file contains no data rows"

#### Test Case 8.2: Invalid Date Format
**Input:** "January 15th, 2026"

**Expected:**
- ✅ Error: "Unsupported date format: ..."

#### Test Case 8.3: Missing Description
**Input:** Date and Amount only

**Expected:**
- ✅ Description defaults to "" or "Transaction"

#### Test Case 8.4: Negative Balance
**Input:** Balance: -$1000.00

**Expected:**
- ✅ Parsed correctly as negative cents

---

## 9. Phase 2 TODO Items

### Not Yet Implemented

1. ❌ **OFX/XLSX Parsing** (import.ts:186-190)
   - Returns HTTP 501 Not Implemented
   - Test: Upload .ofx file → Error message

2. ❌ **Column Mapping Update** (import.ts:447-452)
   - Not implemented (requires file buffer storage)
   - Test: POST /api/import/update-mapping → Error

3. ❌ **Redis Cache** (import.ts:28)
   - Uses in-memory Map (single-server only)
   - Test: Multi-server scenario fails

4. ❌ **Machine Learning Categorization** (categorizationService.ts:310-316)
   - learnFromCorrection() is placeholder
   - Test: Currently does nothing

---

## 10. Manual Test Execution

### Quick Smoke Test

#### Create Sample CSV
```bash
cat > test_import.csv << 'EOF'
Date,Description,Debit,Credit,Balance
2026-01-15,STARBUCKS #1234,12.50,,987.50
2026-01-16,PAYROLL DEPOSIT,,2500.00,3487.50
2026-01-17,SHELL GAS STATION,45.00,,3442.50
2026-01-18,UBER TRIP 01/18,18.50,,3424.00
2026-01-19,AMAZON.COM ORDER,89.99,,3334.01
EOF
```

#### Test with curl
```bash
# Start API server
cd apps/api
npm run dev

# Upload CSV (replace with valid auth token and accountId)
curl -X POST http://localhost:3000/api/import/upload \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -F "file=@test_import.csv" \
  -F "accountId=YOUR_ACCOUNT_ID" \
  -F "dateFormat=MM/DD/YYYY"
```

#### Expected Response
```json
{
  "parseId": "...",
  "transactions": [
    {
      "tempId": "temp_...",
      "date": "2026-01-15",
      "description": "STARBUCKS #1234",
      "amount": -1250,
      "balance": 98750,
      "isDuplicate": false,
      "suggestedCategory": {
        "name": "Meals & Entertainment",
        "confidence": 85,
        "reason": "Keyword match: \"starbucks\""
      }
    }
  ],
  "summary": {
    "total": 5,
    "duplicates": 0,
    "categorized": 5,
    "needsReview": 0
  }
}
```

---

## Test Coverage Summary

### Current Status (Manual Review)

| Component | Tests Needed | Status | Priority |
|-----------|-------------|--------|----------|
| CSV Parsing | 8 test cases | ⚠️ No framework | HIGH |
| Date Parsing | 4 test cases | ⚠️ No framework | HIGH |
| Amount Parsing | 5 test cases | ⚠️ No framework | HIGH |
| Categorization | 5 test cases | ⚠️ No framework | MEDIUM |
| Duplication Detection | 5 test cases | ⚠️ No framework | HIGH |
| Account Matching | 4 test cases | ⚠️ No framework | MEDIUM |
| Upload Endpoint | 7 test cases | ⚠️ No framework | HIGH |
| Security | 4 test cases | ⚠️ No framework | CRITICAL |
| Performance | 3 test cases | ⚠️ No framework | MEDIUM |

**Total:** 45 test cases needed

---

## Next Steps

### Immediate (Today)
1. ✅ **Manual code review** (this document)
2. 🔲 **Install Vitest** test framework
3. 🔲 **Create test files** for each service
4. 🔲 **Write sample test data** (CSV fixtures)

### Short-term (This Week)
5. 🔲 **Implement unit tests** (parserService, categorizationService)
6. 🔲 **Implement integration tests** (upload endpoint)
7. 🔲 **Run security review** with /workflows:review
8. 🔲 **Performance profiling** with large datasets

### Medium-term (Next Sprint)
9. 🔲 **Set up CI/CD testing** (GitHub Actions)
10. 🔲 **Add test coverage reporting**
11. 🔲 **Implement E2E tests** with real database

---

## Code Quality Review

### ✅ Strengths
1. **Well-structured** - Clean separation of concerns
2. **Type-safe** - Full TypeScript with Zod schemas
3. **Security-focused** - Tenant isolation, auth middleware
4. **Performance-aware** - Batch operations, date range filters
5. **Error handling** - Descriptive error messages
6. **Production-ready** - Cache cleanup, file size limits

### ⚠️ Areas for Improvement
1. **No automated tests** - All manual testing
2. **In-memory cache** - Not multi-server safe (TODO: Redis)
3. **Limited file formats** - Only CSV/PDF (OFX/XLSX Phase 2)
4. **No column mapping update** - Requires file re-upload
5. **Basic categorization** - Keyword-only (ML in Phase 2)

### 🔴 Critical Issues
- **None found** - Code appears solid

---

## Recommendations

### High Priority
1. **Set up test framework** - Block merging without tests
2. **Write security tests** - Validate tenant isolation
3. **Add integration tests** - Cover full upload flow

### Medium Priority
4. **Performance benchmarking** - Ensure 10k row support
5. **Error message i18n** - Support multiple languages
6. **Logging/monitoring** - Track import success rates

### Low Priority
7. **Column mapping UI** - Allow adjustment post-upload
8. **ML categorization** - Train on user corrections
9. **OFX/XLSX support** - Expand file format coverage

---

**Test Plan Status:** ✅ Complete
**Manual Testing:** 🔲 Ready to execute
**Automated Testing:** ⚠️ Requires setup

**Next:** Install Vitest and create first test file.
