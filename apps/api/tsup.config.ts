import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    // Bundle monorepo packages that ship raw TypeScript
    // (their package.json "main" points to .ts files)
    noExternal: ['@akount/db', '@akount/types'],
    // Skip type checking (handled by tsc separately)
    dts: false,
    // Clean output directory before build
    clean: true,
});
