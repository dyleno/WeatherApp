import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from './PressableScale';
import { type as typeScale } from '../theme/tokens';
import type { Palette } from '../theme/tokens';

type Props = { text: string; colors: Palette; onPress?: () => void };

export const Banner = ({ text, colors, onPress }: Props) => {
  const content = (
    <View style={[styles.banner, { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}>
      <View style={[styles.bar, { backgroundColor: colors.accent }]} />
      <Text style={[styles.text, { color: colors.accent }]}>{text}</Text>
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.accent} style={styles.chevron} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={text} scaleTo={0.98}>
      {content}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: { width: 3, alignSelf: 'stretch' },
  text: { ...typeScale.bodySmall, flex: 1, paddingVertical: 10, paddingLeft: 12, paddingRight: 4 },
  chevron: { marginRight: 10 },
});
