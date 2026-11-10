import type { PressureTrend } from './types';

const TREND_THRESHOLD_HPA = 1;

export const pressureTrend = (currentHpa: number, upcomingHpa: number): PressureTrend => {
  const delta = upcomingHpa - currentHpa;
  if (delta >= TREND_THRESHOLD_HPA) return 'rising';
  if (delta <= -TREND_THRESHOLD_HPA) return 'falling';
  return 'stable';
};
