import { renderHook } from '@testing-library/react-native';
import { useTheme, useThemeColors, createThemedStyles, useThemedStyles } from '../useThemeColor';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: jest.fn(),
}));

const mockUseColorScheme = require('@/hooks/useColorScheme').useColorScheme as jest.Mock;

describe('useThemeColor hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('light');
  });

  describe('useTheme', () => {
    describe('Return Structure', () => {
      it('should return complete theme object with all required properties', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current).toHaveProperty('colors');
        expect(result.current).toHaveProperty('typography');
        expect(result.current).toHaveProperty('spacing');
        expect(result.current).toHaveProperty('borderRadius');
        expect(result.current).toHaveProperty('isDark');
      });

      it('should return correct theme structure types', () => {
        const { result } = renderHook(() => useTheme());
        const theme = result.current;

        expect(typeof theme.colors).toBe('object');
        expect(typeof theme.typography).toBe('object');
        expect(typeof theme.spacing).toBe('object');
        expect(typeof theme.borderRadius).toBe('object');
        expect(typeof theme.isDark).toBe('boolean');
      });

      it('should have non-null theme properties', () => {
        const { result } = renderHook(() => useTheme());
        const theme = result.current;

        expect(theme.colors).not.toBeNull();
        expect(theme.typography).not.toBeNull();
        expect(theme.spacing).not.toBeNull();
        expect(theme.borderRadius).not.toBeNull();
        expect(theme.isDark).not.toBeNull();
      });

      it('should maintain theme structure integrity', () => {
        const { result } = renderHook(() => useTheme());
        const theme = result.current;

        expect(Object.keys(theme)).toHaveLength(5);
        expect(Object.keys(theme).sort()).toEqual([
          'borderRadius',
          'colors',
          'isDark',
          'spacing',
          'typography',
        ]);
      });
    });

    describe('Light Mode Behavior', () => {
      it('should return light colors when colorScheme is light', () => {
        mockUseColorScheme.mockReturnValue('light');
        const { result } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.light);
      });

      it('should set isDark to false for light mode', () => {
        mockUseColorScheme.mockReturnValue('light');
        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(false);
      });

      it('should return light colors by default when colorScheme is null', () => {
        mockUseColorScheme.mockReturnValue(null);
        const { result } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.light);
        expect(result.current.isDark).toBe(false);
      });

      it('should return light colors by default when colorScheme is undefined', () => {
        mockUseColorScheme.mockReturnValue(undefined);
        const { result } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.light);
        expect(result.current.isDark).toBe(false);
      });
    });

    describe('Dark Mode Behavior', () => {
      it('should return dark colors when colorScheme is dark', () => {
        mockUseColorScheme.mockReturnValue('dark');
        const { result } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.dark);
      });

      it('should set isDark to true for dark mode', () => {
        mockUseColorScheme.mockReturnValue('dark');
        const { result } = renderHook(() => useTheme());

        expect(result.current.isDark).toBe(true);
      });
    });

    describe('Constants Integration', () => {
      it('should return Typography constant', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.typography).toEqual(Typography);
      });

      it('should return Spacing constant', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.spacing).toEqual(Spacing);
      });

      it('should return BorderRadius constant', () => {
        const { result } = renderHook(() => useTheme());

        expect(result.current.borderRadius).toEqual(BorderRadius);
      });

      it('should maintain reference equality for constants', () => {
        const { result } = renderHook(() => useTheme());
        const theme = result.current;

        expect(theme.typography).toBe(Typography);
        expect(theme.spacing).toBe(Spacing);
        expect(theme.borderRadius).toBe(BorderRadius);
      });
    });

    describe('Color System Validation', () => {
      it('should include essential text colors', () => {
        const { result } = renderHook(() => useTheme());
        const colors = result.current.colors;

        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('textSecondary');
        expect(colors).toHaveProperty('textMuted');
        expect(colors).toHaveProperty('textInverse');
      });

      it('should include essential background colors', () => {
        const { result } = renderHook(() => useTheme());
        const colors = result.current.colors;

        expect(colors).toHaveProperty('background');
        expect(colors).toHaveProperty('backgroundSecondary');
        expect(colors).toHaveProperty('surface');
        expect(colors).toHaveProperty('surfaceVariant');
      });

      it('should include primary color system', () => {
        const { result } = renderHook(() => useTheme());
        const colors = result.current.colors;

        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('primaryContainer');
        expect(colors).toHaveProperty('onPrimary');
        expect(colors).toHaveProperty('onPrimaryContainer');
      });

      it('should include semantic state colors', () => {
        const { result } = renderHook(() => useTheme());
        const colors = result.current.colors;

        expect(colors).toHaveProperty('error');
        expect(colors).toHaveProperty('warning');
        expect(colors).toHaveProperty('success');
        expect(colors).toHaveProperty('info');
      });

      it('should include border and outline colors', () => {
        const { result } = renderHook(() => useTheme());
        const colors = result.current.colors;

        expect(colors).toHaveProperty('border');
        expect(colors).toHaveProperty('borderVariant');
        expect(colors).toHaveProperty('outline');
        expect(colors).toHaveProperty('outlineVariant');
      });
    });

    describe('Mode Switching', () => {
      it('should switch from light to dark mode', () => {
        mockUseColorScheme.mockReturnValue('light');
        const { result, rerender } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.light);
        expect(result.current.isDark).toBe(false);

        mockUseColorScheme.mockReturnValue('dark');
        rerender({});

        expect(result.current.colors).toEqual(Colors.dark);
        expect(result.current.isDark).toBe(true);
      });

      it('should switch from dark to light mode', () => {
        mockUseColorScheme.mockReturnValue('dark');
        const { result, rerender } = renderHook(() => useTheme());

        expect(result.current.colors).toEqual(Colors.dark);
        expect(result.current.isDark).toBe(true);

        mockUseColorScheme.mockReturnValue('light');
        rerender({});

        expect(result.current.colors).toEqual(Colors.light);
        expect(result.current.isDark).toBe(false);
      });
    });
  });

  describe('useThemeColors', () => {
    describe('Return Structure', () => {
      it('should return color object', () => {
        const { result } = renderHook(() => useThemeColors());

        expect(typeof result.current).toBe('object');
        expect(result.current).not.toBeNull();
      });

      it('should return light colors by default', () => {
        mockUseColorScheme.mockReturnValue('light');
        const { result } = renderHook(() => useThemeColors());

        expect(result.current).toEqual(Colors.light);
      });

      it('should return dark colors when colorScheme is dark', () => {
        mockUseColorScheme.mockReturnValue('dark');
        const { result } = renderHook(() => useThemeColors());

        expect(result.current).toEqual(Colors.dark);
      });
    });

    describe('Color Properties', () => {
      it('should include all essential color categories', () => {
        const { result } = renderHook(() => useThemeColors());
        const colors = result.current;

        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('background');
        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('secondary');
        expect(colors).toHaveProperty('error');
        expect(colors).toHaveProperty('border');
      });

      it('should have string color values', () => {
        const { result } = renderHook(() => useThemeColors());
        const colors = result.current;

        expect(typeof colors.text).toBe('string');
        expect(typeof colors.background).toBe('string');
        expect(typeof colors.primary).toBe('string');
        expect(typeof colors.error).toBe('string');
      });

      it('should have valid hex color format for main colors', () => {
        const { result } = renderHook(() => useThemeColors());
        const colors = result.current;
        const hexColorPattern = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

        expect(colors.text).toMatch(hexColorPattern);
        expect(colors.background).toMatch(hexColorPattern);
        expect(colors.primary).toMatch(hexColorPattern);
        expect(colors.error).toMatch(hexColorPattern);
      });
    });

    describe('Null ColorScheme Handling', () => {
      it('should return light colors when colorScheme is null', () => {
        mockUseColorScheme.mockReturnValue(null);
        const { result } = renderHook(() => useThemeColors());

        expect(result.current).toEqual(Colors.light);
      });

      it('should return light colors when colorScheme is undefined', () => {
        mockUseColorScheme.mockReturnValue(undefined);
        const { result } = renderHook(() => useThemeColors());

        expect(result.current).toEqual(Colors.light);
      });
    });

    describe('Mode Switching', () => {
      it('should switch colors when colorScheme changes', () => {
        mockUseColorScheme.mockReturnValue('light');
        const { result, rerender } = renderHook(() => useThemeColors());

        expect(result.current).toEqual(Colors.light);

        mockUseColorScheme.mockReturnValue('dark');
        rerender({});

        expect(result.current).toEqual(Colors.dark);
      });
    });
  });

  describe('createThemedStyles', () => {
    describe('Function Creation', () => {
      it('should return a function', () => {
        const stylesFn = jest.fn(() => ({ container: { flex: 1 } }));
        const themedStylesHook = createThemedStyles(stylesFn);

        expect(typeof themedStylesHook).toBe('function');
      });

      it('should create a hook that returns StyleSheet', () => {
        const stylesFn = () => ({ container: { flex: 1 } });
        const themedStylesHook = createThemedStyles(stylesFn);

        const styles = themedStylesHook();

        expect(styles).toBeDefined();
        expect(styles.container).toBeDefined();
      });
    });

    describe('Theme Integration', () => {
      it('should pass correct theme object to styles function', () => {
        const stylesFn = jest.fn(() => ({ container: { flex: 1 } }));
        const themedStylesHook = createThemedStyles(stylesFn);

        themedStylesHook();

        expect(stylesFn).toHaveBeenCalledWith(expect.objectContaining({
          colors: Colors.light,
          typography: Typography,
          spacing: Spacing,
          borderRadius: BorderRadius,
          isDark: false,
        }));
      });

      it('should pass dark theme when colorScheme is dark', () => {
        mockUseColorScheme.mockReturnValue('dark');
        const stylesFn = jest.fn(() => ({ container: { flex: 1 } }));
        const themedStylesHook = createThemedStyles(stylesFn);

        themedStylesHook();

        expect(stylesFn).toHaveBeenCalledWith(expect.objectContaining({
          colors: Colors.dark,
          isDark: true,
        }));
      });

      it('should call styles function on each invocation', () => {
        const stylesFn = jest.fn(() => ({ container: { flex: 1 } }));
        const themedStylesHook = createThemedStyles(stylesFn);

        themedStylesHook();
        themedStylesHook();

        expect(stylesFn).toHaveBeenCalledTimes(2);
      });
    });

    describe('StyleSheet Creation', () => {
      it('should create valid StyleSheet object', () => {
        const stylesFn = () => ({
          container: { flex: 1, backgroundColor: '#fff' },
          text: { fontSize: 16, color: '#000' },
        });
        const themedStylesHook = createThemedStyles(stylesFn);

        const styles = themedStylesHook();

        expect(styles.container).toBeDefined();
        expect(styles.text).toBeDefined();
        expect(typeof styles.container).toBe('object');
        expect(typeof styles.text).toBe('object');
      });

      it('should handle empty styles object', () => {
        const stylesFn = () => ({});
        const themedStylesHook = createThemedStyles(stylesFn);

        const styles = themedStylesHook();

        expect(styles).toEqual({});
      });
    });

    describe('Dynamic Theme Updates', () => {
      it('should call styles function with updated theme on mode change', () => {
        const stylesFn = jest.fn((theme: any) => ({
          container: { backgroundColor: theme.colors.background },
        }));
        const themedStylesHook = createThemedStyles(stylesFn);

        mockUseColorScheme.mockReturnValue('light');
        themedStylesHook();

        mockUseColorScheme.mockReturnValue('dark');
        themedStylesHook();

        expect(stylesFn).toHaveBeenCalledTimes(2);
        expect(stylesFn).toHaveBeenNthCalledWith(1, expect.objectContaining({
          colors: Colors.light,
          isDark: false,
        }));
        expect(stylesFn).toHaveBeenNthCalledWith(2, expect.objectContaining({
          colors: Colors.dark,
          isDark: true,
        }));
      });
    });
  });

  describe('useThemedStyles', () => {
    describe('Hook Behavior', () => {
      it('should return styled object', () => {
        const stylesFn = () => ({
          container: { flex: 1 },
          text: { fontSize: 16 },
        });

        const { result } = renderHook(() => useThemedStyles(stylesFn));

        expect(result.current).toBeDefined();
        expect(result.current.container).toBeDefined();
        expect(result.current.text).toBeDefined();
      });

      it('should integrate with useTheme hook', () => {
        const stylesFn = jest.fn(() => ({ container: { flex: 1 } }));

        renderHook(() => useThemedStyles(stylesFn));

        expect(stylesFn).toHaveBeenCalledWith(expect.objectContaining({
          colors: Colors.light,
          typography: Typography,
          spacing: Spacing,
          borderRadius: BorderRadius,
          isDark: false,
        }));
      });

      it('should create StyleSheet on each render', () => {
        const stylesFn = () => ({ container: { flex: 1 } });

        const { result } = renderHook(() => useThemedStyles(stylesFn));

        expect(result.current).toBeDefined();
        expect(typeof result.current.container).toBe('object');
      });
    });

    describe('Theme Integration', () => {
      it('should use current theme in styles', () => {
        const stylesFn = jest.fn((theme: any) => ({
          container: { backgroundColor: theme.colors.background },
        }));

        mockUseColorScheme.mockReturnValue('light');
        renderHook(() => useThemedStyles(stylesFn));

        expect(stylesFn).toHaveBeenCalledWith(expect.objectContaining({
          colors: Colors.light,
          isDark: false,
        }));
      });

      it('should update styles when theme changes', () => {
        const stylesFn = jest.fn((theme: any) => ({
          container: { backgroundColor: theme.colors.background },
        }));

        mockUseColorScheme.mockReturnValue('light');
        const { result, rerender } = renderHook(() => useThemedStyles(stylesFn));

        const lightResult = result.current;

        mockUseColorScheme.mockReturnValue('dark');
        rerender({});

        const darkResult = result.current;

        expect(stylesFn).toHaveBeenCalledTimes(2);
        expect(lightResult).not.toBe(darkResult);
      });
    });

    describe('Complex Styles', () => {
      it('should handle complex style objects with theme integration', () => {
        const stylesFn = (theme: any) => ({
          container: {
            flex: 1,
            backgroundColor: theme.colors.background,
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
          },
          title: {
            ...theme.typography.titleLarge,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          },
          button: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.borderRadius.md,
          },
        });

        const { result } = renderHook(() => useThemedStyles(stylesFn));

        expect(result.current.container).toBeDefined();
        expect(result.current.title).toBeDefined();
        expect(result.current.button).toBeDefined();
        expect(result.current.container.flex).toBe(1);
        expect(result.current.title.marginBottom).toBe(Spacing.sm);
        expect(result.current.button.borderRadius).toBe(BorderRadius.md);
      });
    });
  });

  describe('Integration Between Hooks', () => {
    it('should return consistent colors between useTheme and useThemeColors', () => {
      const { result: themeResult } = renderHook(() => useTheme());
      const { result: colorsResult } = renderHook(() => useThemeColors());

      expect(themeResult.current.colors).toEqual(colorsResult.current);
    });

    it('should maintain consistency across all hooks with same colorScheme', () => {
      mockUseColorScheme.mockReturnValue('dark');

      const { result: themeResult } = renderHook(() => useTheme());
      const { result: colorsResult } = renderHook(() => useThemeColors());

      expect(themeResult.current.colors).toEqual(Colors.dark);
      expect(colorsResult.current).toEqual(Colors.dark);
      expect(themeResult.current.isDark).toBe(true);
    });

    it('should work together in styled components', () => {
      const stylesFn = (theme: any) => ({
        container: { backgroundColor: theme.colors.background },
      });
      const { result: stylesResult } = renderHook(() => useThemedStyles(stylesFn));

      expect(stylesResult.current.container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid successive calls', () => {
      const { result: results } = renderHook(() =>
        Array.from({ length: 10 }, () => useTheme())
      );

      const themes = results.current;
      const firstTheme = themes[0];

      themes.forEach((theme) => {
        expect(theme).toEqual(firstTheme);
      });
    });

    it('should handle destructuring of returned objects', () => {
      const { result } = renderHook(() => {
        const { colors, typography, spacing, borderRadius, isDark } = useTheme();
        return { colors, typography, spacing, borderRadius, isDark };
      });

      expect(result.current.colors).toEqual(Colors.light);
      expect(result.current.typography).toEqual(Typography);
      expect(result.current.spacing).toEqual(Spacing);
      expect(result.current.borderRadius).toEqual(BorderRadius);
      expect(result.current.isDark).toBe(false);
    });

    it('should maintain type safety for returned properties', () => {
      const { result } = renderHook(() => useTheme());
      const theme = result.current;

      expect(theme.colors.text).toBeDefined();
      expect(theme.typography.bodyLarge.fontSize).toBeDefined();
      expect(theme.spacing.md).toBeDefined();
      expect(theme.borderRadius.md).toBeDefined();
    });

    it('should handle unusual colorScheme values by using the value as key', () => {
      mockUseColorScheme.mockReturnValue('invalid' as any);
      const { result } = renderHook(() => useTheme());

      expect(result.current.colors).toBeUndefined();
      expect(result.current.isDark).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should not recreate objects unnecessarily', () => {
      const { result, rerender } = renderHook(() => useTheme());

      const firstResult = result.current;
      rerender({});
      const secondResult = result.current;

      expect(firstResult.typography).toBe(secondResult.typography);
      expect(firstResult.spacing).toBe(secondResult.spacing);
      expect(firstResult.borderRadius).toBe(secondResult.borderRadius);
    });

    it('should handle rapid theme switching', () => {
      const { result, rerender } = renderHook(() => useTheme());

      for (let i = 0; i < 5; i++) {
        mockUseColorScheme.mockReturnValue(i % 2 === 0 ? 'light' : 'dark');
        rerender({});
      }

      expect(result.current).toBeDefined();
      expect(result.current.colors).toBeDefined();
    });
  });
});