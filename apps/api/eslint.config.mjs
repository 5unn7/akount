import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.js', '__generated__/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Test file specific rules - enforce factory usage
    files: ['**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'VariableDeclarator[init.type="ObjectExpression"][init.properties.length>5]:not(:has(CallExpression[callee.name=/Factory|mock/]))',
          message:
            'Large object literals (>5 properties) suggest inline mocks. Use factories from test-utils instead (mockAccount, mockInvoice, etc.) or input factories (mockTaxRateInput, mockInvoiceInput, etc.) to prevent schema drift.',
        },
      ],
    },
  },
];
