import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import { LogoMark } from './LogoMark';
import { type as typeScale } from '../theme/tokens';
import type { Palette } from '../theme/tokens';

type Props = { colors: Palette; right?: ReactNode };

export const AppHeader = ({ colors, right }: Props) => {
  // Duw de header onder de statusbalk (klok/batterij liep anders over de titel).
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 12 }]}>
      <LogoMark size={40} teal={colors.teal} accent={colors.accent} />
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: colors.text }]}>Deltion</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>weer</Text>
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleBlock: { marginLeft: 10 },
  title: typeScale.cardTitle,
  subtitle: { ...typeScale.label, marginTop: 1 },
  right: { marginLeft: 'auto' },
});
