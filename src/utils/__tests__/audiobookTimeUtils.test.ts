import {
  convertMinutesToHoursAndMinutes,
  convertHoursAndMinutesToTotalMinutes,
} from '../audiobookTimeUtils';
import {
  parseAudiobookTime,
  formatAudiobookTime,
} from '../../components/progress/AudiobookProgressInput';

describe('audiobookTimeUtils', () => {
  describe('convertMinutesToHoursAndMinutes', () => {
    it('should convert minutes to hours and minutes correctly', () => {
      expect(convertMinutesToHoursAndMinutes(150)).toEqual({
        hours: 2,
        minutes: 30,
      });
      expect(convertMinutesToHoursAndMinutes(90)).toEqual({
        hours: 1,
        minutes: 30,
      });
      expect(convertMinutesToHoursAndMinutes(120)).toEqual({
        hours: 2,
        minutes: 0,
      });
    });

    it('should handle zero minutes', () => {
      expect(convertMinutesToHoursAndMinutes(0)).toEqual({
        hours: 0,
        minutes: 0,
      });
    });

    it('should handle minutes less than 60', () => {
      expect(convertMinutesToHoursAndMinutes(45)).toEqual({
        hours: 0,
        minutes: 45,
      });
      expect(convertMinutesToHoursAndMinutes(30)).toEqual({
        hours: 0,
        minutes: 30,
      });
      expect(convertMinutesToHoursAndMinutes(1)).toEqual({
        hours: 0,
        minutes: 1,
      });
    });

    it('should handle exactly 60 minutes', () => {
      expect(convertMinutesToHoursAndMinutes(60)).toEqual({
        hours: 1,
        minutes: 0,
      });
    });

    it('should handle large numbers of minutes', () => {
      expect(convertMinutesToHoursAndMinutes(1440)).toEqual({
        hours: 24,
        minutes: 0,
      }); // 24 hours
      expect(convertMinutesToHoursAndMinutes(3661)).toEqual({
        hours: 61,
        minutes: 1,
      }); // 61 hours 1 minute
    });

    it('should throw error for negative minutes', () => {
      expect(() => convertMinutesToHoursAndMinutes(-1)).toThrow(
        'Total minutes cannot be negative'
      );
      expect(() => convertMinutesToHoursAndMinutes(-60)).toThrow(
        'Total minutes cannot be negative'
      );
    });

    it('should handle decimal minutes by using modulo operation', () => {
      expect(convertMinutesToHoursAndMinutes(150.7)).toEqual({
        hours: 2,
        minutes: 30.69999999999999,
      });
      expect(convertMinutesToHoursAndMinutes(89.9)).toEqual({
        hours: 1,
        minutes: 29.900000000000006,
      });
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
      expect(() => convertHoursAndMinutesToTotalMinutes(-1, 30)).toThrow(
        'Hours and minutes cannot be negative'
      );
      expect(() => convertHoursAndMinutesToTotalMinutes(-5, 0)).toThrow(
        'Hours and minutes cannot be negative'
      );
    });

    it('should throw error for negative minutes', () => {
      expect(() => convertHoursAndMinutesToTotalMinutes(2, -1)).toThrow(
        'Hours and minutes cannot be negative'
      );
      expect(() => convertHoursAndMinutesToTotalMinutes(0, -30)).toThrow(
        'Hours and minutes cannot be negative'
      );
    });

    it('should throw error for minutes 60 or greater', () => {
      expect(() => convertHoursAndMinutesToTotalMinutes(2, 60)).toThrow(
        'Minutes must be less than 60'
      );
      expect(() => convertHoursAndMinutesToTotalMinutes(1, 75)).toThrow(
        'Minutes must be less than 60'
      );
      expect(() => convertHoursAndMinutesToTotalMinutes(0, 120)).toThrow(
        'Minutes must be less than 60'
      );
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
        const { hours, minutes } =
          convertMinutesToHoursAndMinutes(totalMinutes);
        const convertedBack = convertHoursAndMinutesToTotalMinutes(
          hours,
          minutes
        );
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
        { hours: 100, minutes: 15 },
      ];

      testCases.forEach(({ hours, minutes }) => {
        const totalMinutes = convertHoursAndMinutesToTotalMinutes(
          hours,
          minutes
        );
        const convertedBack = convertMinutesToHoursAndMinutes(totalMinutes);
        expect(convertedBack).toEqual({ hours, minutes });
      });
    });
  });

  describe('parseAudiobookTime', () => {
    describe('colon format parsing', () => {
      it('should parse "3:02" format correctly', () => {
        expect(parseAudiobookTime('3:02')).toBe(182);
      });

      it('should parse "03:02" with leading zeros', () => {
        expect(parseAudiobookTime('03:02')).toBe(182);
      });

      it('should parse "03:02:45" ignoring seconds', () => {
        expect(parseAudiobookTime('03:02:45')).toBe(182);
      });

      it('should parse "0:05" correctly', () => {
        expect(parseAudiobookTime('0:05')).toBe(5);
      });

      it('should parse "12:00" correctly', () => {
        expect(parseAudiobookTime('12:00')).toBe(720);
      });

      it('should handle single digit minutes "1:5"', () => {
        expect(parseAudiobookTime('1:5')).toBe(65);
      });
    });

    describe('decimal hours format parsing', () => {
      it('should parse "2.5h" correctly', () => {
        expect(parseAudiobookTime('2.5h')).toBe(150);
      });

      it('should parse "2,5h" with comma correctly', () => {
        expect(parseAudiobookTime('2,5h')).toBe(150);
      });

      it('should parse "3.25h" correctly', () => {
        expect(parseAudiobookTime('3.25h')).toBe(195);
      });

      it('should parse "0.5h" correctly', () => {
        expect(parseAudiobookTime('0.5h')).toBe(30);
      });

      it('should parse "1.0h" correctly', () => {
        expect(parseAudiobookTime('1.0h')).toBe(60);
      });

      it('should handle "2.5hours" format', () => {
        expect(parseAudiobookTime('2.5hours')).toBe(150);
      });
    });

    describe('hours and minutes format parsing', () => {
      it('should parse "3h 2m" correctly', () => {
        expect(parseAudiobookTime('3h 2m')).toBe(182);
      });

      it('should parse "3H 2M" with capitals', () => {
        expect(parseAudiobookTime('3H 2M')).toBe(182);
      });

      it('should parse "3h2m" without spaces', () => {
        expect(parseAudiobookTime('3h2m')).toBe(182);
      });

      it('should parse "10h 45m" correctly', () => {
        expect(parseAudiobookTime('10h 45m')).toBe(645);
      });

      it('should parse "1h 0m" correctly', () => {
        expect(parseAudiobookTime('1h 0m')).toBe(60);
      });

      it('should parse "0h 30m" correctly', () => {
        expect(parseAudiobookTime('0h 30m')).toBe(30);
      });

      it('should parse "5h" without minutes', () => {
        expect(parseAudiobookTime('5h')).toBe(300);
      });

      it('should handle "3 hours 2 minutes" format', () => {
        expect(parseAudiobookTime('3 hours 2 minutes')).toBe(182);
      });

      it('should handle "3hrs 2mins" format', () => {
        expect(parseAudiobookTime('3hrs 2mins')).toBe(182);
      });
    });

    describe('minutes only format parsing', () => {
      it('should parse "45m" correctly', () => {
        expect(parseAudiobookTime('45m')).toBe(45);
      });

      it('should parse "45 minutes" correctly', () => {
        expect(parseAudiobookTime('45 minutes')).toBe(45);
      });

      it('should parse "45 mins" correctly', () => {
        expect(parseAudiobookTime('45 mins')).toBe(45);
      });

      it('should parse "120m" correctly', () => {
        expect(parseAudiobookTime('120m')).toBe(120);
      });
    });

    describe('plain number format parsing', () => {
      it('should parse "45" as minutes', () => {
        expect(parseAudiobookTime('45')).toBe(45);
      });

      it('should parse "0" correctly', () => {
        expect(parseAudiobookTime('0')).toBe(0);
      });

      it('should parse "180" correctly', () => {
        expect(parseAudiobookTime('180')).toBe(180);
      });
    });

    describe('edge cases and invalid input', () => {
      it('should return 0 for empty string', () => {
        expect(parseAudiobookTime('')).toBe(0);
      });

      it('should return 0 for whitespace only', () => {
        expect(parseAudiobookTime('   ')).toBe(0);
      });

      it('should return null for invalid text', () => {
        expect(parseAudiobookTime('invalid')).toBe(null);
      });

      it('should return null for mixed invalid format', () => {
        expect(parseAudiobookTime('3h invalid 2m')).toBe(null);
      });

      it('should return null for non-string input', () => {
        expect(parseAudiobookTime(null as any)).toBe(null);
        expect(parseAudiobookTime(undefined as any)).toBe(null);
        expect(parseAudiobookTime(123 as any)).toBe(null);
      });

      it('should handle extra whitespace', () => {
        expect(parseAudiobookTime('  3h 2m  ')).toBe(182);
        expect(parseAudiobookTime('3 h 2 m')).toBe(182);
      });
    });

    describe('boundary values', () => {
      it('should handle zero values correctly', () => {
        expect(parseAudiobookTime('0h 0m')).toBe(0);
        expect(parseAudiobookTime('0:00')).toBe(0);
        expect(parseAudiobookTime('0.0h')).toBe(0);
      });

      it('should handle large values correctly', () => {
        expect(parseAudiobookTime('24h 59m')).toBe(1499);
        expect(parseAudiobookTime('100:30')).toBe(6030);
      });
    });
  });

  describe('formatAudiobookTime', () => {
    describe('basic formatting', () => {
      it('should format 0 minutes as "0m"', () => {
        expect(formatAudiobookTime(0)).toBe('0m');
      });

      it('should format minutes only when less than 60', () => {
        expect(formatAudiobookTime(45)).toBe('45m');
        expect(formatAudiobookTime(1)).toBe('1m');
        expect(formatAudiobookTime(59)).toBe('59m');
      });

      it('should format hours only when minutes are 0', () => {
        expect(formatAudiobookTime(60)).toBe('1h');
        expect(formatAudiobookTime(120)).toBe('2h');
        expect(formatAudiobookTime(300)).toBe('5h');
      });

      it('should format hours and minutes when both present', () => {
        expect(formatAudiobookTime(90)).toBe('1h 30m');
        expect(formatAudiobookTime(182)).toBe('3h 2m');
        expect(formatAudiobookTime(125)).toBe('2h 5m');
      });
    });

    describe('edge cases', () => {
      it('should handle negative values', () => {
        expect(formatAudiobookTime(-5)).toBe('0m');
        expect(formatAudiobookTime(-60)).toBe('0m');
      });

      it('should handle null/undefined as 0', () => {
        expect(formatAudiobookTime(null as any)).toBe('0m');
        expect(formatAudiobookTime(undefined as any)).toBe('0m');
      });

      it('should handle decimal values correctly', () => {
        expect(formatAudiobookTime(Math.floor(90.7))).toBe('1h 30m');
        expect(formatAudiobookTime(Math.floor(125.9))).toBe('2h 5m');
      });
    });

    describe('large values', () => {
      it('should format large hour values correctly', () => {
        expect(formatAudiobookTime(1440)).toBe('24h');
        expect(formatAudiobookTime(1500)).toBe('25h');
        expect(formatAudiobookTime(6030)).toBe('100h 30m');
      });
    });
  });
});
