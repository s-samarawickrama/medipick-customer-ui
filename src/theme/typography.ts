import { TextStyle } from 'react-native';

/**
 * Modern Premium Healthcare Typography System
 * 
 * Pairings:
 * - Headings / Brand Accents: Outfit (Geometric, modern, high-end consumer vibe like DoorDash/Airbnb)
 * - Body / Subtitles / Micro-copy: Plus Jakarta Sans (Clean, high-legibility modern sans-serif)
 */
export const FONTS = {
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semibold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extrabold: 'Outfit_800ExtraBold',
  black:     'Outfit_900Black',
};

export const FONT_SIZE = {
  xs:   11,
  sm:   13,
  base: 14,
  md:   15,
  lg:   16,
  xl:   18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 34,
  '6xl': 42,
};

export const TEXT: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: 'Outfit_900Black',
    fontSize: 34,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  displayMd: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  headingLg: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  headingMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  bodyMd: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
  },
};
