import type { Language, WindUnit } from './types';

const BEAUFORT_UPPER_MS = [0.5, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7] as const;

export const msToBeaufort = (ms: number): number => {
  for (let force = 0; force < BEAUFORT_UPPER_MS.length; force += 1) {
    if (ms < BEAUFORT_UPPER_MS[force]) return force;
  }
  return 12;
};

export const msToKmh = (ms: number): number => ms * 3.6;

export const msToKnots = (ms: number): number => ms * 1.94384;

export const windValue = (ms: number, unit: WindUnit): number => {
  switch (unit) {
    case 'kmh':
      return Math.round(msToKmh(ms));
    case 'ms':
      return Math.round(ms * 10) / 10;
    case 'knots':
      return Math.round(msToKnots(ms));
    case 'beaufort':
      return msToBeaufort(ms);
  }
};

export const windValueLabel = (ms: number, unit: WindUnit, language: Language): string => {
  const value = windValue(ms, unit);
  switch (unit) {
    case 'beaufort':
      return `${value} Bft`;
    case 'ms':
      return language === 'nl' ? `${value.toFixed(1).replace('.', ',')} m/s` : `${value.toFixed(1)} m/s`;
    case 'knots':
      return language === 'nl' ? `${value} knopen` : `${value} kn`;
    case 'kmh':
      return language === 'nl' ? `${value} km/u` : `${value} km/h`;
  }
};

const POINTS_NL = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'] as const;
const POINTS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export const compassPoint = (deg: number, language: Language): string => {
  const points = language === 'nl' ? POINTS_NL : POINTS_EN;
  const normalized = ((deg % 360) + 360) % 360;
  return points[Math.round(normalized / 45) % 8];
};
