import { withTimeout } from './async';

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

// Herhaalt een mislukte settings-lees met een harde deadline: de UI valt op
// de deadline terug op defaults (de splash mag nooit blijven hangen), maar
// een laat landende lees herstelt de opgeslagen waarden daarna alsnog via
// onRecovered. onGiveUp vuurt hoogstens één keer.
export const recoverSettings = async <T>(
  load: () => Promise<T>,
  deadlineMs: number,
  onRecovered: (stored: T) => void,
  onGiveUp: () => void,
): Promise<void> => {
  let gaveUp = false;
  const giveUpOnce = () => {
    if (!gaveUp) {
      gaveUp = true;
      onGiveUp();
    }
  };
  const retry = load();
  void retry.then(onRecovered, giveUpOnce);
  await withTimeout(retry, deadlineMs).catch(giveUpOnce);
};
