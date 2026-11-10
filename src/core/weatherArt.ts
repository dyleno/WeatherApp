// Mapt OpenWeather-icooncodes op de kunst-assets in assets/weather/.
// Zelfde fallback-filosofie als glyphForIcon: onbekende code → bewolkt.

export type ArtKey =
  | 'clearDay'
  | 'clearNight'
  | 'partlyDay'
  | 'cloudy'
  | 'rain'
  | 'thunder'
  | 'snow'
  | 'fog';

export const artKeyForIcon = (code: string, isDay: boolean): ArtKey => {
  const base = code.slice(0, 2);

  switch (base) {
    case '01':
      return isDay ? 'clearDay' : 'clearNight';
    case '02':
      return isDay ? 'partlyDay' : 'cloudy';
    case '03':
    case '04':
      return 'cloudy';
    case '09':
    case '10':
      return 'rain';
    case '11':
      return 'thunder';
    case '13':
      return 'snow';
    case '50':
      return 'fog';
    default:
      return 'cloudy';
  }
};
