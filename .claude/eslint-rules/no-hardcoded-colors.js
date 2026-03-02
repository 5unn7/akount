/**
 * ESLint Rule: no-hardcoded-colors
 *
 * Prevents hardcoded color values in className attributes.
 * Enforces use of semantic design tokens from globals.css.
 *
 * ❌ BAD:
 *   className="text-[#34D399] bg-[rgba(255,255,255,0.06)]"
 *
 * ✅ GOOD:
 *   className="text-ak-green glass"
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded color values in className, enforce design tokens',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // no options
    messages: {
      hardcodedColor: 'Hardcoded color "{{value}}" detected. Use semantic token: {{suggestion}}',
    },
  },

  create(context) {
    // Token suggestion map (hex → semantic token)
    const TOKEN_MAP = {
      '#34D399': 'text-ak-green',
      '#F87171': 'text-ak-red',
      '#60A5FA': 'text-ak-blue',
      '#A78BFA': 'text-ak-purple',
      '#2DD4BF': 'text-ak-teal',
      '#F59E0B': 'text-primary',
      '#FBBF24': 'hover:bg-ak-pri-hover',
      '#71717A': 'text-muted-foreground',
      '#1A1A26': 'bg-ak-bg-3',
      '#22222E': 'bg-ak-bg-4',
    };

    const RGBA_MAP = {
      'rgba(255,255,255,0.025)': 'glass',
      'rgba(255,255,255,0.04)': 'glass-2',
      'rgba(255,255,255,0.06)': 'glass-3',
      'rgba(255,255,255,0.09)': 'border-ak-border-2',
      'rgba(255,255,255,0.13)': 'border-ak-border-3',
    };

    /**
     * Check if a string contains hardcoded color patterns
     */
    function checkForHardcodedColors(value, node) {
      // Pattern: text-[#hex] or bg-[#hex] or border-[#hex]
      const hexPattern = /(text|bg|border)-\[#([0-9A-Fa-f]{3,8})\]/g;
      let match;

      while ((match = hexPattern.exec(value)) !== null) {
        const fullMatch = match[0];
        const hex = `#${match[2].toUpperCase()}`;
        const suggestion = TOKEN_MAP[hex] || 'a semantic token from globals.css';

        context.report({
          node,
          messageId: 'hardcodedColor',
          data: {
            value: fullMatch,
            suggestion,
          },
          fix(fixer) {
            // Auto-fix: replace hardcoded color with token (if known)
            if (TOKEN_MAP[hex]) {
              const replacement = value.replace(fullMatch, TOKEN_MAP[hex]);
              return fixer.replaceText(node, `"${replacement}"`);
            }
            return null;
          },
        });
      }

      // Pattern: text-[rgba(...)] or bg-[rgba(...)]
      const rgbaPattern = /(text|bg|border)-\[rgba\(([^)]+)\)\]/g;

      while ((match = rgbaPattern.exec(value)) !== null) {
        const fullMatch = match[0];
        const rgbaValue = `rgba(${match[2]})`;
        const suggestion = RGBA_MAP[rgbaValue] || 'a glass utility or border token';

        context.report({
          node,
          messageId: 'hardcodedColor',
          data: {
            value: fullMatch,
            suggestion,
          },
          fix(fixer) {
            // Auto-fix: replace with token (if known)
            if (RGBA_MAP[rgbaValue]) {
              const replacement = value.replace(fullMatch, RGBA_MAP[rgbaValue]);
              return fixer.replaceText(node, `"${replacement}"`);
            }
            return null;
          },
        });
      }
    }

    return {
      /**
       * Check JSXAttribute for className with hardcoded colors
       */
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        const value = node.value;

        // String literal: className="text-[#34D399]"
        if (value && value.type === 'Literal' && typeof value.value === 'string') {
          checkForHardcodedColors(value.value, value);
        }

        // Template literal: className={`text-[#34D399] ${other}`}
        if (value && value.type === 'JSXExpressionContainer') {
          const expression = value.expression;

          if (expression.type === 'TemplateLiteral') {
            expression.quasis.forEach(quasi => {
              if (quasi.value.cooked) {
                checkForHardcodedColors(quasi.value.cooked, quasi);
              }
            });
          }

          // String literal in expression: className={"text-[#34D399]"}
          if (expression.type === 'Literal' && typeof expression.value === 'string') {
            checkForHardcodedColors(expression.value, expression);
          }
        }
      },
    };
  },
};
