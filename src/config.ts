// De API-key komt uit .env (gitignored) of uit Instellingen in de app.
// Zet een echte key nooit hardcoded in een publieke repository.
export const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_KEY ?? '';
