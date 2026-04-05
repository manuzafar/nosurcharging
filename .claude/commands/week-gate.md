Run the hard gate checklist for the current build week. Determine which week we're in based on what exists in the codebase, then check every gate item.

Week 1 gates:
- [ ] pnpm turbo build succeeds
- [ ] GET /api/health returns 200 { status: 'ok' }
- [ ] POST /api/excel returns 501
- [ ] Security headers present in next.config.ts (HSTS, X-Frame-Options, CSP, etc.)
- [ ] All packages compile without errors

Week 2 gates (HARD GATE — no UI until all pass):
- [ ] pnpm turbo test:unit — ALL GREEN
- [ ] Scenario 1: plSwing === 1724.62
- [ ] Scenario 1: todayScheme === oct2026Scheme
- [ ] Scenario 2 (0% PT): plSwing === 0
- [ ] Scenario 2 (100% PT): plSwing === icSaving (within $0.01)
- [ ] Scenario 3: plSwing === -111376.92
- [ ] Scenario 4: plSwing === -34835.89
- [ ] Scenario 5: debitSaving === 0.00 (not negative)
- [ ] Scenario 6: breakdown sum === 1.0 (within 0.001)
- [ ] All scenarios: !isNaN(plSwing) && isFinite(plSwing)

Week 3 gates:
- [ ] Disclaimer consent records in Supabase with exact text and version
- [ ] Session cookie: HttpOnly, Secure, SameSite=Strict
- [ ] Full Step 1-4 navigation works
- [ ] Expert toggle + confidence badge updates live
- [ ] Card mix auto-normalises
- [ ] Amex carve-out note appears for exempt-only networks
- [ ] Reveal screen 1.1s, submitAssessment fires at t=0

Week 4 gates:
- [ ] P&L hero: 44px monospace
- [ ] Scheme fees bars exactly equal pixel height
- [ ] Slider updates hero + metric + chart + saving in <16ms
- [ ] PSP name inline in action list
- [ ] Email capture: 1/session rate limit, encrypts email
- [ ] PSP Rate Registry form submits

Week 5 gates:
- [ ] Privacy policy at /privacy
- [ ] Sentry with PII scrubbing
- [ ] All 13 Plausible events fire
- [ ] Security headers A or A+
- [ ] CORS blocks non-allowed origins
- [ ] Legal review completed

Week 6 gates:
- [ ] All E2E tests pass
- [ ] Mobile 375px audit passes
- [ ] Lighthouse > 85
- [ ] Homepage < 80KB gzipped

Report which week we're in and the status of each gate item.
