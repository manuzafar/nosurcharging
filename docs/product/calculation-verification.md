# Calculation Verification
## nosurcharging.com.au — Verified Reference Scenarios

**Version:** 1.0 | **April 2026**

These are the ground-truth numbers for the test suite. Every scenario was calculated
manually and independently verified. The calculation engine must produce outputs that
match these values within $0.01 rounding tolerance.

If the engine produces different values, the engine is wrong — not these numbers.

---

## Default inputs used across all scenarios

Unless a scenario explicitly overrides a value, these defaults apply:

```
Card mix:
  debitShare:          0.60  (60%)
  consumerCreditShare: 0.35  (35%)
  foreignShare:        0.05  (5%)
  commercialShare:     0.00  (0%)
  avgTransactionValue: $65

Rates (pre-Oct 2026):
  debitCentsPerTxn:    0.09  (9 cents)
  consumerCreditPct:   0.0052  (0.52%)
  schemeFeesDomestic:  0.00105  (10.5bps)
  pspMarginPct:        0.001  (0.10%)

Rates (post-Oct 2026):
  debitCentsPerTxn:    0.08  (8 cents)
  consumerCreditPct:   0.003  (0.30%)

MSF rate (flat rate plans): 0.014  (1.4%)

Test period: pre_reform (current date < 1 Oct 2026)
```

---

## Scenario 1 — Category 1: $2M, cost-plus, not surcharging

**Inputs:**
```
volume:       2,000,000
planType:     costplus
surcharging:  false
surchargeRate: 0
passThrough:  0  (irrelevant for cost-plus)
```

**Step-by-step working:**

```
Debit transactions:
  = (2,000,000 × 0.60) / 65
  = 1,200,000 / 65
  = 18,461.538...

Debit IC saving (9c → 8c = 1c per txn):
  = 18,461.538 × 0.01
  = $184.62

Consumer credit IC saving (0.52% → 0.30% = 0.22% of credit volume):
  = 2,000,000 × 0.35 × 0.0022
  = 700,000 × 0.0022
  = $1,540.00

Total IC saving:
  = $184.62 + $1,540.00
  = $1,724.62

Today's gross COA:
  Debit IC:     18,461.538 × 0.09  = $1,661.54
  Credit IC:    2,000,000 × 0.35 × 0.0052 = $3,640.00
  Scheme fees:  2,000,000 × 0.00105 = $2,100.00
  PSP margin:   2,000,000 × 0.001   = $2,000.00
  TOTAL:                               $9,401.54

Surcharge revenue: $0

Net today:    $9,401.54 - $0         = $9,401.54
Oct net:      $9,401.54 - $1,724.62  = $7,676.92
P&L swing:    $9,401.54 - $7,676.92  = +$1,724.62

Scheme fees invariant:
  todayScheme  = $2,100.00
  oct2026Scheme = $2,100.00
  MUST BE EQUAL ✓
```

**Expected outputs:**
```typescript
{
  category:     1,
  icSaving:     1724.62,
  netToday:     9401.54,
  octNet:       7676.92,
  plSwing:      1724.62,   // positive — saving
  todayScheme:  2100.00,
  oct2026Scheme: 2100.00,  // MUST equal todayScheme
  confidence:   'low',     // all defaults used
}
```

---

## Scenario 2 — Category 2: $2M, flat rate, not surcharging — three pass-through levels

**Inputs:**
```
volume:       2,000,000
planType:     flat
surcharging:  false
surchargeRate: 0
msfRate:      0.014  (1.4%)
```

IC saving is identical to Scenario 1: **$1,724.62**

**At 0% pass-through (PSP keeps all saving):**
```
annualMSF:   2,000,000 × 0.014   = $28,000.00
netToday:    $28,000.00 - $0     = $28,000.00
octNet:      $28,000.00 - ($1,724.62 × 0) = $28,000.00
plSwing:     $28,000.00 - $28,000.00 = $0.00
```

**At 45% pass-through:**
```
octNet:      $28,000.00 - ($1,724.62 × 0.45)
           = $28,000.00 - $776.08
           = $27,223.92
plSwing:     $28,000.00 - $27,223.92 = +$776.08
```

**At 100% pass-through (full saving passes through):**
```
octNet:      $28,000.00 - ($1,724.62 × 1.0)
           = $28,000.00 - $1,724.62
           = $26,275.38
plSwing:     $28,000.00 - $26,275.38 = +$1,724.62
```

Note: at 100% pass-through, plSwing MUST equal totalICSaving. This is a mathematical
invariant — test it explicitly.

**Expected outputs (at 0%):**
```typescript
{ category: 2, plSwing: 0.00, icSaving: 1724.62 }
```

**Expected outputs (at 45%):**
```typescript
{ category: 2, plSwing: 776.08, icSaving: 1724.62 }
```

**Expected outputs (at 100%):**
```typescript
{ category: 2, plSwing: 1724.62, icSaving: 1724.62 }  // plSwing === icSaving ✓
```

---

## Scenario 3 — Category 3: $10M, cost-plus, surcharging at 1.2%

**Inputs:**
```
volume:        10,000,000
planType:      costplus
surcharging:   true
surchargeRate: 0.012  (1.2%)
```

**Step-by-step working:**
```
Debit transactions:
  = (10,000,000 × 0.60) / 65
  = 6,000,000 / 65
  = 92,307.692...

Debit IC saving:
  = 92,307.692 × 0.01 = $923.08

Credit IC saving:
  = 10,000,000 × 0.35 × 0.0022 = $7,700.00

Total IC saving:
  = $923.08 + $7,700.00 = $8,623.08

Today's gross COA:
  Debit IC:     92,307.692 × 0.09 = $8,307.69
  Credit IC:    10,000,000 × 0.35 × 0.0052 = $18,200.00
  Scheme fees:  10,000,000 × 0.00105 = $10,500.00
  PSP margin:   10,000,000 × 0.001   = $10,000.00
  TOTAL:                                $47,007.69

Surcharge revenue:
  = 10,000,000 × 0.012 = $120,000.00

Net today:    $47,007.69 - $120,000.00 = -$72,992.31
              (surcharge revenue exceeds costs — merchant has a net surplus today)

Oct net:      $47,007.69 - $8,623.08 = $38,384.61
              (surcharge gone, IC saving absorbed, merchant now pays net $38K)

P&L swing:    -$72,992.31 - $38,384.61 = -$111,376.92
              (negative: merchant is $111K worse off after reform)

Scheme fees invariant:
  todayScheme  = $10,500.00
  oct2026Scheme = $10,500.00 ✓
```

**Expected outputs:**
```typescript
{
  category:      3,
  icSaving:      8623.08,
  netToday:      -72992.31,   // negative — surcharge revenue currently exceeds costs
  octNet:        38384.61,
  plSwing:       -111376.92,  // large negative swing — Category 3 is painful
  todayScheme:   10500.00,
  oct2026Scheme: 10500.00,
}
```

---

## Scenario 4 — Category 4: $3M, flat rate, surcharging at 1.2%, 45% pass-through

**Inputs:**
```
volume:        3,000,000
planType:      flat
surcharging:   true
surchargeRate: 0.012  (1.2%)
msfRate:       0.014  (1.4%)
passThrough:   0.45   (45%)
```

**Step-by-step working:**
```
Debit transactions:
  = (3,000,000 × 0.60) / 65
  = 1,800,000 / 65
  = 27,692.308...

Debit IC saving:
  = 27,692.308 × 0.01 = $276.92

Credit IC saving:
  = 3,000,000 × 0.35 × 0.0022 = $2,310.00

Total IC saving:
  = $276.92 + $2,310.00 = $2,586.92

Annual MSF:         3,000,000 × 0.014 = $42,000.00
Surcharge revenue:  3,000,000 × 0.012 = $36,000.00

Net today:    $42,000.00 - $36,000.00 = $6,000.00
              (still paying net $6K after surcharge offsets most of MSF)

Oct net (45% pass-through):
  = $42,000.00 - ($2,586.92 × 0.45)
  = $42,000.00 - $1,164.11
  = $40,835.89

P&L swing:    $6,000.00 - $40,835.89 = -$34,835.89
              (merchant goes from $6K cost to $40.8K cost — a $34.8K worsening)
```

**Expected outputs:**
```typescript
{
  category:   4,
  icSaving:   2586.92,
  netToday:   6000.00,
  octNet:     40835.89,
  plSwing:    -34835.89,  // negative — Category 4 is painful
}
```

---

## Scenario 5 — Expert mode: $5M, cost-plus, not surcharging, debit rate below reform cap

This tests the critical invariant: if the merchant's actual debit rate is already
below the reform cap, the debit saving must be zero (not negative).

**Inputs:**
```
volume:            5,000,000
planType:          costplus
surcharging:       false
expertRates:
  debitCents:  7    (7c — BELOW the 8c reform cap)
  creditPct:   0.40  (0.40% — ABOVE the 0.30% cap, so reform applies)
  marginPct:   0.08  (0.08%)
```

**Step-by-step working:**
```
Debit transactions:
  = (5,000,000 × 0.60) / 65 = 3,000,000 / 65 = 46,153.846...

Projected debit rate:
  = min(expertDebitCents, reformCapDebitCents)
  = min(7c, 8c) = 7c
  (merchant already below cap — no debit saving)

Debit saving:
  = 46,153.846 × (0.07 - 0.07) = $0.00   ← MUST NOT BE NEGATIVE

Projected credit rate:
  = min(expertCreditPct, reformCapCreditPct)
  = min(0.40%, 0.30%) = 0.30%
  (reform cap applies — credit saving exists)

Credit saving:
  = 5,000,000 × 0.35 × (0.0040 - 0.0030)
  = 1,750,000 × 0.001
  = $1,750.00

Total IC saving:
  = $0.00 + $1,750.00 = $1,750.00

Today's gross COA:
  Debit IC:     46,153.846 × 0.07 = $3,230.77
  Credit IC:    5,000,000 × 0.35 × 0.004 = $7,000.00
  Scheme fees:  5,000,000 × 0.00105 = $5,250.00
  PSP margin:   5,000,000 × 0.0008 = $4,000.00
  TOTAL:                               $19,480.77

Net today:    $19,480.77
Oct net:      $19,480.77 - $1,750.00 = $17,730.77
P&L swing:    +$1,750.00
```

**Expected outputs:**
```typescript
{
  category:     1,
  icSaving:     1750.00,
  debitSaving:  0.00,      // MUST be zero, not negative
  creditSaving: 1750.00,
  plSwing:      1750.00,
  confidence:   'high',    // expert rates provided
}
```

---

## Scenario 6 — Card mix normalisation: partial merchant input

This tests the resolution pipeline, not the calculation engine directly.

**Merchant provides only:**
```
visa_debit: 0.60  (60%)
amex:       0.05  (5%)
[all other fields left blank — use defaults]
```

**Resolution fills in blanks from defaults (scheme-level env vars or regulatory constants):**
```
visa_debit:        0.60  (merchant input)
visa_credit:       0.18  (default)
mastercard_debit:  0.17  (default)
mastercard_credit: 0.12  (default)
eftpos:            0.08  (default)
amex:              0.05  (merchant input)
foreign:           0.05  (default)
commercial:        0.00  (default)
Raw total:         1.25
```

**After normalisation (÷ 1.25 to bring to 1.0):**
```
visa_debit:        0.60 / 1.25 = 0.480
visa_credit:       0.18 / 1.25 = 0.144
mastercard_debit:  0.17 / 1.25 = 0.136
mastercard_credit: 0.12 / 1.25 = 0.096
eftpos:            0.08 / 1.25 = 0.064
amex:              0.05 / 1.25 = 0.040
foreign:           0.05 / 1.25 = 0.040
commercial:        0.00 / 1.25 = 0.000
TOTAL:                           1.000 ✓

Aggregated debitShare:          = 0.480 + 0.136 + 0.064 = 0.680
Aggregated consumerCreditShare: = 0.144 + 0.096         = 0.240
Aggregated foreignShare:        = 0.040
Aggregated amexShare:           = 0.040
```

**Expected resolver output:**
```typescript
{
  cardMix: {
    debitShare:          0.680,
    consumerCreditShare: 0.240,
    foreignShare:        0.040,
    amexShare:           0.040,
    breakdown: {
      visa_debit:        0.480,
      visa_credit:       0.144,
      mastercard_debit:  0.136,
      mastercard_credit: 0.096,
      eftpos:            0.064,
      amex:              0.040,
      foreign:           0.040,
      commercial:        0.000,
    }
  },
  resolutionTrace: {
    'cardMix.visa_debit': { source: 'merchant_input', label: 'Your input',  value: 0.48 },
    'cardMix.amex':       { source: 'merchant_input', label: 'Your input',  value: 0.04 },
    'cardMix.visa_credit': { source: 'env_var',       label: 'RBA average', value: 0.144 },
    // ... etc
  },
  confidence: 'medium',  // 2 of 7 fields from merchant input
}
```

---

## Verification checklist for the test suite

Before any UI code is written, run:
```bash
turbo run test:unit
```

The following assertions must all pass:

```
Scenario 1: plSwing === 1724.62
Scenario 1: todayScheme === oct2026Scheme (scheme fees invariant)
Scenario 2 (0% PT): plSwing === 0
Scenario 2 (100% PT): plSwing === icSaving (within 0.01)
Scenario 3: plSwing === -111376.92
Scenario 4: plSwing === -34835.89
Scenario 5: debitSaving >= 0 (expert rate below cap)
Scenario 5: debitSaving === 0.00 exactly
Scenario 6: sum of all breakdown values === 1.0 (within 0.001)
All scenarios: !isNaN(plSwing) && isFinite(plSwing)
```

---

## Source for card mix defaults (OQ-01 resolved)

The default card mix values used above (60% debit, 35% consumer credit, 5% foreign)
are derived from:

**RBA Statistical Table C1 — Credit and Charge Cards**
**RBA Statistical Table C2 — Debit Cards**
https://www.rba.gov.au/statistics/tables/#payments-system

C1 reports total credit and charge card transaction volumes and values.
C2 reports total debit card transaction volumes and values (eftpos, Visa Debit,
Mastercard Debit combined).

Based on 12-month rolling data to January 2026:
- Debit card transactions (C2): ~7.9 billion per year
- Credit/charge card transactions (C1): ~4.5 billion per year
- Debit share of card transactions: ~63% (rounded to 60% as conservative default)
- Consumer credit share: ~35% (personal cards per C1.2)
- Commercial: ~2-3% (commercial cards per C1.2, rounded to 0% for defaults)
- Foreign-issued: ~5% (based on RBA Conclusions Paper, March 2026, cross-border data)

**Important:** The 60/35/5/0 split is a national average. Industry-specific splits
vary significantly. The card mix input (FR-10b) allows merchants to override these
defaults with their actual mix. Always display the source in the assumptions panel.

**Citation format for assumptions panel:**
"Source: RBA Statistical Tables C1 and C2 (12 months to January 2026)"
URL: https://www.rba.gov.au/statistics/tables/#payments-system

---

*Calculation Verification v1.0 · nosurcharging.com.au · April 2026*
*All arithmetic verified manually. Discrepancies indicate a calculation engine error.*
