import type { Language } from './types';

const NAMES: Record<string, { nl: string; en: string }> = {
  NL: { nl: 'Nederland', en: 'Netherlands' },
  BE: { nl: 'België', en: 'Belgium' },
  DE: { nl: 'Duitsland', en: 'Germany' },
  FR: { nl: 'Frankrijk', en: 'France' },
  GB: { nl: 'Verenigd Koninkrijk', en: 'United Kingdom' },
  UK: { nl: 'Verenigd Koninkrijk', en: 'United Kingdom' },
  US: { nl: 'Verenigde Staten', en: 'United States' },
  ES: { nl: 'Spanje', en: 'Spain' },
  IT: { nl: 'Italië', en: 'Italy' },
  PT: { nl: 'Portugal', en: 'Portugal' },
  SE: { nl: 'Zweden', en: 'Sweden' },
  NO: { nl: 'Noorwegen', en: 'Norway' },
  DK: { nl: 'Denemarken', en: 'Denmark' },
  FI: { nl: 'Finland', en: 'Finland' },
  PL: { nl: 'Polen', en: 'Poland' },
  AT: { nl: 'Oostenrijk', en: 'Austria' },
  CH: { nl: 'Zwitserland', en: 'Switzerland' },
  IE: { nl: 'Ierland', en: 'Ireland' },
  TR: { nl: 'Turkije', en: 'Türkiye' },
  GR: { nl: 'Griekenland', en: 'Greece' },
  LU: { nl: 'Luxemburg', en: 'Luxembourg' },
  CZ: { nl: 'Tsjechië', en: 'Czechia' },
};

export const countryName = (code: string, language: Language): string =>
  NAMES[code]?.[language] ?? code;
