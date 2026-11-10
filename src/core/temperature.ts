import type { TempUnit } from './types';

export const celsiusToUnit = (celsius: number, unit: TempUnit): number =>
  unit === 'celsius' ? celsius : celsius * (9 / 5) + 32;

export const formatTemp = (celsius: number, unit: TempUnit): string =>
  `${Math.round(celsiusToUnit(celsius, unit))}°`;
