/**
 * Centralized theme utilities for consistent component styling
 */

import type { TextStyle, ViewStyle } from 'react-native';
import {
  BorderRadius,
  Colors,
  FontFamily,
  Spacing,
  Typography,
} from './Colors';

// Component variant definitions
export const ComponentVariants = {
  button: {
    primary: {
      container: 'primary' as keyof typeof Colors.light,
      content: 'onPrimary' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    secondary: {
      container: 'secondaryContainer' as keyof typeof Colors.light,
      content: 'onSecondaryContainer' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    outline: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'primary' as keyof typeof Colors.light,
      border: 'outline' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    ghost: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'primary' as keyof typeof Colors.light,
      transparent: true,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    error: {
      container: 'error' as keyof typeof Colors.light,
      content: 'onError' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    success: {
      container: 'success' as keyof typeof Colors.light,
      content: 'onSuccess' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    accent: {
      container: 'accent' as keyof typeof Colors.light,
      content: 'onAccent' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
    dangerOutline: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'error' as keyof typeof Colors.light,
      border: 'error' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
      typography: 'labelLarge' as keyof typeof Typography,
    },
  },
  surface: {
    default: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
    },
    variant: {
      container: 'surfaceVariant' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
    },
    container: {
      container: 'surfaceContainer' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
      spacing: 'md' as keyof typeof Spacing,
      borderRadius: 'md' as keyof typeof BorderRadius,
    },
    elevated: {
      container: 'surfaceContainerHighest' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
      spacing: 'lg' as keyof typeof Spacing,
      borderRadius: 'lg' as keyof typeof BorderRadius,
    },
    card: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
      spacing: 'lg' as keyof typeof Spacing,
      borderRadius: 'lg' as keyof typeof BorderRadius,
    },
  },
  text: {
    default: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'bodyLarge' as keyof typeof Typography,
    },
    defaultSemiBold: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'titleMedium' as keyof typeof Typography,
    },
    secondary: {
      color: 'textSecondary' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
    muted: {
      color: 'textMuted' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
    title: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'titleMedium' as keyof typeof Typography,
    },
    headline: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'headlineLarge' as keyof typeof Typography,
    },
    label: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'labelMedium' as keyof typeof Typography,
    },
    error: {
      color: 'error' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
    warning: {
      color: 'warning' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
    success: {
      color: 'success' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
  },
} as const;

// Helper functions for creating themed styles
export const createThemedStyle = {
  text: (
    variant: keyof typeof ComponentVariants.text,
    _customColor?: keyof typeof Colors.light,
    customTypography?: keyof typeof Typography
  ): TextStyle => {
    const textVariant = ComponentVariants.text[variant];
    return {
      ...Typography[customTypography || textVariant.typography],
      // Color will be applied by the component using useThemeColor
    };
  },

  surface: (
    _variant: keyof typeof ComponentVariants.surface = 'default',
    padding?: keyof typeof Spacing,
    borderRadius?: keyof typeof BorderRadius
  ): ViewStyle => {
    return {
      ...(padding && { padding: Spacing[padding] }),
      ...(borderRadius && { borderRadius: BorderRadius[borderRadius] }),
    };
  },

  button: (
    variant: keyof typeof ComponentVariants.button,
    size: 'sm' | 'md' | 'lg' = 'md'
  ): ViewStyle => {
    const sizeMap = {
      sm: { padding: Spacing.sm, minHeight: 32 },
      md: { padding: Spacing.md, minHeight: 40 },
      lg: { padding: Spacing.lg, minHeight: 56 },
    };

    return {
      ...sizeMap[size],
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...(variant === 'outline' && { borderWidth: 1 }),
      ...(variant === 'dangerOutline' && { borderWidth: 1 }),
    };
  },
};

// Shadow system - 5 levels of elevation
export const Shadows = {
  // Standard shadow levels (black)
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  premium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  // Optional themed variants
  themed: {
    primary: {
      shadowColor: '#B8A9D9', // colors.primary
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    soft: {
      shadowColor: 'rgba(139, 90, 140, 0.12)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 8,
    },
  },
} as const;

// Common style mixins
export const StyleMixins = {
  get card() {
    return {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    };
  },

  get listItem() {
    return {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
    };
  },

  get input() {
    return {
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      ...Typography.bodyLarge,
    };
  },

  get shadow() {
    return Shadows.light;
  },

  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  column: {
    flexDirection: 'column' as const,
  },

  // Typography mixins
  typography: {
    heading: {
      ...Typography.headlineSmall,
    },
    title: {
      ...Typography.titleLarge,
    },
    body: {
      ...Typography.bodyLarge,
    },
    caption: {
      ...Typography.bodySmall,
    },
    label: {
      ...Typography.labelMedium,
    },
  },

  // Spacing presets
  get spacing() {
    return {
      tight: { padding: Spacing.sm, gap: Spacing.xs },
      normal: { padding: Spacing.md, gap: Spacing.sm },
      loose: { padding: Spacing.lg, gap: Spacing.md },
      extraLoose: { padding: Spacing.xl, gap: Spacing.lg },
    };
  },

  // Component presets
  get components() {
    return {
      primaryButton: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        minHeight: 44,
        ...Typography.labelLarge,
      },
      secondaryButton: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        minHeight: 44,
        borderWidth: 1,
        ...Typography.labelLarge,
      },
      textButton: {
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        ...Typography.labelLarge,
      },
      card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.light,
      },
      modal: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        margin: Spacing.lg,
      },
    };
  },
} as const;

// Type exports for better TypeScript support
export type ColorToken = keyof typeof Colors.light;
export type TypographyToken = keyof typeof Typography;
export type SpacingToken = keyof typeof Spacing;
export type BorderRadiusToken = keyof typeof BorderRadius;
export type FontFamilyToken = keyof typeof FontFamily;
export type ShadowToken = keyof typeof Shadows;
export type ButtonVariant = keyof typeof ComponentVariants.button;
export type SurfaceVariant = keyof typeof ComponentVariants.surface;
export type TextVariant = keyof typeof ComponentVariants.text;
