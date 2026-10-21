import type { TextStyle } from 'react-native';

/**
 * Colours come from Core Asana's own product colourways (Midnight Blue, Lavender, Amber, Vermilion)
 * so the partner app feels like part of the brand rather than a generic fintech skin.
 */
export const colors = {
  midnight: '#1C2140',
  midnightSoft: '#2A3058',
  lavender: '#B9A8E0',
  lavenderDeep: '#9C88CF',
  lavenderSoft: '#E6DFF5',
  mist: '#F2F0F6',
  amber: '#E9A23B',
  amberSoft: '#FBEBD2',
  leaf: '#2E7D5B',
  leafSoft: '#DCEFE5',
  vermilion: '#D8452B',
  vermilionSoft: '#F8DED8',
  slate: '#5B5F7A',
  line: '#DCD8E6',
  white: '#FFFFFF',
} as const;

export const radius = {
  card: 20, // the partner card only
  panel: 12, // sheets, panels
  control: 8, // inputs, buttons
  pill: 999,
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const fonts = {
  display: 'YoungSerif_400Regular',
  body: 'RedHatText_400Regular',
  bodyMedium: 'RedHatText_500Medium',
  bodySemi: 'RedHatText_600SemiBold',
  bodyBold: 'RedHatText_700Bold',
  mono: 'RedHatMono_400Regular',
  monoMedium: 'RedHatMono_500Medium',
} as const;

// Young Serif defaults to old-style figures ("10" reads like "IO"), so codes and amounts switch to lining figures.
const lining: TextStyle = { fontVariant: ['lining-nums'] };
const tabular: TextStyle = { fontVariant: ['lining-nums', 'tabular-nums'] };

/** Type scale: Young Serif has a single weight, so display hierarchy comes from size alone. */
export const type = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: colors.midnight, letterSpacing: -0.4, ...lining },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.midnight, letterSpacing: -0.2, ...lining },
  heading: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26, color: colors.midnight, ...lining },
  amountXL: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.midnight, ...tabular },
  amount: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.midnight, ...tabular },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.midnight },
  bodyStrong: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 24, color: colors.midnight },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.slate },
  smallStrong: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20, color: colors.midnight },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, color: colors.slate },
  number: { fontFamily: fonts.bodySemi, fontSize: 16, lineHeight: 22, color: colors.midnight, ...tabular },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20, color: colors.midnight, letterSpacing: 0.2 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;
export const figures = { lining, tabular };
