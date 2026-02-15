/**
 * PDF Parser Accuracy Test
 *
 * Compares raw PDF text extraction with parser output to find
 * lines containing dollar amounts that the parser is missing.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Dynamic imports (to handle ESM/CJS compat)
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    // @ts-ignore
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
}

async function getParsePDF() {
  const mod = await import('./apps/api/src/domains/banking/services/parser.service.js');
  return mod.parsePDF;
}

// ============================================================
// Config
// ============================================================

const TEST_FILES = [
  {
    label: 'RBC Credit Card (MIC)',
    path: 'brand/testfiles/MIC Statement-5328 2025-01-27.pdf',
  },
  {
    label: 'RBC Chequing',
    path: 'brand/testfiles/Chequing Statement-4299 2025-12-17.pdf',
  },
  {
    label: 'CIBC Credit Card',
    path: 'brand/testfiles/onlineStatement_2025-02-25.pdf',
  },
];

// Amount regex: matches dollar amounts like $1,234.56 or 1234.56 or -$50.00
const AMOUNT_RE = /(-?\$?[\d,]+\.\d{2})(?!\d|[A-Za-z%])/;

// Skip patterns from the parser (lines we expect to be skipped)
const SKIP_PATTERNS = [
  /^total\s/i, /^previous\s+balance/i, /^payments\s+-/i,
  /^purchases\s+\$/i, /^interest\s+charged/i, /^fees\s+charged/i,
  /^cash\s+advances/i, /^other\s+credits/i,
  /^total\s+credits/i, /^total\s+charges/i, /^total\s+balance/i,
  /^amount\s+due/i, /^minimum\s+payment/i, /^available\s/i,
  /^summary\s/i, /^annual\s+interest/i, /^trans\.?\s+post/i, /^date\s+date/i,
  /^subtotal\b/i,
  /^foreign\s+currency/i,
  /^\d{10,}$/, // Reference/card numbers
  /^balance\s+forward/i,
  /^opening\s+balance/i, /^closing\s+balance/i,
  /^credit\s+limit/i, /^credit\s+available/i,
  /^new\s+balance/i, /^previous\s+statement/i,
  /^page\s+\d/i,
];

// ============================================================
// PDF Text Extraction (same logic as parser.service.ts)
// ============================================================

async function extractRawText(fileBuffer: Buffer): Promise<string> {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fileBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  let text = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items = textContent.items as any[];
    if (items.length === 0) continue;

    const sorted = [...items].sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    let currentY = sorted[0]?.transform[5];
    let currentLine = '';

    for (const item of sorted) {
      const y = item.transform[5];
      if (Math.abs(y - currentY) > 2) {
        text += currentLine.trim() + '\n';
        currentLine = item.str;
        currentY = y;
      } else {
        currentLine += (currentLine && !currentLine.endsWith(' ') ? ' ' : '') + item.str;
      }
    }
    if (currentLine.trim()) {
      text += currentLine.trim() + '\n';
    }
  }

  return text;
}

// ============================================================
// Analysis
// ============================================================

function isSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(line));
}

function normalizeForComparison(desc: string): string {
  return desc.replace(/\s+/g, ' ').trim().toLowerCase();
}

interface LineInfo {
  lineNum: number;
  text: string;
  amounts: string[];
  isSkipped: boolean;
  matchedByParser: boolean;
  reason?: string;
}

async function analyzeFile(label: string, filePath: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`  FILE: ${label}`);
  console.log(`  PATH: ${filePath}`);
  console.log('='.repeat(80));

  const buffer = readFileSync(filePath);

  // Step 1: Extract raw text
  const rawText = await extractRawText(buffer);
  const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Step 2: Run parser
  const parsePDF = await getParsePDF();
  let parserResult;
  try {
    parserResult = await parsePDF(buffer);
  } catch (err: any) {
    console.log(`\n  PARSER ERROR: ${err.message}`);
    parserResult = { transactions: [] };
  }
  const parsedTxns = parserResult.transactions;

  // Step 3: Find all lines with amounts
  const linesWithAmounts: LineInfo[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const amountMatches = line.match(new RegExp(AMOUNT_RE.source, 'g'));

    if (amountMatches && amountMatches.length > 0) {
      const skipped = isSkipLine(line);
      linesWithAmounts.push({
        lineNum: i + 1,
        text: line,
        amounts: amountMatches,
        isSkipped: skipped,
        matchedByParser: false, // will check below
      });
    }
  }

  // Step 4: Match parser output to raw lines
  // For each parsed transaction, try to find the raw line it came from
  const parsedDescriptions = parsedTxns.map((t: any) => ({
    date: t.date,
    description: normalizeForComparison(t.description),
    amount: t.amount,
    amountStr: (Math.abs(t.amount) / 100).toFixed(2),
    matched: false,
  }));

  for (const lineInfo of linesWithAmounts) {
    const lineNorm = normalizeForComparison(lineInfo.text);
    for (const parsed of parsedDescriptions) {
      if (parsed.matched) continue;

      // Check if the parsed description appears in this line AND amount matches
      const amountStr = parsed.amountStr;
      const hasAmount = lineInfo.amounts.some(a => {
        const cleanA = a.replace(/[$,]/g, '');
        return cleanA === amountStr || cleanA === '-' + amountStr;
      });

      if (hasAmount && (lineNorm.includes(parsed.description) || parsed.description.split(' ').slice(0, 3).every(w => lineNorm.includes(w)))) {
        lineInfo.matchedByParser = true;
        parsed.matched = true;
        break;
      }
    }
  }

  // Step 5: Report
  console.log(`\n  RAW TEXT: ${rawLines.length} lines total`);
  console.log(`  LINES WITH AMOUNTS: ${linesWithAmounts.length}`);
  console.log(`  PARSER FOUND: ${parsedTxns.length} transactions`);
  console.log(`  LINES SKIPPED (headers/totals): ${linesWithAmounts.filter(l => l.isSkipped).length}`);

  // Lines with amounts that were NOT matched
  const missed = linesWithAmounts.filter(l => !l.matchedByParser && !l.isSkipped);
  const matched = linesWithAmounts.filter(l => l.matchedByParser);

  console.log(`  MATCHED TO PARSER: ${matched.length}`);
  console.log(`  POTENTIALLY MISSED: ${missed.length}`);

  // Print ALL raw lines with amounts for complete view
  console.log('\n  --- ALL LINES WITH DOLLAR AMOUNTS ---');
  for (const lineInfo of linesWithAmounts) {
    const status = lineInfo.matchedByParser
      ? '[MATCHED]'
      : lineInfo.isSkipped
        ? '[SKIP  ]'
        : '[MISSED]';
    console.log(`  ${status} L${String(lineInfo.lineNum).padStart(3)}: ${lineInfo.text.substring(0, 120)}`);
    if (lineInfo.text.length > 120) {
      console.log(`          ${lineInfo.text.substring(120)}`);
    }
  }

  // Detailed analysis of missed lines
  if (missed.length > 0) {
    console.log('\n  --- DETAILED ANALYSIS OF MISSED LINES ---');
    for (const lineInfo of missed) {
      console.log(`\n  LINE ${lineInfo.lineNum}: ${lineInfo.text}`);
      console.log(`    Amounts found: ${lineInfo.amounts.join(', ')}`);

      // Diagnose WHY it was missed
      const line = lineInfo.text;

      // Check Pattern A (two-date credit card)
      const datePrefixA = /^([A-Za-z]{3})\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{1,2})\s+/;
      const matchA = line.match(datePrefixA);

      // Check Pattern A2 (single-date credit card)
      const datePrefixA2 = /^([A-Za-z]{3})\s+(\d{1,2})\s+/;
      const matchA2 = line.match(datePrefixA2);

      // Check Pattern C (chequing DD Mon)
      const amtReStr = '(-?\\$?[\\d,]+\\.\\d{2})(?!\\d|[A-Za-z%])';
      const patternC = new RegExp(
        `^(\\d{1,2})\\s+([A-Za-z]{3})\\s+(.+?)\\s{2,}${amtReStr}(?:\\s+${amtReStr})?`
      );
      const matchC = line.match(patternC);

      // Check Pattern D (dateless sub-item)
      const patternD = new RegExp(
        `^([A-Za-z].+?)\\s{2,}${amtReStr}(?:\\s+${amtReStr})?`
      );
      const matchD = line.match(patternD);

      // Check Pattern B (generic date)
      const genericDatePattern = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
      const matchB = line.match(genericDatePattern);

      if (matchA) {
        const rest = line.substring(matchA[0].length);
        const firstAmt = rest.match(AMOUNT_RE);
        if (firstAmt && firstAmt.index !== undefined) {
          const desc = rest.substring(0, firstAmt.index).trim();
          console.log(`    Pattern A MATCH: dates="${matchA[1]} ${matchA[2]} / ${matchA[3]} ${matchA[4]}", desc="${desc}", amt="${firstAmt[1]}"`);
          if (desc.length === 0) {
            console.log(`    REASON: Description is empty after date extraction`);
          } else {
            console.log(`    REASON: Pattern A matched but parser still missed it — check MONTHS lookup or getYearForMonth`);
          }
        } else {
          console.log(`    Pattern A: Dates found but NO amount after date prefix`);
          console.log(`    REASON: Amount regex didn't match in rest: "${rest.substring(0, 80)}"`);
        }
      } else if (matchA2) {
        const MONTHS: Record<string, number> = {
          jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
          jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
        };
        const monthIdx = MONTHS[matchA2[1].toLowerCase()];
        const rest = line.substring(matchA2[0].length);
        const firstAmt = rest.match(AMOUNT_RE);
        if (monthIdx === undefined) {
          console.log(`    Pattern A2: Month "${matchA2[1]}" not recognized in MONTHS map`);
        } else if (firstAmt && firstAmt.index !== undefined) {
          const desc = rest.substring(0, firstAmt.index).trim();
          console.log(`    Pattern A2 MATCH: date="${matchA2[1]} ${matchA2[2]}", desc="${desc}", amt="${firstAmt[1]}"`);
          if (desc.length === 0) {
            console.log(`    REASON: Description is empty — amount is right after the date prefix`);
          } else {
            console.log(`    REASON: Pattern A2 should match — investigate parser flow (maybe Pattern A consumed it?)`);
          }
        } else {
          console.log(`    Pattern A2: Date found but NO amount in rest: "${rest.substring(0, 80)}"`);
        }
      } else if (matchC) {
        console.log(`    Pattern C MATCH: day=${matchC[1]}, month=${matchC[2]}, desc="${matchC[3]}", amt=${matchC[4]}, bal=${matchC[5] || 'N/A'}`);
        console.log(`    REASON: Pattern C matched but parser still missed — check regex or MONTHS lookup`);
      } else if (matchD) {
        console.log(`    Pattern D MATCH: desc="${matchD[1]}", amt=${matchD[2]}, bal=${matchD[3] || 'N/A'}`);
        console.log(`    REASON: Pattern D requires lastChequingDate to be set — may be a chequing sub-item before the first dated line`);
      } else if (matchB) {
        console.log(`    Pattern B MATCH: date="${matchB[1]}"`);
        console.log(`    REASON: Generic date pattern found — check if amount also matched`);
      } else {
        // Deeper diagnosis
        const startsWithDigit = /^\d/.test(line);
        const startsWithLetter = /^[A-Za-z]/.test(line);
        const hasDoubleSpace = /\s{2,}/.test(line);
        const hasSingleSpaceOnly = !hasDoubleSpace;

        console.log(`    NO PATTERN MATCHED.`);
        console.log(`    Starts with digit: ${startsWithDigit}`);
        console.log(`    Starts with letter: ${startsWithLetter}`);
        console.log(`    Has double-space separator: ${hasDoubleSpace}`);

        if (startsWithLetter && hasSingleSpaceOnly) {
          console.log(`    REASON: Pattern D requires double-space (\\s{2,}) between description and amount — this line only has single spaces`);
        } else if (startsWithDigit && !matchC) {
          console.log(`    REASON: Starts with digit but doesn't match "DD Mon" chequing pattern — maybe different date format`);
        } else if (startsWithLetter && hasDoubleSpace) {
          console.log(`    REASON: Looks like Pattern D candidate but was not matched — may need lastChequingDate or regex issue`);
        } else {
          console.log(`    REASON: Does not start with a recognized date pattern and doesn't match sub-item pattern`);
        }
      }
    }
  }

  // Print parser output for reference
  console.log('\n  --- PARSER OUTPUT (first 30) ---');
  for (let i = 0; i < Math.min(parsedTxns.length, 30); i++) {
    const t = parsedTxns[i];
    const amtDollars = (t.amount / 100).toFixed(2);
    const balDollars = t.balance !== undefined ? (t.balance / 100).toFixed(2) : 'N/A';
    console.log(`  ${String(i + 1).padStart(3)}. ${t.date}  $${amtDollars.padStart(10)}  bal=$${balDollars.padStart(10)}  ${t.description.substring(0, 60)}`);
  }
  if (parsedTxns.length > 30) {
    console.log(`  ... and ${parsedTxns.length - 30} more`);
  }

  return {
    label,
    totalLines: rawLines.length,
    linesWithAmounts: linesWithAmounts.length,
    parserFound: parsedTxns.length,
    skippedLines: linesWithAmounts.filter(l => l.isSkipped).length,
    matchedLines: matched.length,
    missedLines: missed.length,
    missed,
  };
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('PDF Parser Accuracy Analysis');
  console.log('============================\n');

  const results = [];

  for (const file of TEST_FILES) {
    const fullPath = join(process.cwd(), file.path);
    try {
      const result = await analyzeFile(file.label, fullPath);
      results.push(result);
    } catch (err: any) {
      console.log(`\nERROR processing ${file.label}: ${err.message}`);
      console.log(err.stack);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('  SUMMARY');
  console.log('='.repeat(80));

  for (const r of results) {
    const accuracy = r.linesWithAmounts - r.skippedLines > 0
      ? ((r.matchedLines / (r.linesWithAmounts - r.skippedLines)) * 100).toFixed(1)
      : 'N/A';
    console.log(`\n  ${r.label}:`);
    console.log(`    Lines with amounts: ${r.linesWithAmounts} (${r.skippedLines} skipped as headers/totals)`);
    console.log(`    Transaction lines:  ${r.linesWithAmounts - r.skippedLines}`);
    console.log(`    Parser found:       ${r.parserFound}`);
    console.log(`    Matched to lines:   ${r.matchedLines}`);
    console.log(`    Potentially missed: ${r.missedLines}`);
    console.log(`    Accuracy:           ${accuracy}%`);
  }

  console.log('\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
