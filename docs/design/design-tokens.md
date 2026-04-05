# Design Tokens
## nosurcharging.com.au

Tailwind CSS configuration values and CSS custom properties. Use these consistently — do not hardcode values outside of this system.

---

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono:  ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        // Brand amber — the single accent
        amber: {
          50:  '#FAEEDA',
          200: '#EF9F27',
          400: '#BA7517',
          800: '#633806',
        },
        // Chart colours — hardcoded for consistency across light/dark
        chart: {
          interchange: '#E24B4A',
          scheme:      '#BA7517',
          margin:      '#888780',
          surcharge:   '#3B6D11',
        },
      },
      fontSize: {
        // Financial display
        'financial-hero':     ['44px', { lineHeight: '1', letterSpacing: '-1px', fontWeight: '500' }],
        'financial-standard': ['22px', { lineHeight: '1.2', fontWeight: '500' }],
        'financial-small':    ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        // Editorial
        'display':    ['32px', { lineHeight: '1.22', fontWeight: '500' }],
        'heading-lg': ['24px', { lineHeight: '1.28', fontWeight: '500' }],
        'heading-md': ['20px', { lineHeight: '1.3',  fontWeight: '500' }],
        'heading-sm': ['18px', { lineHeight: '1.35', fontWeight: '500' }],
        // UI
        'body-lg':  ['15px', { lineHeight: '1.65' }],
        'body':     ['14px', { lineHeight: '1.65' }],
        'body-sm':  ['13px', { lineHeight: '1.6'  }],
        'caption':  ['12px', { lineHeight: '1.5'  }],
        'label':    ['11px', { lineHeight: '1.4', letterSpacing: '2px', fontWeight: '500' }],
        'micro':    ['10px', { lineHeight: '1.4', letterSpacing: '1px', fontWeight: '500' }],
      },
      borderRadius: {
        'pill': '20px',
      },
      maxWidth: {
        'assessment': '520px',
        'results':    '600px',
        'content':    '480px',
      },
      animation: {
        'pulse-amber': 'pulseAmber 1.2s ease-in-out infinite',
        'fade-up':     'fadeUp 0.4s ease forwards',
      },
      keyframes: {
        pulseAmber: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.6)', opacity: '0.4' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
};

export default config;
```

---

## CSS Custom Properties

Add to `app/globals.css` — these supplement the Tailwind tokens.

```css
:root {
  /* Animation delays for staggered results reveal */
  --delay-block-1: 0ms;
  --delay-block-2: 120ms;
  --delay-block-3: 240ms;
  --delay-block-4: 360ms;
  --delay-block-5: 480ms;

  /* Reveal screen timing */
  --reveal-total: 1100ms;
  --reveal-category-appear: 600ms;

  /* Transition durations */
  --transition-fast:   100ms;
  --transition-normal: 150ms;
  --transition-slow:   250ms;

  /* Chart colours (hardcoded — consistent across themes) */
  --chart-interchange: #E24B4A;
  --chart-scheme:      #BA7517;
  --chart-margin:      #888780;
  --chart-surcharge:   #3B6D11;

  /* Brand amber (hardcoded for themed sections) */
  --amber-50:  #FAEEDA;
  --amber-200: #EF9F27;
  --amber-400: #BA7517;
  --amber-800: #633806;
}
```

---

## Component Class Patterns

Common patterns used throughout the codebase. Define these as reusable components, not one-off inline styles.

### Card

```css
.card {
  background: var(--color-background-primary);
  border: 0.5px solid var(--color-border-secondary);
  border-radius: var(--border-radius-lg); /* 12px */
  padding: 16px 18px;
}

.card-selected {
  border: 1px solid #BA7517;
}

.card-secondary {
  background: var(--color-background-secondary);
  border: 0.5px solid var(--color-border-tertiary);
  border-radius: var(--border-radius-lg);
  padding: 16px 18px;
}
```

### Pill badge

```css
.pill {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.pill-amber { background: #FAEEDA; color: #633806; }
.pill-green { background: var(--color-background-success); color: var(--color-text-success); }
.pill-red   { background: var(--color-background-danger);  color: var(--color-text-danger);  }
.pill-grey  { background: var(--color-background-secondary); color: var(--color-text-secondary); }
```

### Step counter

```css
.step-counter {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.step-counter-current {
  color: #BA7517;
  font-style: normal;
}
```

### Financial number

```css
.financial-hero {
  font-family: var(--font-mono);
  font-size: 44px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -1px;
}

.financial-standard {
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 500;
}

.financial-positive { color: var(--color-text-success); }
.financial-negative { color: var(--color-text-danger); }
```

### Action list date chip

```css
.action-date {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: #BA7517;
  letter-spacing: 0.8px;
  min-width: 80px;
  padding-top: 2px;
  line-height: 1.4;
  flex-shrink: 0;
}
```

### Progress bar

```css
.progress-bar {
  display: flex;
  gap: 4px;
}

.progress-segment {
  height: 2px;
  flex: 1;
  border-radius: 1px;
  background: var(--color-border-tertiary);
  transition: background 150ms ease;
}

.progress-segment.done,
.progress-segment.active {
  background: #BA7517;
}
```

### PSP pill

```css
.psp-pill {
  font-size: 12px;
  padding: 5px 12px;
  border: 0.5px solid var(--color-border-secondary);
  border-radius: 20px;
  cursor: pointer;
  background: var(--color-background-primary);
  color: var(--color-text-secondary);
  transition: all 100ms ease;
}

.psp-pill.selected {
  border: 1px solid #BA7517;
  color: #633806;
  background: #FAEEDA;
}
```

---

## Responsive Breakpoints

```typescript
// One breakpoint only — 500px (not the conventional 768px)
// The mobile audience for this tool is phone-first merchants

const breakpoints = {
  mobile: '500px', // Below this: single column layouts
};
```

```css
/* Usage in CSS */
@media (max-width: 500px) {
  .plan-grid    { grid-template-columns: 1fr; }
  .metric-row   { grid-template-columns: 1fr; }
  .industry-grid { grid-template-columns: 1fr 1fr; } /* 2 col not 3 */
  .hero-title   { font-size: 24px; }
  .feat-grid    { grid-template-columns: 1fr; }
}
```

---

## Spacing Reference

All spacing follows an 8px base grid.

| Name | Value | Usage |
|---|---|---|
| xs | 4px | Internal gaps within components |
| sm | 8px | Component padding, small gaps |
| md | 16px | Standard padding, gaps between elements |
| lg | 24px | Section padding, card padding |
| xl | 32px | Large section gaps |
| 2xl | 48px | Hero padding |
| 3xl | 56px | Hero top/bottom padding |

---

*Design Tokens v1.0 · nosurcharging.com.au · April 2026*
