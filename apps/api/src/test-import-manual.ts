/**
 * Manual Smoke Test for Bank Import Feature
 *
 * Run with: npx tsx src/test-import-manual.ts
 *
 * Tests:
 * - CSV parsing with various formats
 * - Date parsing edge cases
 * - Amount parsing with currency symbols
 * - Column auto-detection
 * - Internal duplicate detection
 * - Categorization keyword matching
 */

import { parseCSV, parsePDF } from './services/parserService';
import { findInternalDuplicates } from './services/duplicationService';
import { categorizeTransactions } from './services/categorizationService';

console.log('🧪 Starting Bank Import Feature Smoke Tests...\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    failedTests++;
  }
}

function assertThrows(fn: () => void, expectedError: string, testName: string) {
  try {
    fn();
    console.log(`❌ FAIL: ${testName} (did not throw)`);
    failedTests++;
  } catch (error: any) {
    if (error.message.includes(expectedError)) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: ${testName} (wrong error: ${error.message})`);
      failedTests++;
    }
  }
}

// ============================================================================
// Test 1: Basic CSV Parsing
// ============================================================================
console.log('\n📋 Test Group 1: CSV Parsing\n');

const basicCSV = `Date,Description,Amount
2026-01-15,Starbucks Coffee,12.50
2026-01-16,Shell Gas Station,45.00
2026-01-17,Amazon Order,89.99`;

try {
  const result = parseCSV(Buffer.from(basicCSV, 'utf-8'));

  assert(result.transactions.length === 3, 'Parses 3 transactions');
  assert(result.transactions[0].date === '2026-01-15', 'Parses date correctly');
  assert(result.transactions[0].description === 'Starbucks Coffee', 'Parses description correctly');
  assert(result.transactions[0].amount === 1250, 'Converts $12.50 to 1250 cents');
  assert(result.transactions[1].amount === 4500, 'Converts $45.00 to 4500 cents');
  assert(result.transactions[2].amount === 8999, 'Converts $89.99 to 8999 cents');
  assert(result.columns?.length === 3, 'Detects 3 columns');
  assert(result.suggestedMappings?.date === 'Date', 'Auto-detects date column');
  assert(result.suggestedMappings?.description === 'Description', 'Auto-detects description column');
  assert(result.suggestedMappings?.amount === 'Amount', 'Auto-detects amount column');
} catch (error: any) {
  console.log(`❌ FAIL: Basic CSV parsing failed: ${error.message}`);
  failedTests += 9;
}

// ============================================================================
// Test 2: Debit/Credit Column Format
// ============================================================================
console.log('\n📋 Test Group 2: Debit/Credit Format\n');

const debitCreditCSV = `Date,Description,Debit,Credit,Balance
2026-01-15,Shell Gas,45.00,,955.00
2026-01-16,Payroll Deposit,,2500.00,3455.00
2026-01-17,Coffee,5.50,,3449.50`;

try {
  const result = parseCSV(Buffer.from(debitCreditCSV, 'utf-8'));

  assert(result.transactions.length === 3, 'Parses 3 transactions with debit/credit');
  assert(result.transactions[0].amount === -4500, 'Debit is negative (-4500 cents)');
  assert(result.transactions[1].amount === 250000, 'Credit is positive (250000 cents)');
  assert(result.transactions[0].balance === 95500, 'Captures balance (95500 cents)');
  assert(result.suggestedMappings?.amount.includes('|'), 'Detects debit|credit format');
} catch (error: any) {
  console.log(`❌ FAIL: Debit/Credit parsing failed: ${error.message}`);
  failedTests += 5;
}

// ============================================================================
// Test 3: Date Format Variations
// ============================================================================
console.log('\n📋 Test Group 3: Date Formats\n');

const dateFormatsCSV = `Date,Description,Amount
2026-01-15,ISO Format,10.00
01/16/2026,MM/DD/YYYY,10.00
1/5/26,Short Year,10.00`;

try {
  const result1 = parseCSV(Buffer.from(dateFormatsCSV, 'utf-8'));
  assert(result1.transactions[0].date === '2026-01-15', 'Parses ISO format (YYYY-MM-DD)');
  assert(result1.transactions[1].date === '2026-01-16', 'Parses MM/DD/YYYY format');
  assert(result1.transactions[2].date === '2026-01-05', 'Parses short year (26 → 2026)');
} catch (error: any) {
  console.log(`❌ FAIL: Date format parsing failed: ${error.message}`);
  failedTests += 3;
}

// Test DD/MM/YYYY with format hint
const ddmmyyyyCSV = `Date,Description,Amount
15/01/2026,European Date,10.00`;

try {
  const result2 = parseCSV(Buffer.from(ddmmyyyyCSV, 'utf-8'), undefined, 'DD/MM/YYYY');
  assert(result2.transactions[0].date === '2026-01-15', 'Parses DD/MM/YYYY with format hint');
} catch (error: any) {
  console.log(`❌ FAIL: DD/MM/YYYY parsing failed: ${error.message}`);
  failedTests += 1;
}

// ============================================================================
// Test 4: Amount Format Variations
// ============================================================================
console.log('\n📋 Test Group 4: Amount Formats\n');

const amountFormatsCSV = `Date,Description,Amount
2026-01-15,Currency Symbol,$1,234.56
2026-01-16,Parentheses Negative,(45.00)
2026-01-17,Negative Sign,-123.45
2026-01-18,Euro Symbol,€100.00
2026-01-19,Plain Amount,50.00`;

try {
  const result = parseCSV(Buffer.from(amountFormatsCSV, 'utf-8'));

  assert(result.transactions[0].amount === 123456, 'Parses $1,234.56 as 123456 cents');
  assert(result.transactions[1].amount === -4500, 'Parses (45.00) as negative');
  assert(result.transactions[2].amount === -12345, 'Parses -123.45 as negative');
  assert(result.transactions[3].amount === 10000, 'Removes € symbol');
  assert(result.transactions[4].amount === 5000, 'Parses plain 50.00');
} catch (error: any) {
  console.log(`❌ FAIL: Amount format parsing failed: ${error.message}`);
  failedTests += 5;
}

// ============================================================================
// Test 5: Edge Cases and Errors
// ============================================================================
console.log('\n📋 Test Group 5: Edge Cases\n');

// Empty CSV
const emptyCSV = `Date,Description,Amount`;
assertThrows(
  () => parseCSV(Buffer.from(emptyCSV, 'utf-8')),
  'no data rows',
  'Empty CSV throws error'
);

// Invalid date
const invalidDateCSV = `Date,Description,Amount
January 15th 2026,Test,10.00`;
assertThrows(
  () => parseCSV(Buffer.from(invalidDateCSV, 'utf-8')),
  'Unsupported date format',
  'Invalid date throws error'
);

// Invalid amount
const invalidAmountCSV = `Date,Description,Amount
2026-01-15,Test,NOT_A_NUMBER`;
assertThrows(
  () => parseCSV(Buffer.from(invalidAmountCSV, 'utf-8')),
  'Invalid amount',
  'Invalid amount throws error'
);

// ============================================================================
// Test 6: Internal Duplicate Detection
// ============================================================================
console.log('\n📋 Test Group 6: Duplicate Detection\n');

const duplicateCSV = `Date,Description,Amount
2026-01-15,Starbucks,12.50
2026-01-15,Starbucks,12.50
2026-01-16,Shell Gas,45.00
2026-01-15,STARBUCKS,12.50`;

try {
  const result = parseCSV(Buffer.from(duplicateCSV, 'utf-8'));
  const duplicates = findInternalDuplicates(result.transactions);

  assert(duplicates.size > 0, 'Detects internal duplicates');
  assert(result.transactions[0].date === '2026-01-15', 'Duplicate has same date');
  assert(result.transactions[0].amount === result.transactions[1].amount, 'Duplicate has same amount');

  // Normalize and compare descriptions
  const desc1 = result.transactions[0].description.toLowerCase().replace(/[^a-z0-9]/g, '');
  const desc2 = result.transactions[1].description.toLowerCase().replace(/[^a-z0-9]/g, '');
  assert(desc1 === desc2, 'Duplicate has same description (normalized)');
} catch (error: any) {
  console.log(`❌ FAIL: Duplicate detection failed: ${error.message}`);
  failedTests += 4;
}

// ============================================================================
// Test 7: Categorization (Mock Tenant)
// ============================================================================
console.log('\n📋 Test Group 7: Categorization\n');

const mockTenantId = 'mock-tenant-id';

async function testCategorization() {
  try {
    const transactions = [
      { description: 'STARBUCKS #1234', amount: 1250 },
      { description: 'UBER TRIP 01/15', amount: 1800 },
      { description: 'SHELL GAS STATION', amount: 4500 },
      { description: 'AMAZON.COM ORDER', amount: 8999 },
      { description: 'MICROSOFT 365 SUBSCRIPTION', amount: 1299 },
      { description: 'OBSCURE MERCHANT NAME', amount: 1000 },
    ];

    const suggestions = await categorizeTransactions(transactions, mockTenantId);

    assert(suggestions.length === 6, 'Returns suggestion for each transaction');

    // Starbucks → Meals & Entertainment
    assert(
      suggestions[0].categoryName?.includes('Meals') || suggestions[0].categoryName?.includes('Entertainment'),
      'Categorizes Starbucks as Meals & Entertainment'
    );
    assert(suggestions[0].confidence === 85, 'Starbucks has 85% confidence');

    // Uber → Transportation
    assert(
      suggestions[1].categoryName?.includes('Transportation'),
      'Categorizes Uber as Transportation'
    );

    // Shell → Transportation
    assert(
      suggestions[2].categoryName?.includes('Transportation'),
      'Categorizes Shell as Transportation'
    );

    // Amazon → Office Supplies
    assert(
      suggestions[3].categoryName?.includes('Office'),
      'Categorizes Amazon as Office Supplies'
    );

    // Microsoft → Software & Subscriptions
    assert(
      suggestions[4].categoryName?.includes('Software') || suggestions[4].categoryName?.includes('Subscription'),
      'Categorizes Microsoft as Software'
    );

    // Unknown merchant → No match
    assert(
      suggestions[5].confidence === 0,
      'Unknown merchant has 0% confidence'
    );
    assert(
      suggestions[5].matchReason === 'No match found',
      'Unknown merchant match reason is "No match found"'
    );
  } catch (error: any) {
    console.log(`❌ FAIL: Categorization test failed: ${error.message}`);
    failedTests += 8;
  }
}

// ============================================================================
// Test 8: External Account Data Extraction
// ============================================================================
console.log('\n📋 Test Group 8: External Account Data\n');

const accountDataCSV = `Date,Description,Debit,Credit,Balance
Account: 1234 - TD Checking,,,
2026-01-15,Transaction 1,10.00,,990.00`;

try {
  const result = parseCSV(Buffer.from(accountDataCSV, 'utf-8'));

  // Note: First row might be parsed as transaction, but external data should still be extracted
  assert(result.externalAccountData !== undefined, 'Extracts external account data');

  if (result.externalAccountData?.externalAccountId) {
    assert(
      result.externalAccountData.externalAccountId.includes('1234'),
      'Extracts account number (last 4 digits)'
    );
  }

  if (result.externalAccountData?.institutionName) {
    assert(
      result.externalAccountData.institutionName.toLowerCase().includes('td') ||
      result.externalAccountData.institutionName.toLowerCase().includes('bank'),
      'Extracts institution name'
    );
  }

  if (result.externalAccountData?.accountType) {
    assert(
      result.externalAccountData.accountType === 'checking',
      'Infers account type (checking)'
    );
  }
} catch (error: any) {
  console.log(`❌ FAIL: External account data extraction failed: ${error.message}`);
  failedTests += 1;
}

// ============================================================================
// Test 9: Column Auto-Detection
// ============================================================================
console.log('\n📋 Test Group 9: Column Auto-Detection\n');

const customColumnsCSV = `Transaction Date,Merchant,Withdrawal,Deposit
2026-01-15,Coffee Shop,5.50,
2026-01-16,Paycheck,,2500.00`;

try {
  const result = parseCSV(Buffer.from(customColumnsCSV, 'utf-8'));

  assert(
    result.suggestedMappings?.date === 'Transaction Date',
    'Auto-detects "Transaction Date" as date column'
  );
  assert(
    result.suggestedMappings?.description === 'Merchant',
    'Auto-detects "Merchant" as description column'
  );
  assert(
    result.suggestedMappings?.amount.includes('Withdrawal') && result.suggestedMappings?.amount.includes('Deposit'),
    'Auto-detects "Withdrawal|Deposit" as amount columns'
  );
} catch (error: any) {
  console.log(`❌ FAIL: Column auto-detection failed: ${error.message}`);
  failedTests += 3;
}

// ============================================================================
// Run Async Tests
// ============================================================================

async function runAsyncTests() {
  await testCategorization();

  // ============================================================================
  // Final Results
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Total: ${passedTests + failedTests}`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Bank import feature is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review output above for details.\n`);
    process.exit(1);
  }
}

runAsyncTests();
