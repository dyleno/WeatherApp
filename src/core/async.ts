// Race tegen de klok: resolveert met de onderliggende waarde vóór de deadline,
// reject met 'timeout' op de deadline. Een late onderliggende resolutie kan de
// race niet meer winnen (Promise.race is definitief na de eerste settle).
// Beschermt de launch tegen een blijvend hangende storage-read.
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
