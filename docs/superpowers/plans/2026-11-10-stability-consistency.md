# Stability & Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the three confirmed UI flaws — text jumps on control taps, wrong language/theme at startup, language-switch churn — and harden the weather-load race, with zero visual trade-offs.

**Architecture:** Pure logic (timeout race) goes in `src/core/async.ts` and is tested by the existing plain-node runner; the startup gate lives in `src/app/_layout.tsx` + `SettingsContext`; control stability is a style-level change in the two selection components; weather-load hygiene is state-level in `WeatherScreen`. Theme and translations keep flowing through `useSettings()` as today.

**Tech Stack:** Expo SDK 58, RN 0.88, react-native-reanimated 4.7.1 (present); no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-10-stability-consistency-design.md`

## Global Constraints

- No new dependencies; if one seems needed, stop and report.
- Never create/edit `ios/` or `android/` dirs (CNG project).
- `src/core/**` stays react-native-free; new core functions get tests in `scripts/core-tests.cjs` (require from `../build-test/core/<file>`), run via `npm test`.
- Code style: named exports, `StyleSheet.create`, Dutch comments, existing `tokens.ts` vocabulary.
- Calm-motion rule: fades ≤ 200 ms, no translate on controls.
- After every task: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint` must pass, then commit.
- Never `git add -A`; commit explicit paths only (`docs/` holds pre-existing untracked user content).
- Visual verification on the booted "iPhone 16" simulator (`xcrun simctl list devices | grep "iPhone 16"`); screenshots go to `/private/var/folders/_z/_0jrny5n2cj3nfb_vlxs0h9c0000gn/T/opencode/`. If the Expo Go dev-menu intro sheet blocks interaction, ask the user for one tap to dismiss it.

## Review Focus

1. **Slow or broken AsyncStorage at launch** — the app must render defaults within 1.5 s and never hang on the splash screen. Pinned by: `withTimeout` core tests (Task 3) + cold-start step (Task 7).
2. **Rapid NL↔EN flips with a live API key** — the displayed content must always match the last selection; an older response may never overwrite a newer one. Pinned by: five-flip sim step (Task 5, repeated in Task 7).
3. **Background refresh failure** (settings-driven, data already on screen) — old weather data stays visible, no error banner; a user-initiated pull-to-refresh failure still reports. Pinned by: airplane-mode step (Task 7, live key only).
4. **Control tap** — the label's rendered width is identical before and after selection; nothing moves inside the control. Pinned by: tap-through visual (Task 2).
5. **Corrupt or missing Lottie asset** — `WeatherArt` degrades to the flat `WeatherGlyph` (never blank — observed blank on the simulator, hence `isLottieShape`). Pinned by: `isLottieShape` core test + corrupt-asset re-check (Task 7).
6. **Tile label wrap** — long labels (`Luchtvochtigheid`) stay single-line; values across tiles start at the same height in both languages. Pinned by: visual (Task 7).
7. **Outlook day labels** — rows after "Morgen" carry the date number, so today is readable at a glance. Pinned by: visual (Task 7).

---

### Task 1: Pre-flight — bank the in-flight WeatherArt work

The tree holds completed-but-uncommitted alive-weather-ui Task 5 work (`src/components/WeatherArt.tsx` new; `ForecastRow.tsx`, `WeatherScreen.tsx` modified) and a **corrupted asset left over from a fallback test**: `assets/weather/cloudy.json` contains `{"invalid": true}`. Bank the work before this plan touches anything.

**Files:**
- Restore: `assets/weather/cloudy.json` (git-tracked, revert to HEAD)
- Commit as-is: `src/components/WeatherArt.tsx`, `src/components/ForecastRow.tsx`, `src/screens/WeatherScreen.tsx`

**Interfaces:**
- Produces: a clean working tree; `WeatherArt` (code/isDay/size/colors/playing) available for Task 7's fallback check.

- [ ] **Step 1: Restore the corrupted asset**

Run: `git checkout -- assets/weather/cloudy.json && node -e "JSON.parse(require('fs').readFileSync('assets/weather/cloudy.json','utf8'));console.log('parses ok')"`
Expected: `parses ok`.

- [ ] **Step 2: Full check suite on the restored tree**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: 13/13 core tests, tsc clean, lint clean. If red: stop and report — do not build on a broken baseline.

- [ ] **Step 3: Best-effort fallback visual check**

Temporarily run `echo '{"invalid": true}' > assets/weather/cloudy.json`, reload the app on the simulator (press `r` in the Metro terminal; dismiss the dev-menu sheet if it appears), open the Weather tab: the cloudy condition must show the flat glyph, not a blank or crash. Then `git checkout -- assets/weather/cloudy.json`. If the simulator cannot be driven at all, note it and defer this visual to Task 7's corrupt-asset re-check — the `onAnimationFailure` fallback is code-verified and the suite is green. (Execution note: the check was attempted; the app rendered **blank**, not the glyph — recorded as a real bug, fixed in Task 7.)

- [ ] **Step 4: Commit the WeatherArt work (alive-weather-ui Task 5's intended commit)**

```bash
git add src/components/WeatherArt.tsx src/components/ForecastRow.tsx src/screens/WeatherScreen.tsx
git commit -m "feat(ui): living weather art in hero and forecast"
```

- [ ] **Step 5: Version the spec and this plan**

```bash
git add docs/superpowers/specs/2026-11-10-stability-consistency-design.md docs/superpowers/plans/2026-11-10-stability-consistency.md
git commit -m "docs(superpowers): stability & consistency spec + plan"
```

- [ ] **Step 6: Bank "before" screenshots**

Weather tab light + Settings tab light + Weather tab dark:
`xcrun simctl io "iPhone 16" screenshot /private/var/folders/_z/_0jrny5n2cj3nfb_vlxs0h9c0000gn/T/opencode/{weather-stability-before-light,settings-stability-before-light,weather-stability-before-dark}.png`
Expected: 3 files exist; cited again in Task 7.

---

### Task 2: Constant font weight in selection controls

The selected label swaps `sans('medium')` → `sans('semibold')`; the two weights have different advance widths, so the glyphs jump inside the cell on tap. Selection already reads through fill color + thumb (Segmented) and fill + check (SelectGrid) — the weight swap is redundant and is removed.

**Files:**
- Modify: `src/components/Segmented.tsx` (label style, ~line 50)
- Modify: `src/components/SelectGrid.tsx` (label style, ~line 57)

**Interfaces:**
- Consumes: existing props of both components — unchanged; callers need zero edits.
- Produces: same component APIs; labels keep `styles.label` (Inter Medium) in every state.

- [ ] **Step 1: Segmented — remove the weight swap**

In the option `Text`, delete the `selected && { fontFamily: sans('semibold') }` element from the style array so only the base style and the selected-color style remain. Add the Dutch comment above the Text: `// Gelijk gewicht in elke staat: een fontwissel verspringt de tekstbreedte in de cel.` (`sans` stays imported — `styles.label` uses `sans('medium')`.)

- [ ] **Step 2: SelectGrid — remove the weight swap**

Same deletion in `GridCell`'s `Animated.Text` style array, same comment.

- [ ] **Step 3: Verify**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual: tap through theme, temperature, wind and language controls on the simulator — no text moves inside any control; selection state still obvious (fill + check). Repeat once in dark.

- [ ] **Step 4: Commit**

```bash
git add src/components/Segmented.tsx src/components/SelectGrid.tsx
git commit -m "fix(ui): constant control font weight — no text jump on select"
```

---

### Task 3: Startup gate — splash waits for fonts and settings

Settings load async *after* first paint, so a stored EN/dark setup flashes NL/light. Gate the navigator on both loads and keep the splash up until then; storage failure or slowness must fall back to defaults after 1.5 s.

**Files:**
- Create: `src/core/async.ts`
- Modify: `scripts/core-tests.cjs` (runner supports async tests; new tests)
- Modify: `src/state/SettingsContext.tsx` (load effect: race + catch)
- Modify: `src/app/_layout.tsx` (ready gate)

**Interfaces:**
- Consumes: `isLoaded` (already in `SettingsContextValue`), `DEFAULT_SETTINGS` via existing `loadSettings`.
- Produces: `export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T>` in `src/core/async.ts` — resolves with the underlying value before the deadline, rejects with `Error('timeout')` at the deadline; a late underlying resolution never wins the race. `AppReadyGate` is internal to `_layout.tsx`.

- [ ] **Step 1: Write the failing tests**

Upgrade the runner loop at the bottom of `scripts/core-tests.cjs` to await test fns (wrap in an async IIFE, keep the same pass/fail output and `process.exit(1)` on failure) — existing sync tests keep working under `await fn()`.

```js
const { withTimeout } = require('../build-test/core/async');

test('withTimeout geeft de onderliggende waarde door vóór de deadline', async () => {
  assert.equal(await withTimeout(Promise.resolve('x'), 100), 'x');
});

test('withTimeout reject op de deadline bij een nooit-resolvende promise', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 10), /timeout/);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../build-test/core/async'`.

- [ ] **Step 3: Implement `src/core/async.ts`**

`withTimeout` = `Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))])`. Dutch comment: deadline beschermt de launch tegen een blijvend hangende storage-read.

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS — all tests green (existing 13 + 2 new).

- [ ] **Step 5: Wire the gate**

`SettingsContext` load effect — replace the plain `loadSettings().then(...)`:

```tsx
// Launch mag nooit op de splash blijven hangen: na 1500 ms vallen we terug op defaults.
withTimeout(loadSettings(), 1500)
  .then((stored) => { if (!active) return; loadedRef.current = true; setSettings(stored); setIsLoaded(true); })
  .catch(() => { if (!active) return; loadedRef.current = true; setIsLoaded(true); });
```

(`active`/cleanup unchanged; a late storage resolution after a timeout cannot run — it is chained on the already-rejected race.)

`src/app/_layout.tsx` — add an internal gate and render it inside the provider:

```tsx
const AppReadyGate = ({ fontsLoaded }: { fontsLoaded: boolean }) => {
  const { isLoaded } = useSettings();
  const ready = fontsLoaded && isLoaded;
  useEffect(() => { if (ready) void SplashScreen.hideAsync(); }, [ready]);
  if (!ready) return null; // splash dekt de loading; geen frame met defaults
  return <RootNavigator />;
};
```

`RootLayout` keeps `useFonts`, renders `<SettingsProvider><AppReadyGate fontsLoaded={fontsLoaded} /></SettingsProvider>`; the old splash-hide effect moves into the gate.

- [ ] **Step 6: Verify**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual (simulator): with stored EN + dark (set via Settings first, then fully kill and relaunch the app), the first visible frame is already English and dark — never a Dutch/light flash.

- [ ] **Step 7: Commit**

```bash
git add src/core/async.ts scripts/core-tests.cjs src/state/SettingsContext.tsx src/app/_layout.tsx
git commit -m "fix(app): splash waits for fonts and settings — no language/theme flash"
```

---

### Task 4: Type tokens for inline font sizes

Several inline `fontSize` values bypass the type scale. Fold them onto tokens — same numbers, so pixel-neutral.

**Files:**
- Modify: `src/theme/tokens.ts` (add `control` to `type`)
- Modify: `src/components/Segmented.tsx`, `src/components/SelectGrid.tsx`, `src/screens/SettingsScreen.tsx`, `src/screens/AboutScreen.tsx`, `src/screens/WeatherScreen.tsx`

**Interfaces:**
- Produces: `type.control: { fontSize: 14, fontFamily: sans('medium') }` in `tokens.ts`, used by both selection components.

- [ ] **Step 1: Add the token**

In `tokens.ts` `type`: `control: { fontSize: 14, fontFamily: sans('medium') }`.

- [ ] **Step 2: Apply the map**

| Site | Today | Becomes |
|---|---|---|
| `Segmented.tsx` + `SelectGrid.tsx` `label` | `{ fontSize: 14, fontFamily: sans('medium') }` | `typeScale.control` |
| `SettingsScreen.tsx` header-right text (~line 56) | inline `fontSize: 13` | `typeScale.bodySmall` + color |
| `AboutScreen.tsx` header-right text (~line 18) | inline `fontSize: 13` | `typeScale.bodySmall` + color |
| `SettingsScreen.tsx` API-key helper (~line 146) | inline `fontSize: 12` | `typeScale.label` + color |
| `WeatherScreen.tsx` tile sub texts (~lines 227, 239, 251) | inline `fontSize: 12` | `typeScale.label` + color |

Leave `demoBadgeText`'s `fontSize: 10` override (intentional). Remove now-unused `sans` imports only where nothing else uses them.

- [ ] **Step 3: Verify**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual: compare the Settings screen against `settings-stability-before-light.png` — identical sizes and layout.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens.ts src/components/Segmented.tsx src/components/SelectGrid.tsx src/screens/SettingsScreen.tsx src/screens/AboutScreen.tsx src/screens/WeatherScreen.tsx
git commit -m "refactor(ui): inline font sizes via type-scale tokens"
```

---

### Task 5: Race-safe, quiet weather refresh

`load` re-runs on language change (descriptions are localized by the API) with two defects: it toggles the refresh spinner for a settings-driven refresh, and two overlapping fetches can finish out of order — an older response overwrites newer data.

**Files:**
- Modify: `src/screens/WeatherScreen.tsx` (`load`, call sites)

**Interfaces:**
- Consumes: existing `load` deps `[apiKey, isDemo, settings.defaultLocation, settings.language]` — unchanged.
- Produces: `load(opts?: { userInitiated?: boolean })`; internal `loadSeq` ref and `hasSnapshotRef` (set `true` at every `setSnapshot`, demo path included).

- [ ] **Step 1: Sequence guard + quiet refresh in `load`**

```tsx
const loadSeq = useRef(0);
const hasSnapshotRef = useRef(false);
const load = useCallback(async (opts?: { userInitiated?: boolean }) => {
  const seq = ++loadSeq.current;
  const userInitiated = opts?.userInitiated ?? false;
  setError(null);
  if (isDemo) {
    setLocationDenied(false);
    if (userInitiated) setIsRefreshing(false);
    if (loadSeq.current !== seq) return;
    setSnapshot(buildDemoSnapshot(new Date(), settings.language));
    hasSnapshotRef.current = true;
    return;
  }
  if (userInitiated) setIsRefreshing(true);
  try {
    const location = await requestCurrentLocation();
    if (loadSeq.current !== seq) return;          // verouderd: negeer
    setLocationDenied(location.status === 'denied');
    /* … bestaande resolve/fetch-logica ongewijzigd … */
    if (loadSeq.current !== seq) return;          // verouderd: negeer
    setSnapshot({ /* … ongewijzigd … */ });
    hasSnapshotRef.current = true;
  } catch {
    if (loadSeq.current !== seq) return;                              // verouderd
    if (!userInitiated && hasSnapshotRef.current) return;             // achtergrondfout: oude data blijft staan
    setError({ key: 'weather.errorBanner' });                         // user-initiated of geen data: melden
  } finally {
    if (userInitiated) setIsRefreshing(false);   // achtergrond-runs raken de spinner nooit aan
  }
}, [apiKey, isDemo, settings.defaultLocation, settings.language]);
```

Dutch comments on the three guards.

- [ ] **Step 2: User-initiated call sites**

Every `onPress`/`onRefresh` caller passes `{ userInitiated: true }`: both refresh `PressableScale`s, the error `Banner` action, the center-error retry, and `RefreshControl.onRefresh`. The settings-driven effect calls bare `load()` — unchanged effect/deps.

- [ ] **Step 3: Measurement for the Task 6 gate (temporary instrumentation)**

In `SettingsScreen`, temporarily log content height and the language section's y (small `onContentSizeChange` + `onLayout` wrapper around the language `SettingSection`, `console.log('[i18n-shift]', …)`). Flip NL→EN on the simulator with the language section on screen; read the delta from the Metro log; record the number in the task report; **remove the instrumentation**.

- [ ] **Step 4: Verify**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual (demo mode): flip NL↔EN five times fast from the Weather tab — content always matches the last selection, no spinner. Pull to refresh — spinner still works. With a live key, flip language while watching the Weather tab — no refresh spinner appears.

- [ ] **Step 5: Commit**

```bash
git add src/screens/WeatherScreen.tsx src/screens/SettingsScreen.tsx
git commit -m "fix(weather): race-safe quiet refresh on settings change"
```

(If Step 3's instrumentation is already removed before this commit, `SettingsScreen.tsx` drops out of the `git add`.)

---

### Task 6: Settings scroll re-anchor (execute only if measured)

**Gate:** execute this task only if Task 5 Step 3 measured the language section moving **more than 8 px** on a language flip. Otherwise mark the task `skipped` with the recorded delta — do not build dead code.

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `ScrollView` ref, `onScroll`, `onContentSizeChange` (all existing RN props).
- Produces: the language control stays at the same viewport position across a language switch.

- [ ] **Step 1: Implement the anchor**

Track scroll offset via `onScroll` into a ref (no re-render). On the language `Segmented`'s `onChange`, record the current offset into `anchorRef`. In `onContentSizeChange`, when an anchor is pending and the height changed, `scrollRef.current?.scrollTo({ y: Math.max(0, anchor + (newH - oldH)), animated: false })` and consume the anchor. Dutch comments: het taalblok staat onderaan, dus de volledige hoogte-delta zit erboven.

- [ ] **Step 2: Verify**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual: flip NL↔EN with the language section on screen — it does not move; manual scrolling still feels normal (no fighting the finger during momentum).

- [ ] **Step 3: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "fix(settings): re-anchor scroll after language switch"
```

---

### Task 7: Weer page upgrade — alignment, spelling, fallback hardening, dates

Feedback from the user on the live app (2026-11-10), approved as-is:

1. **Tile values misaligned** — the humidity label wraps mid-word (`Luchtvochtighe-id`), pushing `94%` below `0,6 m/s`/`1013`.
2. **Spelling** — `Vooruitblick` must be `Vooruitblik`.
3. **Corrupt-asset fallback renders blank** (observed on the simulator): `onAnimationFailure` does not fire for an invalid JSON source, so `WeatherArt` shows nothing instead of the flat glyph.
4. **Outlook rows carry no date** — "Do, Vr, Za, Zo" leaves today ambiguous.

**Files:**
- Modify: `src/components/InfoTile.tsx` (label single-line)
- Modify: `src/i18n/translations.ts` (spelling)
- Modify: `src/core/weatherArt.ts` + `scripts/core-tests.cjs` (Lottie shape validation)
- Modify: `src/screens/WeatherScreen.tsx` (day labels with date)

**Interfaces:**
- Consumes: `WeatherArt`'s `ASSETS` map and `failedKey` state (Task 1's committed work).
- Produces: `export function isLottieShape(json: unknown): boolean` in `src/core/weatherArt.ts` — true only for an object with a non-empty `layers` array; `WeatherArt` routes on it before `LottieView`.

- [ ] **Step 1: Failing test for the shape check**

```js
const { isLottieShape } = require('../build-test/core/weatherArt');

test('lottie-vormcontrole laat alleen echte animaties door', () => {
  assert.equal(isLottieShape({ layers: [{ nm: 'x' }] }), true);
  assert.equal(isLottieShape({ invalid: true }), false);
  assert.equal(isLottieShape({ layers: [] }), false);
  assert.equal(isLottieShape(null), false);
  assert.equal(isLottieShape('nope'), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `isLottieShape` is not a function.

- [ ] **Step 3: Implement `isLottieShape` in `src/core/weatherArt.ts` and route in `WeatherArt`**

Pure check (object, `Array.isArray(json.layers)`, `layers.length > 0`), Dutch comment. In `WeatherArt.tsx`, compute `const source = isLottieShape(raw) ? recoloredFor(artKey, colors) : null;` — when null (or `failedKey === artKey`), render `WeatherGlyph`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Alignment + spelling + dates**

`InfoTile` label: `numberOfLines={1}` + `adjustsFontSizeToFit` (values start at the same height in all tiles, both languages). `translations.ts`: `'weather.outlook': 'Vooruitblik'`; eyeball the remaining nl strings for typos while there. `dayLabelFor` in `WeatherScreen`: rows after "Morgen" become weekday + day number from `dateISO` (e.g. `Do 12`, keep the existing `Intl` weekday + capitalize behavior; date via `new Date(dateISO).getDate()`), day-label width in `ForecastRow` grows 78 → 88 if "Do 12" clips.

- [ ] **Step 6: Corrupt-asset re-check (the real fallback test)**

Temporarily `echo '{"invalid": true}' > assets/weather/partlyDay.json`, reload via `curl -X POST http://localhost:8081/reload`, screenshot: partly rows show the **flat glyph**, never blank; restore the asset. If the dev-menu sheet blocks a cold launch, ask the user for one tap.

- [ ] **Step 7: Verify + commit**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint`
Expected: pass. Visual: tile numbers on one level (NL + EN), "Vooruitblik" correct, dates on outlook rows, Do/Vr icons present after restore.

```bash
git add src/components/InfoTile.tsx src/i18n/translations.ts src/core/weatherArt.ts scripts/core-tests.cjs src/screens/WeatherScreen.tsx src/components/ForecastRow.tsx
git commit -m "feat(ui): weer page upgrade — tile alignment, spelling, art fallback, row dates"
```

---

### Task 8: Final verification & close-out

**Files:**
- Modify: only whatever the walkthrough finds (typos, spacing, one-off inconsistencies)

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Full check suite**

Run: `export EXPO_PUBLIC_OWM_KEY=dummy && npm test && npx tsc --noEmit && npm run lint && npx expo-doctor`
Expected: all green.

- [ ] **Step 2: Walk the Review Focus list on the simulator**

Cold start with stored EN/dark (no flash); tap every control (nothing moves); flip NL↔EN on Settings and watch the toggle and tab bar; five rapid flips on Weather (content matches last selection); pull-to-refresh spins; with a live key: airplane-mode *manual* refresh shows the error banner while old data stays for a settings-driven flip (Review Focus 3); rename `assets/weather/clearDay.json` temporarily → hero falls back to the glyph, then restore (Review Focus 5). Fix anything that bites.

- [ ] **Step 3: After-screenshots and comparison**

`xcrun simctl io "iPhone 16" screenshot` for weather light/dark + settings → `*-stability-after-*.png` next to Task 1's befores; cite all paths and confirm nothing moved visually except the fixed flaws.

- [ ] **Step 4: Report**

Summarize: commits, the measured language-switch delta (and whether Task 6 ran), screenshots, and anything deferred.
