import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    // Bundle monorepo packages that ship raw TypeScript
    // (their package.json "main" points to .ts files)
    noExternal: ['@akount/db', '@akount/types'],
    // Disable splitting so banner applies to entire output
    splitting: false,
    // Provide real require() for CJS packages bundled into ESM (pino, etc.)
    banner: {
        js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    // Skip type checking (handled by tsc separately)
    dts: false,
    // Clean output directory before build
    clean: true,
});
