# API key: visible save + guaranteed persistence

Date: 2026-11-13
Status: Approved (user picked "no button, show 'Saved ✓' text" + note: "it has to stay saved even if I have to boot up again")

## Intent & why

The API key in Settings saves invisibly (only on keyboard done/blur) and gives no
feedback, so it looks like nothing happens. Worse, killing the app without blurring
the field loses the draft. The user wants a visible confirmation and certainty the
key survives restarts.

## Goals

- Visible `Saved ✓` confirmation under the API key field after a commit.
- Key survives force-quit/reboot even if the field was never blurred.
- A slow storage read at launch can never cause stored settings (incl. the key) to
  be overwritten by defaults.

## Non-goals / anti-goals

- No save button (user explicitly chose the no-button variant).
- No change to the default-location field (same commit pattern, out of scope).
- No secure-storage migration (stays AsyncStorage).
- No change to how the key is used by the weather fetch pipeline.

## Approaches considered

1. **Full-width Save button under the field** — clearest affordance, but the user
   chose against a button.
2. **Check icon inside the field row** — minimal; small tap target; rejected.
3. **No button + `Saved ✓` text + debounced auto-commit** (chosen) — keeps the
   auto-save UX, adds feedback, and covers the kill-without-blur hole.
   - Alternative within this approach: flush drafts on AppState `background`.
     Rejected: debounce is simpler, also covers typing-then-kill, and is testable.

## Decided behavior

- `SettingsScreen`: commit `apiKeyDraft` via a ~800 ms debounce after the last
  keystroke, in addition to the existing `onEndEditing`/`onSubmitEditing` commit.
- After a commit that actually changes the saved value, show
  `t('settings.apiKeySaved')` under the field; hide it when the user edits the
  draft again (and on a fresh divergence). Clears itself after ~2.5 s.
- `src/core/async.ts`: add a small pure `debounce` helper (testable in node core
  tests).
- `SettingsContext`: if the 1500 ms launch guard rejects the storage read, retry
  the read once in the background; only then fall back to defaults. Prevents the
  defaults-overwrite path.
- `src/i18n/translations.ts`: add `settings.apiKeySaved` — NL: `Opgeslagen ✓`,
  EN: `Saved ✓`.

## Left to the builder

- Exact debounce timing (800 ms ±) and confirmation timeout (~2.5 s).
- Whether the confirmation also shows when a commit results in no change
  (recommend: only when the value actually changed, else silence).
- Test placement following `scripts/core-tests.cjs` conventions.

## Verification

- `npx tsc --noEmit`
- `npx expo lint`
- `npm test` (core tests; add coverage for the debounce helper)
- Manual: paste key → kill app within 800 ms → relaunch → key present; `Saved ✓`
  appears and clears.
