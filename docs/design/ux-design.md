# UX Design Specification
## nosurcharging.com.au

**Version:** 1.0 | **April 2026**

A working HTML prototype (v3) exists and is the primary visual reference. Read this document for the design system, principles, and rationale. Reference the prototype for the implementation.

---

## 1. Design Vision

**"Precision Financial Intelligence"**

The aesthetic sits between mercury.com (financial data presentation) and raycast.com (dark editorial hero, warm accent, precise spacing). It should feel like a tool built by someone who understands payments deeply — not a marketing site, not a generic SaaS dashboard.

**Reference sites to study before building:**
- **mercury.com** — how financial numbers are displayed, the mono/serif pairing, the restraint in colour use
- **raycast.com** — dark hero sections, amber/warm accent on dark, editorial type, the product preview in the hero
- **cursor.com** — homepage hero with floating product preview showing the output before you commit
- **linear.app** — step counter patterns, precision spacing, selected state design
- **up.com.au** — Australian financial UX, plain English, warmth within precision

**What the tool should NOT look like:**
- Generic SaaS landing pages (blue primary, card grids, stock illustrations)
- Government financial tools (dense, clinical, inaccessible)
- PSP marketing sites (benefit-heavy, trust-badge-laden, conversion-optimised feel)

---

## 2. The Dual Audience

The most important UX constraint in the product. Two users land on the same URL:

**The layman** — a café owner or hospitality group CFO who knows they pay "something like 1.4%" to their bank. They cannot name the components of their merchant service fee. They will abandon if they see a field they cannot answer.

**The payment wizard** — a treasury manager or finance director who knows their exact interchange rates by card type. They will not trust a tool that forces defaults on them and will abandon if it feels simplified.

**The design solution: adaptive depth, not separate paths.**

The assessment starts identically for both users. The fork happens at the plan type step — but not with an upfront "Are you an expert?" gate. That is condescending. Instead:

- Primary interaction: two visual mock statement cards anyone can recognise
- Secondary path: a small text link "Payment wizard? Enter your exact rates →" that expands a panel

The wizard self-selects by clicking the link. The layman never sees the expert panel as prominent. This is the single most important interaction design decision in the product.

---

## 3. Typography System

Three font roles. Never mix them within the same type of content.

| Role | Font | Size | Weight | Usage |
|---|---|---|---|---|
| Display | `var(--font-serif)` | 30–32px | 500 | Hero headlines |
| Heading | `var(--font-serif)` | 20–24px | 500 | Step questions, section headers |
| Body | `var(--font-sans)` | 13–14px | 400 | Descriptions, action list body |
| Label | `var(--font-sans)` | 10–11px | 500 | Step kicker, metric labels, category labels |
| Financial (hero) | `var(--font-mono)` | 44px | 500 | P&L swing hero number |
| Financial (standard) | `var(--font-mono)` | 20–22px | 500 | Metric cards, slider value |
| Financial (small) | `var(--font-mono)` | 13px | 400 | Action list dates, step counter |
| Code/data | `var(--font-mono)` | 11px | 400 | Mock statement content |

**Rules:**
- All financial numbers — any number showing a dollar amount, percentage, or date — use `var(--font-mono)`. Not serif. Not sans. Mono only.
- The serif font is used for emotional impact: the hero headline, the step question, the category verdict headline. Not for UI chrome.
- Labels use uppercase-adjacent treatment via `letter-spacing: 2px` at small sizes. Do NOT use actual uppercase (`text-transform: uppercase`) — use sentence case with tracking.
- Font weights: 400 regular, 500 medium only. Never 600 or 700. The hierarchy comes from size and font family contrast, not weight.

---

## 4. Colour System

Single accent colour. High restraint everywhere else.

### Amber (brand accent — used sparingly but boldly)

| Token | Hex | Usage |
|---|---|---|
| Amber 400 | `#BA7517` | Buttons, borders on selected states, step counter number, action list dates |
| Amber 50 | `#FAEEDA` | Background on amber-bordered selected cards |
| Amber 800 | `#633806` | Text on amber backgrounds (e.g. selected card text) |
| Amber 200 | `#EF9F27` | Amber on dark backgrounds (hero kicker, reveal dot) |

### Semantic colours (CSS variables — adapt to light/dark mode)

| Semantic | CSS Variable | Usage |
|---|---|---|
| Positive value | `var(--color-text-success)` | P&L swing when positive, Category 1 badge |
| Positive bg | `var(--color-background-success)` | Category 1 verdict background, No surcharge selection |
| Negative value | `var(--color-text-danger)` | P&L swing when negative, Category 3/4 badge |
| Negative bg | `var(--color-background-danger)` | Category 3/4 verdict background |
| Warning | `var(--color-text-warning)` | Category 2 badge |
| Warning bg | `var(--color-background-warning)` | Category 2 verdict background, Yes surcharge selection |
| Primary text | `var(--color-text-primary)` | All headings, body text |
| Secondary text | `var(--color-text-secondary)` | Hint text, labels, body on cards |
| Borders | `var(--color-border-tertiary)` | Default hairline borders (0.5px) |
| Borders emphasis | `var(--color-border-secondary)` | Card borders, input borders |

### Dark sections

The homepage hero and the reveal screen use a dark background. Implement as `background: var(--color-text-primary)` — this creates a dark section in light mode and a light section in dark mode. Both are acceptable. Text within dark sections uses `color: var(--color-background-primary)`.

### Chart colours (hardcoded — consistent across light/dark)

| Component | Hex | Rationale |
|---|---|---|
| Interchange (red) | `#E24B4A` | Signals cost, danger |
| Scheme fees (amber) | `#BA7517` | Brand amber — deliberate: scheme fees are unchanged |
| Acquirer margin (grey) | `#888780` | Neutral, structural |
| Surcharge offset (green) | `#3B6D11` | Positive — revenue that offsets cost |

---

## 5. Spacing and Layout

**Maximum content width:**
- Assessment flow: 520px centred
- Results page: 600px centred
- Homepage: no max-width constraint (full-width sections)

**Base spacing unit:** 8px. Use multiples: 8, 16, 24, 32, 48, 56.

**Border radius:**
- Cards: `var(--border-radius-lg)` (12px)
- Inputs, buttons, pills: `var(--border-radius-md)` (8px)
- Progress bar segments: 2px (deliberately sharp)
- Pill badges: 20px (fully rounded)

**Border weights:**
- Default hairline: 0.5px
- Emphasis (card border on hover/focus): 0.5px
- Selected state: 1px (the only exception — deliberately heavier to communicate selection)
- Never 1.5px or 2px except for featured/recommended items

---

## 6. Screen-by-Screen Specifications

### 6.1 Navigation

**Height:** 52px
**Layout:** Logo left, actions right
**Logo:** `nosurcharging.com.au` — "surcharging" portion in amber `#BA7517`
**Font:** `var(--font-serif)`, 16px, weight 500
**Right actions:** "How it works" text link (secondary colour) + "Start assessment" outlined button

The nav must feel part of the page, not a separate bar. Use `border-bottom: 0.5px solid var(--color-border-tertiary)`. No box shadow.

---

### 6.2 Homepage — Hero Section

**Background:** `var(--color-text-primary)` (dark)
**Padding:** 56px top/bottom, 28px horizontal

**Structure:**
```
[Kicker] — 11px, letter-spacing 2.5px, colour #EF9F27 (amber on dark)
[Headline] — 32px serif, weight 500, colour var(--color-background-primary)
             Two lines: "The RBA banned surcharges."
             Next line: "Find out what it means for your P&L."
[Sub] — 14px, 1.65 line height, colour var(--color-background-secondary) (muted light)
        Max-width: 360px, centred
[CTA] — Amber button #BA7517, text #FAEEDA, 13px 34px padding, weight 500
[Trust bar] — Border-top 0.5px rgba(255,255,255,0.08) above it
              Three text items separated by pipe: RBA source · No account · No PSP affiliation
              11px, rgba(255,255,255,0.25)
```

**Do not put the hero in a card.** It is a full-bleed dark section.

---

### 6.3 Homepage — Preview Section

This section is the conversion-critical element. Merchants who understand what they will receive are more likely to start the assessment.

**Background:** `var(--color-background-secondary)` (light paper)
**Label:** "Sample results" — 10px, letter-spacing 3px, secondary colour, centred

**Category tabs:** Four labelled pill buttons above the preview card.
- Not anonymous dots — they are labelled with the category name and descriptor
- Labels: "Category 1 — Winner", "Category 2 — Conditional", "Category 3 — Reprice", "Category 4 — Act now"
- Unselected: transparent bg, secondary border
- Selected: amber bg (#FAEEDA), amber border (#BA7517), amber text (#633806)
- Auto-rotate every 3.5s, manual override on click

**Preview card structure:**
```
[Top strip] — category dot (coloured) + category label + verdict excerpt
[Metrics row] — 3 columns: Today / Oct 2026 / P&L swing
                Each: 10px label, 18px mono value
                P&L swing: coloured green or red
[Action preview] — 12px body text showing the top action item
```

The preview card is not interactive — it shows the merchant what a real result looks like before they commit to the four questions.

---

### 6.4 Homepage — Features Section

Three numbered items. Not cards with icons — a bordered row that reads like a document.

**Structure:**
```
[Section title] — 18px serif, centred
[Feature row] — 1px border all sides, border-radius-lg, overflow hidden
                Internal 1px dividers between items (from border-collapse effect)
  [01] — amber mono number, bold text heading, body description
  [02] — same
  [03] — same
```

Each item is a horizontal flex row: number left, text right. On mobile, single column stack.

---

### 6.5 Assessment — Step Design

**Progress indicator:** Thin horizontal line (2px) divided into four segments. Completed and active segments are amber `#BA7517`. Inactive segments are `var(--color-border-tertiary)`.

**Step counter:** Top-right aligned. Format: `{current} / 04` — current step number in amber mono. Font: `var(--font-mono)`, 13px.

```
[Progress line ●●○○] ———————————————— [01 / 04]
[Step kicker] — 11px, letter-spacing 2px, amber #BA7517
[Question] — 24px serif, weight 500, 1.28 line height
[Hint] — 13px, secondary colour, 1.6 line height
```

**Step navigation:**
- Back: plain text button, secondary colour, left aligned
- Next: amber filled button, right aligned, disabled at 30% opacity until required fields complete
- "See my results" (last step): dark filled button `var(--color-text-primary)`, white text, weight 500

**Step transitions:** 200ms ease-out. No slide animations — just opacity. Sliding creates confusion about direction.

---

### 6.6 Step 2 — Visual Plan Type Cards

This is the most critical screen in the assessment. Do not use radio buttons. Do not use jargon labels.

**Two cards in a grid.** Single column on mobile (<500px).

**Card structure:**
```
[Top section]
  Left: [Title] 14px weight 500
        [Sub] 11px secondary colour (PSP examples)
  Right: [Badge] pill — "Flat rate" or "Cost-plus", 10px

[Mock statement section]
  Background: var(--color-background-secondary)
  Border-radius: var(--border-radius-md)
  Font: var(--font-mono), 11px
  
  Flat rate card shows:
    "Merchant service fee  1.40%"  (one bold line)
    "Total charged         $1,400.00"  (one bold line)
  
  Cost-plus card shows:
    "Debit interchange     $312"
    "Credit interchange    $280"
    "Scheme fees           $88"
    "PSP margin            $95"  (this line in green — it's the part they negotiate)
```

**Selection states:**
- Unselected: `border: 0.5px solid var(--color-border-secondary)`
- Selected: `border: 1px solid #BA7517` (heavier, amber)
- No background change on selection — the border weight communicates selection

**Expert toggle link:**
```
"Payment wizard? Enter your exact rates →"
```
Styled as: 12px, secondary colour, underline, background:none, border:none. Not a button — a text link. Clicking expands the expert panel below the cards.

**Expert panel (collapsed by default):**
```
[Panel background] var(--color-background-secondary), 0.5px border
[Heading] "Your actual interchange rates (leave blank to use RBA averages)"
[Three fields in a grid]
  "Debit (cents per txn)"  placeholder: 9
  "Consumer credit (%)"    placeholder: 0.52
  "PSP margin (%)"         placeholder: 0.10
[Note] Scheme fees default to RBA averages. Unregulated. Unchanged by reform.
[Confidence badge] updates live:
  - Any field filled: green badge "Calculated from your exact rates"
  - All fields empty: amber badge "Will use RBA averages"
```

When expert panel is open, toggle link text changes to: "← Use smart defaults instead"

**PSP selector:**
```
Label: "Who processes your payments?"
12px, weight 500, letter-spacing 0.5px

Pills: Stripe · Square · Tyro · CommBank · ANZ · Westpac · eWAY · Adyen · Other
12px, 5px 12px padding, 20px border-radius

Unselected: 0.5px border-secondary, secondary text
Selected: 1px amber border, amber text (#633806), amber bg (#FAEEDA)
```

---

### 6.7 Step 3 — Surcharging

**Yes/No buttons:** Large, visual, distinctive. Not small radio buttons.

```
Grid: 2 columns (1 column mobile)
Each button:
  Padding: 22px
  Border: 0.5px
  Border-radius: var(--border-radius-lg)
  
  Large text: "Yes" or "No" — 20px serif, weight 500
  Sub-label: 11px sans, secondary colour, margin-top 5px
```

**Selection states:**
- Yes selected: `border: 1px solid var(--color-border-warning)`, `background: var(--color-background-warning)`, main text in `var(--color-text-warning)`
- No selected: `border: 1px solid var(--color-border-success)`, `background: var(--color-background-success)`, main text in `var(--color-text-success)`

**Network checkboxes (appears when Yes selected):**
```
Container: var(--color-background-secondary), 0.5px border, rounded
Label: "Which networks do you surcharge?"

Grid: 2×2
Items: checkbox + label text
  - Visa & Mastercard
  - eftpos
  - Amex (with "still permitted" annotation in secondary colour, smaller)
  - BNPL / PayPal (with "still permitted" annotation)

Custom accent colour on checkboxes: #BA7517
```

**Amex/BNPL-only note (appears when ONLY exempt networks checked):**
```
Background: var(--color-background-success)
Border: 0.5px var(--color-border-success)
Text: 12px, var(--color-text-success)
"The October ban doesn't cover Amex, BNPL or PayPal..."
```

---

### 6.8 Step 4 — Industry Tiles

**3×2 grid** (2×3 on mobile — wider than tall per tile)

**Each tile:**
```
Border: 0.5px border-secondary
Border-radius: var(--border-radius-md)
Padding: 14px 8px
Text-align: center

[SVG icon] 20×20px, colour: var(--color-text-secondary)
[Industry name] 12px, var(--color-text-primary)
```

**Selected state:**
```
Border: 1px solid #BA7517
Background: #FAEEDA
Icon colour: #BA7517
Text colour: #633806
```

**Use SVG icons, not emoji.** Emoji render inconsistently across platforms and do not respect colour theming. Simple path-based SVGs for: coffee cup, fork/knife, shopping bag, monitor/laptop, ticket, building.

---

### 6.9 The Reveal Moment

This is the most distinctive UX decision in the product. It separates the tool from a calculator.

**Duration:** 1.1 seconds total, then auto-advance to results.

**Implementation:**
```
Full-screen (100vw × 100vh equivalent) dark section
Background: var(--color-text-primary)
Display: flex, column, center, center
Gap: 24px

Elements:
  [Label] "Calculating your position..."
          12px, rgba(255,255,255,0.35), letter-spacing 2px
  
  [Pulsing dot]
          width/height: 12px, border-radius 50%
          background: #EF9F27 (amber on dark)
          Animation: pulse 1.2s ease-in-out infinite
            0%,100%: scale(1), opacity(1)
            50%:     scale(1.6), opacity(0.4)
  
  [Category label] — fades in at 0.6s
          16px serif, rgba(255,255,255,0.6)
          Text: the category kicker e.g. "Category 4 — act immediately"
```

**Why this exists:** The merchant has just answered four questions about their business. The result they are about to see has real financial consequences. A 1.1-second pause — during which the tool appears to be "thinking" — creates the psychological weight that makes the result feel earned rather than instantaneous. It is the difference between a calculator and a diagnosis.

Do not remove this moment. Do not shorten it below 0.8 seconds. Do not make it skippable.

---

### 6.10 Results Page

The results page is the product. Every element has been deliberately sequenced.

**Section 1 — Verdict**

```
[Verdict area] padding: 28px
  Top row: flex, space-between
    Left: [Category pill] — small pill badge
          12px, padding 4px 12px, border-radius 20px
          Cat 1: green bg + text, Cat 2: amber, Cat 3/4: red
    Right: [Confidence chip] — secondary bg, secondary text
          11px, "High confidence — exact rates" or "Estimated — RBA averages"
  
  [Category headline] 18-20px serif, weight 500, 1.3 line height
  
  [P&L swing — the hero number]
    [Big number] 44px var(--font-mono), weight 500, letter-spacing -1px
                 Green (var(--color-text-success)) if positive
                 Red (var(--color-text-danger)) if negative
    [Direction label] 13px secondary, aligned baseline
                      "annual saving" or "annual increase in payments cost"
  
  [Context line] 12px secondary
                 "across $Xm in annual card revenue"
  
  [Body paragraph] 13px, 1.65 line height, secondary colour
                   3-4 sentences plain English
```

**The P&L swing is the hero.** It is 44px. Everything else is secondary to it. The merchant's eye goes there first. Design for this.

**Section 2 — Metrics**

Three cells in a horizontal row divided by 0.5px borders. NOT cards — cells within one container.

```
[Today] — 10px label, letter-spacing 1px | 20px mono value
[Oct 2026] — same format
[Interchange saving] — same format, value in green
```

**Section 3 — Pass-through Slider (Categories 2 and 4 only)**

```
Container: var(--color-background-primary), 0.5px border, border-radius-lg, 16px padding

[Header row] flex, space-between
  Left:
    [Title] "If your PSP passes through..." 13px weight 500
    [Sub] "Drag to model different outcomes" 11px secondary
  Right:
    [Saving amount] 24px var(--font-mono), green (var(--color-text-success))
    Updates in real-time as slider moves

[Slider row] flex, gap 10px
  [Range input] flex: 1, accent-color #BA7517
  [Percentage] 12px mono, secondary, right-aligned, min-width 28px

[Note] 11px secondary, 1.55 line height, secondary bg, rounded
       "At 0%, your PSP keeps the full interchange saving. RBA data shows 
        90% of Australian merchants did not switch PSP last year."
```

**Real-time requirement:** Slider updates must fire at 60fps. All calculations are client-side — no API calls. The chart, the Oct 2026 metric, and the saving amount all update simultaneously on input.

**Section 4 — Before/After Chart**

```
Container: var(--color-background-primary), 0.5px border, border-radius-lg, 16px padding

[Heading] 12px weight 500

[Legend row] flex, wrap, gap 14px
  Each item: coloured square (8×8px, border-radius 2px) + 11px secondary text
  
  ■ Interchange (#E24B4A)
  ■ Scheme fees (#BA7517)  ← same amber as brand
  ■ Margin (#888780)
  ■ Surcharge offset (#3B6D11)

[Chart] position:relative, height:180px
  Stacked bar chart — "Today" and "October 2026"

THE CRITICAL DESIGN DECISION:
The amber scheme fees bar must be EXACTLY the same height in both the 
"Today" and "October 2026" columns. This communicates — without words — 
that scheme fees are unregulated and unchanged by the reform.
A merchant who sees this visually understands it better than any paragraph.
Do not let rounding, scaling, or chart library behaviour make these bars
different heights. This is a deliberate, intentional design choice.
```

**Section 5 — Assumptions Panel**

Collapsed by default. Toggle: `↓ How we calculated this` / `↑ How we calculated this`.

When expanded: a table of rows showing the card mix assumed, IC saving rates, scheme fees, and the source (RBA Conclusions Paper, March 2026).

This is for wizards and sceptics. Laymen ignore it. Make it easy to find but not prominent.

**Section 6 — Action List**

```
[Title] 16-17px serif, weight 500

Each action item:
  [Date chip] 10px var(--font-mono), letter-spacing 0.8px, amber #BA7517
              Min-width: 80px, padding-top 2px, line-height 1.4
              Values: "This week" / "By August" / "30 Oct 2026" / "30 Jan 2027" / "April 2027"
  
  [Action text] 13px, secondary colour, 1.65 line height
               <b> tags for emphasis, colour var(--color-text-primary)

Items divided by 0.5px border-bottom. Last item: no border.
```

**PSP name must appear inline.** "Call Stripe and say..." — not "call your PSP". This is enforced in the action list builder, not just in copy guidelines.

**Section 7 — Consulting CTA**

```
Container: var(--color-background-secondary), padding 28px, border-radius-lg

[Title] 18px serif, weight 500
[Body] 13px secondary, 1.6 line height, max-width 400px
[Button] amber filled: background #BA7517, text #FAEEDA, padding 12px 28px, 13px weight 500
[Byline] 11px secondary, margin-top 12px
         "Manu · Payments practitioner · Paid It"
```

**Section 8 — Email Capture**

Inline on the results page. Not a modal. Not a separate page.

```
[Prompt paragraph] 14px body
  "On 30 October, acquirers publish their average MSF publicly for 
   the first time. We'll tell you whether your rate is above or below 
   market for your size."

[Input + button] inline flex row
  [Email input] flex:1
  [Submit] "Get notified →"

[Privacy note] 11px secondary, below the input
  "One email on 30 October. Not shared with any payment provider."

[Phase 2 teaser] greyed out button
  "Download P&L model (.xlsx)" with "Coming in Phase 2" label
```

The privacy note wording is contractual. Do not change it. "One email on 30 October" is a specific promise. "Nothing else unless you ask" is the trust signal.


### 6.11 The Waterfall Chart (replaces stacked bar as primary visual)

The stacked bar chart shows what payments cost (composition). The waterfall chart shows
what changed and why (causation). For a merchant who needs to act, causation is what matters.

Use the waterfall as the primary chart. The stacked bar moves to the assumptions panel as a
secondary "cost breakdown" view for those who want to see component detail.

**Waterfall structure — four bars:**

```
[Today net cost]  [Surcharge lost]  [IC saving]  [October net cost]
     grey              red              green           red/green
```

Implementation using Chart.js floating bars (each bar is [y_low, y_high]):
```typescript
datasets: [{
  type: 'bar',
  data: [
    [0, netToday],            // Today: grey — starting position
    [netToday, annualMSF],    // Surcharge lost: red — costs go up
    [octNet, annualMSF],      // IC saving: green — costs come down
    [0, octNet]               // October: red/green — ending position
  ],
  backgroundColor: [
    '#888780',  // grey — neutral
    '#E24B4A',  // red — loss
    '#3B6D11',  // green — saving
    computed,   // red if worse than today, green if better
  ],
  borderRadius: 4,
  isAnimationActive: false,  // real-time slider updates need instant rendering
}]
```

Y-axis ticks format: `'$' + (v/1000).toFixed(0) + 'K'`

The waterfall updates in real time when the pass-through slider moves (Categories 2 and 4).

---

### 6.12 Reform Timeline

A horizontal timeline showing the merchant's position relative to all key reform dates.
Sits between the impact cards and the waterfall chart.

**Structure:**
```
[TODAY ◆]──[Aug 2026]──[1 Oct ⚠]──[30 Oct ✓]──[30 Jan ✓]──[1 Apr 2027]
```

- TODAY: amber dot with glow ring, amber label
- 1 October: red dot, red label — the critical date
- 30 October / 30 January: green dots — positive dates (data becomes available)
- Progress bar: amber line from left edge to TODAY position (~12% of total span)
- A "6 months" window label between TODAY and October emphasises urgency

The timeline is not interactive — it is purely informational. It exists to make urgency
visceral by showing how close October is relative to today.

---

### 6.13 The Escape Scenario Card (Categories 2 and 4 only)

The single most valuable addition to the results page. Shows the merchant what their
position would be if they switched from flat rate to cost-plus — removing all pass-through
uncertainty.

**Structure:** Two cards side by side.

Left card — "Your current plan (flat rate)":
- Shows October net cost at current pass-through setting
- Shows the range: "Range: $39,413–$42,000 depending on [PSP]"
- Badge: "Your current plan" (amber)

Right card — "Escape scenario (cost-plus)":
- Shows October net cost on cost-plus (IC saving flows automatically, 100%)
- "No pass-through risk" — this is the key selling point
- Shows the annual saving vs current plan
- Badge: "Escape scenario" (green)
- Featured border: 1.5px solid var(--color-border-success)

Below both cards: a note explaining that switching requires renegotiating the PSP
contract, and that the discovery call helps with this.

**The escape scenario card is the strongest converting element on the page.**
It shows merchants there IS a way out of the uncertainty. It naturally leads to
"book the discovery call to see if this is achievable."

---

### 6.14 Action List — Urgency Tiers

The action list has three tiers, each with a colour-coded pill:

**Tier 1 — Urgent (red pill "urgent"):**
Actions to take this week. Call the PSP. Calculate the repricing gap.

**Tier 2 — Plan (amber pill "plan"):**
Actions to complete before August. Get PSP commitment in writing. Update pricing systems.

**Tier 3 — Monitor (grey pill "monitor"):**
Date-triggered actions. Check October statement vs benchmark. Review January pass-through report.

Each tier is grouped under a label:
```
URGENT — DO THIS WEEK
PLAN — BEFORE AUGUST
MONITOR — AFTER OCTOBER
```

The urgency pills appear inline before the action text. They are small (10px, padding 1px 7px,
border-radius 20px) and use semantic background/text colour pairs from the CSS variables:
- urgent: background: var(--color-background-danger), color: var(--color-text-danger)
- plan: background: var(--color-background-warning), color: var(--color-text-warning)
- monitor: background: var(--color-background-secondary), color: var(--color-text-secondary)


---

## 7. Mobile Design

All breakpoints at 500px (not the conventional 768px — the mobile audience for this tool skews toward phone-first merchants).

| Element | Desktop | Mobile (<500px) |
|---|---|---|
| Plan type cards | 2 columns | 1 column stacked |
| Metric cards | 3 columns | 1 column stacked |
| Industry tiles | 3×2 grid | 2×3 grid |
| Network checkboxes | 2×2 grid | 1 column |
| Yes/No buttons | 2 columns | 2 columns (maintain side-by-side) |
| Hero headline | 32px | 24px |
| Features grid | 3 columns | 1 column |
| Assessment max-width | 520px centred | Full width 20px padding |
| Results max-width | 600px centred | Full width 20px padding |

**Minimum tap target:** 44×44px on all interactive elements.

**The slider on mobile:** Ensure the thumb is at least 44px. The slider row needs adequate vertical padding so the thumb is easily tappable.

---

## 8. Animation and Interaction

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Card selection (plan type, industry, yes/no) | 150ms | ease-out | Border weight change only |
| Expert panel expand | 250ms | ease-out | Height from 0, opacity from 0 |
| Reveal screen | 1.1s total | — | See section 6.9 |
| Results sections fade-up | 400ms per section | ease forwards | Staggered: 0s, 0.12s, 0.24s, 0.36s, 0.48s |
| Slider → chart update | 16ms (1 frame) | — | Must feel instant |
| Assumptions panel toggle | 200ms | ease | Simple opacity + height |
| PSP pill selection | 100ms | ease | Border + background |

**No slide transitions between assessment steps.** Sliding creates confusion about navigation direction. Use opacity only — the step counter communicates position.

**The pulsing dot animation (reveal screen):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.4; }
}
```
Duration: 1.2s, ease-in-out, infinite.

---

## 9. Icons

**Use SVG paths, not emoji.** Emoji render inconsistently across platforms, do not inherit colour, and break in dark mode.

**Icon size:** 20×20px for industry tiles, 16×16px for UI icons.

**Colour:** Industry tile icons use `var(--color-text-secondary)`. When tile is selected, icon colour changes to `#BA7517`.

**Industry icons required (SVG):**
- Café/Restaurant: coffee cup or mug
- Hospitality group: fork and knife or plate
- Retail: shopping bag or cart
- Online store: monitor/laptop
- Ticketing/Events: ticket stub
- Other: generic building or square

Create these as simple, clean path-based SVGs. No complex illustrations. Weight: equivalent to 1.5px stroke, no fill. The aesthetic is Feather Icons / Lucide style — thin, geometric, precise.

---

## 10. Copy Patterns

These patterns are fixed. Do not alter the wording for "editorial" reasons.

**The email capture promise:**
> "One email on 30 October. Not shared with any payment provider."

**The 90% PSP switching note (on slider):**
> "At 0%, your PSP keeps the full interchange saving. RBA data shows 90% of Australian merchants did not switch PSP last year."

**The confidence badge (expert mode):**
> "Calculated from your exact rates" (green)
> "Will use RBA averages" (amber)

**The CTA byline:**
> "Manu · Payments practitioner · Paid It"

**The site-wide disclaimer:**
> "nosurcharging.com.au provides general guidance only. Not financial advice. Verify with your PSP before making business decisions."

**The foreign card caveat in action list:**
> "The 1.0% cap applies to interchange only. Scheme fees add ~1.58% more, making the true cost floor approximately 2.58–2.83%. Do not plan for 1.0%."

---

## 11. What the Prototype Shows

A working HTML/CSS/JS prototype (v3) was built to validate these design decisions. It demonstrates:

- The full four-step assessment flow with both layman and expert paths
- The reveal moment with timing
- The results page with real calculations, live slider, Chart.js stacked bar
- The homepage with rotating category preview
- Mobile responsive layout
- All colour, typography, and spacing decisions

Use the prototype as the visual reference for any screen where this document is ambiguous. The prototype is the source of truth for visual outcomes. This document is the source of truth for design rationale.

---

*UX Design Specification v1.0 · nosurcharging.com.au · April 2026*
