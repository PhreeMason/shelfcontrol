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
    primary: '#B8A9D9',
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0c4a6e',

    // Secondary colors
    secondary: '#64748B',
    secondaryContainer: '#F1F5F9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1E293B',

    // Accent colors
    accent: '#E8B4B8',
    accentContainer: '#F3F4F6',
    onAccent: '#FFFFFF',
    onAccentContainer: '#5B21B6',

    // Border colors
    border: '#E2E8F0',
    borderVariant: '#CBD5E1',
    outline: '#94A3B8',
    outlineVariant: '#E2E8F0',

    // State colors
    error: '#E8B4B8',
    errorContainer: '#FEF2F2',
    onError: '#FFFFFF',
    onErrorContainer: '#991B1B',

    warning: '#E8B4A0',
    warningContainer: '#FFFBEB',
    onWarning: '#FFFFFF',
    onWarningContainer: '#92400E',

    success: '#B8A9D9',
    successContainer: '#F0FDF4',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#064E3B',

    // Additional gradient colors for toast messages
    peach: '#E8C2B9',
    darkPink: '#C8698A',
    orange: '#F5C2A1',

    // Info colors (using peach-orange theme)
    info: '#E8C2B9',
    infoContainer: '#FFF7ED',
    onInfo: '#FFFFFF',
    onInfoContainer: '#C2410C',

    // Interactive states
    hover: '#F8FAFC',
    pressed: '#F1F5F9',
    disabled: '#F3F4F6',
    disabledText: '#9CA3AF',

    // Legacy support (will be deprecated)
    tint: '#E8C2B9',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
    danger: '#e85d75',
    inputFocusBackground: '#FFFFFF',
    inputBlurBackground: '#e8c2b926',

    // Urgency levels
    complete: '#7251b5',
    set_aside: '#9CA3AF',
    overdue: '#c8696eff',
    urgent: '#c8696eff',
    good: '#7a5a8cff',
    approaching: '#d4a46aff',
    impossible: '#c8696eff',
  },
  dark: {
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
    primary: '#B8A9D9',
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0c4a6e',

    // Secondary colors
    secondary: '#64748B',
    secondaryContainer: '#F1F5F9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1E293B',

    // Accent colors
    accent: '#E8B4B8',
    accentContainer: '#F3F4F6',
    onAccent: '#FFFFFF',
    onAccentContainer: '#5B21B6',

    // Border colors
    border: '#E2E8F0',
    borderVariant: '#CBD5E1',
    outline: '#94A3B8',
    outlineVariant: '#E2E8F0',

    // State colors
    error: '#E8B4B8',
    errorContainer: '#FEF2F2',
    onError: '#FFFFFF',
    onErrorContainer: '#991B1B',

    warning: '#E8B4A0',
    warningContainer: '#FFFBEB',
    onWarning: '#FFFFFF',
    onWarningContainer: '#92400E',

    success: '#B8A9D9',
    successContainer: '#F0FDF4',
    onSuccess: '#FFFFFF',
    onSuccessContainer: '#064E3B',

    // Additional gradient colors for toast messages
    peach: '#E8C2B9',
    darkPink: '#C8698A',
    orange: '#F5C2A1',

    // Info colors (using peach-orange theme)
    info: '#E8C2B9',
    infoContainer: '#FFF7ED',
    onInfo: '#FFFFFF',
    onInfoContainer: '#C2410C',

    // Interactive states
    hover: '#F8FAFC',
    pressed: '#F1F5F9',
    disabled: '#F3F4F6',
    disabledText: '#9CA3AF',

    // Legacy support (will be deprecated)
    tint: '#E8C2B9',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
    danger: '#E8B4B8',
    inputFocusBackground: '#FFFFFF',
    inputBlurBackground: '#FAF8F599',

    // Urgency levels
    complete: '#7251b5',
    set_aside: '#9CA3AF',
    overdue: '#c8696eff',
    urgent: '#c8696eff',
    good: '#7a5a8cff',
    approaching: '#d4a46aff',
    impossible: '#c8696eff',
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
  displayLarge: {
    fontSize: 57,
    lineHeight: 60,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },
  displayMedium: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },

  headlineLarge: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },

  titleLarge: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700' as const,
    fontFamily: FontFamily.bold,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },

  // Body text
  bodyLarge: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: FontFamily.regular,
  },

  // Labels
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500' as const,
    fontFamily: FontFamily.medium,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: FontFamily.medium,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500' as const,
    fontFamily: FontFamily.medium,
  },
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  xxl: 44,
  xxxl: 60,
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
