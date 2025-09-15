import {
  convertMinutesToHoursAndMinutes,
  convertHoursAndMinutesToTotalMinutes
} from '../audiobookTimeUtils';

describe('audiobookTimeUtils', () => {
  describe('convertMinutesToHoursAndMinutes', () => {
    it('should convert minutes to hours and minutes correctly', () => {
      expect(convertMinutesToHoursAndMinutes(150)).toEqual({ hours: 2, minutes: 30 });
      expect(convertMinutesToHoursAndMinutes(90)).toEqual({ hours: 1, minutes: 30 });
      expect(convertMinutesToHoursAndMinutes(120)).toEqual({ hours: 2, minutes: 0 });
    });

    it('should handle zero minutes', () => {
      expect(convertMinutesToHoursAndMinutes(0)).toEqual({ hours: 0, minutes: 0 });
    });

    it('should handle minutes less than 60', () => {
      expect(convertMinutesToHoursAndMinutes(45)).toEqual({ hours: 0, minutes: 45 });
      expect(convertMinutesToHoursAndMinutes(30)).toEqual({ hours: 0, minutes: 30 });
      expect(convertMinutesToHoursAndMinutes(1)).toEqual({ hours: 0, minutes: 1 });
    });

    it('should handle exactly 60 minutes', () => {
      expect(convertMinutesToHoursAndMinutes(60)).toEqual({ hours: 1, minutes: 0 });
    });

    it('should handle large numbers of minutes', () => {
      expect(convertMinutesToHoursAndMinutes(1440)).toEqual({ hours: 24, minutes: 0 }); // 24 hours
      expect(convertMinutesToHoursAndMinutes(3661)).toEqual({ hours: 61, minutes: 1 }); // 61 hours 1 minute
    });

    it('should throw error for negative minutes', () => {
      expect(() => convertMinutesToHoursAndMinutes(-1)).toThrow('Total minutes cannot be negative');
      expect(() => convertMinutesToHoursAndMinutes(-60)).toThrow('Total minutes cannot be negative');
    });

    it('should handle decimal minutes by using modulo operation', () => {
      expect(convertMinutesToHoursAndMinutes(150.7)).toEqual({ hours: 2, minutes: 30.69999999999999 });
      expect(convertMinutesToHoursAndMinutes(89.9)).toEqual({ hours: 1, minutes: 29.900000000000006 });
    });
  });

  describe('convertHoursAndMinutesToTotalMinutes', () => {
    it('should convert hours and minutes to total minutes correctly', () => {
      expect(convertHoursAndMinutesToTotalMinutes(2, 30)).toBe(150);
      expect(convertHoursAndMinutesToTotalMinutes(1, 45)).toBe(105);
      expect(convertHoursAndMinutesToTotalMinutes(3, 0)).toBe(180);
    });

    it('should handle zero hours and minutes', () => {
      expect(convertHoursAndMinutesToTotalMinutes(0, 0)).toBe(0);
    });

    it('should handle zero hours with some minutes', () => {
      expect(convertHoursAndMinutesToTotalMinutes(0, 30)).toBe(30);
      expect(convertHoursAndMinutesToTotalMinutes(0, 59)).toBe(59);
    });

    it('should handle some hours with zero minutes', () => {
      expect(convertHoursAndMinutesToTotalMinutes(5, 0)).toBe(300);
      expect(convertHoursAndMinutesToTotalMinutes(1, 0)).toBe(60);
    });

    it('should use default minutes value when not provided', () => {
      expect(convertHoursAndMinutesToTotalMinutes(2)).toBe(120);
      expect(convertHoursAndMinutesToTotalMinutes(5)).toBe(300);
    });

    it('should handle large numbers of hours', () => {
      expect(convertHoursAndMinutesToTotalMinutes(24, 0)).toBe(1440); // 24 hours
      expect(convertHoursAndMinutesToTotalMinutes(100, 30)).toBe(6030); // 100 hours 30 minutes
    });

    it('should throw error for negative hours', () => {
      expect(() => convertHoursAndMinutesToTotalMinutes(-1, 30)).toThrow('Hours and minutes cannot be negative');
      expect(() => convertHoursAndMinutesToTotalMinutes(-5, 0)).toThrow('Hours and minutes cannot be negative');
    });

    it('should throw error for negative minutes', () => {
      expect(() => convertHoursAndMinutesToTotalMinutes(2, -1)).toThrow('Hours and minutes cannot be negative');
      expect(() => convertHoursAndMinutesToTotalMinutes(0, -30)).toThrow('Hours and minutes cannot be negative');
    });

    it('should throw error for minutes 60 or greater', () => {
      expect(() => convertHoursAndMinutesToTotalMinutes(2, 60)).toThrow('Minutes must be less than 60');
      expect(() => convertHoursAndMinutesToTotalMinutes(1, 75)).toThrow('Minutes must be less than 60');
      expect(() => convertHoursAndMinutesToTotalMinutes(0, 120)).toThrow('Minutes must be less than 60');
    });

    it('should handle decimal inputs by using them as-is', () => {
      expect(convertHoursAndMinutesToTotalMinutes(1.5, 30)).toBe(120); // 1.5 * 60 + 30 = 90 + 30 = 120
      expect(convertHoursAndMinutesToTotalMinutes(2, 15.5)).toBe(135.5); // 2 * 60 + 15.5 = 120 + 15.5 = 135.5
    });

    it('should handle boundary case of 59 minutes', () => {
      expect(convertHoursAndMinutesToTotalMinutes(2, 59)).toBe(179);
      expect(convertHoursAndMinutesToTotalMinutes(0, 59)).toBe(59);
    });
  });

  describe('round-trip conversions', () => {
    it('should convert back and forth accurately', () => {
      const testCases = [0, 30, 60, 90, 150, 1440, 3661];

      testCases.forEach(totalMinutes => {
        const { hours, minutes } = convertMinutesToHoursAndMinutes(totalMinutes);
        const convertedBack = convertHoursAndMinutesToTotalMinutes(hours, minutes);
        expect(convertedBack).toBe(totalMinutes);
      });
    });

    it('should handle round-trip with various hour/minute combinations', () => {
      const testCases = [
        { hours: 0, minutes: 0 },
        { hours: 1, minutes: 30 },
        { hours: 2, minutes: 45 },
        { hours: 5, minutes: 0 },
        { hours: 24, minutes: 59 },
        { hours: 100, minutes: 15 }
      ];

      testCases.forEach(({ hours, minutes }) => {
        const totalMinutes = convertHoursAndMinutesToTotalMinutes(hours, minutes);
        const convertedBack = convertMinutesToHoursAndMinutes(totalMinutes);
        expect(convertedBack).toEqual({ hours, minutes });
      });
    });
  });
});