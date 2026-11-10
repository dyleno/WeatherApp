import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { sans, type Palette } from '../theme/tokens';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
  colors: Palette;
};

// Selectie zonder schuifbeweging: de highlight verschijnt op de nieuwe plek
// (fade-in-place via key-remount) en de oude fade weg. Rustig, geen slide.
export const Segmented = <T extends string>({ options, value, onChange, colors }: Props<T>) => {
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [rowWidth, setRowWidth] = useState(0);
  const cellWidth = options.length > 0 ? rowWidth / options.length : 0;

  return (
    <View
      style={[styles.row, { borderColor: colors.border }]}
      onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
    >
      {rowWidth > 0 && cellWidth > 0 ? (
        <Animated.View
          key={value}
          pointerEvents="none"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.thumb,
            { width: cellWidth, left: selectedIndex * cellWidth, backgroundColor: colors.selected },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
          >
            <Text
              style={[
                styles.label,
                // Gelijk gewicht in elke staat: een fontwissel verspringt de tekstbreedte in de cel.
                { color: selected ? colors.selectedText : colors.muted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  thumb: { position: 'absolute', top: 0, bottom: 0, borderRadius: 7 },
  cell: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
  cellPressed: { opacity: 0.6 },
  label: { fontSize: 14, fontFamily: sans('medium') },
});
