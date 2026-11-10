// Mapt OpenWeather icon-codes (eerste twee tekens) op MaterialCommunityIcons-namen.
const GLYPHS: Record<string, string> = {
  '01': 'weather-sunny',
  '02': 'weather-partlycloudy',
  '03': 'weather-partlycloudy',
  '04': 'weather-cloudy',
  '09': 'weather-pouring',
  '10': 'weather-rainy',
  '11': 'weather-lightning',
  '13': 'weather-snowy',
  '50': 'weather-fog',
};

export const glyphForIcon = (code: string, isDay: boolean): string => {
  const base = code.slice(0, 2);
  if (base === '01' && !isDay) return 'weather-night';
  if (base === '02' && !isDay) return 'weather-night-partly-cloudy';
  return GLYPHS[base] ?? 'weather-cloudy';
};

export type HumidityKey = 'dry' | 'comfortable' | 'humid' | 'veryHumid';

export const humidityKey = (pct: number): HumidityKey => {
  if (pct < 30) return 'dry';
  if (pct < 75) return 'comfortable';
  if (pct < 90) return 'humid';
  return 'veryHumid';
};

export const capitalizeFirst = (text: string): string =>
  text.length === 0 ? text : text.charAt(0).toUpperCase() + text.slice(1);
