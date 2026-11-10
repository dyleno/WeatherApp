import { useState } from 'react';
import LottieView, { type AnimationObject } from 'lottie-react-native';
import { WeatherGlyph } from './WeatherGlyph';
import { artKeyForIcon, type ArtKey } from '../core/weatherArt';
import { recolorLottieColors, type ColorMap } from '../core/lottieRecolor';
import type { Palette } from '../theme/tokens';

type Props = { code: string; isDay: boolean; size: number; colors: Palette; playing?: boolean };

// Statische asset-map (Metro-veilig: geen dynamische requires).
// Let op: Metro geeft JSON-requires direct het object (geen .default-wrapper).
const ASSETS: Record<ArtKey, unknown> = {
  clearDay: require('../../assets/weather/clearDay.json'),
  clearNight: require('../../assets/weather/clearNight.json'),
  partlyDay: require('../../assets/weather/partlyDay.json'),
  cloudy: require('../../assets/weather/cloudy.json'),
  rain: require('../../assets/weather/rain.json'),
  thunder: require('../../assets/weather/thunder.json'),
  snow: require('../../assets/weather/snow.json'),
  fog: require('../../assets/weather/fog.json'),
};

const jsonOf = (mod: unknown): unknown => {
  if (mod !== null && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as { default: unknown }).default;
  }
  return mod;
};

// Bronkleuren van Meteocons-flat → palet-tokens (geëxtraheerd uit de assets,
// zie ledger Task 4). De kunst volgt zo het thema in plaats van het te breken.
const colorMapFor = (colors: Palette): ColorMap => ({
  '#f8af18': colors.sun, // zon
  '#72b9d5': colors.teal, // maan
  '#f3f7fe': colors.cloud, // wolken
  '#e2e8f0': colors.muted, // mist
  '#0a5ad4': colors.teal, // regen
  '#86c3db': colors.cloud, // sneeuw
  '#f6a823': colors.accent, // bliksem
});

// Recolor is duur: cache per (asset, palet). bg is uniek per thema.
const cache = new Map<string, unknown>();

const recoloredFor = (key: ArtKey, colors: Palette): unknown => {
  const cacheKey = `${key}:${colors.bg}`;
  let data = cache.get(cacheKey);
  if (!data) {
    data = recolorLottieColors(jsonOf(ASSETS[key]), colorMapFor(colors));
    cache.set(cacheKey, data);
  }
  return data;
};

// De levende weerkunst: Lottie per conditie, gerecolored naar het palet.
// playing=false toont frame 0 (voorspelrijen: consistente stijl, geen 5× loop).
export const WeatherArt = ({ code, isDay, size, colors, playing = true }: Props) => {
  // Faalstatus per asset-key (geen effect nodig): een kapot asset degradt naar
  // het platte glyph, een andere conditie probeert het gewoon opnieuw.
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const artKey = artKeyForIcon(code, isDay);

  if (failedKey === artKey || !ASSETS[artKey]) {
    return <WeatherGlyph code={code} isDay={isDay} size={size} colors={colors} />;
  }

  return (
    <LottieView
      source={recoloredFor(artKey, colors) as AnimationObject}
      autoPlay={playing}
      loop={playing}
      // Gepauzeerd: pin op frame 0 zodat de rij-kunst niet leeg blijft.
      progress={playing ? undefined : 0}
      speed={0.8}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onAnimationFailure={() => setFailedKey(artKey)}
    />
  );
};
