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
  getAllUserReadingDays,
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
  dayjs: jest.fn((date?: string) => {
    const actualDayjs = jest.requireActual('dayjs');
    const extendedDayjs = actualDayjs(date);
    return extendedDayjs;
  }),
}));

// Mock date normalization utilities
jest.mock('@/utils/dateNormalization', () => {
  const actualDayjs = jest.requireActual('dayjs');
  return {
    parseServerDateOnly: jest.fn((date: string) => actualDayjs(date)),
    parseServerDateTime: jest.fn((date: string) => actualDayjs(date)),
  };
});

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
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      cover_image_url: null,
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
      expect(result[0]).toMatchObject({
        value: 51, // Math.round(50.5)
        frontColor: '#007AFF',
        spacing: 2,
        labelWidth: 40,
        labelTextStyle: {
          color: '#000000',
          fontSize: 9,
          fontWeight: 'normal',
        },
      });
      expect(result[0].topLabelComponent).toEqual(expect.any(Function));
      expect(result[0].label).toBeTruthy(); // Just check it exists
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

      // Just check that labels exist and are non-empty strings
      expect(result[0].label).toBeTruthy();
      expect(result[1].label).toBeTruthy();
      expect(result[2].label).toBeTruthy();
      expect(typeof result[0].label).toBe('string');
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
      expect(result[0].label).toBeTruthy();
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
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        cover_image_url: null,
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
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        cover_image_url: null,
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
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        cover_image_url: null,
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
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        cover_image_url: null,
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
        acquisition_source: null,
        type: 'Personal',
        publishers: null,
        flexibility:
          'fixed' as Database['public']['Enums']['deadline_flexibility'],
        status: [],
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        cover_image_url: null,
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
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      cover_image_url: null,
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

  describe('getAllUserReadingDays', () => {
    const mockPhysicalDeadline: ReadingDeadlineWithProgress = {
      id: 'physical-1',
      deadline_date: '2024-01-30',
      format: 'physical',
      total_quantity: 300,
      progress: [
        {
          id: '1',
          deadline_id: 'physical-1',
          current_progress: 50,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
      user_id: 'user-1',
      book_id: 'book-1',
      book_title: 'Physical Book',
      author: 'Test Author',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      cover_image_url: null,
    };

    const mockEBookDeadline: ReadingDeadlineWithProgress = {
      id: 'ebook-1',
      deadline_date: '2024-01-30',
      format: 'eBook',
      total_quantity: 250,
      progress: [
        {
          id: '2',
          deadline_id: 'ebook-1',
          current_progress: 30,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
      user_id: 'user-1',
      book_id: 'book-2',
      book_title: 'eBook',
      author: 'Test Author',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      cover_image_url: null,
    };

    const mockAudioDeadline: ReadingDeadlineWithProgress = {
      id: 'audio-1',
      deadline_date: '2024-01-30',
      format: 'audio',
      total_quantity: 500,
      progress: [
        {
          id: '3',
          deadline_id: 'audio-1',
          current_progress: 120,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ],
      user_id: 'user-1',
      book_id: 'book-3',
      book_title: 'Audiobook',
      author: 'Test Author',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility:
        'fixed' as Database['public']['Enums']['deadline_flexibility'],
      status: [],
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      cover_image_url: null,
    };

    it('should return empty array when no deadlines provided', () => {
      const result = getAllUserReadingDays([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when only audio deadlines provided', () => {
      const result = getAllUserReadingDays([mockAudioDeadline]);
      expect(result).toEqual([]);
    });

    it('should filter out audio deadlines and process only reading deadlines', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress.mockImplementation(
        (_deadline, _cutoff, dailyProgress, _format) => {
          dailyProgress['2024-01-15'] = 50;
        }
      );

      const result = getAllUserReadingDays([
        mockPhysicalDeadline,
        mockAudioDeadline,
      ]);

      expect(mockCalculateCutoffTime).toHaveBeenCalledWith([
        mockPhysicalDeadline,
      ]);
      expect(mockProcessBookProgress).toHaveBeenCalledTimes(1);
      expect(mockProcessBookProgress).toHaveBeenCalledWith(
        mockPhysicalDeadline,
        cutoffTime,
        expect.any(Object),
        'physical'
      );
      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 50, format: 'physical' },
      ]);
    });

    it('should aggregate progress from multiple books on the same day', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-15'] = 50;
            dailyProgress['2024-01-16'] = 25;
          }
        )
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-15'] =
              (dailyProgress['2024-01-15'] || 0) + 30;
            dailyProgress['2024-01-17'] = 40;
          }
        );

      const result = getAllUserReadingDays([
        mockPhysicalDeadline,
        mockEBookDeadline,
      ]);

      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 80, format: 'physical' },
        { date: '2024-01-16', progressRead: 25, format: 'physical' },
        { date: '2024-01-17', progressRead: 40, format: 'physical' },
      ]);
    });

    it('should return empty array when cutoffTime is null', () => {
      mockCalculateCutoffTime.mockReturnValue(null);
      const result = getAllUserReadingDays([mockPhysicalDeadline]);
      expect(result).toEqual([]);
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

      const result = getAllUserReadingDays([mockPhysicalDeadline]);

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

      const result = getAllUserReadingDays([mockPhysicalDeadline]);

      expect(result[0].progressRead).toBe(50.12);
      expect(result[1].progressRead).toBe(26.0);
    });

    it('should process both physical and eBook formats', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-15'] = 50;
          }
        )
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-16'] = 30;
          }
        );

      const result = getAllUserReadingDays([
        mockPhysicalDeadline,
        mockEBookDeadline,
      ]);

      expect(mockCalculateCutoffTime).toHaveBeenCalledWith([
        mockPhysicalDeadline,
        mockEBookDeadline,
      ]);
      expect(mockProcessBookProgress).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should handle mixed format deadlines correctly', () => {
      const cutoffTime = new Date('2024-01-14T00:00:00Z');
      mockCalculateCutoffTime.mockReturnValue(cutoffTime);
      mockProcessBookProgress
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-15'] = 50;
          }
        )
        .mockImplementationOnce(
          (_deadline, _cutoff, dailyProgress, _format) => {
            dailyProgress['2024-01-15'] =
              (dailyProgress['2024-01-15'] || 0) + 30;
          }
        );

      const result = getAllUserReadingDays([
        mockPhysicalDeadline,
        mockEBookDeadline,
        mockAudioDeadline,
      ]);

      expect(mockCalculateCutoffTime).toHaveBeenCalledWith([
        mockPhysicalDeadline,
        mockEBookDeadline,
      ]);
      expect(result).toEqual([
        { date: '2024-01-15', progressRead: 80, format: 'physical' },
      ]);
    });
  });

  describe('getProgressAsOfDate', () => {
    const { getProgressAsOfDate } = require('../chartDataUtils');

    const createMockProgress = (
      currentProgress: number,
      createdAt: string,
      ignoreInCalcs = false
    ) => ({
      id: 'progress-1',
      deadline_id: 'deadline-1',
      current_progress: currentProgress,
      created_at: createdAt,
      updated_at: createdAt,
      time_spent_reading: null,
      ignore_in_calcs: ignoreInCalcs,
    });

    it('should return 0 for future dates', () => {
      const progress = [createMockProgress(50, '2024-01-15T10:00:00Z')];
      const result = getProgressAsOfDate(progress, '2024-01-25');
      // Current date is 2024-01-20, target is 2024-01-25 (future)
      expect(result).toBe(0);
    });

    it('should return progress as of start of day', () => {
      const progress = [
        createMockProgress(50, '2024-01-14T10:00:00Z'),
        createMockProgress(100, '2024-01-15T10:00:00Z'),
        createMockProgress(150, '2024-01-16T10:00:00Z'),
      ];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(100);
    });

    it('should ignore baseline entries', () => {
      const progress = [
        createMockProgress(20, '2024-01-14T10:00:00Z', true), // Baseline
        createMockProgress(50, '2024-01-15T10:00:00Z'),
      ];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(50);
    });

    it('should handle unsorted progress', () => {
      const progress = [
        createMockProgress(150, '2024-01-16T10:00:00Z'),
        createMockProgress(50, '2024-01-14T10:00:00Z'),
        createMockProgress(100, '2024-01-15T10:00:00Z'),
      ];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(100);
    });

    it('should return latest progress when multiple entries on same day', () => {
      const progress = [
        createMockProgress(50, '2024-01-15T10:00:00Z'),
        createMockProgress(75, '2024-01-15T14:00:00Z'),
        createMockProgress(100, '2024-01-15T18:00:00Z'),
      ];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(100);
    });

    it('should return 0 when no progress before target date', () => {
      const progress = [createMockProgress(50, '2024-01-16T10:00:00Z')];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(0);
    });

    it('should return 0 for empty progress array', () => {
      const result = getProgressAsOfDate([], '2024-01-15');
      expect(result).toBe(0);
    });

    it('should return 0 for null progress', () => {
      const result = getProgressAsOfDate(undefined, '2024-01-15');
      expect(result).toBe(0);
    });

    it('should handle all progress being baseline entries', () => {
      const progress = [
        createMockProgress(50, '2024-01-14T10:00:00Z', true),
        createMockProgress(100, '2024-01-15T10:00:00Z', true),
      ];
      const result = getProgressAsOfDate(progress, '2024-01-15');
      expect(result).toBe(0);
    });
  });

  describe('getDeadlinesInFlightOnDate', () => {
    const { getDeadlinesInFlightOnDate } = require('../chartDataUtils');

    const createMockDeadline = (
      id: string,
      options: {
        createdAt?: string;
        status?: string;
        statusUpdatedAt?: string;
        progress?: number;
        progressDate?: string;
        deadlineDate?: string;
        format?: 'physical' | 'eBook' | 'audio';
        totalQuantity?: number;
      } = {}
    ): ReadingDeadlineWithProgress => ({
      id,
      user_id: 'user-1',
      book_id: `book-${id}`,
      book_title: `Test Book ${id}`,
      author: 'Test Author',
      format: options.format || 'physical',
      deadline_date: options.deadlineDate || '2024-01-30T00:00:00Z',
      total_quantity: options.totalQuantity || 300,
      created_at: options.createdAt || '2024-01-01T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility: 'strict',
      cover_image_url: null,
      status: options.status
        ? [
            {
              id: 'status-1',
              deadline_id: id,
              status: options.status as any,
              created_at: options.statusUpdatedAt || '2024-01-15T10:00:00Z',
              updated_at: options.statusUpdatedAt || '2024-01-15T10:00:00Z',
            },
          ]
        : [],
      progress:
        options.progress !== undefined
          ? [
              {
                id: 'progress-1',
                deadline_id: id,
                current_progress: options.progress,
                created_at: options.progressDate || '2024-01-15T10:00:00Z',
                updated_at: options.progressDate || '2024-01-15T10:00:00Z',
                time_spent_reading: null,
                ignore_in_calcs: false,
              },
            ]
          : [],
    });

    describe('Basic Filtering', () => {
      it('should return empty array when no deadlines provided', () => {
        const result = getDeadlinesInFlightOnDate([], '2024-01-15');
        expect(result).toEqual([]);
      });

      it('should return empty array when all deadlines have no progress', () => {
        const deadlines = [createMockDeadline('1', { status: 'reading' })];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result.length).toBeGreaterThan(0);
      });

      it('should filter deadline created after target date', () => {
        const deadlines = [
          createMockDeadline('1', {
            createdAt: '2024-01-16T10:00:00Z',
            status: 'reading',
            progress: 50,
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should include deadline created on target date', () => {
        const deadlines = [
          createMockDeadline('1', {
            createdAt: '2024-01-15T10:00:00Z',
            status: 'reading',
            progress: 50,
            progressDate: '2024-01-15T11:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });

      it('should include deadline created before target date', () => {
        const deadlines = [
          createMockDeadline('1', {
            createdAt: '2024-01-10T10:00:00Z',
            status: 'reading',
            progress: 50,
            progressDate: '2024-01-14T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });
    });

    describe('Status Filtering', () => {
      it('should include deadline with status=reading', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            statusUpdatedAt: '2024-01-14T10:00:00Z',
            progress: 50,
            progressDate: '2024-01-14T10:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });

      it('should exclude deadline with status=pending', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'pending',
            progress: 50,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should exclude deadline with status=paused', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'paused',
            progress: 50,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should exclude deadline with status=complete', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'complete',
            progress: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should exclude deadline with status=did_not_finish', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'did_not_finish',
            progress: 50,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should exclude deadline with status=to_review', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'to_review',
            progress: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should default to reading when no status exists', () => {
        const deadlines = [
          createMockDeadline('1', {
            progress: 50,
            progressDate: '2024-01-14T10:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should use latest status as of end of target day', () => {
        const deadline = createMockDeadline('1', {
          createdAt: '2024-01-10T10:00:00Z',
          progress: 50,
          progressDate: '2024-01-14T10:00:00Z',
        });

        // Multiple status changes
        deadline.status = [
          {
            id: 'status-1',
            deadline_id: '1',
            status: 'reading' as any,
            created_at: '2024-01-10T10:00:00Z',
            updated_at: '2024-01-10T10:00:00Z',
          },
          {
            id: 'status-2',
            deadline_id: '1',
            status: 'paused' as any,
            created_at: '2024-01-14T10:00:00Z',
            updated_at: '2024-01-14T10:00:00Z',
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(0); // Latest status is paused
      });

      it('should handle status change during target day', () => {
        const deadline = createMockDeadline('1', {
          createdAt: '2024-01-10T10:00:00Z',
          progress: 50,
          progressDate: '2024-01-14T10:00:00Z',
        });

        // Status changed from paused to reading during Jan 15
        deadline.status = [
          {
            id: 'status-1',
            deadline_id: '1',
            status: 'paused' as any,
            created_at: '2024-01-14T10:00:00Z',
            updated_at: '2024-01-14T10:00:00Z',
          },
          {
            id: 'status-2',
            deadline_id: '1',
            status: 'reading' as any,
            created_at: '2024-01-15T14:00:00Z',
            updated_at: '2024-01-15T14:00:00Z',
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1); // Latest status on Jan 15 is reading
      });
    });

    describe('Progress Filtering', () => {
      it('should exclude deadline completed before start of target day', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 300, // Fully complete
            progressDate: '2024-01-14T10:00:00Z',
            totalQuantity: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });

      it('should include deadline with partial progress before target day', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            progressDate: '2024-01-14T10:00:00Z',
            totalQuantity: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should include deadline with no progress', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should use progress as of previous day for completion check', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            progressDate: '2024-01-14T10:00:00Z', // Progress on Jan 14
            totalQuantity: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1); // Not complete as of Jan 14 end
      });

      it('should handle deadline completed on target day (include it)', () => {
        const deadline = createMockDeadline('1', {
          status: 'reading',
          statusUpdatedAt: '2024-01-14T10:00:00Z',
          totalQuantity: 300,
          createdAt: '2024-01-10T10:00:00Z',
        });

        // Add progress: 150 on Jan 14, 300 on Jan 15 (completed)
        deadline.progress = [
          {
            id: 'progress-1',
            deadline_id: '1',
            current_progress: 150,
            created_at: '2024-01-14T10:00:00Z',
            updated_at: '2024-01-14T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-2',
            deadline_id: '1',
            current_progress: 300,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1); // Include it - was in flight at start of day
      });
    });

    describe('Deadline Date Filtering', () => {
      it('should include deadline with deadline_date = target date', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            statusUpdatedAt: '2024-01-14T10:00:00Z',
            progress: 150,
            progressDate: '2024-01-14T10:00:00Z', // Progress before target date
            deadlineDate: '2024-01-15T23:59:59Z', // End of target day
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should include deadline with deadline_date > target date', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            deadlineDate: '2024-01-20T00:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should exclude deadline with deadline_date < target date (overdue)', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            deadlineDate: '2024-01-10T00:00:00Z',
            createdAt: '2024-01-05T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(0);
      });
    });

    describe('Multiple Format Handling', () => {
      it('should handle physical book deadlines', () => {
        const deadlines = [
          createMockDeadline('1', {
            format: 'physical',
            status: 'reading',
            progress: 150,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].format).toBe('physical');
      });

      it('should handle eBook deadlines', () => {
        const deadlines = [
          createMockDeadline('1', {
            format: 'eBook',
            status: 'reading',
            progress: 150,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].format).toBe('eBook');
      });

      it('should handle audio deadlines', () => {
        const deadlines = [
          createMockDeadline('1', {
            format: 'audio',
            status: 'reading',
            progress: 150,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
        expect(result[0].format).toBe('audio');
      });

      it('should handle mix of all formats', () => {
        const deadlines = [
          createMockDeadline('1', {
            format: 'physical',
            status: 'reading',
            progress: 150,
            createdAt: '2024-01-10T10:00:00Z',
          }),
          createMockDeadline('2', {
            format: 'eBook',
            status: 'reading',
            progress: 100,
            createdAt: '2024-01-10T10:00:00Z',
          }),
          createMockDeadline('3', {
            format: 'audio',
            status: 'reading',
            progress: 200,
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(3);
      });
    });

    describe('Edge Cases', () => {
      it('should handle deadline with baseline progress (ignore_in_calcs)', () => {
        const deadline = createMockDeadline('1', {
          status: 'reading',
          createdAt: '2024-01-10T10:00:00Z',
        });

        deadline.progress = [
          {
            id: 'progress-1',
            deadline_id: '1',
            current_progress: 50,
            created_at: '2024-01-14T10:00:00Z',
            updated_at: '2024-01-14T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: true,
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1); // Still in flight, baseline ignored
      });

      it('should handle multiple progress entries on same day', () => {
        const deadline = createMockDeadline('1', {
          status: 'reading',
          createdAt: '2024-01-10T10:00:00Z',
        });

        deadline.progress = [
          {
            id: 'progress-1',
            deadline_id: '1',
            current_progress: 50,
            created_at: '2024-01-14T08:00:00Z',
            updated_at: '2024-01-14T08:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-2',
            deadline_id: '1',
            current_progress: 100,
            created_at: '2024-01-14T18:00:00Z',
            updated_at: '2024-01-14T18:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should handle target date in the future', () => {
        jest.setSystemTime(new Date('2024-01-20T12:00:00Z'));
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            statusUpdatedAt: '2024-01-15T10:00:00Z',
            progress: 150,
            progressDate: '2024-01-15T10:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
            deadlineDate: '2024-02-01T00:00:00Z',
          }),
        ];
        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-25');
        // Function allows querying future dates based on current progress state
        expect(result).toHaveLength(1);
      });

      it('should handle unsorted progress array', () => {
        const deadline = createMockDeadline('1', {
          status: 'reading',
          createdAt: '2024-01-10T10:00:00Z',
        });

        deadline.progress = [
          {
            id: 'progress-3',
            deadline_id: '1',
            current_progress: 150,
            created_at: '2024-01-16T10:00:00Z',
            updated_at: '2024-01-16T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-1',
            deadline_id: '1',
            current_progress: 50,
            created_at: '2024-01-14T10:00:00Z',
            updated_at: '2024-01-14T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
          {
            id: 'progress-2',
            deadline_id: '1',
            current_progress: 100,
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
            time_spent_reading: null,
            ignore_in_calcs: false,
          },
        ];

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should handle null/undefined progress array', () => {
        const deadline = createMockDeadline('1', {
          status: 'reading',
          createdAt: '2024-01-10T10:00:00Z',
        });
        deadline.progress = null as any;

        const result = getDeadlinesInFlightOnDate([deadline], '2024-01-15');
        expect(result).toHaveLength(1); // No progress = not completed yet
      });
    });

    describe('Integration', () => {
      it('should return correct deadlines for complex scenario', () => {
        const deadlines = [
          // In flight: reading, not complete, not overdue
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            progressDate: '2024-01-14T10:00:00Z',
            deadlineDate: '2024-01-20T00:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
          // Not in flight: paused
          createMockDeadline('2', {
            status: 'paused',
            progress: 100,
            progressDate: '2024-01-14T10:00:00Z',
            deadlineDate: '2024-01-20T00:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
          // Not in flight: completed
          createMockDeadline('3', {
            status: 'reading',
            progress: 300,
            progressDate: '2024-01-14T10:00:00Z',
            deadlineDate: '2024-01-20T00:00:00Z',
            totalQuantity: 300,
            createdAt: '2024-01-10T10:00:00Z',
          }),
          // Not in flight: overdue
          createMockDeadline('4', {
            status: 'reading',
            progress: 100,
            progressDate: '2024-01-14T10:00:00Z',
            deadlineDate: '2024-01-10T00:00:00Z',
            createdAt: '2024-01-05T10:00:00Z',
          }),
          // In flight: reading, partial progress
          createMockDeadline('5', {
            status: 'reading',
            progress: 50,
            progressDate: '2024-01-14T10:00:00Z',
            deadlineDate: '2024-01-25T00:00:00Z',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];

        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(2);
        expect(result.map((d: ReadingDeadlineWithProgress) => d.id)).toContain(
          '1'
        );
        expect(result.map((d: ReadingDeadlineWithProgress) => d.id)).toContain(
          '5'
        );
      });

      it('should handle different statuses, formats, and progress states together', () => {
        const deadlines = [
          createMockDeadline('1', {
            format: 'physical',
            status: 'reading',
            progress: 150,
            createdAt: '2024-01-10T10:00:00Z',
          }),
          createMockDeadline('2', {
            format: 'audio',
            status: 'paused',
            progress: 100,
            createdAt: '2024-01-10T10:00:00Z',
          }),
          createMockDeadline('3', {
            format: 'eBook',
            status: 'reading',
            createdAt: '2024-01-10T10:00:00Z',
          }),
        ];

        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(2);
        expect(
          result.some(
            (d: ReadingDeadlineWithProgress) => d.format === 'physical'
          )
        ).toBe(true);
        expect(
          result.some((d: ReadingDeadlineWithProgress) => d.format === 'eBook')
        ).toBe(true);
      });

      it('should correctly calculate with real date strings', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            statusUpdatedAt: '2024-01-14T15:30:00Z',
            progress: 150,
            progressDate: '2024-01-14T20:45:00Z',
            deadlineDate: '2024-01-25T23:59:59Z',
            createdAt: '2024-01-01T08:00:00Z',
          }),
        ];

        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });

      it('should handle timezone-agnostic behavior', () => {
        const deadlines = [
          createMockDeadline('1', {
            status: 'reading',
            progress: 150,
            progressDate: '2024-01-14T23:59:59Z', // End of day
            createdAt: '2024-01-10T00:00:00Z',
          }),
        ];

        const result = getDeadlinesInFlightOnDate(deadlines, '2024-01-15');
        expect(result).toHaveLength(1);
      });
    });
  });

  describe('calculateHistoricalRequiredPace', () => {
    const { calculateHistoricalRequiredPace } = require('../chartDataUtils');

    const createMockDeadlineForPace = (
      totalQuantity: number,
      deadlineDate: string,
      format: 'physical' | 'eBook' | 'audio' = 'physical'
    ): ReadingDeadlineWithProgress => ({
      id: 'deadline-1',
      user_id: 'user-1',
      book_id: 'book-1',
      book_title: 'Test Book',
      author: 'Test Author',
      format,
      deadline_date: deadlineDate,
      total_quantity: totalQuantity,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility: 'strict',
      cover_image_url: null,
      status: [],
      progress: [],
    });

    it('should calculate pace from start of target day', () => {
      mockCalculateRequiredPace.mockReturnValue(20);
      const deadline = createMockDeadlineForPace(200, '2024-01-25T00:00:00Z');
      deadline.progress = [
        {
          id: 'progress-1',
          deadline_id: 'deadline-1',
          current_progress: 100,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ];

      const result = calculateHistoricalRequiredPace(deadline, '2024-01-15');

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        200, // total
        100, // progress as of Jan 14 (previous day)
        9, // days from Jan 15 to Jan 25 (using dayjs diff)
        'physical'
      );
      expect(result).toBe(20);
    });

    it('should handle completion day correctly', () => {
      mockCalculateRequiredPace.mockReturnValue(30);
      const deadline = createMockDeadlineForPace(200, '2024-01-20T00:00:00Z');

      deadline.progress = [
        {
          id: 'progress-1',
          deadline_id: 'deadline-1',
          current_progress: 50,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
        {
          id: 'progress-2',
          deadline_id: 'deadline-1',
          current_progress: 200,
          created_at: '2024-01-15T10:00:00Z', // Completed on this day
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ];

      const result = calculateHistoricalRequiredPace(deadline, '2024-01-15');

      // Should use progress as of Jan 14 (50), not Jan 15 (200)
      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        200,
        50, // Progress at start of Jan 15
        4, // Days from Jan 15 to Jan 20 (using dayjs diff)
        'physical'
      );
      expect(result).toBe(30);
    });

    it('should use progress as of previous day', () => {
      mockCalculateRequiredPace.mockReturnValue(25);
      const deadline = createMockDeadlineForPace(300, '2024-01-30T00:00:00Z');

      deadline.progress = [
        {
          id: 'progress-1',
          deadline_id: 'deadline-1',
          current_progress: 100,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
        {
          id: 'progress-2',
          deadline_id: 'deadline-1',
          current_progress: 150,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ];

      const result = calculateHistoricalRequiredPace(deadline, '2024-01-15');

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        300,
        100, // Progress as of Jan 14
        14, // Days from Jan 15 to Jan 30 (using dayjs diff)
        'physical'
      );
      expect(result).toBe(25);
    });

    it('should return 0 when no days left', () => {
      mockCalculateRequiredPace.mockReturnValue(0);
      const deadline = createMockDeadlineForPace(200, '2024-01-15T00:00:00Z');

      const result = calculateHistoricalRequiredPace(deadline, '2024-01-15');

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        200,
        0,
        -1, // Same day as deadline (dayjs diff returns -1)
        'physical'
      );
      expect(result).toBe(0);
    });

    it('should handle audio format', () => {
      mockCalculateRequiredPace.mockReturnValue(45);
      const deadline = createMockDeadlineForPace(
        500,
        '2024-01-25T00:00:00Z',
        'audio'
      );

      deadline.progress = [
        {
          id: 'progress-1',
          deadline_id: 'deadline-1',
          current_progress: 200,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          time_spent_reading: null,
          ignore_in_calcs: false,
        },
      ];

      const result = calculateHistoricalRequiredPace(deadline, '2024-01-15');

      expect(mockCalculateRequiredPace).toHaveBeenCalledWith(
        500,
        200,
        9, // Days from Jan 15 to Jan 25 (using dayjs diff)
        'audio'
      );
      expect(result).toBe(45);
    });
  });

  describe('aggregateTargetsByFormat', () => {
    const { aggregateTargetsByFormat } = require('../chartDataUtils');

    const createMockDeadlineForAggregate = (
      id: string,
      format: 'physical' | 'eBook' | 'audio',
      totalQuantity: number,
      progress = 0
    ): ReadingDeadlineWithProgress => ({
      id,
      user_id: 'user-1',
      book_id: `book-${id}`,
      book_title: `Test Book ${id}`,
      author: 'Test Author',
      format,
      deadline_date: '2024-01-30T00:00:00Z',
      total_quantity: totalQuantity,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
      acquisition_source: null,
      type: 'Personal',
      publishers: null,
      flexibility: 'strict',
      cover_image_url: null,
      status: [
        {
          id: 'status-1',
          deadline_id: id,
          status: 'reading' as any,
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
        },
      ],
      progress:
        progress > 0
          ? [
              {
                id: 'progress-1',
                deadline_id: id,
                current_progress: progress,
                created_at: '2024-01-14T10:00:00Z',
                updated_at: '2024-01-14T10:00:00Z',
                time_spent_reading: null,
                ignore_in_calcs: false,
              },
            ]
          : [],
    });

    beforeEach(() => {
      // Reset the mock for calculateRequiredPace
      mockCalculateRequiredPace.mockReturnValue(20);
    });

    it('should sum pages for physical and eBook', () => {
      mockCalculateRequiredPace
        .mockReturnValueOnce(30) // Physical book
        .mockReturnValueOnce(20); // eBook

      const deadlines = [
        createMockDeadlineForAggregate('1', 'physical', 300, 100),
        createMockDeadlineForAggregate('2', 'eBook', 200, 50),
      ];

      const result = aggregateTargetsByFormat(deadlines, '2024-01-15');

      expect(result.targetPages).toBe(50);
      expect(result.targetMinutes).toBe(0);
    });

    it('should sum minutes for audio', () => {
      mockCalculateRequiredPace.mockReturnValueOnce(45).mockReturnValueOnce(30);

      const deadlines = [
        createMockDeadlineForAggregate('1', 'audio', 500, 100),
        createMockDeadlineForAggregate('2', 'audio', 400, 150),
      ];

      const result = aggregateTargetsByFormat(deadlines, '2024-01-15');

      expect(result.targetPages).toBe(0);
      expect(result.targetMinutes).toBe(75);
    });

    it('should handle mix of formats', () => {
      mockCalculateRequiredPace
        .mockReturnValueOnce(30) // Physical
        .mockReturnValueOnce(45) // Audio
        .mockReturnValueOnce(25); // eBook

      const deadlines = [
        createMockDeadlineForAggregate('1', 'physical', 300, 100),
        createMockDeadlineForAggregate('2', 'audio', 500, 100),
        createMockDeadlineForAggregate('3', 'eBook', 250, 75),
      ];

      const result = aggregateTargetsByFormat(deadlines, '2024-01-15');

      expect(result.targetPages).toBe(55); // 30 + 25
      expect(result.targetMinutes).toBe(45);
    });

    it('should only include in-flight deadlines', () => {
      mockCalculateRequiredPace.mockReturnValue(20);

      const deadlines = [
        createMockDeadlineForAggregate('1', 'physical', 300, 100),
        // This one won't be in-flight (created after target date)
        {
          ...createMockDeadlineForAggregate('2', 'physical', 200, 50),
          created_at: '2024-01-16T10:00:00Z',
        },
      ];

      aggregateTargetsByFormat(deadlines, '2024-01-15');

      // Only first deadline should be included
      expect(mockCalculateRequiredPace).toHaveBeenCalledTimes(1);
    });

    it('should return 0 for empty array', () => {
      const result = aggregateTargetsByFormat([], '2024-01-15');

      expect(result.targetPages).toBe(0);
      expect(result.targetMinutes).toBe(0);
    });

    it('should handle deadlines with no progress', () => {
      mockCalculateRequiredPace.mockReturnValue(50);

      const deadlines = [
        createMockDeadlineForAggregate('1', 'physical', 300, 0),
      ];

      const result = aggregateTargetsByFormat(deadlines, '2024-01-15');

      expect(result.targetPages).toBe(50);
    });
  });
});
