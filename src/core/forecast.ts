import type { ForecastDay, ForecastEntry } from './types';

const pad = (value: number): string => `${value}`.padStart(2, '0');

const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Kiest per dag de meting die het dichtst bij 13:00 lokale tijd ligt als icoon,
// en neemt daaromheen het dagminimum en -maximum.
export const aggregateDaily = (
  entries: readonly ForecastEntry[],
  now: Date,
  maxDays: number,
): ForecastDay[] => {
  const todayKey = dateKey(now);

  type Aggregate = { minC: number; maxC: number; icon: string; description: string; deltaMs: number };
  const byDay = new Map<string, Aggregate>();

  for (const entry of entries) {
    const date = new Date(entry.timeISO);
    const key = dateKey(date);
    if (key <= todayKey) continue;

    const dayNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 13).getTime();
    const deltaMs = Math.abs(date.getTime() - dayNoon);
    const existing = byDay.get(key);
    if (!existing) {
      byDay.set(key, { minC: entry.minC, maxC: entry.maxC, icon: entry.icon, description: entry.description, deltaMs });
      continue;
    }
    byDay.set(key, {
      minC: Math.min(existing.minC, entry.minC),
      maxC: Math.max(existing.maxC, entry.maxC),
      icon: deltaMs < existing.deltaMs ? entry.icon : existing.icon,
      description: deltaMs < existing.deltaMs ? entry.description : existing.description,
      deltaMs: Math.min(existing.deltaMs, deltaMs),
    });
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, maxDays)
    .map(([dateISO, day]) => ({
      dateISO,
      minC: day.minC,
      maxC: day.maxC,
      icon: day.icon,
      description: day.description,
    }));
};
