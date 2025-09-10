/**
 * Centralized theme utilities for consistent component styling
 */

import { Colors, Typography, Spacing, BorderRadius } from './Colors';
import type { TextStyle, ViewStyle } from 'react-native';

// Component variant definitions
export const ComponentVariants = {
  button: {
    primary: {
      container: 'primary' as keyof typeof Colors.light,
      content: 'onPrimary' as keyof typeof Colors.light,
    },
    secondary: {
      container: 'secondaryContainer' as keyof typeof Colors.light,
      content: 'onSecondaryContainer' as keyof typeof Colors.light,
    },
    outline: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'primary' as keyof typeof Colors.light,
      border: 'outline' as keyof typeof Colors.light,
    },
    ghost: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'primary' as keyof typeof Colors.light,
      transparent: true,
    },
    error: {
      container: 'error' as keyof typeof Colors.light,
      content: 'onError' as keyof typeof Colors.light,
    },
    success: {
      container: 'success' as keyof typeof Colors.light,
      content: 'onSuccess' as keyof typeof Colors.light,
    },
    accent: {
      container: 'accent' as keyof typeof Colors.light,
      content: 'onAccent' as keyof typeof Colors.light,
    },
    dangerOutline: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'error' as keyof typeof Colors.light,
      border: 'error' as keyof typeof Colors.light,
    },
  },
  surface: {
    default: {
      container: 'surface' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
    },
    variant: {
      container: 'surfaceVariant' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
    },
    container: {
      container: 'surfaceContainer' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
    },
    elevated: {
      container: 'surfaceContainerHighest' as keyof typeof Colors.light,
      content: 'textOnSurface' as keyof typeof Colors.light,
    },
  },
  text: {
    default: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'bodyLarge' as keyof typeof Typography,
    },
    secondary: {
      color: 'textSecondary' as keyof typeof Colors.light,
      typography: 'bodyLarge' as keyof typeof Typography,
    },
    muted: {
      color: 'textMuted' as keyof typeof Colors.light,
      typography: 'bodyMedium' as keyof typeof Typography,
    },
    title: {
      color: 'text' as keyof typeof Colors.light,
      typography: 'headlineSmall' as keyof typeof Typography,
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
      md: { padding: Spacing.md, minHeight: 44 },
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

// Common style mixins
export const StyleMixins = {
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  
  listItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  input: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },

  shadow: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
} as const;

// Type exports for better TypeScript support
export type ColorToken = keyof typeof Colors.light;
export type TypographyToken = keyof typeof Typography;
export type SpacingToken = keyof typeof Spacing;
export type BorderRadiusToken = keyof typeof BorderRadius;
export type ButtonVariant = keyof typeof ComponentVariants.button;
export type SurfaceVariant = keyof typeof ComponentVariants.surface;
export type TextVariant = keyof typeof ComponentVariants.text;