import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { AppHeader } from '../components/AppHeader';
import { WeatherArt } from '../components/WeatherArt';
import { WindArrow } from '../components/WindArrow';
import { InfoTile } from '../components/InfoTile';
import { Banner } from '../components/Banner';
import { ForecastRow } from '../components/ForecastRow';
import { PressableScale } from '../components/PressableScale';
import { aggregateDaily } from '../core/forecast';
import { pressureTrend } from '../core/pressure';
import { compassPoint, windValueLabel } from '../core/wind';
import { celsiusToUnit } from '../core/temperature';
import { humidityKey } from '../core/conditions';
import { countryName } from '../core/countries';
import { labelPlace } from '../core/places';
import { buildDemoSnapshot } from '../services/demoWeather';
import { fetchCurrentWeather, fetchForecast, reverseGeocodePlace } from '../services/owmApi';
import { requestCurrentLocation, resolveDefaultCity } from '../services/location';
import { OWM_API_KEY } from '../config';
import { useSettings } from '../state/SettingsContext';
import { localeOf, type TranslateKey } from '../i18n/translations';
import { type as typeScale } from '../theme/tokens';
import type { LocationSource, Place, WeatherSnapshot } from '../core/types';

type ErrorState = { key: TranslateKey; vars?: Record<string, string> };
type BannerAction = 'openSettings' | 'retry' | 'locationSettings';
type BannerState = { text: string; action: BannerAction };

// Gestaffelde binnenkomst: elk blok glijdt iets later naar binnen.
// Builders buiten de component (aanrading reanimated-docs: stabiel qua referentie).
const ENTER_HERO = FadeInDown.duration(420);
const ENTER_BANNER = FadeInDown.delay(60).duration(420);
const ENTER_TILES = FadeInDown.delay(120).duration(420);
const ENTER_OUTLOOK = FadeInDown.delay(180).duration(420);

export const WeatherScreen = () => {
  const { settings, t, palette } = useSettings();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadSeq = useRef(0);
  const hasSnapshotRef = useRef(false);

  const apiKey = settings.apiKey.trim() || OWM_API_KEY;
  const isDemo = apiKey === '';
  const defaultPlace = settings.defaultPlace;

  const load = useCallback(async (opts?: { userInitiated?: boolean }) => {
    const seq = ++loadSeq.current;
    const userInitiated = opts?.userInitiated ?? false;
    setError(null);

    if (isDemo) {
      setLocationDenied(false);
      if (userInitiated) setIsRefreshing(false);
      if (loadSeq.current !== seq) return;
      setSnapshot(buildDemoSnapshot(new Date(), settings.language));
      hasSnapshotRef.current = true;
      return;
    }

    if (userInitiated) setIsRefreshing(true);
    try {
      const location = await requestCurrentLocation();
      // Verouderde run (nieuwer verzoek actief): resultaat negeren.
      if (loadSeq.current !== seq) return;
      setLocationDenied(location.status === 'denied');

      let coords: { lat: number; lon: number };
      let locationSource: LocationSource = 'default';
      let resolvedPlace: Place | null = null;

      if (location.status === 'granted') {
        locationSource = 'gps';
        coords = { lat: location.lat, lon: location.lon };
      } else if (defaultPlace) {
        // Geverifieerde keuze uit de zoeksuggesties: coördinaten zijn al
        // bekend, geen geocoding nodig (werkt ook offline).
        coords = { lat: defaultPlace.lat, lon: defaultPlace.lon };
        resolvedPlace = defaultPlace;
      } else {
        const resolved = await resolveDefaultCity(apiKey, settings.defaultLocation, settings.language);
        if (!resolved) {
          if (loadSeq.current !== seq) return;
          setError({ key: 'weather.cityNotFound', vars: { city: settings.defaultLocation } });
          return;
        }
        coords = { lat: resolved.lat, lon: resolved.lon };
        resolvedPlace = resolved;
      }

      const [currentResult, entries, reversePlace] = await Promise.all([
        fetchCurrentWeather(apiKey, coords, settings.language),
        fetchForecast(apiKey, coords, settings.language),
        // Alleen bij GPS: het weerantwoord-label kan uit de verkeerde plaats
        // komen; de echte gemeentenaam komt uit de reverse-geocoding. Faalt
        // deze, dan valt het label stil terug op het weerantwoord.
        locationSource === 'gps'
          ? reverseGeocodePlace(apiKey, coords, settings.language).catch(() => null)
          : Promise.resolve(null),
      ]);

      if (loadSeq.current !== seq) return;
      setSnapshot({
        isDemo: false,
        locationSource,
        place: labelPlace(locationSource, currentResult.place, reversePlace, resolvedPlace),
        current: currentResult.current,
        trend: entries[0] ? pressureTrend(currentResult.current.pressureHpa, entries[0].pressureHpa) : 'stable',
        daily: aggregateDaily(entries, new Date(), 5),
      });
      hasSnapshotRef.current = true;
    } catch {
      if (loadSeq.current !== seq) return;
      // Achtergrondfout (bijv. taalwissel): bestaande data blijft staan, geen melding.
      if (!userInitiated && hasSnapshotRef.current) return;
      setError({ key: 'weather.errorBanner' });
    } finally {
      // Alleen een user-initiated run bedient de spinner; achtergrondruns raken
      // de refresh-status nooit aan.
      if (userInitiated) setIsRefreshing(false);
    }
  }, [apiKey, isDemo, defaultPlace, settings.defaultLocation, settings.language]);

  useEffect(() => {
    // Start de fetch ná de mount-tick: de effect-body zelf doet dan geen
    // sync setState meer (react-hooks/set-state-in-effect).
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const locale = localeOf(settings.language);
  const dateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
        .format(new Date())
        .toUpperCase();
    } catch {
      return '';
    }
  }, [locale]);

  const dayLabelFor = (dateISO: string, index: number): string => {
    if (index === 0) return t('weather.tomorrow');
    try {
      const formatted = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
        new Date(`${dateISO}T12:00:00`),
      );
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return dateISO;
    }
  };

  // De banner is pure data; pressBanner vertaalt de actie pas bij de klik naar een effect.
  // Zo stroomt de ref-muterende load-callback niet mee in een render-afgeleide waarde.
  const banner: BannerState | null = isDemo
    ? { text: t('weather.demoBanner'), action: 'openSettings' }
    : error
      ? { text: t(error.key, error.vars), action: 'retry' }
      : locationDenied
        ? { text: t('weather.locationBanner'), action: 'locationSettings' }
        : null;

  const pressBanner = (action: BannerAction) => {
    if (action === 'openSettings') router.push('/(tabs)/instellingen');
    else if (action === 'retry') void load({ userInitiated: true });
    else void Linking.openSettings();
  };

  if (!snapshot) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bg }]}>
        <AppHeader
          colors={palette}
          right={
            <PressableScale accessibilityLabel={t('weather.refresh')} hitSlop={8} onPress={() => void load({ userInitiated: true })}>
              <MaterialCommunityIcons name="refresh" size={22} color={palette.muted} />
            </PressableScale>
          }
        />
        <View style={styles.center}>
          {error ? (
            <View style={styles.centerInner}>
              <Banner text={t(error.key, error.vars)} colors={palette} onPress={() => void load({ userInitiated: true })} />
              <PressableScale
                style={[styles.retry, { borderColor: palette.border }]}
                onPress={() => void load({ userInitiated: true })}
              >
                <Text style={[typeScale.body, { color: palette.text }]}>{t('weather.refresh')}</Text>
              </PressableScale>
            </View>
          ) : (
            <ActivityIndicator color={palette.accent} />
          )}
        </View>
      </View>
    );
  }

  const hero = (
    <View>
      <View style={styles.locationRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={18} color={palette.muted} />
        <View style={styles.locationText}>
          <Text style={[styles.placeName, { color: palette.text }]}>
            {snapshot.place.name || settings.defaultLocation}
          </Text>
          <Text style={[styles.placeSub, { color: palette.muted }]}>
            {`${countryName(snapshot.place.country, settings.language)} · ${t(
              snapshot.locationSource === 'gps' ? 'weather.gpsLocation' : 'weather.standardLocation',
            )}`}
          </Text>
        </View>
      </View>

      <Text style={[styles.dateLabel, { color: palette.accent }]}>{dateLabel}</Text>

      <View style={styles.tempRow}>
        <Text style={[styles.temp, { color: palette.text }]}>
          {Math.round(celsiusToUnit(snapshot.current.temperatureC, settings.tempUnit))}
          <Text style={styles.degree}>°</Text>
        </Text>
        <Animated.View key={`${snapshot.current.icon}-${snapshot.current.isDay}`} entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)}>
          <WeatherArt code={snapshot.current.icon} isDay={snapshot.current.isDay} size={112} colors={palette} publish />
        </Animated.View>
      </View>

      <Text style={[styles.condition, { color: palette.text }]}>{snapshot.current.description}</Text>
      <Text style={[styles.feelsLike, { color: palette.muted }]}>
        {t('weather.feelsLike', {
          temp: Math.round(celsiusToUnit(snapshot.current.feelsLikeC, settings.tempUnit)),
        })}
      </Text>
    </View>
  );

  const tiles = (
    <View style={[styles.tiles, { borderColor: palette.border }]}>
      <InfoTile
        icon="weather-windy"
        label={t('weather.wind')}
        value={windValueLabel(snapshot.current.windMs, settings.windUnit, settings.language)}
        colors={palette}
        sub={
          <View style={styles.windSub}>
            <WindArrow deg={snapshot.current.windDeg} color={palette.accent} />
            <Text style={[typeScale.label, { color: palette.muted }]}>
              {t('weather.windFrom', { dir: compassPoint(snapshot.current.windDeg, settings.language) })}
            </Text>
          </View>
        }
      />
      <InfoTile
        icon="gauge"
        label={t('weather.pressure')}
        value={`${Math.round(snapshot.current.pressureHpa)}`}
        colors={palette}
        sub={
          <Text style={[typeScale.label, { color: palette.muted }]}>
            {`${t('weather.pressureUnit')} · ${t(`weather.trend.${snapshot.trend}`)}`}
          </Text>
        }
      />
      <InfoTile
        icon="water-percent"
        label={t('weather.humidity')}
        value={`${snapshot.current.humidityPct}%`}
        colors={palette}
        isLast
        sub={
          <Text style={[typeScale.label, { color: palette.muted }]}>
            {t(`weather.humidityLabel.${humidityKey(snapshot.current.humidityPct)}`)}
          </Text>
        }
      />
    </View>
  );

  const outlook = (
    <View style={[styles.outlook, { backgroundColor: palette.panel, borderColor: palette.panelBorder }]}>
      <View style={styles.outlookHeader}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>{t('weather.outlook').toUpperCase()}</Text>
        {snapshot.isDemo ? (
          <View style={[styles.demoBadge, { borderColor: palette.accent }]}>
            <Text style={[styles.demoBadgeText, { color: palette.accent }]}>
              {t('weather.demoBadge').toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.outlookTitle, { color: palette.text }]}>{t('weather.outlookTitle')}</Text>
      <View style={styles.outlookRows}>
        {snapshot.daily.map((day, index) => (
          <ForecastRow
            key={day.dateISO}
            dayLabel={dayLabelFor(day.dateISO, index)}
            icon={day.icon}
            isDay
            minC={day.minC}
            maxC={day.maxC}
            tempUnit={settings.tempUnit}
            colors={palette}
            showDivider={index > 0}
            enterDelay={80 + index * 60}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <AppHeader
        colors={palette}
        right={
          <PressableScale accessibilityLabel={t('weather.refresh')} hitSlop={8} onPress={() => void load({ userInitiated: true })}>
            <MaterialCommunityIcons name="refresh" size={22} color={palette.muted} />
          </PressableScale>
        }
      />
      <ScrollView
        contentContainerStyle={
          isLandscape
            ? [styles.landscapeContent, { backgroundColor: palette.bg }]
            : [styles.portraitContent, { backgroundColor: palette.bg }]
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => void load({ userInitiated: true })} tintColor={palette.accent} />
        }
      >
        {isLandscape ? (
          <View style={styles.landscapeRow}>
            <View style={styles.landscapeLeft}>
              <Animated.View entering={ENTER_HERO}>{hero}</Animated.View>
              {banner ? (
                <Animated.View entering={ENTER_BANNER}>
                  <Banner text={banner.text} colors={palette} onPress={() => pressBanner(banner.action)} />
                </Animated.View>
              ) : null}
              <Animated.View entering={ENTER_TILES}>{tiles}</Animated.View>
            </View>
            <View style={[styles.landscapeRight, { borderLeftColor: palette.border }]}>
              <Animated.View entering={ENTER_OUTLOOK}>{outlook}</Animated.View>
            </View>
          </View>
        ) : (
          <>
            <Animated.View entering={ENTER_HERO}>{hero}</Animated.View>
            {banner ? (
              <Animated.View entering={ENTER_BANNER}>
                <Banner text={banner.text} colors={palette} onPress={() => pressBanner(banner.action)} />
              </Animated.View>
            ) : null}
            <Animated.View entering={ENTER_TILES}>{tiles}</Animated.View>
            <Animated.View entering={ENTER_OUTLOOK}>{outlook}</Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerInner: { width: '100%', gap: 16 },
  retry: { borderWidth: 1, borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center' },
  portraitContent: { padding: 20, gap: 16, paddingBottom: 32 },
  landscapeContent: { padding: 20, paddingBottom: 32, minHeight: '100%' },
  landscapeRow: { flexDirection: 'row', gap: 20, flex: 1 },
  landscapeLeft: { flex: 1.3, gap: 16 },
  landscapeRight: { flex: 1, borderLeftWidth: 1, paddingLeft: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { gap: 1 },
  placeName: typeScale.cardTitle,
  placeSub: typeScale.label,
  dateLabel: { ...typeScale.eyebrow, marginTop: 16 },
  tempRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 },
  temp: { ...typeScale.display },
  degree: { fontSize: 44 },
  condition: { ...typeScale.condition, marginTop: 4 },
  feelsLike: { ...typeScale.bodySmall, marginTop: 2 },
  tiles: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  windSub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  outlook: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  outlookHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: typeScale.eyebrow,
  demoBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  demoBadgeText: { ...typeScale.eyebrow, fontSize: 10, letterSpacing: 1 },
  outlookTitle: { ...typeScale.sectionTitle, marginTop: 4 },
  outlookRows: { marginTop: 6 },
});
