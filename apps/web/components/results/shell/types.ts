export const SECTION_IDS = ['overview', 'actions', 'customers', 'negotiate', 'checklist', 'registry', 'values', 'refine', 'help'] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionMeta {
  id: SectionId;
  label: string;
  sublabel?: string;
  group: 'result' | 'prepare' | 'community' | 'understand' | 'next';
}

export const SECTIONS: SectionMeta[] = [
  { id: 'overview', label: 'Overview', sublabel: 'Verdict, metrics, problems', group: 'result' },
  { id: 'actions', label: 'Actions', sublabel: 'Prioritised steps', group: 'result' },
  { id: 'customers', label: 'Talk to customers', sublabel: 'Templates & scripts', group: 'prepare' },
  { id: 'negotiate', label: 'Negotiation brief', sublabel: 'PSP call script', group: 'prepare' },
  { id: 'checklist', label: 'Readiness checklist', sublabel: 'Track your progress', group: 'prepare' },
  { id: 'registry', label: 'PSP Rate Registry', sublabel: 'Community benchmark', group: 'community' },
  { id: 'values', label: 'Values & rates', sublabel: 'Cost breakdown', group: 'understand' },
  { id: 'refine', label: 'Refine estimate', sublabel: 'Improve accuracy', group: 'understand' },
  { id: 'help', label: 'Get help', sublabel: 'Expert consultation', group: 'next' },
];
