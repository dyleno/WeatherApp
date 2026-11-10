import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useSettings } from '../../state/SettingsContext';
import type { Palette } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IconColor = React.ComponentProps<typeof MaterialCommunityIcons>['color'];

const TabGlyph = ({
  name,
  color,
  focused,
  palette,
}: {
  name: IconName;
  color: ColorValue;
  focused: boolean;
  palette: Palette;
}) => (
  <View style={styles.glyph}>
    <MaterialCommunityIcons name={name} color={color as IconColor} size={22} />
    <View style={[styles.dot, { backgroundColor: focused ? palette.accent : 'transparent' }]} />
  </View>
);

export default function TabsLayout() {
  const { t, palette } = useSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.weather'),
          tabBarIcon: ({ focused, color }) => (
            <TabGlyph name="weather-partly-cloudy" color={color} focused={focused} palette={palette} />
          ),
        }}
      />
      <Tabs.Screen
        name="instellingen"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ focused, color }) => (
            <TabGlyph name="cog" color={color} focused={focused} palette={palette} />
          ),
        }}
      />
      <Tabs.Screen
        name="over"
        options={{
          title: t('tabs.about'),
          tabBarIcon: ({ focused, color }) => (
            <TabGlyph name="information-outline" color={color} focused={focused} palette={palette} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  glyph: { alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
});
