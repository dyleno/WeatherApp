import { useSyncExternalStore } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/index';
import { useSettings } from '../state/SettingsContext';
import { sans, type Palette } from '../theme/tokens';
import { getCondition, subscribeCondition } from '../core/conditionStore';
import { WeatherArt } from './WeatherArt';

// Weer-tab-icoon: de levende kunst volgt de actuele conditie (gepubliceerd
// door de hero). Zonder data nog het statische deels-bewolkt-icoon.
const TabWeatherIcon = ({ palette, focused }: { palette: Palette; focused: boolean }) => {
  const condition = useSyncExternalStore(subscribeCondition, getCondition);

  if (!condition) {
    return <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={focused ? palette.accent : palette.muted} />;
  }
  return <WeatherArt code={condition.icon} isDay={condition.isDay} size={26} colors={palette} />;
};

const tabIconName = (routeName: string, focused: boolean): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
  switch (routeName) {
    case 'instellingen':
      return focused ? 'cog' : 'cog-outline';
    case 'over':
      return focused ? 'information' : 'information-outline';
    default:
      return 'weather-partly-cloudy';
  }
};

// Zwevende tabbalk: pill met icoon + label, actieve tab krijgt een zachte
// highlight die fade-in/out (geen slide, geen schaal). De band eromheen draagt
// de app-achtergrond, zodat de blur nooit op lege vensterkleur valt.
export const FloatingTabBar = ({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) => {
  const { palette, isDark } = useSettings();

  return (
    <View style={[styles.container, { backgroundColor: palette.bg, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.pill, { borderColor: palette.border, boxShadow: isDark ? '0px 8px 20px rgba(0, 0, 0, 0.45)' : '0px 8px 20px rgba(35, 38, 31, 0.14)' }]}>
        <BlurView intensity={isDark ? 45 : 65} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = options.title ?? route.name;
          const isWeer = route.name === 'index';

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.item}
            >
              {focused ? (
                <Animated.View
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(150)}
                  style={[styles.activePill, { backgroundColor: palette.selectedSoft }]}
                  pointerEvents="none"
                />
              ) : null}
              <View style={styles.icon}>
                {isWeer ? (
                  <TabWeatherIcon palette={palette} focused={focused} />
                ) : (
                  <MaterialCommunityIcons name={tabIconName(route.name, focused)} size={24} color={focused ? palette.accent : palette.muted} />
                )}
              </View>
              <Text style={[styles.label, { color: focused ? palette.accent : palette.muted, fontFamily: focused ? sans('semibold') : sans('medium') }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Band onder het scherm: app-achtergrond, zodat de blur op app-kleur valt.
  container: { paddingTop: 8, paddingHorizontal: 18, paddingBottom: 12 },
  pill: {
    flexDirection: 'row',
    height: 62,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 7 },
  activePill: { borderRadius: 16 },
  icon: { height: 26, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
});
