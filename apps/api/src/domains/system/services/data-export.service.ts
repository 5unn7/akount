import { PassThrough } from 'stream';
import archiver from 'archiver';
import { prisma } from '@akount/db';
import type { FastifyReply } from 'fastify';

/**
 * Data Export Service
 *
 * Streams tenant data as a ZIP archive with cursor-paginated reads.
 * Never holds entire dataset in memory — each table is streamed in batches.
 *
 * OWNER/ADMIN only. Audit logged at the route level.
 */

const BATCH_SIZE = 500;

interface TableConfig {
  name: string;
  model: string;
  columns: string[];
  /**
   * If true, records are scoped via entity.tenantId instead of direct tenantId.
   */
  entityScoped?: boolean;
  /**
   * If true, include soft-deleted records in the export (for full backup).
   */
  includeSoftDeleted?: boolean;
}

const EXPORT_TABLES: TableConfig[] = [
  {
    name: 'entities',
    model: 'entity',
    columns: ['id', 'name', 'type', 'country', 'functionalCurrency', 'fiscalYearStart', 'taxId', 'address', 'city', 'state', 'postalCode', 'createdAt', 'updatedAt'],
  },
  {
    name: 'gl-accounts',
    model: 'gLAccount',
    columns: ['id', 'entityId', 'code', 'name', 'type', 'normalBalance', 'parentId', 'isActive', 'createdAt'],
    entityScoped: true,
  },
  {
    name: 'journal-entries',
    model: 'journalEntry',
    columns: ['id', 'entityId', 'entryNumber', 'date', 'memo', 'sourceType', 'sourceId', 'status', 'createdAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'journal-lines',
    model: 'journalLine',
    columns: ['id', 'journalEntryId', 'glAccountId', 'debitAmount', 'creditAmount', 'currency', 'exchangeRate', 'baseCurrencyDebit', 'baseCurrencyCredit', 'memo', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'clients',
    model: 'client',
    columns: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country', 'taxId', 'createdAt', 'updatedAt'],
  },
  {
    name: 'invoices',
    model: 'invoice',
    columns: ['id', 'entityId', 'clientId', 'invoiceNumber', 'status', 'issueDate', 'dueDate', 'subtotal', 'taxAmount', 'total', 'currency', 'paidAmount', 'createdAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'vendors',
    model: 'vendor',
    columns: ['id', 'name', 'email', 'phone', 'address', 'city', 'state', 'postalCode', 'country', 'taxId', 'createdAt', 'updatedAt'],
  },
  {
    name: 'bills',
    model: 'bill',
    columns: ['id', 'entityId', 'vendorId', 'billNumber', 'status', 'issueDate', 'dueDate', 'subtotal', 'taxAmount', 'total', 'currency', 'paidAmount', 'createdAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'accounts',
    model: 'account',
    columns: ['id', 'entityId', 'name', 'type', 'subtype', 'institution', 'accountNumber', 'currency', 'currentBalance', 'isActive', 'createdAt', 'updatedAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'transactions',
    model: 'transaction',
    columns: ['id', 'accountId', 'date', 'description', 'amount', 'currency', 'type', 'categoryId', 'status', 'reconciled', 'createdAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'payments',
    model: 'payment',
    columns: ['id', 'entityId', 'paymentNumber', 'type', 'amount', 'currency', 'date', 'method', 'reference', 'status', 'createdAt', 'deletedAt'],
    entityScoped: true,
    includeSoftDeleted: true,
  },
  {
    name: 'categories',
    model: 'category',
    columns: ['id', 'name', 'type', 'parentId', 'glAccountId', 'isSystem', 'createdAt'],
  },
];

/**
 * Sanitize a value for CSV output.
 * Prevents formula injection per OWASP guidelines.
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  const str = value instanceof Date
    ? value.toISOString()
    : String(value);

  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }

  // Escape if contains comma, quote, or newline
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Stream a full data backup as a ZIP archive.
 *
 * Uses cursor-paginated reads — never holds more than BATCH_SIZE rows in memory.
 * Each table is appended as a CSV file inside the ZIP.
 */
export async function streamDataBackup(
  reply: FastifyReply,
  tenantId: string,
  entityId?: string,
): Promise<void> {
  const archive = archiver('zip', { zlib: { level: 6 } });

  reply.raw.setHeader('Content-Type', 'application/zip');
  reply.raw.setHeader(
    'Content-Disposition',
    `attachment; filename="akount-backup-${new Date().toISOString().split('T')[0]}.zip"`,
  );

  archive.pipe(reply.raw);

  // Collect row counts for metadata
  const tableCounts: Record<string, number> = {};

  // Determine entity IDs for filtering
  let entityIds: string[] | undefined;
  if (entityId) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: entityId, tenantId },
      select: { id: true },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }
    entityIds = [entityId];
  } else {
    const entities = await prisma.entity.findMany({
      where: { tenantId },
      select: { id: true },
    });
    entityIds = entities.map(e => e.id);
  }

  for (const table of EXPORT_TABLES) {
    const csvStream = new PassThrough();
    archive.append(csvStream, { name: `${table.name}.csv` });

    // Write header
    csvStream.write(table.columns.join(',') + '\n');

    let cursor: string | undefined;
    let rowCount = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const where = buildWhere(table, tenantId, entityIds);
      const queryOptions: Record<string, unknown> = {
        where,
        take: BATCH_SIZE,
        orderBy: { id: 'asc' as const },
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      };

      // Use dynamic model access
      const modelDelegate = (prisma as Record<string, unknown>)[table.model] as {
        findMany: (args: Record<string, unknown>) => Promise<Record<string, unknown>[]>;
      };

      const rows = await modelDelegate.findMany(queryOptions);

      for (const row of rows) {
        const csvRow = table.columns
          .map(col => sanitizeCsvCell(row[col]))
          .join(',');
        csvStream.write(csvRow + '\n');
      }

      rowCount += rows.length;

      if (rows.length < BATCH_SIZE) break;
      cursor = rows[rows.length - 1].id as string;
    }

    tableCounts[table.name] = rowCount;
    csvStream.end();
  }

  // Add metadata.json
  const metadata = {
    exportDate: new Date().toISOString(),
    tenantId,
    entityId: entityId || 'all',
    schemaVersion: '1.0',
    tables: Object.entries(tableCounts).map(([name, count]) => ({
      name,
      rowCount: count,
    })),
    totalRows: Object.values(tableCounts).reduce((sum, c) => sum + c, 0),
  };

  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

  await archive.finalize();
}

/**
 * Build Prisma where clause based on table scoping.
 */
function buildWhere(
  table: TableConfig,
  tenantId: string,
  entityIds: string[] | undefined,
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (table.entityScoped) {
    // Entity-scoped models: filter by entityId(s)
    if (table.model === 'journalLine') {
      // JournalLine is scoped via journalEntry.entityId
      where.journalEntry = {
        entityId: entityIds ? { in: entityIds } : undefined,
        entity: { tenantId },
      };
    } else if (table.model === 'transaction') {
      // Transaction is scoped via account.entityId
      where.account = {
        entityId: entityIds ? { in: entityIds } : undefined,
        entity: { tenantId },
      };
    } else {
      // Direct entityId field
      if (entityIds) {
        where.entityId = { in: entityIds };
      }
      where.entity = { tenantId };
    }
  } else {
    // Tenant-scoped models
    where.tenantId = tenantId;
  }

  return where;
}
