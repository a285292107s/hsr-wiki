import { translate as t } from '../i18n';

const ROW_LABEL: Record<string, string> = {
  base: 'formula.zone.base',
  modifier: 'formula.zone.modifier',
  crit: 'formula.zone.crit',
  defense: 'formula.zone.def',
  resist: 'formula.zone.res',
  special: 'formula.zone.special',
  toughness: 'formula.chain.toughness',
  toughnessCheck: 'formula.row.toughnessCheck',
  breakBase: 'formula.row.breakBase',
  elementBreak: 'formula.row.elementBreak',
  breakEffect: 'formula.row.breakEffect',
  toughnessLength: 'formula.row.toughnessLength',
  breakBonus: 'formula.row.breakBonus',
  superToughness: 'formula.row.superToughness',
  superBonus: 'formula.row.superBonus',
  vuln: 'formula.row.vuln',
  reduce: 'formula.row.reduce',
  elationBase: 'formula.row.elationBase',
  elationMultiplier: 'formula.row.elationMultiplier',
  elationDegree: 'formula.row.elationDegree',
  joke: 'formula.row.joke',
  laugh: 'formula.row.laugh',
};

export function rowLabel(key: string, overrides?: Record<string, string>): string {
  const i18n = overrides?.[key] ?? ROW_LABEL[key];
  return i18n ? t(i18n) : key;
}

export function equationTerms(rows: { key: string }[], overrides?: Record<string, string>): string[] {
  return rows.map((row) => rowLabel(row.key, overrides));
}
