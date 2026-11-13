// Verifieert de pure kern (conversies, forecast-aggregatie, trend) zonder testframework.
// Gedraaid via `npm test` na compilatie met tsconfig.test.json.
const assert = require('node:assert/strict');
const { msToBeaufort, windValue, windValueLabel, compassPoint } = require('../build-test/core/wind');
const { aggregateDaily } = require('../build-test/core/forecast');
const { pressureTrend } = require('../build-test/core/pressure');
const { formatTemp } = require('../build-test/core/temperature');
const { glyphForIcon, humidityKey } = require('../build-test/core/conditions');
const { recolorLottieColors } = require('../build-test/core/lottieRecolor');
const { artKeyForIcon } = require('../build-test/core/weatherArt');
const { getCondition, setCondition, subscribeCondition } = require('../build-test/core/conditionStore');
const { withTimeout } = require('../build-test/core/async');
const { mergeStoredSettings, recoverSettings } = require('../build-test/core/settings');
const { shouldSearchCities, citySuggestionsFrom } = require('../build-test/core/citySearch');
const { placeFromGeoHit, labelPlace, commitDefaultLocation } = require('../build-test/core/places');

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('beaufort volgt de schaalgrenzen', () => {
  assert.equal(msToBeaufort(0), 0);
  assert.equal(msToBeaufort(0.4), 0);
  assert.equal(msToBeaufort(0.5), 1);
  assert.equal(msToBeaufort(4.2), 3);
  assert.equal(msToBeaufort(15), 7);
  assert.equal(msToBeaufort(35), 12);
});

test('windsnelheid wordt per eenheid juist omgerekend', () => {
  assert.equal(windValue(15 / 3.6, 'kmh'), 15);
  assert.equal(windValue(15 / 3.6, 'knots'), 8);
  assert.equal(windValue(4.16, 'ms'), 4.2);
  assert.equal(windValue(9, 'beaufort'), 5);
});

test('windlabel per eenheid en taal', () => {
  assert.equal(windValueLabel(15 / 3.6, 'kmh', 'nl'), '15 km/u');
  assert.equal(windValueLabel(15 / 3.6, 'kmh', 'en'), '15 km/h');
  assert.equal(windValueLabel(4.16, 'ms', 'nl'), '4,2 m/s');
  assert.equal(windValueLabel(4.16, 'beaufort', 'nl'), '3 Bft');
  assert.equal(windValueLabel(4.16, 'knots', 'en'), '8 kn');
});

test('windhoek wordt kompasrichting per taal', () => {
  assert.equal(compassPoint(0, 'nl'), 'N');
  assert.equal(compassPoint(225, 'nl'), 'ZW');
  assert.equal(compassPoint(225, 'en'), 'SW');
  assert.equal(compassPoint(315, 'en'), 'NW');
  assert.equal(compassPoint(400, 'nl'), 'NO');
});

test('temperatuurformattering celsius en fahrenheit', () => {
  assert.equal(formatTemp(18, 'celsius'), '18°');
  assert.equal(formatTemp(18, 'fahrenheit'), '64°');
  assert.equal(formatTemp(0, 'fahrenheit'), '32°');
});

test('forecast sluit vandaag uit en aggregeert min/max per dag', () => {
  const entry = (dayOffset, hour, minC, maxC, icon) => {
    const date = new Date(2026, 10, 10 + dayOffset, hour, 0, 0);
    return { timeISO: date.toISOString(), minC, maxC, icon, description: 'x', pressureHpa: 1015 };
  };
  const now = new Date(2026, 10, 10, 15, 0);
  const days = aggregateDaily(
    [entry(0, 12, 9, 18, '02d'), entry(1, 6, 10, 16, '01d'), entry(1, 13, 8, 19, '03d'), entry(1, 21, 12, 20, '04d'), entry(2, 12, 5, 9, '10d')],
    now,
    5,
  );
  assert.equal(days.length, 2);
  assert.equal(days[0].minC, 8);
  assert.equal(days[0].maxC, 20);
  assert.equal(days[0].icon, '03d'); // meting het dichtst bij 13:00 wint
  assert.equal(days[1].maxC, 9);
});

test('forecast respecteert het maximum aantal dagen', () => {
  const entries = [];
  for (let offset = 1; offset <= 6; offset += 1) {
    const date = new Date(2026, 10, 10 + offset, 12, 0, 0);
    entries.push({ timeISO: date.toISOString(), minC: 0, maxC: offset, icon: '01d', description: 'x', pressureHpa: 1015 });
  }
  const days = aggregateDaily(entries, new Date(2026, 10, 10, 15, 0), 4);
  assert.equal(days.length, 4);
});

test('luchtdruktrend: dalend, stabiel, stijgend', () => {
  assert.equal(pressureTrend(1018, 1015), 'falling');
  assert.equal(pressureTrend(1018, 1018.5), 'stable');
  assert.equal(pressureTrend(1018, 1021), 'rising');
});

test('weer-iconen mappen op glyphen, ook in de nacht', () => {
  assert.equal(glyphForIcon('01d', true), 'weather-sunny');
  assert.equal(glyphForIcon('01n', false), 'weather-night');
  assert.equal(glyphForIcon('10d', true), 'weather-rainy');
  assert.equal(glyphForIcon('99x', true), 'weather-cloudy');
});

test('luchtvochtigheidslabel heeft drempels', () => {
  assert.equal(humidityKey(20), 'dry');
  assert.equal(humidityKey(72), 'comfortable');
  assert.equal(humidityKey(75), 'humid');
  assert.equal(humidityKey(95), 'veryHumid');
});

test('art mapping dekt alle OWM-codes met fallback', () => {
  assert.equal(artKeyForIcon('01d', true), 'clearDay');
  assert.equal(artKeyForIcon('01n', false), 'clearNight');
  assert.equal(artKeyForIcon('02d', true), 'partlyDay');
  assert.equal(artKeyForIcon('02n', false), 'cloudy');
  assert.equal(artKeyForIcon('04d', true), 'cloudy');
  assert.equal(artKeyForIcon('10d', true), 'rain');
  assert.equal(artKeyForIcon('11d', true), 'thunder');
  assert.equal(artKeyForIcon('13n', false), 'snow');
  assert.equal(artKeyForIcon('50d', true), 'fog');
  assert.equal(artKeyForIcon('99x', true), 'cloudy');
});

test('lottie-recolor vervangt gekende kleuren en laat onbekende staan', () => {
  const json = { layers: [{ shapes: [{ it: [
    { ty: 'fl', c: { k: [0.9, 0.58, 0.36, 1] } },
    { ty: 'fl', c: { k: [0.1, 0.2, 0.3, 1] } },
  ] }] }] };
  const out = recolorLottieColors(json, { '#e6945c': '#e7c46a' });
  const [a, b] = out.layers[0].shapes[0].it;
  const toHex = (k) => '#' + k.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  assert.equal(toHex(a.c.k), '#e7c46a');             // doelkleur
  assert.equal(toHex(b.c.k), '#1a334d');             // onbekend → onveranderd
  assert.deepEqual(json.layers[0].shapes[0].it[0].c.k, [0.9, 0.58, 0.36, 1]); // geen mutatie
});

test('lottie-recolor volgt het thema: licht vs donker levert andere kleuren', () => {
  const json = { layers: [{ shapes: [{ it: [{ ty: 'fl', c: { k: [0.9, 0.58, 0.36, 1] } }] }] }] };
  const dark = recolorLottieColors(json, { '#e6945c': '#e7c46a' });
  const light = recolorLottieColors(json, { '#e6945c': '#c06b3c' });
  assert.notDeepEqual(dark.layers[0].shapes[0].it[0].c.k, light.layers[0].shapes[0].it[0].c.k);
});

test('withTimeout geeft de onderliggende waarde door vóór de deadline', async () => {
  assert.equal(await withTimeout(Promise.resolve('x'), 100), 'x');
});

test('withTimeout reject op de deadline bij een nooit-resolvende promise', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10), /timeout/);
});

test('conditie-store: start leeg', () => {
  assert.equal(getCondition(), null);
});

test('conditie-store: publiceert en notificeert abonnees, niet bij zelfde waarde', () => {
  const seen = [];
  const stop = subscribeCondition(() => seen.push(getCondition()));
  setCondition('10d', true);
  setCondition('10d', true); // zelfde waarde → geen extra notitie
  setCondition('01n', false);
  stop();
  setCondition('03d', true); // afmeldt → geen notitie meer
  assert.deepEqual(seen, [
    { icon: '10d', isDay: true },
    { icon: '01n', isDay: false },
  ]);
  assert.deepEqual(getCondition(), { icon: '03d', isDay: true });
});

test('mergeStoredSettings bewaart opgeslagen key als de sessie defaults niet raakt', () => {
  const defaults = { theme: 'system', apiKey: '' };
  const stored = { theme: 'light', apiKey: 'abc123' };
  assert.deepEqual(mergeStoredSettings(stored, defaults, defaults), stored);
});

test('mergeStoredSettings laat sessiewijzigingen winnen', () => {
  const defaults = { theme: 'system', apiKey: '' };
  const stored = { theme: 'light', apiKey: 'abc123' };
  assert.deepEqual(mergeStoredSettings(stored, { theme: 'dark', apiKey: '' }, defaults), {
    theme: 'dark',
    apiKey: 'abc123',
  });
});

test('mergeStoredSettings laat sessie-key winnen boven stored en default', () => {
  const defaults = { theme: 'system', apiKey: '' };
  const stored = { theme: 'light', apiKey: 'abc123' };
  assert.deepEqual(mergeStoredSettings(stored, { theme: 'light', apiKey: 'xyz789' }, defaults), {
    theme: 'light',
    apiKey: 'xyz789',
  });
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('recoverSettings geeft de UI vrij op de deadline en herstelt een laat landende lees', async () => {
  let recovered = null;
  let gaveUp = 0;
  const slow = () => new Promise((resolve) => setTimeout(() => resolve({ apiKey: 'abc' }), 60));
  await recoverSettings(slow, 20, (stored) => { recovered = stored; }, () => { gaveUp += 1; });
  assert.equal(gaveUp, 1);
  assert.equal(recovered, null);
  await sleep(80);
  assert.deepEqual(recovered, { apiKey: 'abc' });
});

test('recoverSettings laat een snelle lees direct winnen zonder opgave', async () => {
  let recovered = null;
  let gaveUp = 0;
  const fast = () => new Promise((resolve) => setTimeout(() => resolve({ apiKey: 'xyz' }), 5));
  await recoverSettings(fast, 500, (stored) => { recovered = stored; }, () => { gaveUp += 1; });
  await sleep(20);
  assert.deepEqual(recovered, { apiKey: 'xyz' });
  assert.equal(gaveUp, 0);
});

test('recoverSettings geeft na de deadline op bij een hangende lees', async () => {
  let recovered = 0;
  let gaveUp = 0;
  const hang = () => new Promise(() => {});
  await recoverSettings(hang, 20, () => { recovered += 1; }, () => { gaveUp += 1; });
  await sleep(40);
  assert.equal(gaveUp, 1);
  assert.equal(recovered, 0);
});

// --- citySearch ---

test('shouldSearchCities staat zoeken toe vanaf twee tekens', () => {
  assert.equal(shouldSearchCities(''), false);
  assert.equal(shouldSearchCities('   '), false);
  assert.equal(shouldSearchCities('Z'), false);
  assert.equal(shouldSearchCities('Zw'), true);
  assert.equal(shouldSearchCities(' Zw '), true);
});

test('citySuggestionsFrom plakt Open-Meteo-hits op suggesties', () => {
  const raw = {
    results: [
      { name: 'Zwolle', admin1: 'Overijssel', country: 'Nederland', country_code: 'NL', latitude: 52.5125, longitude: 6.0925, population: 127000 },
      { name: 'Zwolle', admin1: 'Louisiana', country: 'Verenigde Staten', country_code: 'US', latitude: 31.92, longitude: -93.84, population: 3500 },
    ],
  };
  const suggestions = citySuggestionsFrom(raw, 'zwol');
  assert.equal(suggestions.length, 2);
  assert.deepEqual(suggestions[0], { name: 'Zwolle', region: 'Overijssel', country: 'Nederland', countryCode: 'NL', lat: 52.5125, lon: 6.0925 });
  assert.deepEqual(suggestions[1], { name: 'Zwolle', region: 'Louisiana', country: 'Verenigde Staten', countryCode: 'US', lat: 31.92, lon: -93.84 });
});

test('citySuggestionsFrom laat hits zonder naam of coördinaten vallen', () => {
  const raw = {
    results: [
      { name: 'Zwolle', latitude: 52.5, longitude: 6.09 },
      { latitude: 1, longitude: 2 },
      { name: 'Nergens' },
      { name: 'Half', latitude: 1 },
    ],
  };
  const suggestions = citySuggestionsFrom(raw, 'zwol');
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].name, 'Zwolle');
});

test('citySuggestionsFrom zonder bruikbare results geeft een lege lijst', () => {
  assert.deepEqual(citySuggestionsFrom({}, 'zwol'), []);
  assert.deepEqual(citySuggestionsFrom({ results: [] }, 'zwol'), []);
  assert.deepEqual(citySuggestionsFrom(null, 'zwol'), []);
});

test('citySuggestionsFrom ontdubbelt identieke plaatsen op de grootste', () => {
  const raw = {
    results: [
      { name: 'Zwoleń', admin1: 'Mazovië', country: 'Polen', latitude: 51.35, longitude: 21.58, population: 22000 },
      { name: 'Zwoleń', admin1: 'Mazovië', country: 'Polen', latitude: 52.44, longitude: 19.55, population: 35000 },
    ],
  };
  const suggestions = citySuggestionsFrom(raw, 'zwol');
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].lat, 52.44);
});

test('citySuggestionsFrom rangschikt: voorvoegsel eerst, dan bekendheid (inwoners)', () => {
  const raw = {
    results: [
      { name: 'Kampala', country: 'Oeganda', latitude: 1, longitude: 2, population: 1659600 },
      { name: 'Kampen', country: 'Nederland', latitude: 3, longitude: 4, population: 39000 },
      { name: 'Kamp', admin1: 'Stiermarken', country: 'Oostenrijk', latitude: 5, longitude: 6, population: 900 },
      { name: 'Bargercompascuumkamp', country: 'Nederland', latitude: 7, longitude: 8, population: 500 },
    ],
  };
  const names = citySuggestionsFrom(raw, 'KAMP').map((s) => s.name);
  assert.deepEqual(names, ['Kampala', 'Kampen', 'Kamp', 'Bargercompascuumkamp']);
});

test('citySuggestionsFrom rangschikt gelijkvoorvoegselegevallen op inwoneraantal', () => {
  const raw = {
    results: [
      { name: 'Kampaa', country: 'X', latitude: 1, longitude: 2, population: 1000 },
      { name: 'Kampbb', country: 'Y', latitude: 3, longitude: 4, population: 50000 },
    ],
  };
  const names = citySuggestionsFrom(raw, 'kamp').map((s) => s.name);
  assert.deepEqual(names, ['Kampbb', 'Kampaa']);
});

test('citySuggestionsFrom geeft hoogstens vijf suggesties terug', () => {
  const results = Array.from({ length: 8 }, (_, i) => ({ name: `Kamp${i}`, latitude: i, longitude: i }));
  assert.equal(citySuggestionsFrom({ results }, 'kamp').length, 5);
});

// --- places ---

test('placeFromGeoHit vult een Place uit een geo-hit', () => {
  assert.deepEqual(
    placeFromGeoHit({ name: 'Zwolle', country: 'NL', lat: 52.5125, lon: 6.0925 }),
    { name: 'Zwolle', country: 'NL', lat: 52.5125, lon: 6.0925 },
  );
});

test('placeFromGeoHit staat een ontbrekend land toe', () => {
  assert.deepEqual(placeFromGeoHit({ name: 'X', lat: 1, lon: 2 }), { name: 'X', country: '', lat: 1, lon: 2 });
});

test('placeFromGeoHit geeft null bij onbruikbare hits', () => {
  assert.equal(placeFromGeoHit(undefined), null);
  assert.equal(placeFromGeoHit({ country: 'NL', lat: 52.5, lon: 6.09 }), null);
  assert.equal(placeFromGeoHit({ name: 'Zwolle' }), null);
  assert.equal(placeFromGeoHit({ name: 'Zwolle', lat: 52.5 }), null);
});

test('labelPlace toont bij GPS de reverse-geocodeerde plaats op de weer-coördinaten', () => {
  const weather = { name: 'Kampen', country: 'NL', lat: 52.5, lon: 6.05 };
  const reverse = { name: 'Zwolle', country: 'NL', lat: 52.51, lon: 6.09 };
  const place = labelPlace('gps', weather, reverse, null);
  assert.deepEqual(place, { name: 'Zwolle', country: 'NL', lat: 52.5, lon: 6.05 });
});

test('labelPlace valt bij GPS terug op de weernaam zonder reverse-hit', () => {
  const weather = { name: 'Kampen', country: 'NL', lat: 52.5, lon: 6.05 };
  assert.deepEqual(labelPlace('gps', weather, null, null), weather);
});

test('labelPlace behoudt bij standaardlocatie de gekozen plaats', () => {
  const weather = { name: 'Katerveer', country: 'NL', lat: 52.49, lon: 6.08 };
  const resolved = { name: 'Zwolle', country: 'NL', lat: 52.49, lon: 6.08 };
  const place = labelPlace('default', weather, { name: 'Kampen', country: 'NL', lat: 52.5, lon: 6.05 }, resolved);
  assert.equal(place.name, 'Zwolle');
});

test('labelPlace valt bij standaardlocatie terug op de weernaam zonder resolved', () => {
  const weather = { name: 'Zwolle', country: 'NL', lat: 52.5, lon: 6.09 };
  assert.deepEqual(labelPlace('default', weather, null, null), weather);
});

test('labelPlace houdt het weerland vast als de reverse-hit geen land heeft', () => {
  const weather = { name: 'Kampen', country: 'NL', lat: 52.5, lon: 6.05 };
  const reverse = { name: 'Zwolle', country: '', lat: 52.5, lon: 6.05 };
  const place = labelPlace('gps', weather, reverse, null);
  assert.equal(place.country, 'NL');
});

test('commitDefaultLocation behoudt de geverifieerde plaats bij dezelfde naam', () => {
  const place = { name: 'Zwolle', country: 'NL', lat: 52.5, lon: 6.09 };
  assert.deepEqual(
    commitDefaultLocation(' Zwolle ', place),
    { defaultLocation: 'Zwolle', defaultPlace: place },
  );
});

test('commitDefaultLocation wist de geverifieerde plaats bij een andere tekst', () => {
  const place = { name: 'Zwolle', country: 'NL', lat: 52.5, lon: 6.09 };
  assert.deepEqual(
    commitDefaultLocation('Amersfoort', place),
    { defaultLocation: 'Amersfoort', defaultPlace: null },
  );
});

test('commitDefaultLocation geeft null bij een leeg veld', () => {
  assert.equal(commitDefaultLocation('   ', null), null);
});

let failed = 0;
(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`  ✗ ${name}\n    ${error.message}`);
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} van ${tests.length} kern-tests gefaald`);
    process.exit(1);
  }
  console.log(`\nAlle ${tests.length} kern-tests geslaagd`);
})();
