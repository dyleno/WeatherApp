import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Palette } from '../theme/tokens';

export const Divider = ({ colors }: { colors: Palette }) => (
  <View style={[styles.divider, { backgroundColor: colors.border }]} />
);

type Props = { title: string; hint?: string; colors: Palette; children: ReactNode };

export const SettingSection = ({ title, hint, colors, children }: Props) => (
  <View>
    <View style={styles.heading}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {hint ? <Text style={[styles.hint, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  divider: { height: 1 },
  heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12 },
});
