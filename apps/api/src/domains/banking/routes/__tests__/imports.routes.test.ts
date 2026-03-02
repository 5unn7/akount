import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { importsRoutes } from '../imports';
import { assertIntegerCents } from '../../../../test-utils/financial-assertions';

// Mock auth middleware
vi.mock('../../../../middleware/auth', () => ({
  authMiddleware: vi.fn(async (request, _reply) => {
    request.userId = 'user-123';
  }),
}));

// Mock tenant middleware
vi.mock('../../../../middleware/tenant', () => ({
  tenantMiddleware: vi.fn(async (request, _reply) => {
    request.tenantId = 'tenant-abc-123';
  }),
}));

// Mock file scanner (security scanning tested separately in file-scanner.test.ts)
vi.mock('../../../../lib/file-scanner', () => ({
  scanFile: vi.fn().mockResolvedValue({
    safe: true,
    threats: [],
    fileType: 'csv',
    magicBytesValid: true,
    clamavScanned: false,
  }),
}));

// Mock ImportService
const mockCreateCSVImport = vi.fn();
const mockCreatePDFImport = vi.fn();
const mockCreateXLSXImport = vi.fn();
const mockGetImportBatch = vi.fn();
const mockListImportBatches = vi.fn();

vi.mock('../../services/import.service', () => ({
  ImportService: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.createCSVImport = mockCreateCSVImport;
    this.createPDFImport = mockCreatePDFImport;
    this.createXLSXImport = mockCreateXLSXImport;
    this.getImportBatch = mockGetImportBatch;
    this.listImportBatches = mockListImportBatches;
  }),
}));

const TENANT_ID = 'tenant-abc-123';
const ACCOUNT_ID = 'acc-xyz-789';
const IMPORT_BATCH_ID = 'cm0batch12345678901234';
const CURSOR_ID = 'cm0cursor1234567890123';

function mockImportBatchResult() {
  return {
    id: IMPORT_BATCH_ID,
    tenantId: TENANT_ID,
    entityId: 'entity-123',
    sourceType: 'CSV',
    status: 'PROCESSED',
    error: null,
    createdAt: new Date('2024-01-15'),
    stats: {
      total: 10,
      imported: 8,
      duplicates: 2,
      skipped: 0,
    },
  };
}

function mockImportBatchWithTransactions() {
  return {
    id: IMPORT_BATCH_ID,
    tenantId: TENANT_ID,
    entityId: 'entity-123',
    sourceType: 'CSV',
    status: 'PROCESSED',
    error: null,
    createdAt: new Date('2024-01-15'),
    transactions: [
      {
        id: 'txn-1',
        accountId: ACCOUNT_ID,
        date: new Date('2024-01-15'),
        description: 'Coffee shop',
        amount: 550,
        deletedAt: null,
      },
    ],
    _count: {
      transactions: 1,
    },
  };
}

describe('Import Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    app = Fastify({ logger: false });
    await app.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
      },
    });
    await app.register(importsRoutes, { prefix: '/imports' });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /csv', () => {
    it('should return 201 on successful CSV upload', async () => {
      mockCreateCSVImport.mockResolvedValueOnce(mockImportBatchResult());

      // Create multipart form data manually
      // IMPORTANT: accountId must come BEFORE file (Fastify multipart streams fields in order)
      const csvContent = 'date,description,amount\n2024-01-15,Coffee,5.50';
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.csv"`,
        `Content-Type: text/csv`,
        ``,
        csvContent,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/csv',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe(IMPORT_BATCH_ID);
      expect(body.stats.total).toBe(10);
      expect(body.stats.imported).toBe(8);
      expect(mockCreateCSVImport).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: ACCOUNT_ID,
        })
      );
    });

    it('should return 400 when no file uploaded', async () => {
      // Send multipart with only a text field, no file
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/csv',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('No file uploaded');
    });

    it('should return 400 when accountId missing', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.csv"`,
        `Content-Type: text/csv`,
        ``,
        `date,description,amount`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/csv',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('accountId is required');
    });

    it('should return 400 for invalid file extension', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.txt"`,
        `Content-Type: text/plain`,
        ``,
        `fake content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/csv',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('Invalid file type');
    });

    it('should return 403 when account not found', async () => {
      mockCreateCSVImport.mockRejectedValueOnce(new Error('Account not found or access denied'));

      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        `invalid-account`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.csv"`,
        `Content-Type: text/csv`,
        ``,
        `date,description,amount`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/csv',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(403);
      const body = response.json();
      expect(body.message).toContain('Account not found');
    });
  });

  describe('POST /pdf', () => {
    it('should return 201 on successful PDF upload', async () => {
      mockCreatePDFImport.mockResolvedValueOnce({
        ...mockImportBatchResult(),
        sourceType: 'PDF',
      });

      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.pdf"`,
        `Content-Type: application/pdf`,
        ``,
        `fake PDF content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/pdf',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.sourceType).toBe('PDF');
      expect(mockCreatePDFImport).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: ACCOUNT_ID,
        })
      );
    });

    it('should return 400 when no file uploaded', async () => {
      // Send multipart with only a text field, no file
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/pdf',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('No file uploaded');
    });

    it('should return 400 for invalid file extension', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.csv"`,
        `Content-Type: text/csv`,
        ``,
        `fake content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/pdf',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('Invalid file type');
      expect(body.message).toContain('PDF');
    });

    it('should return 403 when account not found', async () => {
      mockCreatePDFImport.mockRejectedValueOnce(new Error('Account not found or access denied'));

      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        `invalid-account`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.pdf"`,
        `Content-Type: application/pdf`,
        ``,
        `fake PDF`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/pdf',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(403);
      const body = response.json();
      expect(body.message).toContain('Account not found');
    });
  });

  describe('POST /xlsx', () => {
    it('should return 201 on successful XLSX upload', async () => {
      mockCreateXLSXImport.mockResolvedValueOnce({
        ...mockImportBatchResult(),
        sourceType: 'CSV', // XLSX stored as CSV sourceType
      });

      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.xlsx"`,
        `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
        ``,
        `fake XLSX content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/xlsx',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.id).toBe(IMPORT_BATCH_ID);
      expect(mockCreateXLSXImport).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: ACCOUNT_ID,
        })
      );
    });

    it('should return 400 when no file uploaded', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/xlsx',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('No file uploaded');
    });

    it('should return 400 when accountId missing', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.xlsx"`,
        `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
        ``,
        `fake xlsx`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/xlsx',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('accountId is required');
    });

    it('should return 400 for invalid file extension', async () => {
      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        ACCOUNT_ID,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.csv"`,
        `Content-Type: text/csv`,
        ``,
        `fake content`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/xlsx',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('Invalid file type');
      expect(body.message).toContain('Excel');
    });

    it('should return 403 when account not found', async () => {
      mockCreateXLSXImport.mockRejectedValueOnce(new Error('Account not found or access denied'));

      const payload = [
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="accountId"`,
        ``,
        `invalid-account`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW`,
        `Content-Disposition: form-data; name="file"; filename="statement.xlsx"`,
        `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
        ``,
        `fake xlsx`,
        `------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
      ].join('\r\n');

      const response = await app.inject({
        method: 'POST',
        url: '/imports/xlsx',
        headers: {
          'content-type': `multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW`,
        },
        payload,
      });

      expect(response.statusCode).toBe(403);
      const body = response.json();
      expect(body.message).toContain('Account not found');
    });
  });

  describe('GET /', () => {
    it('should return 200 with paginated import batches', async () => {
      mockListImportBatches.mockResolvedValueOnce({
        batches: [mockImportBatchWithTransactions()],
        nextCursor: undefined,
        hasMore: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/imports',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.batches).toHaveLength(1);
      expect(body.hasMore).toBe(false);
      expect(mockListImportBatches).toHaveBeenCalledWith({});

      // Financial invariant: transaction amounts in batches must be integer cents
      const txn = body.batches[0].transactions[0];
      assertIntegerCents(txn.amount, 'import transaction amount');
    });

    it('should filter by sourceType', async () => {
      mockListImportBatches.mockResolvedValueOnce({
        batches: [],
        nextCursor: undefined,
        hasMore: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/imports?sourceType=CSV',
      });

      expect(response.statusCode).toBe(200);
      expect(mockListImportBatches).toHaveBeenCalledWith({
        sourceType: 'CSV',
      });
    });

    it('should filter by status', async () => {
      mockListImportBatches.mockResolvedValueOnce({
        batches: [],
        nextCursor: undefined,
        hasMore: false,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/imports?status=PROCESSED',
      });

      expect(response.statusCode).toBe(200);
      expect(mockListImportBatches).toHaveBeenCalledWith({
        status: 'PROCESSED',
      });
    });

    it('should handle pagination with cursor and limit', async () => {
      mockListImportBatches.mockResolvedValueOnce({
        batches: [],
        nextCursor: 'next-cursor',
        hasMore: true,
      });

      const response = await app.inject({
        method: 'GET',
        url: `/imports?cursor=${CURSOR_ID}&limit=25`,
      });

      expect(response.statusCode).toBe(200);
      expect(mockListImportBatches).toHaveBeenCalledWith({
        cursor: CURSOR_ID,
        limit: 25,
      });
    });
  });

  describe('GET /:id', () => {
    it('should return 200 with import batch details', async () => {
      mockGetImportBatch.mockResolvedValueOnce(mockImportBatchWithTransactions());

      const response = await app.inject({
        method: 'GET',
        url: `/imports/${IMPORT_BATCH_ID}`,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.id).toBe(IMPORT_BATCH_ID);
      expect(body.transactions).toHaveLength(1);
      expect(mockGetImportBatch).toHaveBeenCalledWith(IMPORT_BATCH_ID);

      // Financial invariant: transaction amounts must be integer cents
      assertIntegerCents(body.transactions[0].amount, 'transaction amount');
    });

    it('should return 404 when batch not found', async () => {
      mockGetImportBatch.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/imports/${IMPORT_BATCH_ID}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json();
      expect(body.message).toContain('not found');
    });

    it('should return 400 for invalid batch ID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/imports/invalid-id',
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('Invalid');
    });
  });
});
