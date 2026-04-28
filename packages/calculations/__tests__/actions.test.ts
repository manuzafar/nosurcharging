// packages/calculations/__tests__/actions.test.ts
// Asserts the action builder produces the spec-conformant shape:
//   • All actions have script + why for every category
//   • PSP name is interpolated into both text and script
//   • $X surcharge revenue + rate% interpolation works for Cat 3 and Cat 4
//   • No banned phrases ("your PSP", "your provider")

import { describe, expect, it } from 'vitest';
import { buildActions } from '../actions';
import type { ActionContext } from '../types';

const CTX: ActionContext = {
  volume: 500_000,
  surchargeRate: 0.015, // 1.5%
  surchargeRevenue: 7_500,
  icSaving: 4_200,
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

    it('every action has non-empty text + script + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.script).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('first action references the formatted surcharge revenue', () => {
      expect(actions[0]!.text).toContain('$7,500');
    });

    it('first action script references the formatted rate %', () => {
      expect(actions[0]!.script).toContain('1.5%');
    });

    it('PSP name is interpolated', () => {
      const flat = actions.flatMap((a) => [a.text, a.script ?? '', a.why ?? '']).join(' ');
      expect(flat).toContain('Tyro');
    });
  });

  describe('Category 4 (flat rate, surcharging)', () => {
    const actions = buildActions(4, 'Stripe', 'hospitality', CTX);

    it('returns 4 actions per ux-spec §3.4', () => {
      expect(actions).toHaveLength(4);
    });

    it('every action has non-empty text + script + why', () => {
      for (const action of actions) {
        expect(action.text).toBeTruthy();
        expect(action.script).toBeTruthy();
        expect(action.why).toBeTruthy();
      }
    });

    it('first two actions are URGENT, third is PLAN, fourth is MONITOR', () => {
      expect(actions[0]!.priority).toBe('urgent');
      expect(actions[1]!.priority).toBe('urgent');
      expect(actions[2]!.priority).toBe('plan');
      expect(actions[3]!.priority).toBe('monitor');
    });

    it('action 2 interpolates $7,500 surcharge revenue and 1.5% rate', () => {
      expect(actions[1]!.text).toContain('$7,500');
      expect(actions[1]!.script).toContain('1.5%');
      expect(actions[1]!.script).toContain('$7,500');
    });

    it('action 3 interpolates the formatted volume', () => {
      expect(actions[2]!.script).toContain('$500,000');
    });

    it('PSP name is interpolated into every action', () => {
      for (const action of actions) {
        const flat = `${action.text} ${action.script ?? ''} ${action.why ?? ''}`;
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
