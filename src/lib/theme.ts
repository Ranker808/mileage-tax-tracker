// Design system for Mileage & Tax Tracker. A warm, high-contrast "modern
// ledger" look — closer to Mercury/Ramp than a generic admin-panel blue —
// because this app's whole pitch is trustworthy numbers, not another SaaS
// dashboard template.
import { Platform } from 'react-native';

export const colors = {
  background: '#FAF8F5',
  backgroundAlt: '#F3EFE9',
  card: '#FFFFFF',
  border: '#E8E2D9',
  borderStrong: '#D9D0C3',

  ink: '#1C1917',
  text: '#1C1917',
  textMuted: '#78716C',
  textFaint: '#A8A29E',

  primary: '#0D6E5F',
  primaryDark: '#0A5548',
  primaryMuted: '#DFF3EE',
  primaryTint: '#F0FAF7',

  success: '#15803D',
  successMuted: '#E3F5E9',
  danger: '#C0392B',
  dangerMuted: '#FBEAE8',
  warning: '#B45309',
  warningMuted: '#FEF3E2',

  white: '#FFFFFF',
};

// A small rotating set of venture accent colors so ventures read as
// distinct "brands" within the app rather than everything being the same
// primary blue. Assigned deterministically by name so a given venture
// always gets the same color.
export const ventureAccents = [
  { fg: '#0D6E5F', bg: '#DFF3EE' }, // teal (primary)
  { fg: '#9A3412', bg: '#FDE9DD' }, // burnt orange
  { fg: '#6D28D9', bg: '#EDE4FB' }, // violet
  { fg: '#B45309', bg: '#FEF3E2' }, // amber
  { fg: '#0E7490', bg: '#DFF4F7' }, // cyan
  { fg: '#BE185D', bg: '#FBE4EE' }, // rose
];

export function ventureAccent(name: string): { fg: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return ventureAccents[hash % ventureAccents.length];
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const type = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.ink },
  title: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.3, color: colors.ink },
  headline: { fontSize: 17, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 12.5, fontWeight: '600' as const, color: colors.textMuted, letterSpacing: 0.3 },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  numeral: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.ink },
};

export const shadow = Platform.select({
  web: {
    boxShadow: '0 1px 2px rgba(28,25,23,0.04), 0 8px 24px rgba(28,25,23,0.06)',
  },
  default: {
    shadowColor: '#1C1917',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
}) as object;

export const shadowSm = Platform.select({
  web: {
    boxShadow: '0 1px 3px rgba(28,25,23,0.06)',
  },
  default: {
    shadowColor: '#1C1917',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
}) as object;
