import { capitalizeFirst } from '../core/conditions';
import type { CurrentWeather, ForecastEntry, Language, Place } from '../core/types';

const BASE_URL = 'https://api.openweathermap.org';

export class WeatherApiError extends Error {
  constructor(readonly status: number) {
    super(`OpenWeather request failed (${status})`);
    this.name = 'WeatherApiError';
  }
}

const requestJson = async (path: string, apiKey: string, params: Record<string, string>): Promise<unknown> => {
  const query = new URLSearchParams({ ...params, appid: apiKey });
  const response = await fetch(`${BASE_URL}${path}?${query.toString()}`);
  if (!response.ok) throw new WeatherApiError(response.status);
  return response.json();
};

type CurrentWeatherResponse = {
  name?: string;
  sys?: { country?: string };
  main: { temp: number; feels_like: number; pressure: number; humidity: number };
  weather: { icon: string; description: string }[];
  wind: { speed: number; deg?: number };
};

export const fetchCurrentWeather = async (
  apiKey: string,
  coords: { lat: number; lon: number },
  language: Language,
): Promise<{ place: Place; current: CurrentWeather }> => {
  const raw = (await requestJson('/data/2.5/weather', apiKey, {
    lat: String(coords.lat),
    lon: String(coords.lon),
    units: 'metric',
    lang: language,
  })) as CurrentWeatherResponse;

  const icon = raw.weather[0]?.icon ?? '01d';
  return {
    place: { lat: coords.lat, lon: coords.lon, name: raw.name ?? '', country: raw.sys?.country ?? '' },
    current: {
      temperatureC: raw.main.temp,
      feelsLikeC: raw.main.feels_like,
      icon,
      description: capitalizeFirst(raw.weather[0]?.description ?? ''),
      windMs: raw.wind?.speed ?? 0,
      windDeg: raw.wind?.deg ?? 0,
      pressureHpa: raw.main.pressure,
      humidityPct: raw.main.humidity,
      isDay: icon.endsWith('d'),
    },
  };
};

type ForecastResponse = {
  list: {
    dt: number;
    main: { temp_min: number; temp_max: number; pressure: number };
    weather: { icon: string; description: string }[];
  }[];
};

export const fetchForecast = async (
  apiKey: string,
  coords: { lat: number; lon: number },
  language: Language,
): Promise<ForecastEntry[]> => {
  const raw = (await requestJson('/data/2.5/forecast', apiKey, {
    lat: String(coords.lat),
    lon: String(coords.lon),
    units: 'metric',
    lang: language,
  })) as ForecastResponse;

  return raw.list.map((item) => ({
    timeISO: new Date(item.dt * 1000).toISOString(),
    minC: item.main.temp_min,
    maxC: item.main.temp_max,
    icon: item.weather[0]?.icon ?? '01d',
    description: capitalizeFirst(item.weather[0]?.description ?? ''),
    pressureHpa: item.main.pressure,
  }));
};

type GeocodeResponse = { name: string; country?: string; lat: number; lon: number }[];

export const geocodeCity = async (apiKey: string, query: string, language: Language): Promise<Place | null> => {
  const raw = (await requestJson('/geo/1.0/direct', apiKey, {
    q: query,
    limit: '1',
    lang: language,
  })) as GeocodeResponse;

  const hit = raw[0];
  if (!hit) return null;
  return { lat: hit.lat, lon: hit.lon, name: hit.name, country: hit.country ?? '' };
};
