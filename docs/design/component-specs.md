# Component Behaviour Specifications
## nosurcharging.com.au

Detailed behaviour specs for every interactive component. Use alongside ux-design.md for implementation.

---

## CB-01 — Plan Type Tiles (Step 2)

**Purpose:** Allow merchants to identify their pricing plan by recognising
the STRUCTURE of their statement — not by knowing the jargon term.
No specific rates, percentages, or dollar amounts appear in the mocks.

**Layout:**
```
Row 1: 2-column primary grid
  [Flat rate tile]          [Cost-plus tile]

Row 2: 2-column secondary grid
  [Zero-cost tile]          [Blended tile]

Row 3: Full-width compact
  [Strategic rate tile]

Row 4: Dashed escape hatch
  [Don't know tile]
```

**Selection states (ALL tiles, ALL PSP pills):**
```
unselected:
  border: 0.5px solid var(--color-border-secondary)
  background: var(--color-background-primary)
  hover: border-color shifts to var(--color-border-primary)

selected:
  border: 1.5px solid #1A6B5A (emerald)
  background: #EBF6F3 (light emerald tint)
  transition: border 120ms ease, background 120ms ease
```

**PSP pill selected state:**
```
  border: 1px solid #1A6B5A
  background: #EBF6F3
  text colour: #0D3D32
```

**Tile content:**

Flat rate tile (planType = 'flat'):
- Headline: "I pay one percentage on every transaction"
- Italic note: "One line — one percentage — covers everything"
- Tech tag: `flat rate · blended MSF · single percentage`
- Mock bill (structure only, grey bars, NO numbers):
  - Row: "Merchant service fee" + grey bar (60px)
  - Divider
  - Row bold: "Total charged" + grey bar (52px)

Cost-plus tile (planType = 'costplus'):
- Headline: "I see a list of separate charges on my bill"
- Italic note: "Multiple line items — different amounts for different costs"
- Tech tag: `IC++ · cost-plus · interchange-plus`
- Mock bill (grey bars, NO numbers):
  - Row: "Payment processing costs" + grey bar (60px, widest)
  - Row: "Payment method costs" + grey bar (52px)
  - Row: "Card scheme fees" + grey bar (36px)
  - Row: "Provider margin" + green bar (28px, #C0DD97)

Zero-cost tile (planType = 'zero_cost'):
- Headline: "I pass the fee to my customers and keep my full margin"
- Tech tag: `no-cost EFTPOS · fee-free · surcharge model`
- Mock (pass-through mechanic):
  - Row [C avatar]: "Customer pays sale price"
  - Row [arrow]: "card fee passed through" (muted)
  - Divider
  - Row [M avatar]: "I receive the full sale price" (bold, #0D3D32)

Blended tile (planType = 'blended'):
- Headline: "I pay different amounts for debit vs credit cards"
- Tech tag: `blended · tiered rates`
- Mock bill (grey bars, NO numbers):
  - Row: "Debit card transactions" + grey bar (36px)
  - Row: "Credit card transactions" + grey bar (52px)
  - Divider
  - Row bold: "Total charged" + grey bar (60px)

Strategic rate tile (planType = 'strategic_rate'):
- Full width, compact horizontal layout
- Left: "My bank or PSP negotiated a custom rate for my business"
- Left subtag: `strategic · custom pricing · bespoke`
- Right: "$50M+ · individually negotiated" (muted)

Don't know tile (maps internally to planType = 'flat'):
- Dashed border (0.5px dashed)
- [?] circle avatar
- Main text: "I'm not sure how I pay for card acceptance"
- Sub text: "We'll use smart defaults and flag every assumption"

**Mock bar visual rules:**
- All bars: height 8px, border-radius 3px
- Colour: var(--color-border-secondary) for grey bars
- Exception: "Provider margin" bar uses #C0DD97 (light green)
- NO percentages, NO dollar amounts anywhere in any mock

**Accessibility:**
- `role="radio"`, `aria-checked`, keyboard navigable
- Tile headline reads as the aria-label

---

## CB-02 — Expert Toggle Panel (Step 2)

**Trigger:** Text link "Payment wizard? Enter your exact rates →"

**Expand behaviour:**
- Height: 0 → auto over 250ms ease
- Opacity: 0 → 1 over 250ms ease
- Link text changes to "← Use smart defaults instead"

**Fields (all optional):**

| Field | Placeholder | Unit | Default used if blank |
|---|---|---|---|
| Debit (cents per txn) | 9 | c | 9c (RBA average) |
| Consumer credit (%) | 0.52 | % | 0.52% (RBA average) |
| PSP margin (%) | 0.10 | % | 0.10% (RBA estimate) |

**Confidence badge (updates live on any input change):**

```
Any field filled:
  background: #EAF3DE
  color: #27500A
  border: 0.5px solid #C0DD97
  text: "Calculated from your exact rates"

All fields empty:
  background: #FAEEDA
  color: #633806
  border: 0.5px solid #FAC775
  text: "Will use RBA averages"
```

**State persistence:** Expert rates persist through Step 3 and 4. They are used in the calculation when the form is submitted.

---

## CB-03 — PSP Pill Selector (Step 2)

**Options:** Stripe · Square · Tyro · CommBank · ANZ · Westpac · eWAY · Adyen · Other

**Single select only.** Clicking a selected pill does not deselect it (a PSP must always be selected after one is chosen).

**States:**
```
default: 0.5px border-secondary, secondary text, primary bg
selected: 1px solid #1A6B5A, #0D3D32 text, #EBF6F3 bg
```

**Validation:** Both plan type AND PSP must be selected to enable the Next button.

---

## CB-04 — Yes/No Surcharge Buttons (Step 3)

**Selection states:**

```
Yes selected:
  border: 1px solid var(--color-border-warning)
  background: var(--color-background-warning)
  main text: var(--color-text-warning)
  sub-label: secondary colour

No selected:
  border: 1px solid var(--color-border-success)
  background: var(--color-background-success)
  main text: var(--color-text-success)
  sub-label: secondary colour
```

**Side effects on Yes selection:**
1. Network checkbox grid appears (250ms expand)
2. Surcharge rate input appears (250ms expand)
3. Next button remains disabled until surcharge rate > 0

**Side effects on No selection:**
1. Network grid hides
2. Surcharge rate input hides
3. Internal state: `surchargeNetworks = []`, `surchargeRate = 0`
4. Next button enables immediately

---

## CB-05 — Network Checkboxes (Step 3, conditional)

**Appears only when Yes is selected.**

**Amex/BNPL-only detection:**
```
If all checked networks are in ['amex', 'bnpl']:
  Show green informational note
  Note text: "The October ban doesn't cover Amex, BNPL or PayPal — these 
              remain surchargeable. If you only surcharge these networks, 
              this reform may not directly affect your surcharge revenue."
  Background: var(--color-background-success)
  Border: 0.5px var(--color-border-success)
  Text: 12px var(--color-text-success)

If any designated network is checked (visa or eftpos):
  Note hides
```

**The detection logic runs on every checkbox change.** Not just on final submission.

---

## CB-06 — Industry Tiles (Step 4)

**Grid:** 3 columns (2 columns below 500px)

**Selection state:**
```
selected:
  border: 1px solid #BA7517
  background: #FAEEDA
  text: #633806
  icon fill/stroke: #BA7517
```

**Effect:** Industry selection personalises the action list on the results page. The selected industry is stored in state and used when building the action list (per-unit language, urgency context).

---

## CB-07 — The Reveal Screen

**Trigger:** Clicking "See my results →" on Step 4

**Sequence:**
```
t=0ms:    Reveal screen appears (dark, full viewport height)
t=0ms:    Pulsing dot begins
t=0ms:    "Calculating your position..." label visible
t=600ms:  Category label fades in (opacity 0→1, 400ms ease)
t=1100ms: Results screen replaces reveal (opacity crossfade, 200ms)
```

**During the reveal (1.1s), the server action fires:**
The `submitAssessment()` server action begins immediately when the reveal appears — not after it completes. The 1.1s window is enough time for the database write. If the action takes longer than 1.1s, hold on the reveal screen until it resolves.

**Error handling:** If the server action fails, replace the reveal screen with an error message. Do not navigate to the results page with incomplete data.

---

## CB-08 — Pass-Through Slider (Results, Categories 2 and 4)

**Range:** 0–100%, step 1
**Initial value:** 45% (RBA market average pass-through rate)

**On every input event (16ms budget):**
1. Read slider value
2. `recalculate(inputs, { passThrough: value / 100 })` — pure client-side function
3. Update: saving amount display, Oct 2026 metric card, P&L swing hero number, chart

**All four updates must happen in the same synchronous call.** Do not batch them across render cycles — the slider must feel instant.

**Saving amount display:**
```
0%:   $0 (grey or secondary colour)
>0%:  Positive saving in green var(--color-text-success)
```

**Slider accent colour:** `accent-color: #BA7517` via CSS.

---

## CB-09 — Before/After Chart (Results)

**Library:** Recharts (not Chart.js — the prototype used Chart.js but the production build uses Recharts for React integration)

**Chart type:** Stacked vertical bar

**Data series (four):**

| Series | Colour | Today value | Oct 2026 value |
|---|---|---|---|
| Interchange | `#E24B4A` | `todayDebitIC + todayCreditIC` | Updates with slider |
| Scheme fees | `#BA7517` | `todayScheme` | `todayScheme` (UNCHANGED) |
| Margin | `#888780` | `todayMargin` | `todayMargin` (unchanged) |
| Surcharge offset | `#3B6D11` | `-surchargeRevenue` (negative) | `0` |

**THE CRITICAL IMPLEMENTATION REQUIREMENT:**
The scheme fees series must be EXACTLY equal in both columns. `todayScheme === oct2026Scheme`. This communicates — without words — that scheme fees are unregulated and unchanged. This is intentional design. Do not allow any rounding, floating point drift, or chart library behaviour to make these values differ. If necessary, use `Math.round()` on both and confirm equality before passing to Recharts.

**Chart updates:** The chart re-renders on every slider change. The interchange bar changes height. The scheme fees bar does not. This visual contrast is the point.

**Custom legend:** Build as HTML elements below the chart header. Do not use Recharts' built-in legend — it uses round dots and has poor spacing.

```tsx
<div className="chart-legend">
  {series.map(s => (
    <div key={s.key} className="legend-item">
      <div className="legend-square" style={{ background: s.colour }} />
      <span>{s.label}</span>
    </div>
  ))}
</div>
```

**Tooltip:** On hover, show the dollar value for each component. Format: `$XX,XXX` — no decimals, comma separator.

**No animations on the chart.** Recharts animates by default — disable this for the slider-driven chart. Animation on every slider move feels wrong and introduces latency.

---

## CB-10 — Assumptions Toggle (Results)

**Default:** Collapsed

**Toggle text:**
- Collapsed: `↓ How we calculated this`
- Expanded: `↑ How we calculated this`

**Contents when expanded:**
```
Card mix assumed    60% debit · 35% credit · 5% foreign
Debit IC saving     9c → 8c per transaction
Credit IC saving    {actual rate}% → {new rate}%  [interpolated from expert input or defaults]
Scheme fees         Unchanged — unregulated
Confidence          High confidence / Estimated — RBA averages [based on expert mode]
Source              RBA Conclusions Paper, March 2026
```

**If expert mode was used**, show the actual rates entered by the merchant. If defaults were used, show the RBA averages.

---

## CB-11 — Email Capture (Results)

**Validation:** Standard email format. No exotic validation — just `type="email"` with a format check.

**Rate limit check:** 1 per session, 10 per IP per hour. Enforced server-side in the `captureEmail()` server action.

**On success:**
- Input field replaced with confirmation text: "You're on the list for 30 October."
- No page navigation
- No modal
- Plausible event fires: `trackEvent('Email captured', { country: 'AU' })`

**On rate limit hit:**
- Inline error below input: "You've already signed up. One email on 30 October."

**On validation error:**
- Inline error: "Please enter a valid email address."

---

## CB-12 — Consulting CTA Button

**Click behaviour:** Opens Calendly booking page. Target: `_blank` (new tab).

**Plausible event fires on click:**
```typescript
trackEvent('CTA clicked', { category: String(category), country: 'AU' });
```

**The CTA button must be visible on mobile without scrolling on the results page.** Test on 375px viewport. If the results page is very long, consider a sticky CTA bar at the bottom on mobile (but do not obscure the slider or chart).

---

## CB-13 — Homepage Preview Cards

**Auto-rotation:** Every 3.5 seconds, advance to the next category (1→2→3→4→1)

**Manual navigation:** Clicking a category tab jumps to that category immediately and resets the timer.

**Tab states:**
```
inactive: transparent bg, 0.5px secondary border, secondary text
active: #FAEEDA bg, #BA7517 border, #633806 text
```

**Preview card update on category change:** Smooth transition — fade the card content (opacity 0→1, 200ms). Do not slide or transform.

**The preview card must be populated from real category data**, not hardcoded. The four preview states correspond to:
- Category 1: cost-plus, not surcharging, $600K volume example
- Category 2: flat rate, not surcharging, $2M volume example
- Category 3: cost-plus, surcharging, $8M volume example
- Category 4: flat rate, surcharging, $3M volume example

---

## CB-14 — Staggered Results Reveal

Each major results section fades up in sequence after the reveal screen exits.

```typescript
// Sections in order
const sections = [
  { id: 'verdict',     delay: 0   },
  { id: 'metrics',     delay: 120 },
  { id: 'slider',      delay: 240 },
  { id: 'chart',       delay: 240 }, // Same delay as slider
  { id: 'assumptions', delay: 360 },
  { id: 'actions',     delay: 360 },
  { id: 'cta',         delay: 480 },
];
```

**Animation per section:**
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.section-reveal {
  animation: fadeUp 0.4s ease forwards;
  opacity: 0; /* initial state before animation runs */
}
```

**Implementation:** Apply the animation class and delay via inline style when the results page mounts. Do not use `setTimeout` chains — use CSS animation delays.

---

## CB-15 — Escape Scenario Card (Results, Categories 2 and 4 only)

**Purpose:** Show the merchant what their position would be on cost-plus, removing
all pass-through uncertainty. The single strongest CTA driver on the page.

**Appears:** Below the pass-through slider, above the action list.

**Calculation:**
```typescript
// On cost-plus, IC saving flows automatically (100% pass-through)
// Gross COA = debit IC + credit IC + scheme fees + PSP margin
const costPlusGrossCOA = calculateCOA(volume, cardMix, currentRates, marginPct);
const costPlusOctNet   = costPlusGrossCOA - totalICSaving; // saving flows 100%
const costPlusSaving   = octNet - costPlusOctNet;          // vs current flat rate position
```

**States:**
```
Left card (current flat rate):
  Badge: "Your current plan" (amber)
  Value: octNet (updates with slider)
  Sub: "Range: $[100%PT]–$[0%PT] depending on [PSP]"

Right card (cost-plus escape):
  Badge: "Escape scenario" (green)
  Border: 1.5px solid var(--color-border-success) — featured
  Value: costPlusOctNet (fixed — no slider dependency)
  Sub: "IC saving flows 100% automatically. No pass-through risk."
  Save callout: "Saves $[costPlusSaving]/year vs your current plan"
```

**Note below cards:**
"Switching to cost-plus requires renegotiating your PSP contract or switching providers.
The discovery call will confirm whether this is achievable for your volume and PSP."

---

## CB-16 — Waterfall Chart

**Purpose:** Shows WHY the P&L changes — surcharge loss vs IC saving — more
comprehensible than the stacked bar for merchants who need to act.

**Replaces** the stacked bar as the primary chart. Stacked bar moves to the
assumptions panel as a secondary "cost composition" view.

**Four bars:**
```
1. Today (grey)        — [0, netToday]         — "Your net cost today"
2. Surcharge lost (red) — [netToday, annualMSF] — cost goes up when surcharge removed
3. IC saving (green)   — [octNet, annualMSF]    — cost comes back down
4. October (red/green) — [0, octNet]            — "Your net cost in October"
```

**Colour logic:**
- Bar 4 is red if octNet > netToday (merchant is worse off)
- Bar 4 is green if octNet < netToday (merchant is better off — Category 1)

**Updates:** Bars 3 and 4 update in real time when the pass-through slider moves.
Use `isAnimationActive={false}` on the Recharts component for instant updates.

**Y-axis format:** `'$' + (v/1000).toFixed(0) + 'K'`

---

## CB-17 — Reform Timeline

**Purpose:** Visual orientation showing the merchant where they are relative to
all reform dates. Makes urgency visceral.

**Not interactive.** Purely informational.

**Structure:**
```
Horizontal line spanning full width.
Amber progress bar: 0% to 12% (roughly April 2026 position).

Six event dots with labels below:
  Apr 2026 (TODAY)  — amber dot with glow ring
  Aug 2026          — amber dot — "negotiate window"
  1 Oct 2026        — red dot  — "surcharge ban + IC cuts"
  30 Oct 2026       — green dot — "MSF benchmarks published"
  30 Jan 2027       — green dot — "pass-through report"
  1 Apr 2027        — grey dot — "foreign card cap"
```

**Dot styling:**
```css
.tl-dot-today {
  background: #BA7517;
  box-shadow: 0 0 0 3px rgba(186,117,23,0.2); /* amber glow */
}
.tl-dot-critical { background: var(--color-text-danger); }
.tl-dot-positive { background: var(--color-text-success); }
.tl-dot-neutral  { background: var(--color-border-secondary); }
```

---

## CB-18 — Urgency-Tiered Action List

**Purpose:** Makes the action list immediately scannable by grouping actions
into three urgency tiers with colour-coded pills.

**Three tiers:**
```
URGENT — DO THIS WEEK
  [urgent pill] Action text with PSP name inline

PLAN — BEFORE AUGUST
  [plan pill] Action text

MONITOR — AFTER OCTOBER
  [monitor pill] Action text with specific date
```

**Pill styles:**
```css
.pill-urgent  { background: var(--color-background-danger);  color: var(--color-text-danger);  }
.pill-plan    { background: var(--color-background-warning); color: var(--color-text-warning); }
.pill-monitor { background: var(--color-background-secondary); color: var(--color-text-secondary); }
```

Pill dimensions: 10px font, padding 1px 7px, border-radius 20px.

**Group header:**
10px font, weight 500, letter-spacing 1.2px, var(--color-text-tertiary).
All caps: "URGENT — DO THIS WEEK"

The action list builder (packages/calculations/actions.ts) must assign an urgency tier
to each action based on its date anchor and category. Urgency tiers:
- 'urgent': actions with anchor 'now' or 'this-week'
- 'plan': actions with anchor 'before-aug' or 'before-oct'
- 'monitor': actions with anchor date >= '2026-10-01'

---

*Component Behaviour Specifications v1.0 · nosurcharging.com.au · April 2026*
