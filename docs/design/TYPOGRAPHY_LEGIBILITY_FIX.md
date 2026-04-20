# TYPOGRAPHY_LEGIBILITY_FIX.md
## nosurcharging.com.au — Typography & Colour Legibility
## Results page: font size and colour hierarchy fixes
## Source: Live audit of staging + user testing feedback
## Produced: April 2026

---

## MANDATORY READING — BEFORE TOUCHING ANY FILE

Read this entire document. Then read these files before writing code:

- `apps/web/app/globals.css` — the colour token system
- `apps/web/tailwind.config.ts` — the font size scale
- `apps/web/components/results/shell/ResultsSidebar.tsx` — sidebar labels and nav items
- `apps/web/components/results/MetricCards.tsx` — metric card values (broken)
- `apps/web/components/results/ActionList.tsx` — script text styling
- `apps/web/components/results/VerdictSection.tsx` — hero P&L and body paragraph
- `apps/web/components/results/sections/RefineSection.tsx` — hint text

Do not write a single line of code until you have read every file listed above.

---

## WHY THIS FIX IS NEEDED

User testing has flagged two related issues across the results page:

1. **Font sizes too small** — several elements render at 9px, 12px, or 13px in contexts where the content is essential to merchant understanding
2. **Text colours too grey** — body copy, instructional text, and script content are rendering in a grey (#6b7280) that feels washed out and hard to read, especially on mobile and non-retina screens

Both issues were confirmed via a live JavaScript audit of the staging page. The exact measurements are in the audit table below. This is not a perception issue — the numbers fail or marginally pass WCAG 2.1 AA.

---

## LIVE AUDIT — EXACT MEASUREMENTS

The following table shows what was measured on the live staging page via `getComputedStyle()`.

| Element | Actual size | Actual weight | Actual colour | Status |
|---|---|---|---|---|
| Sidebar group label (RESULT / UNDERSTAND / NEXT STEP) | **9px** | 400 | #6b7280 | ❌ FAILS — 9px is not readable at any contrast |
| Sidebar badge ("2" on Actions) | **9px** | 500 | #791F1F | ❌ FAILS — 9px below any acceptable minimum |
| Top bar P&L number (−$2,129) | **14px** | 400 | #7F1D1D | ⚠️ Too small and too light for primary anchor number |
| Top bar "Result looks off?" link | **12px** | 400 | #6b7280 | ⚠️ Borderline — 4.6:1 at 12px |
| Overview body paragraph | **13px** | 400 | #6b7280 | ⚠️ Technically passes 4.6:1 but grey and small |
| Metric card values | **13px** | 500 | varies | ❌ WRONG — should be 22px (`text-financial-standard`) |
| Actions task text | **14px** | 500 | #111 | ✅ CORRECT — do not change |
| Actions script text (blockquote) | **13px** | 400 | #6b7280 on #f9fafb | ❌ Grey-on-grey-white for the most actionable copy |
| Refine section hint text | **12px** | 400 | #6b7280 | ⚠️ Too small for instructional content |
| Hero P&L range | **32px** | 400 | #7F1D1D | ⚠️ Size OK, weight 400 too light for the key number |

**CSS token audit:**
```
--color-text-primary:   #111111  ✅ correct
--color-text-secondary: #6b7280  ⚠️ used for too many things
--color-text-tertiary:  #6b7280  ❌ SAME as secondary — no hierarchy at all
```

The root cause: `--color-text-secondary` and `--color-text-tertiary` are identical. There is no gradient of emphasis between "secondary" and "tertiary" — everything not primary is the same grey, which collapses the visual hierarchy.

---

## WCAG REFERENCE

- Normal text (under 18pt / 24px): minimum **4.5:1** contrast ratio
- Large text (18pt+ / 24px+ regular, or 14pt+/~19px+ bold): minimum **3:1**
- 9px text: **fails unconditionally** — no contrast ratio makes 9px readable for general audiences
- #6b7280 on white (#FFFFFF): **4.6:1** — barely passes AA for 14px+ only

The fix below brings every element to a comfortable margin above these minimums, not just the minimum itself.

---

## THE FIX — THREE PARTS IN ORDER

### PART 1 — Fix the colour token system in `globals.css`

This is the highest-impact change. One edit here fixes the grey-on-grey problem across every component without touching any component file.

**Locate the `:root` block in `globals.css` that defines the colour tokens.**

Make this change:

```css
/* BEFORE */
--color-text-secondary: #6B7280;
--color-text-tertiary:  #6B7280;

/* AFTER */
--color-text-secondary: #374151;   /* darkened — body copy, nav items, script text */
--color-text-tertiary:  #6B7280;   /* unchanged — captions, hints, meta labels only */
```

**Why #374151:**
- It is Tailwind's `gray-700`
- Contrast ratio against white: **10.7:1** — well above WCAG AAA (7:1)
- It is noticeably darker than #6b7280 without being black
- This differentiation creates the three-stop hierarchy the design system needs:
  - Primary (#111): headlines, primary numbers
  - Secondary (#374151): body copy, instructional text, nav items
  - Tertiary (#6b7280): captions, hints, timestamps, meta — used sparingly and only at 12px+

**Do not change `--color-text-primary`.** #111 is correct.

**Do not change `--color-text-tertiary` value.** It stays at #6b7280 but is now semantically distinct from secondary — it should only be applied to subordinate elements at 12px or larger.

**After this change, re-read the page.** Most of the grey body text will immediately become more readable without any component changes. Then proceed to Part 2.

---

### PART 2 — Fix specific element font sizes and weights

These are targeted component-level changes. Make each one independently and verify before moving to the next.

---

#### 2a. Sidebar group labels — `ResultsSidebar.tsx` (or equivalent shell component)

**Current:** 9px weight 400 — rendered via `text-micro` or similar small class
**Problem:** 9px is not readable. The RESULT / UNDERSTAND / NEXT STEP labels are navigation infrastructure — they need to be legible.

**Fix:**
```tsx
// Replace whatever class produces 9px on these labels with text-label
// text-label = 11px, weight 500, letter-spacing 2px per tailwind.config.ts

<p className="text-label font-medium uppercase tracking-widest px-4 pt-3 pb-1"
   style={{ color: 'var(--color-text-tertiary)' }}>
  RESULT
</p>
```

`text-label` is 11px — the absolute minimum for ALL-CAPS spaced tracking labels. 11px ALL-CAPS at weight 500 reads larger than 11px mixed-case at weight 400. This is within WCAG tolerance for decorative section labels.

---

#### 2b. Sidebar nav item badges — `ResultsSidebar.tsx`

**Current:** 9px weight 500 (the "2" badge on Actions)
**Fix:** Minimum 11px. Use `text-xs` (12px in Tailwind default) or `text-label` (11px custom).

```tsx
// BEFORE: whatever is producing 9px
// AFTER:
<span className="text-xs font-semibold rounded-pill px-2 py-0.5"
      style={{ background: 'var(--color-background-danger)', color: 'var(--color-text-danger)' }}>
  {urgentCount}
</span>
```

---

#### 2c. Top bar P&L number — `ResultsTopBar.tsx`

**Current:** 14px weight 400
**Spec:** 18px weight 500 monospace (the always-visible primary anchor)

```tsx
// BEFORE: whatever class produces 14px weight 400
// AFTER:
<span
  className="font-mono font-medium shrink-0"
  style={{ fontSize: '18px', letterSpacing: '-0.5px' }}
>
  {formattedPnl}
</span>
```

---

#### 2d. Top bar "Result looks off?" link — `ResultsTopBar.tsx`

**Current:** 12px weight 400 #6b7280
**Fix:** After the Part 1 colour token fix, this will automatically become #374151 if it uses `--color-text-secondary`. Verify it does. If it uses a hardcoded grey or `text-ink-faint`, update to use `var(--color-text-tertiary)` which keeps it subordinate but at a legible shade. Size stays at 12px — this is appropriately small for a utility link.

---

#### 2e. Overview verdict body paragraph — `VerdictSection.tsx`

**Current:** 13px (`text-body-sm`) — the primary explanation paragraph explaining the merchant's situation
**Fix:** Bump to `text-body` (14px). This is the most-read paragraph on the page.

```tsx
// BEFORE
<p className="mt-4 text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>

// AFTER
<p className="mt-4 text-body" style={{ color: 'var(--color-text-secondary)' }}>
```

After the Part 1 fix, `--color-text-secondary` will be #374151 — dark, readable, correct.

---

#### 2f. Actions script text (blockquote) — `ActionList.tsx`

**Current:** 13px weight 400, #6b7280 on `var(--color-background-secondary)` (#f9fafb)
**Problem:** The script is the verbatim words a merchant reads aloud to their PSP. It is the most actionable content in the tool. Grey-on-grey-white at 13px weight 400 buries the most important copy.

After the Part 1 colour fix, `--color-text-secondary` becomes #374151. Verify the blockquote uses `--color-text-secondary` not a hardcoded grey. If it uses a hardcoded value, update it:

```tsx
<blockquote
  style={{
    background: 'var(--color-background-secondary)',
    borderLeft: '2px solid #72C4B0',
    padding: '10px 12px',
    fontSize: '13px',         // size stays 13px
    fontStyle: 'italic',
    lineHeight: 1.7,
    color: 'var(--color-text-secondary)',  // will be #374151 after Part 1
    margin: 0,
    borderRadius: '8px',
  }}
>
```

Do not increase the font size of the script — 13px italic with good contrast is correct for quoted/verbatim content. The colour fix is sufficient.

---

#### 2g. Refine section hint text — `RefineSection.tsx`

**Current:** 12px weight 400 #6b7280
**Problem:** Hints tell merchants where to find their data (e.g. "Find in PSP dashboard → Reports"). Instructional text should not sit at the minimum of legibility.

```tsx
// BEFORE: text-caption (12px) or text-xs
// AFTER: text-body-sm (13px) — one step up

<p className="text-body-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
  Find in PSP dashboard → Reports
</p>
```

13px at `--color-text-tertiary` (#6b7280) = 4.6:1 contrast — acceptable for hint text at this size. 12px at the same colour is borderline and user testing confirmed it fails for real merchants.

---

#### 2h. Metric card values — `MetricCards.tsx`

**Current:** Rendering at 13px — `text-financial-standard` (22px) is not being applied
**This is a class application error, not a design system error.**

Locate the MetricCards component and find the value element. Verify it has `text-financial-standard` and `font-mono`. If the class is missing or being overridden by an inline style, fix the class application.

Correct structure for each metric card:

```tsx
<div className="bg-paper-secondary rounded-xl p-4 border" style={{ borderColor: 'var(--color-border-tertiary)' }}>
  {/* Label — small, uppercase, muted */}
  <p className="text-micro font-medium uppercase tracking-widest mb-2"
     style={{ color: 'var(--color-text-tertiary)' }}>
    INTERCHANGE SAVING
  </p>

  {/* Value — 22px monospace, the number — THIS IS THE BROKEN ELEMENT */}
  <p className="font-mono text-financial-standard font-medium"
     style={{ color: 'var(--color-text-success)' }}>
    +$127
  </p>

  {/* Sub label — smallest, most muted */}
  <p className="text-caption mt-1"
     style={{ color: 'var(--color-text-tertiary)' }}>
    debit + credit
  </p>
</div>
```

`text-financial-standard` = 22px per `tailwind.config.ts`. If the card is currently showing 13px, it means this class is absent or the element is a different tag than expected. Find the element, fix the class.

---

#### 2i. Hero P&L number weight — `VerdictSection.tsx`

**Current:** 32px weight 400
**Fix:** 32px weight 500. The hero number is the dominant anchor of the page. Weight 400 in monospace feels thin and uncertain. Weight 500 is confident.

```tsx
// BEFORE: font-mono (weight 400 by default)
// AFTER: font-mono font-medium (weight 500)
<p className="font-mono font-medium mt-3" style={{ fontSize: '32px', letterSpacing: '-2px' }}>
```

Do not change the size. 32px for a range (−$2,129 to −$2,002) is appropriate — two numbers side by side at 44px would be unwieldy.

---

### PART 3 — What NOT to change

**Do not change the font size scale in `tailwind.config.ts`.** The scale is correct and well-designed. The problem is how classes are assigned, not the scale itself.

**Do not change actions task text.** 14px weight 500 #111 is the best-implemented typography on the page. It is correct.

**Do not make everything `text-ink` / `--color-text-primary` (#111).** A three-stop colour hierarchy is required. The fix creates three distinct stops — primary (#111), secondary (#374151), tertiary (#6b7280). All three are needed.

**Do not go below 11px for any visible text element.** 9px is the current failure. 10px is also not acceptable for content. 11px ALL-CAPS at weight 500+ is the minimum and only for section group labels.

**Do not change the colour system for non-results pages.** The `globals.css` change affects the whole app. Verify the assessment wizard pages (`/assessment`) and homepage (`/`) still look correct after the change. The colour shift from #6b7280 to #374151 for secondary text will also affect those pages — confirm they are improved (they should be) rather than broken.

**Do not use hardcoded hex values.** All colour assignments must use the CSS custom properties (`var(--color-text-secondary)` etc.) so they draw from the updated token system.

---

## PUSHBACK PROTOCOL

Challenge this brief if:

- A component uses a different class name than described — use the actual class name
- `text-financial-standard` IS applied to metric card values and they still render at 13px — if so, something else is overriding it (an inline style, a parent, a Tailwind purge issue). Investigate and report the actual override before fixing
- The `--color-text-secondary` token change produces unexpected results on the assessment wizard or homepage — flag immediately with a screenshot before proceeding
- Any colour change would cause a semantic colour to appear on a coloured background (e.g. #374151 on a danger-red background) — report the specific instance

Use this format:

```
⚠️ PUSHBACK [ELEMENT]:
Brief says: [what this doc says]
Code shows: [what the code actually does]
Risk: [what would break]
Proposal: [your suggestion]
Status: AWAITING CONFIRMATION
```

---

## COMMIT SEQUENCE

Make changes in order. Each commit should be independently deployable.

```
commit 1: fix(design-system): darken --color-text-secondary from #6b7280 to #374151 in globals.css

commit 2: fix(results/sidebar): increase group label from 9px to 11px (text-label); badges from 9px to 12px

commit 3: fix(results/topbar): increase P&L number from 14px/400 to 18px/500

commit 4: fix(results/verdict): increase body paragraph from text-body-sm (13px) to text-body (14px); hero P&L weight 400 → 500

commit 5: fix(results/actions): verify script blockquote uses --color-text-secondary (now #374151); not hardcoded grey

commit 6: fix(results/refine): increase hint text from text-caption (12px) to text-body-sm (13px)

commit 7: fix(results/metrics): locate and restore text-financial-standard (22px) on metric card values
```

---

## SELF-AUDIT CHECKLIST

After all commits:

```
WCAG checks:
□ No visible text renders below 11px anywhere in the results page
□ No element uses hardcoded hex colours for text
□ Run Chrome DevTools Lighthouse → Accessibility → target score 95+

Visual checks (at 100% zoom, standard display):
□ Sidebar group labels (RESULT / UNDERSTAND / NEXT STEP): visibly readable, not straining
□ Sidebar nav items: clearly legible, darker than before
□ Top bar P&L (−$2,129): 18px, confident weight, immediately reads at a glance
□ Verdict body paragraph: noticeably darker than before — #374151 not #6b7280
□ Metric card values: 22px monospace, not 13px — dominate their cards
□ Actions task text: unchanged — still 14px weight 500 #111
□ Actions script (EXACT SCRIPT): clearly readable, not grey-on-grey-white
□ Refine hint text: readable instructional copy, not straining
□ Hero P&L range: weight 500, confident

Cross-page checks:
□ Homepage (/): secondary text (#374151) looks correct and improved
□ Assessment wizard (/assessment): steps still legible, no broken layouts
□ No regression in any component using --color-text-secondary

Mobile check (390px viewport):
□ All text elements remain legible at mobile sizes
□ Sidebar group labels are hidden on mobile (hidden md:flex) — no impact
□ Mobile mini-nav tabs: text size and colour correct
```

---

## CONTEXT — WHY THESE NUMBERS MATTER

The results page is read by Australian merchants under real-world conditions: a café owner on an iPhone after a long shift, a restaurant manager on an older Android at a noisy table, a small business owner skimming quickly because they have 5 minutes. These are not ideal reading conditions.

User testing confirmed what the audit numbers predicted: the grey text (#6b7280) at small sizes (9px, 12px, 13px) reads as "fine print" — the kind of text that signals unimportance. On a page where every piece of copy is either explaining the merchant's financial situation, telling them what to do, or giving them the exact words to say, there is no unimportant text. The typography must communicate that.

The fix is not "make everything bigger and blacker." It is "give every element the size and weight appropriate to its importance, with enough contrast to be read without strain." The three-stop colour hierarchy (primary / secondary / tertiary) combined with minimum 11px floor achieves that without flattening the visual hierarchy.

---

*Produced: April 2026*
*Source: Live JavaScript audit of nosurcharging-staging.up.railway.app + user testing feedback*
*Companion documents: RESULTS_PAGE_REDESIGN.md, MERCHANT_VALUE_BACKLOG.md, SITUATION_TAXONOMY_IMPACT.md*
