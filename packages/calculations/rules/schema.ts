// packages/calculations/rules/schema.ts
// Defines every configurable input: key, label, data type, validation,
// source priority, and which phase it becomes active.
// Adding a new input = adding one entry here. Calculation engine does not change.

import type { RuleSource } from '../types';

export type RuleDataType = 'percentage' | 'currency' | 'cents' | 'boolean' | 'enum';

export interface RuleDefinition {
  key: string;
  label: string;
  dataType: RuleDataType;
  unit?: string;
  min?: number;
  max?: number;
  sources: RuleSource[];
  defaultSource: RuleSource;
  affectsConfidence: boolean;
  phase: '1' | '2' | '3';
  description: string;
}

export const RULE_SCHEMA: RuleDefinition[] = [
  // ── Card mix inputs ────────────────────────────────────────────

  {
    key: 'cardMix.visa_debit',
    label: 'Visa debit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Visa debit cards',
  },
  {
    key: 'cardMix.visa_credit',
    label: 'Visa credit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Visa credit cards',
  },
  {
    key: 'cardMix.mastercard_debit',
    label: 'Mastercard debit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Mastercard debit cards',
  },
  {
    key: 'cardMix.mastercard_credit',
    label: 'Mastercard credit share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are Mastercard credit cards',
  },
  {
    key: 'cardMix.eftpos',
    label: 'eftpos share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are eftpos cards',
  },
  {
    key: 'cardMix.amex',
    label: 'Amex share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are American Express cards',
  },
  {
    key: 'cardMix.foreign',
    label: 'Foreign card share',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 100,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Percentage of transactions that are foreign-issued cards',
  },

  // ── Average transaction value ──────────────────────────────────

  {
    key: 'avgTransactionValue',
    label: 'Average transaction value',
    dataType: 'currency',
    unit: 'AUD',
    min: 1,
    max: 100000,
    sources: ['merchant_input', 'invoice_parsed', 'industry_default', 'env_var', 'regulatory_constant'],
    defaultSource: 'env_var',
    affectsConfidence: true,
    phase: '1',
    description: 'Average card transaction value. Used to calculate number of debit transactions.',
  },

  // ── Expert interchange rates ───────────────────────────────────

  {
    key: 'expertRates.debitCents',
    label: 'Debit interchange rate',
    dataType: 'cents',
    unit: 'c',
    min: 0,
    max: 50,
    sources: ['merchant_input', 'regulatory_constant'],
    defaultSource: 'regulatory_constant',
    affectsConfidence: true,
    phase: '1',
    description: 'Your actual debit interchange rate in cents per transaction.',
  },
  {
    key: 'expertRates.creditPct',
    label: 'Consumer credit interchange rate',
    dataType: 'percentage',
    unit: '%',
    min: 0,
    max: 5,
    sources: ['merchant_input', 'regulatory_constant'],
    defaultSource: 'regulatory_constant',
    affectsConfidence: true,
    phase: '1',
    description: 'Your actual consumer credit interchange rate as a percentage.',
  },
];
