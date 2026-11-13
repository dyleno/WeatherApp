# Alive Weather UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Deltion weather app feel alive — animated (recolored) Lottie weather art, calm fade-based controls, a consistent Inter/Playfair type scale, condition-aware sky tint, forecast range bars, and skeleton loading — without losing the editorial, earthy design.

**Architecture:** Pure logic (art mapping, Lottie recolor, sky tint, range-bar geometry) goes in `src/core/*.ts` and is tested by the existing plain-node test runner (`npm test`); UI gets new/modified components in `src/components`. Theme flows through `useSettings()` (`palette`, `t`) as it does today.

**Tech Stack:** Expo SDK 58, RN 0.88, react-native-reanimated 4.7.1 (already present), new: `lottie-react-native`, `expo-linear-gradient`, `@expo-google-fonts/inter`.

**Spec:** `docs/superpowers/specs/2026-11-10-alive-weather-ui-design.md`

## Global Constraints

- New dependencies ONLY via `npx expo install <pkg>`; run `npx expo-doctor` after each install task. npm (package-lock.json), never bun.
- Never create/edit `ios/` or `android/` dirs (CNG project).
- `src/core/**` stays react-native-free (type-only imports, no extensions needed — existing pattern); every new core function gets tests in `scripts/core-tests.cjs` (require from `../build-test/core/<file>`), run via `npm test`.
- Code style: named function exports, `StyleSheet.create`, Dutch comments, existing spacing/radius vocabulary from `tokens.ts`.
- Calm-motion rule: controls animate with fades/tweens ≤ 200 ms and never translate; the only always-on loop is the hero art; shimmer is loading feedback only.
- After every task: `npx tsc --noEmit`, `npm run lint`, `npm run test` must pass, then commit.
- Verify visually on the booted "iPhone 16" simulator (`xcrun simctl list devices | grep "iPhone 16"`).

## Review Focus

1. **Theme switch while the app is open** — recolored art and sky tint must follow light/dark live. Test: recolor tests assert light and dark maps produce different outputs (Task 4); manual theme-toggle visual step in Task 5 and Task 6.
2. **Unknown OWM icon code (e.g. `99x`)** — must fall back to the cloudy art, never crash. Test: `artKeyForIcon('99x', true) === 'cloudy'` (Task 4); `WeatherArt` load-error fallback step (Task 5).
3. **`weekMin === weekMax`** (flat week / single day) — range bar must not divide by zero; fill spans the full track. Test in Task 7.
4. **Rapid pull-to-refresh / unmount mid-animation** — the count-up hook must cancel its animation frame on target change and unmount. Step: cleanup review + unmount check (Task 7).
5. **Missing or corrupt Lottie asset** — `WeatherArt` renders the flat `WeatherGlyph` fallback instead of crashing. Step: temporarily rename an asset, expect icon, revert (Task 5).

---

### Task 1: Baseline on iPhone 16

**Files:**
- Create: nothing (verification only)

**Interfaces:**
- Consumes: booted "iPhone 16" simulator (already created and booted, UDID EB6DB116-DA13-4F8E-8A2C-A1AFD744CC05)
- Produces: green baseline (tests/lint/tsc) and a "before" screenshot path used by Task 9.

- [ ] **Step 1: Confirm baseline checks pass before any change**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass. If not, stop and report — do not build on a red baseline.

- [ ] **Step 2: Start the dev server and open the app on the simulator**

Run `npx expo start` in the background; then open the app on the booted iPhone 16 sim (`i` in the CLI, or `xcrun simctl openurl booted exp://<host>:8081`).
Expected: app renders (demo mode if no API key set).

- [ ] **Step 3: Take the "before" screenshot**

Run: `xcrun simctl io "iPhone 16" screenshot /private/var/folders/_z/_0jrny5n2cj3nfb_vlxs0h9c0000gn/T/opencode/weather-before-dark.png` (repeat for light theme + settings tab).
Expected: 3 screenshot files exist; cite the paths in the final report.

---

### Task 2: Type scale + Inter fonts

**Files:**
- Modify: `package.json` (via `npx expo install @expo-google-fonts/inter`)
- Modify: `src/app/_layout.tsx` (load Inter weights)
- Modify: `src/theme/tokens.ts` (add `sans()` + `type` scale)
- Modify: `src/components/AppHeader.tsx`, `src/components/InfoTile.tsx`, `src/components/ForecastRow.tsx`, `src/components/Banner.tsx`, `src/components/SettingSection.tsx`, `src/components/Segmented.tsx`, `src/components/SelectGrid.tsx`, `src/screens/WeatherScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/AboutScreen.tsx`, `src/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: existing `serif()` helper in `tokens.ts`.
- Produces (in `src/theme/tokens.ts`), used by Tasks 3–8:
  - `export const sans = (weight: 'regular' | 'medium' | 'semibold' | 'bold'): string` → `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`.
  - `export const type = { display: {fontSize: 96, lineHeight: 104, fontFamily: serif('medium')}, screenTitle: {fontSize: 40, lineHeight: 46, fontFamily: serif('semibold')}, sectionTitle: {fontSize: 26, fontFamily: serif('semibold')}, condition: {fontSize: 22, fontFamily: serif('medium')}, cardTitle: {fontSize: 17, fontFamily: sans('semibold')}, dataValue: {fontSize: 21, fontFamily: sans('semibold')}, body: {fontSize: 15, lineHeight: 22}, bodySmall: {fontSize: 13, lineHeight: 19}, label: {fontSize: 12}, eyebrow: {fontSize: 11, letterSpacing: 1.5, fontFamily: sans('bold')}, dayName: {fontSize: 15, fontFamily: serif('medium')} } as const;`

- [ ] **Step 1: Install Inter**

Run: `npx expo install @expo-google-fonts/inter && npx expo-doctor`
Expected: install succeeds; doctor reports no critical issues.

- [ ] **Step 2: Add `sans()` and `type` to `src/theme/tokens.ts`**

Signatures exactly as in Interfaces. No component changes yet.

- [ ] **Step 3: Load Inter in `src/app/_layout.tsx`**

Add `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` to the existing `useFonts({...})` call.

- [ ] **Step 4: Apply the scale across all listed files**

Rule (from the spec): serif = display (hero temp `display`, screen titles `screenTitle`, `condition`, `dayName`, `sectionTitle`); Inter = everything else. Replace ad-hoc `fontWeight: '700'`/system stacks: header title → `cardTitle`, tile values → `dataValue`, forecast min/max → `body` + `sans('semibold')` for max, eyebrows → `type.eyebrow`, banner text → `bodySmall`, tab bar labels → `{fontSize: 11, fontFamily: sans('medium')}`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: fonts look uniform across all three tabs, both themes.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/theme/tokens.ts src/app/_layout.tsx src/components src/screens "src/app/(tabs)/_layout.tsx"
git commit -m "feat(ui): consistent Inter/Playfair type scale"
```

---

### Task 3: Calm settings controls (fade, no slide)

**Files:**
- Modify: `src/components/Segmented.tsx`
- Modify: `src/components/SelectGrid.tsx`

**Interfaces:**
- Consumes: `sans()`/`type` from Task 2; existing props of both components stay unchanged (callers in SettingsScreen need zero edits).
- Produces: same component APIs — `<Segmented options value onChange colors/>`, `<SelectGrid ... />`.

- [ ] **Step 1: `Segmented` — replace the sliding thumb with a fade-in-place highlight**

Remove the `position` shared value and translateX animated style. Render the thumb as `<Animated.View key={value} entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={[styles.thumb, { width: cellWidth, left: selectedIndex * cellWidth, backgroundColor: colors.selected }]} />`. No transform, ever.

- [ ] **Step 2: `SelectGrid` — tween colors instead of instant swap**

Each cell owns `const selected = useSharedValue(0)`; on render-sync `selected.value = withTiming(value === option.value ? 1 : 0, { duration: 150 })` (in an effect keyed on `value`). `useAnimatedStyle` interpolates `backgroundColor` between `'transparent'` and `colors.selected` and text color is interpolated via a second animated style on the Text's Animated wrapper (muted → selectedText). The check icon mounts inside `<Animated.View entering={FadeIn.duration(150)}>`. Borders/press states stay as-is.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: toggling theme/units on Settings shows a soft fade, zero sideways movement; selection still persists (AsyncStorage round-trip via SettingsContext); repeat once in light and dark.

- [ ] **Step 4: Commit**

```bash
git add src/components/Segmented.tsx src/components/SelectGrid.tsx
git commit -m "feat(settings): fade-based selection, remove sliding thumb"
```

---

### Task 4: Lottie foundation — assets, recolor, art mapping

**Files:**
- Modify: `package.json` (via `npx expo install lottie-react-native`)
- Create: `assets/weather/<artkey>.json` (8 files), `assets/weather/LICENSE.md`
- Create: `src/core/lottieRecolor.ts`
- Create: `src/core/weatherArt.ts`
- Modify: `scripts/core-tests.cjs` (new tests)

**Interfaces:**
- Produces:
  - `src/core/lottieRecolor.ts`: `export type ColorMap = Record<string, string>;` and `export function recolorLottieColors(json: unknown, map: ColorMap): unknown` — pure, non-mutating; walks nested objects/arrays; wherever a color property `c: { k: [r, g, b] | [r, g, b, a] }` (0–1 floats) appears, remap `rgb → hex → map` (match on `'#[rrggbb]'` case-insensitively); colors not in the map pass through; returns a new structure.
  - `src/core/weatherArt.ts`: `export type ArtKey = 'clearDay' | 'clearNight' | 'partlyDay' | 'cloudy' | 'rain' | 'thunder' | 'snow' | 'fog';` and `export function artKeyForIcon(code: string, isDay: boolean): ArtKey` — mapping: `01`→`clearDay`/`clearNight`, `02d`→`partlyDay`, `02n`→`cloudy`, `03`/`04`→`cloudy`, `09`/`10`→`rain`, `11`→`thunder`, `13`→`snow`, `50`→`fog`, anything else → `cloudy` (mirrors `glyphForIcon`'s fallback).
  - Asset files named exactly `<ArtKey>.json` (e.g. `assets/weather/clearNight.json`).

- [ ] **Step 1: Install lottie**

Run: `npx expo install lottie-react-native && npx expo-doctor`
Expected: SDK-compatible version installed; doctor clean.

- [ ] **Step 2: Write the failing tests in `scripts/core-tests.cjs`**

```js
const { recolorLottieColors } = require('../build-test/core/lottieRecolor');
const { artKeyForIcon } = require('../build-test/core/weatherArt');

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
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../build-test/core/lottieRecolor'`.

- [ ] **Step 4: Implement `src/core/lottieRecolor.ts` and `src/core/weatherArt.ts`**

`recolorLottieColors`: recursive walk (arrays and plain objects); when an object has `c` whose value is `{k: number[]}` with `k.length` 3–4 and all entries ≤ 1, treat as color, hex-match (round channel × 255), replace via map or clone as-is. Everything else cloned structurally. Dutch comments, named export only.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green including the new ones.

- [ ] **Step 6: Source the Lottie pack (license-checked) and add the 8 assets**

Find one cohesive free-license animated weather set covering the 8 `ArtKey`s (LottieFiles or a GitHub pack with CC0/MIT/Free-license). Download with `curl` into `assets/weather/`, normalize filenames to `<ArtKey>.json`, and record the pack name, author, license, and source URL in `assets/weather/LICENSE.md`. If no downloadable free pack can be verified, stop and ask the user to download their favorite pack from LottieFiles into `assets/weather/` (one file per condition), then continue.

- [ ] **Step 7: Verify assets parse and sizes are sane**

Run: `node -e "const fs=require('fs');for(const f of fs.readdirSync('assets/weather')){if(f.endsWith('.json')){JSON.parse(fs.readFileSync('assets/weather/'+f,'utf8'));console.log(f,'ok')}}" && du -sh assets/weather`
Expected: every `.json` parses; total under ~5 MB.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json assets/weather src/core/lottieRecolor.ts src/core/weatherArt.ts scripts/core-tests.cjs
git commit -m "feat(core): lottie assets, palette recolor and art mapping"
```

---

### Task 5: `WeatherArt` component + hero and forecast integration

**Files:**
- Create: `src/components/WeatherArt.tsx`
- Modify: `src/screens/WeatherScreen.tsx` (hero glyph → art, crossfade on condition change)
- Modify: `src/components/ForecastRow.tsx` (glyph → paused art)

**Interfaces:**
- Consumes: `artKeyForIcon`, `recolorLottieColors` (Task 4); assets `../../assets/weather/<ArtKey>.json`; `WeatherGlyph` as fallback; `serif`/palette via props as `WeatherGlyph` does today.
- Produces: `export const WeatherArt = ({ code, isDay, size, colors, playing = true }: { code: string; isDay: boolean; size: number; colors: Palette; playing?: boolean })` — loops when `playing`, renders paused on frame 0 otherwise; on asset load error renders `<WeatherGlyph>`.

- [ ] **Step 1: Implement `WeatherArt.tsx`**

Require the assets via a **static map** (no dynamic requires — Metro-safe): `const ASSETS: Record<ArtKey, { default: unknown }> = { clearDay: require('../../assets/weather/clearDay.json'), clearNight: require('../../assets/weather/clearNight.json'), partlyDay: require('../../assets/weather/partlyDay.json'), cloudy: require('../../assets/weather/cloudy.json'), rain: require('../../assets/weather/rain.json'), thunder: require('../../assets/weather/thunder.json'), snow: require('../../assets/weather/snow.json'), fog: require('../../assets/weather/fog.json') };`. Build the `ColorMap` per theme from the pack's actual colors (inspect once with a `node -e` script listing distinct `c.k` hexes; write the table mapping them to `colors.sun`, `colors.cloud`, `colors.accent`, `colors.teal`, `colors.text`); memoize recolored JSON in a module-level `Map<string, unknown>` keyed `${key}:${isDark}`. `<LottieView autoPlay={playing} loop={playing} speed={0.8} source={recolored} style={{width: size, height: size}} />`; `onFailure`/error state → render `WeatherGlyph`. `playing === false` renders with `autoPlay={false}` and `progress={0}` semantics (first frame).

- [ ] **Step 2: Hero — swap the glyph and crossfade on condition change**

In `WeatherScreen.tsx`, replace the `<WeatherGlyph ... size={112}>` in `hero` with `<Animated.View key={`${snapshot.current.icon}-${snapshot.current.isDay}`} entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}><WeatherArt code={snapshot.current.icon} isDay={snapshot.current.isDay} size={112} colors={palette} /></Animated.View>`.

- [ ] **Step 3: Forecast rows — paused art**

In `ForecastRow.tsx`, replace `<WeatherGlyph code size={30}>` with `<WeatherArt code={icon} isDay={isDay} size={30} colors={colors} playing={false} />`.

- [ ] **Step 4: Verify including the failure fallback**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: hero art loops smoothly and follows its palette; forecast rows show static first-frame art; toggling theme recolors the art live (Review Focus 1). Fallback (Review Focus 5): temporarily rename `assets/weather/clearDay.json`, reload → flat icon shows instead of crash; rename back.

- [ ] **Step 5: Commit**

```bash
git add src/components/WeatherArt.tsx src/components/ForecastRow.tsx src/screens/WeatherScreen.tsx
git commit -m "feat(ui): living weather art in hero and forecast"
```

---

### Task 6: Depth & material — sky tint, gradient panel, shadows

**Files:**
- Modify: `package.json` (via `npx expo install expo-linear-gradient`)
- Create: `src/core/sky.ts`
- Create: `src/components/SkyTint.tsx`
- Modify: `scripts/core-tests.cjs`, `src/screens/WeatherScreen.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/AboutScreen.tsx`, `src/components/InfoTile.tsx`, `src/components/Banner.tsx`

**Interfaces:**
- Consumes: `type` scale (Task 2); `WeatherScreen`'s snapshot + palette.
- Produces:
  - `src/core/sky.ts`: `export type SkyTone = { top: string; bottom: string };` and `export function skyForIcon(code: string, isDay: boolean, isDark: boolean): SkyTone` — tint pairs pinned below; unknown codes → the `cloudy` row.
  - `src/components/SkyTint.tsx`: `export const SkyTint = ({ top, bottom }: SkyTone)` — absolutely-positioned full-size `LinearGradient` (`colors={[top, bottom]}`, `locations={[0, 1]}`) rendering behind screen content.

- [ ] **Step 1: Write the failing test in `scripts/core-tests.cjs`**

```js
const { skyForIcon } = require('../build-test/core/sky');

test('sky-tint: regen koeler dan zon, nacht anders dan dag, fallback", () => {
  const clearDay = skyForIcon('01d', true, true);
  const rainDay = skyForIcon('10d', true, true);
  assert.notEqual(clearDay.bottom, rainDay.bottom);
  assert.notEqual(skyForIcon('01d', true, true).bottom, skyForIcon('01d', false, true).bottom);
  assert.deepEqual(skyForIcon('99x', true, true), skyForIcon('03d', true, true)); // fallback = cloudy
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — module `sky` not found.

- [ ] **Step 3: Implement `sky.ts` with this exact tint table (subtle, palette-derived)**

Dark (bg `#17191C`): clearDay `{top:'#17191C', bottom:'#221E18'}`; clearNight `{top:'#17191C', bottom:'#12211E'}`; partly `{top:'#17191C', bottom:'#1C2220'}`; cloudy `{top:'#17191C', bottom:'#191E22'}`; rain `{top:'#17191C', bottom:'#181E23'}`; thunder `{top:'#17191C', bottom:'#1A1D24'}`; snow `{top:'#17191C', bottom:'#1B2023'}`; fog `{top:'#17191C', bottom:'#1B1D1E'}`.
Light (bg `#F3F2ED`): clearDay `{top:'#F3F2ED', bottom:'#F6EFDF'}`; clearNight `{top:'#F3F2ED', bottom:'#E9EFEA'}`; partly `{top:'#F3F2ED', bottom:'#EFEFE6'}`; cloudy `{top:'#F3F2ED', bottom:'#E7EBEA'}`; rain `{top:'#F3F2ED', bottom:'#E6EAEB'}`; thunder `{top:'#F3F2ED', bottom:'#E4E6E9'}`; snow `{top:'#F3F2ED', bottom:'#EFF1F0'}`; fog `{top:'#F3F2ED', bottom:'#ECECEA'}`.

- [ ] **Step 4: Run tests to green**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Install gradient, add `SkyTint`, apply depth**

`npx expo install expo-linear-gradient && npx expo-doctor`. Implement `SkyTint` and wrap the root `View` of Weather, Settings and About (screen bg becomes the gradient; keep `backgroundColor: palette.bg` underneath as fallback). Outlook panel: background becomes a subtle `LinearGradient` (`panel` → `bg`, same direction). Radius bump: tiles container, outlook and banner 10/6 → 14/10. Soft shadow on tiles container + outlook: `boxShadow: '0px 6px 18px rgba(23,25,28,0.16)'` (dark) / `'0px 6px 18px rgba(35,38,31,0.10)'` (light), chosen via `isDark`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: sky tint is barely-there and changes with theme (Review Focus 1); cards have gentle depth; nothing gaudy in light mode.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/core/sky.ts src/components/SkyTint.tsx src/components/InfoTile.tsx src/components/Banner.tsx src/screens
git commit -m "feat(ui): condition-aware sky tint, gradient panel, soft shadows"
```

---

### Task 7: Data visuals — range bars, count-up, tile accents

**Files:**
- Create: `src/core/range.ts`
- Create: `src/components/RangeBar.tsx`
- Create: `src/hooks/useCountUp.ts`
- Modify: `scripts/core-tests.cjs`, `src/components/ForecastRow.tsx`, `src/components/InfoTile.tsx`, `src/screens/WeatherScreen.tsx`

**Interfaces:**
- Consumes: Task 2 scale; existing `aggregateDaily` output (`minC`/`maxC` per day).
- Produces:
  - `src/core/range.ts`: `export function rangeBarGeometry(dayMin: number, dayMax: number, weekMin: number, weekMax: number): { start: number; width: number }` — percentages 0–100, clamped; `weekMax === weekMin` → `{ start: 0, width: 100 }`.
  - `src/components/RangeBar.tsx`: `({ dayMin, dayMax, weekMin, weekMax, colors, delay }: { dayMin: number; dayMax: number; weekMin: number; weekMax: number; colors: Palette; delay?: number })` — 4 px track (`colors.border`), fill `LinearGradient` `colors.accent → colors.sun`, width animates 0 → geometry.width with `withTiming(500)` + `delay` on mount.
  - `src/hooks/useCountUp.ts`: `export function useCountUp(target: number, durationMs = 450): number` — rAF tween with `easeOutCubic(t) = 1 - Math.pow(1 - t, 3)`; cancels prior frame on `target` change; cancels on unmount.
  - `InfoTile` gains optional `iconColor?: string` (defaults to `colors.muted`).

- [ ] **Step 1: Write the failing tests in `scripts/core-tests.cjs`**

```js
const { rangeBarGeometry } = require('../build-test/core/range');

test('range-balk: dagsegment binnen weekbereik', () => {
  const g = rangeBarGeometry(8, 19, 5, 21);
  assert.equal(g.start, 18.75);
  assert.equal(g.width, 68.75);
});

test('range-balk: vlakke week deelt niet door nul', () => {
  assert.deepEqual(rangeBarGeometry(12, 12, 12, 12), { start: 0, width: 100 });
});

test('range-balk: klem op 0-100', () => {
  const g = rangeBarGeometry(-10, 40, -20, 50);
  assert.ok(g.start >= 0 && g.start + g.width <= 100);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — module `range` not found.

- [ ] **Step 3: Implement `src/core/range.ts`**

`start = ((dayMin - weekMin) / (weekMax - weekMin)) * 100`, `width = ((dayMax - dayMin) / (weekMax - weekMin)) * 100`, both clamped to `[0, 100]` and `start + width ≤ 100`; degenerate week → `{ start: 0, width: 100 }`. Dutch comments.

- [ ] **Step 4: Run tests to green**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implement `RangeBar`, `useCountUp`, and integrate**

`WeatherScreen`: compute `weekMin`/`weekMax` from `snapshot.daily` with `Math.min`/`Math.max`, pass to every `ForecastRow`; hero temp renders `Math.round(useCountUp(Math.round(celsiusToUnit(...))))`. `ForecastRow` renders `<RangeBar ... delay={enterDelay + 100} />` under the temps row. `InfoTile` callsites pass `iconColor`: wind → `palette.teal`, pressure → `palette.accent`, humidity → `palette.sun`. Count-up cleanup: `cancelAnimationFrame` in the effect cleanup (Review Focus 4).

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: bars grow on entrance; switching °C↔°F counts the hero temp up/down; pulling to refresh animates the number instead of jumping; tile icons carry their accent colors.

- [ ] **Step 7: Commit**

```bash
git add src/core/range.ts src/components/RangeBar.tsx src/hooks/useCountUp.ts src/components/ForecastRow.tsx src/components/InfoTile.tsx src/screens/WeatherScreen.tsx scripts/core-tests.cjs
git commit -m "feat(ui): forecast range bars, count-up temperature, tile accents"
```

---

### Task 8: Skeleton loading + screen entrances

**Files:**
- Create: `src/components/Skeleton.tsx`
- Modify: `src/screens/WeatherScreen.tsx` (loading branch), `src/screens/SettingsScreen.tsx`, `src/screens/AboutScreen.tsx`

**Interfaces:**
- Consumes: Task 2 scale; `palette` via props; reanimated (present).
- Produces: `export const Skeleton = ({ width, height, radius = 10, colors, style }: { width: number | `${number}%`; height: number; radius?: number; colors: Palette; style?: object })` — base box `colors.field` with a slow opacity pulse (0.55 → 1, `withRepeat(withTiming, 1400, true)`); no translate shimmer (calm-motion rule).

- [ ] **Step 1: Implement `Skeleton.tsx`**

One component, opacity-pulse only. Compose the loading branch in `WeatherScreen` (replacing the bare `ActivityIndicator` when `!snapshot && !error`): circle 96 (hero), two lines (location/date), row of three 84-high boxes (tiles), one 220-high box (outlook), gaps matching `portraitContent`.

- [ ] **Step 2: Entrances on Settings and About**

Wrap each top-level section (title block, then each `SettingSection` / about row) in `<Animated.View entering={FadeInDown.delay(index * 60).duration(420)}>`, same pattern as `WeatherScreen`'s constants (module-level, outside the component).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: pass. Visual: loading state shows the gentle skeleton (verify with a real API key on a throttled network, or temporarily add `await new Promise(r => setTimeout(r, 1500))` at the top of `load()` — remove before committing); Settings/About stagger in like the weather screen.

- [ ] **Step 4: Commit**

```bash
git add src/components/Skeleton.tsx src/screens
git commit -m "feat(ui): skeleton loading and staggered screen entrances"
```

---

### Task 9: Final verification & polish pass

**Files:**
- Modify: only whatever the polish pass finds (typos, spacing, one-off inconsistencies)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Full check suite**

Run: `npm test && npx tsc --noEmit && npm run lint && npx expo-doctor`
Expected: all green.

- [ ] **Step 2: Walk the Review Focus list on the simulator**

Theme switch live (art + sky follow), demo mode with odd conditions, flat-week range bar (demo data), rapid pull-to-refresh, and the asset-failure fallback. Fix anything that bites.

- [ ] **Step 3: After-screenshots and comparison**

`xcrun simctl io "iPhone 16" screenshot` for weather dark/light, settings, about → save to the same temp folder as Task 1's "before" shots and cite all paths.

- [ ] **Step 4: Commit (if the polish pass changed anything) and report**

```bash
git add -A
git commit -m "polish(ui): final pass"
```
