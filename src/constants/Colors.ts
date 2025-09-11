/**
 * Design system colors with semantic tokens for consistent theming across light and dark modes.
 * Based on Material Design 3 color system principles.
 */

export const Colors = {
  light: {
    // Text colors
    text: '#11181C',
    textSecondary: '#687076',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    textOnSurface: '#11181C',

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    surfaceContainer: '#F8FAFC',
    surfaceContainerHighest: '#E2E8F0',

    // Primary colors
    primary: '#0a7ea4',
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0c4a6e',

    // Secondary colors
    secondary: '#64748B',
    secondaryContainer: '#F1F5F9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1E293B',

    // Accent colors
    accent: '#8B5CF6',
    accentContainer: '#F3F4F6',
    onAccent: '#FFFFFF',
    onAccentContainer: '#5B21B6',

    // Border colors
    border: '#E2E8F0',
    borderVariant: '#CBD5E1',
    outline: '#94A3B8',
    outlineVariant: '#E2E8F0',

    // State colors
    error: '#DC2626',
    errorContainer: '#FEF2F2',
    onError: '#FFFFFF',
    onErrorContainer: '#991B1B',
    
    warning: '#F59E0B',
    warningContainer: '#FFFBEB',
    onWarning: '#FFFFFF',
    onWarningContainer: '#92400E',
    
    success: '#059669',
    successContainer: '#F0FDF4',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#064E3B',

    // Interactive states
    hover: '#F8FAFC',
    pressed: '#F1F5F9',
    disabled: '#F3F4F6',
    disabledText: '#9CA3AF',

    // Legacy support (will be deprecated)
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
    danger: '#DC2626',
  },
  dark: {
    // Text colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    textInverse: '#11181C',
    textOnPrimary: '#11181C',
    textOnSurface: '#F8FAFC',

    // Background colors
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    surfaceContainer: '#334155',
    surfaceContainerHighest: '#475569',

    // Primary colors
    primary: '#38BDF8',
    primaryContainer: '#1E40AF',
    onPrimary: '#0F172A',
    onPrimaryContainer: '#DBEAFE',

    // Secondary colors
    secondary: '#94A3B8',
    secondaryContainer: '#475569',
    onSecondary: '#0F172A',
    onSecondaryContainer: '#F1F5F9',

    // Accent colors
    accent: '#A78BFA',
    accentContainer: '#6D28D9',
    onAccent: '#0F172A',
    onAccentContainer: '#F3F4F6',

    // Border colors
    border: '#475569',
    borderVariant: '#64748B',
    outline: '#64748B',
    outlineVariant: '#475569',

    // State colors
    error: '#F87171',
    errorContainer: '#7F1D1D',
    onError: '#0F172A',
    onErrorContainer: '#FEF2F2',
    
    warning: '#FBBF24',
    warningContainer: '#92400E',
    onWarning: '#0F172A',
    onWarningContainer: '#FFFBEB',
    
    success: '#34D399',
    successContainer: '#065F46',
    onSuccess: '#0F172A',
    onSuccessContainer: '#F0FDF4',

    // Interactive states
    hover: '#334155',
    pressed: '#475569',
    disabled: '#374151',
    disabledText: '#6B7280',

    // Legacy support (will be deprecated)
    tint: '#38BDF8',
    icon: '#CBD5E1',
    tabIconDefault: '#CBD5E1',
    tabIconSelected: '#38BDF8',
    danger: '#F87171',
  },
};

// Font family mapping for Nunito variants
export const FontFamily = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extraBold: 'Nunito-ExtraBold',
  light: 'Nunito-Light',
  extraLight: 'Nunito-ExtraLight',
} as const;

// Typography scale with Nunito font families
export const Typography = {
  // Headings
  displayLarge: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const, fontFamily: FontFamily.regular },
  displayMedium: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const, fontFamily: FontFamily.regular },
  displaySmall: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const, fontFamily: FontFamily.regular },
  
  headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  headlineMedium: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  
  titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, fontFamily: FontFamily.bold },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },
  titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, fontFamily: FontFamily.semiBold },

  // Body text
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const, fontFamily: FontFamily.regular },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: FontFamily.regular },
  bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily: FontFamily.regular },

  // Labels
  labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const, fontFamily: FontFamily.medium },
  labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, fontFamily: FontFamily.medium },
  labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const, fontFamily: FontFamily.medium },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border radius scale
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;
