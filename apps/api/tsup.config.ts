import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    // Bundle monorepo packages that ship raw TypeScript
    // (their package.json "main" points to .ts files)
    noExternal: ['@akount/db', '@akount/types'],
    // Prisma uses native binary engine — must resolve from node_modules at runtime
    external: ['@prisma/client', '.prisma/client'],
    // Disable splitting so banner applies to entire output
    splitting: false,
    // Provide CJS compatibility shims for packages bundled into ESM (pino, prisma, etc.)
    banner: {
        js: [
            `import { createRequire } from 'module';`,
            `import { fileURLToPath } from 'url';`,
            `import { dirname } from 'path';`,
            `const require = createRequire(import.meta.url);`,
            `const __filename = fileURLToPath(import.meta.url);`,
            `const __dirname = dirname(__filename);`,
        ].join(' '),
    },
    // Skip type checking (handled by tsc separately)
    dts: false,
    // Clean output directory before build
    clean: true,
});
