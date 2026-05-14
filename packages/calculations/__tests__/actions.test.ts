// packages/calculations/__tests__/actions.test.ts
// Asserts the action builder produces the spec-conformant shape:
//   • All actions have script + why for every category
//   • PSP name is interpolated into both text and script
//   • $X surcharge revenue + rate% interpolation works for Cat 3 and Cat 4
//   • No banned phrases ("your PSP", "your provider")

import { describe, expect, it } from 'vitest';
import { buildActions } from '../actions';
import type { ActionContext } from '../types';

// Test fixture. plSwing chosen so that the break-even percentage is a
// clean number (-$3,300 / $500,000 × 100 = 0.66%) — distinct from the
// surcharge rate (1.5%) so the assertions can prove the script uses
// break-even, not surcharge rate.
const CTX: ActionContext = {
  volume: 500_000,
  surchargeRate: 0.015, // 1.5%
  surchargeRevenue: 7_500,
  icSaving: 4_200,
  plSwing: -3_300, // abs / volume = 0.66% break-even
};

describe('buildActions', () => {
  describe('Category 1 (cost-plus, not surcharging)', () => {
    const actions = buildActions(1, 'Square', 'retail', CTX);

    // 3 base Cat 1 actions + 2 NPP plan actions (retail v2 → B + C,
    // both retail-conditional). NPP buckets per industry are covered
    // in the dedicated matrix block further down.
    it('returns 5 actions (3 base + 2 NPP rail for retail v2)', () => {
      expect(actions).toHaveLength(5);
    });

    it('every action has non-empty text + script + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.script).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('PSP name is interpolated into action copy', () => {
      const flat = actions.flatMap((a) => [a.text, a.script ?? '', a.why ?? '']).join(' ');
      expect(flat).toContain('Square');
    });
  });

  describe('Category 2 (flat rate, not surcharging)', () => {
    const actions = buildActions(2, 'Stripe', 'retail', CTX);

    // 3 base Cat 2 actions + 2 NPP rail actions (retail v2 → B + C)
    // = 5 total. The plan tier now carries 3 items (PSP itemised
    // quote + NPP Bucket B + NPP Bucket C).
    it('returns 5 actions (3 base + 2 NPP rail for retail v2)', () => {
      expect(actions).toHaveLength(5);
    });

    it('every action has non-empty text + script + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.script).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('first action is URGENT and asks Stripe about the rate', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[0]!.text).toMatch(/Ask Stripe/);
    });

    it('priority distribution: 1 urgent + 3 plan + 1 monitor', () => {
      const priorities = actions.map((a) => a.priority);
      expect(priorities.filter((p) => p === 'urgent')).toHaveLength(1);
      expect(priorities.filter((p) => p === 'plan')).toHaveLength(3);
      expect(priorities.filter((p) => p === 'monitor')).toHaveLength(1);
    });
  });

  describe('Category 3 (cost-plus, surcharging)', () => {
    const actions = buildActions(3, 'Tyro', 'cafe', CTX);

    it('every action has non-empty text + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('the RAO action carries a framework instead of a script', () => {
      expect(actions[0]!.framework).toBeTruthy();
      expect(actions[0]!.script).toBeFalsy();
    });

    it('non-RAO actions carry a script', () => {
      for (const action of actions.slice(1)) {
        expect(action.script).toBeTruthy();
        expect(action.framework).toBeFalsy();
      }
    });

    it('first action title says "respond to" not "replace"', () => {
      expect(actions[0]!.text).toContain('respond to');
      expect(actions[0]!.text).not.toContain('replace');
    });

    it('first action title interpolates the formatted shortfall (abs plSwing)', () => {
      // abs(-3300) → $3,300
      expect(actions[0]!.text).toContain('$3,300');
    });

    it('framework RECOVER pill uses break-even pct, not surcharge rate', () => {
      const recover = actions[0]!.framework!.levers.find((l) => l.letter === 'R')!;
      // 0.66% break-even, NOT 1.5% surcharge rate
      expect(recover.pill?.value).toContain('0.66%');
      expect(recover.pill?.value).not.toContain('1.5%');
    });

    it('framework does not prescribe pricing as the answer', () => {
      const fw = actions[0]!.framework!;
      const flat = `${fw.title} ${fw.intro} ${fw.levers.map((l) => `${l.name} ${l.condition} ${l.pill?.value ?? ''}`).join(' ')}`;
      expect(flat).not.toContain('Raise prices');
    });

    it('framework contains the three RAO lever names', () => {
      const names = actions[0]!.framework!.levers.map((l) => l.name).join(' ');
      expect(names).toContain('RECOVER');
      expect(names).toContain('ABSORB');
      expect(names).toContain('OPTIMISE');
    });

    it('PSP name is interpolated', () => {
      const flat = actions
        .flatMap((a) => [
          a.text,
          a.script ?? '',
          a.why ?? '',
          a.framework?.intro ?? '',
          ...(a.framework?.levers.map((l) => `${l.name} ${l.condition} ${l.pill?.value ?? ''}`) ?? []),
        ])
        .join(' ');
      expect(flat).toContain('Tyro');
    });
  });

  describe('Category 4 (flat rate, surcharging)', () => {
    // 'retail' picks up Bucket B + Bucket C in v2 (both retail-
    // conditional), giving 4 base Cat 4 actions + 2 NPP injections =
    // 6 total. The original 4-action shape from ux-spec §3.4 is
    // preserved among the base actions; NPP injection only adds.
    const actions = buildActions(4, 'Stripe', 'retail', CTX);

    it('returns 6 actions (4 base + 2 NPP rail for retail v2)', () => {
      expect(actions).toHaveLength(6);
    });

    it('every action has non-empty text + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('action 2 carries a framework instead of a script; others have scripts', () => {
      expect(actions[1]!.framework).toBeTruthy();
      expect(actions[1]!.script).toBeFalsy();
      // Actions 0, 2, 3, 4, 5 should still have scripts (the NPP rail
      // actions at [3] and [4] each carry their own script).
      expect(actions[0]!.script).toBeTruthy();
      expect(actions[2]!.script).toBeTruthy();
      expect(actions[3]!.script).toBeTruthy();
      expect(actions[4]!.script).toBeTruthy();
      expect(actions[5]!.script).toBeTruthy();
    });

    it('priority order: urgent, urgent, plan (itemised), plan (NPP B), plan (NPP C), monitor', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[1]!.priority).toBe('urgent');
      expect(actions[2]!.priority).toBe('plan');
      expect(actions[3]!.priority).toBe('plan');
      expect(actions[4]!.priority).toBe('plan');
      expect(actions[5]!.priority).toBe('monitor');
    });

    it('action 2 title says "respond to" with the shortfall amount', () => {
      expect(actions[1]!.text).toContain('respond to');
      expect(actions[1]!.text).toContain('$3,300');
      expect(actions[1]!.text).not.toContain('replace');
    });

    it('action 2 framework RECOVER pill uses break-even pct, not surcharge rate', () => {
      const recover = actions[1]!.framework!.levers.find((l) => l.letter === 'R')!;
      expect(recover.pill?.value).toContain('0.66%');
      expect(recover.pill?.value).not.toContain('1.5%');
    });

    it('action 2 framework does not prescribe pricing as the answer', () => {
      const fw = actions[1]!.framework!;
      const flat = `${fw.title} ${fw.intro} ${fw.levers.map((l) => `${l.name} ${l.condition} ${l.pill?.value ?? ''}`).join(' ')}`;
      expect(flat).not.toContain('Raise prices');
    });

    it('action 2 framework contains the three RAO lever names', () => {
      const names = actions[1]!.framework!.levers.map((l) => l.name).join(' ');
      expect(names).toContain('RECOVER');
      expect(names).toContain('ABSORB');
      expect(names).toContain('OPTIMISE');
    });

    it('action 3 interpolates the formatted volume', () => {
      expect(actions[2]!.script).toContain('$500,000');
    });

    it('PSP name is interpolated into every base action (NPP actions are rail-specific, not PSP-specific)', () => {
      // NPP rail actions (May 2026 brief) talk about PayID/PayTo
      // providers like Azupay + Volt — they intentionally do NOT
      // reference the merchant's primary PSP. Scope the assertion to
      // actions that aren't NPP rail items.
      const baseActions = actions.filter((a) => !a.action_id);
      for (const action of baseActions) {
        const fw = action.framework;
        const fwFlat = fw
          ? `${fw.intro} ${fw.levers.map((l) => `${l.condition} ${l.pill?.value ?? ''}`).join(' ')}`
          : '';
        const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''} ${fwFlat}`;
        expect(flat).toContain('Stripe');
      }
    });
  });

  describe('Category 5 (zero-cost EFTPOS)', () => {
    const actions = buildActions(5, 'Square', 'retail', CTX, 'zero_cost');

    it('returns 3 actions', () => {
      expect(actions).toHaveLength(3);
    });

    it('every action has non-empty text + script + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.script).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('all three actions are URGENT', () => {
      for (const action of actions) {
        expect(action.priority).toBe('urgent');
      }
    });

    it('first action asks Square what plan the merchant will be transferred to', () => {
      expect(actions[0]!.text).toMatch(/Square/);
      expect(actions[0]!.text).toMatch(/transferred/);
    });

    it('second action references the post-reform 1.4% rate', () => {
      expect(actions[1]!.script).toContain('1.4%');
    });

    it('third action interpolates Square as the benchmark provider', () => {
      expect(actions[2]!.why).toMatch(/Square/);
    });
  });

  // ── PSP-aware behaviour (M2 — credibility brief) ────────────────
  // Existing fixtures use Stripe at $500K and Square at the test
  // context — both pass their respective itemised gates, so the action
  // counts above remain stable. The cases below cover the flips.

  describe('Cat 2 — PSP-aware itemised gating', () => {
    // Helper: filter out NPP rail actions so the PSP-itemised
    // assertions stay focused on the base Cat 2 plan slot.
    const psPlan = (actions: { priority: string; action_id?: string }[]) =>
      actions.filter((a) => a.priority === 'plan' && !a.action_id);

    it('Square (offersItemisedPlan: no) replaces the quote ask with a "consider switching" action', () => {
      const actions = buildActions(2, 'Square', 'retail', CTX);
      // Exactly one base-plan action — the switching variant.
      expect(psPlan(actions)).toHaveLength(1);
      expect(psPlan(actions)[0]!.text).toContain('does not offer itemised pricing');
      // The "ask Square for a quote" copy must NOT appear.
      const flat = actions.flatMap((a) => [a.text, a.script ?? '']).join(' ');
      expect(flat).not.toMatch(/Ask Square for a quote on their itemised/i);
    });

    it('eWAY (offersItemisedPlan: gateway_only) replaces the quote ask with the "ask which acquirer" action', () => {
      const actions = buildActions(2, 'eWAY', 'retail', CTX);
      expect(psPlan(actions)).toHaveLength(1);
      expect(psPlan(actions)[0]!.text).toContain('which acquirer settles');
    });

    it('Stripe below the volume threshold suppresses the itemised quote ask entirely', () => {
      // Stripe's monthly floor is $20,833 → $250K annual. $100K annual is below.
      const lowVolumeCtx: ActionContext = { ...CTX, volume: 100_000 };
      const actions = buildActions(2, 'Stripe', 'retail', lowVolumeCtx);
      // No base-plan action — the itemised quote was suppressed and
      // there is no alternative for `volume_gated` below threshold.
      // The NPP rail action for retail (Bucket 3) is the only plan
      // item left.
      expect(psPlan(actions)).toHaveLength(0);
    });

    it('Stripe at $400K (above threshold) keeps the itemised quote ask verbatim', () => {
      const aboveVolumeCtx: ActionContext = { ...CTX, volume: 400_000 };
      const actions = buildActions(2, 'Stripe', 'retail', aboveVolumeCtx);
      expect(psPlan(actions)).toHaveLength(1);
      expect(psPlan(actions)[0]!.text).toMatch(/Ask Stripe for a quote on their itemised pricing/i);
    });
  });

  describe('Cat 1/2/4 — MSF publication action gates on RBA $10B threshold', () => {
    it('non-publishing PSPs (Square) get the RBA-published-acquirer-benchmarks variant', () => {
      const actions = buildActions(2, 'Square', 'retail', CTX);
      const monitor = actions.find((a) => a.priority === 'monitor');
      expect(monitor).toBeDefined();
      expect(monitor!.text).toMatch(/RBA-published acquirer rate benchmarks/i);
      expect(monitor!.script).toContain('$10 billion');
    });

    it('publishing PSPs (CommBank) keep the direct "published rate benchmarks" copy', () => {
      const actions = buildActions(2, 'CommBank', 'retail', CTX);
      const monitor = actions.find((a) => a.priority === 'monitor');
      expect(monitor).toBeDefined();
      expect(monitor!.text).toMatch(/Check the published rate benchmarks on 30 October/i);
      expect(monitor!.script).toContain('CommBank');
    });
  });

  // ── NPP-rail action injection v2 (NPP_RAIL_ACTIONS_BRIEF_V2.md) ──
  // Supersedes the v1 three-bucket block. New bucket structure:
  //   Bucket A (payid_async_invoice)    — hospitality, travel, other
  //   Bucket B (payid_online_checkout)  — retail (conditional), online,
  //                                       ticketing, travel
  //   Bucket C (payto_mandate)          — retail (conditional), online,
  //                                       ticketing, travel, other
  //   Cafe long-tail (monitor tier)     — cafe only

  describe('NPP-rail action injection v2 (per industry buckets)', () => {
    function actionIds(actions: { action_id?: string }[]): string[] {
      return actions.map((a) => a.action_id ?? '').filter(Boolean);
    }

    it('cafe → cafeLongTail only (monitor tier, no plan NPP)', () => {
      const actions = buildActions(2, 'Stripe', 'cafe', CTX);
      const ids = actionIds(actions);
      expect(ids).toEqual(['payid_cafe_longtail']);
      const longTail = actions.find((a) => a.action_id === 'payid_cafe_longtail');
      expect(longTail!.priority).toBe('monitor');
    });

    it('hospitality → payid_async_invoice only', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'hospitality', CTX));
      expect(ids).toEqual(['payid_async_invoice']);
    });

    it('retail → payid_online_checkout + payto_mandate (both retail-conditional)', () => {
      const actions = buildActions(2, 'Stripe', 'retail', CTX);
      const ids = actionIds(actions);
      expect(ids).toEqual(['payid_online_checkout', 'payto_mandate']);
      // Retail conditional opener must appear in BOTH scripts.
      for (const id of ids) {
        const action = actions.find((a) => a.action_id === id)!;
        expect(action.script).toContain('If your business has an online checkout');
      }
    });

    it('online → payid_online_checkout + payto_mandate (no conditional opener)', () => {
      const actions = buildActions(2, 'Stripe', 'online', CTX);
      const ids = actionIds(actions);
      expect(ids).toEqual(['payid_online_checkout', 'payto_mandate']);
      // Non-retail variant must NOT carry the retail opener.
      for (const id of ids) {
        const action = actions.find((a) => a.action_id === id)!;
        expect(action.script).not.toContain('If your business has an online checkout');
      }
    });

    it('ticketing → payid_online_checkout + payto_mandate', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'ticketing', CTX));
      expect(ids).toEqual(['payid_online_checkout', 'payto_mandate']);
    });

    it('travel → all three buckets (async invoice + online checkout + PayTo mandate)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'travel', CTX));
      expect(ids).toEqual(['payid_async_invoice', 'payid_online_checkout', 'payto_mandate']);
    });

    it('other → payid_async_invoice + payto_mandate (B2B / service shape)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'other', CTX));
      expect(ids).toEqual(['payid_async_invoice', 'payto_mandate']);
    });

    it('Cat 5 receives ZERO NPP items regardless of industry (no cafe long-tail either)', () => {
      for (const industry of ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other']) {
        const ids = actionIds(buildActions(5, 'Square', industry, CTX, 'zero_cost'));
        expect(ids).toEqual([]);
      }
    });

    it('Bucket B and C maturity caveat acknowledges the banking-app handoff', () => {
      const onlineActions = buildActions(2, 'Stripe', 'online', CTX);
      const bucketB = onlineActions.find((a) => a.action_id === 'payid_online_checkout')!;
      const bucketC = onlineActions.find((a) => a.action_id === 'payto_mandate')!;
      // Per NPP_SCRIPTS_TIGHTENING_BRIEF the exact phrasing differs
      // between the two variants — Bucket B uses "handed off to their
      // banking app", Bucket C uses "the customer approving in their
      // banking app". Common substring is "banking app" + the
      // maturity-curve sentence; assert both.
      expect(bucketB.script).toContain('banking app');
      expect(bucketC.script).toContain('banking app');
      expect(bucketB.script).toContain('maturity curve');
      expect(bucketC.script).toContain('maturity curve');
    });

    // ── NPP script tightening (May 2026 brief) ─────────────────
    // Required-phrase grep on the new copy + forbidden-phrase grep
    // on the mechanical walkthrough fragments that were removed.
    // Tests at module level (industry-agnostic) walk every emitting
    // industry × bucket combination so a regression on any single
    // variant trips.

    it('payid_async_invoice script contains the new "directly from their bank account" framing', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const a = actions.find((x) => x.action_id === 'payid_async_invoice')!;
      expect(a.script).toContain('Customers pay you directly from their bank account');
    });

    it('payid_online_checkout script contains the "real-time account-to-account" framing in both variants', () => {
      const retailA = buildActions(2, 'Stripe', 'retail', CTX).find(
        (x) => x.action_id === 'payid_online_checkout',
      )!;
      const onlineA = buildActions(2, 'Stripe', 'online', CTX).find(
        (x) => x.action_id === 'payid_online_checkout',
      )!;
      const required = 'real-time account-to-account payments via the New Payments Platform';
      expect(retailA.script).toContain(required);
      expect(onlineA.script).toContain(required);
    });

    it('payto_mandate script contains the "authorise you once" framing in both variants', () => {
      const retailC = buildActions(2, 'Stripe', 'retail', CTX).find(
        (x) => x.action_id === 'payto_mandate',
      )!;
      const onlineC = buildActions(2, 'Stripe', 'online', CTX).find(
        (x) => x.action_id === 'payto_mandate',
      )!;
      const required = 'authorise you once to charge their bank account directly';
      expect(retailC.script).toContain(required);
      expect(onlineC.script).toContain(required);
    });

    it('no NPP script contains the word "webhook" (jargon removed)', () => {
      const industries = ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other'];
      for (const industry of industries) {
        const nppActions = buildActions(2, 'Stripe', industry, CTX).filter(
          (a) => a.action_id?.startsWith('payid_') || a.action_id === 'payto_mandate',
        );
        for (const a of nppActions) {
          expect(a.script).not.toContain('webhook');
        }
      }
    });

    it('no NPP script walks through the mechanical PayID flow', () => {
      const industries = ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other'];
      for (const industry of industries) {
        const nppActions = buildActions(2, 'Stripe', industry, CTX).filter(
          (a) => a.action_id?.startsWith('payid_') || a.action_id === 'payto_mandate',
        );
        for (const a of nppActions) {
          expect(a.script).not.toContain('The customer enters their PayID alias');
          expect(a.script).not.toContain('sends a payment request that the customer approves');
          expect(a.script).not.toContain('Verification happens via banking app notifications');
        }
      }
    });

    it('cafe long-tail option lands at the BOTTOM of the action list (after existing monitors)', () => {
      const actions = buildActions(2, 'Zeller', 'cafe', CTX);
      const lastIdx = actions.length - 1;
      expect(actions[lastIdx]!.action_id).toBe('payid_cafe_longtail');
      expect(actions[lastIdx]!.priority).toBe('monitor');
    });

    it('plan-tier NPP actions land BEFORE the first monitor-priority action', () => {
      const actions = buildActions(2, 'Stripe', 'online', CTX);
      const firstMonitor = actions.findIndex((a) => a.priority === 'monitor');
      const planNppIndices = actions
        .map((a, i) => (a.action_id && a.priority === 'plan' ? i : -1))
        .filter((i) => i >= 0);
      expect(planNppIndices.length).toBeGreaterThan(0);
      for (const idx of planNppIndices) {
        if (firstMonitor !== -1) expect(idx).toBeLessThan(firstMonitor);
      }
    });

    it('no NPP provider is named anywhere in any v2 action copy', () => {
      // Every industry × every NPP action — names previously appeared
      // in v1 must NOT appear in v2.
      const forbidden = ['Azupay', 'Volt', 'Monoova', 'Zai', 'pay.com.au', 'Stripe AU'];
      for (const industry of ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other']) {
        const actions = buildActions(2, 'Stripe', industry, CTX);
        const nppActions = actions.filter((a) => a.action_id);
        for (const action of nppActions) {
          const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
          for (const name of forbidden) {
            expect(flat).not.toContain(name);
          }
        }
      }
    });

    it('every Bucket B and C action uses the generic "NPP-licensed provider" framing', () => {
      const actions = buildActions(2, 'Stripe', 'online', CTX);
      const providerActions = actions.filter(
        (a) =>
          a.action_id === 'payid_online_checkout' ||
          a.action_id === 'payto_mandate',
      );
      for (const action of providerActions) {
        const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
        expect(flat).toMatch(/NPP-licensed provider/);
      }
    });

    it('no specific cents-per-transaction figure appears in any v2 NPP action', () => {
      for (const industry of ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other']) {
        const actions = buildActions(2, 'Stripe', industry, CTX);
        const nppActions = actions.filter((a) => a.action_id);
        for (const action of nppActions) {
          const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
          expect(flat).not.toMatch(/\$0?\.\d+\s*(per|cents)/i);
          expect(flat).not.toMatch(/\b\d+\s*c\b/);
        }
      }
    });

    it('no specific conversion-impact percentage appears in any v2 NPP action', () => {
      // The maturity caveat is qualitative. Any specific % uplift /
      // drop would be false-precision.
      for (const industry of ['retail', 'online', 'ticketing', 'travel']) {
        const actions = buildActions(2, 'Stripe', industry, CTX);
        const nppActions = actions.filter((a) => a.action_id);
        for (const action of nppActions) {
          const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
          // Look for a conversion-impact phrasing with a number near it.
          expect(flat).not.toMatch(/\b\d+\s*%\s*(?:conversion|drop|uplift|increase|decrease)/i);
          expect(flat).not.toMatch(/conversion[^.]{0,40}\b\d+\s*%/i);
        }
      }
    });

    it('no mention of Amazon (or any specific merchant rollout) appears anywhere', () => {
      for (const industry of ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other']) {
        const actions = buildActions(2, 'Stripe', industry, CTX);
        const nppActions = actions.filter((a) => a.action_id);
        for (const action of nppActions) {
          const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
          expect(flat).not.toMatch(/Amazon/i);
        }
      }
    });
  });

  describe('Cat 3 — softened ACCC penalty language', () => {
    it('"why" frames enforcement as scheme rules + acquirer agreement + consumer law (not direct ACCC penalty)', () => {
      const actions = buildActions(3, 'Tyro', 'cafe', CTX);
      const verify = actions.find((a) => a.text.match(/Verify surcharging has stopped/i));
      expect(verify).toBeDefined();
      expect(verify!.why).toMatch(/scheme rules and your acquirer agreement/i);
      expect(verify!.why).toMatch(/potential ACCC action under existing consumer law/i);
      // The bare-ACCC-penalty phrasing must not reappear.
      expect(verify!.why).not.toMatch(/exposes you to ACCC penalties\./);
    });
  });

  describe('banned phrases', () => {
    it('no action across any category contains "your PSP"', () => {
      for (const cat of [1, 2, 3, 4, 5] as const) {
        const actions = buildActions(cat, 'Stripe', 'retail', CTX, cat === 5 ? 'zero_cost' : undefined);
        const flat = actions
          .flatMap((a) => [a.text, a.script ?? '', a.why ?? ''])
          .join(' ');
        expect(flat).not.toMatch(/your PSP/i);
      }
    });

    it('no action across any category contains "your provider"', () => {
      for (const cat of [1, 2, 3, 4, 5] as const) {
        const actions = buildActions(cat, 'Stripe', 'retail', CTX, cat === 5 ? 'zero_cost' : undefined);
        const flat = actions
          .flatMap((a) => [a.text, a.script ?? '', a.why ?? ''])
          .join(' ');
        expect(flat).not.toMatch(/your provider/i);
      }
    });
  });

  // PSP_OTHER_DISPLAY_FIX_BRIEF — when the merchant selects 'Other' in
  // Step 2 the raw 'Other' literal must never appear in user-facing
  // action text, script, why, or framework copy. It must be rewritten
  // to "your payment provider" via displayPspName().
  describe('PSP="Other" display substitution', () => {
    function flattenActions(
      actions: ReturnType<typeof buildActions>,
    ): string {
      return actions
        .flatMap((a) => {
          const parts: string[] = [a.text, a.script ?? '', a.why ?? ''];
          if (a.framework) {
            parts.push(a.framework.headline ?? '');
            for (const lever of a.framework.levers) {
              parts.push(lever.title ?? '');
              parts.push(lever.body ?? '');
              parts.push(lever.pill?.value ?? '');
            }
          }
          return parts;
        })
        .join(' ');
    }

    for (const cat of [1, 2, 3, 4, 5] as const) {
      describe(`Category ${cat}`, () => {
        const planType = cat === 5 ? 'zero_cost' : undefined;

        it('no rendered text contains the literal "Other" as a PSP token', () => {
          const actions = buildActions(cat, 'Other', 'retail', CTX, planType);
          const flat = flattenActions(actions);
          // Asserts the standalone token (or punctuated/possessive forms),
          // not unrelated occurrences inside common words like "other"
          // ("other words", "another"). Word-boundary + capital O.
          expect(flat).not.toMatch(/\bOther\b/);
        });

        it('rewrites the PSP name to "your payment provider"', () => {
          const actions = buildActions(cat, 'Other', 'retail', CTX, planType);
          const flat = flattenActions(actions);
          expect(flat).toContain('your payment provider');
        });

        it('regression: a known PSP still renders its raw name', () => {
          const actions = buildActions(cat, 'Stripe', 'retail', CTX, planType);
          const flat = flattenActions(actions);
          expect(flat).toContain('Stripe');
          expect(flat).not.toContain('your payment provider');
        });
      });
    }
  });
});
