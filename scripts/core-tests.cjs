// Verifieert de pure kern (conversies, forecast-aggregatie, trend) zonder testframework.
// Gedraaid via `npm test` na compilatie met tsconfig.test.json.
const assert = require('node:assert/strict');
const { msToBeaufort, windValue, windValueLabel, compassPoint } = require('../build-test/core/wind');
const { aggregateDaily } = require('../build-test/core/forecast');
const { pressureTrend } = require('../build-test/core/pressure');
const { formatTemp } = require('../build-test/core/temperature');
const { glyphForIcon, humidityKey } = require('../build-test/core/conditions');

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

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
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
