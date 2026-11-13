import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Place, Settings } from '../core/types';

const SETTINGS_KEY = 'deltion-weather.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  tempUnit: 'celsius',
  windUnit: 'kmh',
  language: 'nl',
  defaultLocation: 'Zwolle',
  defaultPlace: null,
  apiKey: '',
};

export const loadSettings = async (): Promise<Settings> => {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

const CITY_CACHE_PREFIX = 'deltion-weather.city.v1:';

export const loadCachedCity = async (query: string): Promise<Place | null> => {
  const raw = await AsyncStorage.getItem(CITY_CACHE_PREFIX + query.toLowerCase());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Place;
  } catch {
    return null;
  }
};

export const saveCachedCity = async (query: string, place: Place): Promise<void> => {
  await AsyncStorage.setItem(CITY_CACHE_PREFIX + query.toLowerCase(), JSON.stringify(place));
};
