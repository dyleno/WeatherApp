export const palette = {
  dark: {
    bg: '#17191C',
    surface: '#1D2024',
    field: '#23262B',
    border: '#2F3237',
    panel: '#22382C',
    panelBorder: '#2C4636',
    accent: '#E8955C',
    accentSoft: 'rgba(232, 149, 92, 0.12)',
    sun: '#E7C46A',
    cloud: '#93A698',
    teal: '#7EA894',
    selected: '#42604F',
    selectedText: '#EDF3EE',
    text: '#F1EEE6',
    muted: '#A3A69D',
  },
  light: {
    bg: '#F3F2ED',
    surface: '#FBFAF6',
    field: '#FFFFFF',
    border: '#DCD9D0',
    panel: '#DFEAE2',
    panelBorder: '#C6D8CB',
    accent: '#C06B3C',
    accentSoft: 'rgba(192, 107, 60, 0.10)',
    sun: '#D9A93F',
    cloud: '#7C8F82',
    teal: '#5E8A76',
    selected: '#B9CDBC',
    selectedText: '#243128',
    text: '#23261F',
    muted: '#6F726A',
  },
} as const;

export type Palette = { -readonly [K in keyof (typeof palette)['dark']]: string };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export type SerifWeight = 'medium' | 'semibold' | 'bold';

export const serif = (weight: SerifWeight = 'medium'): string => {
  switch (weight) {
    case 'bold':
      return 'PlayfairDisplay_700Bold';
    case 'semibold':
      return 'PlayfairDisplay_600SemiBold';
    case 'medium':
      return 'PlayfairDisplay_500Medium';
  }
};
