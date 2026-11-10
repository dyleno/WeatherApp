import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { LogoMark } from '../components/LogoMark';
import { Divider } from '../components/SettingSection';
import { useSettings } from '../state/SettingsContext';
import { serif } from '../theme/tokens';

export const AboutScreen = () => {
  const { t, palette } = useSettings();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <AppHeader
        colors={palette}
        right={<Text style={{ color: palette.muted, fontSize: 13 }}>{t('about.eyebrow')}</Text>}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <LogoMark size={72} teal={palette.teal} accent={palette.accent} />

        <Text style={[styles.eyebrow, { color: palette.accent }]}>{t('about.eyebrow').toUpperCase()}</Text>
        <Text style={[styles.title, { color: palette.text }]}>{t('about.title')}</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>{t('about.subtitle')}</Text>
        <Text style={[styles.version, { color: palette.muted }]}>
          {`${t('about.version')} ${version}`}
        </Text>

        <View style={styles.divider}>
          <Divider colors={palette} />
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="code-tags" size={22} color={palette.accent} />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>{t('about.built')}</Text>
            <Text style={[styles.rowSub, { color: palette.muted }]}>{t('about.builtSub')}</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <Divider colors={palette} />
        </View>

        <View style={styles.row}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={palette.accent} />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: palette.text }]}>{t('about.privacy')}</Text>
            <Text style={[styles.rowSub, { color: palette.muted }]}>{t('about.privacySub')}</Text>
          </View>
        </View>

        <View style={styles.divider}>
          <Divider colors={palette} />
        </View>

        <Text style={[styles.footer, { color: palette.muted }]}>{t('about.dataBy')}</Text>
        <Text style={[styles.footer, { color: palette.muted }]}>{t('about.copyright')}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 16 },
  title: { fontSize: 38, lineHeight: 44, fontFamily: serif('semibold'), marginTop: 4 },
  subtitle: { fontSize: 15, lineHeight: 22, marginTop: 6 },
  version: { fontSize: 12, marginTop: 10 },
  divider: { marginTop: 18 },
  row: { flexDirection: 'row', gap: 14, marginTop: 18, marginBottom: 6 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 13, lineHeight: 19 },
  footer: { fontSize: 12, marginTop: 4 },
});
