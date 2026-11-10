// Kleine module-store voor de actuele weersconditie: de hero-kunst publiceert,
// de tabbalk (en alles elders) leest mee. Pure logica, geen React/RN-imports,
// zodat de kern-tests hem direct kunnen draaien.

export type WeatherCondition = { icon: string; isDay: boolean } | null;

let current: WeatherCondition = null;
const listeners = new Set<() => void>();

export const getCondition = (): WeatherCondition => current;

export const setCondition = (icon: string, isDay: boolean): void => {
  if (current && current.icon === icon && current.isDay === isDay) return;
  current = { icon, isDay };
  for (const notify of listeners) notify();
};

// Abonnee-patroon voor useSyncExternalStore: teruggeef functie meldt af.
export const subscribeCondition = (notify: () => void): (() => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};
