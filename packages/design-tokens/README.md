# @akount/design-tokens

Design tokens extracted from the Akount Design System.

## Usage

### CSS Variables

```css
@import '@akount/design-tokens/css';
```

### Tailwind Preset

```typescript
// tailwind.config.ts
import { akountPreset } from '@akount/design-tokens/tailwind';

export default {
  presets: [akountPreset],
  // ...
};
```

### Direct Token Access

```typescript
import { tokens } from '@akount/design-tokens';

// Access core tokens
const primaryColor = tokens.core.color.orange['500'].value; // "#F97316"

// Access semantic tokens
const incomeColor = tokens.semantic.color.finance.income.value;
```

## Token Categories

### Core Tokens

- **Colors**: orange, violet, slate, green, red, amber, blue
- **Typography**: font families, sizes, weights, line heights
- **Spacing**: 4px grid system (1, 2, 3, 4, 6, 8, 12)
- **Border radius**: sm, md, lg, xl
- **Shadows**: none, sm, md, lg
- **Motion**: durations and easings

### Semantic Tokens

- **Background**: primary, secondary, surface, elevated
- **Text**: primary, secondary, muted, inverse
- **Border**: default, subtle, strong
- **Action**: primary (orange), secondary (violet), danger
- **State**: success, warning, error, info
- **Finance**: income, expense, transfer, liability, equity
- **AI**: primary, background, border

### Component Tokens

- Button styles (primary, secondary)
- Table styles (header, row, border)
- Badge styles (success, warning, error, ai)

## Theme Modes

Tokens support light and dark modes via CSS custom properties.
See `css-variables.css` for the full variable mapping.

## Source

Tokens are defined in `docs/design-system/00-foundations/tokens/akount.tokens.json`
