Verify design token usage across all UI components against docs/design/design-tokens.md and docs/design/ux-design.md.

Check for violations:

1. FONTS: All financial numbers must use font-mono. Grep for financial values that don't use font-mono class or var(--font-mono).
2. FONT WEIGHTS: Only 400 and 500 allowed. Grep for font-weight: 600, font-weight: 700, font-bold, font-semibold, font-extrabold.
3. ACCENT COLOUR: Single accent is amber #BA7517. Check for other accent colours being introduced.
4. P&L HERO: Must be 44px monospace (text-financial-hero font-mono). Check results/VerdictSection.tsx.
5. BREAKPOINT: Single breakpoint at 500px (not 768px). Grep for 768px, md:, lg: breakpoint usage.
6. SCHEME FEES INVARIANT: Chart must render scheme fees bars at exactly equal height. Check isAnimationActive={false} on Recharts chart.
7. REVEAL TIMING: Must be 1.1s (var(--reveal-total)). Check RevealScreen.tsx.
8. SPACING: All spacing should follow 8px grid (4, 8, 16, 24, 32, 48, 56). Flag odd spacing values.
9. BORDER RADIUS: Cards 12px, inputs/buttons 8px, pills 20px. Check for inconsistencies.
10. SVG ICONS: No emoji in UI. Grep for emoji unicode characters in component files.

Report each check as PASS, FAIL (with file:line), or NOT YET APPLICABLE.
