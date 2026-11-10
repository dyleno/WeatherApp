import { useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { type as typeScale, type Palette } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: Palette;
  columns?: number;
};

type CellProps<T extends string> = {
  option: Option<T>;
  selected: boolean;
  colors: Palette;
  onSelect: () => void;
  column: number;
  isLastRow: boolean;
  columns: number;
};

// Cel met kleur-tween: achtergrond en label kleuren zacht over (150 ms)
// in plaats van hard te wisselen; het vinkje fade in. Geen beweging.
const GridCell = <T extends string>({ option, selected, colors, onSelect, column, isLastRow, columns }: CellProps<T>) => {
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [progress, selected]);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['transparent', colors.selected]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [colors.muted, colors.selectedText]),
  }));

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.cell,
        { width: `${100 / columns}%` },
        pressed && styles.cellPressed,
        column > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
        !isLastRow && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, backgroundStyle]} pointerEvents="none" />
      <Animated.Text
        style={[
          styles.label,
          labelStyle,
          // Gelijk gewicht in elke staat: een fontwissel verspringt de tekstbreedte in de cel.
        ]}
      >
        {option.label}
      </Animated.Text>
      {selected ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <MaterialCommunityIcons name="check" size={16} color={colors.selectedText} />
        </Animated.View>
      ) : null}
    </Pressable>
  );
};

// Raster van keuzecellen (zoals de windsnelheid in het design: 2×2).
export const SelectGrid = <T extends string>({ options, value, onChange, colors, columns = 2 }: Props<T>) => (
  <View style={[styles.grid, { borderColor: colors.border }]}>
    {options.map((option, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const isLastRow = row === Math.floor((options.length - 1) / columns);
      return (
        <GridCell
          key={option.value}
          option={option}
          selected={option.value === value}
          colors={colors}
          onSelect={() => onChange(option.value)}
          column={column}
          isLastRow={isLastRow}
          columns={columns}
        />
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  cell: {
    flexGrow: 1,
    flexBasis: 0,
    height: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: typeScale.control,
  cellPressed: { opacity: 0.6 },
});
