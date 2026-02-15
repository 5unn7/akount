/**
 * @akount/design-tokens
 *
 * Design tokens extracted from the Akount Design System.
 * See: docs/design-system/00-foundations/tokens/
 */

import tokens from './tokens.json';

export { tokens };
export default tokens;

// Re-export types for token structure
export type TokenValue = {
  value: string;
  type: string;
};

export type CoreTokens = typeof tokens.core;
export type SemanticTokens = typeof tokens.semantic;
export type ComponentTokens = typeof tokens.component;
