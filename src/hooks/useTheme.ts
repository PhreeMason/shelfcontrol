import { BorderRadius, Colors, Spacing, Typography } from '@/constants/Colors';

/**
 * Hook that returns the complete theme object with all colors and design tokens
 * This eliminates the need for multiple useThemeColor calls
 */
export function useTheme() {
  const colorScheme = 'light';

  return {
    colors: Colors[colorScheme],
    typography: Typography,
    spacing: Spacing,
    borderRadius: BorderRadius,
    isDark: false,
  };
}

/**
 * Hook that returns commonly used theme colors as a group
 * Useful when you need just a subset of colors
 */
export function useThemeColors() {
  const colorScheme = 'light';
  return Colors[colorScheme];
}
