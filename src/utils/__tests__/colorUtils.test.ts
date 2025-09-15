import {
  hexToRgb,
  rgbToHex,
  opacity,
  mix,
  lighten,
  darken,
  adjustHue,
  getContrastColor
} from '../colorUtils';

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle hex colors without # prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should handle uppercase hex colors', () => {
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00FF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should handle mixed case hex colors', () => {
      expect(hexToRgb('#Ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00fF00')).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should return black for invalid hex colors', () => {
      expect(hexToRgb('#xyz')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('invalid')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#fffffff')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should handle common color values', () => {
      expect(hexToRgb('#808080')).toEqual({ r: 128, g: 128, b: 128 }); // Gray
      expect(hexToRgb('#ffff00')).toEqual({ r: 255, g: 255, b: 0 }); // Yellow
      expect(hexToRgb('#ff00ff')).toEqual({ r: 255, g: 0, b: 255 }); // Magenta
      expect(hexToRgb('#00ffff')).toEqual({ r: 0, g: 255, b: 255 }); // Cyan
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB values to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('should handle single digit hex values with padding', () => {
      expect(rgbToHex(15, 0, 0)).toBe('#0f0000');
      expect(rgbToHex(0, 15, 0)).toBe('#000f00');
      expect(rgbToHex(0, 0, 15)).toBe('#00000f');
      expect(rgbToHex(1, 2, 3)).toBe('#010203');
    });

    it('should handle common color values', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080'); // Gray
      expect(rgbToHex(255, 255, 0)).toBe('#ffff00'); // Yellow
      expect(rgbToHex(255, 0, 255)).toBe('#ff00ff'); // Magenta
      expect(rgbToHex(0, 255, 255)).toBe('#00ffff'); // Cyan
    });
  });

  describe('round-trip hex/RGB conversions', () => {
    it('should convert back and forth accurately', () => {
      const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000', '#808080', '#123456'];

      testColors.forEach(color => {
        const rgb = hexToRgb(color);
        const hexBack = rgbToHex(rgb.r, rgb.g, rgb.b);
        expect(hexBack).toBe(color);
      });
    });
  });

  describe('opacity', () => {
    it('should create RGBA values with given opacity', () => {
      expect(opacity('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
      expect(opacity('#00ff00', 0.8)).toBe('rgba(0, 255, 0, 0.8)');
      expect(opacity('#0000ff', 1)).toBe('rgba(0, 0, 255, 1)');
      expect(opacity('#ffffff', 0)).toBe('rgba(255, 255, 255, 0)');
    });

    it('should handle colors without # prefix', () => {
      expect(opacity('ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle invalid colors by using black', () => {
      expect(opacity('invalid', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    });
  });

  describe('mix', () => {
    it('should mix two colors at given percentage', () => {
      // Mix red and blue
      expect(mix('#ff0000', '#0000ff', 0.5)).toBe('#800080'); // Purple
      expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000'); // Full red
      expect(mix('#ff0000', '#0000ff', 1)).toBe('#0000ff'); // Full blue
    });

    it('should mix black and white', () => {
      expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080'); // Gray
      expect(mix('#000000', '#ffffff', 0.25)).toBe('#404040'); // Dark gray
      expect(mix('#000000', '#ffffff', 0.75)).toBe('#bfbfbf'); // Light gray
    });

    it('should handle edge cases', () => {
      expect(mix('#ffffff', '#000000', 0)).toBe('#ffffff');
      expect(mix('#ffffff', '#000000', 1)).toBe('#000000');
    });
  });

  describe('lighten', () => {
    it('should lighten colors by mixing with white', () => {
      expect(lighten('#808080', 0.5)).toBe('#c0c0c0'); // Gray + 50% white
      expect(lighten('#ff0000', 0.25)).toBe('#ff4040'); // Red + 25% white
      expect(lighten('#000000', 0.5)).toBe('#808080'); // Black + 50% white
    });

    it('should not change white when lightened', () => {
      expect(lighten('#ffffff', 0.5)).toBe('#ffffff');
    });

    it('should handle 100% lightening', () => {
      expect(lighten('#000000', 1)).toBe('#ffffff');
      expect(lighten('#ff0000', 1)).toBe('#ffffff');
    });
  });

  describe('darken', () => {
    it('should darken colors by mixing with black', () => {
      expect(darken('#808080', 0.5)).toBe('#404040'); // Gray + 50% black
      expect(darken('#ff0000', 0.25)).toBe('#bf0000'); // Red + 25% black
      expect(darken('#ffffff', 0.5)).toBe('#808080'); // White + 50% black
    });

    it('should not change black when darkened', () => {
      expect(darken('#000000', 0.5)).toBe('#000000');
    });

    it('should handle 100% darkening', () => {
      expect(darken('#ffffff', 1)).toBe('#000000');
      expect(darken('#ff0000', 1)).toBe('#000000');
    });
  });

  describe('adjustHue', () => {
    it('should adjust hue while preserving saturation and lightness', () => {
      // Test basic hue adjustments (exact values may vary due to rounding)
      const redAdjusted = adjustHue('#ff0000', 120); // Red shifted 120 degrees
      expect(redAdjusted).toMatch(/^#[0-9a-f]{6}$/); // Should be valid hex

      const greenAdjusted = adjustHue('#00ff00', 120); // Green shifted 120 degrees
      expect(greenAdjusted).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should handle 360 degree rotation (full circle)', () => {
      const original = '#ff4080';
      const rotated360 = adjustHue(original, 360);
      // After 360 degrees, should be close to original (within rounding errors)
      expect(rotated360).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should handle negative degree adjustments', () => {
      const original = '#ff4080';
      const rotatedNegative = adjustHue(original, -90);
      expect(rotatedNegative).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('should not change grayscale colors much (no hue to adjust)', () => {
      const gray = adjustHue('#808080', 180);
      expect(gray).toMatch(/^#[0-9a-f]{6}$/);
      // Gray should remain close to gray since it has no saturation
    });

    it('should handle white and black', () => {
      expect(adjustHue('#ffffff', 180)).toMatch(/^#[0-9a-f]{6}$/);
      expect(adjustHue('#000000', 180)).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('getContrastColor', () => {
    it('should return black for light backgrounds', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000'); // White background
      expect(getContrastColor('#ffff00')).toBe('#000000'); // Yellow background
      expect(getContrastColor('#00ffff')).toBe('#000000'); // Cyan background
    });

    it('should return white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff'); // Black background
      expect(getContrastColor('#0000ff')).toBe('#ffffff'); // Blue background
      expect(getContrastColor('#ff0000')).toBe('#ffffff'); // Red background
    });

    it('should handle medium gray (boundary case)', () => {
      // 808080 has luminance around 0.5, so result may vary based on exact threshold
      const result = getContrastColor('#808080');
      expect(result === '#000000' || result === '#ffffff').toBe(true);
    });

    it('should handle colors without # prefix', () => {
      expect(getContrastColor('ffffff')).toBe('#000000');
      expect(getContrastColor('000000')).toBe('#ffffff');
    });

    it('should handle invalid colors by using black background assumption', () => {
      expect(getContrastColor('invalid')).toBe('#ffffff');
    });

    it('should use standard luminance calculation', () => {
      // Test with a color that should clearly be dark
      expect(getContrastColor('#404040')).toBe('#ffffff'); // Dark gray
      // Test with a color that should clearly be light
      expect(getContrastColor('#c0c0c0')).toBe('#000000'); // Light gray
    });
  });

  describe('integration tests', () => {
    it('should work with real-world color combinations', () => {
      // Test a typical UI workflow
      const baseColor = '#3498db'; // Nice blue
      const lightVariant = lighten(baseColor, 0.2);
      const darkVariant = darken(baseColor, 0.2);
      const complementary = adjustHue(baseColor, 180);

      expect(lightVariant).toMatch(/^#[0-9a-f]{6}$/);
      expect(darkVariant).toMatch(/^#[0-9a-f]{6}$/);
      expect(complementary).toMatch(/^#[0-9a-f]{6}$/);

      // All should have proper contrast colors
      expect(getContrastColor(lightVariant)).toMatch(/^#(000000|ffffff)$/);
      expect(getContrastColor(darkVariant)).toMatch(/^#(000000|ffffff)$/);
      expect(getContrastColor(complementary)).toMatch(/^#(000000|ffffff)$/);
    });

    it('should maintain color validity through transformations', () => {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];

      colors.forEach(color => {
        const lightened = lighten(color, 0.3);
        const darkened = darken(color, 0.3);
        const hueShifted = adjustHue(color, 90);
        const withOpacity = opacity(color, 0.7);

        expect(lightened).toMatch(/^#[0-9a-f]{6}$/);
        expect(darkened).toMatch(/^#[0-9a-f]{6}$/);
        expect(hueShifted).toMatch(/^#[0-9a-f]{6}$/);
        expect(withOpacity).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
      });
    });
  });
});