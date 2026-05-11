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

    it('PSP name is interpolated into action copy', () => {
      const flat = actions.flatMap((a) => [a.text, a.script ?? '', a.why ?? '']).join(' ');
      expect(flat).toContain('Square');
    });
  });

  describe('Category 2 (flat rate, not surcharging)', () => {
    const actions = buildActions(2, 'Stripe', 'retail', CTX);

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

    it('first action is URGENT and asks Stripe about the rate', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[0]!.text).toMatch(/Ask Stripe/);
    });

    it('contains exactly one action of each priority', () => {
      const priorities = actions.map((a) => a.priority);
      expect(priorities.filter((p) => p === 'urgent')).toHaveLength(1);
      expect(priorities.filter((p) => p === 'plan')).toHaveLength(1);
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
    // 'retail' chosen so PayTo injection (introduced M3) doesn't expand
    // the action list. PayTo's industry-conditional injection is
    // covered by its own dedicated test block below.
    const actions = buildActions(4, 'Stripe', 'retail', CTX);

    it('returns 4 actions per ux-spec §3.4', () => {
      expect(actions).toHaveLength(4);
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
      // Actions 0, 2, 3 should still have scripts
      expect(actions[0]!.script).toBeTruthy();
      expect(actions[2]!.script).toBeTruthy();
      expect(actions[3]!.script).toBeTruthy();
    });

    it('first two actions are URGENT, third is PLAN, fourth is MONITOR', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[1]!.priority).toBe('urgent');
      expect(actions[2]!.priority).toBe('plan');
      expect(actions[3]!.priority).toBe('monitor');
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

    it('PSP name is interpolated into every action', () => {
      for (const action of actions) {
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
    it('Square (offersItemisedPlan: no) replaces the quote ask with a "consider switching" action', () => {
      const actions = buildActions(2, 'Square', 'retail', CTX);
      const planActions = actions.filter((a) => a.priority === 'plan');
      // Should contain exactly one plan action — the switching variant.
      expect(planActions).toHaveLength(1);
      expect(planActions[0]!.text).toContain('does not offer itemised pricing');
      // The "ask Square for a quote" copy must NOT appear.
      const flat = actions.flatMap((a) => [a.text, a.script ?? '']).join(' ');
      expect(flat).not.toMatch(/Ask Square for a quote on their itemised/i);
    });

    it('eWAY (offersItemisedPlan: gateway_only) replaces the quote ask with the "ask which acquirer" action', () => {
      const actions = buildActions(2, 'eWAY', 'retail', CTX);
      const planActions = actions.filter((a) => a.priority === 'plan');
      expect(planActions).toHaveLength(1);
      expect(planActions[0]!.text).toContain('which acquirer settles');
    });

    it('Stripe below the volume threshold suppresses the itemised quote ask entirely', () => {
      // Stripe's monthly floor is $20,833 → $250K annual. $100K annual is below.
      const lowVolumeCtx: ActionContext = { ...CTX, volume: 100_000 };
      const actions = buildActions(2, 'Stripe', 'retail', lowVolumeCtx);
      // Cat 2 normally returns 3 actions (urgent, plan, monitor). With the
      // itemised quote suppressed there is no plan-tier action left.
      expect(actions.filter((a) => a.priority === 'plan')).toHaveLength(0);
      expect(actions).toHaveLength(2);
    });

    it('Stripe at $400K (above threshold) keeps the itemised quote ask verbatim', () => {
      const aboveVolumeCtx: ActionContext = { ...CTX, volume: 400_000 };
      const actions = buildActions(2, 'Stripe', 'retail', aboveVolumeCtx);
      const planActions = actions.filter((a) => a.priority === 'plan');
      expect(planActions).toHaveLength(1);
      expect(planActions[0]!.text).toMatch(/Ask Stripe for a quote on their itemised pricing/i);
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

  describe('PayID/PayTo action injection (M3 — credibility brief Section 4)', () => {
    it('Cat 2 + hospitality industry gets the PayTo action in the plan tier', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const payTo = actions.find((a) => a.text.includes('PayID/PayTo'));
      expect(payTo).toBeDefined();
      expect(payTo!.priority).toBe('plan');
      expect(payTo!.script).toContain('Azupay');
    });

    it('Cat 2 + retail does NOT get the PayTo action (walk-in heavy)', () => {
      const actions = buildActions(2, 'Stripe', 'retail', CTX);
      expect(actions.find((a) => a.text.includes('PayID/PayTo'))).toBeUndefined();
    });

    it('Cat 4 + online retail gets the PayTo action', () => {
      const actions = buildActions(4, 'Stripe', 'online', CTX);
      const payTo = actions.find((a) => a.text.includes('PayID/PayTo'));
      expect(payTo).toBeDefined();
      expect(payTo!.priority).toBe('plan');
    });

    it('Cat 5 never gets the PayTo action (higher-priority problems)', () => {
      const actions = buildActions(5, 'Square', 'hospitality', CTX, 'zero_cost');
      expect(actions.find((a) => a.text.includes('PayID/PayTo'))).toBeUndefined();
    });

    it('PayTo action lands BEFORE the monitor tier (so it sits in the plan block)', () => {
      const actions = buildActions(2, 'Stripe', 'hospitality', CTX);
      const payToIdx = actions.findIndex((a) => a.text.includes('PayID/PayTo'));
      const firstMonitorIdx = actions.findIndex((a) => a.priority === 'monitor');
      expect(payToIdx).toBeGreaterThanOrEqual(0);
      expect(payToIdx).toBeLessThan(firstMonitorIdx);
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
