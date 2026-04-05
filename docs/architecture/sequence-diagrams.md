# Sequence Diagrams
## nosurcharging.com.au

All flows documented as Mermaid sequence diagrams. Render at mermaid.live or in any Mermaid-compatible viewer.

---

## Diagram 1 — Assessment submission flow (Phase 1)

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant N as Next.js
    participant SA as Server Action
    participant C as Calc Engine
    participant S as Supabase
    participant P as Plausible

    M->>B: Lands on nosurcharging.com.au
    B->>N: GET / SSR homepage
    N-->>B: Rendered HTML

    M->>B: Checks disclaimer checkbox
    B->>SA: createSession() server action
    SA->>SA: Generate UUID server-side
    SA-->>B: Set-Cookie session_id HttpOnly Secure SameSite=Strict
    SA->>S: INSERT consents type=disclaimer version=v1.0
    B->>P: trackEvent Assessment started country AU

    Note over M,B: Steps 1-4 are fully client-side. No network calls.

    M->>B: Completes Step 1 volume entry
    B->>P: trackEvent Step completed step 1

    M->>B: Selects flat rate card and Stripe PSP
    B->>P: trackEvent Plan type selected flat
    B->>P: trackEvent PSP selected Stripe

    M->>B: Selects Yes surcharging 1.2% Visa and Mastercard
    B->>P: trackEvent Step completed step 3

    M->>B: Selects Hospitality group
    B->>P: trackEvent Step completed step 4

    M->>B: Clicks See my results
    B->>B: Reveal screen 1.1 seconds dark pulsing amber

    B->>SA: submitAssessment(inputs) server action
    SA->>SA: Read session_id from HttpOnly cookie
    SA->>SA: Validate and sanitise all inputs
    SA->>SA: hashIP(request.ip) HMAC-SHA256 with secret
    SA->>C: calculateCategory(inputs, AU_CONSTANTS)
    C-->>SA: category=4 plSwing=-154000 icSaving=1780
    SA->>S: INSERT assessments via pooler port 6543
    S-->>SA: assessment_id
    SA-->>B: outputs payload

    B->>B: Render results page with hero number
    B->>P: trackEvent Results viewed category 4 country AU

    M->>B: Drags pass-through slider to 45%
    B->>C: recalculate local — no network call
    B->>P: trackEvent Slider used
```

---

## Diagram 2 — Email capture flow (Phase 1)

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant SA as Server Action
    participant S as Supabase
    participant R as Resend

    M->>B: Enters email address on results page
    M->>B: Clicks Get notified

    B->>SA: captureEmail(email, assessmentId) server action
    SA->>SA: Read session_id from HttpOnly cookie
    SA->>SA: Validate email format
    SA->>SA: Check rate limit 1 per session 10 per IP per hour
    SA->>SA: hashIP with HMAC-SHA256

    SA->>S: INSERT consents type=email_marketing version=v1.0
    Note right of S: Exact consent text stored
    S-->>SA: consent_id

    SA->>S: INSERT email_signups email_encrypted=pgp_sym_encrypt
    Note right of S: Raw email never stored
    S-->>SA: signup_id

    SA->>R: Send confirmation email
    Note right of R: Subject Confirmed one email on 30 October
    Note right of R: Plain text no marketing content
    R-->>SA: 200 OK

    SA-->>B: success true
    B->>B: Show confirmation state
```

---

## Diagram 3 — Phase 2 invoice upload and parsing

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant H as Hono API
    participant W as Worker
    participant SB as Supabase Storage
    participant DB as Supabase DB
    participant CL as Claude API

    M->>B: Selects PSP statement PDF

    B->>H: POST /api/invoices/upload multipart
    H->>H: Validate JWT auth token
    H->>H: Check file type via magic bytes not extension
    H->>H: Virus scan

    alt Malicious file
        H-->>B: 422 Unprocessable
    else Clean file
        H->>SB: Upload to invoice-uploads bucket
        Note right of SB: 24-hour TTL lifecycle policy
        H->>DB: INSERT invoice_uploads status=pending
        H->>W: Enqueue job via pg-boss
        H-->>B: uploadId + status=processing
    end

    W->>SB: Download file to memory buffer only
    Note right of W: Never written to disk
    W->>CL: POST /v1/messages document as base64
    CL-->>W: Extraction result JSON

    W->>W: Validate against plausible market ranges
    W->>W: buffer.fill(0) zero the memory
    W->>SB: Delete file immediately
    W->>DB: UPDATE status=complete extraction_result=validated

    B->>H: GET /api/invoices/uploadId polling
    H->>DB: SELECT WHERE id AND user_id=current
    DB-->>H: status=complete extraction
    H-->>B: Pre-populated assessment inputs

    B->>B: Show extracted values for merchant review
    M->>B: Confirms or edits values
```

---

## Diagram 4 — Phase 2 authentication (magic link)

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant N as Next.js
    participant SA as Supabase Auth
    participant DB as Supabase DB
    participant R as Resend

    M->>B: Clicks Sign in
    M->>B: Enters email address

    B->>SA: POST /auth/v1/otp
    SA->>R: Send magic link
    Note right of R: Link expires 1 hour
    SA-->>B: 200 check your email

    M->>B: Clicks link in email
    B->>SA: Verify token
    SA-->>B: Redirect with session cookies set

    B->>N: GET /auth/callback
    N->>SA: Exchange code for session
    SA-->>N: user_id and session tokens

    N->>DB: UPDATE assessments SET user_id WHERE session_id
    N->>DB: UPDATE consents SET user_id WHERE session_id
    N->>DB: UPDATE email_signups SET user_id WHERE session_id
    Note right of DB: Claims all Phase 1 anonymous data

    N-->>B: Redirect to dashboard
```

---

## Diagram 5 — Phase 2 Excel download

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant SA as Server Action or Hono
    participant E as Excel Service Node
    participant DB as Supabase

    M->>B: Clicks Download P&L model .xlsx

    B->>SA: POST /api/excel assessmentId passThrough=0.45
    SA->>SA: Validate auth and rate limit 10 per IP per hour
    SA->>DB: SELECT assessment WHERE id AND user_id=current
    DB-->>SA: Assessment inputs and outputs

    SA->>E: POST /generate-workbook internal
    Note right of E: X-Internal-Key header required
    E->>E: Sheet 1 Summary screenshot-ready
    E->>E: Sheet 2 P&L Model blue input cells formulas
    E->>E: Sheet 3 Assumptions RBA sources
    E->>E: Sheet 4 Action List with PSP name and dates
    E-->>SA: Workbook bytes in memory never stored

    SA-->>B: Content-Disposition attachment filename .xlsx
    B->>B: Browser triggers file download
    Note over E: Bytes garbage collected immediately
```

---

## Diagram 6 — Consulting lead conversion

```mermaid
sequenceDiagram
    actor M as Merchant
    participant B as Browser
    participant CAL as Calendly
    participant SA as Server Action
    participant DB as Supabase
    participant R as Resend

    Note over M,B: Merchant has seen Category 4 result -$154K P&L swing

    M->>B: Clicks Book a free discovery call
    B->>CAL: Opens Calendly booking page

    M->>CAL: Selects time slot and enters details
    CAL-->>M: Booking confirmation email native

    CAL->>SA: POST /api/webhooks/calendly
    SA->>SA: Validate Calendly webhook signature

    SA->>DB: INSERT consulting_leads status=booked
    SA->>R: Notify Manu new booking with business name
    SA->>R: Send prep email to merchant
    Note right of R: 3 things to bring PSP statements rate info volume

    R-->>M: Preparation email from manu@nosurcharging.com.au
```

---

*Sequence Diagrams v1.0 · nosurcharging.com.au · April 2026*
