# Stability & Consistency — Design

Date: 2026-11-10

## Intent & why

Three confirmed UI flaws (reported on the iPhone 16 simulator, causes verified in code):

1. **Text jumps when tapping a setting** — the selected label swaps font family
   (Inter Medium → SemiBold); different advance widths move the glyphs inside the
   control.
2. **Wrong language/theme on startup** — saved settings load from AsyncStorage
   *after* the first painted frame (the splash screen only waits for fonts), so
   the app can show Dutch/light before flipping to the saved English/dark.
3. **Screen reflows on language switch** — every text swaps at once and the app
   silently refetches the weather (descriptions come localized from the API);
   rapid NL↔EN toggles can even race, with an older response landing last.

Goal: kill the bug class, not just the instances, with zero visual trade-offs.

## Goals

- Tapping a control never moves text inside it (constant font weight; selection
  reads through fill color + checkmark, which already exist).
- The first painted frame already uses the saved language and theme.
- Settings-driven weather refreshes are quiet (no refresh state) and race-safe
  (newest response wins); a failed background refresh never wipes existing data.
- Stray inline font sizes fold into the type scale, behavior-neutral.

## Non-goals

- No header/title changes, no route renames, no wording changes ("Celsius °C"
  stays), no redesign, no new screens. (These were the "full hardening" option,
  explicitly not chosen.)

## Anti-goals (failure even if it works)

- Attention-grabbing motion (calm-motion rule stands: fades ≤ 200 ms, never
  translate).
- The app ever hanging on the splash screen because storage failed.

## Constraints

- Repo rules: dependencies only via `npx expo install`; never create/edit
  `ios/`/`android/` (CNG); `src/core/**` stays react-native-free and is tested
  by `npm test`; named exports, `StyleSheet.create`, Dutch comments.
- After every task: `npx tsc --noEmit`, `npm run lint`, `npm test` green.
- The in-flight alive-weather-ui Task 5 work (WeatherArt, uncommitted) is
  verified and committed first; `WeatherScreen` logic is touched last so the
  two efforts cannot collide.
- Never `git add -A` — `docs/` contains pre-existing untracked user content;
  commits use explicit paths.

## Approaches considered

1. **Surgical — fix the three symptoms only.** Smallest change; the inherent
   reflow (text simply has different lengths) stays completely unmitigated.
   Not chosen.
2. **Fix + harden — chosen.** Everything in 1, plus the race guard and a
   measured scroll re-anchor so the language toggle doesn't move under the
   finger. Reflow fixes are evidence-gated: measure what actually moves on the
   simulator first; only build anchoring where the shift is real (> 8 px).
3. **Full consistency hardening.** 2 plus visible design cleanups (duplicate
   header title, label wording, route rename). Rejected: changes things the
   user can see, beyond the reported flaws.

## Decisions

- **Controls** (`Segmented`, `SelectGrid`): one font weight (Inter Medium) for
  every state; remove the `selected && { fontFamily: sans('semibold') }` swap.
- **Startup**: `SplashScreen.hideAsync()` fires only when fonts **and** settings
  have resolved; an inner gate renders nothing until then. Storage load is
  raced against a 1500 ms timeout (`withTimeout` in `src/core/async.ts`, core-
  tested); timeout or error falls back to `DEFAULT_SETTINGS` and renders.
- **Weather loads**: `load` gains `opts?: { userInitiated?: boolean }` and a
  sequence ref (`loadSeq`) — every setState after an await is guarded by
  "still newest"; a finishing user-initiated run clears the spinner, background
  runs never touch it; a background failure keeps the current snapshot (no
  error banner) while a user-initiated failure reports as today. Demo mode
  rebuilds synchronously as today.
- **Re-anchor**: evidence-gated. Instrument `onContentSizeChange` + section y
  once, flip NL↔EN, record the delta; implement scroll re-anchoring only if
  the language section moves > 8 px, otherwise record the measurement and skip.
- **Type tokens**: `type.control` (fontSize 14, Inter Medium) joins the scale;
  inline `fontSize` 11/12/13/14 in controls, header slots, helper and sub
  texts map onto tokens (13 → `bodySmall`, 12 → `label`, 14 → `control`).
  Screenshot-verified as pixel-neutral.

## Left to the builder

Exact comment wording, whether the re-anchor passes the 8 px measurement bar,
commit boundaries within the tasks below.

## Spec

`docs/superpowers/specs/2026-11-10-stability-consistency-design.md` (this file).
