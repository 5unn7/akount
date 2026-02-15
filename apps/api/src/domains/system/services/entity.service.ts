import { prisma } from '@akount/db';

/**
 * Entity Service
 *
 * Handles entity-level operations with tenant isolation.
 */
export class EntityService {
  constructor(private tenantId: string) {}

  /**
   * List all entities for the tenant
   */
  async listEntities() {
    return prisma.entity.findMany({
      where: { tenantId: this.tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        functionalCurrency: true,
        reportingCurrency: true,
        country: true,
        fiscalYearStart: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a specific entity by ID
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
   * Create a new entity
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
    }
  ) {
    return prisma.entity.create({
      data: {
        tenantId: this.tenantId,
        name: data.name,
        type: data.type as 'PERSONAL' | 'CORPORATION' | 'SOLE_PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLC',
        country: data.country,
        functionalCurrency: data.functionalCurrency,
        reportingCurrency: data.reportingCurrency || data.functionalCurrency,
        fiscalYearStart: data.fiscalYearStart || 1,
      },
    });
  }

  /**
   * Update an entity
   */
  async updateEntity(
    id: string,
    data: {
      name?: string;
      fiscalYearStart?: number;
    }
  ) {
    // First verify the entity belongs to this tenant
    const existing = await prisma.entity.findFirst({
      where: {
        id,
        tenantId: this.tenantId,
      },
    });

    if (!existing) {
      return null;
    }

    return prisma.entity.update({
      where: { id },
      data,
    });
  }
}
