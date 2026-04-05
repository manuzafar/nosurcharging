// packages/calculations/constants/index.ts
// Country router and Tier 2 env var readers.

import {
  AU_INTERCHANGE,
  AU_SCHEME_FEES,
  AU_CARD_MIX_DEFAULTS,
  AU_REFORM_DATES,
  AU_SCHEME_CARD_MIX_DEFAULTS,
  AU_AVG_TXN_BY_INDUSTRY,
} from './au';
import type { InterchangeRates, SchemeFees, CardMixDefaults, ReformDates } from '../types';

// ── Country router ───────────────────────────────────────────────

export interface CountryConstants {
  interchange: {
    preSep2026: InterchangeRates;
    postOct2026: InterchangeRates;
    postApr2027: InterchangeRates;
  };
  schemeFees: SchemeFees;
  cardMixDefaults: CardMixDefaults;
  reformDates: ReformDates;
}

export function getConstants(countryCode: string): CountryConstants {
  switch (countryCode.toUpperCase()) {
    case 'AU':
      return {
        interchange: AU_INTERCHANGE,
        schemeFees: AU_SCHEME_FEES,
        cardMixDefaults: AU_CARD_MIX_DEFAULTS,
        reformDates: AU_REFORM_DATES,
      };
    default:
      throw new Error(`Unsupported country code: ${countryCode}. Only 'AU' is supported in Phase 1.`);
  }
}

// ── Tier 2: Scheme-level card mix from env vars ──────────────────
// Returns scheme-level card mix. Reads CALC_CARD_MIX_* env vars,
// falls back to AU_SCHEME_CARD_MIX_DEFAULTS.

export interface SchemeCardMixDefaults {
  visa_debit: number;
  visa_credit: number;
  mastercard_debit: number;
  mastercard_credit: number;
  eftpos: number;
  amex: number;
  foreign: number;
  commercial: number;
}

function parseEnvFloat(key: string): number | null {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return null;
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? null : parsed;
}

export function getSchemeCardMixDefaults(): SchemeCardMixDefaults {
  return {
    visa_debit: parseEnvFloat('CALC_CARD_MIX_VISA_DEBIT') ?? AU_SCHEME_CARD_MIX_DEFAULTS.visa_debit,
    visa_credit: parseEnvFloat('CALC_CARD_MIX_VISA_CREDIT') ?? AU_SCHEME_CARD_MIX_DEFAULTS.visa_credit,
    mastercard_debit: parseEnvFloat('CALC_CARD_MIX_MC_DEBIT') ?? AU_SCHEME_CARD_MIX_DEFAULTS.mastercard_debit,
    mastercard_credit: parseEnvFloat('CALC_CARD_MIX_MC_CREDIT') ?? AU_SCHEME_CARD_MIX_DEFAULTS.mastercard_credit,
    eftpos: parseEnvFloat('CALC_CARD_MIX_EFTPOS') ?? AU_SCHEME_CARD_MIX_DEFAULTS.eftpos,
    amex: parseEnvFloat('CALC_CARD_MIX_AMEX') ?? AU_SCHEME_CARD_MIX_DEFAULTS.amex,
    foreign: parseEnvFloat('CALC_CARD_MIX_FOREIGN') ?? AU_SCHEME_CARD_MIX_DEFAULTS.foreign,
    commercial: AU_SCHEME_CARD_MIX_DEFAULTS.commercial,
  };
}

// ── Tier 2: Average transaction value by industry ────────────────
// Reads CALC_AVG_TXN_<INDUSTRY> env var, falls back to hardcoded.

export function getAvgTxnValue(industry: string): number {
  const envKey = `CALC_AVG_TXN_${industry.toUpperCase()}`;
  const envVal = parseEnvFloat(envKey);
  if (envVal !== null) return envVal;

  const defaultVal = parseEnvFloat('CALC_AVG_TXN_DEFAULT');
  if (defaultVal !== null) return defaultVal;

  return AU_AVG_TXN_BY_INDUSTRY[industry.toLowerCase()]
    ?? AU_CARD_MIX_DEFAULTS.avgTransactionValue;
}
