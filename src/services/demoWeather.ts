import type { Language, WeatherSnapshot } from '../core/types';

const DESCRIPTIONS = {
  partly: { nl: 'Licht bewolkt', en: 'Partly cloudy' },
  rain: { nl: 'Lichte regen', en: 'Light rain' },
  clear: { nl: 'Onbewolkt', en: 'Clear sky' },
} as const;

// Demo-dataset die exact bij het Figma-design past; de datums rollen
// mee met "vandaag" zodat Morgen altijd morgen is.
export const buildDemoSnapshot = (now: Date, language: Language): WeatherSnapshot => {
  const day = (offsetDays: number): string =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays).toISOString();
  const hour = now.getHours();

  return {
    isDemo: true,
    locationSource: 'default',
    place: { lat: 52.5125, lon: 6.0925, name: 'Zwolle', country: 'NL' },
    current: {
      temperatureC: 18,
      feelsLikeC: 17,
      icon: '02d',
      description: DESCRIPTIONS.partly[language],
      windMs: 15 / 3.6,
      windDeg: 225,
      pressureHpa: 1018,
      humidityPct: 72,
      isDay: hour >= 7 && hour < 20,
    },
    trend: 'stable',
    daily: [
      { dateISO: day(1), minC: 12, maxC: 19, icon: '02d', description: DESCRIPTIONS.partly[language] },
      { dateISO: day(2), minC: 11, maxC: 17, icon: '10d', description: DESCRIPTIONS.rain[language] },
      { dateISO: day(3), minC: 13, maxC: 21, icon: '01d', description: DESCRIPTIONS.clear[language] },
      { dateISO: day(4), minC: 14, maxC: 22, icon: '01d', description: DESCRIPTIONS.clear[language] },
    ],
  };
};
