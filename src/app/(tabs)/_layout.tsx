import { Tabs } from 'expo-router';
import { useSettings } from '../../state/SettingsContext';
import { FloatingTabBar } from '../../components/FloatingTabBar';

export default function TabsLayout() {
  const { t } = useSettings();

  return (
    <Tabs
      // De vendored tabs roept de tabBar-functie direct aan (geen JSX) — hier
      // renderen we hem als element, zodat hooks in FloatingTabBar geldig zijn.
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.weather') }} />
      <Tabs.Screen name="instellingen" options={{ title: t('tabs.settings') }} />
      <Tabs.Screen name="over" options={{ title: t('tabs.about') }} />
    </Tabs>
  );
}
