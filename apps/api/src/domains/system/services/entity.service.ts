import { prisma, type EntityStatus, type EntityType } from '@akount/db';
import { createAuditLog } from '../../../lib/audit';

/**
 * Entity Service
 *
 * Handles entity-level operations with tenant isolation.
 * All methods enforce tenantId filtering for multi-tenant security.
 */
export class EntityService {
  constructor(
    private tenantId: string,
    private userId: string = 'system'
  ) {}

  /**
   * List all entities for the tenant with optional status filter.
   */
  async listEntities(options?: { status?: EntityStatus }) {
    return prisma.entity.findMany({
      where: {
        tenantId: this.tenantId,
        ...(options?.status && { status: options.status }),
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        entitySubType: true,
        functionalCurrency: true,
        reportingCurrency: true,
        country: true,
        fiscalYearStart: true,
        taxId: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            clients: true,
            vendors: true,
            invoices: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a specific entity by ID with full detail and counts.
   */
  async getEntityDetail(id: string) {
    return prisma.entity.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        _count: {
          select: {
            accounts: true,
            glAccounts: true,
            clients: true,
            vendors: true,
            invoices: true,
            bills: true,
            journalEntries: true,
            payments: true,
          },
        },
      },
    });
  }

  /**
   * Get a specific entity by ID (lightweight, for backwards compat).
   */
  async getEntity(id: string) {
    return prisma.entity.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
      include: {
        _count: {
          select: {
            accounts: true,
            glAccounts: true,
            clients: true,
            vendors: true,
          },
        },
      },
    });
  }

  /**
   * Create a new entity.
   */
  async createEntity(
    userId: string,
    data: {
      name: string;
      type: string;
      country: string;
      functionalCurrency: string;
      reportingCurrency?: string;
      fiscalYearStart?: number;
      entitySubType?: string;
      taxId?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    }
  ) {
    const entity = await prisma.entity.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        type: data.type as EntityType,
        country: data.country,
        functionalCurrency: data.functionalCurrency,
        reportingCurrency: data.reportingCurrency || data.functionalCurrency,
        fiscalYearStart: data.fiscalYearStart || 1,
        ...(data.entitySubType && { entitySubType: data.entitySubType }),
        ...(data.taxId && { taxId: data.taxId }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.postalCode && { postalCode: data.postalCode }),
      },
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId,
      entityId: entity.id,
      model: 'Entity',
      recordId: entity.id,
      action: 'CREATE',
      after: { name: entity.name, type: entity.type, country: entity.country },
    });

    return entity;
  }

  /**
   * Update an entity with expanded field support.
   */
  async updateEntity(
    id: string,
    data: {
      name?: string;
      fiscalYearStart?: number;
      entitySubType?: string | null;
      taxId?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
      registrationDate?: Date | null;
    }
  ) {
    const existing = await prisma.entity.findFirst({
      where: { id, tenantId: this.tenantId },
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.entity.update({
      where: { id },
      data,
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: id,
      model: 'Entity',
      recordId: id,
      action: 'UPDATE',
      before: {
        name: existing.name,
        taxId: existing.taxId,
        address: existing.address,
        entitySubType: existing.entitySubType,
      },
      after: {
        name: updated.name,
        taxId: updated.taxId,
        address: updated.address,
        entitySubType: updated.entitySubType,
      },
    });

    return updated;
  }

  /**
   * Archive an entity after validating no active data blocks archival.
   *
   * Rejects if entity has:
   * - Active bank accounts
   * - Unpaid invoices (status !== PAID/VOID)
   * - Open bills (status !== PAID/VOID)
   * - Is the only active entity
   */
  async archiveEntity(id: string): Promise<
    | { success: true }
    | { success: false; error: string; blockers: string[] }
  > {
    const entity = await prisma.entity.findFirst({
      where: { id, tenantId: this.tenantId, status: 'ACTIVE' },
      include: {
        _count: {
          select: {
            accounts: true,
            invoices: true,
            bills: true,
          },
        },
      },
    });

    if (!entity) {
      return {
        success: false,
        error: 'Entity not found or already archived',
        blockers: [],
      };
    }

    // Check if this is the only active entity
    const activeEntityCount = await prisma.entity.count({
      where: { tenantId: this.tenantId, status: 'ACTIVE' },
    });

    const blockers: string[] = [];

    if (activeEntityCount <= 1) {
      blockers.push(
        'Cannot archive the only active entity. Create another entity first.'
      );
    }

    // Check for active bank accounts
    const activeAccounts = await prisma.account.count({
      where: { entityId: id, deletedAt: null },
    });
    if (activeAccounts > 0) {
      blockers.push(
        `Settle or transfer ${activeAccounts} active account${activeAccounts > 1 ? 's' : ''} before archiving`
      );
    }

    // Check for unpaid invoices
    const unpaidInvoices = await prisma.invoice.count({
      where: {
        entityId: id,
        deletedAt: null,
        status: { notIn: ['PAID', 'VOID'] },
      },
    });
    if (unpaidInvoices > 0) {
      blockers.push(
        `Close or void ${unpaidInvoices} outstanding invoice${unpaidInvoices > 1 ? 's' : ''} before archiving`
      );
    }

    // Check for open bills
    const openBills = await prisma.bill.count({
      where: {
        entityId: id,
        deletedAt: null,
        status: { notIn: ['PAID', 'VOID'] },
      },
    });
    if (openBills > 0) {
      blockers.push(
        `Pay or void ${openBills} open bill${openBills > 1 ? 's' : ''} before archiving`
      );
    }

    if (blockers.length > 0) {
      return {
        success: false,
        error: 'Cannot archive entity with active data',
        blockers,
      };
    }

    // All checks passed — archive in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.entity.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });
    });

    await createAuditLog({
      tenantId: this.tenantId,
      userId: this.userId,
      entityId: id,
      model: 'Entity',
      recordId: id,
      action: 'UPDATE',
      before: { status: 'ACTIVE' },
      after: { status: 'ARCHIVED' },
    });

    return { success: true };
  }
}
