import PDFDocument from 'pdfkit';

/**
 * PDF generation service for invoices.
 *
 * Uses PDFKit (pure Node.js) to produce professional invoice PDFs.
 * All monetary amounts are integer cents — formatted to currency for display.
 */

// ─── Types ─────────────────────────────────────────────────────────

interface PdfEntity {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  taxId?: string | null;
}

interface PdfClient {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

interface PdfInvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number; // integer cents
  amount: number;    // integer cents
  taxAmount: number; // integer cents
}

interface PdfInvoice {
  invoiceNumber: string;
  issueDate: Date | string;
  dueDate: Date | string;
  currency: string;
  subtotal: number;   // integer cents
  taxAmount: number;   // integer cents
  total: number;       // integer cents
  paidAmount: number;  // integer cents
  notes?: string | null;
  invoiceLines: PdfInvoiceLine[];
  client: PdfClient;
  entity: PdfEntity;
}

// ─── Helpers ───────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  CAD: 'CA$',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

function formatCents(cents: number, currency: string): string {
  const amount = cents / 100;
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + ' ';
  return `${symbol}${amount.toLocaleString('en-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── Brand Colors ──────────────────────────────────────────────────

const COLORS = {
  primary: '#F59E0B',     // Akount amber
  dark: '#0f0f17',
  text: '#374151',
  muted: '#6b7280',
  light: '#9ca3af',
  border: '#e5e7eb',
  bgLight: '#f9fafb',
  green: '#10b981',
  red: '#ef4444',
};

// ─── PDF Generation ────────────────────────────────────────────────

/**
 * Generate an invoice PDF as a Buffer.
 *
 * @param invoice - Invoice data with entity, client, and line items
 * @returns PDF buffer (application/pdf)
 */
export async function generateInvoicePdf(invoice: PdfInvoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: invoice.entity.name,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      drawInvoice(doc, invoice);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawInvoice(doc: PDFKit.PDFDocument, invoice: PdfInvoice): void {
  const { entity, client } = invoice;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ─── Header: Company Name + INVOICE ───────────────────────────

  doc.fontSize(18).fillColor(COLORS.dark).text(entity.name, { continued: false });

  // Entity address
  const entityParts = [entity.address, entity.city, entity.state, entity.postalCode]
    .filter(Boolean);
  if (entityParts.length > 0) {
    doc.fontSize(9).fillColor(COLORS.text).text(entityParts.join(', '));
  }
  doc.fontSize(9).fillColor(COLORS.text).text(entity.country);
  if (entity.taxId) {
    doc.fontSize(8).fillColor(COLORS.light).text(`Tax ID: ${entity.taxId}`);
  }

  // INVOICE title (right-aligned)
  const titleY = doc.page.margins.top;
  doc.fontSize(24).fillColor(COLORS.primary)
    .text('INVOICE', doc.page.margins.left, titleY, {
      align: 'right',
      width: pageWidth,
    });
  doc.fontSize(11).fillColor(COLORS.muted)
    .text(invoice.invoiceNumber, {
      align: 'right',
      width: pageWidth,
    });

  // ─── Divider ──────────────────────────────────────────────────

  const afterHeader = Math.max(doc.y, titleY + 70) + 10;
  doc.moveTo(doc.page.margins.left, afterHeader)
    .lineTo(doc.page.margins.left + pageWidth, afterHeader)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc.y = afterHeader + 16;

  // ─── Bill To + Dates ──────────────────────────────────────────

  const infoY = doc.y;
  const leftCol = doc.page.margins.left;
  const rightCol = doc.page.margins.left + pageWidth * 0.55;

  // Bill To (left)
  doc.fontSize(7).fillColor(COLORS.light)
    .text('BILL TO', leftCol, infoY);
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor(COLORS.dark)
    .text(client.name, leftCol);
  if (client.email) {
    doc.fontSize(9).fillColor(COLORS.text).text(client.email, leftCol);
  }
  if (client.phone) {
    doc.fontSize(9).fillColor(COLORS.text).text(client.phone, leftCol);
  }
  if (client.address) {
    doc.fontSize(9).fillColor(COLORS.text).text(client.address, leftCol);
  }

  const afterBillTo = doc.y;

  // Dates (right — explicit Y positions to avoid NaN)
  const dateLineHeight = 14;
  let dateY = infoY;

  doc.fontSize(8).fillColor(COLORS.light)
    .text('Issue Date:', rightCol, dateY, { width: 70 });
  doc.fontSize(8).fillColor(COLORS.text)
    .text(formatDate(invoice.issueDate), rightCol + 72, dateY, { width: 150 });
  dateY += dateLineHeight;

  doc.fontSize(8).fillColor(COLORS.light)
    .text('Due Date:', rightCol, dateY, { width: 70 });
  doc.fontSize(8).fillColor(COLORS.text)
    .text(formatDate(invoice.dueDate), rightCol + 72, dateY, { width: 150 });
  dateY += dateLineHeight + 6;

  doc.fontSize(8).fillColor(COLORS.light)
    .text('Currency:', rightCol, dateY, { width: 70 });
  doc.fontSize(9).fillColor(COLORS.dark)
    .text(invoice.currency, rightCol + 72, dateY, { width: 150 });

  doc.y = Math.max(afterBillTo, doc.y) + 20;

  // ─── Line Items Table ─────────────────────────────────────────

  const tableTop = doc.y;
  const colWidths = {
    desc: pageWidth * 0.38,
    qty: pageWidth * 0.1,
    price: pageWidth * 0.18,
    tax: pageWidth * 0.16,
    amount: pageWidth * 0.18,
  };

  // Table header background
  doc.rect(leftCol, tableTop, pageWidth, 22).fill(COLORS.bgLight);

  // Table header text
  const headerY = tableTop + 6;
  doc.fontSize(7).fillColor(COLORS.muted);
  let xPos = leftCol + 6;
  doc.text('DESCRIPTION', xPos, headerY, { width: colWidths.desc });
  xPos += colWidths.desc;
  doc.text('QTY', xPos, headerY, { width: colWidths.qty, align: 'right' });
  xPos += colWidths.qty;
  doc.text('UNIT PRICE', xPos, headerY, { width: colWidths.price, align: 'right' });
  xPos += colWidths.price;
  doc.text('TAX', xPos, headerY, { width: colWidths.tax, align: 'right' });
  xPos += colWidths.tax;
  doc.text('AMOUNT', xPos, headerY, { width: colWidths.amount - 6, align: 'right' });

  // Table header bottom border
  doc.moveTo(leftCol, tableTop + 22)
    .lineTo(leftCol + pageWidth, tableTop + 22)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();

  // Table rows
  let rowY = tableTop + 28;
  for (const line of invoice.invoiceLines) {
    doc.fontSize(9).fillColor(COLORS.text);
    xPos = leftCol + 6;
    doc.text(line.description, xPos, rowY, { width: colWidths.desc });
    xPos += colWidths.desc;
    doc.text(String(line.quantity), xPos, rowY, { width: colWidths.qty, align: 'right' });
    xPos += colWidths.qty;
    doc.text(formatCents(line.unitPrice, invoice.currency), xPos, rowY, { width: colWidths.price, align: 'right' });
    xPos += colWidths.price;
    doc.text(formatCents(line.taxAmount, invoice.currency), xPos, rowY, { width: colWidths.tax, align: 'right' });
    xPos += colWidths.tax;
    doc.text(formatCents(line.amount, invoice.currency), xPos, rowY, { width: colWidths.amount - 6, align: 'right' });

    rowY += 20;

    // Row separator
    doc.moveTo(leftCol, rowY - 4)
      .lineTo(leftCol + pageWidth, rowY - 4)
      .strokeColor('#f3f4f6')
      .lineWidth(0.3)
      .stroke();
  }

  doc.y = rowY + 10;

  // ─── Totals (right-aligned) ───────────────────────────────────

  const totalsX = leftCol + pageWidth * 0.55;
  const totalsWidth = pageWidth * 0.45;
  const valX = totalsX + totalsWidth * 0.55;
  const valWidth = totalsWidth * 0.45 - 6;

  // Subtotal
  doc.fontSize(9).fillColor(COLORS.muted)
    .text('Subtotal', totalsX, doc.y, { width: totalsWidth * 0.55 });
  doc.fontSize(9).fillColor(COLORS.text)
    .text(formatCents(invoice.subtotal, invoice.currency), valX, doc.y - 13, { width: valWidth, align: 'right' });

  doc.moveDown(0.3);

  // Tax
  doc.fontSize(9).fillColor(COLORS.muted)
    .text('Tax', totalsX, doc.y, { width: totalsWidth * 0.55 });
  doc.fontSize(9).fillColor(COLORS.text)
    .text(formatCents(invoice.taxAmount, invoice.currency), valX, doc.y - 13, { width: valWidth, align: 'right' });

  doc.moveDown(0.5);

  // Total divider (amber line)
  doc.moveTo(totalsX, doc.y)
    .lineTo(totalsX + totalsWidth, doc.y)
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .stroke();

  doc.moveDown(0.5);

  // Grand total
  doc.fontSize(12).fillColor(COLORS.dark)
    .text('Total', totalsX, doc.y, { width: totalsWidth * 0.55 });
  doc.fontSize(14).fillColor(COLORS.primary)
    .text(formatCents(invoice.total, invoice.currency), valX, doc.y - 17, { width: valWidth, align: 'right' });

  doc.moveDown(0.5);

  // Paid + Balance Due (if partially paid)
  if (invoice.paidAmount > 0) {
    doc.fontSize(9).fillColor(COLORS.green)
      .text('Paid', totalsX, doc.y, { width: totalsWidth * 0.55 });
    doc.fontSize(9).fillColor(COLORS.green)
      .text(formatCents(invoice.paidAmount, invoice.currency), valX, doc.y - 13, { width: valWidth, align: 'right' });

    doc.moveDown(0.5);

    const balanceDue = invoice.total - invoice.paidAmount;
    doc.fontSize(11).fillColor(COLORS.dark)
      .text('Balance Due', totalsX, doc.y, { width: totalsWidth * 0.55 });
    doc.fontSize(12).fillColor(COLORS.red)
      .text(formatCents(balanceDue, invoice.currency), valX, doc.y - 15, { width: valWidth, align: 'right' });
  }

  // ─── Notes ────────────────────────────────────────────────────

  if (invoice.notes) {
    doc.moveDown(2);
    doc.moveTo(leftCol, doc.y)
      .lineTo(leftCol + pageWidth, doc.y)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();

    doc.moveDown(0.5);
    doc.fontSize(7).fillColor(COLORS.light).text('NOTES', leftCol);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(COLORS.muted).text(invoice.notes, leftCol, doc.y, {
      width: pageWidth,
      lineGap: 3,
    });
  }

  // ─── Footer ───────────────────────────────────────────────────

  doc.fontSize(7).fillColor(COLORS.light)
    .text(
      `Generated by Akount — ${entity.name}`,
      leftCol,
      doc.page.height - doc.page.margins.bottom - 20,
      { width: pageWidth, align: 'center' }
    );
}
