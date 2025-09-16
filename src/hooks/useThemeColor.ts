/**
 * Modern theming hooks for consistent design system usage
 */

import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * Hook that returns the complete theme object with all colors and design tokens
 * This eliminates the need for multiple useThemeColor calls
 */
export function useTheme() {
  const colorScheme = useColorScheme() ?? 'light';

  return {
    colors: Colors[colorScheme],
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    isDark: colorScheme === 'dark',
  };
}

/**
 * Hook that returns commonly used theme colors as a group
 * Useful when you need just a subset of colors
 */
export function useThemeColors() {
  const colorScheme = useColorScheme() ?? 'light';
  return Colors[colorScheme];
}

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Creates a themed stylesheet that automatically applies theme colors
 * Usage: const styles = useThemedStyles(theme => ({ ... }))
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  stylesFn: (theme: ReturnType<typeof useTheme>) => T
) {
  return () => {
    const theme = useTheme();
    return StyleSheet.create(stylesFn(theme));
  };
}

/**
 * Hook to create themed styles
 * This is a wrapper around createThemedStyles for direct use in components
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  stylesFn: (theme: ReturnType<typeof useTheme>) => T
) {
  const theme = useTheme();
  return StyleSheet.create(stylesFn(theme));
}
