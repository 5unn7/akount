import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/test/**',
        'vitest.config.ts',
      ],
    },
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000,
  },
});
