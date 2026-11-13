# Alive Weather UI — Design

Date: 2026-11-10

## Intent & why

The app is functional but feels static ("dry"). After the entrance animations finish, nothing
moves; the hero is a flat Material icon; the earthy palette carries the identity alone. Goal:
make the app feel alive and polished while keeping the editorial, earthy look — verified on the
newly created iPhone 16 simulator.

## Goals

- The weather itself becomes the decoration: animated Lottie weather art in the hero,
  first-frame (paused) art in forecast rows.
- Calm controls: no sliding selections in settings; fades instead of movement.
- Consistent typography: Playfair Display for display text, Inter for all UI text, one type scale.
- Depth: subtle condition-aware sky tint, soft shadows, slightly larger radii.
- Data visuals: min–max range bars in the forecast, animated temperature changes, colored tile icons.
- Micro-interactions: skeleton loading, entrances on Settings/About, art crossfade on condition change.

## Non-goals

- No redesign of layout, navigation, or screens; no new screens.
- No new data sources (no hourly series → no sparkline).
- No photo backdrops.

## Anti-goals (failure even if it works)

- Movement that draws attention to itself on controls (sliding thumbs, jumpy transitions).
- Five looping Lottie animations in the forecast (battery drain) — rows use paused first-frame art.
- Art that ignores the theme switch — recolored art must follow light/dark live.

## Constraints

- Expo SDK 58, RN 0.88, reanimated 4.7.1; new dependencies only via `npx expo install`.
- CNG project: no `ios/`/`android/` dirs; native config via app.json/config plugins.
- Keep code style: named exports, `StyleSheet.create`, Dutch comments, pure logic in `src/core`
  tested by plain-node tests (`npm test`).
- Lottie assets: free-license pack; license recorded in `assets/weather/`.

## Approaches considered (weather art)

1. Hand-drawn animated SVG scene (`react-native-svg` + reanimated) — full palette control,
   most work. Not chosen.
2. **Lottie pack, recolored to the palette — chosen by the user.** Fast to "wow"; the fixed
   art style and dependency trade-offs are mitigated by recoloring the JSON to palette tokens
   per theme.
3. Photo backdrops — static, can't follow theme, drifts from the editorial style. Not chosen.

## Decisions

- **Art**: new `WeatherArt` component maps OWM icon code + `isDay` → asset; hero loops,
  forecast rows pause on first frame; crossfade when condition changes; fallback to the
  existing `WeatherGlyph` if an asset fails to load.
- **Recolor**: pure function walks the Lottie JSON and remaps the pack's source colors to
  palette tokens; cached per (asset, theme).
- **Controls**: `Segmented` highlight fades in at the new position (no translateX);
  `SelectGrid` background colors tween and the check icon fades in.
- **Fonts**: `@expo-google-fonts/inter` (400/500/600/700) next to Playfair; type scale in
  `tokens.ts`. Rule: serif = display (hero temp, screen titles, condition text, day names);
  Inter = labels, values, body, buttons, tab bar.
- **Sky**: `expo-linear-gradient`; `skyForIcon(code, isDay, isDark)` → `{top, bottom}`, very
  subtle tints derived from the existing palette.
- **Numbers**: hero temperature counts up over ~450 ms with easeOutCubic on change.
- **Loading**: skeleton shimmer replaces the bare spinner.
- **Screens**: Settings and About get the same staggered entrances Weather already has.

## Left to the builder

Exact Lottie pack (license-checked), exact gradient stops and shadow values, shimmer geometry —
all inside the calm-motion ground rule: **one ambient animation at a time; the hero art is the
only always-on loop; control animations are fades ≤ 200 ms.**
