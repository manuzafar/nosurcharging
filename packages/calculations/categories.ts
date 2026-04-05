// packages/calculations/categories.ts
// Category assignment logic. Two binary questions determine the category.
//
//                        NOT surcharging    Surcharging
//   Cost-plus plan       Category 1         Category 3
//   Flat rate plan       Category 2         Category 4

export function getCategory(
  planType: 'flat' | 'costplus',
  surcharging: boolean,
): 1 | 2 | 3 | 4 {
  if (planType === 'costplus' && !surcharging) return 1;
  if (planType === 'flat' && !surcharging) return 2;
  if (planType === 'costplus' && surcharging) return 3;
  if (planType === 'flat' && surcharging) return 4;
  throw new Error(`Invalid category inputs: planType=${planType}, surcharging=${surcharging}`);
}

export const CATEGORY_VERDICTS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Your costs fall automatically on 1 October.',
  2: 'The saving exists — but it won\'t arrive automatically.',
  3: 'Your surcharge revenue disappears on 1 October.',
  4: 'You face both challenges simultaneously.',
};
