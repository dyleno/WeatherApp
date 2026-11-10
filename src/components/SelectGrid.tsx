import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, type Palette } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: Palette;
  columns?: number;
};

// Raster van keuzecellen (zoals de windsnelheid in het design: 2×2).
export const SelectGrid = <T extends string>({ options, value, onChange, colors, columns = 2 }: Props<T>) => (
  <View style={[styles.grid, { borderColor: colors.border }]}>
    {options.map((option, index) => {
      const selected = option.value === value;
      const row = Math.floor(index / columns);
      const column = index % columns;
      const isLastRow = row === Math.floor((options.length - 1) / columns);
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          style={[
            styles.cell,
            { width: `${100 / columns}%` },
            column > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
            !isLastRow && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            selected && { backgroundColor: colors.selected },
          ]}
        >
          <Text
            style={[
              styles.label,
              { color: selected ? colors.selectedText : colors.muted },
              selected && { fontFamily: serif('semibold') },
            ]}
          >
            {option.label}
          </Text>
          {selected ? (
            <MaterialCommunityIcons name="check" size={16} color={colors.selectedText} />
          ) : null}
        </Pressable>
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
  label: { fontSize: 14 },
});
