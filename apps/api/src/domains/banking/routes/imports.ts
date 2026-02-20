import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ImportService } from '../services/import.service';
import { authMiddleware } from '../../../middleware/auth';
import { tenantMiddleware } from '../../../middleware/tenant';
import { scanFile } from '../../../lib/file-scanner';
import { z } from 'zod';

/**
 * Import Routes - CSV & PDF Bank Statement Imports
 *
 * Simplified routes using ImportService for immediate import processing.
 * Nested under /api/banking/imports
 */

// Zod schemas for validation
const ListImportsQuerySchema = z.object({
  entityId: z.string().cuid().optional(),
  sourceType: z.enum(['CSV', 'PDF', 'BANK_FEED', 'API']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED']).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const GetImportParamsSchema = z.object({
  id: z.string().cuid(),
});

// Multipart fields type
type MultipartFields = {
  accountId?: { value: string };
  dateFormat?: { value: string };
  columnMappings?: { value: string }; // JSON string for CSV
};

export async function importsRoutes(fastify: FastifyInstance) {
  /**
   * POST /csv
   *
   * Upload CSV file and create import batch immediately.
   * Parses CSV → deduplicates → creates ImportBatch + Transactions.
   */
  fastify.post(
    '/csv',
    {
      onRequest: [authMiddleware, tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get file from multipart/form-data
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        // Extract form fields
        const fields = data.fields as MultipartFields;
        const accountId = fields.accountId?.value;
        const dateFormat = fields.dateFormat?.value as
          | 'MM/DD/YYYY'
          | 'DD/MM/YYYY'
          | 'YYYY-MM-DD'
          | undefined;

        // Optional column mappings (JSON string)
        let columnMappings;
        if (fields.columnMappings?.value) {
          try {
            columnMappings = JSON.parse(fields.columnMappings.value);
          } catch (error) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Invalid columnMappings JSON',
            });
          }
        }

        if (!accountId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'accountId is required',
          });
        }

        // Validate file type
        const fileName = data.filename.toLowerCase();
        if (!fileName.endsWith('.csv')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid file type. Expected CSV file (.csv extension)',
          });
        }

        // Check MIME type
        const validMimeTypes = ['text/csv', 'text/plain', 'application/csv'];
        if (data.mimetype && !validMimeTypes.includes(data.mimetype)) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid MIME type. Expected ${validMimeTypes.join(', ')}, got ${data.mimetype}`,
          });
        }

        // Get file buffer
        const fileBuffer = await data.toBuffer();

        // Validate file size (10MB max - already enforced by multipart config)
        const maxSize = 10 * 1024 * 1024;
        if (fileBuffer.length > maxSize) {
          return reply.status(413).send({
            error: 'Payload Too Large',
            message: `File size exceeds 10MB limit. Your file is ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
          });
        }

        // Security scan: magic bytes + content patterns + optional ClamAV
        const scanResult = await scanFile(fileBuffer, 'csv');
        if (!scanResult.safe) {
          request.log.warn({ threats: scanResult.threats, fileName }, 'CSV file rejected by security scan');
          return reply.status(422).send({
            error: 'File Rejected',
            message: 'File failed security scan',
            threats: scanResult.threats,
          });
        }

        // Create import using ImportService
        const importService = new ImportService(request.tenantId as string);
        const result = await importService.createCSVImport({
          file: fileBuffer,
          accountId,
          columnMappings,
          dateFormat,
        });

        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error uploading CSV file');

        if (error instanceof Error) {
          // Handle specific errors from ImportService
          if (error.message.includes('Account not found')) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: error.message,
            });
          }

          if (error.message.includes('CSV parsing error')) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: error.message,
            });
          }

          // Return error message for other known errors
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while processing the CSV file',
        });
      }
    }
  );

  /**
   * POST /xlsx
   *
   * Upload XLSX/XLS file and create import batch immediately.
   * Parses spreadsheet → deduplicates → creates ImportBatch + Transactions.
   */
  fastify.post(
    '/xlsx',
    {
      onRequest: [authMiddleware, tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        const fields = data.fields as MultipartFields;
        const accountId = fields.accountId?.value;
        const dateFormat = fields.dateFormat?.value as
          | 'MM/DD/YYYY'
          | 'DD/MM/YYYY'
          | 'YYYY-MM-DD'
          | undefined;

        let columnMappings;
        if (fields.columnMappings?.value) {
          try {
            columnMappings = JSON.parse(fields.columnMappings.value);
          } catch (error) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: 'Invalid columnMappings JSON',
            });
          }
        }

        if (!accountId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'accountId is required',
          });
        }

        const fileName = data.filename.toLowerCase();
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid file type. Expected Excel file (.xlsx or .xls extension)',
          });
        }

        const fileBuffer = await data.toBuffer();
        const maxSize = 10 * 1024 * 1024;
        if (fileBuffer.length > maxSize) {
          return reply.status(413).send({
            error: 'Payload Too Large',
            message: `File size exceeds 10MB limit. Your file is ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
          });
        }

        // Security scan: magic bytes + content patterns + optional ClamAV
        const xlsxType = fileName.endsWith('.xls') ? 'xls' : 'xlsx';
        const scanResult = await scanFile(fileBuffer, xlsxType);
        if (!scanResult.safe) {
          request.log.warn({ threats: scanResult.threats, fileName }, 'XLSX file rejected by security scan');
          return reply.status(422).send({
            error: 'File Rejected',
            message: 'File failed security scan',
            threats: scanResult.threats,
          });
        }

        const importService = new ImportService(request.tenantId as string);
        const result = await importService.createXLSXImport({
          file: fileBuffer,
          accountId,
          columnMappings,
          dateFormat,
        });

        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error uploading XLSX file');

        if (error instanceof Error) {
          if (error.message.includes('Account not found')) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: error.message,
            });
          }

          if (error.message.includes('XLSX')) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: error.message,
            });
          }

          return reply.status(500).send({
            error: 'Internal Server Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while processing the XLSX file',
        });
      }
    }
  );

  /**
   * POST /pdf
   *
   * Upload PDF file and create import batch immediately.
   * Parses PDF → deduplicates → creates ImportBatch + Transactions.
   */
  fastify.post(
    '/pdf',
    {
      onRequest: [authMiddleware, tenantMiddleware],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Get file from multipart/form-data
        const data = await request.file();

        if (!data) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded',
          });
        }

        // Extract form fields
        const fields = data.fields as MultipartFields;
        const accountId = fields.accountId?.value;
        const dateFormat = fields.dateFormat?.value as
          | 'MM/DD/YYYY'
          | 'DD/MM/YYYY'
          | 'YYYY-MM-DD'
          | undefined;

        if (!accountId) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'accountId is required',
          });
        }

        // Validate file type
        const fileName = data.filename.toLowerCase();
        if (!fileName.endsWith('.pdf')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid file type. Expected PDF file (.pdf extension)',
          });
        }

        // Check MIME type
        if (data.mimetype && data.mimetype !== 'application/pdf') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: `Invalid MIME type. Expected application/pdf, got ${data.mimetype}`,
          });
        }

        // Get file buffer
        const fileBuffer = await data.toBuffer();

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (fileBuffer.length > maxSize) {
          return reply.status(413).send({
            error: 'Payload Too Large',
            message: `File size exceeds 10MB limit. Your file is ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
          });
        }

        // Security scan: magic bytes + content patterns + optional ClamAV
        const scanResult = await scanFile(fileBuffer, 'pdf');
        if (!scanResult.safe) {
          request.log.warn({ threats: scanResult.threats, fileName }, 'PDF file rejected by security scan');
          return reply.status(422).send({
            error: 'File Rejected',
            message: 'File failed security scan',
            threats: scanResult.threats,
          });
        }

        // Create import using ImportService
        const importService = new ImportService(request.tenantId as string);
        const result = await importService.createPDFImport({
          file: fileBuffer,
          accountId,
          dateFormat,
        });

        return reply.status(201).send(result);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error uploading PDF file');

        if (error instanceof Error) {
          // Handle specific errors from ImportService
          if (error.message.includes('Account not found')) {
            return reply.status(403).send({
              error: 'Forbidden',
              message: error.message,
            });
          }

          if (error.message.includes('PDF')) {
            return reply.status(400).send({
              error: 'Bad Request',
              message: error.message,
            });
          }

          // Return error message for other known errors
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: error.message,
          });
        }

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while processing the PDF file',
        });
      }
    }
  );

  /**
   * GET /
   *
   * List import batches with pagination and filtering.
   */
  fastify.get(
    '/',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            entityId: { type: 'string' },
            sourceType: { type: 'string', enum: ['CSV', 'PDF', 'BANK_FEED', 'API'] },
            status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED'] },
            cursor: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100 },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Parse and validate query parameters
        const query = request.query as Record<string, unknown>;
        const validated = ListImportsQuerySchema.safeParse({
          ...query,
          ...(query.limit != null ? { limit: Number(query.limit) } : {}),
        });

        if (!validated.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid query parameters',
            details: validated.error.errors,
          });
        }

        const params = validated.data;

        // List batches using ImportService
        const importService = new ImportService(request.tenantId as string);
        const result = await importService.listImportBatches(params);

        return reply.status(200).send(result);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error listing import batches');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while listing import batches',
        });
      }
    }
  );

  /**
   * GET /:id
   *
   * Get import batch details by ID with all transactions.
   */
  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware, tenantMiddleware],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate params
        const params = request.params as Record<string, string>;
        const validated = GetImportParamsSchema.safeParse(params);

        if (!validated.success) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Invalid import batch ID',
            details: validated.error.errors,
          });
        }

        const { id } = validated.data;

        // Get batch using ImportService
        const importService = new ImportService(request.tenantId as string);
        const batch = await importService.getImportBatch(id);

        if (!batch) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'Import batch not found',
          });
        }

        return reply.status(200).send(batch);
      } catch (error: unknown) {
        request.log.error({ error }, 'Error retrieving import batch');

        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred while retrieving the import batch',
        });
      }
    }
  );
}
