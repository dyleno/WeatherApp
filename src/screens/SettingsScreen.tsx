import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppHeader } from '../components/AppHeader';
import { Segmented } from '../components/Segmented';
import { SelectGrid } from '../components/SelectGrid';
import { Divider, SettingSection } from '../components/SettingSection';
import { useSettings } from '../state/SettingsContext';
import { type as typeScale } from '../theme/tokens';

export const SettingsScreen = () => {
  const { settings, update, t, palette } = useSettings();

  const [locationDraft, setLocationDraft] = useState(settings.defaultLocation);
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.apiKey);

  // Synchroniseer de velden met opgeslagen settings tijdens render (geen effect:
  // dit pattern voorkomt cascaderende renders en dekt de late AsyncStorage-load).
  const [syncedLocation, setSyncedLocation] = useState(settings.defaultLocation);
  const [syncedApiKey, setSyncedApiKey] = useState(settings.apiKey);
  if (syncedLocation !== settings.defaultLocation) {
    setSyncedLocation(settings.defaultLocation);
    setLocationDraft(settings.defaultLocation);
  }
  if (syncedApiKey !== settings.apiKey) {
    setSyncedApiKey(settings.apiKey);
    setApiKeyDraft(settings.apiKey);
  }

  const commitLocation = () => {
    const trimmed = locationDraft.trim();
    if (trimmed === '') {
      setLocationDraft(settings.defaultLocation);
      return;
    }
    update({ defaultLocation: trimmed });
  };

  const commitApiKey = () => {
    const trimmed = apiKeyDraft.trim();
    if (trimmed !== settings.apiKey) update({ apiKey: trimmed });
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <AppHeader
        colors={palette}
        right={<Text style={[typeScale.bodySmall, { color: palette.muted }]}>{t('settings.title')}</Text>}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{t('settings.eyebrow').toUpperCase()}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t('settings.title')}</Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>{t('settings.subtitle')}</Text>

          <View style={styles.divider}>
            <Divider colors={palette} />
          </View>

          <SettingSection title={t('settings.display')} colors={palette}>
            <Segmented
              options={[
                { value: 'light', label: t('settings.light') },
                { value: 'dark', label: t('settings.dark') },
                { value: 'system', label: t('settings.system') },
              ]}
              value={settings.theme}
              onChange={(theme) => update({ theme })}
              colors={palette}
            />
          </SettingSection>

          <View style={styles.divider}>
            <Divider colors={palette} />
          </View>

          <SettingSection title={t('settings.defaultLocation')} colors={palette}>
            <View style={[styles.field, { backgroundColor: palette.field, borderColor: palette.border }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={palette.muted} />
              <TextInput
                style={[styles.input, { color: palette.text }]}
                value={locationDraft}
                onChangeText={setLocationDraft}
                onEndEditing={commitLocation}
                onSubmitEditing={commitLocation}
                placeholder={t('settings.locationPlaceholder')}
                placeholderTextColor={palette.muted}
                autoCorrect={false}
                autoComplete="off"
                returnKeyType="done"
              />
            </View>
          </SettingSection>

          <SettingSection title={t('settings.temperature')} colors={palette}>
            <Segmented
              options={[
                { value: 'celsius', label: `${t('settings.celsius')} °C` },
                { value: 'fahrenheit', label: `${t('settings.fahrenheit')} °F` },
              ]}
              value={settings.tempUnit}
              onChange={(tempUnit) => update({ tempUnit })}
              colors={palette}
            />
          </SettingSection>

          <SettingSection title={t('settings.windSpeed')} colors={palette}>
            <SelectGrid
              options={[
                { value: 'kmh', label: t('settings.windUnit.kmh') },
                { value: 'ms', label: t('settings.windUnit.ms') },
                { value: 'knots', label: t('settings.windUnit.knots') },
                { value: 'beaufort', label: t('settings.windUnit.beaufort') },
              ]}
              value={settings.windUnit}
              onChange={(windUnit) => update({ windUnit })}
              colors={palette}
            />
          </SettingSection>

          <SettingSection title={t('settings.apiKey')} hint={t('settings.optional')} colors={palette}>
            <View style={[styles.field, { backgroundColor: palette.field, borderColor: palette.border }]}>
              <TextInput
                style={[styles.input, { color: palette.text }]}
                value={apiKeyDraft}
                onChangeText={setApiKeyDraft}
                onEndEditing={commitApiKey}
                onSubmitEditing={commitApiKey}
                placeholder={t('settings.apiKeyPlaceholder')}
                placeholderTextColor={palette.muted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                secureTextEntry
                returnKeyType="done"
              />
            </View>
            <Text style={[typeScale.label, { color: palette.muted, marginTop: 8 }]}>{t('settings.apiKeyHelper')}</Text>
          </SettingSection>

          <SettingSection title={t('settings.language')} colors={palette}>
            <Segmented
              options={[
                { value: 'nl', label: 'NL' },
                { value: 'en', label: 'EN' },
              ]}
              value={settings.language}
              onChange={(language) => update({ language })}
              colors={palette}
            />
          </SettingSection>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 20 },
  eyebrow: typeScale.eyebrow,
  title: typeScale.screenTitle,
  subtitle: { ...typeScale.body, marginTop: 6 },
  divider: { marginTop: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
  },
  input: { ...typeScale.body, flex: 1, padding: 0 },
});
