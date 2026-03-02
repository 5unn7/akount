import { z } from 'zod';

/**
 * Environment Variable Schema
 *
 * Validates all required environment variables at startup.
 * Throws an error with detailed information if validation fails.
 */
const envSchema = z.object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Server Configuration
    PORT: z.coerce.number().positive().int().default(4000),
    HOST: z.string().default('0.0.0.0'),

    // Database
    DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

    // Authentication (Clerk)
    CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),

    // Cookie secret for signing cookies (CSRF protection)
    // Falls back to CLERK_SECRET_KEY if not set
    COOKIE_SECRET: z.string().optional(),

    // CORS Configuration
    CORS_ORIGINS: z.string().optional().default('http://localhost:3000'),

    // Logging
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional().default('info'),

    // Report cache TTL in milliseconds (default: 5 minutes)
    REPORT_CACHE_TTL_MS: z.coerce.number().positive().int().optional().default(300000),

    // Email (Resend) — optional, email disabled when unset
    RESEND_API_KEY: z.string().optional(),

    // AI (Anthropic Claude) — optional, primary AI provider
    ANTHROPIC_API_KEY: z.string().optional(),

    // AI (Perplexity) — optional, fallback AI provider
    PERPLEXITY_API_KEY: z.string().optional(),

    // AI (Mistral) — optional, document intelligence & vision
    MISTRAL_API_KEY: z.string().optional(),

    // Insight generation timer (optional — 0 = disabled)
    INSIGHT_GENERATION_INTERVAL_MS: z.coerce.number().int().min(0).optional().default(0),

    // File Scanning (optional — ClamAV daemon for virus scanning)
    CLAMAV_HOST: z.string().optional(),
    CLAMAV_PORT: z.coerce.number().positive().int().optional().default(3310),

    // Redis & Job Queues (BullMQ) — optional in dev (memory fallback), required in production
    REDIS_HOST: z.string().optional().default('localhost'),
    REDIS_PORT: z.coerce.number().positive().int().optional().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_TLS_ENABLED: z.coerce.boolean().optional().default(false),
    REDIS_DB: z.coerce.number().int().min(0).max(15).optional().default(0),

    // Flinks Bank Connection — required in production, optional in dev (demo mode)
    FLINKS_INSTANCE: z.string().optional(),       // e.g. "toolbox"
    FLINKS_CUSTOMER_ID: z.string().optional(),     // Customer ID from Flinks dashboard
    FLINKS_SECRET: z.string().optional(),          // API secret (NEVER expose client-side)
    FLINKS_CONNECT_URL: z.string().url().optional(), // e.g. "https://toolbox-iframe.private.fin.ag"
    FLINKS_API_URL: z.string().url().optional(),     // e.g. "https://toolbox-api.private.fin.ag"
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed configuration object.
 *
 * @throws {Error} If validation fails, with detailed error messages
 * @returns {Env} Typed and validated environment configuration
 */
function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(result.error.format(), null, 2));

        // List missing required variables
        const missingVars = result.error.issues
            .filter(issue => issue.message.includes('required'))
            .map(issue => issue.path.join('.'));

        if (missingVars.length > 0) {
            console.error('\n📋 Missing required variables:');
            missingVars.forEach(varName => {
                console.error(`  - ${varName}`);
            });
            console.error('\n💡 Copy .env.example to .env and fill in the values');
        }

        throw new Error('Environment validation failed');
    }

    return result.data;
}

/**
 * Validated and typed environment configuration.
 *
 * Import this instead of accessing process.env directly for type safety.
 *
 * @example
 * ```typescript
 * import { env } from './lib/env';
 *
 * const port = env.PORT; // number (type-safe)
 * const dbUrl = env.DATABASE_URL; // string (validated)
 * ```
 */
export const env = validateEnv();

// Production safety checks — catch misconfigured deployments early
if (env.NODE_ENV === 'production') {
    const warnings: string[] = [];

    // Clerk keys must be production (live) keys
    if (env.CLERK_SECRET_KEY.startsWith('sk_test_')) {
        warnings.push('CLERK_SECRET_KEY is a test key — use sk_live_* in production');
    }
    if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_test_')) {
        warnings.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is a test key — use pk_live_* in production');
    }

    // CORS should not be wildcard in production
    if (env.CORS_ORIGINS === '*' || env.CORS_ORIGINS === 'http://localhost:3000') {
        warnings.push('CORS_ORIGINS is set to development default — whitelist production domain(s)');
    }

    // DATABASE_URL should not point to localhost in production
    if (env.DATABASE_URL.includes('localhost') || env.DATABASE_URL.includes('127.0.0.1')) {
        warnings.push('DATABASE_URL points to localhost — use a production database URL');
    }

    // Flinks credentials required in production
    if (!env.FLINKS_INSTANCE || !env.FLINKS_CUSTOMER_ID || !env.FLINKS_SECRET || !env.FLINKS_CONNECT_URL || !env.FLINKS_API_URL) {
        warnings.push('FLINKS_* env vars missing — bank connection feature disabled. Set all 5 Flinks vars for production.');
    }

    if (warnings.length > 0) {
        console.error('⚠️  Production environment warnings:');
        warnings.forEach(w => console.error(`  - ${w}`));
    }
}

// Log successful validation in development
if (env.NODE_ENV === 'development') {
    console.log('✓ Environment variables validated successfully');
}
