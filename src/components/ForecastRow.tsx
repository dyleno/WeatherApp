import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { WeatherGlyph } from './WeatherGlyph';
import { formatTemp } from '../core/temperature';
import { sans, type as typeScale, type Palette } from '../theme/tokens';
import type { TempUnit } from '../core/types';

type Props = {
  dayLabel: string;
  icon: string;
  isDay: boolean;
  minC: number;
  maxC: number;
  tempUnit: TempUnit;
  colors: Palette;
  showDivider?: boolean;
  enterDelay?: number;
};

export const ForecastRow = ({
  dayLabel,
  icon,
  isDay,
  minC,
  maxC,
  tempUnit,
  colors,
  showDivider = true,
  enterDelay = 0,
}: Props) => (
  <Animated.View entering={FadeInDown.delay(enterDelay).duration(380)}>
    {showDivider ? <View style={[styles.divider, { backgroundColor: colors.panelBorder }]} /> : null}
    <View style={styles.row}>
      <Text style={[styles.day, { color: colors.text }]}>{dayLabel}</Text>
      <View style={styles.glyph}>
        <WeatherGlyph code={icon} isDay={isDay} size={30} colors={colors} />
      </View>
      <View style={styles.temps}>
        <Text style={[styles.min, { color: colors.muted }]}>{formatTemp(minC, tempUnit)}</Text>
        <Text style={[styles.max, { color: colors.text }]}>{formatTemp(maxC, tempUnit)}</Text>
      </View>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  divider: { height: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  day: { ...typeScale.dayName, width: 78 },
  glyph: { flex: 1, alignItems: 'center' },
  temps: { flexDirection: 'row', gap: 10, minWidth: 64, justifyContent: 'flex-end' },
  min: typeScale.body,
  max: { ...typeScale.body, fontFamily: sans('semibold') },
});
