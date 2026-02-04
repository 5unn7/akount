# Design Tokens

## Source of Truth

**`akount.tokens.json`** - Complete token system in Token Studio format

## Implementation

**`css-variables.css`** - CSS custom properties for use in stylesheets

## Token Categories

- Core brand colors (`--ak-orange-*`, `--ak-violet-*`)
- Financial semantic colors (`--ak-finance-*`)
- AI system tokens (`--ak-ai-*`)
- shadcn/ui compatibility layer (`--background`, `--primary`, etc.)

## Usage

### In CSS
```css
.invoice-amount {
  color: var(--ak-finance-income);
  font-family: var(--ak-font-mono);
}
```

### In Tailwind
[Map to Tailwind configuration]

## Updating Tokens

1. Edit `akount.tokens.json` (source of truth)
2. Update `css-variables.css` manually
3. Test in both light and dark modes
