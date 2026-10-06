/**
 * MediPick "Botanical Night" Dark Theme
 *
 * Design philosophy: The light mode is warm green/teal/lime — a pharmacy
 * surrounded by nature. Dark mode should feel like the same pharmacy at night:
 * deep forest teal backgrounds, warm muted text, lime and plum accents that
 * glow softly. Never cold black, never "gamer" neon.
 */
export const DARK_COLORS = {
  // ─────────────────────────
  // Brand
  // ─────────────────────────

  midTeal: '#6DB8BA',    // brighter teal for dark surfaces — still readable
  midTealBright: '#8AD0D2',
  midTealDark: '#1E3A3B',
  midTealLight: '#1A3132',    // subtle teal tint for highlights
  midTealGlass: 'rgba(109, 184, 186, 0.10)',

  softLime: '#B5D47E',    // lime stays natural — not neon
  limeBright: '#CCDF9E',
  limeWhisper: '#162A1E',    // forest floor green
  limeGlass: 'rgba(181, 212, 126, 0.08)',

  deepPlum: '#B589C0',    // plum lifts to be readable
  plumBright: '#CDA4D7',
  plumDark: '#1E1A26',    // very deep plum surface
  plumLight: '#2A2235',    // slightly lighter plum surface
  plumGlass: 'rgba(181, 137, 192, 0.08)',

  peacockBlue: '#7AB5BD',

  // ─────────────────────────
  // Rich accents for hero cards
  // ─────────────────────────

  heroPeach: '#132A22',  // deep botanical green for hero cards
  heroPeachDark: '#1D3D2E',  // slightly brighter for borders
  heroOrange: '#6DB8BA',  // teal accent on hero cards
  darkEspresso: '#1A2625',

  // ─────────────────────────
  // Backgrounds — deep teal-green, not black
  // ─────────────────────────

  bgWarm: '#0D1B1C',  // deep forest teal base
  surfaceWhite: '#132626',  // cards have visible green warmth
  surface: '#132626',
  surfaceElevated: '#1A3132',  // lifted surfaces slightly brighter
  surfaceSubtle: '#0B1718',  // deepest layer
  surfaceGlass: 'rgba(19, 38, 38, 0.90)',

  // ─────────────────────────
  // Borders — teal-tinted, not dead gray
  // ─────────────────────────

  borderSoft: '#1E3A3B',    // matches deepTeal — borders have identity
  borderSubtle: '#162C2D',
  border: '#1E3A3B',

  // ─────────────────────────
  // Typography — warm off-white with green cast
  // ─────────────────────────

  textDark: '#DDE8E6',    // warm off-white
  textPrimary: '#DDE8E6',
  text: '#DDE8E6',
  textSecondary: '#A3BDB9',    // muted teal-green text
  textMuted: '#6B8A88',    // subtle teal undertone
  textDisabled: '#3D5857',
  textInverse: '#0D1B1C',

  // ─────────────────────────
  // Status — desaturated, gentle on dark backgrounds
  // ─────────────────────────

  primary: '#6DB8BA',
  success: '#6BCB9F',
  successLight: '#132E22',

  warning: '#E0B56D',
  warningLight: '#2A2518',

  error: '#D98995',
  errorLight: '#2E1C20',

  // ─────────────────────────
  // Convenience aliases
  // ─────────────────────────

  white: '#132626',    // "white" in dark mode = card surface
  deepTeal: '#1E3A3B',
  deepIndigo: '#6DB8BA',    // alias → midTeal
  heroPeachText: '#DDE8E6',

  // ─────────────────────────
  // Category surfaces — teal-green tinted
  // ─────────────────────────

  catVitamins: '#2A2518',  // warm amber-green
  catFirstAid: '#2E1C20',  // soft rose-dark
  catSupplements: '#132E22',  // forest green
  catSkincare: '#1E1A26',  // soft plum-dark
};
