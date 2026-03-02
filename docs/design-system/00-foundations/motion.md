# Motion & Animation

> **Last Updated:** 2026-02-04

## Overview

Motion in Akount serves functional purposes: guiding attention, providing feedback, and maintaining sense of continuity. We avoid flashy animations in favor of purposeful, performance-conscious motion.

---

## Animation Durations

| Duration       | Token              | Use Case                           |
| -------------- | ------------------ | ---------------------------------- |
| **Fast**       | `--ak-dur-fast`    | 120ms  | Micro-interactions (hover, focus)  |
| **Normal**     | `--ak-dur-normal`  | 180ms  | Standard transitions               |
| **Slow**       | `--ak-dur-slow`    | 240ms  | Emphasis, multi-step animations   |

### Duration Guidance

- **Fast (120ms):** Buttons, toggles, icon changes
- **Normal (180ms):** Modal opens, slide-outs, panel transitions
- **Slow (240ms):** Page transitions, data loading indicators

**Rule:** Animations should finish before user expects next interaction, or feel deliberate and intentional.

---

## Easing Functions

### Standard Easing

| Token                    | Function                           | Use Case                |
| ------------------------ | ---------------------------------- | ----------------------- |
| `--ak-ease-standard`     | `cubic-bezier(0.2, 0, 0, 1)`       | Default transitions     |
| `--ak-ease-emphasized`   | `cubic-bezier(0.2, 0, 0, 1.2)`     | Emphasis, attention     |

### Standard Easing (0.2, 0, 0, 1)

Smooth deceleration. Feels natural and predictable.

```
Acceleration ----> Deceleration (relaxed landing)
```

**Use for:** Most transitions, default assumption

### Emphasized Easing (0.2, 0, 0, 1.2)

Slight overshoot that draws attention.

```
Acceleration ----> Deceleration (slight bounce)
```

**Use for:** Important changes, modal opens, important alerts

---

## Common Animation Patterns

### Button Hover

```css
.button {
  background-color: var(--ak-action-primary);
  transition: background-color 120ms var(--ak-ease-standard);
}

.button:hover {
  background-color: darken(var(--ak-action-primary), 10%);
}
```

### Modal Open

```css
.modal {
  animation: slideIn 180ms var(--ak-ease-emphasized) forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Loading Indicator

```css
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Fade Transition

```css
.fade-enter {
  opacity: 0;
  transition: opacity 180ms var(--ak-ease-standard);
}

.fade-enter-active {
  opacity: 1;
}
```

---

## Interaction Feedback

### Click Feedback

Immediate visual feedback on button click:

```css
.button:active {
  opacity: 0.8;
  transform: scale(0.98);
  transition: all 80ms var(--ak-ease-standard);
}
```

### Focus Ring

Visible focus indicator with smooth animation:

```css
input:focus {
  outline: 2px solid var(--ak-focus-ring);
  outline-offset: 2px;
  transition: outline 120ms var(--ak-ease-standard);
}
```

### State Changes

When data updates or status changes:

```css
.highlight-change {
  animation: highlight 300ms ease-out;
}

@keyframes highlight {
  0% { background-color: var(--ak-action-primary); }
  100% { background-color: transparent; }
}
```

---

## Performance Considerations

### Use `transform` and `opacity` Only

These properties don't trigger layout recalculation:

```css
/* Good: GPU accelerated */
transform: translateX(10px);
opacity: 0.5;

/* Avoid: Triggers layout */
left: 10px;
width: 100px;
height: 100px;
```

### Avoid Animating Large Elements

Limit animations to:

- Small UI components
- Icons
- Text changes
- Modal overlays

**Avoid animating:**

- Page backgrounds
- Full-screen transitions
- Large data table rows

### Respect User Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Implementation

### In CSS

```css
:root {
  --ak-dur-fast: 120ms;
  --ak-dur-normal: 180ms;
  --ak-dur-slow: 240ms;
  --ak-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ak-ease-emphasized: cubic-bezier(0.2, 0, 0, 1.2);
}

.button {
  transition: all var(--ak-dur-fast) var(--ak-ease-standard);
}

.modal-open {
  animation: slideIn var(--ak-dur-normal) var(--ak-ease-emphasized) forwards;
}
```

### In Tailwind

```js
theme: {
  transitionDuration: {
    'fast': '120ms',
    'normal': '180ms',
    'slow': '240ms',
  },
  transitionTimingFunction: {
    'standard': 'cubic-bezier(0.2, 0, 0, 1)',
    'emphasized': 'cubic-bezier(0.2, 0, 0, 1.2)',
  }
}
```

Usage:

```jsx
<button className="transition duration-fast ease-standard hover:bg-primary-600">
  Click me
</button>
```

---

## Glassmorphism & Skeuomorphism Animations

### Glass Card Entrance

Frosted glass cards should feel like they're floating into view:

```css
@keyframes glassFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(10px);
    transform: translateY(0);
  }
}

.glass-card {
  animation: glassFadeIn 180ms var(--ak-ease-emphasized) forwards;
}
```

### Button Press (Skeuomorphic)

Physical button depression feedback:

```css
.button {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);     /* Raised state */
  transition: all 80ms var(--ak-ease-standard);
}

.button:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);   /* Pressed state */
  transform: translateY(2px);                    /* Slight depression */
}
```

### Modal Overlay (Glassmorphism)

Smooth blur transition for modal overlays:

```css
@keyframes overlayIn {
  from {
    backdrop-filter: blur(0px);
    opacity: 0;
  }
  to {
    backdrop-filter: blur(4px);
    opacity: 1;
  }
}

.modal-overlay {
  animation: overlayIn 240ms var(--ak-ease-standard) forwards;
}
```

### Panel Slide-Out (Glass + Depth)

Panels should float out with glass effect:

```css
@keyframes panelSlideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  to {
    opacity: 1;
    transform: translateX(0);
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15); /* Floating effect */
  }
}

.panel {
  animation: panelSlideIn 180ms var(--ak-ease-emphasized) forwards;
}
```

---

## What NOT to Animate

- Page background colors (distracting)
- Decorative animations (not financial)
- Parallax effects (unprofessional)
- Auto-play videos or sounds
- Infinite loops (except loading indicators)
- Excessive blur or glass effects (performance impact)

---

## Accessibility

- **Reduced motion:** Respect `prefers-reduced-motion` media query
- **No flashing:** Avoid >3 Hz flashes (seizure risk)
- **Clear purpose:** Every animation should serve user interaction
- **Quick to complete:** Don't leave users waiting for animations to finish

---

## See Also

- [`spacing-layout.md`](./spacing-layout.md) - Motion paired with layout
- [`colors.md`](./colors.md) - Color transitions and changes
- [`philosophy.md`](./philosophy.md) - Why we use calm motion
