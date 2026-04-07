# UX Specification — nosurcharging.com.au Revamp
## Final Design, April 2026

Read alongside `system.md` (design tokens) and `component-map.md`
(data dependencies). This document is the copy and layout source of truth.

---

## DESIGN SYSTEM REFERENCE

All tokens are defined in `docs/design/system.md`. Key values:

| Token | Tailwind name | Hex | Use |
|---|---|---|---|
| Canvas | `paper` | `#FAF7F2` | Page background (unchanged) |
| Surface | white | `#FFFFFE` | Card/document surfaces |
| Accent | `accent` | `#1A6B5A` | CTA, highlights, eyebrows |
| Accent light | `accent-light` | `#EBF6F3` | Badge backgrounds |
| Accent border | `accent-border` | `#72C4B0` | Badge borders |
| Ink primary | `ink` | `#1A1409` | Primary text (unchanged) |
| Ink secondary | `ink-secondary` | `#3D3320` | Supporting text |
| Ink muted | `ink-muted` | `#6B5E4A` | Tertiary text |
| Ink faint | `ink-faint` | `#9A8C78` | Labels, captions |
| Rule | `rule` | `#DDD5C8` | Borders |
| Negative | `red` | `#7F1D1D` | P&L negative |
| Positive | `green` | `#166534` | P&L positive |

Typography:
- Display/headings: Playfair Display (Google Font — already loaded)
- Body/UI: Source Serif 4 (Google Font — already loaded)
- Numbers/mono: SF Mono, Consolas (system)

---

## SECTION 1 — HOMEPAGE

### 1.1 — Navigation

```
Background: ink (#1A1409)
Height: 52px
Padding: 0 32px

Left: Logo
  - "nosurcharging.com.au"
  - Font: heading font (Playfair Display or Source Serif 4)
  - Colour: white
  - "surcharging" in accent-border (#72C4B0) italic

Right: Single CTA button
  - Text: "Generate my free report →"
  - Background: accent (#1A6B5A)
  - Text: white, 12px, 600 weight
  - Padding: 8px 18px
  - No border-radius (sharp corners)
  - Sticky on scroll
```

### 1.2 — Proof bar (replaces marquee)

```
Background: accent-light (#EBF6F3)
Border-bottom: 1px solid accent-border (#72C4B0)
Height: auto, ~38px
Layout: flex, centered, three items with separators

Items (left to right with · separators):
  ✓ Independent — no Stripe or Square affiliation
  ✓ Based on RBA Conclusions Paper, March 2026
  ✓ Plain English — every term explained

Item style:
  - Font: 11px, 500 weight, accent (#1A6B5A)
  - Checkmark: small SVG circle with tick
  - Separator: 1px vertical line, accent-border at 40% opacity
```

### 1.3 — Hero section

```
Background: paper (#FAF7F2)
Padding: 72px 32px 60px
Text-align: center
Border-bottom: 1px solid rule

Eyebrow badge:
  - Background: accent-light
  - Border: 1px solid accent-border
  - Text: "RBA SURCHARGE BAN · 1 OCTOBER 2026"
  - Font: 10px, 700, 1.8px tracking, accent colour
  - Includes: pulsing dot (accent colour, 5px circle, opacity animation)

Headline:
  - Font: Playfair Display, 54px, 400 weight, -2.5px tracking
  - Text: "Your payments report."  ← NEW LINE →  "Free. In five minutes."
  - "Your" in italic accent (#1A6B5A)  ← THE SIGNATURE ELEMENT
  - Rest: ink (#1A1409)
  - Max-width: 540px, centered

Subheadline:
  - Font: 17px, ink-secondary
  - Text: "The RBA is banning surcharges in October. Find out exactly
           what it costs your business — in dollars, with Stripe named directly."
  - Max-width: 400px, centered
  - Margin-bottom: 36px

Primary CTA:
  - Text: "Generate my free report →"
  - Background: accent (#1A6B5A), white text
  - Font: 15px, 700
  - Padding: 16px 36px
  - Outline: 3px solid accent, 2px offset (for visibility)
  - No border-radius

Proof row (below CTA):
  - Three items with green ticks (✓ in green)
  - "No account required"
  - "No Stripe or Square affiliation"  ← CHANGED (removes "PSP" jargon)
  - "Under five minutes"
  - Font: 12px, ink-faint
  - Margin-top: 14px
```

### 1.4 — Trust bar

```
Background: white (#FFFFFE)
Border-top: 1px solid rule (faint)
Border-bottom: 1px solid rule
Padding: 16px 32px
Layout: flex, three columns with vertical separators

Column 1 (quote):
  - Text: '"I ran the assessment on my lunch break and sent the
           report to my accountant that afternoon."'
  - Font: body font, 13px, italic, ink-secondary
  - Attribution: "— Café owner, Newtown NSW"
  - Attribution font: 11px, ink-faint

Separator: 1px solid rule at 40% opacity, 36px tall

Column 2:
  - Heading: "RBA Conclusions Paper"
  - Sub: "March 2026 · Verified data"
  - Font: 12px 500 / 11px ink-faint

Column 3:
  - Heading: "Free tool"
  - Sub: "No account · No sales funnel"
  - Font: 12px 500 / 11px ink-faint
```

### 1.5 — Situations preview (replaces category tabs)

```
Background: paper
Padding: 52px 32px
Border-bottom: 1px rule

Section label: "WHICH SITUATION ARE YOU IN?"
  - 10px, 700, 2.5px tracking, ink-faint, centered

Section heading: "Four types of merchant. Find yours."
  - Playfair Display, 26px, centered
  - Margin-bottom: 32px

Grid: 2×2, max-width 560px, centered
  - Gap: 1px (grid-gap creates separation via background colour)
  - Background of grid container: rule colour (creates 1px gap effect)

Each card:
  - Background: white
  - Padding: 20px
  - No border-radius

Card content:
  Situation number: "SITUATION [N]"
    9px, 700, 2px tracking, ink-faint
  Title:
    13px, 500, ink primary, line-height 1.45
  Description:
    12px, ink-muted, line-height 1.6, margin-bottom 12px
  P&L number:
    Monospace, 20px, 500, -0.5px tracking
    Positive: green (#166534)
    Negative: red (#7F1D1D)
    Uncertain: ink-muted
  Action hint:
    11px, accent (#1A6B5A)
    Border-left: 2px solid accent-border
    Padding-left: 8px
    Margin-top: 10px

Card data (illustrative examples — NOT from calculation engine):
  Situation 1 — "You don't surcharge — costs itemised"
    Description: "Your costs fall automatically in October. Best position."
    Number: +$1,725/yr
    Action: "Confirm the saving flows through automatically"

  Situation 2 — "You don't surcharge — one flat rate"
    Description: "Saving possible — depends on whether your rate is reviewed."
    Number: $0–+$1,725/yr
    Action: "Ask [PSP] whether your rate adjusts after October"
    [Note: Use "your payment provider" here since PSP unknown at this stage]

  Situation 3 — "You surcharge — costs itemised"
    Description: "Surcharge revenue disappears 1 October. Reprice now."
    Number: −$111,377/yr (illustrative — add note "example: $10M volume")
    Action: "Calculate your repricing gap before October"

  Situation 4 — "You surcharge — one flat rate"
    Description: "Two problems at once. Act on both this week."
    Number: −$34,836/yr (illustrative — add note "example: $3M volume")
    Action: "Act on both fronts before end of April"
```

### 1.6 — How it works

```
Background: paper
Padding: 52px 32px
Border-bottom: 1px rule

Label: "FOUR QUESTIONS. YOUR REPORT."
  - 10px, 700, 3px tracking, ink-faint, centered, margin-bottom 28px

Steps container: border 1px rule (strong), max-width 480px, centered

Each step: flex row, border-bottom 1px rule (faint)
  Left: step number
    - Width: 48px, padding: 16px
    - Border-right: 1px rule (faint)
    - Font: monospace, 11px, accent, 700, 0.5px tracking

  Right: question + hint
    - Padding: 16px 20px
    Question: Playfair Display, 16px, ink primary, margin-bottom 4px
    Hint: 12px, ink-faint, line-height 1.6

Step copy:
  01 "How much do you process in card payments?"
     "We calculate your actual dollar impact — not a percentage, a number."

  02 "Does your statement show one rate, or a breakdown?"
     "This determines whether the cost saving reaches you automatically
      or depends on a rate review."

  03 "Do you add a surcharge to card payments?"
     "The ban is the biggest variable. If you surcharge, you need
      to act before October."

  04 "What industry are you in?"
     "For average transaction size, which affects the calculation."
```

### 1.7 — Bottom CTA

```
Background: paper
Padding: 68px 32px
Text-align: center
Border-bottom: 1px rule

Eyebrow: "FREE · NO ACCOUNT · UNDER FIVE MINUTES"
  - 10px, 700, 3px tracking, ink-faint

Headline: "Get your report now."
  - Playfair Display, 42px, -2px tracking, ink

Sub: "Find out exactly what October costs your business."
  - 16px, ink-secondary, margin-bottom 32px

CTA: Same button as hero section
  "Generate my free report →"
```

### 1.8 — Footer

```
Padding: 16px 32px
Layout: flex, space-between
Background: paper

Left: "General guidance only. Not financial advice. Based on RBA
       Conclusions Paper, March 2026. Verify with your payment provider
       before making business decisions."
  - 11px, ink-faint, max-width 440px, line-height 1.6

Right: Privacy policy link
  - 11px, ink-faint, underline, text-underline-offset 2px

NOTE: Do NOT include the disclaimer banner that currently appears
at the top of the assessment page. It creates disclaimer duplication.
```

---

## SECTION 2 — DISCLAIMER PAGE

### 2.1 — Page structure

```
Background: paper
Content: max-width 420px, centered, padding 40px 24px

Tag: "BEFORE WE START"
  - 10px, 700, 2px tracking, accent

Headline: "A few things to know about this report"
  - Playfair Display, 26px, 400, -0.8px tracking, ink
  - Line-height: 1.25

Sub: "We want to be completely upfront about what this tool does
     — and doesn't do."
  - 14px, ink-secondary, line-height 1.65, margin-bottom 20px
```

### 2.2 — Four commitment items

```
Container:
  Background: white
  Border: 1px rule (strong)
  Margin-bottom: 16px

Each item:
  Display: flex
  Gap: 12px
  Padding: 14px 16px
  Border-bottom: 1px rule (faint)
  Last item: no border-bottom

  Icon:
    20px circle, background accent-light, text accent
    Content: "✓"
    Font: 10px, 700

  Text:
    13px, ink-secondary, line-height 1.65
    Strong: ink, 500 weight

Items in ORDER (note "We explain everything" is #2):

  1. "This is an estimate, not a guarantee."
     "We use your inputs and RBA data to calculate your likely impact.
      Your actual result depends on what your payment provider does after October."

  2. "We explain everything."
     "Every technical term in your report has a plain English explanation.
      You should be able to understand every number we show you."

  3. "We are independent."
     "No relationship with Stripe, Square, Tyro, or any payment provider.
      We're not trying to sell you a new provider."

  4. "This is not financial advice."
     "Talk to your accountant before making changes to your pricing
      or payment setup."
```

### 2.3 — Checkbox area

```
IMPORTANT: Background is WHITE (#FFFFFE), NOT accent-light.
Reserve accent colours for the checkbox tick only.

Container:
  Display: flex, gap 12px
  Padding: 14px
  Background: white
  Border: 1px rule (strong)
  Margin-bottom: 16px

Checkbox:
  width: 16px, height: 16px
  accent-color: accent (#1A6B5A)  ← tick is accent coloured
  flex-shrink: 0, margin-top: 2px

Text (12px, ink-secondary, line-height 1.6):
  "I understand this report provides estimates based on RBA data.
   It is not financial advice. I should verify figures with my
   payment provider before making business decisions. [Privacy policy link]"
```

### 2.4 — CTA button

```
IMPORTANT: Centred, natural content width (NOT full-width on desktop)

Button:
  Text: "Start my assessment →"
  Background: accent (#1A6B5A)
  Text: white, 14px, 700
  Padding: 14px 40px
  Display: inline-block (centred via text-align: center on parent)

On mobile (≤640px): full-width
On desktop (>640px): natural content width, centred
```

---

## SECTION 3 — RESULTS PAGE

### 3.1 — Section order

```
PRIMARY ZONE (always visible, no toggle needed):
  1.  VerdictSection (updated)
  2.  MetricCards
  3.  ProblemsBlock (NEW)
  4.  ActionList (moved UP from bottom)

DEPTH ZONE (behind toggle):
  5.  DepthToggle button
  6.  PassThroughSlider
  7.  EscapeScenarioCard
  8.  CostCompositionChart
  9.  AssumptionsPanel (collapsible)

ALWAYS VISIBLE (below depth zone):
  10. ConsultingCTA
  11. EmailCapture (unchanged)
  12. PSPRateRegistry (unchanged)
  13. ResultsDisclaimer (unchanged)
```

### 3.2 — VerdictSection

```
Padding-top: 32px
Border-bottom: 1px rule

Category pill:
  Text: "SITUATION [N]"  ← NO "of 4" suffix
  Font: 10px, 700, 1.5px tracking
  Situation 1: green bg / green text
  Situation 2: amber/warn bg / warn text
  Situation 3: red bg / red text
  Situation 4: red bg / red text
  No border-radius (sharp)

Confidence note: "Estimated · RBA averages"
  11px, ink-faint, margin-left 8px

Hero number:
  Font: monospace, 60px, 500, -4px tracking, line-height 1
  Colour: red (negative) or green (positive)
  Margin-bottom: 6px

Unit: "per year, from 1 October 2026"
  13px, ink-faint, margin-bottom 8px

Daily anchor (NEW):
  15px, ink-secondary, line-height 1.6
  "That's [strong]$X more per day[/strong] in net payments cost."
  Where X = Math.round(Math.abs(outputs.plSwing) / 365)
  [strong] colour: accent (#1A6B5A)
  Margin-bottom: 8px

Context line:
  11px, ink-faint
  "$[volume] annual card revenue · [PSP] flat rate [rate]% · surcharging [rate]%"
  (Adjust based on plan type and surcharging status)

Metric row:
  Display: flex, border 1px rule (strong)
  Three cells, divided by 1px rule (standard)
  Each cell: text-center, padding 12px 14px

  Cell labels: 9px, 700, 1.5px tracking, ink-faint, ALL CAPS
  Cell values: monospace, 15px, 500
    TODAY: ink
    OCT 2026: red
    IC SAVING: green
```

### 3.3 — ProblemsBlock

```
Padding: 24px 0
Border-bottom: 1px rule

Section eyebrow: "WHY THIS IS HAPPENING"
  9px, 700, 2.5px tracking, ink-faint, margin-bottom 16px

Problem 1 (CERTAIN):
  Background: red-background (#FDECEA)
  Border-left: 3px solid red (#7F1D1D)
  Padding: 14px 16px
  Margin-bottom: 8px

  Header row:
    Title: "Your surcharge revenue disappears" — 13px, 500, ink
    Badge: "CERTAIN" — red bg #7F1D1D, white text, 9px 700 1px tracking

  Body: 12px, ink-secondary, line-height 1.65
    "From 1 October, surcharges on Visa and Mastercard become illegal.
     The [surchargeRevenue formatted as $X,XXX/year] you currently
     recover disappears — regardless of your plan or provider."

Problem 2 (DEPENDS):
  Background: amber-background (#FEF3E0)
  Border-left: 3px solid amber (current amber value)
  Padding: 14px 16px

  Header row:
    Title: "A processing cost reduction may or may not flow through"
    Badge: "DEPENDS ON YOUR PLAN" — amber bg, white text

  Body: 12px, ink-secondary, line-height 1.65
    "The RBA is cutting wholesale card costs — worth up to
     [$icSaving/year] on your volume. On a flat rate plan like
     [PSP]'s default, this saving is bundled inside your overall rate.
     Whether it's reflected in your rate after October depends on whether
     [PSP] reviews your pricing as part of the reform. On an itemised
     plan, it flows through automatically."

     [For cost-plus merchants, show different Problem 2 — see UX spec addendum]
```

### 3.4 — ActionList

```
Padding: 24px 0
Section eyebrow: "WHAT TO DO, IN ORDER"

Each action card:
  Background: white
  Border: 1px rule (strong)
  Padding: 16px
  Margin-bottom: 8px
  No border-radius

  Header row:
    Tier chip: 9px, 700, 0.8px tracking, padding 3px 8px
      URGENT: red-background, red text
      PLAN:   accent-light, accent text
      WATCH:  rule background, ink-faint text
    Date: monospace, 10px, accent, 0.3px tracking

  What (instruction):
    13px, 500, ink, line-height 1.5, margin-bottom 8px

  Script (word-for-word):
    Background: paper (#FAF7F2)
    Border-left: 2px solid accent-border
    Padding: 10px 12px
    Font: 12px, ink-secondary, italic, line-height 1.7
    Margin-bottom: 8px

  Why (explanation):
    11px, ink-faint, line-height 1.65

--- ACTION COPY FOR SITUATION 4 (Stripe, flat rate, surcharging) ---

ACTION 1:
  Tier: URGENT | Date: BEFORE END OF APRIL
  What: "Ask [PSP] whether your rate will change after October"
  Script: "[PSP] is reducing wholesale interchange costs from 1 October.
           I'd like to understand whether my [PSP] flat rate will be
           adjusted to reflect that change — and by how much.
           Can you confirm in writing?"
  Why: "Flat rate adjustments aren't automatic. Written confirmation now
        means you'll know what to expect — and have time to act if needed."

ACTION 2:
  Tier: URGENT | Date: BEFORE END OF APRIL
  What: "Plan how you'll replace the $X in surcharge revenue"
  Script: "Raise prices by approximately [rate]% across all card transactions
           before 1 October — or identify $X in cost savings elsewhere.
           Both require planning time."
  Why: "The surcharge ban applies from 1 October regardless of your
       [PSP] plan. This part of your situation is certain."

ACTION 3:
  Tier: PLAN | Date: BEFORE 1 AUGUST 2026
  What: "Ask [PSP] for a quote on their itemised pricing plan"
  Script: "Request a quote on [PSP]'s interchange-plus pricing. At $[volume]
           annual volume, itemised pricing is typically available — and means
           future cost reductions flow through automatically."
  Why: "August gives you enough lead time to switch plans cleanly before
       October. After that, the timing risk is too high."

ACTION 4:
  Tier: WATCH | Date: 30 OCTOBER 2026
  What: "Check the published rate benchmarks on 30 October"
  Script: "From 30 October, [PSP] and other large processors must publish
           their average merchant service fees. Compare your rate directly
           against the published market average."
  Why: "For the first time, you'll have independent data to see whether
       your [PSP] rate is in line with the market."

--- COPY RULES FOR ALL ACTIONS ---
Replace [PSP] with outputs.inputs.psp
Replace [volume] with formatted volume
Replace [rate] with surcharge rate
Replace $X with calculated surcharge revenue

NEVER:
  "your PSP" → use the actual PSP name
  "your provider" → use the actual PSP name
  "Stripe keeps all of it" → "not reflected in your rate"
  "no negotiation needed" → "flows through automatically"
```

### 3.5 — DepthToggle

```
Display: flex, align-items center, gap 12px
Padding: 16px 0
Cursor: pointer
Border-top: 1px rule
Margin-top: 8px

Icon: 24px circle, accent-light bg, accent text "↓" (rotates to ↑ when open)
Text: "Understand your numbers" (13px, 500, accent)
Chevron: 11px, ink-faint (▼ → ▲ on open)

Collapsed: shows just the toggle button
Expanded: reveals sections 3.6–3.9 below
```

### 3.6 — PassThroughSlider

```
Padding: 20px 0
Border-bottom: 1px rule

Section eyebrow: "MODEL YOUR OUTCOME"

Intro: "The key variable is how much of the [icSaving formatted]
        processing cost reduction is reflected in your [PSP] rate after October."
  - 13px, ink-secondary, line-height 1.65, margin-bottom 16px
  - Replace [PSP] with outputs.inputs.psp

Slider labels:
  Left: "Not reflected in your rate (0%)"   [NOT "Stripe keeps all of it"]
  Right: "Fully reflected (100%)"
  - 11px, ink-faint

Slider: accent-color, full width

Result box:
  Background: accent-light
  Border: 1px solid accent-border
  Padding: 12px 14px

  Three rows:
    "Cost reduction in your [PSP] rate" → "+$X/yr" (green)
    "Your net annual impact"             → "−$X/yr" (red)
    "Net cost from October"              → "$X/yr"
```

### 3.7 — EscapeScenarioCard

```
Padding: 20px 0
Border-bottom: 1px rule

Section eyebrow: "IS THERE A BETTER OPTION?"

Intro: "[PSP] also offers an itemised plan where interchange and scheme
        fees are shown separately. When the RBA cuts wholesale costs, the
        reduction flows through automatically — it doesn't depend on a
        rate review."

Green box:
  Background: green-background (#E8F5EB)
  Border: 1px solid (green at 25%)
  Padding: 16px 18px

  Heading: "Switching to [PSP]'s itemised plan saves you:"
    12px, 700, green

  Number: "$X,XXX/year"
    Monospace, 24px, 500, green, -1px tracking

  Body: "Your net cost would be [cost] instead of [current cost] —
         the full saving flows automatically at 100%."
    12px, ink-secondary, line-height 1.7

  Note (italic): "Ask [PSP] for a quote on their interchange-plus pricing.
                  At $[volume] volume this is typically available on request."
    11px, ink-faint
```

### 3.8 — CostCompositionChart

```
Padding: 20px 0
Border-bottom: 1px rule

Section eyebrow: "WHAT MAKES UP YOUR [PSP] BILL"

Intro: "Only interchange changes in October. Scheme fees and [PSP]'s
        margin are unchanged by the reform."
  13px, ink-secondary, margin-bottom 14px

Legend (HTML, not in canvas):
  Four items in flex row:
    ■ Interchange (changes Oct)   — #7F1D1D (or current red)
    ■ Scheme fees (unchanged)     — #DDD5C8 (rule)
    ■ [PSP] margin (unchanged)    — #9A8C78 (ink-faint)
    ■ Other (flat rate bundle)    — #F3EDE4 (paper-secondary)
  [Hide "Other" for cost-plus plans]

  Item: 10px square swatch + 11px label, inline-flex, gap 6px

Chart:
  Recharts BarChart, layout="vertical"
  Height: 110px (2 bars × ~40px + spacing)
  Two bars: "Today" and "October"
  Four stacked segments per bar
  isAnimationActive={false} for performance

  X-axis: dollar values, formatted "$XK"
  Y-axis: bar labels

For flat rate: show "Estimated breakdown" pill above chart
  Background: ink-faint at 10%, text: ink-faint
  "Estimated breakdown"
  Font: 9px, 500

Insight note below chart:
  Background: amber-background (#FEF3E0)
  Border-left: 2px solid amber accent border (KEEP amber for warning notes)
  Padding: 10px 12px, font 12px, amber text

  For cost-plus: "Interchange is [X]% of your [PSP] bill.
                  The RBA reform only cuts interchange. Scheme fees and
                  [PSP]'s margin are unchanged."
  For flat rate: "This breakdown is estimated — your [PSP] flat rate
                  bundles all costs into one percentage. Interchange
                  makes up approximately [X]% of the total. Scheme fees
                  and [PSP]'s margin are not regulated by the reform."
  X = Math.round(todayInterchange / grossCOA * 100)
```

### 3.9 — AssumptionsPanel

```
Toggle label: "↓ Show me exactly how this is calculated"
  (Keep existing collapsible behaviour)

Each row format:
  Label: what this is
  Formula: the arithmetic (new — show this)
  Value: the result

Example row:
  "What you pay [PSP] today"
  "$3,000,000 × 1.4% flat rate"
  "$42,000"

  "Surcharge you currently recover"
  "$3,000,000 × 1.2% on Visa/Mastercard"
  "−$36,000"

Scheme fees note (inline):
  After the scheme fees row, add:
  "Visa and Mastercard charge a separate network fee (~$X/year on your
   volume). Not regulated by the RBA reform. Already included in your
   [PSP] flat rate today."
  Font: 11px, ink-faint, italic
```

### 3.10 — ConsultingCTA

```
Background: ink (#1A1409)
Padding: 24px
Display: flex, align-items flex-start, space-between, gap 16px

Left:
  Headline (Playfair Display, 17px, white):
    "Walk into October knowing exactly what to say to [PSP], what
     to charge customers, and whether your rate is fair."
  Sub (12px, white/32%):
    "Reform Ready · one engagement · fixed price · April–September 2026"

Right:
  Button: "Book discovery call →"
    Background: accent (#1A6B5A)
    White text, 12px, 600, padding 11px 18px

  Price note: "$3,500 · Reform Ready"
    10px, white/18%, centered, margin-top 5px

On mobile: stacks vertically, button full-width
```

### 3.11 — Skeleton loading state

```
Appears while results are fetching (replaces "Loading results...")

Sections reflected in skeleton:
  - Category pill placeholder (small rect)
  - Hero number placeholder (60px tall rect, 200px wide)
  - Unit text placeholder (small rect)
  - Anchor text placeholder (medium rect)
  - Metric row placeholder (full-width rect, 52px tall, 3 internal dividers)
  - Two problem block placeholders (88px and 112px tall)
  - Three action card placeholders (96px each)

Animation: opacity pulses 0.35 → 0.65, 1.5s ease-in-out infinite
Background: ink at 10% opacity (#1A1409 at 0.1)
No border-radius on block skeletons (matches sharp card aesthetic)
```

---

## SECTION 4 — COPY RULES (apply to all pages)

### Language never to use
```
"your PSP"           → [merchant's actual PSP name from outputs.inputs.psp]
"your provider"      → [merchant's actual PSP name]
"P&L swing"          → "net annual impact" or "net payments cost"
"Category 1/2/3/4"   → "Situation 1/2/3/4" (homepage only; results page OK)
"cost-plus"/"IC++"   → "itemised plan" on first use, then clarify
"pass-through"       → "flows through to you" or "reflected in your rate"
"interchange"        → explain on first use: "the wholesale card cost"
"scheme fees"        → explain on first use: "Visa and Mastercard's network fees"
"PSP"                → avoid; use provider name or "payment provider"
"no negotiation"     → "flows through automatically"
"Stripe keeps all"   → "not reflected in your rate"
```

### Always use PSP name from user input
Every result page component that shows the PSP name must use:
`outputs.inputs.psp` — never hardcode "Stripe"

The merchant may be using Square, Tyro, CommBank, Westpac, Zeller,
or any other provider. Using the wrong name destroys trust.

### Numbers always in monospace
Any dollar amount, percentage, or calculated number must use
the monospace font (SF Mono, Consolas — system stack).

### The daily anchor pattern
Annual figures are abstract. Daily figures are felt.
Wherever a large annual number appears, follow with the daily equivalent:
"That's $[X] more per day in net payments cost."
Format: `$${Math.round(Math.abs(annual) / 365)}`

---

## SECTION 5 — MOBILE REQUIREMENTS

All components must work at 375px (iPhone SE / 14 mini).

### Specific breakpoints required

| Component | Mobile (default) | Desktop (sm: or md:) |
|---|---|---|
| Hero headline | 40px | 54px |
| Hero number (results) | 48px | 60px |
| Proof bar | Wrap to 2 rows | Single row |
| Trust bar | Stack vertically | 3-column flex |
| Situations grid | 2 columns (stays 2) | 2 columns |
| Action cards | Full width | Full width |
| ConsultingCTA | Stack vertically | Side by side |
| Disclaimer button | Full width | Centred, natural width |
| Nav CTA | Keep (reduce padding if needed) | Normal |

### Minimum touch target
All interactive elements: 44px × 44px minimum touch target.
This applies to: CTA buttons, checkbox, depth toggle, calc toggle.

---

## END OF UX SPECIFICATION

For data dependency details, see: `docs/design/component-map.md`
For design tokens, see: `docs/design/system.md`
For the Claude Code prompt, see: `docs/design/PROMPT.md`
