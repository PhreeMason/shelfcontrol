import {
  abbreviateNumber,
  formatNumber,
  formatStatus,
  formatBookFormat,
} from '../formatters';

describe('formatters', () => {
  describe('abbreviateNumber', () => {
    it('should not abbreviate numbers under 1000', () => {
      expect(abbreviateNumber(0)).toBe('0');
      expect(abbreviateNumber(1)).toBe('1');
      expect(abbreviateNumber(50)).toBe('50');
      expect(abbreviateNumber(500)).toBe('500');
      expect(abbreviateNumber(999)).toBe('999');
    });

    it('should abbreviate exact thousands without decimals', () => {
      expect(abbreviateNumber(1000)).toBe('1k');
      expect(abbreviateNumber(2000)).toBe('2k');
      expect(abbreviateNumber(10000)).toBe('10k');
      expect(abbreviateNumber(100000)).toBe('100k');
    });

    it('should abbreviate thousands with decimals', () => {
      expect(abbreviateNumber(1500)).toBe('1.5k');
      expect(abbreviateNumber(1234)).toBe('1.2k');
      expect(abbreviateNumber(7234)).toBe('7.2k');
      expect(abbreviateNumber(15678)).toBe('15.7k');
    });

    it('should abbreviate exact millions without decimals', () => {
      expect(abbreviateNumber(1000000)).toBe('1M');
      expect(abbreviateNumber(2000000)).toBe('2M');
      expect(abbreviateNumber(10000000)).toBe('10M');
    });

    it('should abbreviate millions with decimals', () => {
      expect(abbreviateNumber(1500000)).toBe('1.5M');
      expect(abbreviateNumber(1234567)).toBe('1.2M');
      expect(abbreviateNumber(7234567)).toBe('7.2M');
    });

    it('should respect custom decimal places', () => {
      expect(abbreviateNumber(1234, 0)).toBe('1k');
      expect(abbreviateNumber(1234, 2)).toBe('1.23k');
      expect(abbreviateNumber(1234567, 0)).toBe('1M');
      expect(abbreviateNumber(1234567, 2)).toBe('1.23M');
    });

    it('should handle edge cases', () => {
      // Just at threshold
      expect(abbreviateNumber(1000)).toBe('1k');
      expect(abbreviateNumber(999)).toBe('999');

      // Just below million
      expect(abbreviateNumber(999999)).toBe('1000.0k');

      // Large numbers
      expect(abbreviateNumber(999999999)).toBe('1000.0M');
    });
  });

  describe('formatNumber', () => {
    it('should abbreviate by default', () => {
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(2000)).toBe('2k');
    });

    it('should not abbreviate when abbreviate is false', () => {
      expect(formatNumber(1500, { abbreviate: false })).toBe('1500');
      expect(formatNumber(2000, { abbreviate: false })).toBe('2000');
    });

    it('should add unit suffix when provided', () => {
      expect(formatNumber(1500, { unit: 'pages' })).toBe('1.5k pages');
      expect(formatNumber(500, { unit: 'pages' })).toBe('500 pages');
      expect(formatNumber(1500, { abbreviate: false, unit: 'pages' })).toBe(
        '1500 pages'
      );
    });

    it('should respect custom decimal places', () => {
      expect(formatNumber(1234, { decimals: 0 })).toBe('1k');
      expect(formatNumber(1234, { decimals: 2 })).toBe('1.23k');
      expect(formatNumber(1234, { decimals: 2, unit: 'pages' })).toBe(
        '1.23k pages'
      );
    });

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(0, { unit: 'pages' })).toBe('0 pages');
    });

    it('should work with all combinations of options', () => {
      expect(
        formatNumber(7500, {
          abbreviate: true,
          unit: 'pages',
          decimals: 1,
        })
      ).toBe('7.5k pages');

      expect(
        formatNumber(7500, {
          abbreviate: false,
          unit: 'pages',
        })
      ).toBe('7500 pages');

      expect(
        formatNumber(7500, {
          abbreviate: true,
          decimals: 0,
        })
      ).toBe('8k');
    });
  });

  describe('formatStatus', () => {
    it('should format snake_case status to Title Case', () => {
      expect(formatStatus('to_read')).toBe('To Read');
      expect(formatStatus('in_progress')).toBe('In Progress');
      expect(formatStatus('completed')).toBe('Completed');
    });
  });

  describe('formatBookFormat', () => {
    it('should format book formats correctly', () => {
      expect(formatBookFormat('physical')).toBe('Physical');
      expect(formatBookFormat('eBook')).toBe('eBook');
      expect(formatBookFormat('audio')).toBe('Audio');
    });

    it('should capitalize unknown formats', () => {
      expect(formatBookFormat('unknown')).toBe('Unknown');
    });
  });
});
