// Recolourt Lottie-JSONs naar het app-palet: zuivere functie, geen mutatie.
// Kleuren in Lottie staan als `c: { k: [r, g, b] | [r, g, b, a] }` met kanalen 0-1.
// Onbekende kleuren gaan onaangetast mee; de structuur wordt gekloond.

export type ColorMap = Record<string, string>; // '#rrggbb' bron → '#rrggbb' doel

const channelToHex = (value: number): string =>
  Math.max(0, Math.min(255, Math.round(value * 255)))
    .toString(16)
    .padStart(2, '0');

const floatsToHex = (channels: number[]): string =>
  `#${channelToHex(channels[0])}${channelToHex(channels[1])}${channelToHex(channels[2])}`.toLowerCase();

const hexToFloats = (hex: string): number[] => {
  const clean = hex.replace('#', '');
  const parse = (slice: string) => parseInt(slice, 16) / 255;
  return [parse(clean.slice(0, 2)), parse(clean.slice(2, 4)), parse(clean.slice(4, 6))];
};

const isColorK = (value: unknown): value is number[] =>
  Array.isArray(value) &&
  (value.length === 3 || value.length === 4) &&
  value.every((n) => typeof n === 'number' && n >= 0 && n <= 1);

const remapColorK = (channels: number[], map: ColorMap): number[] => {
  const hex = floatsToHex(channels);
  const target = map[hex];
  if (!target) return [...channels];
  const floats = hexToFloats(target);
  return channels.length === 4 ? [floats[0], floats[1], floats[2], channels[3]] : floats;
};

const walk = (node: unknown, map: ColorMap): unknown => {
  if (Array.isArray(node)) return node.map((item) => walk(item, map));
  if (node === null || typeof node !== 'object') return node;

  const source = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(source)) {
    if (key === 'c' && value !== null && typeof value === 'object' && isColorK((value as Record<string, unknown>).k)) {
      const color = value as { k: number[] };
      result[key] = { ...color, k: remapColorK(color.k, map) };
      continue;
    }
    result[key] = walk(value, map);
  }
  return result;
};

export const recolorLottieColors = (json: unknown, map: ColorMap): unknown => walk(json, map);
