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

    // CORS Configuration
    CORS_ORIGINS: z.string().optional().default('http://localhost:3000'),
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

// Log successful validation in development
if (env.NODE_ENV === 'development') {
    console.log('✓ Environment variables validated successfully');
}
