# API key: visible save + guaranteed persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the API key visibly save (`Saved ✓` flash) and survive force-quit/reboot, with a launch-read retry that can never overwrite stored settings.

**Architecture:** Three touch points: a pure merge helper in `src/core` (testable in the node core suite), a one-shot background retry in `SettingsContext`'s load effect, and a debounced auto-commit + confirmation flash in `SettingsScreen`.

**Tech Stack:** Expo/React Native, AsyncStorage, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-13-api-key-save-feedback-design.md`

**Builder call (deviation from spec, behavior identical):** the spec's "tiny `debounce` helper in core" is implemented as the idiomatic React pattern instead — a self-cancelling `setTimeout` inside a `useEffect` in `SettingsScreen`. A core debounce object would need a ref-trampoline to avoid stale closures; the effect pattern is stale-free with less machinery and no unused abstraction.

## Global Constraints

- No new dependencies.
- Every user-facing string exists in **both** NL and EN in `src/i18n/translations.ts`.
- Colors come from existing palette tokens only (flash uses `palette.accent`; no token changes).
- Automated tests only in `scripts/core-tests.cjs` style (node `assert/strict`, Dutch test names); component code is verified by typecheck/lint/manual run.
- Verify with: `npx tsc --noEmit`, `npx expo lint`, `npm test`.

## Review Focus

1. Key pasted, app killed within the 800 ms window → key present after relaunch. Manual check pinned in Task 4.
2. Hung storage read at launch (1500 ms guard trips) + a later settings change → stored key must not be wiped by defaults. Pinned by Task 1's merge test + Task 2's retry.
3. Clearing the field entirely → commits `''`, app returns to demo mode, flash still shows. Pinned in Task 4 manual check.
4. Re-renders during the debounce window reset the timer cleanly; no double-commit. Covered by the effect's cleanup design (Task 3) — reviewer verifies deps.
5. Flash string exists in NL and EN. Pinned in Task 3 (translation step + grep check).

---

### Task 1: `mergeStoredSettings` core helper + tests

**Files:**
- Create: `src/core/settings.ts`
- Modify: `scripts/core-tests.cjs` (add one `require` line + tests near the `withTimeout` import)

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `mergeStoredSettings<T extends Record<string, unknown>>(stored: T, session: T, defaults: T): T` — starts from `stored`; overlays only the session entries whose value differs from `defaults[key]` (in-session edits win; untouched fields fall back to what is on disk). Task 2 relies on this exact name and signature.

- [ ] **Step 1: Write the failing tests**

In `scripts/core-tests.cjs`, add to the requires:

```js
const { mergeStoredSettings } = require('../build-test/core/settings');
```

Add tests:

```js
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
```

- [ ] **Step 2: Run the suite to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module '../build-test/core/settings'`

- [ ] **Step 3: Implement in `src/core/settings.ts`**

```typescript
// Merge van een laat geladen stored-settings object met de in-sessie staat.
// Sessiewaarden die afwijken van de defaults zijn gebruikerswijzigingen en
// winnen; onaangetaste velden vallen terug op wat er op disk staat (beschermt
// de opgeslagen API key tegen een wipe door defaults na een trage launch-read).
export const mergeStoredSettings = <T extends Record<string, unknown>>(
  stored: T,
  session: T,
  defaults: T,
): T => {
  const sessionChanges = Object.fromEntries(
    Object.entries(session).filter(([key, value]) => value !== defaults[key]),
  );
  return { ...stored, ...sessionChanges };
};
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `npm test`
Expected: PASS, all core tests green

- [ ] **Step 5: Commit**

```bash
git add src/core/settings.ts scripts/core-tests.cjs
git commit -m "feat: mergeStoredSettings beschermt opgeslagen settings bij late load"
```

---

### Task 2: `SettingsContext` — one-shot background retry on failed launch read

**Files:**
- Modify: `src/state/SettingsContext.tsx` (the load `useEffect`, lines ~26–45)

**Interfaces:**
- Consumes: `mergeStoredSettings(stored, previous, DEFAULT_SETTINGS)` from Task 1; existing `loadSettings`, `DEFAULT_SETTINGS`.
- Produces: no interface change. Behavior: if the guarded read rejects, exactly one background retry runs; on success it merges stored settings under the current session state (`previous` wins where it differs from defaults), so a later `update()` can never write defaults over the stored API key.

- [ ] **Step 1: Implement the retry**

Replace the `.catch` of the load effect with (keep the existing `.then` untouched):

```tsx
.catch(() => {
  if (!active) return;
  // Eerste leespoging faalde (traag of hangend): herhaal het een keer op de
  // achtergrond. Zonder retry zou een latere update defaults wegschrijven en
  // de opgeslagen API key wissen.
  void loadSettings()
    .then((stored) => {
      if (!active) return;
      loadedRef.current = true;
      setSettings((previous) => mergeStoredSettings(stored, previous, DEFAULT_SETTINGS));
      setIsLoaded(true);
    })
    .catch(() => {
      if (!active) return;
      loadedRef.current = true;
      setIsLoaded(true);
    });
});
```

Add `mergeStoredSettings` to the imports from `../core/settings`.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx expo lint`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/state/SettingsContext.tsx
git commit -m "fix: retry settings-read na trage launch zodat de API key niet gewist kan worden"
```

---

### Task 3: `SettingsScreen` — debounced commit + `Saved ✓` flash (+ translation keys)

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/i18n/translations.ts` (NL block near line 51, EN block near line 116)

**Interfaces:**
- Consumes: existing `update({ apiKey })`, `t()`, `palette`.
- Produces: no external interface. New translation key `'settings.apiKeySaved'` — NL: `'Opgeslagen ✓'`, EN: `'Saved ✓'`.

- [ ] **Step 1: Add the translation keys**

In `src/i18n/translations.ts`, next to `'settings.apiKeyHelper'` in **both** language blocks:

```typescript
'settings.apiKeySaved': 'Opgeslagen ✓',   // NL block
'settings.apiKeySaved': 'Saved ✓',        // EN block
```

- [ ] **Step 2: Implement debounced commit and flash in `SettingsScreen`**

Replace the `commitApiKey` definition and the import line `import { useState } from 'react';` with `import { useCallback, useEffect, useState } from 'react';`, then add below `commitApiKey`'s replacement:

```tsx
const [savedFlash, setSavedFlash] = useState(false);

// Eén plek die de key daadwerkelijk wegschrijft; zowel de blur-commit als de
// debounce lopen hier doorheen.
const applyApiKey = useCallback(
  (value: string) => {
    if (value === settings.apiKey) return;
    update({ apiKey: value });
    setSavedFlash(true);
  },
  [settings.apiKey, update],
);

const commitApiKey = () => {
  applyApiKey(apiKeyDraft.trim());
};

// Auto-commit ~800 ms na de laatste toetsaanslag: de key blijft bewaard ook
// als de app wordt afgesloten zonder het veld te verlaten.
useEffect(() => {
  if (apiKeyDraft === settings.apiKey) return;
  const trimmed = apiKeyDraft.trim();
  const timer = setTimeout(() => applyApiKey(trimmed), 800);
  return () => clearTimeout(timer);
}, [apiKeyDraft, settings.apiKey, applyApiKey]);

// Flash: verdwijnt zodra de gebruiker opnieuw typt, en vanzelf na 2,5 s.
useEffect(() => {
  if (!savedFlash) return;
  if (apiKeyDraft !== settings.apiKey) {
    setSavedFlash(false);
    return;
  }
  const timer = setTimeout(() => setSavedFlash(false), 2500);
  return () => clearTimeout(timer);
}, [savedFlash, apiKeyDraft, settings.apiKey]);
```

- [ ] **Step 3: Render the flash in place of the helper line**

Replace the single helper `<Text>` under the API key field with:

```tsx
{savedFlash ? (
  <Text style={[typeScale.label, { color: palette.accent, marginTop: 8 }]}>{t('settings.apiKeySaved')}</Text>
) : (
  <Text style={[typeScale.label, { color: palette.muted, marginTop: 8 }]}>{t('settings.apiKeyHelper')}</Text>
)}
```

- [ ] **Step 4: Typecheck, lint, both strings present**

Run: `npx tsc --noEmit && npx expo lint`
Run: `grep -c "settings.apiKeySaved" src/i18n/translations.ts` → Expected: `2`

- [ ] **Step 5: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/i18n/translations.ts
git commit -m "feat: API key slaat automatisch op met 'Opgeslagen ✓'-bevestiging"
```

---

### Task 4: Full verification + manual simulator check

**Files:** none (verification only)

- [ ] **Step 1: Run the whole gate**

Run: `npx tsc --noEmit && npx expo lint && npm test`
Expected: all green

- [ ] **Step 2: Manual check on the iPhone 16 simulator**

Metro is already running from the background `expo run:ios` session; the app hot-reloads. On the simulator:
1. Settings → API key: paste a key, immediately swipe the app away (within ~1 s), relaunch → key is still filled in and live weather loads.
2. Type a key normally → `Opgeslagen ✓` appears under the field, disappears after ~2.5 s, reappears cleanly after an edit+pause.
3. Clear the field → app falls back to demo data, `Opgeslagen ✓` shows once.

- [ ] **Step 3: Commit any remaining bits + report**

```bash
git status   # should be clean; docs committed separately if not yet
```
