# The Five Merchant Categories

Three questions determine every merchant's outcome under the October 2026 reform.

## Question 0: Zero-cost EFTPOS plan?

- **Yes** — your zero-cost plan ends on 1 October. Category 5. Skip Q1 and Q2.
- **No** — continue to Q1 and Q2.

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
| **Zero-cost EFTPOS** | Category 5 — Plan ends 1 Oct (full-cost exposure) |

## Assignment logic

```
Cat 5: planType === 'zero_cost'                  // short-circuits Q1/Q2
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

**Category 5** — "Your zero-cost plan ends on 1 October."
The PSP-mediated surcharge mechanism ends. Merchant moves from $0 net cost to a standard flat-rate plan. First-ever card acceptance invoice. Estimate at 1.4% market rate (range: 1.2%–1.6%).

## Amex and BNPL carve-out (important)

If a merchant surcharges ONLY Amex or BNPL — not Visa/Mastercard/eftpos — the October ban may not affect their surcharge revenue. Show a note:

"The October ban doesn't cover Amex, BNPL or PayPal — these remain surchargeable. If you only surcharge these networks, this reform may not directly affect your surcharge revenue."

The tool detects this when the merchant checks ONLY Amex/BNPL checkboxes in Step 3.

## Zero-cost EFTPOS — extra notes

Zero-cost EFTPOS is PSP-mediated, terminal-based, and almost always limited to small merchants. The PSP calculates per-transaction card acceptance cost and adds it as a customer-paid surcharge at the terminal. The merchant receives the full sale price; net cost is $0.

From 1 October 2026, the surcharge ban prevents the PSP from applying that automatic surcharge to Visa, Mastercard, and eftpos. The PSP transitions the merchant to a standard flat-rate plan.

**Step 3 simplification for zero-cost.** The standard surcharge question is replaced with a single Amex-only question:

> "Does your terminal separately surcharge Amex card payments?" Yes / No.

Visa, Mastercard, and eftpos are pre-set as surcharged networks (always true under zero-cost). PayPal and BNPL are not shown (irrelevant for terminal-based small merchants).

**Calculation.** Cat 5 ignores `surcharging`, `surchargeRate`, and `passThrough` for the P&L formula:

- `netToday = 0`
- `octNet = volume × estimatedMSFRate`
- `plSwing = −octNet`
- `rangeDriver = 'post_reform_rate'`, range bounds at 1.2% / 1.6%

`icSaving` is still computed (debit + credit, same logic as Cat 1-4) and shown in the AssumptionsPanel framed as "kept by ${psp} during plan transition" — for transparency. It does not appear on a metric card.

Amex separate surcharge data (if collected in Step 3) is preserved in `surchargeNetworks` and `surchargeRate` for AssumptionsPanel display, but does not affect the Cat 5 P&L formula (Amex remains permitted post-October).
