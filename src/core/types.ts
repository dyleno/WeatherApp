export type Language = 'nl' | 'en';
export type TempUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'ms' | 'knots' | 'beaufort';
export type ThemeMode = 'light' | 'dark' | 'system';
export type PressureTrend = 'rising' | 'falling' | 'stable';

export type Settings = {
  theme: ThemeMode;
  tempUnit: TempUnit;
  windUnit: WindUnit;
  language: Language;
  defaultLocation: string;
  apiKey: string;
};

export type Place = {
  lat: number;
  lon: number;
  name: string;
  country: string;
};

export type CurrentWeather = {
  temperatureC: number;
  feelsLikeC: number;
  icon: string;
  description: string;
  windMs: number;
  windDeg: number;
  pressureHpa: number;
  humidityPct: number;
  isDay: boolean;
};

export type ForecastEntry = {
  timeISO: string;
  minC: number;
  maxC: number;
  icon: string;
  description: string;
  pressureHpa: number;
};

export type ForecastDay = {
  dateISO: string;
  minC: number;
  maxC: number;
  icon: string;
  description: string;
};

export type WeatherSnapshot = {
  isDemo: boolean;
  locationSource: 'gps' | 'default';
  place: Place;
  current: CurrentWeather;
  trend: PressureTrend;
  daily: ForecastDay[];
};
