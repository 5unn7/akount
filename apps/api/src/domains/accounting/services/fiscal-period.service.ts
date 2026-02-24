import { prisma, Prisma } from '@akount/db';
import { AccountingError } from '../errors';
import { validateEntityOwnership, validateGLAccountOwnership } from '../utils/validate-ownership';
import { createAuditLog } from '../../../lib/audit';
import type {
    CreateCalendarInput,
    ListCalendarsQuery,
} from '../schemas/fiscal-period.schema';

const CALENDAR_SELECT = {
    id: true,
    entityId: true,
    year: true,
    startDate: true,
    endDate: true,
    periods: {
        select: {
            id: true,
            periodNumber: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
        },
        orderBy: { periodNumber: 'asc' as const },
    },
} as const;

const PERIOD_SELECT = {
    id: true,
    fiscalCalendarId: true,
    periodNumber: true,
    name: true,
    startDate: true,
    endDate: true,
    status: true,
} as const;

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export class FiscalPeriodService {
    constructor(
        private tenantId: string,
        private userId: string
    ) {}

    /**
     * List all fiscal calendars for an entity.
     */
    async listCalendars(params: ListCalendarsQuery) {
        const calendars = await prisma.fiscalCalendar.findMany({
            where: {
                entityId: params.entityId,
                entity: { tenantId: this.tenantId },
            },
            select: CALENDAR_SELECT,
            orderBy: { year: 'desc' },
        });

        return calendars;
    }

    /**
     * Get a single fiscal calendar with its periods.
     */
    async getCalendar(id: string) {
        const calendar = await prisma.fiscalCalendar.findFirst({
            where: {
                id,
                entity: { tenantId: this.tenantId },
            },
            select: CALENDAR_SELECT,
        });

        if (!calendar) {
            throw new AccountingError('Fiscal calendar not found', 'CALENDAR_NOT_FOUND', 404);
        }

        return calendar;
    }

    /**
     * Create a fiscal calendar with 12 monthly periods.
     *
     * Generates periods from the given startMonth of the given year
     * through 12 months. E.g., startMonth=4 for April fiscal year
     * creates April YYYY through March YYYY+1.
     */
    async createCalendar(data: CreateCalendarInput) {
        await validateEntityOwnership(data.entityId, this.tenantId);

        // Calculate fiscal year dates
        const startMonth = data.startMonth ?? 1;
        const startDate = new Date(Date.UTC(data.year, startMonth - 1, 1));
        const endYear = startMonth === 1 ? data.year : data.year + 1;
        const endMonth = startMonth === 1 ? 12 : startMonth - 1;
        // End date: last day of the last month
        const endDate = new Date(Date.UTC(endYear, endMonth, 0));

        try {
            const calendar = await prisma.$transaction(async (tx) => {
                const cal = await tx.fiscalCalendar.create({
                    data: {
                        entityId: data.entityId,
                        year: data.year,
                        startDate,
                        endDate,
                    },
                });

                // Generate 12 monthly periods
                const periods = [];
                for (let i = 0; i < 12; i++) {
                    const monthIndex = (startMonth - 1 + i) % 12;
                    const yearOffset = Math.floor((startMonth - 1 + i) / 12);
                    const periodYear = data.year + yearOffset;

                    const periodStart = new Date(Date.UTC(periodYear, monthIndex, 1));
                    const periodEnd = new Date(Date.UTC(periodYear, monthIndex + 1, 0));

                    periods.push({
                        fiscalCalendarId: cal.id,
                        periodNumber: i + 1,
                        name: `${MONTH_NAMES[monthIndex]} ${periodYear}`,
                        startDate: periodStart,
                        endDate: periodEnd,
                        status: 'OPEN' as const,
                    });
                }

                await tx.fiscalPeriod.createMany({ data: periods });

                return tx.fiscalCalendar.findUnique({
                    where: { id: cal.id },
                    select: CALENDAR_SELECT,
                });
            });

            if (!calendar) {
                throw new AccountingError('Failed to create calendar', 'CALENDAR_NOT_FOUND', 500);
            }

            await createAuditLog({
                tenantId: this.tenantId,
                userId: this.userId,
                entityId: data.entityId,
                model: 'FiscalCalendar',
                recordId: calendar.id,
                action: 'CREATE',
                after: { year: data.year, startMonth, periods: 12 },
            });

            return calendar;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new AccountingError(
                    `Fiscal calendar for year ${data.year} already exists`,
                    'DUPLICATE_CALENDAR_YEAR',
                    409
                );
            }
            throw error;
        }
    }

    /**
     * Lock a fiscal period.
     * Prevents new journal entries but allows review/reporting.
     * Status: OPEN → LOCKED
     */
    async lockPeriod(periodId: string) {
        const period = await this.getPeriodWithTenantCheck(periodId);

        if (period.status === 'LOCKED') {
            throw new AccountingError('Period is already locked', 'PERIOD_ALREADY_LOCKED', 400);
        }
        if (period.status === 'CLOSED') {
            throw new AccountingError('Cannot lock a closed period', 'CANNOT_LOCK_CLOSED_PERIOD', 400);
        }

        const updated = await prisma.fiscalPeriod.update({
            where: { id: periodId },
            data: { status: 'LOCKED' },
            select: PERIOD_SELECT,
        });

        await this.auditPeriodAction(period, 'LOCK', 'LOCKED');

        return updated;
    }

    /**
     * Close a fiscal period.
     * Finalizes the period — no further modifications.
     * Status: LOCKED → CLOSED
     */
    async closePeriod(periodId: string) {
        const period = await this.getPeriodWithTenantCheck(periodId);

        if (period.status === 'CLOSED') {
            throw new AccountingError('Period is already closed', 'PERIOD_ALREADY_CLOSED', 400);
        }
        if (period.status === 'OPEN') {
            throw new AccountingError('Period must be locked before closing', 'PERIOD_NOT_LOCKED', 400);
        }

        // Ensure all prior periods are closed
        const priorOpenPeriods = await prisma.fiscalPeriod.count({
            where: {
                fiscalCalendarId: period.fiscalCalendarId,
                periodNumber: { lt: period.periodNumber },
                status: { not: 'CLOSED' },
            },
        });

        if (priorOpenPeriods > 0) {
            throw new AccountingError(
                'All prior periods must be closed first',
                'PREVIOUS_PERIODS_NOT_CLOSED',
                400
            );
        }

        const updated = await prisma.fiscalPeriod.update({
            where: { id: periodId },
            data: { status: 'CLOSED' },
            select: PERIOD_SELECT,
        });

        await this.auditPeriodAction(period, 'CLOSE', 'CLOSED');

        return updated;
    }

    /**
     * Reopen a fiscal period.
     * Allows corrections to a previously locked/closed period.
     * Status: LOCKED → OPEN or CLOSED → OPEN
     */
    async reopenPeriod(periodId: string) {
        const period = await this.getPeriodWithTenantCheck(periodId);

        if (period.status === 'OPEN') {
            throw new AccountingError('Period is already open', 'PERIOD_NOT_CLOSED', 400);
        }

        const updated = await prisma.fiscalPeriod.update({
            where: { id: periodId },
            data: { status: 'OPEN' },
            select: PERIOD_SELECT,
        });

        await this.auditPeriodAction(period, 'REOPEN', 'OPEN');

        return updated;
    }

    /**
     * Check if a date falls within an OPEN fiscal period.
     * Used by JournalEntry service for period enforcement.
     */
    async validatePeriodOpen(entityId: string, date: Date): Promise<void> {
        const period = await prisma.fiscalPeriod.findFirst({
            where: {
                fiscalCalendar: {
                    entityId,
                    entity: { tenantId: this.tenantId },
                },
                startDate: { lte: date },
                endDate: { gte: date },
            },
            select: { id: true, status: true, name: true },
        });

        // If no fiscal period covers this date, allow it (no fiscal calendar set up yet)
        if (!period) return;

        if (period.status !== 'OPEN') {
            throw new AccountingError(
                `Cannot post to ${period.name} — period is ${period.status.toLowerCase()}`,
                'FISCAL_PERIOD_CLOSED',
                400,
                { periodId: period.id, status: period.status }
            );
        }
    }

    // ========================================================================
    // Private Helpers
    // ========================================================================

    private async getPeriodWithTenantCheck(periodId: string) {
        const period = await prisma.fiscalPeriod.findFirst({
            where: {
                id: periodId,
                fiscalCalendar: {
                    entity: { tenantId: this.tenantId },
                },
            },
            select: {
                ...PERIOD_SELECT,
                fiscalCalendar: {
                    select: { entityId: true },
                },
            },
        });

        if (!period) {
            throw new AccountingError('Fiscal period not found', 'PERIOD_NOT_FOUND', 404);
        }

        return period;
    }


    // Type definitions for period actions and statuses
    type PeriodAction = 'LOCK' | 'CLOSE' | 'REOPEN';
    type PeriodStatus = 'OPEN' | 'LOCKED' | 'CLOSED';

    private async auditPeriodAction(
        period: { id: string; status: PeriodStatus; fiscalCalendar: { entityId: string } },
        action: PeriodAction,
        newStatus: PeriodStatus
    ) {
        await createAuditLog({
            tenantId: this.tenantId,
            userId: this.userId,
            entityId: period.fiscalCalendar.entityId,
            model: 'FiscalPeriod',
            recordId: period.id,
            action: 'UPDATE',
            before: { status: period.status },
            after: { status: newStatus, action },
        });
    }
}
