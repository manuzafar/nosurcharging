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

    // 3 base Cat 1 actions + 1 NPP rail action (retail → Bucket 3
    // only). NPP buckets per industry are covered in the dedicated
    // matrix block further down.
    it('returns 4 actions (3 base + 1 NPP rail for retail)', () => {
      expect(actions).toHaveLength(4);
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

    // 3 base Cat 2 actions + 1 NPP rail action (retail → Bucket 3
    // only) = 4 total. The plan tier now carries 2 items (PSP
    // itemised quote + NPP provider-in-person).
    it('returns 4 actions (3 base + 1 NPP rail for retail)', () => {
      expect(actions).toHaveLength(4);
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

    it('priority distribution: 1 urgent + 2 plan + 1 monitor', () => {
      const priorities = actions.map((a) => a.priority);
      expect(priorities.filter((p) => p === 'urgent')).toHaveLength(1);
      expect(priorities.filter((p) => p === 'plan')).toHaveLength(2);
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
    // 'retail' picks up only Bucket 3 (provider-in-person), giving
    // 4 base Cat 4 actions + 1 NPP injection = 5 total. The original
    // 4-action shape from ux-spec §3.4 is preserved among the base
    // actions; NPP injection only adds.
    const actions = buildActions(4, 'Stripe', 'retail', CTX);

    it('returns 5 actions (4 base + 1 NPP rail for retail)', () => {
      expect(actions).toHaveLength(5);
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
      // Actions 0, 2, 3, 4 should still have scripts (the NPP rail
      // action at [3] has its own script too).
      expect(actions[0]!.script).toBeTruthy();
      expect(actions[2]!.script).toBeTruthy();
      expect(actions[3]!.script).toBeTruthy();
      expect(actions[4]!.script).toBeTruthy();
    });

    it('priority order: urgent, urgent, plan (itemised), plan (NPP), monitor', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[1]!.priority).toBe('urgent');
      expect(actions[2]!.priority).toBe('plan');
      expect(actions[3]!.priority).toBe('plan');
      expect(actions[4]!.priority).toBe('monitor');
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

  // ── NPP-rail action injection (NPP_RAIL_ACTIONS_BRIEF.md May 2026) ─
  // SUPERSEDES the M3 single-PayTo block. Three buckets gated per
  // industry × category. Bucket mapping:
  //   PayID-async       hospitality, online, ticketing, travel, other
  //   PayTo-recurring   cafe, hospitality, online, ticketing, travel, other
  //   Provider-in-person cafe, hospitality, retail

  describe('NPP-rail action injection (per industry buckets)', () => {
    function actionIds(actions: { action_id?: string }[]): string[] {
      return actions.map((a) => a.action_id ?? '').filter(Boolean);
    }

    it('cafe → payto_recurring + provider_in_person (no payid_async)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'cafe', CTX));
      expect(ids).toContain('payto_recurring');
      expect(ids).toContain('provider_in_person');
      expect(ids).not.toContain('payid_async');
    });

    it('hospitality → all three NPP buckets', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'hospitality', CTX));
      expect(ids).toEqual(
        expect.arrayContaining(['payid_async', 'payto_recurring', 'provider_in_person']),
      );
    });

    it('retail → provider_in_person only', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'retail', CTX));
      expect(ids).toEqual(['provider_in_person']);
    });

    it('online → payid_async + payto_recurring (no in-person)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'online', CTX));
      expect(ids).toContain('payid_async');
      expect(ids).toContain('payto_recurring');
      expect(ids).not.toContain('provider_in_person');
    });

    it('ticketing → payid_async + payto_recurring (no in-person)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'ticketing', CTX));
      expect(ids).toContain('payid_async');
      expect(ids).toContain('payto_recurring');
      expect(ids).not.toContain('provider_in_person');
    });

    it('travel → payid_async + payto_recurring (no in-person)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'travel', CTX));
      expect(ids).toContain('payid_async');
      expect(ids).toContain('payto_recurring');
      expect(ids).not.toContain('provider_in_person');
    });

    it('other → payid_async + payto_recurring (B2B / service businesses)', () => {
      const ids = actionIds(buildActions(2, 'Stripe', 'other', CTX));
      expect(ids).toContain('payid_async');
      expect(ids).toContain('payto_recurring');
      expect(ids).not.toContain('provider_in_person');
    });

    it('Cat 5 receives NO NPP rail actions regardless of industry', () => {
      for (const industry of ['cafe', 'hospitality', 'retail', 'online', 'ticketing', 'travel', 'other']) {
        const ids = actionIds(buildActions(5, 'Square', industry, CTX, 'zero_cost'));
        expect(ids).toEqual([]);
      }
    });

    it('every NPP action lands BEFORE the first monitor-priority action', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const firstMonitor = actions.findIndex((a) => a.priority === 'monitor');
      // Negative findIndex would mean no monitor action exists — guard
      // accordingly so the assertion is meaningful in that case.
      const nppIndices = actions
        .map((a, i) => (a.action_id ? i : -1))
        .filter((i) => i >= 0);
      expect(nppIndices.length).toBeGreaterThan(0);
      for (const idx of nppIndices) {
        if (firstMonitor !== -1) expect(idx).toBeLessThan(firstMonitor);
      }
    });

    it('Bucket 1 copy acknowledges the in-person queue-verification friction', () => {
      const actions = buildActions(2, 'Stripe', 'online', CTX);
      const payIdAsync = actions.find((a) => a.action_id === 'payid_async');
      expect(payIdAsync).toBeDefined();
      // Per brief: verification friction MUST be acknowledged honestly.
      expect(payIdAsync!.script).toContain('does NOT close the loop for in-person queue scenarios');
    });

    it('no provider is named alone (independence preserved)', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const nppActions = actions.filter((a) => a.action_id);
      for (const action of nppActions) {
        const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
        // Bucket 2 + Bucket 3 actions must list multiple providers.
        if (action.action_id === 'payto_recurring') {
          // Bucket 2 names six providers.
          expect(flat).toMatch(/Azupay/);
          expect(flat).toMatch(/Volt/);
          expect(flat).toMatch(/Monoova/);
        }
        if (action.action_id === 'provider_in_person') {
          // Bucket 3 names two providers — never just one.
          expect(flat).toMatch(/Azupay/);
          expect(flat).toMatch(/Volt/);
        }
      }
    });

    it('no specific cents-per-transaction figure appears in any NPP action', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const nppActions = actions.filter((a) => a.action_id);
      for (const action of nppActions) {
        const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
        // Pricing is volume-tiered; specific cents figures are banned.
        // Match a dollar / cent unit immediately following a number.
        expect(flat).not.toMatch(/\$0?\.\d+\s*(per|cents)/i);
        expect(flat).not.toMatch(/\b\d+\s*c\b/);
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
});
