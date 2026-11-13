// Stadsuggesties via Open-Meteo: geen API-key nodig, dus zoeken werkt ook in
// de demo-modus. Het antwoord wordt in core/citySearch geparsed en gerangschikt.

import { citySuggestionsFrom, shouldSearchCities, type CitySuggestion } from '../core/citySearch';
import type { Language } from '../core/types';

const BASE_URL = 'https://geocoding-api.open-meteo.com';
// De kern kapt op 5 suggesties; 25 opvragen geeft de rangschikking ruimte.
// Open-Meteo's eigen volgorde wisselt per count: bij count=10 ontbreekt
// Kampen zelfs in het antwoord op "kamp", bij 25 zit hij erbij en trekt de
// kern-rangschikking hem in de top 5.
const RESULT_COUNT = 25;

export class GeoSearchError extends Error {
  constructor(readonly status: number) {
    super(`Geocoding request failed (${status})`);
    this.name = 'GeoSearchError';
  }
}

export const searchCities = async (query: string, language: Language): Promise<CitySuggestion[]> => {
  if (!shouldSearchCities(query)) return [];

  const params = new URLSearchParams({
    name: query.trim(),
    count: String(RESULT_COUNT),
    language,
    format: 'json',
  });
  const response = await fetch(`${BASE_URL}/v1/search?${params.toString()}`);
  if (!response.ok) throw new GeoSearchError(response.status);
  return citySuggestionsFrom(await response.json(), query);
};
