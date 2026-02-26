import { prisma } from '@akount/db';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export interface ListForecastsParams {
  entityId: string;
  cursor?: string;
  limit?: number;
  type?: string;
  scenario?: string;
}

export interface PaginatedForecasts {
  forecasts: Awaited<ReturnType<typeof prisma.forecast.findMany>>;
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Forecast Service
 *
 * Manages financial forecasts (cash flow, revenue, expense projections).
 * Forecasts store monthly data points as JSON and support multiple scenarios
 * (baseline, optimistic, pessimistic). All amounts are integer cents. Tenant-isolated.
 */
export class ForecastService {
  constructor(private readonly tenantId: string) {}

  async listForecasts(params: ListForecastsParams): Promise<PaginatedForecasts> {
    const { entityId, cursor, type, scenario } = params;
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

    const where = {
      entityId,
      entity: { tenantId: this.tenantId },
      deletedAt: null,
      ...(type && { type }),
      ...(scenario && { scenario }),
    };

    const forecasts = await prisma.forecast.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = forecasts.length > limit;
    const data = hasMore ? forecasts.slice(0, limit) : forecasts;

    return {
      forecasts: data,
      nextCursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };
  }

  async getForecast(id: string) {
    return prisma.forecast.findFirst({
      where: {
        id,
        deletedAt: null,
        entity: { tenantId: this.tenantId },
      },
    });
  }

  async createForecast(data: {
    name: string;
    entityId: string;
    type: string;
    scenario: string;
    periodStart: Date;
    periodEnd: Date;
    data: Array<{ month: string; amount: number }>;
    assumptions?: Record<string, unknown>;
  }) {
    // Verify entity belongs to tenant
    const entity = await prisma.entity.findFirst({
      where: { id: data.entityId, tenantId: this.tenantId },
    });
    if (!entity) {
      throw new Error('Entity not found or access denied');
    }

    return prisma.forecast.create({
      data: {
        entityId: data.entityId,
        name: data.name,
        type: data.type,
        scenario: data.scenario,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        data: data.data as unknown as Parameters<typeof prisma.forecast.create>[0]['data']['data'],
        ...(data.assumptions && {
          assumptions: data.assumptions as unknown as Parameters<typeof prisma.forecast.create>[0]['data']['assumptions'],
        }),
      },
    });
  }

  async updateForecast(id: string, data: {
    name?: string;
    type?: string;
    scenario?: string;
    periodStart?: Date;
    periodEnd?: Date;
    data?: Array<{ month: string; amount: number }>;
    assumptions?: Record<string, unknown> | null;
  }) {
    // Verify forecast exists and belongs to tenant
    const existing = await prisma.forecast.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Forecast not found or access denied');
    }

    // Validate date range (considering partial updates)
    const effectiveStart = data.periodStart ?? existing.periodStart;
    const effectiveEnd = data.periodEnd ?? existing.periodEnd;
    if (effectiveEnd <= effectiveStart) {
      throw new Error('End date must be after start date');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.scenario !== undefined) updateData.scenario = data.scenario;
    if (data.periodStart !== undefined) updateData.periodStart = data.periodStart;
    if (data.periodEnd !== undefined) updateData.periodEnd = data.periodEnd;
    if (data.data !== undefined) updateData.data = data.data;
    if (data.assumptions !== undefined) updateData.assumptions = data.assumptions;

    return prisma.forecast.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteForecast(id: string) {
    // Verify forecast exists and belongs to tenant
    const existing = await prisma.forecast.findFirst({
      where: { id, deletedAt: null, entity: { tenantId: this.tenantId } },
    });
    if (!existing) {
      throw new Error('Forecast not found or access denied');
    }

    // Soft delete
    return prisma.forecast.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
