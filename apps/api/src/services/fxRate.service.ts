import { prisma } from '@akount/db';

export class FxRateService {
    /**
     * Get exchange rate between two currencies
     * @param base - Base currency code (e.g., "USD")
     * @param quote - Quote currency code (e.g., "CAD")
     * @param date - Optional specific date
     * @returns Exchange rate (1 base = rate * quote)
     */
    async getRate(base: string, quote: string, date: Date = new Date()): Promise<number> {
        if (base === quote) return 1.0;

        // Normalize date to start of day
        const effectiveDate = new Date(date);
        effectiveDate.setHours(0, 0, 0, 0);

        // 1. Check database for existing rate
        const dbRate = await prisma.fXRate.findFirst({
            where: {
                base,
                quote,
                date: {
                    lte: effectiveDate,
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        if (dbRate) {
            return dbRate.rate;
        }

        // 2. Fallback: Check inverse rate
        const inverseRate = await prisma.fXRate.findFirst({
            where: {
                base: quote,
                quote: base,
                date: {
                    lte: effectiveDate,
                },
            },
            orderBy: {
                date: 'desc',
            },
        });

        if (inverseRate) {
            return 1 / inverseRate.rate;
        }

        // 3. Fallback: Manual static rates for common pairs (development only)
        const manualRates: Record<string, number> = {
            'USD_CAD': 1.35,
            'CAD_USD': 0.74,
            'EUR_CAD': 1.47,
            'CAD_EUR': 0.68,
            'USD_EUR': 0.92,
            'EUR_USD': 1.08,
        };

        const pair = `${base}_${quote}`;
        if (manualRates[pair]) {
            console.warn(`Using fallback rate for ${base}/${quote}: ${manualRates[pair]}`);
            return manualRates[pair];
        }

        // If no rate found, throw error instead of returning 1.0
        throw new Error(`FX Rate not found for ${base}/${quote} on ${effectiveDate.toISOString()}`);
    }

    /**
     * Batch fetch exchange rates for multiple currency pairs
     * Eliminates N+1 query problem when converting multiple amounts
     * @param pairs - Array of {from, to} currency pairs
     * @returns Map of "FROM_TO" -> rate
     */
    async getRateBatch(pairs: Array<{ from: string; to: string }>): Promise<Map<string, number>> {
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const rateMap = new Map<string, number>();

        // Handle same-currency pairs
        for (const pair of pairs) {
            if (pair.from === pair.to) {
                rateMap.set(`${pair.from}_${pair.to}`, 1.0);
            }
        }

        // Get unique pairs that need database lookup
        const uniquePairs = pairs.filter(p => p.from !== p.to);
        if (uniquePairs.length === 0) {
            return rateMap;
        }

        // Build query for all pairs and their inverses
        const whereConditions = uniquePairs.flatMap(p => [
            { base: p.from, quote: p.to },
            { base: p.to, quote: p.from }, // Also fetch inverse
        ]);

        // Single database query for all rates
        const dbRates = await prisma.fXRate.findMany({
            where: {
                OR: whereConditions,
                date: { lte: date }
            },
            orderBy: { date: 'desc' },
        });

        // Group rates by pair and take most recent
        const ratesByPair = new Map<string, number>();
        for (const rate of dbRates) {
            const key = `${rate.base}_${rate.quote}`;
            if (!ratesByPair.has(key)) {
                ratesByPair.set(key, rate.rate);
            }
        }

        // Build rate map for requested pairs
        for (const pair of uniquePairs) {
            const directKey = `${pair.from}_${pair.to}`;
            const inverseKey = `${pair.to}_${pair.from}`;

            // Try direct rate
            if (ratesByPair.has(directKey)) {
                rateMap.set(directKey, ratesByPair.get(directKey)!);
            }
            // Try inverse rate
            else if (ratesByPair.has(inverseKey)) {
                rateMap.set(directKey, 1 / ratesByPair.get(inverseKey)!);
            }
            // Fallback to manual rates
            else {
                const manualRates: Record<string, number> = {
                    'USD_CAD': 1.35,
                    'CAD_USD': 0.74,
                    'EUR_CAD': 1.47,
                    'CAD_EUR': 0.68,
                    'USD_EUR': 0.92,
                    'EUR_USD': 1.08,
                };

                if (manualRates[directKey]) {
                    console.warn(`Using fallback rate for ${directKey}: ${manualRates[directKey]}`);
                    rateMap.set(directKey, manualRates[directKey]);
                } else {
                    // Use 1.0 as last resort for batch operations (don't throw)
                    console.warn(`FX Rate not found for ${directKey}, using 1.0`);
                    rateMap.set(directKey, 1.0);
                }
            }
        }

        return rateMap;
    }

    /**
     * Convert amount between currencies (integer cents)
     * @param amountCents - Amount in smallest currency unit (cents)
     * @param from - Source currency code
     * @param to - Target currency code
     * @param date - Optional specific date
     * @returns Converted amount in cents
     */
    async convert(amountCents: number, from: string, to: string, date?: Date): Promise<number> {
        if (from === to) return amountCents;
        const rate = await this.getRate(from, to, date);
        return Math.round(amountCents * rate);
    }
}
