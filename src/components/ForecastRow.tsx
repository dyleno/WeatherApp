import { StyleSheet, Text, View } from 'react-native';
import { WeatherGlyph } from './WeatherGlyph';
import { formatTemp } from '../core/temperature';
import { serif, type Palette } from '../theme/tokens';
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
};

export const ForecastRow = ({ dayLabel, icon, isDay, minC, maxC, tempUnit, colors, showDivider = true }: Props) => (
  <View>
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
  </View>
);

const styles = StyleSheet.create({
  divider: { height: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  day: { width: 78, fontSize: 15, fontFamily: serif('medium') },
  glyph: { flex: 1, alignItems: 'center' },
  temps: { flexDirection: 'row', gap: 10, minWidth: 64, justifyContent: 'flex-end' },
  min: { fontSize: 15 },
  max: { fontSize: 15, fontWeight: '700' },
});
