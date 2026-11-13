import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../services/settingsStore';
import { withTimeout } from '../core/async';
import { mergeStoredSettings } from '../core/settings';
import { interpolate, translations, type TranslateFn, type TranslateKey } from '../i18n/translations';
import { palette, type Palette } from '../theme/tokens';
import type { Settings } from '../core/types';

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  t: TranslateFn;
  palette: Palette;
  isDark: boolean;
  isLoaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const loadedRef = useRef(false);
  const systemScheme = useColorScheme();

  useEffect(() => {
    let active = true;
    // Launch mag nooit op de splash blijven hangen: na 1500 ms vallen we terug
    // op defaults (storage-fout of trage read kan de app niet blokkeren).
    withTimeout(loadSettings(), 1500)
      .then((stored) => {
        if (!active) return;
        loadedRef.current = true;
        setSettings(stored);
        setIsLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        // Eerste leespoging faalde (traag of hangend): herhaal het een keer op
        // de achtergrond. Zonder retry zou een latere update defaults
        // wegschrijven en de opgeslagen API key wissen.
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
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    void saveSettings(settings);
  }, [settings]);

  const update = (patch: Partial<Settings>): void => {
    setSettings((previous) => ({ ...previous, ...patch }));
  };

  const isDark = settings.theme === 'system' ? systemScheme !== 'light' : settings.theme === 'dark';

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update,
      t: (key, vars) => interpolate(translations[settings.language][key] ?? key, vars ?? {}),
      palette: isDark ? palette.dark : palette.light,
      isDark,
      isLoaded,
    }),
    [settings, isDark, isLoaded],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextValue => {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used within SettingsProvider');
  return value;
};

export const useTheme = (): Palette => useSettings().palette;
export type { TranslateKey };
