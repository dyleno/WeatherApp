// Mapping van OpenWeather-geo-hits en de keuze van het zichtbare plaatslabel.
// Pure kern: services leveren ruwe data, hier wordt over de inhoud beslist.

import type { LocationSource, Place } from './types';

export type GeoHit = {
  name?: string;
  country?: string;
  lat?: number;
  lon?: number;
};

// Zonder naam of coördinaten is een hit onbruikbaar; het land mag ontbreken.
export const placeFromGeoHit = (hit: GeoHit | undefined): Place | null => {
  if (!hit || typeof hit.name !== 'string' || hit.name === '') return null;
  if (typeof hit.lat !== 'number' || !Number.isFinite(hit.lat)) return null;
  if (typeof hit.lon !== 'number' || !Number.isFinite(hit.lon)) return null;
  return {
    name: hit.name,
    country: typeof hit.country === 'string' ? hit.country : '',
    lat: hit.lat,
    lon: hit.lon,
  };
};

// Welke plaatsnaam hoort er op het scherm?
// - gps: OpenWeather stempelt het weerantwoord met de dichtstbijzijnde
//   plaats-uit-zijn-database (kan "Kampen" zeggen voor een fix in Zwolle).
//   Een reverse-geocodeerd label wint; de coördinaten blijven de weer-fix.
// - default: de gebruiker koos een plaats — die naam blijft staan, ook als
//   het weerantwoord een buurt-label teruggeeft.
export const labelPlace = (
  source: LocationSource,
  weatherPlace: Place,
  reversePlace: Place | null,
  resolvedPlace: Place | null,
): Place => {
  if (source === 'default') return resolvedPlace ?? weatherPlace;
  if (!reversePlace) return weatherPlace;
  return {
    ...weatherPlace,
    name: reversePlace.name,
    // Een reverse-hit zonder land gooit het bekende land niet weg.
    country: reversePlace.country || weatherPlace.country,
  };
};

// Wat gebeurt er met de settings als de gebruiker de tekst bevestigt?
// - leeg veld: geen patch, het veld veert terug op de opgeslagen waarde;
// - dezelfde naam als de gekozen plaats: die blijft staan (de bevestiging
//   mag de geverifieerde keuze niet wissen);
// - andere tekst: vrije tekst, de plaats wordt later pas gegeocodeerd.
export const commitDefaultLocation = (
  draft: string,
  currentPlace: Place | null,
): { defaultLocation: string; defaultPlace: Place | null } | null => {
  const trimmed = draft.trim();
  if (trimmed === '') return null;
  const keep = currentPlace !== null && currentPlace.name === trimmed;
  return { defaultLocation: trimmed, defaultPlace: keep ? currentPlace : null };
};
