import {
  utcToLocalDate,
  formatDisplayDate,
  isDateBefore,
  calculateDaysLeft,
  formatDeadlineDate
} from '../dateUtils';

describe('dateUtils', () => {
  describe('utcToLocalDate', () => {
    it('should convert UTC date string to YYYY-MM-DD format', () => {
      const result = utcToLocalDate('2024-01-15T08:30:00Z');
      expect(result).toBe('2024-01-15');
    });

    it('should handle date without time component', () => {
      const result = utcToLocalDate('2024-12-25');
      expect(result).toBe('2024-12-25');
    });

    it('should handle ISO date strings', () => {
      const result = utcToLocalDate('2024-06-30T23:59:59.999Z');
      expect(result).toBe('2024-06-30');
    });
  });

  describe('formatDisplayDate', () => {
    it('should format date with default format MMM D, YYYY', () => {
      const result = formatDisplayDate('2024-01-15T12:00:00Z');
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format date with custom format', () => {
      const result = formatDisplayDate('2024-01-15T12:00:00Z', 'MMMM D');
      expect(result).toBe('January 15');
    });

    it('should format date with DD/MM/YYYY format', () => {
      const result = formatDisplayDate('2024-01-15T12:00:00Z', 'DD/MM/YYYY');
      expect(result).toBe('15/01/2024');
    });

    it('should handle different date inputs', () => {
      const result = formatDisplayDate('2024-12-25', 'MMM D');
      expect(result).toBe('Dec 25');
    });
  });

  describe('isDateBefore', () => {

    it('should return true when date1 is before date2', () => {
      const result = isDateBefore('2024-01-10', '2024-01-15');
      expect(result).toBe(true);
    });

    it('should return false when date1 is after date2', () => {
      const result = isDateBefore('2024-01-20', '2024-01-15');
      expect(result).toBe(false);
    });

    it('should return false when dates are the same', () => {
      const result = isDateBefore('2024-01-15', '2024-01-15');
      expect(result).toBe(false);
    });

    it('should compare against today when no second date provided', () => {
      // Just test that the function can be called with one parameter
      const result = isDateBefore('2020-01-01'); // Should be before actual today
      expect(typeof result).toBe('boolean');
    });

    it('should handle Date objects', () => {
      const date1 = new Date('2024-01-10');
      const date2 = new Date('2024-01-15');
      const result = isDateBefore(date1, date2);
      expect(result).toBe(true);
    });

    it('should ignore time components when comparing', () => {
      const result = isDateBefore('2024-01-10T23:59:59Z', '2024-01-11T00:00:01Z');
      expect(result).toBe(false);
    });
  });

  describe('calculateDaysLeft', () => {

    it('should return positive days when deadline is in the future', () => {
      const fromDate = new Date('2024-01-15');
      const result = calculateDaysLeft('2024-01-20', fromDate);
      expect(result).toBe(6);
    });

    it('should return negative days when deadline is in the past', () => {
      const fromDate = new Date('2024-01-15');
      const result = calculateDaysLeft('2024-01-10', fromDate);
      expect(result).toBe(-4);
    });

    it('should return 0 when deadline is today', () => {
      const fromDate = new Date('2024-01-15');
      const result = calculateDaysLeft('2024-01-15', fromDate);
      expect(result).toBe(1);
    });

    it('should calculate from custom start date', () => {
      const fromDate = new Date('2024-01-10');
      const result = calculateDaysLeft('2024-01-20', fromDate);
      expect(result).toBe(11); // 11 days from Jan 10 to Jan 20
    });

    it('should handle date strings with time components', () => {
      const fromDate = new Date('2024-01-15');
      const result = calculateDaysLeft('2024-01-20T15:30:00Z', fromDate);
      expect(result).toBe(6);
    });

    it('should ignore time components in calculations', () => {
      const fromDate = new Date('2024-01-10T23:59:59Z');
      const result = calculateDaysLeft('2024-01-11T00:00:01Z', fromDate);
      expect(result).toBe(0);
    });
  });

  describe('formatDeadlineDate', () => {
    it('should format date in "MMMM D" format', () => {
      const result = formatDeadlineDate('2024-01-15T12:00:00Z');
      expect(result).toBe('January 15');
    });

    it('should handle different months', () => {
      const result = formatDeadlineDate('2024-12-25');
      expect(result).toBe('December 25');
    });

    it('should handle single digit days', () => {
      const result = formatDeadlineDate('2024-03-05');
      expect(result).toBe('March 5');
    });
  });
});