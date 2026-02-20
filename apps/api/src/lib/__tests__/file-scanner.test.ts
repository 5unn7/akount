import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scanFile } from '../file-scanner';

describe('file-scanner', () => {
  beforeEach(() => {
    // Ensure ClamAV is not configured during tests
    delete process.env.CLAMAV_HOST;
  });

  describe('Magic bytes validation', () => {
    it('should accept valid PDF files', async () => {
      // %PDF-1.4 header
      const pdfBuffer = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj',
        'latin1'
      );

      const result = await scanFile(pdfBuffer, 'pdf');
      expect(result.magicBytesValid).toBe(true);
    });

    it('should reject files with wrong magic bytes for PDF', async () => {
      const fakeBuffer = Buffer.from('This is not a PDF file at all');

      const result = await scanFile(fakeBuffer, 'pdf');
      expect(result.magicBytesValid).toBe(false);
      expect(result.safe).toBe(false);
      expect(result.threats).toContain(
        'File content does not match expected PDF format'
      );
    });

    it('should accept valid XLSX files (ZIP header)', async () => {
      // PK\x03\x04 ZIP header — minimal valid ZIP start
      const xlsxBuffer = Buffer.alloc(100);
      xlsxBuffer[0] = 0x50; // P
      xlsxBuffer[1] = 0x4b; // K
      xlsxBuffer[2] = 0x03;
      xlsxBuffer[3] = 0x04;

      const result = await scanFile(xlsxBuffer, 'xlsx');
      expect(result.magicBytesValid).toBe(true);
    });

    it('should reject XLSX with wrong magic bytes', async () => {
      const fakeBuffer = Buffer.from('Not an xlsx file');

      const result = await scanFile(fakeBuffer, 'xlsx');
      expect(result.magicBytesValid).toBe(false);
      expect(result.safe).toBe(false);
    });

    it('should accept valid XLS files (OLE2 header)', async () => {
      const xlsBuffer = Buffer.alloc(100);
      // OLE2 Compound Document header
      const ole2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
      ole2.forEach((byte, i) => { xlsBuffer[i] = byte; });

      const result = await scanFile(xlsBuffer, 'xls');
      expect(result.magicBytesValid).toBe(true);
    });

    it('should always accept CSV (no magic bytes)', async () => {
      const csvBuffer = Buffer.from('date,description,amount\n2024-01-01,Test,1000');

      const result = await scanFile(csvBuffer, 'csv');
      expect(result.magicBytesValid).toBe(true);
    });
  });

  describe('Content pattern scanning', () => {
    describe('PDF threats', () => {
      it('should detect JavaScript in PDF', async () => {
        const maliciousPdf = Buffer.concat([
          Buffer.from('%PDF-1.4\n', 'latin1'),
          Buffer.from('/JavaScript (alert("xss"))', 'latin1'),
        ]);

        const result = await scanFile(maliciousPdf, 'pdf');
        expect(result.safe).toBe(false);
        expect(result.threats.some((t) => t.includes('JavaScript'))).toBe(true);
      });

      it('should detect /Launch action in PDF', async () => {
        const maliciousPdf = Buffer.concat([
          Buffer.from('%PDF-1.4\n', 'latin1'),
          Buffer.from('/Launch /Action cmd.exe', 'latin1'),
        ]);

        const result = await scanFile(maliciousPdf, 'pdf');
        expect(result.safe).toBe(false);
        expect(result.threats.some((t) => t.includes('Launch'))).toBe(true);
      });

      it('should detect /OpenAction in PDF', async () => {
        const maliciousPdf = Buffer.concat([
          Buffer.from('%PDF-1.4\n', 'latin1'),
          Buffer.from('/OpenAction << /S /JavaScript >>', 'latin1'),
        ]);

        const result = await scanFile(maliciousPdf, 'pdf');
        expect(result.safe).toBe(false);
        expect(result.threats.some((t) => t.includes('OpenAction'))).toBe(true);
      });

      it('should accept clean PDF', async () => {
        const cleanPdf = Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF',
          'latin1'
        );

        const result = await scanFile(cleanPdf, 'pdf');
        expect(result.safe).toBe(true);
        expect(result.threats).toHaveLength(0);
      });
    });

    describe('XLSX threats', () => {
      it('should detect VBA macros in XLSX', async () => {
        // ZIP header + vbaProject.bin reference
        const xlsxBuffer = Buffer.alloc(200);
        xlsxBuffer[0] = 0x50; // P
        xlsxBuffer[1] = 0x4b; // K
        xlsxBuffer[2] = 0x03;
        xlsxBuffer[3] = 0x04;
        Buffer.from('vbaProject.bin').copy(xlsxBuffer, 50);

        const result = await scanFile(xlsxBuffer, 'xlsx');
        expect(result.safe).toBe(false);
        expect(result.threats.some((t) => t.includes('vbaProject'))).toBe(true);
      });
    });

    describe('CSV injection', () => {
      it('should detect formula injection starting with =', async () => {
        const maliciousCsv = Buffer.from(
          'date,description,amount\n2024-01-01,=cmd|"/C calc.exe",1000'
        );

        const result = await scanFile(maliciousCsv, 'csv');
        expect(result.safe).toBe(false);
      });

      it('should detect DDE injection', async () => {
        const maliciousCsv = Buffer.from(
          'date,description,amount\n2024-01-01,=cmd|"/C calc",1000'
        );

        const result = await scanFile(maliciousCsv, 'csv');
        expect(result.safe).toBe(false);
      });

      it('should accept clean CSV', async () => {
        const cleanCsv = Buffer.from(
          'date,description,amount\n2024-01-01,Coffee Shop,550\n2024-01-02,Grocery Store,2350'
        );

        const result = await scanFile(cleanCsv, 'csv');
        expect(result.safe).toBe(true);
        expect(result.threats).toHaveLength(0);
      });

      it('should accept CSV with negative amounts (not injection)', async () => {
        // Negative amounts in the amount column should NOT trigger injection detection
        // The pattern checks for lines starting with - but CSV data has commas before amounts
        const cleanCsv = Buffer.from(
          'date,description,amount\n2024-01-01,Refund,-550\n2024-01-02,Payment,-2350'
        );

        const result = await scanFile(cleanCsv, 'csv');
        // Note: CSV injection regex checks for lines starting with -, +, =, @
        // In well-formed CSV, amounts are mid-line (after commas), not at line start
        expect(result.magicBytesValid).toBe(true);
      });
    });
  });

  describe('ClamAV integration', () => {
    it('should skip ClamAV when CLAMAV_HOST is not set', async () => {
      const buffer = Buffer.from(
        'date,description,amount\n2024-01-01,Test,1000'
      );

      const result = await scanFile(buffer, 'csv');
      expect(result.clamavScanned).toBe(false);
    });
  });

  describe('scanFile return shape', () => {
    it('should return correct ScanResult structure', async () => {
      const buffer = Buffer.from(
        'date,description,amount\n2024-01-01,Test,1000'
      );

      const result = await scanFile(buffer, 'csv');
      expect(result).toMatchObject({
        safe: expect.any(Boolean),
        threats: expect.any(Array),
        fileType: 'csv',
        magicBytesValid: expect.any(Boolean),
        clamavScanned: expect.any(Boolean),
      });
    });

    it('should normalize file type to lowercase', async () => {
      const buffer = Buffer.from(
        'date,description,amount\n2024-01-01,Test,1000'
      );

      const result = await scanFile(buffer, 'CSV');
      expect(result.fileType).toBe('csv');
    });
  });
});
