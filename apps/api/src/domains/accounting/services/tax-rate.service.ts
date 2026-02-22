import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { createAuditLog } from '../../../lib/audit';
import type {
    CreateTaxRateInput,
    UpdateTaxRateInput,
    ListTaxRatesQuery,
    DeactivateTaxRateInput,
} from '../schemas/tax-rate.schema';

const TAX_RATE_SELECT = {
    id: true,
    entityId: true,
    code: true,
    name: true,
    rate: true,
    jurisdiction: true,
    isInclusive: true,
    glAccountId: true,
    isActive: true,
    effectiveFrom: true,
    effectiveTo: true,
} as const;

export class TaxRateService {
    constructor(
        private tenantId: string,
        private userId: string
    ) {}

    /**
     * List tax rates with optional filters.
     * Returns both entity-specific and global rates (entityId: null).
     */
    async listTaxRates(params: ListTaxRatesQuery) {
        // Build where clause
        const where: Prisma.TaxRateWhereInput = {
            OR: [
                // Entity-specific rates
                ...(params.entityId
                    ? [{ entityId: params.entityId, entity: { tenantId: this.tenantId } }]
                    : []),
                // Global rates (no entityId)
                { entityId: null },
            ],
        };

        // Apply filters
        if (params.jurisdiction) {
            where.jurisdiction = { contains: params.jurisdiction, mode: 'insensitive' };
        }
        if (params.isActive !== undefined) {
            where.isActive = params.isActive;
        }
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const taxRates = await prisma.taxRate.findMany({
            where,
            select: TAX_RATE_SELECT,
            orderBy: [{ isActive: 'desc' }, { jurisdiction: 'asc' }, { code: 'asc' }],
        });

        return taxRates;
    }

    /**
     * Get a single tax rate by ID.
     */
    async getTaxRate(id: string) {
        const taxRate = await prisma.taxRate.findFirst({
            where: {
                id,
                OR: [
                    { entity: { tenantId: this.tenantId } },
                    { entityId: null }, // Global rates accessible to all
                ],
            },
            select: TAX_RATE_SELECT,
        });

        if (!taxRate) {
            throw new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404);
        }

        return taxRate;
    }

    /**
     * Create a new tax rate.
     *
     * Validations:
     * - If entityId provided, entity must belong to tenant
     * - Code must be unique per entity (or globally if no entityId)
     * - effectiveFrom must be before effectiveTo if provided
     */
    async createTaxRate(data: CreateTaxRateInput) {
        // Validate entity ownership if entityId provided
        if (data.entityId) {
            await this.validateEntityOwnership(data.entityId);
        }

        // Validate date range
        if (data.effectiveTo) {
            const from = new Date(data.effectiveFrom);
            const to = new Date(data.effectiveTo);
            if (to <= from) {
                throw new AccountingError(
                    'effectiveTo must be after effectiveFrom',
                    'INVALID_DATE_RANGE',
                    400
                );
            }
        }

        try {
            const taxRate = await prisma.taxRate.create({
                data: {
                    entityId: data.entityId,
                    code: data.code,
                    name: data.name,
                    rate: data.rate,
                    jurisdiction: data.jurisdiction,
                    isInclusive: data.isInclusive,
                    glAccountId: data.glAccountId,
                    isActive: true,
                    effectiveFrom: new Date(data.effectiveFrom),
                    effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
                },
                select: TAX_RATE_SELECT,
            });

            await createAuditLog({
                tenantId: this.tenantId,
                userId: this.userId,
                entityId: data.entityId ?? undefined,
                model: 'TaxRate',
                recordId: taxRate.id,
                action: 'CREATE',
                after: { code: data.code, name: data.name, rate: data.rate },
            });

            return taxRate;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new AccountingError(
                    `Tax rate code '${data.code}' already exists`,
                    'DUPLICATE_TAX_CODE',
                    409
                );
            }
            throw error;
        }
    }

    /**
     * Update a tax rate.
     */
    async updateTaxRate(id: string, data: UpdateTaxRateInput) {
        const existing = await prisma.taxRate.findFirst({
            where: {
                id,
                OR: [
                    { entity: { tenantId: this.tenantId } },
                    { entityId: null }, // Can update global rates
                ],
            },
            select: {
                id: true,
                entityId: true,
                code: true,
                name: true,
                rate: true,
                isActive: true,
            },
        });

        if (!existing) {
            throw new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404);
        }

        // Validate date range if both dates provided
        if (data.effectiveFrom && data.effectiveTo) {
            const from = new Date(data.effectiveFrom);
            const to = new Date(data.effectiveTo);
            if (to <= from) {
                throw new AccountingError(
                    'effectiveTo must be after effectiveFrom',
                    'INVALID_DATE_RANGE',
                    400
                );
            }
        }

        const taxRate = await prisma.taxRate.update({
            where: { id },
            data: {
                name: data.name,
                rate: data.rate,
                jurisdiction: data.jurisdiction,
                isInclusive: data.isInclusive,
                glAccountId: data.glAccountId,
                isActive: data.isActive,
                effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
            },
            select: TAX_RATE_SELECT,
        });

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: existing.entityId ?? undefined,
            model: 'TaxRate',
            recordId: id,
            action: 'UPDATE',
            before: { name: existing.name, rate: existing.rate, isActive: existing.isActive },
            after: { name: data.name, rate: data.rate, isActive: data.isActive },
        });

        return taxRate;
    }

    /**
     * Deactivate a tax rate (soft delete - sets isActive: false and effectiveTo).
     */
    async deactivateTaxRate(id: string, data?: DeactivateTaxRateInput) {
        const existing = await prisma.taxRate.findFirst({
            where: {
                id,
                OR: [
                    { entity: { tenantId: this.tenantId } },
                    { entityId: null },
                ],
            },
            select: { id: true, entityId: true, code: true, name: true },
        });

        if (!existing) {
            throw new AccountingError('Tax rate not found', 'TAX_RATE_NOT_FOUND', 404);
        }

        const taxRate = await prisma.taxRate.update({
            where: { id },
            data: {
                isActive: false,
                effectiveTo: data?.effectiveTo ? new Date(data.effectiveTo) : new Date(),
            },
            select: TAX_RATE_SELECT,
        });

        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: existing.entityId ?? undefined,
            model: 'TaxRate',
            recordId: id,
            action: 'UPDATE',
            before: { isActive: true },
            after: { isActive: false },
        });

        return taxRate;
    }

    /**
     * Validate that an entity belongs to the current tenant.
     */
    private async validateEntityOwnership(entityId: string) {
        const entity = await prisma.entity.findFirst({
            where: { id: entityId, tenantId: this.tenantId },
            select: { id: true },
        });

        if (!entity) {
            throw new AccountingError('Entity not found', 'ENTITY_NOT_FOUND', 403);
        }

        return entity;
    }
}
