// React-PDF design tokens — mirror the web app's colour palette.
//
// React-PDF uses a CSS-in-JS subset: no CSS variables, no inheritance via
// className. Each Text/View needs its style passed inline or via
// StyleSheet.create(). The tokens below are duplicated from
// apps/web/app/globals.css so edits here are visible to designers
// auditing both surfaces.

import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
  paper: '#FAF7F2',
  paperDark: '#F0EBE3',
  white: '#FFFFFF',
  ink: '#1A1409',
  inkMid: '#5D5240',
  inkFaint: '#8C7C66',
  rule: '#DDD5C8',
  ruleSoft: '#E8E0D2',
  accent: '#1A6B5A',
  accentLight: '#EBF6F3',
  accentBorder: '#72C4B0',
  red: '#791F1F',
  redLight: '#FCEBEB',
  amber: '#BA7517',
  amberLight: '#FAEEDA',
  em: '#1A6B5A',
  emLight: '#EBF6F3',
} as const;

export const FONT_SIZES = {
  hero: 36,
  pageTitle: 18,
  sectionTitle: 13,
  body: 10,
  small: 9,
  caption: 8.5,
} as const;

export const SPACING = {
  page: 36,
  sectionGap: 22,
  paragraphGap: 8,
} as const;

// Shared StyleSheet — most sections compose from these atoms.
export const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    paddingTop: SPACING.page,
    paddingBottom: SPACING.page + 28, // leave room for footer
    paddingLeft: SPACING.page,
    paddingRight: SPACING.page,
    fontFamily: 'Helvetica',
    color: COLORS.ink,
  },
  // Page footer — pinned to the bottom on every page.
  footer: {
    position: 'absolute',
    bottom: SPACING.page - 10,
    left: SPACING.page,
    right: SPACING.page,
    fontSize: 8,
    color: COLORS.inkFaint,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.rule,
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
  // Section heading.
  sectionTitle: {
    fontSize: FONT_SIZES.sectionTitle,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.ink,
    marginBottom: 12,
  },
  // Plain body paragraph.
  body: {
    fontSize: FONT_SIZES.body,
    lineHeight: 1.55,
    color: COLORS.inkMid,
    marginBottom: SPACING.paragraphGap,
  },
  // Eyebrow / label.
  eyebrow: {
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: COLORS.inkFaint,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  // Coloured pill — use with situationPill / a custom backgroundColor.
  pill: {
    alignSelf: 'flex-start',
    fontSize: FONT_SIZES.caption,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  // Mono block — used for P&L numbers + dates.
  mono: {
    fontFamily: 'Courier-Bold',
  },
  // A horizontal hairline.
  hairline: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.rule,
    borderTopStyle: 'solid',
    marginTop: 12,
    marginBottom: 12,
  },
});

// Situation pill colour pairs — match the web SITUATION_PILLS map.
export function situationPillStyle(category: 1 | 2 | 3 | 4 | 5): {
  backgroundColor: string;
  color: string;
} {
  switch (category) {
    case 1:
      return { backgroundColor: COLORS.emLight, color: COLORS.em };
    case 2:
      return { backgroundColor: COLORS.amberLight, color: COLORS.amber };
    case 3:
    case 4:
    case 5:
      return { backgroundColor: COLORS.redLight, color: COLORS.red };
  }
}
