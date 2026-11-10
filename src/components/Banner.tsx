import { StyleSheet, Text, View } from 'react-native';
import type { Palette } from '../theme/tokens';

type Props = { text: string; colors: Palette };

export const Banner = ({ text, colors }: Props) => (
  <View
    style={[styles.banner, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
  >
    <View style={[styles.bar, { backgroundColor: colors.accent }]} />
    <Text style={[styles.text, { color: colors.accent }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: { width: 3, alignSelf: 'stretch' },
  text: { flex: 1, fontSize: 13, lineHeight: 18, paddingVertical: 10, paddingHorizontal: 12 },
});
