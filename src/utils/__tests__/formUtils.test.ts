import {
  transformProgressInputText,
  transformProgressValueToText,
  requiresAudiobookInput
} from '../formUtils';

describe('formUtils', () => {
  describe('transformProgressInputText', () => {
    it('should parse valid numeric string to integer', () => {
      expect(transformProgressInputText('123')).toBe(123);
      expect(transformProgressInputText('0')).toBe(0);
      expect(transformProgressInputText('999')).toBe(999);
    });

    it('should handle decimal strings by parsing as integer', () => {
      expect(transformProgressInputText('123.45')).toBe(123);
      expect(transformProgressInputText('99.99')).toBe(99);
    });

    it('should return 0 for empty string', () => {
      expect(transformProgressInputText('')).toBe(0);
    });

    it('should return 0 for non-numeric strings', () => {
      expect(transformProgressInputText('abc')).toBe(0);
      expect(transformProgressInputText('12abc')).toBe(12); // parseInt stops at first non-numeric
      expect(transformProgressInputText('abc123')).toBe(0); // NaN becomes 0
    });

    it('should handle leading/trailing whitespace', () => {
      expect(transformProgressInputText(' 123 ')).toBe(123);
      expect(transformProgressInputText('\t456\n')).toBe(456);
    });

    it('should handle negative numbers', () => {
      expect(transformProgressInputText('-50')).toBe(-50);
    });
  });

  describe('transformProgressValueToText', () => {
    it('should convert number to string', () => {
      expect(transformProgressValueToText(123)).toBe('123');
      expect(transformProgressValueToText(0)).toBe('0');
      expect(transformProgressValueToText(-50)).toBe('-50');
    });

    it('should return empty string for null', () => {
      expect(transformProgressValueToText(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(transformProgressValueToText(undefined)).toBe('');
    });

    it('should handle decimal numbers', () => {
      expect(transformProgressValueToText(123.45)).toBe('123.45');
      expect(transformProgressValueToText(0.5)).toBe('0.5');
    });
  });

  describe('requiresAudiobookInput', () => {
    it('should return true for audio format', () => {
      expect(requiresAudiobookInput('audio')).toBe(true);
    });

    it('should return false for physical format', () => {
      expect(requiresAudiobookInput('physical')).toBe(false);
    });

    it('should return false for eBook format', () => {
      expect(requiresAudiobookInput('eBook')).toBe(false);
    });
  });
});