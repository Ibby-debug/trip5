/**
 * Trip5 app theme - colors pulled from the T5 logo.
 * Logo palette: neon violet glow, metallic silver, dark purple base.
 */
export const colors = {
  // From logo: vibrant neon purple glow
  primary: '#A855F7',
  primaryLight: '#F3E8FF',
  primaryDark: '#7C3AED',
  // From logo: metallic silver/white highlights
  white: '#FFFFFF',
  metallic: '#E2E8F0',
  // From logo: dark purple container (for accents, splash)
  logoDark: '#1A0A2E',
  // App surfaces - light lavender to complement logo
  background: '#FAF5FF',
  surface: '#FFFFFF',
  // From logo: deep purple for text
  text: '#1E1B4B',
  textSecondary: '#7C3AED',
  border: '#E9D5FF',
  disabled: '#DDD6FE',
  checkBg: '#A855F7',
  placeholder: '#94A3B8',
  error: '#DC2626',
  errorBg: '#FEE2E2',
};

// iOS design system
export const ios = {
  radius: { sm: 8, md: 10, lg: 12, xl: 14, xxl: 20 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  fontSize: { caption: 12, footnote: 13, subhead: 15, body: 17, callout: 16, title3: 20, title2: 22, title1: 28 },
  fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  minTouchTarget: 44,
};
