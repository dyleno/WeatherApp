# Cloudy art met wind-slierten — Design (small change)

Date: 2026-11-10 · Status: **awaiting approval**

## Intent

De bewolkt-kunst (`assets/weather/cloudy.json`, hero + rijen + tab-icoon) is één laag met
alleen positie-sleutelframes — een subtiele bob, geen leesbare beweging. De gebruiker wil
daar "wat wind" in voelen: dezelfde wolk, met slierten die erlangs Swept.

## Beslissing (gebruiker koos via geanimeerde mockup-pagina)

**Wind-slierten samenvoegen in het asset**: de twee sliert-lagen uit
`flat/wind.json` (zelfde Meteocons flat-stijl, zelfde 60 fps / 6 s loop) worden in
`assets/weather/cloudy.json` gemerged — één asset, niets verandert aan de pipeline
(hero, rijen, tab-icoon recoloren hem al automatisch).

## Benaderingen overwogen

1. **Merge sliert-lagen in cloudy.json — gekozen**: exact de vraag ("wolk mét wind"),
   zelfde stijl/timing, nul nieuwe codepaden; recolor-kaart krijgt één kleur erbij voor
   de slierten.
2. Swap naar `flat/overcast.json` (twee wolken, parallax-drift) — verworpen: geen wind,
   en de semantiek schuift van "bewolkt" naar "overcast".
3. RN/Reanimated sliert-overlay náást de Lottie — verworpen: tweede bewegingssysteem
   naast Lottie, dubbele onderhoudslast voor hetzelfde effect.

## Details voor de bouwer

- Sliert-lages komen achter de wolk (z-order), onder/naast de onderrand; hun keyframes
  faseren over de 6 s loop zodat de twee lijnen niet tegelijk Swept (phase-shift van één
  laag indien nodig).
- Recolor: de sliert-streekkleur gaat in de `lottieRecolor`-kaart (volgt
  `palette.border`/`muted`-toon, licht en donker), zodat de slierten meekleuren met het
  thema zoals de wolk al doet.
- Tests: recolor-kaart-test uitgebreid met de sliertkleur; bestaande 17 blijven groen.
- Verificatie: pixel-diff op de dev build (hero + rij) + visuele check licht/donker;
  tab-icoon (26 px) checkt dat de slierten op kleine grootte leesbaar blijven.

## Niet-doelen

- Geen nieuwe assets voor andere condities (alleen bewolkt nu).
- Geen wijzigingen aan WeatherArt/ForecastRow-code — puur asset + recolor-kaart + tests.
