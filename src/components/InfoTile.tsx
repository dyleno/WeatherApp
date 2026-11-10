import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Palette } from '../theme/tokens';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  icon: IconName;
  label: string;
  value: string;
  sub?: ReactNode;
  colors: Palette;
  isLast?: boolean;
};

export const InfoTile = ({ icon, label, value, sub, colors, isLast = false }: Props) => (
  <View
    style={[
      styles.tile,
      !isLast && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
    ]}
  >
    <MaterialCommunityIcons name={icon} size={18} color={colors.muted} />
    <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    {sub ? <View style={styles.sub}>{sub}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  tile: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
  label: { fontSize: 12 },
  value: { fontSize: 21, fontWeight: '700' },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
