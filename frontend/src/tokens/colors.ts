/**
 * MediPick Canonical Brand Design System Tokens
 * Shared across Customer UI (Mobile/Expo) and Pharmacy UI (Web Dashboard)
 */
export const BrandColors = {
  primary: {
    teal: '#1D6F72',
    tealDark: '#144F51',
    tealLight: '#EAF4F4',
    tealGlass: 'rgba(29, 111, 114, 0.08)',
    tealHover: '#175c5e',
  },
  accent: {
    lime: '#C7E36B',
    limeSoft: '#EDF4DE',
    limeGlass: 'rgba(199, 227, 107, 0.25)',
    limeDark: '#9bb840',
  },
  secondary: {
    plum: '#6B4473',
    plumDark: '#4D3052',
    plumLight: '#F5EFF6',
    plumGlass: 'rgba(107, 68, 115, 0.08)',
  },
  status: {
    success: '#10B981',
    successBg: '#ECFDF5',
    warning: '#F59E0B',
    warningBg: '#FFFBEB',
    danger: '#EF4444',
    dangerBg: '#FEF2F2',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
    neutral: '#6B7280',
    neutralBg: '#F3F4F6',
  },
  dark: {
    background: '#0B1313',
    surface: '#111D1E',
    surfaceSubtle: '#182728',
    border: '#1F3335',
    borderStrong: '#2A4548',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
  },
  light: {
    background: '#FAFBFB',
    surface: '#FFFFFF',
    surfaceSubtle: '#F4F7F7',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
  }
} as const;
