# Cloudy Wind Streaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Geef de bewolkt-weerkunst leesbare wind: twee sliert-lagen die achter de wolk langs Swept, in één asset, in de stijl en het tempo van de bestaande flat-set.

**Architecture:** Puur een asset-wijziging. De twee sliert-paden uit `flat/wind.json` (Meteocons, zelfde 128×128 canvas, 60 fps, 6 s loop) worden als lagen achter de wolk in `assets/weather/cloudy.json` geplaatst, met handgeschreven positie- + opacity-keyframes (het flat-asset is statisch). De sliertkleur `#e2e8f0` staat al in de recolor-kaart → `colors.muted`; er verandert géén app-code.

**Tech:** Node-script voor de merge, `scripts/core-tests.cjs` voor de asset-test, dev build op de simulator voor visuele verificatie.

**Spec:** `docs/superpowers/specs/2026-11-10-cloudy-wind-design.md`

## Global Constraints

- Rustige beweging: alleen loops, geen slides/scales op controls — de sliertensweep is kunst, niet UI-motion, en loopt op de bestaande 6 s cyclus (speed 0.8 blijft).
- Kunst recolort naar het palet en volgt licht/donker — sliertkleur `#e2e8f0` → `colors.muted` (staat al in `colorMapFor` in `src/components/WeatherArt.tsx`, niets wijzigen).
- Geen nieuwe dependencies; assets blijven Meteocons MIT (`assets/weather/LICENSE-MIT.txt` dekt de pack).
- Metro-veilig: `WeatherArt.tsx` require't `cloudy.json` statisch — bestandsnaam en -locatie blijven gelijk.
- Loop-naad: beide slierten eindigen op opacity 0 vóór t=360 en starten op 0.

## Review Focus

1. **Tab-icoon (26 px):** slierten mogen het icoon niet rommelig of onleesbaar maken — visuele check op de dev build (Task 2 crop).
2. **Donker thema:** `muted`-sliert moet op de donkere kaart zichtbaar maar zacht blijven — visuele check donker (Task 2).
3. **Loop-naad:** een sprong bij t=360 breekt de rust — de asset-test pint fade-in vanaf 0 en fade-out naar 0 (Task 1); visuele check over de naad heen in Task 2.
4. **Rijgrootte (30 px):** slierten in de voorspelrijen moeten subtiel blijven, niet wazig — zelfde crop-check als 1.
5. **Recolor-cache tijdens Fast Refresh:** Metro serveert het nieuwe asset pas na een volledige reload; bij twijfel app herstarten (bekend patroon uit de Lottie-saga) — Task 2 gebruikt terminate+launch.

---

### Task 1: Wind-sliert-lagen in cloudy.json (asset + test)

**Files:**
- Create: `scripts/merge-cloudy-wind.cjs`
- Modify: `assets/weather/cloudy.json` (via het script)
- Test: `scripts/core-tests.cjs` (nieuw testblok na `art mapping dekt alle OWM-codes met fallback`)

**Interfaces:**
- Consumes: `flat/wind.json` van `https://cdn.jsdelivr.net/npm/@meteocons/lottie@0.1.0/flat/wind.json` (twee lagen `Wind Line 1`, `Wind Line 1_2`; paden + stroke `#e2e8f0`, width 4; ks: o/r/a/s statisch, p=[0,0,0]).
- Produces: `cloudy.json` met 3 lagen — index 0 `Clouds` (onaangetast, bovenop), daarna de twee sliert-lagen met geanimeerde `ks.p` (sweep) en `ks.o` (fade). Wordt gelezen door `WeatherArt.tsx` via de bestaande statische require; geen handtekeningwijzigingen.

- [ ] **Step 1: Schrijf de falende asset-test** in `scripts/core-tests.cjs` (vereist bovenin: `const cloudyAsset = require('../assets/weather/cloudy.json');`)

```js
test('bewolkt-asset: wind-sliert-lagen met naadloze sweep', () => {
  assert.equal(cloudyAsset.fr, 60);
  assert.equal(cloudyAsset.op, 360);
  assert.equal(cloudyAsset.layers[0].nm, 'Clouds'); // wolk blijft bovenop
  const streaks = cloudyAsset.layers.filter((l) => l.nm.startsWith('Wind Line'));
  assert.equal(streaks.length, 2);
  for (const s of streaks) {
    assert.deepEqual(s.ks.a.k, [0, 0, 0]);
    const o = s.ks.o.k; // opacity-keyframes geleiden de zichtbaarheid
    assert.equal(o[0].s[0], 0); // fade-in vanaf onzichtbaar
    assert.equal(o[o.length - 1].s[0], 0); // fade-out vóór de loopnaad
    assert.equal(s.ks.p.a, 1); // positie geanimeerd (sweep)
    const xs = s.ks.p.k.map((k) => k.s[0]);
    assert.ok(Math.min(...xs) <= -40 && Math.max(...xs) >= 40);
    const stroke = s.shapes[0].it.find((i) => i.ty === 'st');
    const hex = '#' + stroke.c.k.slice(0, 3).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
    assert.equal(hex, '#e2e8f0'); // in de recolor-kaart → colors.muted
  }
});
```

- [ ] **Step 2: Run de test, verwacht FAIL** — `npm test` faalt op `layers[0].nm`/streak-count (huidig asset heeft 1 laag).

- [ ] **Step 3: Maak `scripts/merge-cloudy-wind.cjs`** en run hem (`node scripts/merge-cloudy-wind.cjs`). Script (vastgespeld):

  - Haalt `flat/wind.json` van de jsDelivr-URL hierboven (node `fetch`), leest `assets/weather/cloudy.json`.
  - Klonen van beide wind-lagen (diepe clone, geen mutatie van het gedownloade object), elk krijgt:
    - `nm` onveranderd (`Wind Line 1`, `Wind Line 1_2`), `ip: 0`, `op: 360`.
    - **`ks.o` = `{ a: 1, k: [keyframes] }`** met ease `i:{x:0.58,y:1}`, `o:{x:0.42,y:0}` per segment:
      - Wind Line 1: `t:0 s:[0]`, `t:30 s:[100]`, `t:140 s:[100]`, `t:180 s:[0]`.
      - Wind Line 1_2: `t:108 s:[0]`, `t:138 s:[100]`, `t:248 s:[100]`, `t:288 s:[0]`.
      - (na de laatste keyframe houdt Lottie de waarde → beide lijnen onzichtbaar tot t=360; naadloze loop)
    - **`ks.p` = `{ a: 1, k: [keyframes] }`**, zelfde ease-familie:
      - Wind Line 1: `t:0 s:[-44,0,0]`, `t:180 s:[44,0,0]`.
      - Wind Line 1_2: `t:108 s:[-44,0,0]`, `t:288 s:[44,0,0]`.
      - (vóór de eerste keyframe geldt de eerste waarde — lijn 2 staat "linksuit" terwijl hij onzichtbaar is)
  - Overige `ks`-velden (r, a, s) onveranderd uit het wind-asset.
  - Schrijft `cloudy.json` met layers `[Clouds (origineel), Wind Line 1, Wind Line 1_2]` — wolk blijft index 0 (Lottie: index 0 rendert bovenop, slierten lopen achter de wolk).
  - Canvas (`w`,`h`), `fr`, `op`, `ip`, meta van het cloud-asset onveranderd; schrijft compact (`JSON.stringify(a)`).

- [ ] **Step 4: Run de test, verwacht PASS** — `npm test` → alle 18 groen.

- [ ] **Step 5: Commit**

```bash
git add assets/weather/cloudy.json scripts/merge-cloudy-wind.cjs scripts/core-tests.cjs docs/superpowers/specs/2026-11-10-cloudy-wind-design.md docs/superpowers/plans/2026-11-10-cloudy-wind.md
git commit -m "feat(ui): wind streaks behind the cloudy weather art"
```

### Task 2: Visuele verificatie op de dev build

**Files:**
- Geen code; verificatie + ledger (`.superpowers/sdd/2026-11-10-alive-weather-ui/progress.md`).

**Interfaces:**
- Consumes: dev build `com.dyleno.deltion-weatherapp` op simulator "iPhone 16" (UDID `EB6DB116-DA13-4F8E-8A2C-A1AFD744CC05`), Metro op `localhost:8081`.
- Produces: verificatie-uitspraken in het ledger; geen code.

- [ ] **Step 1: Herstart de app** zodat Metro het nieuwe asset serveert: `xcrun simctl terminate "iPhone 16" com.dyleno.deltion-weatherapp; sleep 2; xcrun simctl launch "iPhone 16" com.dyleno.deltion-weatherapp; sleep 12`. Screenshot maken en **lezen**: slierten zichtbaar achter/naast de heldewolk; app geladen (locatie-alert mag staan; datum/data achter de dim veranderen niet aan de check).

- [ ] **Step 2: Pixel-diff sliert-regio** — 2 screenshots 2,5 s apart, crop rond de onderrand van de hero-wolk (bijv. `-c 200 260 --cropOffset 900 780` op basis van de live layout; crop zó kiezen dat sliertzone buiten de wolk valt), `cmp`: verwacht **ANIMATING**. Screenshot altijd lezen vóór het oordeel (stale-UI valkuil).

- [ ] **Step 3: Tab-icoon en rij leesbaarheid** — crop van het Weer-tab-icoon (≈26 px) en een voorspelrij (30 px) uit de screenshot; leesbaar = slierten subtiel zichtbaar of net onzichtbaar zonder rommel; bij rommel: sweep-amplitude omlaag (bijv. ±32) en opnieuw.

- [ ] **Step 4: Donker thema** — `xcrun simctl ui "iPhone 16" appearance dark`, screenshot lezen: sliert volgt `muted` en blijft zacht zichtbaar; daarna terug naar light.

- [ ] **Step 5: Ledger bijwerken** (uitspraken per stap) en, als er asset-tuning was, de nieuwe waarden in Step 3 terugvoeren in het script + asset + test herdraaien vóór het ledger.

---

## Zelf-review (uitgevoerd bij het schrijven)

- **Spec-dekking:** merge (Task 1), recolor (al in kaart — expliciet "niets wijzigen" in Interfaces), fasering/z-order/naad (gepind in Step 3 + test), tab-icoon/rij/donker (Task 2). Geen gaten.
- **Stappen:** elke stap één actie; keyframe-waarden exact gepind; geen TBD's.
- **Types/namen:** laagnamen `Wind Line 1`/`Wind Line 1_2` consistent tussen script en test; testvariabele `cloudyAsset` bovenin gedeclareerd.
- **Review Focus:** 1, 2, 4 → Task 2 stappen; 3 → test (Task 1) + Task 2; 5 → Task 2 Step 1.
- **Proportie:** plan is korter dan de implementatiedetails die het pin-waardig acht; geen transcript.
