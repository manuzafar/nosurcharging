# Design System — nosurcharging.com.au
## interface-design/system.md

---

## Direction
**Personality:** Sophistication & Trust
**Foundation:** Warm neutral — receipt paper cream base, not pure white
**Depth:** Borders-only — no box-shadow, no text-shadow, anywhere
**Feel:** A financial document from a trusted independent expert.
         Calm, precise, authoritative.
         Not a startup. Not a bank. Not a sales funnel.

---

## Domain
Card terminal · Interchange · Settlement · Merchant Service Fee ·
Acquirer · Scheme · Basis points · Pass-through · Regulatory deadline ·
Receipt paper · Ledger ink · Approval LED green · Declined red

## Colour World (from physical domain)
- Receipt paper cream → canvas background (#FAF7F2)
- Card terminal charcoal → nav, CTA strips (#1A1409)
- Approval LED green → accent, CTAs, highlights (#1A6B5A)
- Declined terminal screen → negative P&L numbers (#7F1D1D)
- Ledger ink → primary text (#1A1409)
- Bank statement white → document surfaces (#FFFFFE)

## Signature
Report-as-product. The output looks like a document an accountant
could read — complete with a header showing merchant name/volume/PSP,
calculations with formulas shown, and action plan with word-for-word scripts.
The italic "Your" in accent green in the hero headline is the visual
signature — it only makes sense for this product.

---

## Tokens

### Colours (Tailwind config names → hex values)
```
accent:          #1A6B5A   Primary accent — approval green
accent-light:    #EBF6F3   Light background tint
accent-border:   #72C4B0   Border/separator colour
accent-dark:     #0D4A3C   Dark text on accent-light surfaces

ink:             #1A1409   Primary text (ledger ink)
ink-secondary:   #3D3320   Supporting text
ink-muted:       #6B5E4A   Metadata, captions
ink-faint:       #9A8C78   Labels, hints, eyebrows

paper:           #FAF7F2   Page background (receipt paper)
paper-secondary: #F3EDE4   Slightly richer surface

rule:            #DDD5C8   Borders and dividers

green:           #166534   Positive P&L
green-bg:        #E8F5EB   Positive light background
red:             #7F1D1D   Negative P&L
red-bg:          #FDECEA   Negative light background
```

NOTE: The amber token (#B8840A / #FEF3E0) is being REPLACED by the
accent system above. All Tailwind classes `text-amber-*`, `bg-amber-*`,
`border-amber-*` must be updated to `text-accent-*` etc.

### Spacing (4px base grid)
```
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 52, 64, 68, 72
All padding, gap, and margin values must be multiples of 4px.
No arbitrary values (14px → 16px, 9px → 8px, 7px → 8px).
```

### Typography
```
Display/headings: Playfair Display (Google Font, already loaded)
Body/UI copy:     Source Serif 4 (Google Font, already loaded)
Numbers/mono:     SF Mono, Consolas, monospace (system)

Type scale:
  Hero number:    60px / mono / 500 / -4px tracking
  Page headline:  54px / Playfair / 400 / -2.5px tracking
  Section head:   26px / Playfair / 400 / -0.8px tracking
  Card title:     16px / Playfair / 400 / -0.2px tracking
  Body:           14px / Source Serif 4 / 400 / normal
  Label/body:     13px / Source Serif 4 / 400 / normal
  Caption:        12px / Source Serif 4 / 400 / normal
  Micro (eyebrow):10px / system sans / 700 / 2.5px tracking (UPPERCASE)

Mobile reductions:
  Hero number:    48px (down from 60px on mobile)
  Page headline:  40px (down from 54px on mobile)
```

### Border progression
```
Faint:    1px solid rgba(26,20,9,0.06)     Structure only — barely visible
Standard: 1px solid rule (#DDD5C8)         Section dividers
Strong:   1px solid rgba(26,20,9,0.18)     Component edges needing definition
Emphasis: 2px solid ink (#1A1409)          Document headers
Accent:   2px solid accent (#1A6B5A)       Callout borders
```

---

## Patterns

### Button — Primary
```
Background:   accent (#1A6B5A)
Text:         white, 700 weight
Font-size:    15px (hero) / 14px (standard) / 12px (inline)
Padding:      16px 36px (hero) / 14px 40px (standard) / 8px 18px (nav)
Border-radius: 0 (sharp corners — document aesthetic)
Outline:      3px solid accent, 2px offset (for visibility on cream bg)
Hover:        accent-dark (#0D4A3C)
Active:       opacity: 0.92
Focus:        ring-2 ring-accent ring-offset-2
```

### Button — Ghost
```
Background:   transparent
Border:       1px solid rule (#DDD5C8)
Text:         ink-secondary
Hover:        background ink at 4%
```

### Navigation
```
Background:   ink (#1A1409)
Height:       52px
Padding:      0 32px
Logo:         heading font, white, "surcharging" in accent-border italic
CTA:          Primary button, smaller padding
Position:     sticky top-0 z-50
```

### Proof bar (homepage — static, replaces marquee)
```
Background:   accent-light (#EBF6F3)
Border-bottom: 1px solid accent-border (#72C4B0)
Layout:       flex centered, three items with separators
Item text:    11px, 500, accent, 0.2px tracking
Separator:    1px accent-border at 40% opacity
Checkmark:    SVG circle with tick, accent colour
```

### Hero eyebrow badge
```
Background:   accent-light
Border:       1px solid accent-border
Padding:      5px 14px
Font:         10px, 700, 1.8px tracking, accent
Pulse dot:    5px circle, accent, opacity 1→0.3 animation 2s infinite
```

### Category/Situation pill
```
Font:         10px, 700, 1.5px tracking
Border-radius: 0 (sharp — document aesthetic)
Situation 1:  green-bg / green text
Situation 2:  amber-bg / amber text
Situation 3:  red-bg / red text
Situation 4:  red-bg / red text
```

### Problem block
```
Padding:      14px 16px
CERTAIN:      background red-bg, border-left 3px solid red
DEPENDS:      background amber-bg, border-left 3px solid amber
Tag:          9px, 700, 0.8px tracking, filled (red or amber bg, white text)
```

### Action card
```
Background:   white (#FFFFFE) or paper for script area
Border:       1px strong border
Padding:      16px
Border-radius: 0 (sharp — document aesthetic)
Script area:  paper bg, border-left 2px solid accent-border, italic
Why text:     11px, ink-faint
```

### Report document header
```
Border-bottom: 2px solid ink (Emphasis border)
Padding:       24px 32px
Eyebrow:       9px, 700, 3px tracking, ink-faint
Title:         heading font, 17px, ink
Meta (right):  11px, ink-faint, right-aligned
```

### Metric row
```
Border:        1px strong
Three cells:   divided by 1px standard border
Cell padding:  12px 14px
Label:         9px, 700, 1.5px tracking, ink-faint (ALL CAPS)
Value:         monospace, 15px, 500
```

### Consulting CTA strip
```
Background:    ink (#1A1409)
Padding:       24px
Headline:      heading font, 17px, white
Sub:           12px, white/32%
Button:        Primary button (accent)
Price note:    10px, white/18%
```

### Skeleton loading
```
Background:    ink at 10% opacity
Animation:     opacity 0.35 → 0.65, 1.5s ease-in-out infinite
Border-radius: 0 on blocks (matches sharp card aesthetic)
             2px on lines/labels
```

---

## Depth Strategy
```
ONE RULE: Borders only.

NEVER:
  box-shadow on any component
  text-shadow on any element
  drop-shadow filters

Hierarchy achieved through:
  1. Border weight scale (faint → emphasis → accent)
  2. Background tint (paper → white → faint-accent)
  3. Typography weight and size
  4. Spacing — generous space = elevated importance
```

---

## Interactive States
```
All interactive elements require these states:

Default:   base styles
Hover:     border intensity up one step, or background tint
Active:    opacity: 0.92 or scale: 0.98 (transform)
Focus:     ring-2 ring-accent ring-offset-2 (Tailwind)
Disabled:  opacity: 0.4, cursor: not-allowed

Data states:
  Loading: skeleton shimmer
  Empty:   centered message, ink-faint colour
  Error:   red-bg background, red border-left accent
```

---

## Decisions Log
| Decision | Rationale | Date |
|---|---|---|
| Emerald/ledger (#1A6B5A) replaces amber (#B8840A) | Amber reads as "warning/sale". Emerald = approval LED green from the card terminal domain. Uncommon in AU fintech — differentiated. | 2026-04 |
| Playfair Display + Source Serif 4 kept (not changed to Georgia) | These are better fonts for this use case. Playfair is more contemporary than Georgia for a 2026 tool. Source Serif 4 is more readable on screen. Keep them. | 2026-04 |
| Borders-only depth | Financial documents don't use shadows. Consistent with report-as-product framing. Avoids the SaaS dashboard aesthetic. | 2026-04 |
| Receipt paper canvas (#FAF7F2) | Already the existing `paper` token. Correct — matches physical receipt paper domain. No change needed. | 2026-04 |
| 4px spacing grid | Financial data tool. Tight enough for data tables, clean enough for reading. All values must be multiples of 4. | 2026-04 |
| Sharp corners (border-radius: 0) | Document aesthetic. Bank statements, regulatory notices, receipts — none have rounded corners. This is the design decision that makes the UI feel like a document rather than a consumer app. | 2026-04 |
| Action plan in primary zone (above depth toggle) | Merchants arrive asking "what do I do?" Actions must be the first thing after the number, not behind a toggle. | 2026-04 |
| CostCompositionChart in depth zone | The chart answers "why is my saving small?" — a depth question for curious merchants. Not every merchant needs it. Behind the toggle is correct. | 2026-04 |
| Consulting CTA on results page only | Single conversion goal on homepage. Consulting offer belongs where the merchant has just quantified their problem. | 2026-04 |
| Static proof bar replaces scrolling marquee | Financial tools don't use ticker-tape. Static proof bar is calmer, more credible, and matches the Sophistication & Trust personality. | 2026-04 |
| "Situation N" not "Category N" on homepage | Plain English self-identification. Merchants can recognise themselves in a situation description instantly. "Category" requires explanation. | 2026-04 |
