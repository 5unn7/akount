/**
 * Akount ESLint Custom Rules Plugin
 *
 * Usage in eslint.config.mjs:
 *   import akountRules from './.claude/eslint-rules/index.js';
 *
 *   export default [
 *     {
 *       plugins: {
 *         'akount': akountRules,
 *       },
 *       rules: {
 *         'akount/no-hardcoded-colors': 'error',
 *       },
 *     },
 *   ];
 */

const noHardcodedColors = require('./no-hardcoded-colors.js');

module.exports = {
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
  },
};
