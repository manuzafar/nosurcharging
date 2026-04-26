# Disclaimer Text

**Version:** v1.1
**Date:** April 2026 (post-legal-review pass)

Record consent_version alongside every consent record. If text changes, increment version (v1.2) — historical consents reference the version shown at the time of consent.

## Version history

- **v1.1 — April 2026.** Removed "RBA published data" from the consent text and the first commitment-card body (the consent screen no longer cites a single named data source). Replaced "verify any figures with my PSP" with "seek independent advice from a qualified professional". Removed named PSPs (Stripe, Square, Tyro) from the independence statement. Added a Terms & conditions link alongside the Privacy policy link in the consent checkbox text. Long-form legal pages added at `/disclaimer` and `/terms`; `/privacy` rewritten to share their layout.
- **v1.0 — April 2026.** Initial wording, pre-legal-review.

## Assessment entry consent (FR-23)

Affirmative checkbox — not a banner, not pre-checked.

consent_type: "disclaimer" | consent_version: "v1.1"

Exact text:
"I understand that this assessment provides illustrative estimates only. It is not financial advice. Figures are based on the information I provide. I should seek independent advice from a qualified professional before making business decisions."

## Results page inline disclaimer (FR-22)

No checkbox — informational only.

"Figures are illustrative estimates based on RBA data and the information you provided. Not financial advice. Verify with your PSP before making business decisions. Card mix defaults are based on RBA Statistical Tables C1 and C2 (national averages) and may not reflect your specific business."

## Email capture consent (FR-25)

Plain text below email input — no checkbox needed (consent is implicit in submitting the form, but record it).

consent_type: "email_marketing" | consent_version: "v1.0"

Exact text:
"One email on 30 October when the published MSF data drops. Not shared with any payment provider. Unsubscribe from the email itself."

## Site-wide disclaimer (FR-02)

Displayed on every page — header or persistent banner.

"nosurcharging.com.au provides general guidance only. Not financial advice. Verify with your PSP before making business decisions."

## Legal review requirement

These texts must be reviewed by an Australian solicitor with fintech experience before public launch. Estimated cost $300–500 for one hour. Hard gate — do not launch without this review.
