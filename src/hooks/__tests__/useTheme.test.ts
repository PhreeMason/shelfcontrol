import { useTheme, useThemeColors } from '../useTheme';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

describe('useTheme hooks', () => {
  describe('useTheme', () => {
    describe('Return Structure', () => {
      it('should return complete theme object with all required properties', () => {
        const theme = useTheme();

        expect(theme).toHaveProperty('colors');
        expect(theme).toHaveProperty('typography');
        expect(theme).toHaveProperty('spacing');
        expect(theme).toHaveProperty('borderRadius');
        expect(theme).toHaveProperty('isDark');
      });

      it('should return correct theme structure types', () => {
        const theme = useTheme();

        expect(typeof theme.colors).toBe('object');
        expect(typeof theme.typography).toBe('object');
        expect(typeof theme.spacing).toBe('object');
        expect(typeof theme.borderRadius).toBe('object');
        expect(typeof theme.isDark).toBe('boolean');
      });

      it('should have non-null theme properties', () => {
        const theme = useTheme();

        expect(theme.colors).not.toBeNull();
        expect(theme.typography).not.toBeNull();
        expect(theme.spacing).not.toBeNull();
        expect(theme.borderRadius).not.toBeNull();
        expect(theme.isDark).not.toBeNull();
      });
    });

    describe('Light Mode Behavior', () => {
      it('should return light colors by default', () => {
        const theme = useTheme();

        expect(theme.colors).toEqual(Colors.light);
      });

      it('should set isDark to false for light mode', () => {
        const theme = useTheme();

        expect(theme.isDark).toBe(false);
      });
    });

    describe('Constants Integration', () => {
      it('should return Typography constant', () => {
        const theme = useTheme();

        expect(theme.typography).toEqual(Typography);
      });

      it('should return Spacing constant', () => {
        const theme = useTheme();

        expect(theme.spacing).toEqual(Spacing);
      });

      it('should return BorderRadius constant', () => {
        const theme = useTheme();

        expect(theme.borderRadius).toEqual(BorderRadius);
      });
    });

    describe('Color System Validation', () => {
      it('should include essential text colors', () => {
        const theme = useTheme();

        expect(theme.colors).toHaveProperty('text');
        expect(theme.colors).toHaveProperty('textSecondary');
        expect(theme.colors).toHaveProperty('textMuted');
        expect(theme.colors).toHaveProperty('textInverse');
      });

      it('should include essential background colors', () => {
        const theme = useTheme();

        expect(theme.colors).toHaveProperty('background');
        expect(theme.colors).toHaveProperty('backgroundSecondary');
        expect(theme.colors).toHaveProperty('surface');
        expect(theme.colors).toHaveProperty('surfaceVariant');
      });

      it('should include primary color system', () => {
        const theme = useTheme();

        expect(theme.colors).toHaveProperty('primary');
        expect(theme.colors).toHaveProperty('primaryContainer');
        expect(theme.colors).toHaveProperty('onPrimary');
        expect(theme.colors).toHaveProperty('onPrimaryContainer');
      });

      it('should include semantic state colors', () => {
        const theme = useTheme();

        expect(theme.colors).toHaveProperty('error');
        expect(theme.colors).toHaveProperty('warning');
        expect(theme.colors).toHaveProperty('success');
        expect(theme.colors).toHaveProperty('info');
      });

      it('should include border and outline colors', () => {
        const theme = useTheme();

        expect(theme.colors).toHaveProperty('border');
        expect(theme.colors).toHaveProperty('borderVariant');
        expect(theme.colors).toHaveProperty('outline');
        expect(theme.colors).toHaveProperty('outlineVariant');
      });
    });

    describe('Typography System Validation', () => {
      it('should include display typography scales', () => {
        const theme = useTheme();

        expect(theme.typography).toHaveProperty('displayLarge');
        expect(theme.typography).toHaveProperty('displayMedium');
        expect(theme.typography).toHaveProperty('displaySmall');
      });

      it('should include headline typography scales', () => {
        const theme = useTheme();

        expect(theme.typography).toHaveProperty('headlineLarge');
        expect(theme.typography).toHaveProperty('headlineMedium');
        expect(theme.typography).toHaveProperty('headlineSmall');
      });

      it('should include body typography scales', () => {
        const theme = useTheme();

        expect(theme.typography).toHaveProperty('bodyLarge');
        expect(theme.typography).toHaveProperty('bodyMedium');
        expect(theme.typography).toHaveProperty('bodySmall');
      });

      it('should include typography properties with correct structure', () => {
        const theme = useTheme();
        const bodyLarge = theme.typography.bodyLarge;

        expect(bodyLarge).toHaveProperty('fontSize');
        expect(bodyLarge).toHaveProperty('lineHeight');
        expect(bodyLarge).toHaveProperty('fontWeight');
        expect(bodyLarge).toHaveProperty('fontFamily');
      });
    });

    describe('Spacing System Validation', () => {
      it('should include all spacing scales', () => {
        const theme = useTheme();

        expect(theme.spacing).toHaveProperty('xs');
        expect(theme.spacing).toHaveProperty('sm');
        expect(theme.spacing).toHaveProperty('md');
        expect(theme.spacing).toHaveProperty('lg');
        expect(theme.spacing).toHaveProperty('xl');
        expect(theme.spacing).toHaveProperty('xxl');
        expect(theme.spacing).toHaveProperty('xxxl');
      });

      it('should have numeric spacing values', () => {
        const theme = useTheme();

        expect(typeof theme.spacing.xs).toBe('number');
        expect(typeof theme.spacing.sm).toBe('number');
        expect(typeof theme.spacing.md).toBe('number');
        expect(typeof theme.spacing.lg).toBe('number');
      });
    });

    describe('Border Radius System Validation', () => {
      it('should include all border radius scales', () => {
        const theme = useTheme();

        expect(theme.borderRadius).toHaveProperty('none');
        expect(theme.borderRadius).toHaveProperty('sm');
        expect(theme.borderRadius).toHaveProperty('md');
        expect(theme.borderRadius).toHaveProperty('lg');
        expect(theme.borderRadius).toHaveProperty('xl');
        expect(theme.borderRadius).toHaveProperty('xxl');
        expect(theme.borderRadius).toHaveProperty('full');
      });

      it('should have numeric border radius values', () => {
        const theme = useTheme();

        expect(typeof theme.borderRadius.none).toBe('number');
        expect(typeof theme.borderRadius.sm).toBe('number');
        expect(typeof theme.borderRadius.md).toBe('number');
        expect(typeof theme.borderRadius.full).toBe('number');
      });
    });
  });

  describe('useThemeColors', () => {
    describe('Return Structure', () => {
      it('should return color object', () => {
        const colors = useThemeColors();

        expect(typeof colors).toBe('object');
        expect(colors).not.toBeNull();
      });

      it('should return light colors by default', () => {
        const colors = useThemeColors();

        expect(colors).toEqual(Colors.light);
      });
    });

    describe('Color Properties', () => {
      it('should include all essential color categories', () => {
        const colors = useThemeColors();

        expect(colors).toHaveProperty('text');
        expect(colors).toHaveProperty('background');
        expect(colors).toHaveProperty('primary');
        expect(colors).toHaveProperty('secondary');
        expect(colors).toHaveProperty('error');
        expect(colors).toHaveProperty('border');
      });

      it('should have string color values', () => {
        const colors = useThemeColors();

        expect(typeof colors.text).toBe('string');
        expect(typeof colors.background).toBe('string');
        expect(typeof colors.primary).toBe('string');
        expect(typeof colors.error).toBe('string');
      });

      it('should have valid hex color format for main colors', () => {
        const colors = useThemeColors();
        const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;

        expect(colors.text).toMatch(hexColorPattern);
        expect(colors.background).toMatch(hexColorPattern);
        expect(colors.primary).toMatch(hexColorPattern);
        expect(colors.error).toMatch(hexColorPattern);
      });
    });
  });

  describe('Integration Between Hooks', () => {
    it('should return consistent colors between useTheme and useThemeColors', () => {
      const theme = useTheme();
      const colors = useThemeColors();

      expect(theme.colors).toEqual(colors);
    });

    it('should maintain reference equality for color objects', () => {
      const theme = useTheme();
      const colors = useThemeColors();

      expect(theme.colors).toBe(colors);
    });

    it('should return same color values across multiple calls', () => {
      const theme1 = useTheme();
      const theme2 = useTheme();
      const colors1 = useThemeColors();
      const colors2 = useThemeColors();

      expect(theme1.colors).toEqual(theme2.colors);
      expect(colors1).toEqual(colors2);
      expect(theme1.colors).toEqual(colors1);
    });
  });

  describe('Consistency and Immutability', () => {
    it('should return consistent theme object across calls', () => {
      const theme1 = useTheme();
      const theme2 = useTheme();

      expect(theme1).toEqual(theme2);
      expect(theme1.isDark).toBe(theme2.isDark);
    });

    it('should not modify constants when returning them', () => {
      const originalColors = { ...Colors.light };
      const theme = useTheme();

      expect(Colors.light).toEqual(originalColors);
      expect(theme.colors).toEqual(originalColors);
    });

    it('should maintain theme structure integrity', () => {
      const theme = useTheme();

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

  describe('Edge Cases', () => {
    it('should handle multiple rapid successive calls', () => {
      const themes = Array.from({ length: 10 }, () => useTheme());
      const firstTheme = themes[0];

      themes.forEach((theme) => {
        expect(theme).toEqual(firstTheme);
      });
    });

    it('should handle destructuring of returned objects', () => {
      const { colors, typography, spacing, borderRadius, isDark } = useTheme();

      expect(colors).toEqual(Colors.light);
      expect(typography).toEqual(Typography);
      expect(spacing).toEqual(Spacing);
      expect(borderRadius).toEqual(BorderRadius);
      expect(isDark).toBe(false);
    });

    it('should maintain type safety for returned properties', () => {
      const theme = useTheme();

      expect(theme.colors.text).toBeDefined();
      expect(theme.typography.bodyLarge.fontSize).toBeDefined();
      expect(theme.spacing.md).toBeDefined();
      expect(theme.borderRadius.md).toBeDefined();
    });
  });
});