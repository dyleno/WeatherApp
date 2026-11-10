# Navbar + Full-page Weather Motion — Design (small change)

Date: 2026-11-10 · Status: **approved in chat** (user: "yes and also animations across other clouds on the weer page also make sure these align", with screenshot of the InfoTile row)

## Intent

The tab bar looks plain next to the new living weather art, and not all weather art on the
Weer page is alive. Make the navbar a floating pill with the live weather as the Weer icon,
animate the forecast-row art too, and fix the InfoTile label wrap that misaligns the tile
values ("Luchtvochtighe-id").

## Decisions (user-approved)

- **Chrome**: tab bar detaches into a floating pill — side/bottom margins, radius 26,
  translucent blur background (`expo-blur`, first-party Expo module), hairline border, soft
  shadow. No nav structure change, no new routes.
- **Active state**: soft pill behind the active icon **fades in/out** (150 ms, keyed remount —
  same language as `Segmented`). The spring scale and the orange dot are removed; motion on
  controls stays fade-only. Active tint becomes `accent`.
- **Weer tab icon**: the real `WeatherArt` mini (26 px), showing the **current** condition
  (sun / cloud / rain / …), recolored to the palette, gently looping. Until the first load it
  falls back to the static partly-cloudy glyph.
- **Condition source**: new pure store `src/core/conditionStore.ts` (get/set/subscribe,
  no-notify on same value, tested in `scripts/core-tests.cjs`). The **hero** `WeatherArt`
  publishes via a new optional `publish` prop — so `WeatherScreen.tsx` is **not touched**
  (it carries the parallel stability workstream's uncommitted changes).
- **All weather art animates**: forecast rows now play their loop (spec amendment: the
  2026-11-10 design's "rows use paused art" anti-goal is overridden by explicit user request;
  noted as battery trade-off, loops at speed 0.8, small sizes).
- **Tile alignment**: NL copy "Luchtvochtigheid" → "Vochtigheid" (fits one line; EN
  "Humidity" already fits), plus `numberOfLines={1}` guard on the tile label, so the three
  values align on one baseline.

## Approaches considered

1. Publish condition via a new React context around the tabs — rejected: more plumbing, and
   `WeatherScreen` (the producer) is entangled with the parallel workstream's uncommitted file.
2. **Store + publisher inside `WeatherArt` — chosen**: zero edits to contested files, the hero
   already owns the authoritative current condition, store is pure and unit-testable.
3. Solid (non-blur) floating bar — simpler, but the blur reads noticeably better over the sky
   tint arriving in plan Task 6; `expo-blur` is first-party. Chosen blur with solid-color
   fallback behavior built into `BlurView`.

## Left to the builder

Exact margins/shadow within the calm-motion rules; pill opacity; fallback icon size harmony
between Material glyph (24) and Lottie art (26).
