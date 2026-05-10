// React-PDF report generator for the Ruthless Cut M3 artifact handoff.
//
// Public entry: `generateReportPdf(args)` returns a Buffer suitable for
// attaching to a Resend email. All 9 sections per
// docs/design/RESULTS_RUTHLESS_CUT_BRIEF.md §7 render in a single
// Document. Cat-aware variants follow the brief: Cat 1 is shorter
// (no surcharge content); Cat 5 carries the zero-cost story.
//
// React-PDF runs in Node — this module must NEVER be imported from a
// client component. The single consumer is `apps/web/actions/sendReportEmail.ts`.

/* eslint-disable react/no-unescaped-entities */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import type { ReactElement } from 'react';
import type {
  AssessmentOutputs,
  ActionItem,
  ResolutionTrace,
} from '@nosurcharging/calculations/types';
import { CATEGORY_VERDICTS } from '@nosurcharging/calculations/categories';
import { AU_REFORM_DATES } from '@nosurcharging/calculations/constants/au';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  styles as base,
  situationPillStyle,
} from './styles';
import {
  getPspContact,
  getCustomerTemplates,
  getTensionItems,
  getCat5TensionBody,
} from './data';

// ── Public entry ────────────────────────────────────────────────

export interface GenerateReportArgs {
  outputs: AssessmentOutputs;
  actions: ActionItem[];
  pspName: string;
  volume: number;
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost';
  msfRate: number;
  surcharging: boolean;
  industry: string;
  resolutionTrace: ResolutionTrace;
}

export async function generateReportPdf(
  args: GenerateReportArgs,
): Promise<Buffer> {
  const buffer = await renderToBuffer(<Report {...args} />);
  return buffer;
}

// ── Helpers ─────────────────────────────────────────────────────

function fmtDollar(v: number): string {
  return '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function fmtSignedDollar(v: number): string {
  if (v === 0) return '$0';
  return (v > 0 ? '+' : '−') + '$' + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function fmtPct(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits)}%`;
}

function fmtVolumeShort(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `$${m >= 10 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return fmtDollar(v);
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtToday(): string {
  return new Date().toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function planLabel(
  planType: 'flat' | 'costplus' | 'blended' | 'zero_cost',
): string {
  switch (planType) {
    case 'flat':
      return 'flat-rate';
    case 'costplus':
      return 'cost-plus (interchange-plus)';
    case 'blended':
      return 'blended-rate';
    case 'zero_cost':
      return 'zero-cost EFTPOS';
  }
}

// ── Report layout ───────────────────────────────────────────────

interface ReportProps extends GenerateReportArgs {}

function Report(props: ReportProps): ReactElement {
  const { outputs } = props;
  const category = outputs.category;
  const isSurcharging = category === 3 || category === 4 || category === 5;
  const isCostPlus5 = category === 5; // zero-cost story
  void isCostPlus5;

  return (
    <Document
      title={`No Surcharging report — Category ${category}`}
      author="nosurcharging.com.au"
      subject="RBA October 2026 surcharge reform — personalised assessment"
    >
      {/* Page 1 — Cover + Situation */}
      <Page size="A4" style={base.page}>
        <Cover {...props} />
        <View style={{ marginTop: SPACING.sectionGap }} />
        <Situation {...props} />
        <Footer pageLabel="1" />
      </Page>

      {/* Page 2 — Numbers + Action plan opening */}
      <Page size="A4" style={base.page}>
        <Numbers {...props} />
        <View style={{ marginTop: SPACING.sectionGap }} />
        <ActionPlan {...props} />
        <Footer pageLabel="2" />
      </Page>

      {/* Page 3 — Repricing (Cat 3/4/5 only) + Talk to PSP */}
      {isSurcharging ? (
        <Page size="A4" style={base.page}>
          <Repricing {...props} />
          <View style={{ marginTop: SPACING.sectionGap }} />
          <TalkToPsp {...props} />
          <Footer pageLabel="3" />
        </Page>
      ) : (
        <Page size="A4" style={base.page}>
          <TalkToPsp {...props} />
          <Footer pageLabel="3" />
        </Page>
      )}

      {/* Page 4 — Talk to customers (templates) */}
      <Page size="A4" style={base.page}>
        <TalkToCustomers category={category} />
        <Footer pageLabel="4" />
      </Page>

      {/* Page 5 — Reform timeline + Assumptions + Quiet upsell */}
      <Page size="A4" style={base.page}>
        <Timeline />
        <View style={{ marginTop: SPACING.sectionGap }} />
        <Assumptions {...props} />
        <View style={{ marginTop: SPACING.sectionGap }} />
        <QuietUpsell />
        <Footer pageLabel="5" />
      </Page>
    </Document>
  );
}

// ── Section: Cover ──────────────────────────────────────────────

function Cover({
  outputs,
  pspName,
  volume,
  planType,
  msfRate,
  surcharging,
}: ReportProps): ReactElement {
  const category = outputs.category;
  const verdict = CATEGORY_VERDICTS[category];
  const pillStyle = situationPillStyle(category);
  const plSwingColor =
    outputs.plSwing < 0
      ? COLORS.red
      : outputs.plSwing > 0
        ? COLORS.em
        : COLORS.inkMid;

  const preparedFor = [
    `${fmtVolumeShort(volume)} annual card revenue`,
    `${pspName} ${planLabel(planType)}`,
    planType !== 'zero_cost' ? `at ${fmtPct(msfRate, 2)}` : null,
    surcharging ? 'currently surcharging' : 'not currently surcharging',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View>
      <View style={[base.pill, pillStyle]}>
        <Text>Situation {category}</Text>
      </View>

      <Text
        style={{
          fontSize: FONT_SIZES.pageTitle,
          fontFamily: 'Times-Bold',
          marginTop: 14,
          color: COLORS.ink,
          lineHeight: 1.35,
        }}
      >
        {verdict}
      </Text>

      <Text
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: COLORS.inkFaint,
          marginTop: 18,
          marginBottom: 4,
        }}
      >
        Estimated annual P&L impact from October 2026
      </Text>

      <Text
        style={[
          base.mono,
          {
            fontSize: FONT_SIZES.hero,
            color: plSwingColor,
            letterSpacing: -0.5,
          },
        ]}
      >
        {fmtSignedDollar(outputs.plSwing)}
      </Text>

      <View
        style={{
          marginTop: 18,
          paddingTop: 12,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.rule,
          borderTopStyle: 'solid',
        }}
      >
        <Text style={base.eyebrow}>Prepared for</Text>
        <Text style={[base.body, { marginBottom: 2 }]}>{preparedFor}</Text>
        <Text style={{ fontSize: 9, color: COLORS.inkFaint }}>
          Generated {fmtToday()} · nosurcharging.com.au
        </Text>
      </View>
    </View>
  );
}

// ── Section: The situation ──────────────────────────────────────

function Situation({ outputs, pspName }: ReportProps): ReactElement {
  const category = outputs.category;
  const body = getCategoryBody(category, pspName);

  return (
    <View>
      <Text style={base.sectionTitle}>The situation</Text>
      <Text style={base.body}>{body}</Text>

      {(category === 3 || category === 4) &&
        getTensionItems(category, pspName).map((it, i) => (
          <View
            key={i}
            style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}
          >
            <Text
              style={{
                fontSize: 11,
                color: it.direction === 'good' ? COLORS.em : COLORS.red,
                fontFamily: 'Helvetica-Bold',
                width: 12,
              }}
            >
              {it.direction === 'good' ? '↘' : '↗'}
            </Text>
            <Text style={[base.body, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontFamily: 'Helvetica-Bold', color: COLORS.ink }}>
                {it.lead}
              </Text>{' '}
              {it.body}
            </Text>
          </View>
        ))}

      {category === 5 && (
        <Text style={base.body}>
          {getCat5TensionBody(pspName, fmtDollar(outputs.plSwing))}
        </Text>
      )}
    </View>
  );
}

function getCategoryBody(category: 1 | 2 | 3 | 4 | 5, psp: string): string {
  switch (category) {
    case 1:
      return `Your cost-plus plan means interchange savings flow to you automatically on 1 October. No action is needed to capture the saving — it will appear on your next ${psp} statement after the reform date. You should still verify this with ${psp} in writing before October.`;
    case 2:
      return `The interchange saving exists, but whether you see it depends on ${psp}. On a flat rate, ${psp} could absorb the full saving and keep your rate unchanged. You need to ask them directly — and get it in writing — whether they will pass through the saving.`;
    case 3:
      return `Your surcharge revenue on Visa, Mastercard, and eftpos disappears on 1 October. The interchange saving on your cost-plus plan offsets only a fraction of that lost revenue. How you respond — through pricing, absorbing the cost from margin, or optimising your payment setup — depends on your gross margin and competitive position.`;
    case 4:
      return `You face two challenges simultaneously: your surcharge revenue disappears, and your flat rate may not pass the interchange saving through to you. Before deciding how to respond, confirm with ${psp} what your actual rate will look like after October — the answer changes your real exposure.`;
    case 5:
      return `You currently pay $0 for card acceptance — your customers cover it through the surcharge ${psp} adds at the terminal. From 1 October, that surcharge cannot apply to Visa, Mastercard, or eftpos. ${psp} will move you to a standard flat-rate plan, and you'll pay for card acceptance from your own margin for the first time.`;
  }
}

// ── Section: The numbers (line-item table) ──────────────────────

function Numbers({ outputs, planType }: ReportProps): ReactElement {
  const isCostPlus = planType === 'costplus';
  const isZero = planType === 'zero_cost';

  // Compute today vs Oct 2026 line items.
  const todayMargin = outputs.todayMargin ?? 0;
  const todayInterchange = outputs.todayInterchange ?? 0;
  const todayScheme = outputs.todayScheme ?? 0;
  const surchargeRevenue = outputs.surchargeRevenue ?? 0;
  const annualMSF = outputs.annualMSF ?? 0;
  const grossCOA = outputs.grossCOA ?? 0;

  const rows: { label: string; today: number; oct: number }[] = [];
  if (isCostPlus) {
    rows.push({
      label: 'Interchange',
      today: todayInterchange,
      oct: todayInterchange - outputs.icSaving,
    });
    rows.push({ label: 'Scheme fees', today: todayScheme, oct: outputs.oct2026Scheme });
    rows.push({ label: 'PSP margin', today: todayMargin, oct: todayMargin });
    rows.push({ label: 'Gross cost of acceptance', today: grossCOA, oct: outputs.octNet });
  } else if (isZero) {
    rows.push({ label: 'Card acceptance cost (today)', today: 0, oct: outputs.octNet });
    rows.push({ label: 'Surcharge mechanism', today: 0, oct: 0 });
  } else {
    rows.push({ label: 'MSF (annual)', today: annualMSF, oct: outputs.octNet });
    rows.push({ label: 'Of which: scheme fees (unchanged)', today: todayScheme, oct: outputs.oct2026Scheme });
  }
  if (surchargeRevenue > 0) {
    rows.push({
      label: 'Surcharge revenue (recovered today)',
      today: surchargeRevenue,
      oct: 0,
    });
  }
  rows.push({
    label: 'Net cost (after surcharge)',
    today: outputs.netToday,
    oct: outputs.octNet,
  });

  return (
    <View>
      <Text style={base.sectionTitle}>The numbers</Text>
      <Text style={[base.body, { marginBottom: 14 }]}>
        Annual figures based on the inputs you provided. The table below
        tracks each component from today to 1 October 2026.
      </Text>

      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 6,
          borderBottomWidth: 0.5,
          borderBottomColor: COLORS.ink,
          borderBottomStyle: 'solid',
        }}
      >
        <Text style={[tableHeader, { flex: 2 }]}>Component</Text>
        <Text style={[tableHeader, { flex: 1, textAlign: 'right' }]}>Today</Text>
        <Text style={[tableHeader, { flex: 1, textAlign: 'right' }]}>1 Oct 2026</Text>
        <Text style={[tableHeader, { flex: 1, textAlign: 'right' }]}>Change</Text>
      </View>

      {rows.map((row, i) => {
        const change = row.oct - row.today;
        const colour = change === 0 ? COLORS.inkFaint : change > 0 ? COLORS.red : COLORS.em;
        return (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              paddingVertical: 6,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.ruleSoft,
              borderBottomStyle: 'solid',
            }}
          >
            <Text style={[tableCell, { flex: 2 }]}>{row.label}</Text>
            <Text style={[tableCellMono, { flex: 1, textAlign: 'right' }]}>{fmtDollar(row.today)}</Text>
            <Text style={[tableCellMono, { flex: 1, textAlign: 'right' }]}>{fmtDollar(row.oct)}</Text>
            <Text style={[tableCellMono, { flex: 1, textAlign: 'right', color: colour }]}>
              {change === 0 ? '—' : (change > 0 ? '+' : '−') + fmtDollar(change)}
            </Text>
          </View>
        );
      })}

      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.ink,
          borderTopStyle: 'solid',
          marginTop: 6,
        }}
      >
        <Text style={[tableHeader, { flex: 2 }]}>Net P&L impact</Text>
        <Text style={[tableHeader, { flex: 3, textAlign: 'right', color: outputs.plSwing < 0 ? COLORS.red : COLORS.em }]}>
          {fmtSignedDollar(outputs.plSwing)} from 1 October 2026
        </Text>
      </View>
    </View>
  );
}

const tableHeader = StyleSheet.create({
  cell: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COLORS.ink,
  },
}).cell;

const tableCell = StyleSheet.create({
  cell: { fontSize: 10, color: COLORS.inkMid },
}).cell;

const tableCellMono = StyleSheet.create({
  cell: {
    fontSize: 10,
    fontFamily: 'Courier',
    color: COLORS.inkMid,
  },
}).cell;

// ── Section: Action plan ────────────────────────────────────────

function ActionPlan({ outputs, actions, pspName }: ReportProps): ReactElement {
  const sorted = [...actions].sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  return (
    <View>
      <Text style={base.sectionTitle}>Your action plan</Text>
      <Text style={[base.body, { marginBottom: 14 }]}>
        Steps in priority order. Each carries the exact words to say to{' '}
        {pspName} or your customers.
      </Text>

      {sorted.map((action, i) => (
        <ActionRow key={i} number={i + 1} action={action} />
      ))}

      {/* Trailing OCT 2026 marker */}
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          marginTop: 8,
          paddingTop: 10,
          borderTopWidth: 0.5,
          borderTopColor: COLORS.rule,
          borderTopStyle: 'solid',
        }}
      >
        <View
          style={{
            backgroundColor: COLORS.ink,
            color: COLORS.white,
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: COLORS.white, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>OCT</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 9, color: COLORS.ink, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Deadline · 1 October 2026
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.inkMid, marginTop: 3 }}>
            Reform takes effect — surcharge ban applies; net P&L impact{' '}
            {fmtSignedDollar(outputs.plSwing)}.
          </Text>
        </View>
      </View>
    </View>
  );
}

function priorityRank(p: ActionItem['priority']): number {
  return p === 'urgent' ? 0 : p === 'plan' ? 1 : 2;
}

function ActionRow({
  number,
  action,
}: {
  number: number;
  action: ActionItem;
}): ReactElement {
  const tier = action.priority;
  const tierColour =
    tier === 'urgent' ? COLORS.red : tier === 'plan' ? COLORS.amber : COLORS.inkFaint;

  return (
    <View style={{ marginBottom: 14, flexDirection: 'row', gap: 12 }}>
      <View
        style={{
          backgroundColor: tierColour,
          width: 24,
          height: 24,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Text style={{ color: COLORS.white, fontSize: 11, fontFamily: 'Helvetica-Bold' }}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: tierColour,
            fontFamily: 'Helvetica-Bold',
            marginBottom: 2,
          }}
        >
          {tier} · {action.timeAnchor}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.ink, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
          {action.text}
        </Text>
        {action.why && (
          <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.55, marginBottom: 4 }}>
            {action.why}
          </Text>
        )}
        {action.script && (
          <View
            style={{
              backgroundColor: COLORS.paperDark,
              borderLeftWidth: 2,
              borderLeftColor: COLORS.accentBorder,
              borderLeftStyle: 'solid',
              paddingVertical: 8,
              paddingHorizontal: 10,
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Exact script
            </Text>
            <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.55, fontStyle: 'italic' }}>
              {action.script}
            </Text>
          </View>
        )}
        {action.framework && (
          <View
            style={{
              backgroundColor: COLORS.paperDark,
              borderRadius: 6,
              padding: 10,
              marginTop: 6,
            }}
          >
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 6 }}>
              {action.framework.title}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.inkMid, lineHeight: 1.55, marginBottom: 8 }}>
              {action.framework.intro}
            </Text>
            {action.framework.levers.map((lever) => (
              <View key={lever.letter} style={{ marginTop: 4, marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.ink }}>
                  {lever.letter} · {lever.name}
                </Text>
                <Text style={{ fontSize: 9, color: COLORS.inkMid, lineHeight: 1.55 }}>
                  {lever.condition}
                </Text>
                {lever.pill && (
                  <Text
                    style={{
                      fontSize: 8.5,
                      color: COLORS.em,
                      fontFamily: 'Helvetica-Bold',
                      marginTop: 2,
                    }}
                  >
                    {lever.pill.label}: {lever.pill.value}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Section: If you reprice (Cat 3/4/5 only) ────────────────────

function Repricing({ outputs, volume }: ReportProps): ReactElement {
  const shortfall = Math.abs(outputs.plSwing);
  const breakEvenPct = volume > 0 ? (shortfall / volume) * 100 : 0;
  const recoverAt1pct = volume * 0.01;
  const recoverAt15pct = volume * 0.015;

  return (
    <View>
      <Text style={base.sectionTitle}>If you reprice</Text>
      <Text style={[base.body, { marginBottom: 12 }]}>
        Three reference points for a price-increase decision. Break-even is
        the uplift on card-paying revenue that fully offsets your shortfall.
      </Text>

      <View
        style={{
          backgroundColor: COLORS.paperDark,
          borderRadius: 8,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 4 }}>
          Break-even ({breakEvenPct.toFixed(2)}%)
        </Text>
        <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.55 }}>
          A {breakEvenPct.toFixed(2)}% increase across your card-paying revenue fully recovers the {fmtDollar(shortfall)} shortfall. Right if your gross margin is below 20% or competitors face the same October change.
        </Text>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 12, marginBottom: 4 }}>
          Scenario A — 1.0% increase
        </Text>
        <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.55 }}>
          Recovers approximately {fmtDollar(recoverAt1pct)} per year. Leaves a residual gap of {fmtSignedDollar(recoverAt1pct - shortfall)} — absorb from margin or close via OPTIMISE.
        </Text>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 12, marginBottom: 4 }}>
          Scenario B — 1.5% increase
        </Text>
        <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.55 }}>
          Recovers approximately {fmtDollar(recoverAt15pct)} per year. {recoverAt15pct >= shortfall ? `Surplus of ${fmtSignedDollar(recoverAt15pct - shortfall)} buffers card-mix risk.` : `Still short of ${fmtSignedDollar(shortfall - recoverAt15pct)} — combine with margin absorption.`}
        </Text>
      </View>

      <Text style={[base.body, { marginTop: 12, fontSize: 9, color: COLORS.inkFaint }]}>
        These figures assume you raise prices uniformly across all card-paying
        transactions. A tiered price increase (e.g. only on credit-card customers)
        is illegal under the surcharge ban — pricing must be the same regardless
        of payment method.
      </Text>
    </View>
  );
}

// ── Section: Talk to {psp} ──────────────────────────────────────

function TalkToPsp({ pspName, volume, planType }: ReportProps): ReactElement {
  const contact = getPspContact(pspName);
  const script =
    planType === 'zero_cost'
      ? `"I process ${fmtVolumeShort(volume)} annually on ${pspName}'s zero-cost EFTPOS plan. The surcharge mechanism that covers my card costs ends on 1 October when the RBA's surcharge ban takes effect. Which plan will I be transferred to, and what will my effective rate be? I need a written quote before October so I can plan cash flow and compare alternatives."`
      : `"I process ${fmtVolumeShort(volume)} annually on a ${planLabel(planType)} plan with ${pspName}. With the RBA's interchange cuts taking effect on 1 October, I'd like to understand how my rates will change. Can you confirm whether the IC reduction will be passed through to me, and what my new effective rate will be?"`;

  return (
    <View>
      <Text style={base.sectionTitle}>Talk to {pspName}</Text>

      <View
        style={{
          backgroundColor: COLORS.accentLight,
          borderRadius: 8,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.accent, marginBottom: 6 }}>
          {pspName} contact
        </Text>
        <Text style={[contactLine]}>
          <Text style={contactLabel}>Channel: </Text>
          {contact.channel}
        </Text>
        <Text style={contactLine}>
          <Text style={contactLabel}>How: </Text>
          {contact.instructions}
        </Text>
        {contact.hours && (
          <Text style={contactLine}>
            <Text style={contactLabel}>Hours: </Text>
            {contact.hours}
          </Text>
        )}
        {contact.phone && (
          <Text style={contactLine}>
            <Text style={contactLabel}>Phone: </Text>
            {contact.phone}
          </Text>
        )}
      </View>

      <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
        Exact script
      </Text>
      <View
        style={{
          backgroundColor: COLORS.paperDark,
          borderLeftWidth: 2,
          borderLeftColor: COLORS.accentBorder,
          borderLeftStyle: 'solid',
          paddingVertical: 10,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ fontSize: 10, color: COLORS.inkMid, lineHeight: 1.6, fontStyle: 'italic' }}>
          {script}
        </Text>
      </View>
    </View>
  );
}

const contactLine = StyleSheet.create({ x: { fontSize: 10, color: COLORS.accent, marginBottom: 3 } }).x;
const contactLabel = StyleSheet.create({ x: { fontFamily: 'Helvetica-Bold' } }).x;

// ── Section: Talk to your customers ─────────────────────────────

function TalkToCustomers({ category }: { category: 1 | 2 | 3 | 4 | 5 }): ReactElement {
  const templates = getCustomerTemplates(category);
  return (
    <View>
      <Text style={base.sectionTitle}>Talk to your customers</Text>
      <Text style={[base.body, { marginBottom: 14 }]}>
        Four ready-made templates. Replace [YOUR BUSINESS] with your trading name.
      </Text>
      {templates.map((t, i) => (
        <View
          key={i}
          style={{
            marginBottom: 14,
            paddingTop: i === 0 ? 0 : 12,
            borderTopWidth: i === 0 ? 0 : 0.5,
            borderTopColor: COLORS.ruleSoft,
            borderTopStyle: 'solid',
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 6 }}>
            {t.title}
          </Text>
          <Text style={{ fontSize: 9, color: COLORS.inkMid, lineHeight: 1.6 }}>
            {t.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Section: Reform timeline ────────────────────────────────────

function Timeline(): ReactElement {
  const rows: { date: string; label: string; description: string }[] = [
    {
      date: fmtDate(AU_REFORM_DATES.surchargeBan),
      label: 'Surcharge ban + interchange caps',
      description:
        'Visa, Mastercard, eftpos surcharges illegal. Domestic interchange caps drop.',
    },
    {
      date: fmtDate(AU_REFORM_DATES.msfPublication),
      label: 'MSF benchmarks published',
      description:
        'Large processors must publish their average merchant service fees.',
    },
    {
      date: fmtDate(AU_REFORM_DATES.passThroughReport),
      label: 'RBA pass-through report',
      description:
        'RBA reports how much of the saving actually reached merchants.',
    },
    {
      date: fmtDate(AU_REFORM_DATES.foreignCardCap),
      label: 'Foreign card IC cap',
      description: 'Foreign card interchange capped at 1.0%.',
    },
  ];

  return (
    <View>
      <Text style={base.sectionTitle}>Reform timeline</Text>
      {rows.map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            paddingVertical: 8,
            borderBottomWidth: i === rows.length - 1 ? 0 : 0.5,
            borderBottomColor: COLORS.ruleSoft,
            borderBottomStyle: 'solid',
            gap: 12,
          }}
        >
          <Text
            style={[
              base.mono,
              { fontSize: 10, color: COLORS.ink, width: 95 },
            ]}
          >
            {r.date}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 2 }}>
              {r.label}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.inkMid, lineHeight: 1.5 }}>
              {r.description}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Section: Assumptions ────────────────────────────────────────

function Assumptions({
  outputs,
  resolutionTrace,
  pspName,
  msfRate,
  industry,
}: ReportProps): ReactElement {
  return (
    <View>
      <Text style={base.sectionTitle}>How we calculated this</Text>
      <Text style={[base.body, { marginBottom: 12 }]}>
        Every figure in this report is built from the inputs you provided plus
        regulatory constants from the Reserve Bank of Australia's Conclusions
        Paper (March 2026) on retail payments reform.
      </Text>

      <View
        style={{
          backgroundColor: COLORS.paperDark,
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginBottom: 6 }}>
          Key assumptions
        </Text>
        <AssumptionRow label="PSP" value={pspName} />
        <AssumptionRow label="Industry" value={industry || 'unspecified'} />
        <AssumptionRow label="Headline MSF rate" value={msfRate ? fmtPct(msfRate, 2) : '—'} />
        <AssumptionRow label="Confidence" value={outputs.confidence ?? 'low'} />
        <AssumptionRow
          label="Pass-through assumption"
          value={`${Math.round((outputs.plSwingHigh - outputs.plSwingLow) ? 45 : 100)}% (centre estimate)`}
        />
      </View>

      <Text style={{ fontSize: 9, color: COLORS.inkFaint, lineHeight: 1.55 }}>
        Resolution trace is available on request. Source priority: your
        explicit input → industry default → RBA average → regulatory constant.
        Card mix shares sum to 1.0 by construction. Scheme fees are unregulated
        and unchanged by the reform.
      </Text>

      {/* Trace summary — show top 3 sources used. */}
      {Object.keys(resolutionTrace ?? {}).length > 0 && (
        <Text style={{ fontSize: 9, color: COLORS.inkFaint, marginTop: 6, lineHeight: 1.55 }}>
          Trace summary: {Object.values(resolutionTrace).slice(0, 3).map((t) => t.source).join(' · ')}.
        </Text>
      )}
    </View>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
      <Text style={{ fontSize: 9, color: COLORS.inkFaint, width: 130 }}>{label}</Text>
      <Text style={{ fontSize: 9, color: COLORS.ink, flex: 1 }}>{value}</Text>
    </View>
  );
}

// ── Quiet upsell line ──────────────────────────────────────────

function QuietUpsell(): ReactElement {
  return (
    <View
      style={{
        borderTopWidth: 0.5,
        borderTopColor: COLORS.rule,
        borderTopStyle: 'solid',
        paddingTop: 10,
      }}
    >
      <Text style={{ fontSize: 9, color: COLORS.inkFaint, lineHeight: 1.6 }}>
        Want your real numbers, not market averages? The{' '}
        <Text style={{ color: COLORS.accent, fontFamily: 'Helvetica-Bold' }}>
          Reform Ready Report ($149)
        </Text>{' '}
        analyses your statements and builds the negotiation script with your
        figures. nosurcharging.com.au
      </Text>
    </View>
  );
}

// ── Footer ─────────────────────────────────────────────────────

function Footer({ pageLabel }: { pageLabel: string }): ReactElement {
  return (
    <View style={base.footer} fixed>
      <Text>nosurcharging.com.au · independent payments intelligence</Text>
      <Text>
        Generated {fmtToday()} · Page {pageLabel}
      </Text>
    </View>
  );
}
