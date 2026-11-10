import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { SettingsProvider, useSettings } from '../state/SettingsContext';

SplashScreen.preventAutoHideAsync();

const RootNavigator = () => {
  const { palette, isDark } = useSettings();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
};

// Eerste frame wacht op fonts ÉN opgeslagen instellingen: de splash dekt de
// laadtijd, zodat nooit een frame met defaults (NL/licht) flitst voor een
// opgeslagen EN/donker-configuratie.
const AppReadyGate = ({ fontsLoaded }: { fontsLoaded: boolean }) => {
  const { isLoaded } = useSettings();
  const ready = fontsLoaded && isLoaded;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  return <RootNavigator />;
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <SettingsProvider>
      <AppReadyGate fontsLoaded={fontsLoaded} />
    </SettingsProvider>
  );
}
