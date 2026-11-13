import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { shouldSearchCities, type CitySuggestion } from '../core/citySearch';
import { searchCities } from '../services/openMeteoApi';
import type { Language } from '../core/types';
import { type as typeScale, type Palette } from '../theme/tokens';
import { PressableScale } from './PressableScale';

const SEARCH_DEBOUNCE_MS = 300;

type Props = {
  value: string;
  language: Language;
  placeholder: string;
  noMatchesLabel: string;
  colors: Palette;
  onChangeText: (value: string) => void;
  onEndEditing: () => void;
  onPick: (suggestion: CitySuggestion) => void;
};

type SearchResult = { query: string; hits: CitySuggestion[] };

// Zoekveld met suggesties tijdens het typen. Netwerk en debounce zijn de
// schil; parsen en rangschikken staan in core/citySearch (kern-tests).
// Zichtbaarheid is afgeleid uit de staat — geen sync setState in de
// effect-body, en een verouderd antwoord verliest zijn seq en wordt genegeerd.
export const CitySearchField = ({
  value,
  language,
  placeholder,
  noMatchesLabel,
  colors,
  onChangeText,
  onEndEditing,
  onPick,
}: Props) => {
  const [result, setResult] = useState<SearchResult | null>(null);
  const searchSeq = useRef(0);
  // Na een keuze staat de gekozen naam in het veld; de lijst blijft weg tot
  // de gebruiker weer iets anders typt. In plaats van een ref: de zichtbaarheid
  // leest deze waarde tijdens render.
  const [pickedName, setPickedName] = useState<string | null>(null);

  const query = value.trim();
  const isActive = shouldSearchCities(query) && pickedName !== query;
  const resultForQuery = result && result.query === query && isActive ? result : null;
  const visible = resultForQuery?.hits ?? [];
  const showNoMatches = resultForQuery !== null && resultForQuery.hits.length === 0;

  useEffect(() => {
    const trimmed = value.trim();
    if (!shouldSearchCities(trimmed) || pickedName === trimmed) return;

    const seq = ++searchSeq.current;
    const timer = setTimeout(() => {
      searchCities(trimmed, language)
        .then((hits) => {
          if (searchSeq.current !== seq) return;
          setResult({ query: trimmed, hits });
        })
        .catch(() => {
          // Zoekfout (offline, storing): stil lege lijst — het veld werkt
          // gewoon door als vrije tekst.
          if (searchSeq.current !== seq) return;
          setResult({ query: trimmed, hits: [] });
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, language, pickedName]);

  const pick = (suggestion: CitySuggestion) => {
    setPickedName(suggestion.name);
    onPick(suggestion);
  };

  return (
    <View>
      <View style={[styles.field, { backgroundColor: colors.field, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.muted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          onEndEditing={onEndEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="done"
        />
        {isActive ? <MaterialCommunityIcons name="magnify" size={16} color={colors.muted} /> : null}
      </View>

      {visible.length > 0 || showNoMatches ? (
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {visible.map((suggestion) => (
            <PressableScale
              key={`${suggestion.name}|${suggestion.region}|${suggestion.lat},${suggestion.lon}`}
              accessibilityRole="button"
              onPress={() => pick(suggestion)}
            >
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker-radius" size={16} color={colors.muted} />
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  {suggestion.region !== '' || suggestion.country !== '' ? (
                    <Text style={[typeScale.label, { color: colors.muted }]} numberOfLines={1}>
                      {[suggestion.region, suggestion.country].filter(Boolean).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </PressableScale>
          ))}
          {visible.length === 0 ? (
            <Text style={[typeScale.label, { color: colors.muted, padding: 12 }]}>{noMatchesLabel}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
  sheet: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowText: { flex: 1, gap: 1 },
  rowName: { ...typeScale.body },
});
