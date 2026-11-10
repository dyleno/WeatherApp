import { Pressable, StyleSheet, Text, View } from 'react-native';
import { serif, type Palette } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: Palette;
};

export const Segmented = <T extends string>({ options, value, onChange, colors }: Props<T>) => (
  <View style={[styles.row, { borderColor: colors.border }]}>
    {options.map((option, index) => {
      const selected = option.value === value;
      return (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          accessibilityRole="button"
          accessibilityState={{ selected }}
          style={[
            styles.cell,
            index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
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
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  cell: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14 },
});
