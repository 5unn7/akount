'use server';

import {
    listFiscalCalendars,
    getFiscalCalendar,
    createFiscalCalendar,
    lockFiscalPeriod,
    closeFiscalPeriod,
    reopenFiscalPeriod,
    type CreateCalendarInput,
} from '@/lib/api/accounting';

export async function listCalendarsAction(entityId: string) {
    return listFiscalCalendars(entityId);
}

export async function getCalendarAction(id: string) {
    return getFiscalCalendar(id);
}

export async function createCalendarAction(input: CreateCalendarInput) {
    return createFiscalCalendar(input);
}

export async function lockPeriodAction(periodId: string) {
    return lockFiscalPeriod(periodId);
}

export async function closePeriodAction(periodId: string) {
    return closeFiscalPeriod(periodId);
}

export async function reopenPeriodAction(periodId: string) {
    return reopenFiscalPeriod(periodId);
}
