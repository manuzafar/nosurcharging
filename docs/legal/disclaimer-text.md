# Disclaimer Text

**Version:** v1.0
**Date:** April 2026

Record consent_version alongside every consent record. If text changes, increment version (v1.1) — historical consents reference the version shown at the time of consent.

## Assessment entry consent (FR-23)

Affirmative checkbox — not a banner, not pre-checked.

consent_type: "disclaimer" | consent_version: "v1.0"

Exact text:
"I understand that this assessment provides illustrative estimates only. It is not financial advice. Figures are based on RBA published data and the information I provide. I should verify any figures with my PSP before making business decisions."

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
