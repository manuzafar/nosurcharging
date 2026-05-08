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
    const actions = buildActions(4, 'Stripe', 'hospitality', CTX);

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
