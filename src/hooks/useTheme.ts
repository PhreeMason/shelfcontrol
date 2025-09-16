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
