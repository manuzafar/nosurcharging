# ASSESSMENT_STEP1_REDESIGN_BRIEF.md
## nosurcharging.com.au — Assessment Step 1 (volume) layout + input pattern refresh
## Authority: This document governs the redesign of the first assessment step only.
## Scope: `apps/web/components/assessment/Step1Volume.tsx` and the wrapping assessment shell.
## Produced: May 2026

---

## TO CLAUDE CODE — MANDATORY READING PROTOCOL

Before writing a single line of code:

1. Read this entire document.
2. Read `apps/web/app/assessment/page.tsx` — the assessment shell / orchestrator.
3. Read `apps/web/components/assessment/Step1Volume.tsx` — the current Step 1 implementation.
4. Read `apps/web/components/assessment/Step2PlanType.tsx` — for the existing PSP pill chip pattern that we'll reuse.
5. Read `apps/web/components/results/PassThroughSlider.tsx` — for the existing slider styling that we'll reuse.
6. Read `apps/web/tailwind.config.ts` and `apps/web/app/globals.css` — the design tokens.
7. Read `apps/web/components/ui/AccentButton.tsx` (or wherever the existing emerald Next button lives) — must be preserved unchanged.

---

## PUSHBACK PROTOCOL — MANDATORY

You are expected to challenge this brief where it conflicts with the codebase. Use this format BEFORE implementing anything:

```
⚠️ PUSHBACK [ITEM-ID]:
Brief says: [what this doc says]
Code says:  [what the code actually does]
Risk:       [what would break if brief is followed blindly]
Proposal:   [your recommended resolution]
Status: AWAITING CONFIRMATION
```

**Required pushback triggers:**
- Any change to button styling (Back, Next, AccentButton). These components are LOCKED — visual treatment must match the existing site exactly.
- Any change to the Annual / Monthly toggle styling (emerald-light bg + emerald border + emerald text on active, white bg + neutral border + secondary text on inactive). This pattern is LOCKED.
- Any change to chip styling (must match the existing PSP pill pattern in Step2PlanType: white bg + neutral border default, emerald-light bg + emerald border + emerald-dark text on active). LOCKED.
- Any change to slider styling (must match PassThroughSlider on results page). LOCKED.
- Any change to the existing dark top nav band on the assessment route. LOCKED.
- Any change to the progress bar styling (4 segments, emerald-filled when done, neutral when upcoming) + 01/04 counter pattern. LOCKED.
- Any change to typography sizes that drift from the existing scale (DM Sans for body, DM Serif Display for headlines, JetBrains Mono for numbers). Sizes adjust within the existing scale only.
- Any addition of new components, icons, or visual elements not specified in this brief. This is a restructure, not an embellishment.

**Do not push back on:**
- Vertical centering implementation details (CSS approach is your call).
- Padding / margin values within reason.
- The exact width of the inner content column (500-580px is the target range).

---

## WHY WE'RE DOING THIS

User testing surfaced two issues with the current Step 1:

1. **Layout is top-anchored** — content sits ~50px below the dark nav with 500+px of dead space below it. On mobile, this reads as "content stuck to the header." The merchant doesn't feel "this is the screen I'm on" — they feel they're looking at a fragment.

2. **Input pattern feels dated** — a small typed text field with $ prefix doesn't match the prominence the page deserves. Modern assessment flows treat the value entry as a hero moment, not a form field.

The fix has two parts:
- **Structural**: vertically center the entire step content in the viewport.
- **Input pattern**: replace the typed text field with a big mono value display + slider + quick-pick chips combo, all updating the same hero number.

Everything else stays exactly as-is: buttons, toggle, chip styling, slider styling, dark top nav, progress bar, typography vocabulary, copy.

This is a layout + input change only. No new design tokens. No new components. No new icons.

---

## WHAT STAYS IDENTICAL (CRITICAL — DO NOT MODIFY)

### Button vocabulary
- **Back button**: plain ghost text, no border, no arrow. Color `var(--color-text-secondary)` or the existing token. Padding ~12px 4px. Unchanged.
- **Next button**: emerald pill (existing AccentButton). Background `#1A6B5A` (or your existing accent token), white text, no arrow icon, 999px border-radius. Padding ~14px 36px. Unchanged.

### Annual / Monthly toggle
Two outlined buttons side by side with 10px gap.
- **Inactive**: `background: var(--color-background-primary)` (white), `border: 1px solid var(--color-border-tertiary)`, `color: var(--color-text-secondary)`, weight 500.
- **Active**: `background: #EBF6F3` (emerald-light), `border: 1px solid #1A6B5A` (emerald), `color: #1A6B5A` (emerald-dark).
- Padding `11px 22px`, border-radius `10px`. Sans-serif, 14px.

### Chip styling (reuse the existing PSP pill from Step 2)
- **Inactive**: white bg, 1px neutral border, secondary text color.
- **Active**: `background: #EBF6F3`, `border-color: #1A6B5A`, `color: #1A6B5A`.
- Padding `9px 16px`, border-radius `10px`. JetBrains Mono, 13px.

### Slider (reuse PassThroughSlider styling)
- Track: 5px height, `#E5E1D6` (warm beige, not pure grey).
- Fill: emerald `#1A6B5A` from left to current value.
- Thumb: 20px circle, emerald background, 3px paper-coloured ring for visibility.
- Min/max labels below: JetBrains Mono, 12px, color tertiary.

### Top nav
The existing dark band stays exactly as-is. Brand "no*surcharging*.com.au" on the left, no other content on the assessment route.

### Progress bar
4 horizontal segments, 2px height, 4px gap. Emerald `#1A6B5A` fill when done, `#E5E1D6` background when upcoming. "01 / 04" counter to the right, JetBrains Mono, 13px, color secondary, letter-spacing 0.06em.

### Typography
- Question: DM Serif Display, 32px, weight 500, color primary, letter-spacing `-0.01em`, line-height 1.18.
- Eyebrow ("Step 1"): DM Sans, 13px, weight 500, color emerald `#1A6B5A`.
- Helper text: DM Sans, 15px, color secondary, line-height 1.55.
- Big mono value display: JetBrains Mono, 64px desktop / 44px mobile, weight 500, color primary, letter-spacing `-0.03em`, line-height 1.
- Value subline ("per year · approx $X/month"): JetBrains Mono, 13px, color secondary, letter-spacing 0.04em.

---

## WHAT CHANGES

### 1. Vertical centering (the structural fix)

The current Step 1 anchors content to the top of the viewport. Replace with:

```css
/* Assessment shell or Step1Volume container */
min-height: calc(100dvh - <nav-height>)  /* 100dvh handles mobile keyboard properly */
display: flex
flex-direction: column
align-items: stretch
justify-content: center
padding: 48px 28px (desktop), 28px 22px (mobile)
```

Inner content column:
```css
max-width: 560px
margin: 0 auto
width: 100%
```

Result: content sits in the visual middle of the viewport on all screen sizes, with the dark nav at the top of the viewport (sticky behavior is fine if not currently — but not required).

### 2. Replace the typed-text input with a big mono value display

Currently: `<input type="text">` with $ prefix.

Replace with: a centered display of the current value in JetBrains Mono at 64px (desktop) / 44px (mobile), with a subline below showing the toggle-equivalent value.

```
[$2,000,000]                              /* 64px mono, primary text */
[per year · approx $166,667 per month]    /* 13px mono, secondary text */
```

The displayed mono value is **click-to-edit** — when the merchant clicks the number, it becomes a typed input (using the existing input field component, just inline). On blur, it reverts to the display state with the new value. This preserves the keyboard-typing path for power users while making the visual presentation prominent.

### 3. Add a slider beneath the value display

Below the mono value, full-width within the inner column:

- Track: 5px height, `#E5E1D6` background, `border-radius: 3px`.
- Fill: emerald from left to current value (percentage based on min/max).
- Thumb: 20px emerald circle with 3px paper-coloured ring.
- Min label "$100K" on the left, max label "$25M" on the right, both JetBrains Mono 12px secondary text.

Slider range: $100,000 to $25,000,000. Step: $50,000 for fine adjustment.

The slider, the chips, and the typed input all update the same `volume` state variable in real time. Moving the slider updates the mono value display and the active chip (if value matches a chip exactly).

### 4. Add quick-pick chips beneath the slider

6 chip values, flex-wrap horizontal, centered:

`$500K · $1M · $2M · $5M · $10M · $20M`

Use the existing PSP pill chip vocabulary (per Step 2). Clicking a chip sets the value to that exact figure and updates slider position + mono display.

Active state: the chip whose value matches the current `volume` exactly. If the slider/typed input produces a value that doesn't match any chip exactly, no chip is highlighted (and that's correct behavior — chips are presets, not categories).

### 5. Reorder the section composition

The vertically-centered content sequence, top to bottom within the inner column:

1. **Progress bar row** (4 segments + "01 / 04" counter)
2. **"Step 1" eyebrow** (13px emerald)
3. **Question** (32px serif)
4. **Helper text** (15px sans, secondary)
5. **Annual / Monthly toggle**
6. **Big mono value display + subline**
7. **Slider with min/max labels**
8. **Quick-pick chips row**
9. **Actions row**: Back ghost text on the left, Next emerald pill on the right (justify-between)

Vertical gaps between sections: 36px below progress row, 14px between question and helper, 28px below helper before toggle, 28px below toggle before value, 22px between value and slider, 22px between slider and chips, 44px above actions row.

---

## MOBILE TREATMENT

Same content sequence, single column. Differences from desktop:

- Inner column padding: 28px 22px (was 48px 28px).
- Question: 24px serif (was 32px).
- Big mono value: 44px (was 64px).
- Toggle, slider, chips remain identical in size — already touch-friendly.
- Chips wrap to a 3-column grid at narrow widths if flex-wrap can't fit them in 2 rows naturally.
- Actions row stacks vertically: Next emerald pill full-width on top, Back ghost text below. (NOT the desktop horizontal layout.)

Use `100dvh` instead of `100vh` for the centering height — handles mobile keyboard properly when the user types into the inline-edit value.

---

## VALUE → CHIP ALIGNMENT LOGIC

When the merchant moves the slider or types a value:
- If the value matches a chip's value exactly, that chip becomes active.
- If the value falls between two chips, no chip is active.
- When the merchant clicks a chip, the slider position and mono value both snap to that chip's value.

The chip values represent natural "sticky points" merchants gravitate toward ($500K, $1M, $2M, $5M, $10M, $20M). Fine-grain values come from the slider or typed input.

---

## ANNUAL ↔ MONTHLY TOGGLE BEHAVIOR

The toggle changes the *display unit*, not the underlying stored value. Internally, always store an annual value. When the merchant is on "Monthly":
- Mono value display shows the monthly equivalent (annual ÷ 12, rounded to nearest hundred).
- Subline reverses: "per month · approx $2,000,000 per year".
- Chip values reformat to monthly equivalents OR stay as annual values — your call (preferred: chips stay annual for consistency, but with a small "annual" mono prefix when on monthly toggle).

When the merchant moves the slider on Monthly, the underlying annual value updates (slider × 12 = stored annual). This keeps the calculation engine receiving a consistent annual volume.

---

## NOT IN SCOPE

- No new components beyond the value display + slider + chips composition.
- No new icons (Tabler or otherwise).
- No animations beyond the existing 200ms ease step transitions.
- No changes to Steps 2, 3, 4 — those will get their own briefs.
- No changes to the calculation engine, the EmailGate, or any downstream component.
- No changes to copy beyond what's specified — the existing question, helper text, and step eyebrow stay as-is.
- No changes to the dark top nav.

---

## BUILD SEQUENCE (single milestone)

```
feat(assessment/step1): vertical centering + big mono value + slider + chips input

- Restructure Step1Volume container to vertically center within viewport
  (min-height: 100dvh, flex centering, max-width 560px inner column)
- Replace typed text field with big mono value display + click-to-edit input
- Add slider below value display (reuse PassThroughSlider styling)
- Add quick-pick chips below slider (reuse Step2 PSP pill chip styling)
- All three input methods update the same volume state in real time
- Preserve all existing buttons, toggle, progress bar, top nav, typography
- Mobile: stack actions vertically, scale mono value to 44px
- 100dvh handles mobile keyboard properly
```

Self-audit before committing:
- All existing assessment tests pass (`pnpm test:unit`).
- Cat 1, 2, 3, 4, 5 assessment flows complete end-to-end.
- TypeScript clean (`tsc --noEmit`).
- Volume input: typing into the inline edit, dragging the slider, and clicking a chip all update the same value.
- Annual / Monthly toggle changes the displayed unit but stores annual internally.
- Mobile (375px viewport): content vertically centered, no horizontal scroll, all inputs tappable.
- Desktop (1280px): content vertically centered, breathing room above and below.
- No visual change to the Back button, Next button, toggle styling, chip styling, slider styling, top nav, or progress bar from their current state on Step 2 onward.

---

## REFERENCE FILES

```
Component to modify:    apps/web/components/assessment/Step1Volume.tsx
Wrapping shell:         apps/web/app/assessment/page.tsx
Existing chip pattern:  apps/web/components/assessment/Step2PlanType.tsx (PSP pills)
Existing slider:        apps/web/components/results/PassThroughSlider.tsx
Existing button:        apps/web/components/ui/AccentButton.tsx (or equivalent)
Design tokens:          apps/web/tailwind.config.ts, apps/web/app/globals.css
Tone of voice:          docs/content/tone-of-voice.md
UX rationale:           docs/design/ux-design.md
```

---

## SUCCESS CRITERIA

The shipped Step 1 should:

1. Feel like the merchant is on a *page* (vertically centered, deliberate composition), not a *form fragment* (top-anchored, empty space below).
2. Make the volume entry feel like a *hero moment* (big mono value, three input methods) rather than a *small form field*.
3. Look visually consistent with every other page on nosurcharging.com.au — same toggle, same chips, same slider, same buttons, same typography, same top nav.
4. Work as well on mobile as on desktop — the vertical centering pattern translates without compromise.

If a user familiar with the current site cannot identify a single button or chip or toggle as "different from before," the brief was implemented correctly.

---

*Brief produced May 2026. Authoritative for the Step 1 assessment redesign.*
*Strict adherence to existing design system — buttons, colors, chips, toggle, slider all preserved.*
*The change is in layout and input pattern only.*
