import * as Location from 'expo-location';
import { geocodeCity } from './owmApi';
import { loadCachedCity, saveCachedCity } from './settingsStore';
import type { Language, Place } from '../core/types';

export type LocationOutcome = { status: 'granted'; lat: number; lon: number } | { status: 'denied' };

const LOCATION_TIMEOUT_MS = 10_000;

const withTimeout = async <T>(promise: Promise<T>, fallback: T, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const requestCurrentLocation = async (): Promise<LocationOutcome> => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const position = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    null,
    LOCATION_TIMEOUT_MS,
  );
  if (!position) return { status: 'denied' };
  return { status: 'granted', lat: position.coords.latitude, lon: position.coords.longitude };
};

// Zoekt de standaardlocatie op via geocoding, met cache zodat de app ook
// zonder netwerk (of bij API-storing) een bekende plek kan tonen.
export const resolveDefaultCity = async (
  apiKey: string,
  query: string,
  language: Language,
): Promise<Place | null> => {
  const trimmed = query.trim();
  if (trimmed === '') return null;

  const cached = await loadCachedCity(trimmed);
  if (cached) return cached;

  const place = await geocodeCity(apiKey, trimmed, language);
  if (!place) return null;

  await saveCachedCity(trimmed, place);
  return place;
};
