export const SECTION_IDS = ['overview', 'actions', 'values', 'refine', 'help'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionMeta {
  id: SectionId;
  label: string;
  group: 'result' | 'understand' | 'next';
}

export const SECTIONS: SectionMeta[] = [
  { id: 'overview', label: 'Overview', group: 'result' },
  { id: 'actions', label: 'Actions', group: 'result' },
  { id: 'values', label: 'Values & rates', group: 'understand' },
  { id: 'refine', label: 'Refine estimate', group: 'understand' },
  { id: 'help', label: 'Get help', group: 'next' },
];
