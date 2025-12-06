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
    cardEmptyState: '#F5F1EA',

    // Primary colors
    primary: '#B8A9D9',
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0c4a6e',
    backgroundPrimary: '#d8cbf3ff',

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
    backgroundAccent: '#f4c4c8ff',

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

    // Hero status colors (green/orange/gray from stats design)
    successGreen: '#86b468',
    warningOrange: '#f97316',
    errorRed: '#6b7280',

    peach: '#E8C2B9',
    darkPink: '#C8698A',
    orange: '#F5C2A1',
    darkPurple: '#815ac0',
    randoPurple: '#8B5A8C',

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
    toReview: '#B8A9D9',
    overdue: '#c8696e',
    urgent: '#c8696e',
    good: '#7a5a8c',
    approaching: '#d4a46a',
    impossible: '#c8696e',
    pending: '#9CA3AF',
    didNotFinish: '#9CA3AF',
    backupPurple: '#d8b4fe',
    backupPink: '#f9a8d4',
    reviewsPending: '#14B8A6', // Teal - daily reminders

    // Destructive action colors
    scaryRed: '#FF0000',
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
    cardEmptyState: '#F5F1EA',

    // Primary colors
    primary: '#B8A9D9',
    primaryContainer: '#E0F2FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0c4a6e',
    backgroundPrimary: '#d8cbf3ff',

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
    backgroundAccent: '#f4c4c8ff',

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

    // Hero status colors (green/orange/gray from stats design)
    successGreen: '#86b468',
    warningOrange: '#f97316',
    errorRed: '#6b7280',

    peach: '#E8C2B9',
    darkPink: '#C8698A',
    orange: '#F5C2A1',
    darkPurple: '#815ac0',
    randoPurple: '#8B5A8C',

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
    toReview: '#B8A9D9',
    overdue: '#c8696e',
    urgent: '#c8696e',
    good: '#7a5a8c',
    approaching: '#d4a46a',
    impossible: '#c8696e',
    pending: '#9CA3AF',
    didNotFinish: '#9CA3AF',
    backupPurple: '#d8b4fe',
    backupPink: '#f9a8d4',
    reviewsPending: '#14B8A6', // Teal - daily reminders

    // Destructive action colors
    scaryRed: '#FF0000',
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
// Token-based system with 11 sizes (10-32px) for consistent, constrained typography
export const Typography = {
  // Headlines - Large attention-grabbing text
  headlineLarge: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800' as const,
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

  // Titles - Section headers and prominent UI text
  titleLarge: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700' as const,
    fontFamily: FontFamily.bold,
  },
  titleSubLarge: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
  },
  titleMediumPlus: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600' as const,
    fontFamily: FontFamily.semiBold,
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

  // Body text - Main content text
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

  // Labels - UI labels, captions, and micro-text
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
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  xxl: 44,
  xxxl: 60,

  // Negative spacing for semantic use cases
  // Use these for intentional overlap, tight grouping, and alignment corrections
  negative: {
    xs: -4, // Inline alignment corrections, tight multi-line spacing
    sm: -8, // Error messages attached to fields, header-to-content grouping
    md: -14, // Annotation overlays (badges, indicators attached to inputs)
    lg: -22, // Full-bleed layouts (breaking out of container padding)
  },
} as const;

// Border radius scale
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

/**
 * Opacity values for StyleSheet opacity property
 * Use for muted text, disabled states, and subtle UI elements
 *
 * Note: For adding transparency to colors (e.g., backgroundColor),
 * use the hex OPACITY from '@/utils/formatters' instead.
 */
export const Opacity = {
  /** Full visibility */
  full: 1,
  /** Slightly reduced (pressed states) - 0.85 */
  high: 0.85,
  /** Muted text, secondary info - 0.7 */
  muted: 0.7,
  /** Secondary hints, helper text - 0.6 */
  secondary: 0.6,
  /** Disabled states - 0.5 */
  disabled: 0.5,
  /** Very faint elements - 0.4 */
  faint: 0.4,
  /** Subtle dividers, barely visible - 0.15 */
  hairline: 0.15,
} as const;
