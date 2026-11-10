import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSettings } from '../../state/SettingsContext';
import { sans } from '../../theme/tokens';
import type { Palette } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type IconColor = React.ComponentProps<typeof MaterialCommunityIcons>['color'];

const GLYPH_SPRING = { damping: 12, stiffness: 260 };

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
}) => {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const dot = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, GLYPH_SPRING);
    dot.value = withTiming(focused ? 1 : 0, { duration: 160 });
  }, [dot, focused, scale]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [{ scale: 0.4 + dot.value * 0.6 }],
  }));

  return (
    <View style={styles.glyph}>
      <Animated.View style={iconStyle}>
        <MaterialCommunityIcons name={name} color={color as IconColor} size={22} />
      </Animated.View>
      <Animated.View style={[styles.dot, { backgroundColor: palette.accent }, dotStyle]} />
    </View>
  );
};

export default function TabsLayout() {
  const { t, palette } = useSettings();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.text,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.surface, borderTopColor: palette.border },
        tabBarLabelStyle: { fontSize: 11, fontFamily: sans('medium') },
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
