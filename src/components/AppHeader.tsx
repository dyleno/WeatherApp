import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { LogoMark } from './LogoMark';
import type { Palette } from '../theme/tokens';

type Props = { colors: Palette; right?: ReactNode };

export const AppHeader = ({ colors, right }: Props) => (
  <View style={[styles.header, { borderBottomColor: colors.border }]}>
    <LogoMark size={40} teal={colors.teal} accent={colors.accent} />
    <View style={styles.titleBlock}>
      <Text style={[styles.title, { color: colors.text }]}>Deltion</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>weer</Text>
    </View>
    <View style={styles.right}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  titleBlock: { marginLeft: 10 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  right: { marginLeft: 'auto' },
});
