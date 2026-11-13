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
