// Parse en rangschikking van stadsuggesties (Open-Meteo-antwoorden).
// Pure kern: geen fetch, geen React — de service in services/ doet het netwerk.

const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

type OpenMeteoHit = {
  name?: unknown;
  admin1?: unknown;
  country?: unknown;
  country_code?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  population?: unknown;
};

export type CitySuggestion = {
  name: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
};

type ScoredHit = CitySuggestion & { population: number };

export const shouldSearchCities = (query: string): boolean =>
  query.trim().length >= MIN_QUERY_LENGTH;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

// Wat de gebruiker typt, krijgt eerst voorvoegsel-matches te zien, gesorteerd
// op bekendheid (inwoneraantal): zo komt bij "kamp" de stad Kampen boven de
// gehuchten Kamp, en Kampala wint van het Nederlandse dorpje met dezelfde
// beginscore. Extra letters en de naam zelf breken pas restgelijkstand.
const rankFor = (queryLower: string, hit: ScoredHit): [number, number, number] => {
  const nameLower = hit.name.toLowerCase();
  const prefix = nameLower.startsWith(queryLower) ? 0 : 1;
  const extraLetters = nameLower.length - queryLower.length;
  return [prefix, -hit.population, extraLetters];
};

export const citySuggestionsFrom = (raw: unknown, query: string): CitySuggestion[] => {
  const results = (raw as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];

  const hits = results as OpenMeteoHit[];
  const byKey = new Map<string, ScoredHit>();
  for (const hit of hits) {
    if (typeof hit.name !== 'string' || hit.name === '') continue;
    if (!isFiniteNumber(hit.latitude) || !isFiniteNumber(hit.longitude)) continue;

    const suggestion: ScoredHit = {
      name: hit.name,
      region: typeof hit.admin1 === 'string' ? hit.admin1 : '',
      country: typeof hit.country === 'string' ? hit.country : '',
      countryCode: typeof hit.country_code === 'string' ? hit.country_code : '',
      lat: hit.latitude,
      lon: hit.longitude,
      population: isFiniteNumber(hit.population) ? hit.population : 0,
    };

    // Dezelfde plaatsnaam in dezelfde regio (Open-Meteo levert soms dubbele
    // entries) telt één keer, vertegenwoordigd door de grootste.
    const key = `${suggestion.name.toLowerCase()}|${suggestion.region}|${suggestion.country}`;
    const existing = byKey.get(key);
    if (!existing || suggestion.population > existing.population) byKey.set(key, suggestion);
  }

  const queryLower = query.trim().toLowerCase();
  return [...byKey.values()]
    .sort((a, b) => {
      const [pa, ea, sa] = rankFor(queryLower, a);
      const [pb, eb, sb] = rankFor(queryLower, b);
      return pa - pb || ea - eb || sa - sb;
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(({ population: _population, ...suggestion }) => suggestion);
};
