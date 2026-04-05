# The Four Merchant Categories

Two binary questions determine every merchant's outcome under the October 2026 reform.

## Question 1: Pricing plan type
- **Flat rate / blended** — one percentage for all card types. IC saving does NOT flow automatically to the merchant.
- **Cost-plus / IC++** — actual wholesale cost + fixed margin. IC saving flows automatically.

## Question 2: Currently surcharging on designated networks?
- **Yes** — surcharge revenue disappears 1 October 2026 for Visa, Mastercard, eftpos.
- **No** — no revenue change from the surcharge ban.

## The matrix

|  | Not surcharging | Surcharging |
|---|---|---|
| **Cost-plus** | Category 1 — Near-pure winner | Category 3 — Reprice required |
| **Flat rate** | Category 2 — Conditional | Category 4 — Act immediately |

## Assignment logic

```
Cat 1: cost_plus AND NOT surcharging
Cat 2: flat_rate AND NOT surcharging
Cat 3: cost_plus AND surcharging
Cat 4: flat_rate AND surcharging
```

## Category verdicts

**Category 1** — "Your costs fall automatically on 1 October."
Cost-plus, not surcharging. Saving flows through. Verify it landed on the October statement.

**Category 2** — "The saving exists — but it won't arrive automatically."
Flat rate, not surcharging. PSP may absorb the saving. Merchant must push for pass-through.

**Category 3** — "Your surcharge revenue disappears on 1 October."
Cost-plus, surcharging. IC saving offsets only 6–15% of lost surcharge revenue. Must reprice.

**Category 4** — "You face both challenges simultaneously."
Flat rate, surcharging. Both surcharge loss and potential non-pass-through of IC saving.

## Amex and BNPL carve-out (important)

If a merchant surcharges ONLY Amex or BNPL — not Visa/Mastercard/eftpos — the October ban may not affect their surcharge revenue. Show a note:

"The October ban doesn't cover Amex, BNPL or PayPal — these remain surchargeable. If you only surcharge these networks, this reform may not directly affect your surcharge revenue."

The tool detects this when the merchant checks ONLY Amex/BNPL checkboxes in Step 3.
