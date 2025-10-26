import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { Database } from '@/types/database.types';
import {
  calculateCutoffTime,
  calculateRequiredPace,
  processBookProgress,
} from '@/utils/paceCalculations';
import {
  calculateChartMaxValue,
  calculateDailyMinimum,
  calculateDaysLeft,
  calculateDynamicBarWidth,
  ChartDataItem,
  getCurrentProgressFromDeadline,
  getBookReadingDays,
  getChartTitle,
  getUnitLabel,
  ReadingDay,
  transformReadingDaysToChartData,
} from '../chartDataUtils';

// Mock the paceCalculations module
jest.mock('@/utils/paceCalculations', () => ({
  calculateCutoffTime: jest.fn(),
  calculateRequiredPace: jest.fn(),
  processBookProgress: jest.fn(),
}));

// Mock dayjs
jest.mock('@/lib/dayjs', () => ({
  dayjs: jest.fn((date?: string) => ({
    format: jest.fn((_formatStr: string) => {
      if (date === '2024-01-15') return '1/15';
      if (date === '2024-01-16') return '1/16';
      if (date === '2024-01-17') return '1/17';
      return '1/01';
    }),
  })),
}));

const mockCalculateCutoffTime = calculateCutoffTime as jest.Mock;
const mockCalculateRequiredPace = calculateRequiredPace as jest.Mock;
const mockProcessBookProgress = processBookProgress as jest.Mock;

describe('chartDataUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-20T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getUnitLabel', () => {
    it('should return "min" for audio format', () => {
      expect(getUnitLabel('audio')).toBe('min');
    });

    it('should return "pg" for physical format', () => {
      expect(getUnitLabel('physical')).toBe('pg');
    });

    it('should return "pg" for eBook format', () => {
      expect(getUnitLabel('eBook')).toBe('pg');
    });

    it('should return "pg" for unknown format', () => {
      expect(getUnitLabel('unknown')).toBe('pg');
    });

    it('should return "pg" for empty string', () => {
      expect(getUnitLabel('')).toBe('pg');
    });

    it('should return "pg" for mixed case audio', () => {
      expect(getUnitLabel('Audio')).toBe('pg');
      expect(getUnitLabel('AUDIO')).toBe('pg');
    });
  });

  describe('getChartTitle', () => {
    it('should return "Daily Listening Progress" for audio format', () => {
      expect(getChartTitle('audio')).toBe('Daily Listening Progress');
    });

    it('should return "Daily Reading Progress" for physical format', () => {
      expect(getChartTitle('physical')).toBe('Daily Reading Progress');
    });

    it('should return "Daily Reading Progress" for eBook format', () => {
      expect(getChartTitle('eBook')).toBe('Daily Reading Progress');
    });

    it('should return "Daily Reading Progress" for unknown format', () => {
      expect(getChartTitle('unknown')).toBe('Daily Reading Progress');
    });

    it('should return "Daily Reading Progress" for empty string', () => {
      expect(getChartTitle('')).toBe('Daily Reading Progress');
    });

    it('should return "Daily Reading Progress" for mixed case audio', () => {
      expect(getChartTitle('Audio')).toBe('Daily Reading Progress');
      expect(getChartTitle('AUDIO')).toBe('Daily Reading Progress');
    });
  });

  describe('getBookReadingDays', () => {
    const mockDeadline: ReadingDeadlineWithProgress = {
      id: 'test-id',
      deadline_date: '2024-01-30',
      format: 'physical',
      total_quantity: 300,
      progress: [
        {
          id: '1',
          deadline_id: 'test-id',
          current_progress: 50,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
        {
          id: '2',
          deadline_id: 'test-id',
          current_progress: 100,
          created_at: '2024-01-16T10:00:00Z',
          updated_at: '2024-01-16T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
      user_id: 'user-1',
      book_id: 'book-1',
      book_title: 'Test Book',
      author: 'Test Author',
      source: 'manual',
      acquisition_source: null,
      deadline_type: null,
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
    };

    it('should return empty array when progress is null', () => {
      const deadline = { ...mockDeadline, progress: null as any };
      const result = getBookReadingDays(deadline);
      expect(result).toEqual([]);
    });

    it('should return empty array when progress is undefined', () => {
      const deadline = { ...mockDeadline, progress: undefined as any };
      const result = getBookReadingDays(deadline);
      expect(result).toEqual([]);
    });

    it('should return empty array when progress is not an array', () => {
      const deadline = { ...mockDeadline, progress: 'invalid' as any };
      const result = getBookReadingDays(deadline);
      expect(result).toEqual([]);
    });

    it('should return empty array when cutoffTime is null', () => {
      mockCalculateCutoffTime.mockReturnValue(null);
      const result = getBookReadingDays(mockDeadline);
      expect(result).toEqual([]);
      expect(mockCalculateCutoffTime).toHaveBeenCalledWith([mockDeadline]);
    });

    it('should process progress data and return sorted reading days', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-15'] = 50.5;
          dailyProgress['2024-01-16'] = 25.75;
          dailyProgress['2024-01-17'] = 30.123;
        }
      );

      const result = getBookReadingDays(mockDeadline);

      expect(mockCalculateCutoffTime).toHaveBeenCalledWith([mockDeadline]);
      expect(mockProcessBookProgress).toHaveBeenCalledWith(
        mockDeadline,
        cutoffTime,
        expect.any(Object),
        'physical'
      );

      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 50.5, format: 'physical' },
        { date: '2024-01-16', progressRead: 25.75, format: 'physical' },
        { date: '2024-01-17', progressRead: 30.12, format: 'physical' },
      ]);
    });

    it('should handle audio format correctly', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-15'] = 120.0;
        }
      );

      const result = getBookReadingDays(audioDeadline);

      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 120, format: 'audio' },
      ]);
    });

    it('should handle eBook format correctly', () => {
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-15'] = 45.33;
        }
      );

      const result = getBookReadingDays(eBookDeadline);

      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 45.33, format: 'eBook' },
      ]);
    });

    it('should sort dates chronologically', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-17'] = 30;
          dailyProgress['2024-01-15'] = 50;
          dailyProgress['2024-01-16'] = 25;
        }
      );

      const result = getBookReadingDays(mockDeadline);

      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
      expect(result[2].date).toBe('2024-01-17');
    });

    it('should round progress to 2 decimal places', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-15'] = 50.123456789;
          dailyProgress['2024-01-16'] = 25.999999;
        }
      );

      const result = getBookReadingDays(mockDeadline);

      expect(result[0].progressRead).toBe(50.12);
      expect(result[1].progressRead).toBe(26.0);
    });
  });

  describe('transformReadingDaysToChartData', () => {
    const mockReadingDays: ReadingDay[] = [
      { date: '2024-01-15', progressRead: 50.5, format: 'physical' },
      { date: '2024-01-16', progressRead: 25.75, format: 'physical' },
      { date: '2024-01-17', progressRead: 30.123, format: 'physical' },
    ];

    const mockColors = {
      primary: '#007AFF',
      text: '#000000',
    };

    const mockTopLabelComponentFactory = jest.fn(
      (value: number) =>
        ({
          type: 'ThemedText',
          props: { children: value.toString() },
        }) as any
    );

    beforeEach(() => {
      mockTopLabelComponentFactory.mockClear();
    });

    it('should transform reading days to chart data format', () => {
      const result = transformReadingDaysToChartData(
        mockReadingDays,
        mockColors,
        mockTopLabelComponentFactory
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        value: 51, // Math.round(50.5)
        label: '1/15',
        frontColor: '#007AFF',
        spacing: 2,
        labelWidth: 40,
        labelTextStyle: {
          color: '#000000',
          fontSize: 9,
          fontWeight: 'normal',
        },
        topLabelComponent: expect.any(Function),
      });
    });

    it('should round progress values for chart data', () => {
      const result = transformReadingDaysToChartData(
        mockReadingDays,
        mockColors,
        mockTopLabelComponentFactory
      );

      expect(result[0].value).toBe(51); // Math.round(50.5)
      expect(result[1].value).toBe(26); // Math.round(25.75)
      expect(result[2].value).toBe(30); // Math.round(30.123)
    });

    it('should format dates correctly using dayjs', () => {
      const result = transformReadingDaysToChartData(
        mockReadingDays,
        mockColors,
        mockTopLabelComponentFactory
      );

      expect(result[0].label).toBe('1/15');
      expect(result[1].label).toBe('1/16');
      expect(result[2].label).toBe('1/17');
    });

    it('should call topLabelComponentFactory with rounded values', () => {
      const result = transformReadingDaysToChartData(
        mockReadingDays,
        mockColors,
        mockTopLabelComponentFactory
      );

      // Call the topLabelComponent functions to verify factory was called correctly
      result.forEach(item => item.topLabelComponent());

      expect(mockTopLabelComponentFactory).toHaveBeenCalledWith(51);
      expect(mockTopLabelComponentFactory).toHaveBeenCalledWith(26);
      expect(mockTopLabelComponentFactory).toHaveBeenCalledWith(30);
    });

    it('should handle empty array', () => {
      const result = transformReadingDaysToChartData(
        [],
        mockColors,
        mockTopLabelComponentFactory
      );

      expect(result).toEqual([]);
    });

    it('should handle single reading day', () => {
      const singleDay: ReadingDay[] = [
        { date: '2024-01-15', progressRead: 75.9, format: 'audio' },
      ];

      const result = transformReadingDaysToChartData(
        singleDay,
        mockColors,
        mockTopLabelComponentFactory
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(76);
      expect(result[0].label).toBe('1/15');
    });

    it('should use provided colors correctly', () => {
      const customColors = {
        primary: '#FF0000',
        text: '#FFFFFF',
      };

      const result = transformReadingDaysToChartData(
        mockReadingDays,
        customColors,
        mockTopLabelComponentFactory
      );

      result.forEach(item => {
        expect(item.frontColor).toBe('#FF0000');
        expect(item.labelTextStyle.color).toBe('#FFFFFF');
      });
    });
  });

  describe('calculateChartMaxValue', () => {
    const mockChartData: ChartDataItem[] = [
      {
        value: 50,
        label: '1/15',
        frontColor: '#007AFF',
        spacing: 2,
        labelWidth: 40,
        labelTextStyle: { color: '#000', fontSize: 9, fontWeight: 'normal' },
        topLabelComponent: () => ({}) as any,
      },
      {
        value: 75,
        label: '1/16',
        frontColor: '#007AFF',
        spacing: 2,
        labelWidth: 40,
        labelTextStyle: { color: '#000', fontSize: 9, fontWeight: 'normal' },
        topLabelComponent: () => ({}) as any,
      },
    ];

    it('should return 10 for empty chart data', () => {
      const result = calculateChartMaxValue([], 20);
      expect(result).toBe(10);
    });

    it('should calculate max value with 20% buffer', () => {
      const result = calculateChartMaxValue(mockChartData, 30);
      // Max bar value is 75, max with daily minimum is max(75, 30) = 75
      // 75 * 1.2 = 90, Math.ceil(90) = 90
      expect(result).toBe(90);
    });

    it('should use daily minimum when it exceeds max bar value', () => {
      const result = calculateChartMaxValue(mockChartData, 100);
      // Max bar value is 75, max with daily minimum is max(75, 100) = 100
      // 100 * 1.2 = 120, Math.ceil(120) = 120
      expect(result).toBe(120);
    });

    it('should handle decimal values correctly', () => {
      const chartDataWithDecimals: ChartDataItem[] = [
        {
          ...mockChartData[0],
          value: 33,
        },
      ];

      const result = calculateChartMaxValue(chartDataWithDecimals, 25.7);
      // Max bar value is 33, max with daily minimum is max(33, 25.7) = 33
      // 33 * 1.2 = 39.6, Math.ceil(39.6) = 40
      expect(result).toBe(40);
    });

    it('should handle zero values', () => {
      const zeroChartData: ChartDataItem[] = [
        {
          ...mockChartData[0],
          value: 0,
        },
      ];

      const result = calculateChartMaxValue(zeroChartData, 0);
      // Max bar value is 0, max with daily minimum is max(0, 0) = 0
      // 0 * 1.2 = 0, Math.ceil(0) = 0, but since result is 0, we should get a reasonable minimum
      expect(result).toBe(0);
    });

    it('should handle negative daily minimum', () => {
      const result = calculateChartMaxValue(mockChartData, -10);
      // Max bar value is 75, max with daily minimum is max(75, -10) = 75
      // 75 * 1.2 = 90, Math.ceil(90) = 90
      expect(result).toBe(90);
    });
  });

  describe('calculateDynamicBarWidth', () => {
    it('should return 30 for empty data', () => {
      expect(calculateDynamicBarWidth(0)).toBe(30);
    });

    it('should return minimum width of 20 for large datasets', () => {
      expect(calculateDynamicBarWidth(20)).toBe(20); // 320/20 = 16, but min is 20
      expect(calculateDynamicBarWidth(50)).toBe(20); // 320/50 = 6.4, but min is 20
    });

    it('should return maximum width of 30 for small datasets', () => {
      expect(calculateDynamicBarWidth(5)).toBe(30); // 320/5 = 64, but max is 30
      expect(calculateDynamicBarWidth(1)).toBe(30); // 320/1 = 320, but max is 30
    });

    it('should calculate proportional width for medium datasets', () => {
      expect(calculateDynamicBarWidth(16)).toBe(20); // 320/16 = 20
      expect(calculateDynamicBarWidth(12)).toBe(27); // 320/12 = 26.67, rounded to 27
      expect(calculateDynamicBarWidth(11)).toBe(29); // 320/11 = 29.09, rounded to 29
    });

    it('should handle edge cases around boundaries', () => {
      expect(calculateDynamicBarWidth(10)).toBe(30); // 320/10 = 32, but max is 30
      expect(calculateDynamicBarWidth(11)).toBe(29); // 320/11 = 29.09
    });
  });

  describe('getCurrentProgressFromDeadline', () => {
    it('should return 0 when progress array is empty', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test',
        progress: [],
        deadline_date: '2024-01-30',
        format: 'physical',
        total_quantity: 300,
        user_id: 'user-1',
        book_id: 'book-1',
        book_title: 'Test Book',
        author: 'Test Author',
        source: 'manual',
        acquisition_source: null,
        deadline_type: null,
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      expect(getCurrentProgressFromDeadline(deadline)).toBe(0);
    });

    it('should return 0 when progress is null', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test',
        progress: null as any,
        deadline_date: '2024-01-30',
        format: 'physical',
        total_quantity: 300,
        user_id: 'user-1',
        book_id: 'book-1',
        book_title: 'Test Book',
        author: 'Test Author',
        source: 'manual',
        acquisition_source: null,
        deadline_type: null,
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      expect(getCurrentProgressFromDeadline(deadline)).toBe(0);
    });

    it('should return 0 when progress is undefined', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test',
        progress: undefined as any,
        deadline_date: '2024-01-30',
        format: 'physical',
        total_quantity: 300,
        user_id: 'user-1',
        book_id: 'book-1',
        book_title: 'Test Book',
        author: 'Test Author',
        source: 'manual',
        acquisition_source: null,
        deadline_type: null,
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      expect(getCurrentProgressFromDeadline(deadline)).toBe(0);
    });

    it('should return last progress entry current_progress', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test',
        progress: [
          {
            id: '1',
            deadline_id: 'test',
            current_progress: 50,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: '2',
            deadline_id: 'test',
            current_progress: 75,
            created_at: '2024-01-16T10:00:00Z',
            updated_at: '2024-01-16T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: '3',
            deadline_id: 'test',
            current_progress: 125,
            created_at: '2024-01-17T10:00:00Z',
            updated_at: '2024-01-17T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
        deadline_date: '2024-01-30',
        format: 'physical',
        total_quantity: 300,
        user_id: 'user-1',
        book_id: 'book-1',
        book_title: 'Test Book',
        author: 'Test Author',
        source: 'manual',
        acquisition_source: null,
        deadline_type: null,
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      expect(getCurrentProgressFromDeadline(deadline)).toBe(125);
    });

    it('should handle single progress entry', () => {
      const deadline: ReadingDeadlineWithProgress = {
        id: 'test',
        progress: [
          {
            id: '1',
            deadline_id: 'test',
            current_progress: 42,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ],
        deadline_date: '2024-01-30',
        format: 'physical',
        total_quantity: 300,
        user_id: 'user-1',
        book_id: 'book-1',
        book_title: 'Test Book',
        author: 'Test Author',
        source: 'manual',
        acquisition_source: null,
        deadline_type: null,
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
      };

      expect(getCurrentProgressFromDeadline(deadline)).toBe(42);
    });
  });

  describe('calculateDaysLeft', () => {
    it('should calculate days left correctly for future date', () => {
      // Current time is 2024-01-20T12:00:00Z
      const result = calculateDaysLeft('2024-01-25');
      expect(result).toBe(5); // 5 days from Jan 20 to Jan 25
    });

    it('should return 1 for past dates (minimum)', () => {
      // Current time is 2024-01-20T12:00:00Z
      const result = calculateDaysLeft('2024-01-15');
      expect(result).toBe(1); // Should be minimum 1 day
    });

    it('should return 1 for today', () => {
      // Current time is 2024-01-20T12:00:00Z
      const result = calculateDaysLeft('2024-01-20');
      expect(result).toBe(1); // Same day should return 1
    });

    it('should handle dates far in the future', () => {
      // Current time is 2024-01-20T12:00:00Z
      const result = calculateDaysLeft('2024-02-20');
      expect(result).toBe(31); // 31 days from Jan 20 to Feb 20
    });

    it('should handle leap year correctly', () => {
      jest.setSystemTime(new Date('2024-02-28T12:00:00Z'));
      const result = calculateDaysLeft('2024-03-01');
      expect(result).toBe(2); // 2024 is a leap year, so Feb has 29 days
    });

    it('should round up partial days', () => {
      jest.setSystemTime(new Date('2024-01-20T18:00:00Z')); // 6 PM
      const result = calculateDaysLeft('2024-01-21'); // Next day
      expect(result).toBe(1); // Should round up to 1 day
    });
  });

  describe('calculateDailyMinimum', () => {
    const mockDeadline: ReadingDeadlineWithProgress = {
      id: 'test',
      deadline_date: '2024-01-25', // 5 days from current time (2024-01-20)
      format: 'physical',
      total_quantity: 300,
      progress: [
        {
          id: '1',
          deadline_id: 'test',
          current_progress: 100,
          created_at: '2024-01-18T10:00:00Z',
          updated_at: '2024-01-18T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
      user_id: 'user-1',
      book_id: 'book-1',
      book_title: 'Test Book',
      author: 'Test Author',
      source: 'manual',
      acquisition_source: null,
      deadline_type: null,
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
    };

    it('should calculate daily minimum using current progress and days left', () => {
      mockCalculateRequiredPace.mockReturnValue(40);

      const result = calculateDailyMinimum(mockDeadline);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        100, // current progress (from last entry)
        5, // days left (Jan 25 - Jan 20)
        'physical' // format
      );
      expect(result).toBe(40);
    });

    it('should handle deadline with no progress', () => {
      const deadlineNoProgress = { ...mockDeadline, progress: [] };
      mockCalculateRequiredPace.mockReturnValue(60);

      const result = calculateDailyMinimum(deadlineNoProgress);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        0, // current progress (0 when no progress)
        5, // days left
        'physical' // format
      );
      expect(result).toBe(60);
    });

    it('should handle audio format', () => {
      const audioDeadline = { ...mockDeadline, format: 'audio' as const };
      mockCalculateRequiredPace.mockReturnValue(120); // minutes per day

      const result = calculateDailyMinimum(audioDeadline);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        100, // current progress
        5, // days left
        'audio' // format
      );
      expect(result).toBe(120);
    });

    it('should handle past deadline date (minimum 1 day)', () => {
      const pastDeadline = { ...mockDeadline, deadline_date: '2024-01-15' }; // 5 days ago
      mockCalculateRequiredPace.mockReturnValue(200); // Higher pace for urgent deadline

      const result = calculateDailyMinimum(pastDeadline);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        100, // current progress
        1, // minimum 1 day for past deadlines
        'physical' // format
      );
      expect(result).toBe(200);
    });

    it('should handle eBook format', () => {
      const eBookDeadline = { ...mockDeadline, format: 'eBook' as const };
      mockCalculateRequiredPace.mockReturnValue(35);

      const result = calculateDailyMinimum(eBookDeadline);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        100, // current progress
        5, // days left
        'eBook' // format
      );
      expect(result).toBe(35);
    });

    it('should handle deadline today', () => {
      const todayDeadline = { ...mockDeadline, deadline_date: '2024-01-20' }; // Today
      mockCalculateRequiredPace.mockReturnValue(200);

      const result = calculateDailyMinimum(todayDeadline);

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300, // total_quantity
        100, // current progress
        1, // minimum 1 day for today's deadline
        'physical' // format
      );
      expect(result).toBe(200);
    });
  });
});
